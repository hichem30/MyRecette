"use client";

import { Mail, Megaphone, Package2, Tag, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mockProducts } from "@/lib/data/mock-data";
import type { Bundle, Product, PromoCode } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://shop.redbarnmarket.workers.dev";

export default function AdminCampaignsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(new Set());
  const [selectedPromoIds, setSelectedPromoIds] = useState<Set<string>>(new Set());
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<"discount" | "all">("discount");
  const [subject, setSubject] = useState("New deals from Red Barn Western Market");
  const [intro, setIntro] = useState(
    "Hi there! Here are some fresh deals at Red Barn Western Market — stop by the yard or order online.",
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    const nowIso = new Date().toISOString();
    Promise.all([
      sb
        .from("products")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false }),
      sb
        .from("bundles")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("created_at", { ascending: false }),
      sb
        .from("promo_codes")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("created_at", { ascending: false }),
      sb.rpc("admin_subscriber_emails"),
    ]).then(([prodRes, bundleRes, promoRes, subRes]) => {
      setProducts((prodRes.data as Product[]) ?? []);
      setBundles((bundleRes.data as Bundle[]) ?? []);
      const liveCodes = ((promoRes.data as PromoCode[]) ?? []).filter(
        (c) => c.max_uses == null || c.uses_count < c.max_uses,
      );
      setPromos(liveCodes);
      const emails = ((subRes.data as Array<{ email: string }>) ?? [])
        .map((r) => r.email)
        .filter((e): e is string => !!e);
      setSubscribers(emails);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(
    () =>
      productFilter === "discount"
        ? products.filter((p) => p.discount)
        : products,
    [products, productFilter],
  );

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.has(p.id)),
    [products, selectedProductIds],
  );
  const selectedBundles = useMemo(
    () => bundles.filter((b) => selectedBundleIds.has(b.id)),
    [bundles, selectedBundleIds],
  );
  const selectedPromos = useMemo(
    () => promos.filter((c) => selectedPromoIds.has(c.id)),
    [promos, selectedPromoIds],
  );

  function toggleSet(
    setState: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildBody() {
    const lines = [intro, ""];
    if (selectedProducts.length > 0) {
      lines.push("— ON SALE NOW —");
      for (const p of selectedProducts) {
        const link = `${SITE_URL}/en/products/${p.slug}`;
        const wasNow =
          p.original_price && p.original_price > p.price
            ? ` — was $${p.original_price.toFixed(2)}, now $${p.price.toFixed(2)}`
            : ` — $${p.price.toFixed(2)}`;
        lines.push(`• ${p.name.en}${wasNow}`);
        lines.push(`  ${link}`);
        lines.push("");
      }
    }
    if (selectedBundles.length > 0) {
      lines.push("— BUNDLE DEALS —");
      for (const b of selectedBundles) {
        const link = `${SITE_URL}/en/bundles/${b.id}`;
        const itemCount = (b.product_ids ?? []).length;
        lines.push(
          `• ${b.name.en} — $${Number(b.bundle_price).toFixed(2)} (${itemCount} items)`,
        );
        if (b.description?.en) lines.push(`  ${b.description.en}`);
        lines.push(`  ${link}`);
        lines.push("");
      }
    }
    if (selectedPromos.length > 0) {
      lines.push("— PROMO CODES —");
      for (const c of selectedPromos) {
        const valueStr =
          c.discount_type === "percent"
            ? `${c.discount_value}% off`
            : `$${Number(c.discount_value).toFixed(2)} off`;
        const expiry = c.ends_at
          ? ` (expires ${new Date(c.ends_at).toLocaleDateString()})`
          : "";
        lines.push(`• Use code ${c.code} — ${valueStr}${expiry}`);
        if (c.description) lines.push(`  ${c.description}`);
        const scope: string[] = [];
        if (c.applies_to_product_ids?.length) {
          scope.push(`${c.applies_to_product_ids.length} specific products`);
        }
        if (c.applies_to_category_slugs?.length) {
          scope.push(
            `categories: ${c.applies_to_category_slugs.join(", ")}`,
          );
        }
        if (scope.length === 0) scope.push("all products");
        lines.push(`  Applies to: ${scope.join("; ")}`);
        lines.push(`  Paste at checkout: ${SITE_URL}/en/cart`);
        lines.push("");
      }
    }
    lines.push("");
    lines.push(
      "Visit us in person: 308 S. 209th W. Ave., Sand Springs, OK · (918) 245-8112",
    );
    lines.push("Shop online: " + SITE_URL);
    lines.push("");
    lines.push(
      "You're receiving this because you opted in to marketing emails on our website. To unsubscribe, sign in at " +
        SITE_URL +
        "/en/account and turn off the marketing toggle.",
    );
    return lines.join("\n");
  }

  function mailtoHref() {
    const subjectEnc = encodeURIComponent(subject);
    const bodyEnc = encodeURIComponent(buildBody());
    const bcc = subscribers.join(",");
    return `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${subjectEnc}&body=${bodyEnc}`;
  }

  const totalSelected =
    selectedProducts.length + selectedBundles.length + selectedPromos.length;
  const canCompose = totalSelected > 0 && subscribers.length > 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-barn-700" /> Email Campaigns
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick any combination of sale products, bundles and promo codes, then click{" "}
        <strong>Compose email</strong>. Your default mail app opens with all opted‑in customers
        in BCC and a ready‑to‑send body. Review and hit send from your own account.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat
          label="Subscribers"
          value={loading ? "…" : subscribers.length.toString()}
          help="Customers who opted in"
        />
        <Stat
          label="Products"
          value={selectedProducts.length.toString()}
          help="Sale items selected"
        />
        <Stat
          label="Bundles"
          value={selectedBundles.length.toString()}
          help="Bundle deals selected"
        />
        <Stat
          label="Promo codes"
          value={selectedPromos.length.toString()}
          help="Codes selected"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* PRODUCTS */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Discounted products
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setProductFilter("discount")}
                  className={`rounded-md border px-2 py-1 font-semibold ${
                    productFilter === "discount"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  On sale
                </button>
                <button
                  onClick={() => setProductFilter("all")}
                  className={`rounded-md border px-2 py-1 font-semibold ${
                    productFilter === "all"
                      ? "border-barn-600 bg-barn-50 text-barn-700"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedProductIds(new Set())}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                        No products match.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(p.id)}
                            onChange={() => toggleSet(setSelectedProductIds, p.id)}
                            className="accent-barn-600"
                            aria-label={`Select ${p.name.en}`}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{p.name.en}</td>
                        <td className="px-3 py-2">
                          {p.original_price && p.original_price > p.price ? (
                            <span>
                              <s className="text-neutral-400">
                                ${p.original_price.toFixed(2)}
                              </s>{" "}
                              <strong>${p.price.toFixed(2)}</strong>
                            </span>
                          ) : (
                            <span>${p.price.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-500">
                          {p.discount && (
                            <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                              <Tag className="mr-1 inline h-3 w-3" />
                              SALE
                            </span>
                          )}
                          {p.new_arrival && (
                            <span className="mr-1 rounded bg-barn-50 px-1.5 py-0.5 text-barn-700">
                              NEW
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* BUNDLES */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Package2 className="h-3.5 w-3.5" /> Bundle deals
              </h2>
              <button
                onClick={() => setSelectedBundleIds(new Set())}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Bundle</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                        Loading…
                      </td>
                    </tr>
                  ) : bundles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                        No active bundles.
                      </td>
                    </tr>
                  ) : (
                    bundles.map((b) => (
                      <tr key={b.id}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedBundleIds.has(b.id)}
                            onChange={() => toggleSet(setSelectedBundleIds, b.id)}
                            className="accent-barn-600"
                            aria-label={`Select ${b.name.en}`}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{b.name.en}</td>
                        <td className="px-3 py-2">${Number(b.bundle_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-neutral-500">
                          {(b.product_ids ?? []).length} items
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PROMO CODES */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <TicketPercent className="h-3.5 w-3.5" /> Promo codes
              </h2>
              <button
                onClick={() => setSelectedPromoIds(new Set())}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2">Scope</th>
                    <th className="px-3 py-2">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                        Loading…
                      </td>
                    </tr>
                  ) : promos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                        No active codes.
                      </td>
                    </tr>
                  ) : (
                    promos.map((c) => {
                      const scopeBits: string[] = [];
                      if (c.applies_to_product_ids?.length) {
                        scopeBits.push(`${c.applies_to_product_ids.length} products`);
                      }
                      if (c.applies_to_category_slugs?.length) {
                        scopeBits.push(
                          `${c.applies_to_category_slugs.length} categories`,
                        );
                      }
                      const scope = scopeBits.length ? scopeBits.join(", ") : "all";
                      return (
                        <tr key={c.id}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedPromoIds.has(c.id)}
                              onChange={() => toggleSet(setSelectedPromoIds, c.id)}
                              className="accent-barn-600"
                              aria-label={`Select ${c.code}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{c.code}</td>
                          <td className="px-3 py-2">
                            {c.discount_type === "percent"
                              ? `${c.discount_value}% off`
                              : `$${Number(c.discount_value).toFixed(2)} off`}
                          </td>
                          <td className="px-3 py-2 text-xs text-neutral-500">{scope}</td>
                          <td className="px-3 py-2 text-xs text-neutral-500">
                            {c.ends_at
                              ? new Date(c.ends_at).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="block text-xs font-semibold text-neutral-600">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-barn-500 focus:outline-none"
            />
            <label className="mt-3 block text-xs font-semibold text-neutral-600">
              Intro message
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-barn-500 focus:outline-none"
            />
            <a
              href={canCompose ? mailtoHref() : undefined}
              aria-disabled={!canCompose}
              onClick={(e) => {
                if (!canCompose) e.preventDefault();
              }}
              className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold text-white transition ${
                canCompose
                  ? "bg-barn-600 hover:bg-barn-700"
                  : "cursor-not-allowed bg-neutral-300"
              }`}
            >
              <Mail className="h-4 w-4" />
              Compose email
            </a>
            {!canCompose && (
              <p className="mt-2 text-[11px] text-neutral-500">
                {subscribers.length === 0
                  ? "No customers have opted in yet."
                  : "Pick at least one product, bundle or promo first."}
              </p>
            )}
            {totalSelected > 0 && (
              <p className="mt-2 text-[11px] text-neutral-500">
                {totalSelected} item{totalSelected === 1 ? "" : "s"} · BCC to{" "}
                {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          <details className="rounded-xl border border-neutral-200 bg-white p-4 text-xs">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-700">
              Preview body
            </summary>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-[11px] text-neutral-700">
              {totalSelected === 0 ? "(select something to preview)" : buildBody()}
            </pre>
          </details>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-neutral-900">{value}</p>
      {help && <p className="text-[11px] text-neutral-500">{help}</p>}
    </div>
  );
}
