import Image from "next/image";
import { Clock, Package2, Tag } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { ProductCard } from "@/components/ProductCard";
import { PromoCodeCopy } from "@/components/PromoCodeCopy";
import { getDeals, getAllProducts } from "@/lib/data";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { Bundle, Product, PromoCode } from "@/lib/types";

// Dynamic: bundles + active promo codes must reflect the latest admin
// changes immediately. KV-backed ISR has no tag-invalidation queue, so a
// cached /deals page can be up to revalidate-window seconds stale after an
// admin update.
export const dynamic = "force-dynamic";

async function getActiveBundles(): Promise<Bundle[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const { data } = await sb
    .from("bundles")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });
  return (data as Bundle[]) ?? [];
}

// Promo codes are gated behind admin-only RLS, so the storefront must use
// the service-role client to read them. Returns [] when the service-role
// key isn't configured.
async function getActivePromoCodes(): Promise<PromoCode[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("promo_codes")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });
  const codes = (data as PromoCode[]) ?? [];
  return codes.filter(
    (c) => c.max_uses == null || c.uses_count < c.max_uses,
  );
}

export default async function DealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("deals");
  const tb = await getTranslations("bundles");
  const [deals, bundles, products, promos] = await Promise.all([
    getDeals(),
    getActiveBundles(),
    getAllProducts(),
    getActivePromoCodes(),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));

  const maxOff = deals.reduce((acc, p) => {
    if (!p.original_price) return acc;
    const off = Math.round(((p.original_price - p.price) / p.original_price) * 100);
    return Math.max(acc, off);
  }, 0);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=1280&q=70"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
        </div>
        <div className="container-page py-16">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Clock className="h-3 w-3" /> {t("limitedTime")}
          </span>
          <h1 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-white/80">{t("subtitle")}</p>
          {maxOff > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-semibold">
              <span className="text-amber-300">%</span>
              {t("saveUpTo", { percent: maxOff })}
            </div>
          )}
        </div>
      </section>

      {promos.length > 0 && (
        <section className="container-page py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
              <Tag className="h-6 w-6 text-amber-700" /> Active Promo Codes
            </h2>
            <p className="text-xs text-neutral-500">Use at checkout</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((promo) => {
              const scopeNames: string[] = [];
              if (promo.applies_to_category_slugs?.length) {
                for (const s of promo.applies_to_category_slugs) {
                  scopeNames.push(s.replace(/-/g, " "));
                }
              }
              if (promo.applies_to_product_ids?.length) {
                for (const id of promo.applies_to_product_ids) {
                  const p = productById.get(id);
                  if (p) scopeNames.push(p.name.en);
                }
              }
              const scopeText = scopeNames.length > 0 ? scopeNames.join(", ") : "All products";
              const valueLabel =
                promo.discount_type === "percent"
                  ? `${promo.discount_value}% off`
                  : `${formatPrice(promo.discount_value)} off`;
              return (
                <article
                  key={promo.id}
                  className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <PromoCodeCopy code={promo.code} />
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                      {valueLabel}
                    </span>
                  </div>
                  {promo.description && (
                    <p className="text-sm text-neutral-700">{promo.description}</p>
                  )}
                  <p className="text-xs text-neutral-500">
                    <span className="font-semibold">Applies to:</span> {scopeText}
                  </p>
                  {promo.ends_at && (
                    <p className="text-xs text-neutral-500">
                      Expires {new Date(promo.ends_at).toLocaleDateString()}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {bundles.length > 0 && (
        <section className="container-page py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
              <Package2 className="h-6 w-6 text-amber-700" /> {tb("title")}
            </h2>
            <p className="text-xs text-neutral-500">{tb("subtitle")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {bundles.map((b) => {
              const inBundle = b.product_ids
                .map((id) => productById.get(id))
                .filter((x): x is Product => Boolean(x));
              const total = inBundle.reduce((s, p) => s + p.price, 0);
              const savings = Math.max(0, total - b.bundle_price);
              return (
                <article key={b.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
                  {b.image_url && (
                    <div className="relative aspect-[16/9] bg-neutral-100">
                      <Image
                        src={b.image_url}
                        alt={b.name.en}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
                      <Package2 className="h-4 w-4" /> {tb("bundleDeal")}
                    </div>
                    <h3 className="mt-2 font-serif text-xl font-bold text-neutral-900">{b.name.en}</h3>
                    {b.description?.en && (
                      <p className="mt-1 text-sm text-neutral-600">{b.description.en}</p>
                    )}

                    <ul className="mt-4 space-y-2 text-sm">
                      {inBundle.map((p) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <Link href={`/products/${p.slug}`} className="hover:text-barn-700">
                            {p.name.en}
                          </Link>
                          <span className="text-xs text-neutral-500">{formatPrice(p.price)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex items-baseline justify-between border-t border-neutral-100 pt-3">
                      <div>
                        <span className="text-2xl font-bold text-neutral-900">{formatPrice(b.bundle_price)}</span>
                        {savings > 0 && (
                          <span className="ml-2 text-sm font-medium text-emerald-700">
                            {tb("save")} {formatPrice(savings)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{tb("ifBoughtSeparately")} {formatPrice(total)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">
            {t("dealsAvailable", { count: deals.length })}
          </h2>
          <p className="text-xs text-neutral-500">{t("updatedDaily")}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
