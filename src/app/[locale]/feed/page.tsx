import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ShoppingBag, Tag, TrendingUp, Users, Ticket, Package, Briefcase } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getFollowedSupermarkets, getUserFeed } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";
import type { SupermarketFeedItem, SupermarketProfile } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrecette.com";
  const url = `${base}/${lang}/feed`;
  
  return {
    title: `Your Feed — My Recette`,
    description: "Stay updated with the latest products, coupons, and offers from supermarkets you follow.",
    alternates: { canonical: url },
    openGraph: {
      title: `Your Feed — My Recette`,
      description: "Stay updated with the latest products, coupons, and offers from supermarkets you follow.",
      url,
      siteName: "My Recette",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Your Feed — My Recette`,
      description: "Stay updated with the latest products, coupons, and offers from supermarkets you follow.",
    },
  };
}

// Feed item icon mapping
const feedIcons: Record<string, React.ReactNode> = {
  new_product: <ShoppingBag className="h-5 w-5" />,
  price_change: <TrendingUp className="h-5 w-5" />,
  sale_start: <Tag className="h-5 w-5" />,
  coupon_added: <Ticket className="h-5 w-5" />,
  bundle_added: <Package className="h-5 w-5" />,
  job_posted: <Briefcase className="h-5 w-5" />,
};

// Feed item label mapping
const feedLabels: Record<string, { en: string; es: string }> = {
  new_product: { en: "New Product", es: "Producto Nuevo" },
  price_change: { en: "Price Change", es: "Cambio de Precio" },
  sale_start: { en: "Sale Started", es: "Oferta Iniciada" },
  coupon_added: { en: "New Coupon", es: "Nuevo Cupón" },
  bundle_added: { en: "New Bundle", es: "Nuevo Paquete" },
  job_posted: { en: "Job Posted", es: "Empleo Publicado" },
};

// Format date relative to now
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}

// Feed item component
default function FeedItem({ item, lang }: { item: SupermarketFeedItem; lang: "en" | "es" }) {
  const type = item.type;
  const icon = feedIcons[type] || <ShoppingBag className="h-5 w-5" />;
  const label = feedLabels[type]?.[lang] || type;
  
  return (
    <article className="flex gap-4 p-4 rounded-lg border border-neutral-200 hover:shadow-sm transition-shadow">
      {/* Supermarket Avatar */}
      <div className="flex-shrink-0">
        {item.supermarket?.profile_picture_url ? (
          <img
            src={item.supermarket.profile_picture_url}
            alt={item.supermarket.supermarket_name[lang] || "Supermarket"}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-barn-100 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-barn-600" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-900">
            {item.supermarket?.supermarket_name?.[lang] || item.supermarket?.supermarket_name?.en || "Supermarket"}
          </span>
          <span className="flex items-center gap-1 text-neutral-500 text-sm">
            {icon}
            <span>{label}</span>
          </span>
          <span className="text-neutral-500 text-sm">
            {formatRelativeDate(item.created_at)}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-neutral-900 mt-1">
          {item.title[lang] || item.title.en}
        </h3>
        
        {/* Description */}
        {item.description && (
          <p className="text-neutral-600 text-sm mt-1">
            {item.description[lang] || item.description.en}
          </p>
        )}
        
        {/* Image */}
        {item.image_url && (
          <div className="mt-3">
            <img
              src={item.image_url}
              alt={item.title[lang] || item.title.en || ""}
              className="w-full max-w-md rounded-lg object-cover aspect-video"
            />
          </div>
        )}
        
        {/* Action Button */}
        <div className="mt-3">
          <Link
            href={item.action_url}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-barn-50 text-barn-700 hover:bg-barn-100 text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

// Supermarket card for sidebar
function SupermarketCard({ supermarket, lang }: { supermarket: SupermarketProfile; lang: "en" | "es" }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
      {supermarket.profile_picture_url ? (
        <img
          src={supermarket.profile_picture_url}
          alt={supermarket.supermarket_name[lang] || "Supermarket"}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-barn-100 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-5 w-5 text-barn-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-neutral-900 truncate">
          {supermarket.supermarket_name[lang] || supermarket.supermarket_name.en}
        </h4>
        <p className="text-sm text-neutral-500 truncate">
          {supermarket.description?.[lang] || supermarket.description?.en || ""}
        </p>
      </div>
    </div>
  );
}

export default async function UserFeedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const lang = locale as "en" | "es";
  const t = await getTranslations("common");
  
  // Get current user
  const sb = getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  
  if (!user) {
    redirect(`/${lang}/login?from=/feed`);
  }
  
  // Fetch feed and followed supermarkets
  const [feedItems, followedSupermarkets] = await Promise.all([
    getUserFeed(user.id),
    getFollowedSupermarkets(user.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900">
            Your Feed
          </h1>
          <p className="text-neutral-600 mt-1">
            Stay updated with supermarkets you follow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">
            {followedSupermarkets.length} {followedSupermarkets.length === 1 ? "supermarket" : "supermarkets"} followed
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Items */}
        <div className="lg:col-span-2 space-y-4">
          {feedItems.length > 0 ? (
            feedItems.map((item) => (
              <FeedItem key={item.id} item={item} lang={lang} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                <Users className="h-8 w-8 text-neutral-500" />
              </div>
              <h3 className="font-semibold text-neutral-900">No updates yet</h3>
              <p className="text-neutral-600 mt-1">
                Follow supermarkets to see their latest products, coupons, and offers in your feed.
              </p>
              <Link
                href={`/${lang}/supermarkets`}
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-md bg-barn-600 text-white hover:bg-barn-700 font-semibold transition-colors"
              >
                Discover Supermarkets
              </Link>
            </div>
          )}
        </div>
        
        {/* Sidebar - Followed Supermarkets */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Following
            </h3>
            {followedSupermarkets.length > 0 ? (
              <div className="space-y-3">
                {followedSupermarkets.map((supermarket) => (
                  <SupermarketCard
                    key={supermarket.id}
                    supermarket={supermarket}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 text-sm">
                  You are not following any supermarkets yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
