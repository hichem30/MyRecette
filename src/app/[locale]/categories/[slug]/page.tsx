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

export default async function CategoryDetail({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const t = await getTranslations("common");
  const lang = locale as "en" | "es";
  const products = await getProductsByCategory(slug);

  return (
    <>
      <PageHeader title={cat.name[lang]} subtitle={`${products.length} ${t("products")}`} />
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
