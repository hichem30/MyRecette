import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ is_favorited: false });
  }

  try {
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ is_favorited: false });
    }

    // Get the recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ is_favorited: false });
    }

    // Check if the user has favorited this recipe
    const { data: favorite, error: favError } = await sb
      .from("recipe_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipe.id)
      .single();

    if (favError) throw favError;
    return NextResponse.json({ is_favorited: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ is_favorited: false });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = await getSupabaseServerClient();

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

    // Get the recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id, favorite_count")
      .eq("slug", slug)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if already favorited
    const { data: existing, error: existingError } = await sb
      .from("recipe_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipe.id)
      .single();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { error: "Already favorited" },
        { status: 400 }
      );
    }

    // Add to favorites
    const { error: favError } = await sb.from("recipe_favorites").insert({
      user_id: user.id,
      recipe_id: recipe.id,
    });

    if (favError) throw favError;

    // Increment favorite count
    await sb
      .from("recipes")
      .update({ favorite_count: recipe.favorite_count + 1 })
      .eq("id", recipe.id);

    return NextResponse.json({ is_favorited: true });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = await getSupabaseServerClient();

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

    // Get the recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id, favorite_count")
      .eq("slug", slug)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Remove from favorites
    const { error: favError } = await sb
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipe.id);

    if (favError) throw favError;

    // Decrement favorite count
    await sb
      .from("recipes")
      .update({ favorite_count: Math.max(0, recipe.favorite_count - 1) })
      .eq("id", recipe.id);

    return NextResponse.json({ is_favorited: false });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
