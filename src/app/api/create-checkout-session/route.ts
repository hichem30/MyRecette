import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripeClient } from "@/lib/stripe/server";
import { getAllProducts } from "@/lib/data";

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

  // SECURITY: always look up the canonical price/name/image from the database
  // (or trusted mock data). Never trust client-provided prices — a malicious
  // user could otherwise post `price: 0.01` and buy a $1000 item for a penny.
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

  for (const item of parsed.items) {
    const product = byId.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.product_id}` },
        { status: 400 },
      );
    }
    // SECURITY: also enforce stock at checkout creation. The cart UI tries to
    // prevent over-purchase but a malicious client can bypass it. We block
    // here so the customer can never buy more than is actually in stock.
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

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name[parsed.locale] ?? product.name.en,
          images: product.image_url ? [product.image_url] : undefined,
          metadata: { product_id: product.id },
        },
        unit_amount: Math.round(Number(product.price) * 100),
      },
    });
    stockDecrement.push({ product_id: product.id, quantity: item.quantity });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      automatic_tax: { enabled: false },
      shipping_address_collection: { allowed_countries: ["US", "CA", "MX"] },
      allow_promotion_codes: true,
      locale: parsed.locale === "es" ? "es" : "en",
      success_url: `${origin}/${parsed.locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${parsed.locale}/checkout/cancel`,
      metadata: {
        source: "redbarn-storefront",
        // Pass the verified items so the webhook can decrement stock without
        // re-querying Stripe (also lets us tie back to our internal product IDs).
        items: JSON.stringify(stockDecrement),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
