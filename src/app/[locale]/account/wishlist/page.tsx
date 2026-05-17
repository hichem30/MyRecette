"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WishlistGrid } from "@/components/WishlistGrid";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import { mockProducts } from "@/lib/data/mock-data";

export default function AccountWishlist() {
  const t = useTranslations("wishlist");
  const locale = useLocale() as "en" | "es";
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setProducts(mockProducts);
          return;
        }
        setProducts(data as Product[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {locale === "en"
          ? "Items you saved across all your devices."
          : "Artículos guardados en todos tus dispositivos."}
      </p>
      <div className="mt-5">
        {products === null ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center text-sm text-neutral-400">
            {locale === "en" ? "Loading…" : "Cargando…"}
          </div>
        ) : (
          <WishlistGrid products={products} />
        )}
      </div>
    </div>
  );
}
