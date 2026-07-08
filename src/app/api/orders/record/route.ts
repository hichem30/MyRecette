import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

interface StockItem {
  product_id: string;
  quantity: number;
}

interface OrderDiagnostics {
  ok: boolean;
  session_id?: string;
  step: string;
  payment_status?: string;
  customer_email?: string | null;
  order_id?: string;
  already_recorded?: boolean;
  reason?: string;
  detail?: string;
}

/**
 * Records a paid Stripe Checkout session as an order row in Supabase.
 * Idempotent on stripe_session_id (the column has a UNIQUE index).
 *
 * Called from the /checkout/success page client-side after Stripe redirects
 * the customer back. Runs in its own request with a fresh worker CPU budget
 * so it isn't competing with the page render itself.
 *
 * Returns a verbose `OrderDiagnostics` object so the UI can show exactly
 * which step failed if anything goes wrong (without forcing the user to
 * dig through Cloudflare worker logs).
 */
export async function POST(req: Request): Promise<NextResponse<OrderDiagnostics>> {
  let body: { session_id?: string };
  try {
    body = (await req.json()) as { session_id?: string };
  } catch {
    return NextResponse.json(
      { ok: false, step: "parse_body", reason: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const sessionId = body.session_id?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, step: "validate_input", reason: "MISSING_SESSION_ID" },
      { status: 400 },
    );
  }

  // Sanity-check environment up front so the UI can surface a clear cause.
  if (!isSupabaseAdminConfigured()) {
    console.error("[orders/record] missing SUPABASE_SERVICE_ROLE_KEY for", sessionId);
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "supabase_admin",
        reason: "SUPABASE_SERVICE_ROLE_KEY_MISSING",
        detail:
          "Add SUPABASE_SERVICE_ROLE_KEY as a Cloudflare worker secret so orders can be written under the service role.",
      },
      { status: 200 },
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error("[orders/record] no stripe client for", sessionId);
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "stripe_client",
        reason: "STRIPE_SECRET_KEY_MISSING",
        detail:
          "Add STRIPE_SECRET_KEY (sk_live_… or sk_test_…) as a Cloudflare worker secret.",
      },
      { status: 200 },
    );
  }

  // Step 1: fetch the checkout session from Stripe.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error("[orders/record] stripe.retrieve failed:", sessionId, detail);
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "stripe_retrieve",
        reason: "STRIPE_RETRIEVE_FAILED",
        detail,
      },
      { status: 200 },
    );
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "payment_check",
        payment_status: session.payment_status,
        reason: "SESSION_NOT_PAID",
      },
      { status: 200 },
    );
  }

  const rawEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const email = rawEmail ? rawEmail.trim().toLowerCase() : null;

  // Step 2: see if the order is already saved (webhook may have raced us).
  const admin = await getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "supabase_admin",
        reason: "ADMIN_CLIENT_NULL",
      },
      { status: 200 },
    );
  }

  const { data: existing, error: lookupErr } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (lookupErr) {
    console.error("[orders/record] supabase lookup failed:", sessionId, lookupErr.message);
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "db_lookup",
        reason: "DB_LOOKUP_FAILED",
        detail: lookupErr.message,
      },
      { status: 200 },
    );
  }
  if (existing) {
    return NextResponse.json({
      ok: true,
      session_id: sessionId,
      step: "already_recorded",
      already_recorded: true,
      customer_email: email,
      order_id: existing.id,
    });
  }

  // Step 3: build the line items from Stripe + our session metadata, then insert.
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

  let lineItemRows: Stripe.ApiList<Stripe.LineItem>;
  try {
    lineItemRows = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error("[orders/record] listLineItems failed:", sessionId, detail);
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "stripe_line_items",
        reason: "LIST_LINE_ITEMS_FAILED",
        detail,
      },
      { status: 200 },
    );
  }

  const items = lineItemRows.data.map((li, idx) => ({
    product_id: metaItems[idx]?.product_id,
    product_name: li.description ?? li.price?.nickname ?? "Product",
    quantity: li.quantity ?? 1,
    unit_amount: (li.amount_total ?? 0) / (li.quantity ?? 1),
  }));

  // Stripe Checkout's shipping_address_collection puts the address on
  // session.collected_information.shipping_details (API 2024-12+).
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
      stripe_session_id: sessionId,
      customer_email: email,
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
    const isDuplicate =
      (insertErr as { code?: string }).code === "23505" ||
      insertErr.message?.includes("duplicate key");
    if (isDuplicate) {
      const { data: dup } = await admin
        .from("orders")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      return NextResponse.json({
        ok: true,
        session_id: sessionId,
        step: "duplicate_recovered",
        already_recorded: true,
        customer_email: email,
        order_id: dup?.id,
      });
    }
    console.error("[orders/record] insert failed:", {
      session_id: sessionId,
      email,
      code: (insertErr as { code?: string }).code,
      message: insertErr.message,
    });
    return NextResponse.json(
      {
        ok: false,
        session_id: sessionId,
        step: "db_insert",
        reason: "DB_INSERT_FAILED",
        detail: insertErr.message,
        customer_email: email,
      },
      { status: 200 },
    );
  }

  // Step 4: decrement stock (non-fatal if it fails — order is already saved).
  if (metaItems.length > 0) {
    const { error: stockErr } = await admin.rpc("decrement_product_stock", { items: metaItems });
    if (stockErr) {
      console.error("[orders/record] decrement_product_stock failed:", stockErr.message);
    }
  }

  return NextResponse.json({
    ok: true,
    session_id: sessionId,
    step: "recorded",
    customer_email: email,
    order_id: inserted?.id,
  });
}
