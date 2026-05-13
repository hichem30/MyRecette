import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

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
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad sig";
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const items = lineItems.data.map((li) => ({
        product_name: li.description ?? li.price?.nickname ?? "Product",
        quantity: li.quantity ?? 1,
        unit_amount: (li.amount_total ?? 0) / (li.quantity ?? 1),
      }));
      await admin.from("orders").insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email ?? null,
        total_amount: (session.amount_total ?? 0) / 100,
        line_items: items,
        status: "paid",
      });
    }
  }

  return NextResponse.json({ received: true });
}
