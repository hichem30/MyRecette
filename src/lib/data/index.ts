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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return mockProducts;
    const rows = data as Product[];
    if (includeUnpublished) return rows;
    return rows.filter((p) => p.published !== false);
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
