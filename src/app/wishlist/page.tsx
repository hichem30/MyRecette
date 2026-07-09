import { setRequestLocale, getTranslations } from "@/lib/fr";
import { PageHeader } from "@/components/PageHeader";
import { WishlistGrid } from "@/components/WishlistGrid";
import { getAllProducts } from "@/lib/data";

export const revalidate = 60;

export default async function WishlistPage() {
  setRequestLocale("fr");
  const { t: wishlistT } = getTranslations("wishlist");
  const products = await getAllProducts();
  return (
    <>
      <PageHeader title={wishlistT("title")} eyebrow="ENREGISTRÉS POUR PLUS TARD" />
      <section className="container-page py-10">
        <WishlistGrid products={products} />
      </section>
    </>
  );
}
