import Image from "next/image";
import { Package2 } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import type { Bundle, Product } from "@/lib/types";

export const revalidate = 3600;

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

export default async function BundlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bundles");
  const lang = locale as "en" | "es";
  const [bundles, products] = await Promise.all([getActiveBundles(), getAllProducts()]);
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        eyebrow={lang === "en" ? "BUNDLE DEALS" : "PAQUETES"}
      />

      <section className="container-page py-12">
        {bundles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
            {t("empty")}
          </div>
        ) : (
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
                        alt={b.name[lang]}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
                      <Package2 className="h-4 w-4" /> {t("bundleDeal")}
                    </div>
                    <h2 className="mt-2 font-serif text-xl font-bold text-neutral-900">{b.name[lang]}</h2>
                    {b.description?.[lang] && (
                      <p className="mt-1 text-sm text-neutral-600">{b.description[lang]}</p>
                    )}

                    <ul className="mt-4 space-y-2 text-sm">
                      {inBundle.map((p) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <Link href={`/products/${p.slug}`} className="hover:text-barn-700">
                            {p.name[lang]}
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
                            {t("save")} {formatPrice(savings)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{t("ifBoughtSeparately")} {formatPrice(total)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
