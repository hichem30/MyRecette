/**
 * Supercook-like ingredient search algorithm for sucre et sel
 * 
 * This module provides:
 * - Ingredient name normalization for matching
 * - Finding matching ingredients from user queries
 * - Searching recipes by selected ingredients
 * - Autocomplete suggestions for ingredient selection
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface IngredientMatch {
  ingredientId: string;
  ingredientName: string;
  canonicalName: string;
  confidence: number;
}

interface RecipeSearchResult {
  recipe: any;
  matchedIngredients: IngredientMatch[];
  matchScore: number; // Percentage of selected ingredients that match (0-1)
}

/**
 * Normalize ingredient name for better matching
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes common plural endings
 * - Removes common prefixes (a, an, the, some, fresh, dried, canned, frozen)
 */
export function normalizeIngredientName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/\b(a|an|the|some|fresh|dried|canned|frozen|organic|whole|sliced|chopped|minced|diced)\b/gi, "")
    .trim()
    // Remove trailing 's' for plural (only if word has 3+ letters)
    .replace(/([a-z]{2,})s$/g, "$1")
    .trim();
}

/**
 * Find matching ingredients from user query
 * Tries multiple strategies:
 * 1. Exact canonical name match
 * 2. Synonym match
 * 3. Pattern matching
 */
export async function findMatchingIngredients(
  query: string | string[]
): Promise<IngredientMatch[]> {
  const sb = await getSupabaseServerClient();
  
  const queries = Array.isArray(query) ? query : [query];
  const normalizedQueries = queries.map(normalizeIngredientName).filter(q => q.length > 0);
  
  if (normalizedQueries.length === 0) {
    return [];
  }
  
  const matches: IngredientMatch[] = [];
  
  // Strategy 1: Try exact canonical name match
  for (const query of normalizedQueries) {
    const { data: exactMatches, error: exactError } = await sb
      .from("ingredients")
      .select("id, canonical_name, display_name")
      .eq("canonical_name", query)
      .limit(5);

    if (exactMatches && exactMatches.length > 0) {
      matches.push(...exactMatches.map(i => ({
        ingredientId: i.id,
        ingredientName: i.display_name?.en || i.canonical_name,
        canonicalName: i.canonical_name,
        confidence: 1.0
      })));
    }
  }

  // Strategy 2: Try ILIKE match on canonical_name (contains)
  for (const query of normalizedQueries) {
    if (matches.some(m => m.confidence === 1.0)) continue; // Skip if we already have exact matches
    
    const { data: likeMatches, error: likeError } = await sb
      .from("ingredients")
      .select("id, canonical_name, display_name")
      .or(`canonical_name.ilike.%${query}%,display_name->>en.ilike.%${query}%`)
      .order("is_common", { ascending: false })
      .limit(5);

    if (likeMatches && likeMatches.length > 0) {
      matches.push(...likeMatches.map(i => ({
        ingredientId: i.id,
        ingredientName: i.display_name?.en || i.canonical_name,
        canonicalName: i.canonical_name,
        confidence: 0.9
      })));
    }
  }

  // Strategy 3: Try synonyms
  for (const query of normalizedQueries) {
    const { data: synonymMatches, error: synonymError } = await sb
      .from("ingredient_synonyms")
      .select("ingredient_id, synonym, ingredients:ingredient_id(canonical_name, display_name)")
      .eq("synonym", query)
      .limit(5);

    if (synonymMatches && synonymMatches.length > 0) {
      matches.push(...(synonymMatches as unknown as any[]).map((s: any) => ({
        ingredientId: s.ingredient_id,
        ingredientName: s.ingredients?.display_name?.en || s.synonym,
        canonicalName: s.ingredients?.canonical_name || s.synonym,
        confidence: 0.95
      })));
    }
  }

  // Strategy 4: Try ingredient patterns
  for (const query of normalizedQueries) {
    const { data: patternMatches, error: patternError } = await sb
      .from("ingredient_patterns")
      .select("ingredient_id, pattern_type, pattern, confidence, ingredients:ingredient_id(canonical_name, display_name)")
      .limit(10);

    if (patternMatches && patternMatches.length > 0) {
      for (const p of (patternMatches as unknown as any[])) {
        let matchesPattern = false;
        
        switch (p.pattern_type) {
          case 'contains':
            matchesPattern = query.includes(p.pattern.toLowerCase());
            break;
          case 'starts_with':
            matchesPattern = query.startsWith(p.pattern.toLowerCase());
            break;
          case 'ends_with':
            matchesPattern = query.endsWith(p.pattern.toLowerCase());
            break;
          case 'regex':
            try {
              const regex = new RegExp(p.pattern, 'i');
              matchesPattern = regex.test(query);
            } catch (e) {
              // Invalid regex, skip
            }
            break;
        }
        
        if (matchesPattern) {
          matches.push({
            ingredientId: p.ingredient_id,
            ingredientName: p.ingredients?.display_name?.en || p.ingredients?.canonical_name || p.pattern,
            canonicalName: p.ingredients?.canonical_name || p.pattern,
            confidence: p.confidence || 0.8
          });
        }
      }
    }
  }

  // Deduplicate by ingredientId, keeping highest confidence
  const uniqueMatches = Array.from(
    new Map(matches.map(m => [m.ingredientId, m])).values()
  );
  
  // Sort by confidence (descending), then by name
  return uniqueMatches
    .sort((a, b) => b.confidence - a.confidence || a.ingredientName.localeCompare(b.ingredientName));
}

/**
 * Search recipes by ingredients (Supercook-style)
 * Returns recipes that contain the selected ingredients, sorted by match score
 */
export async function searchRecipesByIngredients(
  ingredientQueries: string[],
  options: { 
    limit?: number; 
    offset?: number; 
    includeAll?: boolean; // If true, only return recipes with ALL ingredients
  } = {}
): Promise<RecipeSearchResult[]> {
  const { limit = 20, offset = 0, includeAll = false } = options;
  const sb = await getSupabaseServerClient();
  
  if (ingredientQueries.length === 0) {
    // If no ingredients specified, return popular recipes
    const { data: popularRecipes, error } = await sb
      .from("recipes")
      .select(
        "id, title, slug, description, author_id, prep_time_minutes, cook_time_minutes, servings, " +
        "difficulty, image_url, video_url, rating, rating_count, view_count, favorite_count, " +
        "cuisine, meal_type, dietary_tags, published, published_at, created_at, updated_at, " +
        "author:profiles(id, email, supermarket_name)"
      )
      .eq("published", true)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (error || !popularRecipes) {
      return [];
    }

    return popularRecipes.map(r => ({
      recipe: r,
      matchedIngredients: [],
      matchScore: 0
    }));
  }
  
  // Find matching ingredients
  const matchingIngredients = await findMatchingIngredients(ingredientQueries);
  
  if (matchingIngredients.length === 0) {
    return [];
  }

  const ingredientIds = matchingIngredients.map(i => i.ingredientId);
  
  // Use the denormalized table for performance
  // This table has one row per recipe-ingredient combination
  const { data: recipeIngredientRows, error: denormError } = await sb
    .from("recipes_ingredients_denormalized")
    .select("recipe_id, ingredient_id, ingredient_name")
    .in("ingredient_id", ingredientIds)
    .order("recipe_id", { ascending: true });

  if (denormError || !recipeIngredientRows) {
    return [];
  }

  // Group by recipe and count matches
  const recipeMap = new Map<string, { 
    recipe: any; 
    matchedIngredients: IngredientMatch[]; 
    matchCount: number; 
    ingredientIdsMatched: Set<string>;
  }>();
  
  // First, get all recipes that have at least one matching ingredient
  const recipeIds = Array.from(new Set(recipeIngredientRows.map(r => r.recipe_id)));
  
  // Fetch recipe details for these recipes
  const { data: recipes, error: recipesError } = await sb
    .from("recipes")
    .select(
      "id, title, slug, description, author_id, prep_time_minutes, cook_time_minutes, servings, " +
      "difficulty, image_url, video_url, rating, rating_count, view_count, favorite_count, " +
      "cuisine, meal_type, dietary_tags, published, published_at, created_at, updated_at, " +
      "author:profiles(id, email, supermarket_name)"
    )
    .in("id", recipeIds)
    .eq("published", true);

  if (recipesError || !recipes) {
    return [];
  }

  // Initialize recipe map
  for (const recipe of (recipes as unknown as any[])) {
    recipeMap.set(recipe.id, {
      recipe,
      matchedIngredients: [],
      matchCount: 0,
      ingredientIdsMatched: new Set()
    });
  }

  // Populate matches
  for (const row of recipeIngredientRows) {
    const recipeData = recipeMap.get(row.recipe_id);
    if (recipeData) {
      const matchedIng = matchingIngredients.find(mi => mi.ingredientId === row.ingredient_id);
      if (matchedIng && !recipeData.ingredientIdsMatched.has(matchedIng.ingredientId)) {
        recipeData.matchedIngredients.push(matchedIng);
        recipeData.matchCount++;
        recipeData.ingredientIdsMatched.add(matchedIng.ingredientId);
      }
    }
  }

  // Convert to array and sort
  const results: RecipeSearchResult[] = Array.from(recipeMap.values())
    .map(r => ({
      recipe: r.recipe,
      matchedIngredients: r.matchedIngredients.sort((a, b) => b.confidence - a.confidence),
      matchScore: r.matchedIngredients.length / matchingIngredients.length
    }))
    .filter(r => {
      if (includeAll) {
        // Only include recipes that have ALL selected ingredients
        return r.matchScore >= 1.0;
      }
      // Include recipes that have at least one matching ingredient
      return r.matchScore > 0;
    })
    .sort((a, b) => {
      // Primary sort: match score (descending)
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // Secondary sort: recipe rating (descending)
      if ((b.recipe.rating || 0) !== (a.recipe.rating || 0)) {
        return (b.recipe.rating || 0) - (a.recipe.rating || 0);
      }
      // Tertiary sort: view count (descending)
      return (b.recipe.view_count || 0) - (a.recipe.view_count || 0);
    });

  return results.slice(offset, offset + limit);
}

/**
 * Get ingredient autocomplete suggestions
 */
export async function getIngredientSuggestions(
  query: string, 
  limit = 10
): Promise<Array<{ id: string; name: string; category: string }>> {
  const sb = await getSupabaseServerClient();
  
  const normalized = normalizeIngredientName(query);
  
  if (normalized.length < 1) {
    // Return popular ingredients if query is too short
    const { data, error } = await sb
      .from("ingredients")
      .select("id, canonical_name, display_name, category")
      .eq("is_common", true)
      .order("canonical_name", { ascending: true })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(i => ({
      id: i.id,
      name: i.display_name?.en || i.canonical_name,
      category: i.category
    }));
  }

  const { data, error } = await sb
    .from("ingredients")
    .select("id, canonical_name, display_name, category")
    .or(`canonical_name.ilike.%${normalized}%,display_name->>en.ilike.%${normalized}%`)
    .order("is_common", { ascending: false })
    .order("canonical_name", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(i => ({
    id: i.id,
    name: i.display_name?.en || i.canonical_name,
    category: i.category
  }));
}

/**
 * Get popular/common ingredients for quick selection
 */
export async function getPopularIngredients(
  limit = 20
): Promise<Array<{ id: string; name: string; category: string }>> {
  const sb = await getSupabaseServerClient();
  
  const { data, error } = await sb
    .from("ingredients")
    .select("id, canonical_name, display_name, category")
    .eq("is_common", true)
    .order("canonical_name", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(i => ({
    id: i.id,
    name: i.display_name?.en || i.canonical_name,
    category: i.category
  }));
}

/**
 * Get ingredients by category for browse interface
 */
export async function getIngredientsByCategory(
  category?: string,
  limit = 50
): Promise<Array<{ id: string; name: string; category: string; subcategory?: string }>> {
  const sb = await getSupabaseServerClient();
  
  let query = sb
    .from("ingredients")
    .select("id, canonical_name, display_name, category, subcategory")
    .order("is_common", { ascending: false })
    .order("canonical_name", { ascending: true })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(i => ({
    id: i.id,
    name: i.display_name?.en || i.canonical_name,
    category: i.category,
    subcategory: i.subcategory
  }));
}

/**
 * Get all ingredient categories for filtering
 */
export async function getIngredientCategories(): Promise<string[]> {
  const sb = await getSupabaseServerClient();
  
  const { data, error } = await sb
    .from("ingredients")
    .select("category")
    // @ts-ignore - Supabase types don't include .group() method
    .group("category");

  if (error || !data) {
    return [];
  }

  return (data as unknown as any[]).map((i: any) => i.category).filter((c, i, self) => c && (self as any).indexOf(c) === i);
}

export type { IngredientMatch, RecipeSearchResult };
