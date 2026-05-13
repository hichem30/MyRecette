"use client";

import { Heart, ShoppingCart, Truck } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const locale = useLocale() as "en" | "es";
  const t = useTranslations("common");
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const fav = isInWishlist(product.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card transition hover:shadow-lg">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-neutral-100"
      >
        <Image
          src={product.image_url}
          alt={product.name[locale]}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            {product.new_arrival && (
              <span className="rounded-md bg-barn-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                {t("new")}
              </span>
            )}
            {product.discount && product.discount_text && (
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                {product.discount_text[locale]}
              </span>
            )}
          </div>
          {product.best_seller && (
            <span className="rounded-md bg-neutral-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t("bestSeller")}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-barn-600">
          {product.category_slug.replace(/-/g, " ")}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
          <Link href={`/products/${product.slug}`} className="hover:text-barn-700">
            {product.name[locale]}
          </Link>
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-neutral-900">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
        {product.discount && product.original_price && (
          <p className="text-xs font-medium text-emerald-700">
            {t("you_save")} {formatPrice(product.original_price - product.price)}
          </p>
        )}
        {product.free_shipping && (
          <p className="flex items-center gap-1 text-xs font-medium text-blue-600">
            <Truck className="h-3 w-3" /> {t("freeShipping")}
          </p>
        )}

        {!compact && (
          <div className="mt-auto flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => addItem(product)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-barn-600 px-3 py-2 text-sm font-medium text-white hover:bg-barn-700 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("addToCart")}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                fav
                  ? "border-barn-600 bg-barn-50 text-barn-700"
                  : "border-neutral-300 text-neutral-500 hover:text-barn-700"
              }`}
            >
              <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
