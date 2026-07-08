import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET: List ingredients with filtering and pagination
 * Used for ingredient selection UI and autocomplete
 */
export async function GET(request: NextRequest) {
  const sb = await getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const is_common = searchParams.get("is_common");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      ingredients: [
        { id: "i-tomato", canonical_name: "tomato", display_name: { en: "Tomato", es: "Tomate", fr: "Tomate", ar: "طماطم" }, category: "vegetable", subcategory: "nightshade", is_common: true, is_basic: true },
        { id: "i-onion", canonical_name: "onion", display_name: { en: "Onion", es: "Cebolla", fr: "Oignon", ar: "بصل" }, category: "vegetable", subcategory: "allium", is_common: true, is_basic: true },
        { id: "i-garlic", canonical_name: "garlic", display_name: { en: "Garlic", es: "Ajo", fr: "Ail", ar: "ثوم" }, category: "vegetable", subcategory: "allium", is_common: true, is_basic: true },
        { id: "i-carrot", canonical_name: "carrot", display_name: { en: "Carrot", es: "Zanahoria", fr: "Carotte", ar: "جزر" }, category: "vegetable", subcategory: "root", is_common: true, is_basic: true },
        { id: "i-potato", canonical_name: "potato", display_name: { en: "Potato", es: "Papa", fr: "Pomme de terre", ar: "بطاطس" }, category: "vegetable", subcategory: "tuber", is_common: true, is_basic: true }
      ],
      total: 5,
      limit,
      offset
    });
  }

  try {
    // Build base query
    let query = sb
      .from("ingredients")
      .select(
        "id, canonical_name, display_name, plural_name, category, subcategory, is_common, is_basic, description, calories_per_100g"
      )
      .order("is_common", { ascending: false })
      .order("canonical_name", { ascending: true });

    // Apply filters
    if (q) {
      const normalized = q.toLowerCase().trim();
      query = query.or(
        `canonical_name.ilike.%${normalized}%,` +
        `display_name->>en.ilike.%${normalized}%,` +
        `display_name->>es.ilike.%${normalized}%,` +
        `display_name->>fr.ilike.%${normalized}%,` +
        `display_name->>ar.ilike.%${normalized}%`
      );
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (subcategory) {
      query = query.eq("subcategory", subcategory);
    }

    if (is_common !== null) {
      const isCommonBool = is_common === "true";
      query = query.eq("is_common", isCommonBool);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: ingredients, error, count } = await query;

    if (error) {
      console.error("Error fetching ingredients:", error);
      throw error;
    }

    // Format response
    const formattedIngredients = (ingredients || []).map((i: any) => ({
      id: i.id,
      canonical_name: i.canonical_name,
      display_name: i.display_name || {},
      plural_name: i.plural_name,
      category: i.category,
      subcategory: i.subcategory,
      is_common: i.is_common,
      is_basic: i.is_basic,
      description: i.description,
      calories_per_100g: i.calories_per_100g
    }));

    return NextResponse.json({
      ingredients: formattedIngredients,
      total: count || formattedIngredients.length,
      limit,
      offset
    });

  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 500 }
    );
  }
}
