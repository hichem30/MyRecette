import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { t } from "@/lib/fr";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { getAllCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cats = await getAllCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.redbarnmarket.workers.dev";
  const url = `${base}/categories/${cat.slug}`;
  const name = typeof cat.name === 'string' ? cat.name : (cat.name?.fr || cat.name?.en || "Category");
  const description = `Découvrez tous les produits de la catégorie ${name} sur My Recette.`;
  return {
    title: `${name} — My Recette`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} — My Recette`,
      description,
      url,
      siteName: "My Recette",
      type: "website",
      images: cat.image_url ? [{ url: cat.image_url, alt: name }] : undefined,
    },
  };
}

export default async function CategoryDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const products = await getProductsByCategory(slug);

  return (
    <>
      <PageHeader title={typeof cat.name === 'string' ? cat.name : (cat.name?.fr || cat.name?.en || "Catégorie")} subtitle={`${products.length} ${t("common.products")}`} />
      <section className="container-page py-10">
        {products.length === 0 ? (
          <p className="text-center text-neutral-500">{t("common.noResults")}</p>
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
