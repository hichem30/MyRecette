import { setRequestLocale, getTranslations } from "next-intl/server";
import { WishlistGrid } from "@/components/WishlistGrid";
import { getAllProducts } from "@/lib/data";

export const revalidate = 60;

export default async function AccountWishlist({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("wishlist");
  const products = await getAllProducts();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {locale === "en"
          ? "Items you saved across all your devices."
          : "Artículos guardados en todos tus dispositivos."}
      </p>
      <div className="mt-5">
        <WishlistGrid products={products} />
      </div>
    </div>
  );
}
