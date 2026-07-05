"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin, Users, Clock, ShoppingCart } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SupermarketProfile } from "@/lib/types";

// Mock data for local development
const mockFollowedSupermarkets: SupermarketProfile[] = [
  {
    id: "sm-1",
    email: "info@freshmart.com",
    is_supermarket: true,
    supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
    description: { en: "Your neighborhood grocery store with fresh produce", es: "Tu tienda de comestibles del barrio con productos frescos" },
    banner_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=80",
    address: { line1: "123 Main Street", city: "San Francisco", state: "CA", postal_code: "94102", country: "USA" },
    location_geometry: null,
    phone: "+1-415-555-0123",
    opening_hours: [
      { day: "Monday", opens: "08:00", closes: "22:00", is_open: true },
      { day: "Tuesday", opens: "08:00", closes: "22:00", is_open: true },
      { day: "Wednesday", opens: "08:00", closes: "22:00", is_open: true },
      { day: "Thursday", opens: "08:00", closes: "22:00", is_open: true },
      { day: "Friday", opens: "08:00", closes: "22:00", is_open: true },
      { day: "Saturday", opens: "09:00", closes: "20:00", is_open: true },
      { day: "Sunday", opens: "10:00", closes: "18:00", is_open: true },
    ],
    category_tags: ["groceries", "fresh", "organic"],
    subscription_status: "active",
    follower_count: 1250,
    is_followed: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
  {
    id: "sm-2",
    email: "hello@greengrocer.com",
    is_supermarket: true,
    supermarket_name: { en: "GreenGrocer Market", es: "Mercado GreenGrocer" },
    description: { en: "Organic and sustainable groceries", es: "Productos orgánicos y sostenibles" },
    banner_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80",
    address: { line1: "456 Oak Avenue", city: "San Francisco", state: "CA", postal_code: "94103", country: "USA" },
    location_geometry: null,
    phone: "+1-415-555-0456",
    opening_hours: [
      { day: "Monday", opens: "07:00", closes: "21:00", is_open: true },
      { day: "Tuesday", opens: "07:00", closes: "21:00", is_open: true },
      { day: "Wednesday", opens: "07:00", closes: "21:00", is_open: true },
      { day: "Thursday", opens: "07:00", closes: "21:00", is_open: true },
      { day: "Friday", opens: "07:00", closes: "21:00", is_open: true },
      { day: "Saturday", opens: "08:00", closes: "19:00", is_open: true },
      { day: "Sunday", opens: "09:00", closes: "17:00", is_open: true },
    ],
    category_tags: ["organic", "sustainable", "eco-friendly"],
    subscription_status: "active",
    follower_count: 890,
    is_followed: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-07-02T00:00:00Z",
  },
];

// Helper to format opening hours
function formatOpeningHours(hours: SupermarketProfile["opening_hours"] | null | undefined, lang: "en" | "es"): string {
  if (!hours || hours.length === 0) return lang === "en" ? "Not specified" : "No especificado";
  
  const days = hours.map((h) => {
    const dayNames: Record<string, { en: string; es: string }> = {
      Monday: { en: "Mon", es: "Lun" },
      Tuesday: { en: "Tue", es: "Mar" },
      Wednesday: { en: "Wed", es: "Mié" },
      Thursday: { en: "Thu", es: "Jue" },
      Friday: { en: "Fri", es: "Vie" },
      Saturday: { en: "Sat", es: "Sáb" },
      Sunday: { en: "Sun", es: "Dom" },
    };
    const dayName = dayNames[h.day]?.[lang] || h.day;
    return `${dayName} ${h.opens}-${h.closes}`;
  });
  
  return days.join(", ");
}

// Supermarket card component
function SupermarketCard({ supermarket, lang }: { supermarket: SupermarketProfile; lang: "en" | "es" }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/${lang}/supermarkets/${supermarket.id}`} className="block">
        {supermarket.banner_url ? (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={supermarket.banner_url}
              alt={supermarket.supermarket_name[lang] || supermarket.supermarket_name.en || "Supermarket"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-barn-100 to-barn-200 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-barn-400" />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {supermarket.profile_picture_url ? (
              <img
                src={supermarket.profile_picture_url}
                alt={supermarket.supermarket_name[lang] || supermarket.supermarket_name.en || "Supermarket"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-barn-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-barn-600" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 group-hover:text-barn-700 truncate">
                {supermarket.supermarket_name[lang] || supermarket.supermarket_name.en}
              </h3>
              <p className="text-sm text-neutral-600 line-clamp-1">
                {supermarket.description?.[lang] || supermarket.description?.en}
              </p>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {supermarket.address?.city}, {supermarket.address?.state}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {supermarket.follower_count?.toLocaleString() || "0"} {lang === "en" ? "followers" : "seguidores"}
                </span>
              </div>
              
              <p className="text-xs text-neutral-500 mt-1">
                <Clock className="h-3.5 w-3.5 inline" /> {formatOpeningHours(supermarket.opening_hours, lang)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-barn-600">
              {supermarket.subscription_status === "active" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  ✓ Verified
                </span>
              )}
            </span>
            <Link
              href={`/${lang}/supermarkets/${supermarket.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-barn-50 text-barn-700 hover:bg-barn-100 text-sm font-medium transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {lang === "en" ? "Shop Now" : "Comprar"}
            </Link>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function AccountFollowedSupermarkets() {
  const t = useTranslations("account");
  const locale = useLocale() as "en" | "es";
  const [supermarkets, setSupermarkets] = useState<SupermarketProfile[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    if (!isSupabaseConfigured()) {
      setSupermarkets(mockFollowedSupermarkets);
      setLoading(false);
      return;
    }

    const sb = getSupabaseBrowserClient();
    
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // Get user's followed supermarket IDs
      const { data: followsData, error: followsError } = await sb
        .from("supermarket_follows")
        .select("supermarket_id")
        .eq("user_id", user.id);

      if (followsError || !followsData || cancelled) {
        setLoading(false);
        return;
      }

      const supermarketIds = followsData.map((f) => f.supermarket_id);
      
      if (supermarketIds.length === 0) {
        setSupermarkets([]);
        setLoading(false);
        return;
      }

      // Get supermarket details
      const { data: supermarketsData, error: supermarketsError } = await sb
        .from("profiles")
        .select(
          "id, email, is_supermarket, supermarket_name, description, banner_url, profile_picture_url, " +
          "address, location_geometry, phone, website, social_links, opening_hours, category_tags, " +
          "subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at"
        )
        .in("id", supermarketIds)
        .eq("is_supermarket", true)
        .order("created_at", { ascending: false });

      if (supermarketsError || !supermarketsData || cancelled) {
        setLoading(false);
        return;
      }

      // Add follower count and mark as followed
      const supermarketsWithData = await Promise.all(
        supermarketsData.map(async (sm) => {
          const { count: followers } = await sb
            .from("supermarket_follows")
            .select("*", { count: "exact", head: true })
            .eq("supermarket_id", sm.id);
          
          return {
            ...sm,
            follower_count: followers ?? 0,
            is_followed: true,
          } as SupermarketProfile;
        })
      );

      setSupermarkets(supermarketsWithData);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">
        {locale === "en" ? "Followed Supermarkets" : "Supermercados Seguidos"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {locale === "en"
          ? "Supermarkets you follow to stay updated on their products and deals."
          : "Supermercados que sigues para mantenerte actualizado sobre sus productos y ofertas."}
      </p>
      
      <div className="mt-5">
        {loading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center text-sm text-neutral-400">
            {locale === "en" ? "Loading…" : "Cargando…"}
          </div>
        ) : supermarkets === null ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center text-sm text-neutral-400">
            {locale === "en" ? "Error loading supermarkets" : "Error al cargar supermercados"}
          </div>
        ) : supermarkets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <MapPin className="h-12 w-12 text-neutral-300" />
              <p className="text-sm text-neutral-500">
                {locale === "en"
                  ? "You're not following any supermarkets yet."
                  : "Aún no sigues ningún supermercado."}
              </p>
              <Link
                href={`/${locale}/supermarkets`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 text-sm font-medium transition-colors"
              >
                {locale === "en" ? "Discover Supermarkets" : "Descubrir Supermercados"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supermarkets.map((supermarket) => (
              <SupermarketCard key={supermarket.id} supermarket={supermarket} lang={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
