import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { getAllCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { locales } from "@/lib/i18n/config";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cats = await getAllCategories();
  return locales.flatMap((locale) => cats.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sucre-et-sel.sucre-et-sel.workers.dev";
  const url = `${base}/${lang}/categories/${cat.slug}`;
  const name = cat.name[lang] || cat.name.en || "Category";
  const description =
    lang === "es"
      ? `Explora todos los productos de ${cat.name.es} en sucre et sel.`
      : `Shop all ${cat.name.en} products at sucre et sel.`;
  return {
    title: `${name} — sucre et sel`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} — sucre et sel`,
      description,
      url,
      siteName: "sucre et sel",
      type: "website",
      images: cat.image_url ? [{ url: cat.image_url, alt: name }] : undefined,
    },
  };
}

export default async function CategoryDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const t = await getTranslations("common");
  const lang = locale as "en" | "es";
  const products = await getProductsByCategory(slug);

  return (
    <>
      <PageHeader title={cat.name[lang] || cat.name.en || "Category"} subtitle={`${products.length} ${t("products")}`} />
      <section className="container-page py-10">
        {products.length === 0 ? (
          <p className="text-center text-neutral-500">{t("noResults")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
