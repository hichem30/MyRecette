import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllCategories, getAllProducts } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { ProductsListing } from "@/components/ProductsListing";

export const revalidate = 60;

export default async function ProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="container-page py-10">
        <Suspense>
          <ProductsListing products={products} categories={categories} />
        </Suspense>
      </section>
    </>
  );
}
