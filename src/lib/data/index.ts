/**
 * Unified data layer.
 *
 * If the Supabase env vars are set, every getter goes to the live database.
 * Otherwise, we fall back to the bundled mock data so the site stays fully
 * functional during development / preview before the user wires up their
 * Supabase project.
 */
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

export async function getAllCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return mockCategories;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name->>en", { ascending: true });
    if (error || !data || data.length === 0) return mockCategories;
    return data as Category[];
  } catch {
    return mockCategories;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getAllCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

/**
 * @param includeUnpublished if true, returns draft products too (admin only).
 *   Default behaviour for the storefront filters them out client-side as well
 *   as via RLS, so this is mostly a belt-and-suspenders convenience.
 */
export async function getAllProducts(includeUnpublished = false): Promise<Product[]> {
  if (!isSupabaseConfigured()) return mockProducts;
  try {
    const supabase = getSupabaseServerClient();
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    if (productsRes.error || !productsRes.data || productsRes.data.length === 0) return mockProducts;
    const rows = productsRes.data as Product[];
    const cats = (categoriesRes.data as Category[]) ?? [];
    const filtered = includeUnpublished ? rows : rows.filter((p) => p.published !== false);
    return applyCategoryDiscounts(applyTimeWindowedDiscounts(filtered), cats);
  } catch {
    return mockProducts;
  }
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
