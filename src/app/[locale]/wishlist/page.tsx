import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { WishlistGrid } from "@/components/WishlistGrid";
import { getAllProducts } from "@/lib/data";

export const revalidate = 60;

export default async function WishlistPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("wishlist");
  const products = await getAllProducts();
  return (
    <>
      <PageHeader title={t("title")} eyebrow={locale === "en" ? "SAVED FOR LATER" : "GUARDADOS"} />
      <section className="container-page py-10">
        <WishlistGrid products={products} />
      </section>
    </>
  );
}
