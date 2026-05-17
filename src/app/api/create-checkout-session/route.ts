import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripeClient } from "@/lib/stripe/server";
import { getAllProducts } from "@/lib/data";
import { getSupabaseAdminClient, getSupabaseRouteClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(50),
  locale: z.enum(["en", "es"]).default("en"),
  promo_code: z.string().trim().optional(),
  ship_state: z.string().trim().length(2).optional(),
  ship_city: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY (sk_test_... for testing, sk_live_... for real payments) to your .env.local file. See README.md for the full Stripe setup guide.",
      },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // -------------------------------------------------------------------
  // Delivery zone check — block out-of-zone addresses up front.
  // -------------------------------------------------------------------
  if (admin && parsed.ship_state) {
    const { data: zones } = await admin
      .from("delivery_zones")
      .select("state_code, city");
    const list = (zones ?? []) as Array<{ state_code: string; city: string | null }>;
    if (list.length > 0) {
      const wantState = parsed.ship_state.toUpperCase();
      const wantCity = (parsed.ship_city ?? "").trim().toLowerCase();
      const ok = list.some((z) => {
        if (z.state_code !== wantState) return false;
        if (!z.city) return true; // entire state allowed
        return z.city.trim().toLowerCase() === wantCity;
      });
      if (!ok) {
        return NextResponse.json(
          {
            error:
              parsed.locale === "es"
                ? "Lo sentimos — no entregamos a esa dirección todavía."
                : "Sorry — we don't deliver to that address yet.",
            zones: list,
          },
          { status: 409 },
        );
      }
    }
  }

  // SECURITY: always look up the canonical price/name/image from the database.
  const catalog = await getAllProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      product_data: {
        name: string;
        images?: string[];
        metadata: { product_id: string };
      };
      unit_amount: number;
    };
  }> = [];
  const stockDecrement: Array<{ product_id: string; quantity: number }> = [];
  let subtotalCents = 0;

  for (const item of parsed.items) {
    const product = byId.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.product_id}` },
        { status: 400 },
      );
    }
    if (product.stock <= 0) {
      return NextResponse.json(
        {
          error: `"${product.name[parsed.locale] ?? product.name.en}" is out of stock.`,
          product_id: product.id,
          stock: 0,
        },
        { status: 409 },
      );
    }
    if (item.quantity > product.stock) {
      return NextResponse.json(
        {
          error: `Only ${product.stock} of "${product.name[parsed.locale] ?? product.name.en}" available.`,
          product_id: product.id,
          stock: product.stock,
        },
        { status: 409 },
      );
    }

    const unitCents = Math.round(Number(product.price) * 100);
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name[parsed.locale] ?? product.name.en,
          images: product.image_url ? [product.image_url] : undefined,
          metadata: { product_id: product.id },
        },
        unit_amount: unitCents,
      },
    });
    stockDecrement.push({ product_id: product.id, quantity: item.quantity });
    subtotalCents += unitCents * item.quantity;
  }

  // -------------------------------------------------------------------
  // Promo code — validate, build a Stripe coupon, mark as consumed.
  // -------------------------------------------------------------------
  const discounts: Array<{ coupon: string }> = [];
  let promoApplied: { code: string; coupon_id: string } | null = null;
  if (parsed.promo_code && admin) {
    const { data: rows } = await admin.rpc("validate_promo_code", { p_code: parsed.promo_code });
    type PromoCheck = {
      code: string;
      discount_type: "percent" | "amount";
      discount_value: number;
      valid: boolean;
      reason: string;
    };
    const promo = Array.isArray(rows) ? (rows[0] as PromoCheck | undefined) : undefined;
    if (!promo || !promo.valid) {
      const reason = promo?.reason ?? "NOT_FOUND";
      const msg =
        parsed.locale === "es"
          ? {
              NOT_FOUND: "Código no válido.",
              INACTIVE: "Este código está deshabilitado.",
              NOT_YET: "Este código aún no es válido.",
              EXPIRED: "Este código ha expirado.",
              EXHAUSTED: "Este código ya alcanzó su límite de usos.",
            }[reason] ?? "Código no válido."
          : {
              NOT_FOUND: "Promo code not found.",
              INACTIVE: "This code is disabled.",
              NOT_YET: "This code is not yet valid.",
              EXPIRED: "This code has expired.",
              EXHAUSTED: "This code has reached its usage limit.",
            }[reason] ?? "Promo code not valid.";
      return NextResponse.json({ error: msg, promo_reason: reason }, { status: 400 });
    }
    // Build an ephemeral Stripe coupon for this checkout.
    try {
      const coupon = await stripe.coupons.create(
        promo.discount_type === "percent"
          ? { percent_off: Number(promo.discount_value), duration: "once", name: promo.code }
          : { amount_off: Math.round(Number(promo.discount_value) * 100), currency: "usd", duration: "once", name: promo.code },
      );
      discounts.push({ coupon: coupon.id });
      promoApplied = { code: promo.code, coupon_id: coupon.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "could not apply promo";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // -------------------------------------------------------------------
  // Free shipping: if every item has free_shipping=true, advertise as free
  // (we don't currently charge shipping otherwise either, but the flag is
  // preserved in stock metadata for future shipping rates).
  // -------------------------------------------------------------------

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // If the visitor is signed in, pin their auth email to the Stripe session
  // so the order saved by the webhook matches their account exactly (and
  // shows up in their /account/orders history).
  let signedInEmail: string | null = null;
  try {
    const supabase = await getSupabaseRouteClient();
    const { data } = await supabase.auth.getUser();
    signedInEmail = data.user?.email ?? null;
  } catch {
    /* anon checkout — Stripe will ask for the email itself */
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      automatic_tax: { enabled: false },
      shipping_address_collection: { allowed_countries: ["US"] },
      // If we already applied an internal promo, suppress Stripe's own promo box
      // so the customer can't stack discounts.
      allow_promotion_codes: discounts.length === 0,
      discounts: discounts.length > 0 ? discounts : undefined,
      locale: parsed.locale === "es" ? "es" : "en",
      ...(signedInEmail ? { customer_email: signedInEmail } : {}),
      success_url: `${origin}/${parsed.locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${parsed.locale}/checkout/cancel`,
      metadata: {
        source: "redbarn-storefront",
        items: JSON.stringify(stockDecrement),
        ...(promoApplied ? { promo_code: promoApplied.code } : {}),
        ...(signedInEmail ? { user_email: signedInEmail } : {}),
      },
    });

    // Atomically bump promo uses_count. If this fails the order still goes
    // through — we'd rather slightly over-allow a code than block checkout.
    if (promoApplied && admin) {
      const { error: rpcErr } = await admin.rpc("consume_promo_code", { p_code: promoApplied.code });
      if (rpcErr) {
        console.error("[checkout] consume_promo_code failed:", rpcErr.message);
      }
    }

    return NextResponse.json({ url: session.url, subtotal_cents: subtotalCents });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
