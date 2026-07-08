import { Suspense } from "react";
import { getAllCategories, getAllProducts } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { ProductsListing } from "@/components/ProductsListing";
import { t } from "@/lib/fr";

export const revalidate = 60;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <>
      <PageHeader title={t("products.title")} subtitle={t("products.subtitle")} />
      <section className="container-page py-10">
        <Suspense>
          <ProductsListing products={products} categories={categories} />
        </Suspense>
      </section>
    </>
  );
}
