"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AccountHome() {
  const locale = useLocale() as "en" | "es" | "fr" | "ar";
  const [profile, setProfile] = useState<{ email: string | null; name: string | null; joined: string | null }>({
    email: null,
    name: null,
    joined: null,
  });
  const [stats, setStats] = useState<{ orders: number; wishlist: number; shoppingLists: number; videos: number }>({ orders: 0, wishlist: 0, shoppingLists: 0, videos: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [marketingOptin, setMarketingOptin] = useState(false);
  const [savingOptin, setSavingOptin] = useState(false);
  const [optinFeedback, setOptinFeedback] = useState<string | null>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    let cancelled = false;
    async function load() {
      const { data: userData } = await sb.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      setUserId(user.id);
      const meta = user.user_metadata ?? {};
      const { data: profileRow } = await sb
        .from("profiles")
        .select("marketing_optin")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setMarketingOptin(!!profileRow?.marketing_optin);
      setProfile({
        email: user.email ?? null,
        name:
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null,
        joined: user.created_at ?? null,
      });
      const [{ count: o }, { count: w }, { count: sl }, { data: videos, count: v }] = await Promise.all([
        sb.from("orders").select("id", { count: "exact", head: true }).ilike("customer_email", user.email ?? ""),
        sb.from("wishlists").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("shopping_lists").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("recipe_videos").select("*, profiles:user_id(id, email, supermarket_name, profile_picture_url), recipes:recipe_id(id, slug, title)", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_approved", true)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);
      if (!cancelled) {
        setStats({ orders: o ?? 0, wishlist: w ?? 0, shoppingLists: sl ?? 0, videos: v ?? 0 });
        setUserVideos(videos || []);
      }
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
      shoppingLists: "Shopping Lists",
      videos: "My Videos",
      memberSince: "Member since",
      viewOrders: "View order history",
      viewWishlist: "Open wishlist",
      viewShoppingLists: "Manage shopping lists",
      viewVideos: "View my videos",
      preferences: "Email preferences",
      marketingLabel: "Send me promotions, discounts, and new arrival emails.",
      marketingHelp: "You can change this anytime. We will only email you about Red Barn sales — never share your address.",
      saved: "Preference saved.",
    },
    es: {
      title: "Mi Cuenta",
      welcome: "Bienvenido de nuevo",
      orders: "Pedidos",
      wishlist: "Artículos guardados",
      shoppingLists: "Listas de compras",
      videos: "Mis videos",
      memberSince: "Miembro desde",
      viewOrders: "Ver historial de pedidos",
      viewWishlist: "Abrir favoritos",
      viewShoppingLists: "Gestionar listas de compras",
      viewVideos: "Ver mis videos",
      preferences: "Preferencias de correo",
      marketingLabel: "Quiero recibir promociones, descuentos y novedades por correo.",
      marketingHelp: "Puede cambiarlo en cualquier momento. Solo le escribiremos sobre ofertas de Red Barn.",
      saved: "Preferencia guardada.",
    },
    fr: {
      title: "Mon Compte",
      welcome: "Bienvenue",
      orders: "Commandes",
      wishlist: "Articles en liste de souhaits",
      shoppingLists: "Listes de courses",
      videos: "Mes Vidéos",
      memberSince: "Membre depuis",
      viewOrders: "Voir l'historique des commandes",
      viewWishlist: "Ouvrir la liste de souhaits",
      viewShoppingLists: "Gérer les listes de courses",
      viewVideos: "Voir mes vidéos",
      preferences: "Préférences email",
      marketingLabel: "Envoyez-moi des promotions, des réductions et des emails de nouveaux arrivages.",
      marketingHelp: "Vous pouvez changer cela à tout moment. Nous ne vous enverrons des emails que sur les soldes de Red Barn.",
      saved: "Préférence enregistrée.",
    },
    ar: {
      title: "حسابي",
      welcome: "مرحبًا بعودتك",
      orders: "الطلبات",
      wishlist: "عناصر قائمة الرغبات",
      shoppingLists: "قوائم المشتريات",
      videos: "فيديوهاتي",
      memberSince: "عضو منذ",
      viewOrders: "عرض تاريخ الطلبات",
      viewWishlist: "فتح قائمة الرغبات",
      viewShoppingLists: "إدارة قوائم المشتريات",
      viewVideos: "عرض فيديوهاتي",
      preferences: "تفضيلات البريد الإلكتروني",
      marketingLabel: "أرسل لي العروض الترويجية والخصومات والبريد الإلكتروني للوافدين الجدد.",
      marketingHelp: "يمكنك تغيير هذا في أي وقت. سنرسل لك رسائل بريد إلكتروني حول مبيعات Red Barn فقط.",
      saved: "تم حفظ التفضيل.",
    },
  }[locale];

  async function toggleMarketing(next: boolean) {
    if (!userId || !isSupabaseConfigured()) return;
    setSavingOptin(true);
    setOptinFeedback(null);
    const prev = marketingOptin;
    setMarketingOptin(next);
    const sb = getSupabaseBrowserClient();
    const { error } = await sb
      .from("profiles")
      .update({ marketing_optin: next })
      .eq("id", userId);
    setSavingOptin(false);
    if (error) {
      setMarketingOptin(prev);
      setOptinFeedback(error.message);
    } else {
      setOptinFeedback(labels.saved);
      setTimeout(() => setOptinFeedback(null), 2000);
    }
  }

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

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.orders}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.orders}</p>
          <Link
            href="/account/orders"
            className="mt-2 inline-block text-xs font-semibold text-recette-700 hover:underline"
          >
            {labels.viewOrders} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.wishlist}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.wishlist}</p>
          <Link
            href="/account/wishlist"
            className="mt-2 inline-block text-xs font-semibold text-recette-700 hover:underline"
          >
            {labels.viewWishlist} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.shoppingLists}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.shoppingLists}</p>
          <Link
            href="/account/shopping-lists"
            className="mt-2 inline-block text-xs font-semibold text-recette-700 hover:underline"
          >
            {labels.viewShoppingLists} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.videos}</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{stats.videos}</p>
          <Link
            href="/account/videos"
            className="mt-2 inline-block text-xs font-semibold text-recette-700 hover:underline"
          >
            {labels.viewVideos} →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{labels.memberSince}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{joinedStr}</p>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
          {labels.preferences}
        </h2>
        <label className="mt-3 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptin}
            disabled={savingOptin || !userId}
            onChange={(e) => toggleMarketing(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300 accent-recette-600"
          />
          <span>
            <span className="block text-sm font-semibold text-neutral-800">
              {labels.marketingLabel}
            </span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              {labels.marketingHelp}
            </span>
          </span>
        </label>
        {optinFeedback && (
          <p className="mt-2 text-xs text-emerald-700">{optinFeedback}</p>
        )}
      </section>
    </div>
  );
}
