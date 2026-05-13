"use client";

import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import type { Product } from "@/lib/types";

export function ProductCTAs({ product }: { product: Product }) {
  const t = useTranslations("common");
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const fav = isInWishlist(product.id);
  const [qty, setQty] = useState(1);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border border-neutral-300">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease"
          className="p-2 hover:bg-neutral-50"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={qty}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n) && n >= 1) setQty(n);
            else if (e.target.value === "") setQty(1);
          }}
          aria-label="Quantity"
          className="w-14 border-x border-neutral-300 bg-transparent py-2 text-center text-sm font-medium outline-none focus:bg-neutral-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase"
          className="p-2 hover:bg-neutral-50"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => addItem(product, qty)}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-barn-600 px-6 py-3 text-sm font-bold text-white hover:bg-barn-700 transition"
      >
        <ShoppingCart className="h-4 w-4" />
        {t("addToCart")}
      </button>

      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-label="Toggle wishlist"
        className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${
          fav
            ? "border-barn-600 bg-barn-50 text-barn-700"
            : "border-neutral-300 text-neutral-500 hover:text-barn-700"
        }`}
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
