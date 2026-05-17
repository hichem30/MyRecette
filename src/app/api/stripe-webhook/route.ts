import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface StockItem {
  product_id: string;
  quantity: number;
}

export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    // Async variant uses Web Crypto (SubtleCrypto) — required for
    // Cloudflare Workers where Node's `crypto` is not available.
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad sig";
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = getSupabaseAdminClient();
    if (!admin) {
      console.error(
        "[stripe-webhook] SUPABASE_SERVICE_ROLE_KEY not set — cannot write order",
        { session_id: session.id },
      );
      // Return 200 so Stripe doesn't retry forever, but flag the problem.
      return NextResponse.json(
        { received: true, warning: "Supabase admin client unavailable; order not saved." },
        { status: 200 },
      );
    }
    {
      // Decode our internal product IDs from session metadata (set when we
      // created the checkout session). Same order as Stripe's line_items.
      let metaItems: StockItem[] = [];
      const raw = session.metadata?.items;
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            metaItems = parsed.filter(
              (x): x is StockItem =>
                typeof x === "object" &&
                x !== null &&
                typeof (x as StockItem).product_id === "string" &&
                typeof (x as StockItem).quantity === "number",
            );
          }
        } catch {
          /* malformed metadata — skip silently */
        }
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const items = lineItems.data.map((li, idx) => ({
        product_id: metaItems[idx]?.product_id,
        product_name: li.description ?? li.price?.nickname ?? "Product",
        quantity: li.quantity ?? 1,
        unit_amount: (li.amount_total ?? 0) / (li.quantity ?? 1),
      }));

      // Idempotency: orders.stripe_session_id is UNIQUE. If we've already
      // processed this session (Stripe sometimes retries webhooks), the
      // insert returns an error and we skip the stock decrement.
      // Normalise the email to lowercase so the customer-facing query
      // (`orders.customer_email = auth.users.email`) matches reliably.
      const rawEmail =
        session.customer_details?.email ?? session.customer_email ?? null;
      const customerEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;

      // Extract the shipping address the customer entered at Stripe Checkout.
      // In Stripe API 2024-12+, shipping is at `collected_information.shipping_details`.
      const shipping = session.collected_information?.shipping_details ?? null;
      const shippingName = shipping?.name ?? null;
      const shippingAddress = shipping?.address
        ? {
            line1: shipping.address.line1 ?? null,
            line2: shipping.address.line2 ?? null,
            city: shipping.address.city ?? null,
            state: shipping.address.state ?? null,
            postal_code: shipping.address.postal_code ?? null,
            country: shipping.address.country ?? null,
          }
        : null;
      const customerPhone = session.customer_details?.phone ?? null;

      const { data: inserted, error: insertErr } = await admin
        .from("orders")
        .insert({
          stripe_session_id: session.id,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_name: shippingName,
          shipping_address: shippingAddress,
          total_amount: (session.amount_total ?? 0) / 100,
          line_items: items,
          status: "paid",
        })
        .select("id")
        .single();

      if (insertErr) {
        // 23505 = unique_violation (duplicate stripe_session_id, idempotent retry — fine).
        const isDuplicate =
          (insertErr as { code?: string }).code === "23505" ||
          insertErr.message?.includes("duplicate key");
        if (!isDuplicate) {
          console.error(
            "[stripe-webhook] failed to insert order",
            { session_id: session.id, error: insertErr.message, details: insertErr },
          );
          return NextResponse.json(
            { received: true, error: `order insert failed: ${insertErr.message}` },
            { status: 200 },
          );
        }
      }

      // Only decrement stock if the order was *newly* inserted.
      if (inserted && !insertErr && metaItems.length > 0) {
        const { error: rpcErr } = await admin.rpc("decrement_product_stock", {
          items: metaItems,
        });
        if (rpcErr) {
          // Log but do not fail the webhook — the order is already saved.
          console.error("[stripe-webhook] decrement_product_stock failed:", rpcErr.message);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
