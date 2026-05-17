"use client";

import { Heart, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotal, saveForLater } = useCart();
  const locale = useLocale() as "en" | "es";
  const t = useTranslations("cart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState("");
  const [shipState, setShipState] = useState("");
  const [shipCity, setShipCity] = useState("");

  async function checkout() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          locale,
          promo_code: promo.trim() || undefined,
          ship_state: shipState.trim() ? shipState.trim().toUpperCase() : undefined,
          ship_city: shipCity.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      // Auth required — bounce to login with a redirect back to /products.
      if (res.status === 401 || data.auth_required) {
        const next = encodeURIComponent("/products");
        window.location.href = `/${locale}/login?next=${next}`;
        return;
      }
      // Server returned a structured error (e.g. 409 "Only 2 left").
      setError(typeof data.error === "string" ? data.error : t("checkoutError"));
    } catch {
      setError(t("checkoutError"));
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
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n) && n >= 1) updateQuantity(item.product_id, n);
                          }}
                          aria-label="Quantity"
                          className="w-12 border-x border-neutral-300 bg-transparent py-1 text-center text-sm outline-none focus:bg-neutral-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          aria-label="Increase"
                          className="p-1.5 hover:bg-neutral-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!saveForLater(item.product_id)) {
                              window.location.href = `/${locale}/login?next=${encodeURIComponent(`/${locale}/products`)}`;
                            }
                          }}
                          aria-label={locale === "en" ? "Save for later" : "Guardar para después"}
                          title={locale === "en" ? "Save for later" : "Guardar para después"}
                          className="text-neutral-400 hover:text-barn-700"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          aria-label={t("remove")}
                          title={t("remove")}
                          className="text-neutral-400 hover:text-barn-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                value={shipState}
                onChange={(e) => setShipState(e.target.value.slice(0, 2))}
                placeholder={locale === "en" ? "Ship-to state (e.g. OK)" : "Estado (ej. OK)"}
                aria-label="Shipping state"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm uppercase"
              />
              <input
                value={shipCity}
                onChange={(e) => setShipCity(e.target.value)}
                placeholder={locale === "en" ? "City (optional)" : "Ciudad (opcional)"}
                aria-label="Shipping city"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </div>
            <label className="mb-3 flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
              <Tag className="h-4 w-4 text-neutral-400" />
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                placeholder={locale === "en" ? "Promo code" : "Código promocional"}
                className="w-full bg-transparent outline-none"
              />
            </label>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600">{t("subtotal")}</span>
              <span className="font-bold text-neutral-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="mb-3 text-xs text-neutral-500">{t("calculatedAtCheckout")}</p>
            {error && (
              <div
                role="alert"
                className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
              >
                {error}
              </div>
            )}
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
