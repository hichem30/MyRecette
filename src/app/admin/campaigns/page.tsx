"use client";

import {
  ClipboardCopy,
  Download,
  ExternalLink,
  ImageIcon,
  Mail,
  Megaphone,
  Package2,
  Search,
  Sparkles,
  Tag,
  TicketPercent,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mockProducts } from "@/lib/data/mock-data";
import type { Bundle, Product, PromoCode } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://shop.redbarnmarket.workers.dev";

type ProductFilter = "new" | "discount" | "all";

export default function AdminCampaignsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(new Set());
  const [selectedPromoIds, setSelectedPromoIds] = useState<Set<string>>(new Set());
  const [subscribers, setSubscribers] = useState<
    Array<{ email: string; subscribed_at: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<ProductFilter>("discount");
  const [productSearch, setProductSearch] = useState("");
  const [subject, setSubject] = useState("New deals from sucre et sel");
  const [intro, setIntro] = useState(
    "Hi there! Here are some fresh deals at sucre et sel — stop by the yard or order online.",
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

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
      const rows = ((subRes.data as Array<{
        email: string;
        subscribed_at?: string | null;
      }>) ?? [])
        .filter((r) => !!r.email)
        .map((r) => ({ email: r.email, subscribed_at: r.subscribed_at ?? null }));
      setSubscribers(rows);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productFilter === "discount" && !p.discount) return false;
      if (productFilter === "new" && !p.new_arrival) return false;
      if (q && !(p.name.en || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, productFilter, productSearch]);

  const newCount = useMemo(
    () => products.filter((p) => p.new_arrival).length,
    [products],
  );
  const discountCount = useMemo(
    () => products.filter((p) => p.discount).length,
    [products],
  );

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.has(p.id)),
    [products, selectedProductIds],
  );
  const selectedNewArrivals = useMemo(
    () => selectedProducts.filter((p) => p.new_arrival),
    [selectedProducts],
  );
  const selectedOnSale = useMemo(
    () => selectedProducts.filter((p) => p.discount && !p.new_arrival),
    [selectedProducts],
  );
  const selectedOtherProducts = useMemo(
    () => selectedProducts.filter((p) => !p.discount && !p.new_arrival),
    [selectedProducts],
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

  function productLine(p: Product) {
    const link = `${SITE_URL}/en/products/${p.slug}`;
    const wasNow =
      p.original_price && p.original_price > p.price
        ? ` — was $${p.original_price.toFixed(2)}, now $${p.price.toFixed(2)}`
        : ` — $${p.price.toFixed(2)}`;
    return [`• ${p.name.en}${wasNow}`, `  ${link}`, ""];
  }

  function htmlEscape(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function productCardHtml(p: Product) {
    const link = `${SITE_URL}/en/products/${p.slug}`;
    const img = p.image_url
      ? `<a href="${link}" style="display:inline-block"><img src="${htmlEscape(p.image_url)}" alt="${htmlEscape(p.name.en || "")}" width="140" style="display:block;width:140px;height:140px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" /></a>`
      : "";
    const priceHtml =
      p.original_price && p.original_price > p.price
        ? `<span style="color:#737373;text-decoration:line-through;margin-right:6px">$${p.original_price.toFixed(2)}</span><strong style="color:#8B2A18">$${p.price.toFixed(2)}</strong>`
        : `<strong>$${p.price.toFixed(2)}</strong>`;
    return `
<tr>
  <td style="padding:8px 12px 8px 0;vertical-align:top;width:160px">${img}</td>
  <td style="padding:8px 0;vertical-align:top">
    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600">
      <a href="${link}" style="color:#1c1917;text-decoration:none">${htmlEscape(p.name.en || "")}</a>
    </p>
    <p style="margin:0 0 6px 0;font-size:14px">${priceHtml}</p>
    <p style="margin:0"><a href="${link}" style="color:#8B2A18;font-size:13px">Shop this item →</a></p>
  </td>
</tr>`;
  }

  function bundleCardHtml(b: Bundle) {
    const link = `${SITE_URL}/en/bundles/${b.id}`;
    const itemCount = (b.product_ids ?? []).length;
    const img = b.image_url
      ? `<a href="${link}" style="display:inline-block"><img src="${htmlEscape(b.image_url)}" alt="${htmlEscape(b.name.en || "")}" width="140" style="display:block;width:140px;height:140px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" /></a>`
      : "";
    return `
<tr>
  <td style="padding:8px 12px 8px 0;vertical-align:top;width:160px">${img}</td>
  <td style="padding:8px 0;vertical-align:top">
    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600">
      <a href="${link}" style="color:#1c1917;text-decoration:none">${htmlEscape(b.name.en || "")}</a>
    </p>
    <p style="margin:0 0 4px 0;font-size:14px"><strong style="color:#8B2A18">$${Number(b.bundle_price).toFixed(2)}</strong> · ${itemCount} items</p>
    ${b.description?.en ? `<p style="margin:0 0 6px 0;font-size:13px;color:#525252">${htmlEscape(b.description.en)}</p>` : ""}
    <p style="margin:0"><a href="${link}" style="color:#8B2A18;font-size:13px">See bundle details →</a></p>
  </td>
</tr>`;
  }

  function promoCardHtml(c: PromoCode) {
    const valueStr =
      c.discount_type === "percent"
        ? `${c.discount_value}% off`
        : `$${Number(c.discount_value).toFixed(2)} off`;
    const expiry = c.ends_at
      ? ` <span style="color:#737373">(expires ${new Date(c.ends_at).toLocaleDateString()})</span>`
      : "";
    const scope: string[] = [];
    if (c.applies_to_product_ids?.length) {
      scope.push(`${c.applies_to_product_ids.length} specific products`);
    }
    if (c.applies_to_category_slugs?.length) {
      scope.push(`categories: ${c.applies_to_category_slugs.join(", ")}`);
    }
    if (scope.length === 0) scope.push("all products");
    return `
<tr><td style="padding:8px 0">
  <div style="border:2px dashed #10b981;border-radius:10px;padding:14px;background:#ecfdf5">
    <p style="margin:0 0 4px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#047857;font-weight:700">Use code at checkout</p>
    <p style="margin:0 0 4px 0;font-size:22px;font-weight:800;color:#1c1917">${htmlEscape(c.code)} <span style="font-size:15px;font-weight:600;color:#047857">— ${valueStr}</span>${expiry}</p>
    ${c.description ? `<p style="margin:0 0 6px 0;font-size:14px;color:#374151">${htmlEscape(c.description)}</p>` : ""}
    <p style="margin:0;font-size:12px;color:#525252">Applies to: ${htmlEscape(scope.join("; "))}</p>
  </div>
</td></tr>`;
  }

  function buildHtmlBody() {
    const sections: string[] = [];
    if (selectedNewArrivals.length > 0) {
      sections.push(
        `<h2 style="margin:24px 0 8px 0;font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#8B2A18;border-bottom:2px solid #8B2A18;padding-bottom:6px">New arrivals</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%">${selectedNewArrivals.map(productCardHtml).join("")}</table>`,
      );
    }
    if (selectedOnSale.length > 0) {
      sections.push(
        `<h2 style="margin:24px 0 8px 0;font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#b45309;border-bottom:2px solid #b45309;padding-bottom:6px">On sale now</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%">${selectedOnSale.map(productCardHtml).join("")}</table>`,
      );
    }
    if (selectedOtherProducts.length > 0) {
      sections.push(
        `<h2 style="margin:24px 0 8px 0;font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#1c1917;border-bottom:2px solid #1c1917;padding-bottom:6px">Featured products</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%">${selectedOtherProducts.map(productCardHtml).join("")}</table>`,
      );
    }
    if (selectedBundles.length > 0) {
      sections.push(
        `<h2 style="margin:24px 0 8px 0;font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#b45309;border-bottom:2px solid #f59e0b;padding-bottom:6px">Bundle deals</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%">${selectedBundles.map(bundleCardHtml).join("")}</table>`,
      );
    }
    if (selectedPromos.length > 0) {
      sections.push(
        `<h2 style="margin:24px 0 8px 0;font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#047857;border-bottom:2px solid #10b981;padding-bottom:6px">Promo codes</h2><table cellpadding="0" cellspacing="0" border="0" style="width:100%">${selectedPromos.map(promoCardHtml).join("")}</table>`,
      );
    }
    const intro_html = htmlEscape(intro).replace(/\n/g, "<br/>");
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;max-width:640px;color:#1c1917;line-height:1.5"><p style="margin:0 0 16px 0;font-size:15px">${intro_html}</p>${sections.join("")}<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 12px 0" /><p style="margin:0 0 4px 0;font-size:13px;color:#525252">Visit us in person: 308 S. 209th W. Ave., Sand Springs, OK · (918) 245-8112</p><p style="margin:0 0 12px 0;font-size:13px">Shop online: <a href="${SITE_URL}" style="color:#8B2A18">${SITE_URL}</a></p><p style="margin:0;font-size:11px;color:#a3a3a3">You're receiving this because you opted in to marketing emails on our website. To unsubscribe, sign in at <a href="${SITE_URL}/en/account" style="color:#a3a3a3">${SITE_URL}/en/account</a> and turn off the marketing toggle.</p></div>`;
  }

  function buildBody() {
    const lines = [intro, ""];
    if (selectedNewArrivals.length > 0) {
      lines.push("— NEW ARRIVALS —");
      for (const p of selectedNewArrivals) lines.push(...productLine(p));
    }
    if (selectedOnSale.length > 0) {
      lines.push("— ON SALE NOW —");
      for (const p of selectedOnSale) lines.push(...productLine(p));
    }
    if (selectedOtherProducts.length > 0) {
      lines.push("— FEATURED PRODUCTS —");
      for (const p of selectedOtherProducts) lines.push(...productLine(p));
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

  function bccString() {
    return subscribers.map((s) => s.email).join(",");
  }

  function flashStatus(msg: string) {
    setCopyStatus(msg);
    window.setTimeout(() => setCopyStatus(null), 2400);
  }

  function exportSubscribersCsv() {
    if (subscribers.length === 0) {
      flashStatus("No opted-in subscribers yet. Empty CSV downloaded.");
    }
    // EmailOctopus accepts a CSV with an `email_address` column (plus
    // any custom fields). We also include `subscribed_at` as a custom
    // field so the import preserves the original opt-in date.
    const header = "email_address,subscribed_at";
    const escape = (v: string) => {
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const lines = subscribers.map(
      (s) => `${escape(s.email)},${escape(s.subscribed_at ?? "")}`,
    );
    const csv = `${header}\n${lines.join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `red-barn-subscribers-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (subscribers.length > 0) {
      flashStatus(`Downloaded red-barn-subscribers-${stamp}.csv (${subscribers.length} email${subscribers.length === 1 ? "" : "s"}).`);
    }
  }

  async function copySubscriberEmails() {
    if (subscribers.length === 0) {
      flashStatus("No subscribers yet.");
      return;
    }
    const text = subscribers.map((s) => s.email).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      flashStatus(`Copied ${subscribers.length} email${subscribers.length === 1 ? "" : "s"} to clipboard.`);
    } catch {
      flashStatus("Copy blocked by the browser. Use the Download CSV button instead.");
    }
  }

  function mailtoHref() {
    const subjectEnc = encodeURIComponent(subject);
    const bodyEnc = encodeURIComponent(buildBody());
    return `mailto:?bcc=${encodeURIComponent(bccString())}&subject=${subjectEnc}&body=${bodyEnc}`;
  }

  async function copy(text: string, statusLabel: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(statusLabel);
      setTimeout(() => setCopyStatus(null), 2500);
    } catch {
      setCopyStatus("Couldn't copy — your browser blocked it. Use the preview panel and copy manually.");
      setTimeout(() => setCopyStatus(null), 4000);
    }
  }

  async function copyAll() {
    const fullBody =
      `BCC: ${bccString()}\n\n` +
      `Subject: ${subject}\n\n` +
      `${buildBody()}`;
    await copy(fullBody, "Subject + BCC + body copied as plain text.");
  }

  async function copyHtml() {
    const html = buildHtmlBody();
    const headerText = `BCC: ${bccString()}\n\nSubject: ${subject}\n\n`;
    const text = headerText + buildBody();
    try {
      if (
        typeof window !== "undefined" &&
        typeof window.ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        "write" in navigator.clipboard
      ) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
        setCopyStatus(
          "Email copied with images. Open Mailspring → New message → paste BCC + Subject + body.",
        );
        setTimeout(() => setCopyStatus(null), 4000);
      } else {
        await copy(html, "HTML copied (raw markup). Paste into a 'View as HTML' editor.");
      }
    } catch {
      await copy(html, "HTML copied (raw markup) — your browser blocked rich-text copy.");
    }
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
        Pick any combination of products, bundles, and promo codes — then either copy the styled HTML into
        Mailspring/Gmail/etc, or export the subscriber list as CSV for a service like EmailOctopus.
      </p>

      <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-barn-50 text-barn-700">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-900">
                Subscribers
                <span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                  {loading ? "…" : subscribers.length}
                </span>
              </p>
              <p className="text-[11px] text-neutral-500">
                Customers who opted in to receive marketing emails.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportSubscribersCsv}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-3 py-2 text-xs font-semibold text-white hover:bg-barn-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={copySubscriberEmails}
              disabled={loading || subscribers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-barn-600 hover:text-barn-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copy emails
            </button>
            <a
              href="https://emailoctopus.com/lists"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-barn-600 hover:text-barn-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open EmailOctopus
            </a>
          </div>
        </div>

        {subscribers.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
            <ul className="space-y-0.5 font-mono">
              {subscribers.map((s) => (
                <li key={s.email} className="truncate">{s.email}</li>
              ))}
            </ul>
          </div>
        )}

        {!loading && subscribers.length === 0 && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No customers have opted in yet. Customers see a “Send me promotions” toggle
            on <span className="font-mono">Account → Email preferences</span> after they
            create an account. Once anyone toggles it on, they’ll show up here.
          </p>
        )}

        <details className="mt-3 text-xs text-neutral-600">
          <summary className="cursor-pointer font-semibold text-neutral-800 hover:text-barn-700">
            How to import these subscribers into EmailOctopus
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Click <strong>Download CSV</strong> above — a file like <span className="font-mono">red-barn-subscribers-YYYY-MM-DD.csv</span> downloads to your computer.</li>
            <li>Click <strong>Open EmailOctopus</strong> — opens https://emailoctopus.com/lists in a new tab. Sign in if you aren’t already.</li>
            <li>Click your list (or <strong>+ New list</strong> if you don’t have one yet).</li>
            <li>Inside the list, click <strong>Subscribers</strong> → <strong>Add subscribers</strong> → <strong>Upload a file</strong>.</li>
            <li>Drag the CSV onto the page. EmailOctopus auto-detects the <span className="font-mono">email_address</span> column.</li>
            <li>Click <strong>Import</strong>. Done.</li>
          </ol>
        </details>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Products"
          value={selectedProducts.length.toString()}
          help={`${newCount} new · ${discountCount} on sale`}
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* PRODUCTS */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Products
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setProductFilter("new")}
                  className={`rounded-md border px-2 py-1 font-semibold flex items-center gap-1 ${
                    productFilter === "new"
                      ? "border-barn-600 bg-barn-50 text-barn-700"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  New arrivals
                </button>
                <button
                  type="button"
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
                  type="button"
                  onClick={() => setProductFilter("all")}
                  className={`rounded-md border px-2 py-1 font-semibold ${
                    productFilter === "all"
                      ? "border-neutral-700 bg-neutral-100 text-neutral-800"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(new Set())}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mb-2 relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by product name…"
                className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-barn-500 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[640px] text-sm">
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
                          {p.new_arrival && (
                            <span className="mr-1 rounded bg-barn-50 px-1.5 py-0.5 text-barn-700">
                              <Sparkles className="mr-1 inline h-3 w-3" />
                              NEW
                            </span>
                          )}
                          {p.discount && (
                            <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                              <Tag className="mr-1 inline h-3 w-3" />
                              SALE
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
                type="button"
                onClick={() => setSelectedBundleIds(new Set())}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[640px] text-sm">
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
                type="button"
                onClick={() => setSelectedPromoIds(new Set())}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[640px] text-sm">
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

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Send with
              </p>
              <div className="mt-2 space-y-2">
                <a
                  href={canCompose ? mailtoHref() : undefined}
                  aria-disabled={!canCompose}
                  onClick={(e) => {
                    if (!canCompose) e.preventDefault();
                  }}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold text-white transition ${
                    canCompose
                      ? "bg-barn-600 hover:bg-barn-700"
                      : "cursor-not-allowed bg-neutral-300"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Default mail app
                </a>
                <button
                  type="button"
                  onClick={copyHtml}
                  disabled={!canCompose}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    canCompose
                      ? "border-barn-600 bg-white text-barn-700 hover:bg-barn-50"
                      : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Copy with images (HTML)
                </button>
                <button
                  type="button"
                  onClick={copyAll}
                  disabled={!canCompose}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    canCompose
                      ? "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                      : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                  }`}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy as plain text
                </button>
              </div>
              <details className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-neutral-700">
                  Instructions
                </summary>
                <ul className="mt-2 space-y-2 text-[11px] leading-snug text-neutral-600">
                  <li>
                    <strong className="text-neutral-800">Default mail app</strong>
                    <br />
                    Opens whatever you have set as your system mailer (Mailspring, Thunderbird,
                    Apple Mail, etc.). Body is plain text only — mailto: does not support images.
                  </li>
                  <li>
                    <strong className="text-neutral-800">Copy with images (HTML)</strong>
                    <br />
                    Copies the full styled email with product photos. Open Mailspring → New message
                    → paste with Ctrl/Cmd + V — images render inline. Then paste the BCC list from
                    the header on top.
                  </li>
                  <li>
                    <strong className="text-neutral-800">Copy as plain text</strong>
                    <br />
                    Best for any other tool (Gmail web, Outlook, Apple Mail).
                  </li>
                </ul>
              </details>
              {copyStatus && (
                <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-800">
                  {copyStatus}
                </p>
              )}
            </div>

            {!canCompose && (
              <p className="mt-3 text-[11px] text-neutral-500">
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
