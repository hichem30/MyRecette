import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Package2 } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { getAllProducts } from "@/lib/data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { Bundle, Product } from "@/lib/types";

// Bundles change on admin updates; force-dynamic mirrors /deals so a freshly
// edited bundle is visible immediately.
export const dynamic = "force-dynamic";

async function getBundle(id: string): Promise<Bundle | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseServerClient();
  const { data } = await sb.from("bundles").select("*").eq("id", id).maybeSingle();
  return (data as Bundle | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const bundle = await getBundle(id);
  if (!bundle) return {};
  const lang = locale as "en" | "es";
  return {
    title: `${bundle.name[lang]} — Bundle Deal — Red Barn Western Market`,
    description: bundle.description?.[lang]?.slice(0, 160) || bundle.name[lang],
    openGraph: {
      title: bundle.name[lang],
      description: bundle.description?.[lang] ?? undefined,
      images: bundle.image_url ? [{ url: bundle.image_url, alt: bundle.name[lang] }] : undefined,
    },
  };
}

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const lang = locale as "en" | "es";

  const bundle = await getBundle(id);
  if (!bundle) notFound();

  const products = await getAllProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = bundle.product_ids
    .map((pid) => byId.get(pid))
    .filter((p): p is Product => Boolean(p));

  const total = items.reduce((s, p) => s + p.price, 0);
  const savings = Math.max(0, total - bundle.bundle_price);
  const savingsPct = total > 0 ? Math.round((savings / total) * 100) : 0;

  return (
    <>
      <div className="container-page pt-6">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          <Link href="/" className="hover:text-barn-700">
            {lang === "en" ? "Home" : "Inicio"}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/deals" className="hover:text-barn-700">
            {lang === "en" ? "Deals" : "Ofertas"}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-700">{bundle.name[lang]}</span>
        </nav>
      </div>

      <div className="container-page py-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Hero image / badge */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
            {bundle.image_url ? (
              <Image
                src={bundle.image_url}
                alt={bundle.name[lang]}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-300">
                <Package2 className="h-24 w-24" />
              </div>
            )}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              <Package2 className="h-3 w-3" />
              {lang === "en" ? "Bundle Deal" : "Paquete"}
            </span>
            {savingsPct > 0 && (
              <span className="absolute right-4 top-4 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                {lang === "en" ? `Save ${savingsPct}%` : `Ahorra ${savingsPct}%`}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              {lang === "en" ? "Bundle of " : "Paquete de "}
              {items.length} {lang === "en" ? "items" : "artículos"}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">
              {bundle.name[lang]}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-900">
                {formatPrice(bundle.bundle_price)}
              </span>
              {total > bundle.bundle_price && (
                <span className="text-base text-neutral-400 line-through">
                  {formatPrice(total)}
                </span>
              )}
              {savings > 0 && (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {lang === "en" ? "You save" : "Ahorras"} {formatPrice(savings)}
                </span>
              )}
            </div>

            {bundle.description?.[lang] && (
              <p className="mt-4 text-neutral-600">{bundle.description[lang]}</p>
            )}

            {bundle.ends_at && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                {lang === "en" ? "Available until" : "Disponible hasta"}{" "}
                {new Date(bundle.ends_at).toLocaleDateString()}
              </p>
            )}

            <div className="mt-6">
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                {lang === "en" ? "What's in this bundle" : "Qué incluye este paquete"}
              </h2>
              <ul className="mt-3 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {items.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-neutral-500">
                    {lang === "en"
                      ? "No items in this bundle yet."
                      : "Este paquete aún no tiene artículos."}
                  </li>
                ) : (
                  items.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        className="flex items-center gap-3 px-3 py-3 transition hover:bg-neutral-50"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                          <Image
                            src={p.image_url}
                            alt={p.name[lang]}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-1 font-semibold text-neutral-900">
                            {p.name[lang]}
                          </div>
                          <div className="line-clamp-1 text-xs text-neutral-500">
                            {p.category_slug.replace(/-/g, " ")}
                          </div>
                        </div>
                        <div className="whitespace-nowrap text-sm font-semibold text-neutral-700">
                          {formatPrice(p.price)}
                        </div>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              <p className="mt-3 text-xs text-neutral-500">
                {lang === "en"
                  ? "Tap any item to view it or add it to your cart."
                  : "Toca cualquier artículo para verlo o añadirlo al carrito."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
