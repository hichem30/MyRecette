import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * PRODUCT NAMING SERVICE
 * 
 * This service completely eliminates the need for manual product translations.
 * All product names are stored in the database with French as the primary language.
 * 
 * KEY BENEFITS:
 * - No manual translation files (potato, tomato, etc.)
 * - Scalable to thousands of products
 * - Easy to add new languages later
 * - Products can have different names per supermarket/region
 */

// Cache for performance
const nameCache: Map<string, string> = new Map();
const batchCache: Map<string, Map<string, string>> = new Map();

/**
 * Get French name for a single product by SKU
 * Falls back to SKU if not found in database
 */
export async function getProductName(sku: string): Promise<string> {
  // Check cache first
  if (nameCache.has(sku)) {
    return nameCache.get(sku)!;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('name_fr, name, sku')
      .eq('sku', sku)
      .single();

    if (error) {
      console.warn(`Error fetching product name for SKU ${sku}:`, error.message);
      // Cache the fallback
      nameCache.set(sku, sku);
      return sku;
    }

    if (data) {
      const name = data.name_fr || data.name || data.sku;
      nameCache.set(sku, name);
      return name;
    }

    // Fallback to SKU
    nameCache.set(sku, sku);
    return sku;
  } catch (err) {
    console.error(`Unexpected error getting product name for ${sku}:`, err);
    nameCache.set(sku, sku);
    return sku;
  }
}

/**
 * Get French names for multiple products at once (more efficient)
 */
export async function getProductNames(skus: string[]): Promise<Record<string, string>> {
  const cacheKey = skus.sort().join(',');
  
  // Check batch cache first
  if (batchCache.has(cacheKey)) {
    return Object.fromEntries(batchCache.get(cacheKey)!);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('sku, name_fr, name')
      .in('sku', skus);

    if (error) {
      console.warn('Error fetching product names:', error.message);
      // Return SKUs as names
      const result: Record<string, string> = {};
      skus.forEach(sku => result[sku] = sku);
      batchCache.set(cacheKey, new Map(Object.entries(result)));
      return result;
    }

    const result: Record<string, string> = {};
    
    // Map database results
    (data || []).forEach(product => {
      result[product.sku] = product.name_fr || product.name || product.sku;
    });

    // Fill in missing SKUs with the SKU itself
    skus.forEach(sku => {
      if (!result[sku]) {
        result[sku] = sku;
      }
    });

    // Cache the batch result
    batchCache.set(cacheKey, new Map(Object.entries(result)));
    
    // Also cache individual results
    Object.entries(result).forEach(([sku, name]) => {
      nameCache.set(sku, name);
    });

    return result;
  } catch (err) {
    console.error('Unexpected error getting product names:', err);
    const result: Record<string, string> = {};
    skus.forEach(sku => result[sku] = sku);
    return result;
  }
}

/**
 * Get product with French name included
 */
export async function getProductWithFrenchName(sku: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, name_fr as french_name')
    .eq('sku', sku)
    .single();

  if (error || !data) {
    return null;
  }

  const productData = data as any;
  return {
    ...productData,
    display_name: productData.name_fr || productData.name || productData.sku
  };
}

/**
 * Add or update French name for a product
 */
export async function setProductFrenchName(sku: string, frenchName: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('products')
      .update({ name_fr: frenchName })
      .eq('sku', sku);

    if (error) {
      console.error(`Error updating French name for ${sku}:`, error.message);
      return false;
    }

    // Update cache
    nameCache.set(sku, frenchName);
    return true;
  } catch (err) {
    console.error(`Unexpected error setting French name for ${sku}:`, err);
    return false;
  }
}

/**
 * Clear cache (useful after bulk updates)
 */
export function clearProductNameCache(): void {
  nameCache.clear();
  batchCache.clear();
}

/**
 * Preload common products into cache
 */
export async function preloadCommonProducts(topN: number = 100): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('sku, name_fr, name')
      .order('popularity', { ascending: false })
      .limit(topN);

    if (!error && data) {
      data.forEach(product => {
        const name = product.name_fr || product.name || product.sku;
        nameCache.set(product.sku, name);
      });
    }
  } catch (err) {
    console.error('Error preloading common products:', err);
  }
}

export default {
  getProductName,
  getProductNames,
  getProductWithFrenchName,
  setProductFrenchName,
  clearProductNameCache,
  preloadCommonProducts
};