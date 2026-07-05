import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { NewRecipeFormData, Recipe } from "@/lib/types";

export async function GET(request: NextRequest) {
  const sb = getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json([
      {
        id: "r-1",
        title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
        slug: "spaghetti-bolognese",
        description: { en: "A classic Italian pasta dish", es: "Un clásico plato italiano" },
        author_id: "user-1",
        prep_time_minutes: 15,
        cook_time_minutes: 45,
        servings: 4,
        difficulty: "medium",
        rating: 4.7,
        rating_count: 234,
        favorite_count: 89,
        cuisine: "Italian",
        meal_type: "dinner",
        published: true,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-06-20T14:30:00Z",
      },
    ]);
  }

  try {
    const { data, error } = await sb
      .from("recipes")
      .select(
        "id, title, slug, description, author_id, prep_time_minutes, cook_time_minutes, servings, " +
        "difficulty, image_url, video_url, rating, rating_count, view_count, favorite_count, " +
        "cuisine, meal_type, dietary_tags, published, published_at, created_at, updated_at, " +
        "author:profiles(id, email, supermarket_name)"
      )
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const sb = getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const body: NewRecipeFormData = await request.json();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Create the recipe
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description,
        author_id: user.id,
        prep_time_minutes: body.prep_time_minutes,
        cook_time_minutes: body.cook_time_minutes,
        servings: body.servings,
        difficulty: body.difficulty,
        image_url: body.image_url,
        video_url: body.video_url,
        cuisine: body.cuisine,
        meal_type: body.meal_type,
        dietary_tags: body.dietary_tags,
        published: body.published ?? false,
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Create recipe ingredients
    if (body.ingredients && body.ingredients.length > 0) {
      const ingredientRows = body.ingredients.map((ing) => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        position: ing.position,
      }));

      const { error: ingError } = await sb
        .from("recipe_ingredients")
        .insert(ingredientRows);

      if (ingError) throw ingError;
    }

    // Create instructions
    if (body.instructions && body.instructions.length > 0) {
      const instructionRows = body.instructions.map((text, index) => ({
        recipe_id: recipe.id,
        step: index + 1,
        text: { en: text, es: text }, // Simple fallback, should be improved
      }));

      const { error: instError } = await sb
        .from("recipe_instructions")
        .insert(instructionRows);

      if (instError) throw instError;
    }

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
