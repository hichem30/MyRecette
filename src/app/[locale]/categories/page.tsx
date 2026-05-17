import { setRequestLocale, getTranslations } from "next-intl/server";
import { LayoutGrid, Truck, Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CategoryCard } from "@/components/CategoryCard";
import { getAllCategories, getAllProducts } from "@/lib/data";

export const revalidate = 3600;

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("categories");
  const [cats, products] = await Promise.all([getAllCategories(), getAllProducts()]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} eyebrow={t("explore")} />

      <section className="container-page mt-6 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-xl sm:grid-cols-3">
          {[
            { Icon: LayoutGrid, value: String(cats.length), label: t("totalCategories") },
            { Icon: Package, value: "1,000+", label: t("productsAvailable") },
            { Icon: Truck, value: t("always"), label: t("freeShippingMany") },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-barn-50 text-barn-700">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              productCount={products.filter((p) => p.category_slug === c.slug).length}
            />
          ))}
        </div>
      </section>
    </>
  );
}
