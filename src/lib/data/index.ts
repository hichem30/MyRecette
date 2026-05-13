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
    if (error || !data) return mockCategories;
    return data as Category[];
  } catch {
    return mockCategories;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getAllCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return mockProducts;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return mockProducts;
    return data as Product[];
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
