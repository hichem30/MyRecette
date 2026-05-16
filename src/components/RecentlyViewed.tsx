"use client";

import { useLocale } from "next-intl";
import { useCart } from "@/lib/cart/CartProvider";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

export function RecentlyViewed({
  products,
  exclude,
}: {
  products: Product[];
  exclude?: string;
}) {
  const locale = useLocale() as "en" | "es";
  const { recent } = useCart();
  const map = new Map(products.map((p) => [p.id, p]));
  const items = recent
    .filter((id) => id !== exclude)
    .map((id) => map.get(id))
    .filter((p): p is Product => !!p)
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-white py-12">
      <div className="container-page">
        <h2 className="mb-6 font-serif text-2xl font-bold">
          {locale === "en" ? "Recently viewed" : "Visto recientemente"}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
