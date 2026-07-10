"use client";

import { useTranslations } from "@/lib/fr";
import { useCart } from "@/lib/cart/CartProvider";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";
import { EmptyState } from "./ErrorBoundary";

export function WishlistGrid({ products }: { products: Product[] }) {
  const t = useTranslations("wishlist");
  const { wishlist } = useCart();
  const items = products.filter((p) => wishlist.includes(p.id));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10 text-recette-600" />}
        title={t("empty")}
        description={t("emptyDescription")}
        action={
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-md bg-recette-600 px-5 py-2 text-sm font-bold text-white hover:bg-recette-700"
          >
            {t("emptyCta")}
          </Link>
        }
      />
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
