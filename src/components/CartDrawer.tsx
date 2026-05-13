"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotal } = useCart();
  const locale = useLocale() as "en" | "es";
  const t = useTranslations("cart");
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            name: i.name[locale],
            price: i.price,
            quantity: i.quantity,
            image_url: i.image_url,
          })),
          locale,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local.");
      }
    } catch {
      alert("Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> {t("title")}
          </h2>
          <button onClick={closeCart} aria-label="Close" className="rounded-full p-1 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-neutral-500">
            <ShoppingBag className="h-10 w-10 text-neutral-300" />
            <p>{t("empty")}</p>
            <Link
              href="/products"
              onClick={closeCart}
              className="mt-2 rounded-md bg-barn-600 px-4 py-2 text-sm font-medium text-white hover:bg-barn-700"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product_id} className="flex gap-3">
                  <div className="relative h-20 w-20 flex-none overflow-hidden rounded-md bg-neutral-100">
                    <Image
                      src={item.image_url}
                      alt={item.name[locale]}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-neutral-900 hover:text-barn-700"
                      onClick={closeCart}
                    >
                      {item.name[locale]}
                    </Link>
                    <span className="mt-0.5 text-sm font-bold text-neutral-900">
                      {formatPrice(item.price)}
                    </span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-md border border-neutral-300">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          aria-label="Decrease"
                          className="p-1.5 hover:bg-neutral-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[28px] text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          aria-label="Increase"
                          className="p-1.5 hover:bg-neutral-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        aria-label="Remove"
                        className="text-neutral-400 hover:text-barn-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600">{t("subtotal")}</span>
              <span className="font-bold text-neutral-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="mb-3 text-xs text-neutral-500">{t("calculatedAtCheckout")}</p>
            <button
              onClick={checkout}
              disabled={loading}
              className="w-full rounded-md bg-barn-600 px-4 py-3 text-sm font-bold text-white hover:bg-barn-700 transition disabled:opacity-50"
            >
              {loading ? "..." : t("checkout")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
