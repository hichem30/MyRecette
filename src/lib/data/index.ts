/**
 * Unified data layer.
 *
 * If the Supabase env vars are set, every getter goes to the live database.
 * Otherwise, we fall back to the bundled mock data so the site stays fully
 * functional during development / preview before the user wires up their
 * Supabase project.
 *
 * Every fetcher is wrapped in React `cache()` so that within a single render
 * (e.g. one home-page request) we only hit Supabase once for products and
 * once for categories — keeping us well under the Cloudflare free-tier 10ms
 * CPU budget per request.
 */
import { cache } from "react";
import { Category, Product } from "../types";
import { mockCategories, mockProducts } from "./mock-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "../supabase/server";
import { isDiscountWindowActive } from "../utils";

/**
 * If a product's own discount window has expired (or hasn't started yet),
 * revert price back to original_price so customers don't see / pay a stale
 * sale price.
 */
function applyTimeWindowedDiscounts(products: Product[]): Product[] {
  return products.map((p) => {
    if (!p.discount) return p;
    const inWindow = isDiscountWindowActive(p.discount_starts_at, p.discount_ends_at);
    if (inWindow) return p;
    if (p.original_price && p.original_price > p.price) {
      return { ...p, price: p.original_price, original_price: null, discount: false };
    }
    return { ...p, discount: false };
  });
}

/**
 * For each product, if its category has an active discount_percent within the
 * configured window, mark the product as discounted and lower the price so the
 * storefront badges + checkout totals reflect the sale automatically.
 */
function applyCategoryDiscounts(products: Product[], categories: Category[]): Product[] {
  const byCat = new Map(categories.map((c) => [c.slug, c]));
  return products.map((p) => {
    const cat = byCat.get(p.category_slug);
    if (!cat || !cat.discount_percent || cat.discount_percent <= 0) return p;
    if (!isDiscountWindowActive(cat.discount_starts_at, cat.discount_ends_at)) return p;
    const factor = (100 - cat.discount_percent) / 100;
    const newPrice = Math.round(p.price * factor * 100) / 100;
    if (newPrice >= p.price) return p;
    return {
      ...p,
      original_price: p.original_price ?? p.price,
      price: newPrice,
      discount: true,
      discount_text: p.discount_text ?? { en: `${cat.discount_percent}% OFF`, es: `${cat.discount_percent}% DESC` },
    };
  });
}

export const getAllCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return mockCategories;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name->>en", { ascending: true });
    if (error || !data || data.length === 0) return mockCategories;
    return data as Category[];
  } catch {
    return mockCategories;
  }
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getAllCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

/**
 * Internal: raw fetch, cached per render. Variants that need draft rows pass
 * `includeUnpublished` and reuse the same cached payload by filtering after.
 */
const getAllProductsRaw = cache(
  async (): Promise<{ products: Product[]; categories: Category[] }> => {
    if (!isSupabaseConfigured()) return { products: mockProducts, categories: mockCategories };
    try {
      const supabase = await getSupabaseServerClient();
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*"),
      ]);
      if (productsRes.error || !productsRes.data || productsRes.data.length === 0) {
        return { products: mockProducts, categories: mockCategories };
      }
      const products = productsRes.data as Product[];
      const categories = (categoriesRes.data as Category[]) ?? [];
      return { products, categories };
    } catch {
      return { products: mockProducts, categories: mockCategories };
    }
  },
);

/**
 * @param includeUnpublished if true, returns draft products too (admin only).
 *   Default behaviour for the storefront filters them out client-side as well
 *   as via RLS, so this is mostly a belt-and-suspenders convenience.
 */
export async function getAllProducts(includeUnpublished = false): Promise<Product[]> {
  const { products, categories } = await getAllProductsRaw();
  const filtered = includeUnpublished ? products : products.filter((p) => p.published !== false);
  return applyCategoryDiscounts(applyTimeWindowedDiscounts(filtered), categories);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.featured);
}

export async function getNewArrivals(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.new_arrival);
}

export async function getDeals(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.discount);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.category_slug === slug);
}

// =====================================================================
// MY RECETTE: Supermarket Data Functions
// =====================================================================

import {
  SupermarketProfile,
  SupermarketProduct,
  SupermarketCoupon,
  SupermarketBundle,
  SupermarketSale,
  SupermarketJob,
  SupermarketFeedItem,
} from "../types";

// Mock data for development
export const mockSupermarkets: SupermarketProfile[] = [
  {
    id: "sm-1",
    email: "info@freshmart.com",
    is_supermarket: true,
    supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
    description: {
      en: "Your neighborhood grocery store with fresh produce and quality products.",
      es: "Tu tienda de comestibles del barrio con productos frescos y de calidad.",
    },
    banner_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=80",
    address: {
      line1: "123 Main Street",
      line2: null,
      city: "San Francisco",
      state: "CA",
      postal_code: "94102",
      country: "USA",
    },
    location_geometry: null,
    phone: "+1-415-555-0123",
    website: "https://freshmart.com",
    social_links: {
      facebook: "https://facebook.com/freshmart",
      instagram: "https://instagram.com/freshmart",
      twitter: null,
      linkedin: null,
    },
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
    subscription_start_date: "2024-01-01T00:00:00Z",
    subscription_end_date: "2024-12-31T23:59:59Z",
    follower_count: 1250,
    is_followed: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
  {
    id: "sm-2",
    email: "hello@greengrocer.com",
    is_supermarket: true,
    supermarket_name: { en: "GreenGrocer Market", es: "Mercado GreenGrocer" },
    description: {
      en: "Organic and sustainable groceries for a healthier you.",
      es: "Productos orgánicos y sostenibles para una vida más saludable.",
    },
    banner_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80",
    address: {
      line1: "456 Oak Avenue",
      line2: "Suite 100",
      city: "San Francisco",
      state: "CA",
      postal_code: "94103",
      country: "USA",
    },
    location_geometry: null,
    phone: "+1-415-555-0456",
    website: "https://greengrocer.com",
    social_links: {
      facebook: null,
      instagram: "https://instagram.com/greengrocer",
      twitter: "https://twitter.com/greengrocer",
      linkedin: null,
    },
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
    subscription_start_date: "2024-02-01T00:00:00Z",
    subscription_end_date: "2025-01-31T23:59:59Z",
    follower_count: 890,
    is_followed: false,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-07-02T00:00:00Z",
  },
];

export const mockSupermarketProducts: SupermarketProduct[] = [
  {
    id: "sp-1",
    supermarket_id: "sm-1",
    product_id: "p-1",
    price: 5.99,
    original_price: 7.99,
    stock: 100,
    is_available: true,
    supermarket_sku: "FR-001",
    supermarket_barcode: "123456789012",
    location_in_store: "Aisle 1",
    product: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
];

export const mockSupermarketCoupons: SupermarketCoupon[] = [
  {
    id: "c-1",
    supermarket_id: "sm-1",
    code: "SAVE20",
    description: { en: "20% off your first order", es: "20% de descuento en tu primer pedido" },
    discount_type: "percent",
    discount_value: 20,
    min_purchase_amount: 50,
    max_uses: 100,
    uses_count: 45,
    starts_at: "2024-07-01T00:00:00Z",
    ends_at: "2024-07-31T23:59:59Z",
    active: true,
    products_eligible: null,
    categories_eligible: null,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
];

export const mockSupermarketBundles: SupermarketBundle[] = [
  {
    id: "b-1",
    supermarket_id: "sm-1",
    name: { en: "Breakfast Bundle", es: "Pack de Desayuno" },
    description: { en: "Everything you need for a perfect breakfast", es: "Todo lo que necesitas para un desayuno perfecto" },
    bundle_price: 24.99,
    original_price: 32.99,
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    product_ids: ["p-1", "p-2", "p-3"],
    products: null,
    starts_at: "2024-07-01T00:00:00Z",
    ends_at: "2024-07-31T23:59:59Z",
    active: true,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
];

export const mockSupermarketSales: SupermarketSale[] = [
  {
    id: "s-1",
    supermarket_id: "sm-1",
    name: { en: "Summer Sale", es: "Venta de Verano" },
    description: { en: "Up to 50% off on selected items", es: "Hasta 50% de descuento en artículos seleccionados" },
    discount_percent: 50,
    applies_to_product_ids: null,
    applies_to_category_slugs: ["groceries"],
    starts_at: "2024-07-01T00:00:00Z",
    ends_at: "2024-07-31T23:59:59Z",
    active: true,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
];

export const mockSupermarketJobs: SupermarketJob[] = [
  {
    id: "j-1",
    supermarket_id: "sm-1",
    title: { en: "Cashier", es: "Cajero" },
    description: { en: "We are looking for friendly cashiers to join our team.", es: "Buscamos cajeros amigables para unirte a nuestro equipo." },
    position_type: "part_time",
    salary_range: { en: "$15-20/hour", es: "$15-20/hora" },
    requirements: ["Previous retail experience preferred", "Excellent customer service skills"],
    benefits: ["Flexible hours", "Employee discounts"],
    contact_email: "jobs@freshmart.com",
    contact_phone: "+1-415-555-0124",
    application_url: null,
    application_email: "jobs@freshmart.com",
    active: true,
    starts_at: "2024-07-01T00:00:00Z",
    ends_at: null,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
];

export const mockSupermarketFeed: SupermarketFeedItem[] = [
  {
    id: "f-1",
    supermarket_id: "sm-1",
    type: "sale_start",
    entity_id: "s-1",
    title: { en: "Summer Sale Started!", es: "¡Comenzó la Venta de Verano!" },
    description: { en: "Get up to 50% off on groceries", es: "Obtenga hasta 50% de descuento en comestibles" },
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80",
    action_url: "/en/supermarkets/sm-1?tab=sales",
    created_at: "2024-07-01T10:00:00Z",
    supermarket: {
      id: "sm-1",
      supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
      profile_picture_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=80",
    },
  },
];

export const getAllSupermarkets = cache(async (): Promise<SupermarketProfile[]> => {
  if (!isSupabaseConfigured()) return mockSupermarkets;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, is_supermarket, supermarket_name, description, banner_url, profile_picture_url, " +
        "address, location_geometry, phone, website, social_links, opening_hours, category_tags, " +
        "subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at"
      )
      .eq("is_supermarket", true)
      .order("created_at", { ascending: false });
    
    if (error || !data) return mockSupermarkets;
    
    // Add follower count (would need a separate query or RLS policy)
    const supermarkets = data as unknown as SupermarketProfile[];
    return supermarkets.map(sm => ({
      ...sm,
      follower_count: 0,
      is_followed: false,
    }));
  } catch {
    return mockSupermarkets;
  }
});

export async function getSupermarketById(id: string, userId?: string): Promise<SupermarketProfile | null> {
  const all = await getAllSupermarkets();
  const supermarket = all.find((s) => s.id === id);
  if (!supermarket) return null;
  
  // If user is logged in, check if they follow this supermarket
  if (userId) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: followData, error: followError } = await supabase
        .from("supermarket_follows")
        .select("id")
        .eq("user_id", userId)
        .eq("supermarket_id", id)
        .maybeSingle();
      
      if (!followError && followData) {
        return { ...supermarket, is_followed: true };
      }
    } catch {}
  }
  
  return { ...supermarket, is_followed: false };
}

export async function getSupermarketProducts(supermarketId: string): Promise<SupermarketProduct[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarketProducts.filter((sp) => sp.supermarket_id === supermarketId);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_products")
      .select(
        "id, supermarket_id, product_id, price, original_price, stock, is_available, " +
        "supermarket_sku, supermarket_barcode, location_in_store, created_at, updated_at, " +
        "products(*)"
      )
      .eq("supermarket_id", supermarketId)
      .eq("is_available", true)
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    return data as unknown as SupermarketProduct[];
  } catch {
    return [];
  }
}

export async function getSupermarketCoupons(supermarketId: string): Promise<SupermarketCoupon[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarketCoupons.filter((c) => c.supermarket_id === supermarketId);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_coupons")
      .select("*")
      .eq("supermarket_id", supermarketId)
      .eq("active", true)
      .gte("ends_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    return data as unknown as SupermarketCoupon[];
  } catch {
    return [];
  }
}

export async function getSupermarketBundles(supermarketId: string): Promise<SupermarketBundle[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarketBundles.filter((b) => b.supermarket_id === supermarketId);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_bundles")
      .select("*")
      .eq("supermarket_id", supermarketId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    return data as unknown as SupermarketBundle[];
  } catch {
    return [];
  }
}

export async function getSupermarketSales(supermarketId: string): Promise<SupermarketSale[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarketSales.filter((s) => s.supermarket_id === supermarketId);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_sales")
      .select("*")
      .eq("supermarket_id", supermarketId)
      .eq("active", true)
      .gte("ends_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    return data as unknown as SupermarketSale[];
  } catch {
    return [];
  }
}

export async function getSupermarketJobs(supermarketId: string): Promise<SupermarketJob[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarketJobs.filter((j) => j.supermarket_id === supermarketId);
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_jobs")
      .select("*")
      .eq("supermarket_id", supermarketId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    return data as unknown as SupermarketJob[];
  } catch {
    return [];
  }
}

export async function getUserFeed(userId: string): Promise<SupermarketFeedItem[]> {
  if (!isSupabaseConfigured()) return mockSupermarketFeed;
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get followed supermarket IDs
    const { data: follows, error: followsError } = await supabase
      .from("supermarket_follows")
      .select("supermarket_id")
      .eq("user_id", userId);
    
    if (followsError || !follows || follows.length === 0) return [];
    
    const supermarketIds = follows.map(f => f.supermarket_id);
    
    // Get feed items from followed supermarkets
    const { data, error } = await supabase
      .from("supermarket_feed")
      .select(
        "id, supermarket_id, type, entity_id, title, description, image_url, action_url, created_at, " +
        "profiles:supermarket_id(id, supermarket_name, profile_picture_url)"
      )
      .in("supermarket_id", supermarketIds)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error || !data) return [];
    return data as unknown as SupermarketFeedItem[];
  } catch {
    return [];
  }
}

export async function getFollowedSupermarkets(userId: string): Promise<SupermarketProfile[]> {
  if (!isSupabaseConfigured()) {
    return mockSupermarkets.map((sm) => ({ ...sm, is_followed: true }));
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("supermarket_follows")
      .select(
        "supermarket:supermarket_id(id, email, is_supermarket, supermarket_name, description, " +
        "banner_url, profile_picture_url, address, phone, website, social_links, opening_hours, " +
        "category_tags, subscription_status, created_at, updated_at)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error || !data) return [];
    
    return (data as unknown as any[]).map((d: any) => ({
      ...(d.supermarket as unknown as Omit<SupermarketProfile, 'follower_count' | 'is_followed'>),
      follower_count: 0,
      is_followed: true,
    }));
  } catch {
    return [];
  }
}

// Recipe Videos Functions
import type { RecipeVideo } from "../types";

export async function getRecipeVideos(recipeSlug: string): Promise<RecipeVideo[]> {
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return [
      {
        id: "v-1",
        recipe_id: "r-1",
        user_id: "user-1",
        platform: "youtube",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: { en: "My Spaghetti Bolognese" },
        youtube_video_id: "dQw4w9WgXcQ",
        thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        like_count: 42,
        comment_count: 0,
        share_count: 0,
        view_count: 1567,
        is_approved: true,
        status: "approved",
        created_at: "2024-06-01T10:00:00Z",
        updated_at: "2024-06-01T10:00:00Z",
        user: {
          id: "user-1",
          email: "homechef@example.com",
          supermarket_name: null,
          profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
        },
      },
      {
        id: "v-2",
        recipe_id: "r-1",
        user_id: "user-2",
        platform: "youtube",
        video_url: "https://www.youtube.com/watch?v=9bZkp7q19s4",
        title: { en: "Grandma's Special Bolognese" },
        youtube_video_id: "9bZkp7q19s4",
        thumbnail_url: "https://img.youtube.com/vi/9bZkp7q19s4/mqdefault.jpg",
        like_count: 89,
        comment_count: 0,
        share_count: 0,
        view_count: 3421,
        is_approved: true,
        status: "approved",
        created_at: "2024-06-15T14:00:00Z",
        updated_at: "2024-06-15T14:00:00Z",
        user: {
          id: "user-2",
          email: "grandma@family.com",
          supermarket_name: null,
          profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        },
      },
    ];
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .eq("slug", recipeSlug)
      .single();

    if (error || !data) {
      return [];
    }

    const { data: videos, error: videosError } = await supabase
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, video_url, title, description, youtube_video_id, thumbnail_url, " +
        "duration_seconds, like_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .eq("recipe_id", data.id)
      .eq("is_approved", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (videosError || !videos) {
      return [];
    }

    return videos as unknown as RecipeVideo[];
  } catch {
    return [];
  }
}

export async function getUserRecipeVideos(userId: string): Promise<RecipeVideo[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, video_url, title, description, youtube_video_id, thumbnail_url, " +
        "duration_seconds, like_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url), " +
        "recipes:recipe_id(id, slug, title)"
      )
      .eq("user_id", userId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as unknown as RecipeVideo[];
  } catch {
    return [];
  }
}
