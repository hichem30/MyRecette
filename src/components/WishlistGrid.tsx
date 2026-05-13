"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/CartProvider";
import { Link } from "@/lib/i18n/navigation";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

export function WishlistGrid({ products }: { products: Product[] }) {
  const t = useTranslations("wishlist");
  const { wishlist } = useCart();
  const items = products.filter((p) => wishlist.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
        <p className="text-neutral-500">{t("empty")}</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-barn-600 px-5 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
