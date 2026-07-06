import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET: Search recipes by ingredients (Supercook-like functionality)
export async function GET(request: NextRequest) {
  const sb = getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const ingredients = searchParams.get("ingredients");
    const q = searchParams.get("q"); // Text search fallback
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const lang = searchParams.get("lang") || "en";

    if (!ingredients && !q) {
      return NextResponse.json(
        { error: "Please provide either ingredients or q (search query) parameter" },
        { status: 400 }
      );
    }

    // Parse ingredients from comma-separated string
    const ingredientList = ingredients ? ingredients.split(',').map(i => i.trim().toLowerCase()) : [];

    // If we have ingredients, search for recipes that have all of them
    if (ingredientList.length > 0) {
      // Get all recipes with their ingredients
      const { data: recipes, error: recipesError } = await sb
        .from("recipes")
        .select(
          "id, slug, title, description, main_image, prep_time, cook_time, servings, difficulty, " +
          "rating, review_count, favorite_count, ingredient_count, category, cuisine, dietary_tags, " +
          "status, is_approved, created_at, updated_at, " +
          "author_id, profiles:author_id(id, email, supermarket_name, profile_picture_url, full_name), " +
          "recipe_ingredients(ingredient_id, name, quantity, unit, notes, ingredients:ingredient_id(id, name, canonical_name, translations))"
        )
        .eq("is_approved", true)
        .eq("status", "published");

      if (recipesError) {
        console.error("Error fetching recipes:", recipesError);
        return NextResponse.json(
          { error: "Failed to fetch recipes" },
          { status: 500 }
        );
      }

      // Filter recipes that contain ALL the specified ingredients
      const matchingRecipes = (recipes || []).filter((recipe: any) => {
        const recipeIngredients = recipe.recipe_ingredients || [];
        
        // Check if all required ingredients are present
        return ingredientList.every(requiredIng => {
          return recipeIngredients.some((ri: any) => {
            // Check by ingredient name or canonical name
            const ingredientName = ri.ingredients?.canonical_name?.toLowerCase() || 
                                 ri.ingredients?.name?.en?.toLowerCase() ||
                                 ri.name?.en?.toLowerCase() ||
                                 "";
            return ingredientName.includes(requiredIng);
          });
        });
      });

      // Apply text search filter if provided
      let filteredRecipes = matchingRecipes;
      if (q) {
        const searchLower = q.toLowerCase();
        filteredRecipes = matchingRecipes.filter(
          (r: any) => 
            (r.title?.[lang]?.toLowerCase()?.includes(searchLower) || 
             r.title?.en?.toLowerCase()?.includes(searchLower)) ||
            (r.description?.[lang]?.toLowerCase()?.includes(searchLower) || 
             r.description?.en?.toLowerCase()?.includes(searchLower))
        );
      }

      // Sort by best match (most ingredients matched, then by rating/favorites)
      filteredRecipes.sort((a: any, b: any) => {
        // Calculate match score (not implemented here for simplicity)
        // For now, sort by rating and favorites
        const bRating = b.rating || 0;
        const aRating = a.rating || 0;
        if (bRating !== aRating) return bRating - aRating;
        return (b.favorite_count || 0) - (a.favorite_count || 0);
      });

      // Apply pagination
      const paginatedRecipes = filteredRecipes.slice(offset, offset + limit);

      // Format response
      const formattedRecipes = paginatedRecipes.map((r: any) => ({
        ...r,
        title: r.title?.[lang] || r.title?.en || "Untitled",
        description: r.description?.[lang] || r.description?.en || "",
        author: r.profiles ? {
          id: r.profiles.id,
          email: r.profiles.email,
          name: r.profiles.full_name || r.profiles.supermarket_name || r.profiles.email?.split('@')[0],
          avatar: r.profiles.profile_picture_url
        } : null,
        ingredient_count: r.recipe_ingredients?.length || r.ingredient_count || 0,
        // Count how many of the required ingredients this recipe has
        matched_ingredient_count: ingredientList.filter(requiredIng =>
          (r.recipe_ingredients || []).some((ri: any) => {
            const ingredientName = ri.ingredients?.canonical_name?.toLowerCase() || 
                                 ri.ingredients?.name?.en?.toLowerCase() ||
                                 ri.name?.en?.toLowerCase() ||
                                 "";
            return ingredientName.includes(requiredIng);
          })
        ).length
      }));

      return NextResponse.json({
        recipes: formattedRecipes,
        total: filteredRecipes.length,
        limit,
        offset,
        search_query: q,
        ingredients: ingredientList,
        found_count: filteredRecipes.length
      });
    }
    
    // Fallback to text search only
    let query = sb
      .from("recipes")
      .select(
        "id, slug, title, description, main_image, prep_time, cook_time, servings, difficulty, " +
        "rating, review_count, favorite_count, ingredient_count, category, cuisine, dietary_tags, " +
        "status, is_approved, created_at, updated_at, " +
        "author_id, profiles:author_id(id, email, supermarket_name, profile_picture_url, full_name)"
      )
      .eq("is_approved", true)
      .eq("status", "published");

    // Apply text search
    if (q) {
      const searchLower = q.toLowerCase();
      query = query.or(
        `title->>${lang}.ilike.%${searchLower}%,` +
        `title->>en.ilike.%${searchLower}%,` +
        `description->>${lang}.ilike.%${searchLower}%,` +
        `description->>en.ilike.%${searchLower}%`
      );
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute
    const { data: recipes, error, count } = await query;

    if (error) {
      console.error("Error fetching recipes:", error);
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      );
    }

    // Format response
    const formattedRecipes = (recipes || []).map((r: any) => ({
      ...r,
      title: r.title?.[lang] || r.title?.en || "Untitled",
      description: r.description?.[lang] || r.description?.en || "",
      author: r.profiles ? {
        id: r.profiles.id,
        email: r.profiles.email,
        name: r.profiles.full_name || r.profiles.supermarket_name || r.profiles.email?.split('@')[0],
        avatar: r.profiles.profile_picture_url
      } : null
    }));

    return NextResponse.json({
      recipes: formattedRecipes,
      total: count || formattedRecipes.length,
      limit,
      offset,
      search_query: q
    });

  } catch (error) {
    console.error("Error searching recipes:", error);
    return NextResponse.json(
      { error: "Failed to search recipes" },
      { status: 500 }
    );
  }
}