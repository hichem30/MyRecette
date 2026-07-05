import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      id: "r-1",
      title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
      slug: "spaghetti-bolognese",
      description: { en: "A classic Italian pasta dish", es: "Un clásico plato italiano" },
      author_id: "user-1",
      prep_time_minutes: 15,
      cook_time_minutes: 45,
      servings: 4,
      difficulty: "medium",
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      video_url: "https://www.youtube.com/embed/3a0v8W1Tn9k",
      rating: 4.7,
      rating_count: 234,
      view_count: 1250,
      favorite_count: 89,
      cuisine: "Italian",
      meal_type: "dinner",
      dietary_tags: ["none"],
      published: true,
      published_at: "2024-01-15T10:00:00Z",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-06-20T14:30:00Z",
      author: { id: "user-1", email: "chef@myrecette.com", supermarket_name: null },
      ingredients: [
        {
          id: "ri-1",
          ingredient_id: "i-spaghetti",
          ingredient: { id: "i-spaghetti", canonical_name: "spaghetti", display_name: { en: "Spaghetti", es: "Espaguetis" }, category: "grain" },
          quantity: 400,
          unit: "g",
          notes: null,
          position: 1,
        },
      ],
      instructions: [
        { step: 1, text: { en: "Heat olive oil in a pan", es: "Calienta aceite de oliva en una sartén" } },
      ],
      is_favorited: false,
    });
  }

  try {
    const { data, error } = await sb
      .from("recipes")
      .select(
        "id, title, slug, description, author_id, prep_time_minutes, cook_time_minutes, servings, " +
        "difficulty, image_url, video_url, rating, rating_count, view_count, favorite_count, " +
        "cuisine, meal_type, dietary_tags, published, published_at, created_at, updated_at, " +
        "author:profiles(id, email, supermarket_name), " +
        "ingredients:recipe_ingredients(id, ingredient_id, quantity, unit, notes, position, created_at, ingredient:ingredients(id, canonical_name, display_name, category, is_common, is_basic)), " +
        "instructions:recipe_instructions(id, recipe_id, step, text, image_url)"
      )
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // First, get the recipe to verify ownership
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id, author_id")
      .eq("slug", slug)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    if (recipe.author_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only edit your own recipes" },
        { status: 403 }
      );
    }

    // Update the recipe
    const { data: updatedRecipe, error: updateError } = await sb
      .from("recipes")
      .update(body)
      .eq("id", recipe.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get the recipe to verify ownership
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id, author_id")
      .eq("slug", slug)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    if (recipe.author_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own recipes" },
        { status: 403 }
      );
    }

    // Delete the recipe
    const { error: deleteError } = await sb.from("recipes").delete().eq("id", recipe.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
