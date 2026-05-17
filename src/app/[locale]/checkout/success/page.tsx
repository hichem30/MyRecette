import { CheckCircle2 } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type Stripe from "stripe";
import { Link } from "@/lib/i18n/navigation";
import { CartClearOnMount } from "@/components/CartClearOnMount";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface StockItem {
  product_id: string;
  quantity: number;
}

/**
 * Safety net for missed webhooks: if the Stripe webhook hasn't reached us
 * yet (e.g. wrong secret, transient network), but the customer landed on
 * /checkout/success after a real successful payment, we still want their
 * order to appear in /account/orders. So we look up the session ourselves
 * and upsert into the DB (idempotent via the unique stripe_session_id).
 */
async function ensureOrderRecorded(sessionId: string | undefined): Promise<string | null> {
  if (!sessionId) return null;
  const stripe = getStripeClient();
  if (!stripe) return null;
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }

  if (session.payment_status !== "paid") {
    return session.customer_details?.email ?? session.customer_email ?? null;
  }

  const rawEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
  const admin = getSupabaseAdminClient();
  if (!admin) return email;

  try {
    const { data: existing } = await admin
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (existing) return email;

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

    await admin.from("orders").insert({
      stripe_session_id: session.id,
      customer_email: email,
      total_amount: (session.amount_total ?? 0) / 100,
      line_items: items,
      status: "paid",
    });

    if (metaItems.length > 0) {
      await admin.rpc("decrement_product_stock", { items: metaItems });
    }
  } catch (err) {
    console.error("[checkout/success] failed to back-fill order:", err);
  }
  return email;
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const email =
    (sp.email && sp.email.includes("@") ? sp.email : null) ??
    (await ensureOrderRecorded(sp.session_id)) ??
    (locale === "en" ? "your inbox" : "su correo");
  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <CartClearOnMount />
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("success")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {t("successBody", { email })}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:border-barn-600 hover:text-barn-700"
        >
          {locale === "en" ? "View my orders" : "Ver mis pedidos"}
        </Link>
        <Link
          href="/products"
          className="rounded-md bg-barn-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-barn-700"
        >
          {locale === "en" ? "Continue Shopping" : "Seguir Comprando"}
        </Link>
      </div>
    </section>
  );
}
