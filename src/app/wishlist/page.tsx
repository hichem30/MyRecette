import { setRequestLocale, getTranslations } from "@/lib/fr";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { WishlistGrid } from "@/components/WishlistGrid";
import { getAllProducts } from "@/lib/data";
import { ProductGridSkeleton } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/ErrorBoundary";
import { Heart } from "lucide-react";

export const revalidate = 60;

export default async function WishlistPage() {
  setRequestLocale("fr");
  const { t: wishlistT } = getTranslations("wishlist");
  const products = await getAllProducts();
  return (
    <>
      <PageHeader title={wishlistT("title")} eyebrow="ENREGISTRÉS POUR PLUS TARD" />
      <section className="container-page py-10">
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <WishlistGrid products={products} />
        </Suspense>
      </section>
    </>
  );
}
