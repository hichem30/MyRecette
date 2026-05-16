"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AccountHome() {
  const locale = useLocale() as "en" | "es";
  const [profile, setProfile] = useState<{ email: string | null; name: string | null; joined: string | null }>({
    email: null,
    name: null,
    joined: null,
  });
  const [stats, setStats] = useState<{ orders: number; wishlist: number }>({ orders: 0, wishlist: 0 });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    let cancelled = false;
    async function load() {
      const { data: userData } = await sb.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      const meta = user.user_metadata ?? {};
      setProfile({
        email: user.email ?? null,
        name:
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null,
        joined: user.created_at ?? null,
      });
      const [{ count: o }, { count: w }] = await Promise.all([
        sb.from("orders").select("id", { count: "exact", head: true }).eq("customer_email", user.email ?? ""),
        sb.from("wishlists").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (!cancelled) setStats({ orders: o ?? 0, wishlist: w ?? 0 });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const labels = {
    en: {
      title: "My Account",
      welcome: "Welcome back",
      orders: "Orders",
      wishlist: "Wishlist items",
      memberSince: "Member since",
      viewOrders: "View order history",
      viewWishlist: "Open wishlist",
    },
    es: {
      title: "Mi Cuenta",
      welcome: "Bienvenido de nuevo",
      orders: "Pedidos",
      wishlist: "Artículos guardados",
      memberSince: "Miembro desde",
      viewOrders: "Ver historial de pedidos",
      viewWishlist: "Abrir favoritos",
    },
  }[locale];

  const joinedStr = profile.joined
    ? new Date(profile.joined).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "long",
      })
    : "—";

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">{labels.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {labels.welcome}, <span className="font-semibold text-neutral-700">{profile.name ?? profile.email ?? "—"}</span>.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.orders}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.orders}</p>
          <Link
            href="/account/orders"
            className="mt-2 inline-block text-xs font-semibold text-barn-700 hover:underline"
          >
            {labels.viewOrders} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.wishlist}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.wishlist}</p>
          <Link
            href="/account/wishlist"
            className="mt-2 inline-block text-xs font-semibold text-barn-700 hover:underline"
          >
            {labels.viewWishlist} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.memberSince}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{joinedStr}</p>
        </div>
      </div>
    </div>
  );
}
