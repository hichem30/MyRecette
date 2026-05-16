import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Truck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { locales } from "@/lib/i18n/config";
import { ProductCard } from "@/components/ProductCard";
import { ProductCTAs } from "@/components/ProductCTAs";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const all = await getAllProducts();
  const params: Array<{ locale: string; slug: string }> = [];
  for (const l of locales) for (const p of all) params.push({ locale: l, slug: p.slug });
  return params;
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://redbarnmarket.netlify.app";
  const url = `${base}/${lang}/products/${product.slug}`;
  const title = `${product.name[lang]} — Red Barn Western Market`;
  const description = product.description[lang]?.slice(0, 160) || product.name[lang];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Red Barn Western Market",
      type: "website",
      images: product.image_url ? [{ url: product.image_url, alt: product.name[lang] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductDetail({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const t = await getTranslations("common");
  const lang = locale as "en" | "es";

  const all = await getAllProducts();
  const related = all
    .filter((p) => p.category_slug === product.category_slug && p.id !== product.id)
    .slice(0, 4);

  // JSON-LD structured data for SEO rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[lang],
    description: product.description[lang],
    image: product.image_url,
    sku: product.id,
    brand: { "@type": "Brand", name: "Red Barn Western Market" },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://redbarnwesternmarket.com"}/${lang}/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-page pt-6">
        <nav className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/" className="hover:text-barn-700">{lang === "en" ? "Home" : "Inicio"}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-barn-700">{lang === "en" ? "Products" : "Productos"}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-700">{product.name[lang]}</span>
        </nav>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
            <Image
              src={product.image_url}
              alt={product.name[lang]}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-4 top-4 flex flex-col gap-1">
              {product.new_arrival && (
                <span className="rounded-md bg-barn-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t("new")}
                </span>
              )}
              {product.discount && product.discount_text && (
                <span className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {product.discount_text[lang]}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-barn-600">
              {product.category_slug.replace(/-/g, " ")}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">
              {product.name[lang]}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-900">{formatPrice(product.price)}</span>
              {product.original_price && (
                <>
                  <span className="text-base text-neutral-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {t("you_save")} {formatPrice(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-neutral-600">{product.description[lang]}</p>

            <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                  product.stock === 0
                    ? "bg-red-50 text-red-700"
                    : product.stock <= 5
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {product.stock === 0
                  ? t("outOfStock")
                  : product.stock <= 5
                  ? t("onlyXLeft", { count: product.stock })
                  : `${product.stock} ${t("inStock")}`}
              </span>
              {product.free_shipping && (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Truck className="h-3.5 w-3.5" /> {t("freeShipping")}
                </span>
              )}
            </div>

            <ProductCTAs product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-neutral-50 py-12">
          <div className="container-page">
            <h2 className="mb-6 font-serif text-2xl font-bold">
              {lang === "en" ? "Related Products" : "Productos Relacionados"}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
