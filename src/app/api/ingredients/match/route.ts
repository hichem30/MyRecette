import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Match ingredient queries to database ingredients and find products
 * This is used for the "check availability" feature
 */
export async function POST(request: NextRequest) {
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      ingredients: [
        { ingredientId: "i-tomato", ingredientName: "Tomato", canonicalName: "tomato", confidence: 1.0 },
        { ingredientId: "i-onion", ingredientName: "Onion", canonicalName: "onion", confidence: 1.0 }
      ],
      products: [
        {
          id: "p-1",
          name: { en: "Organic Tomatoes" },
          price: 2.99,
          supermarket_id: "sm-1",
          supermarket: { id: "sm-1", supermarket_name: { en: "FreshMart" } },
          matched_ingredients: [
            { ingredientId: "i-tomato", ingredientName: "Tomato", confidence: 1.0 }
          ]
        }
      ]
    });
  }

  try {
    const { queries, supermarket_id, limit = 20, offset = 0 } = await request.json();
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: "queries parameter is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    // Normalize queries for matching
    const normalizedQueries = queries.map((q: string) => {
      if (!q) return "";
      return q.toLowerCase().trim()
        .replace(/\b(a|an|the|some|fresh|dried|canned|frozen|organic|whole|sliced|chopped|minced|diced)\b/gi, "")
        .replace(/s$/g, "")
        .trim();
    }).filter((q: string) => q.length > 0);
    
    if (normalizedQueries.length === 0) {
      return NextResponse.json({ ingredients: [], products: [] });
    }

    // Step 1: Match queries to ingredients in database
    const ingredientMatches: Array<{
      ingredientId: string;
      ingredientName: string;
      canonicalName: string;
      confidence: number;
    }> = [];

    // Try exact match first
    for (const query of normalizedQueries) {
      const { data: exactMatches, error: exactError } = await sb
        .from("ingredients")
        .select("id, canonical_name, display_name")
        .eq("canonical_name", query)
        .limit(5);

      if (exactMatches && exactMatches.length > 0) {
        ingredientMatches.push(...(exactMatches as any[]).map((i: any) => ({
          ingredientId: i.id,
          ingredientName: i.display_name?.en || i.canonical_name,
          canonicalName: i.canonical_name,
          confidence: 1.0
        })));
      }
    }

    // Try ILIKE match for partial matches
    for (const query of normalizedQueries) {
      if (ingredientMatches.some(m => m.confidence === 1.0)) continue;
      
      const { data: likeMatches, error: likeError } = await sb
        .from("ingredients")
        .select("id, canonical_name, display_name")
        .or(`canonical_name.ilike.%${query}%,display_name->>en.ilike.%${query}%`)
        .order("is_common", { ascending: false })
        .limit(5);

      if (likeMatches && likeMatches.length > 0) {
        ingredientMatches.push(...(likeMatches as any[]).map((i: any) => ({
          ingredientId: i.id,
          ingredientName: i.display_name?.en || i.canonical_name,
          canonicalName: i.canonical_name,
          confidence: 0.9
        })));
      }
    }

    // Try synonyms
    for (const query of normalizedQueries) {
      const { data: synonymMatches, error: synonymError } = await sb
        .from("ingredient_synonyms")
        .select("ingredient_id, synonym, ingredients:ingredient_id(canonical_name, display_name)")
        .eq("synonym", query)
        .limit(5);

      if (synonymMatches && synonymMatches.length > 0) {
        ingredientMatches.push(...(synonymMatches as any[]).map((s: any) => ({
          ingredientId: s.ingredient_id,
          ingredientName: s.ingredients?.display_name?.en || s.synonym,
          canonicalName: s.ingredients?.canonical_name || s.synonym,
          confidence: 0.95
        })));
      }
    }

    // Deduplicate
    const uniqueIngredientMatches = Array.from(
      new Map(ingredientMatches.map(m => [m.ingredientId, m])).values()
    );

    if (uniqueIngredientMatches.length === 0) {
      return NextResponse.json({ ingredients: [], products: [] });
    }

    const ingredientIds = uniqueIngredientMatches.map(i => i.ingredientId);

    // Step 2: Find products that contain these ingredients
    // We need to check both:
    // 1. Direct matches via product_ingredients table
    // 2. Supermarket products via supermarket_products_ingredients_denormalized
    
    let productsQuery = sb
      .from("supermarket_products_ingredients_denormalized")
      .select(
        "supermarket_product_id, ingredient_id, ingredient_name, " +
        "supermarket_products:supermarket_product_id(id, name, description, price, original_price, image_url, stock, category_slug, supermarket_id), " +
        "supermarkets:supermarket_products->supermarket_id(id, supermarket_name, profile_picture_url, address)"
      )
      .in("ingredient_id", ingredientIds)
      .order("supermarket_products.created_at", { ascending: false });

    if (supermarket_id) {
      productsQuery = productsQuery.eq("supermarket_products.supermarket_id", supermarket_id);
    }

    productsQuery = productsQuery.range(offset, offset + limit - 1);

    const { data: productRows, error: productsError, count } = await productsQuery;

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return NextResponse.json({ ingredients: uniqueIngredientMatches, products: [] });
    }

    // Group products and calculate match scores
    const productMap = new Map<string, {
      product: any;
      supermarket: any;
      matchedIngredients: typeof uniqueIngredientMatches;
      matchCount: number;
    }>();

    for (const row of (productRows as any[] || [])) {
      const productId = row.supermarket_product_id;
      
      if (!productMap.has(productId)) {
        const matchedIng = uniqueIngredientMatches.find(mi => mi.ingredientId === row.ingredient_id);
        productMap.set(productId, {
          product: row.supermarket_products,
          supermarket: row.supermarkets,
          matchedIngredients: matchedIng ? [matchedIng] : [],
          matchCount: matchedIng ? 1 : 0
        });
      } else {
        const existing = productMap.get(productId)!;
        const matchedIng = uniqueIngredientMatches.find(mi => mi.ingredientId === row.ingredient_id);
        if (matchedIng && !existing.matchedIngredients.some(m => m.ingredientId === matchedIng.ingredientId)) {
          existing.matchedIngredients.push(matchedIng);
          existing.matchCount++;
        }
      }
    }

    // Format results
    const formattedProducts = Array.from(productMap.values()).map(p => ({
      id: p.product.id,
      name: p.product.name,
      description: p.product.description,
      price: p.product.price,
      original_price: p.product.original_price,
      image_url: p.product.image_url,
      stock: p.product.stock,
      category_slug: p.product.category_slug,
      supermarket_id: p.product.supermarket_id,
      supermarket: p.supermarket ? {
        id: p.supermarket.id,
        supermarket_name: p.supermarket.supermarket_name,
        profile_picture_url: p.supermarket.profile_picture_url,
        address: p.supermarket.address
      } : null,
      matched_ingredients: p.matchedIngredients,
      match_score: p.matchCount / uniqueIngredientMatches.length
    }));

    return NextResponse.json({
      ingredients: uniqueIngredientMatches,
      products: formattedProducts,
      total: count || formattedProducts.length
    });

  } catch (error) {
    console.error("Error matching ingredients to products:", error);
    return NextResponse.json(
      { error: "Failed to match ingredients to products" },
      { status: 500 }
    );
  }
}
