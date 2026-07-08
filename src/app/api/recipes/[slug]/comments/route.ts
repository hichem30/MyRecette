import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json([
      {
        id: "c-1",
        recipe_id: "r-1",
        author_id: "user-1",
        content: "This recipe is amazing! Made it for my family and they loved it.",
        rating: 5,
        parent_id: null,
        is_approved: true,
        is_spam: false,
        created_at: "2024-06-10T10:00:00Z",
        updated_at: "2024-06-10T10:00:00Z",
        author: { id: "user-1", email: "foodlover@email.com", supermarket_name: null },
        replies: [],
      },
      {
        id: "c-2",
        recipe_id: "r-1",
        author_id: "user-2",
        content: "Great recipe! I added some chili flakes for extra heat.",
        rating: 4,
        parent_id: null,
        is_approved: true,
        is_spam: false,
        created_at: "2024-06-11T08:00:00Z",
        updated_at: "2024-06-11T08:00:00Z",
        author: { id: "user-2", email: "spicychef@email.com", supermarket_name: null },
        replies: [],
      },
    ]);
  }

  try {
    const { data, error } = await sb
      .from("recipe_comments")
      .select(
        "id, recipe_id, author_id, content, rating, parent_id, is_approved, is_spam, created_at, updated_at, " +
        "author:profiles(id, email, supermarket_name), " +
        "replies:recipe_comments(id, recipe_id, author_id, content, rating, parent_id, is_approved, is_spam, created_at, updated_at, author:profiles(id, email, supermarket_name))"
      )
      .eq("recipe_id", slug)
      .eq("is_approved", true)
      .eq("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
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
    const { content, rating, parent_id } = await request.json();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to leave a comment" },
        { status: 401 }
      );
    }

    // Verify the recipe exists
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Create the comment
    const { data: comment, error: commentError } = await sb
      .from("recipe_comments")
      .insert({
        recipe_id: recipe.id,
        author_id: user.id,
        content,
        rating,
        parent_id,
        is_approved: true, // No content moderation as per requirements
        is_spam: false,
      })
      .select(
        "id, recipe_id, author_id, content, rating, parent_id, is_approved, is_spam, created_at, updated_at, " +
        "author:profiles(id, email, supermarket_name)"
      )
      .single();

    if (commentError) throw commentError;

    // Increment comment count on recipe
    await sb.rpc("increment_recipe_comment_count", { recipe_id: recipe.id });

    // If rating is provided, update recipe rating
    if (rating) {
      // Calculate new average rating
      const { data: comments } = await sb
        .from("recipe_comments")
        .select("rating")
        .eq("recipe_id", recipe.id)
        .not('rating', 'is', null);

      const ratings = (comments ?? []).map((c) => c.rating).filter((r) => r !== null) as number[];
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        await sb
          .from("recipes")
          .update({ rating: Math.round(avgRating * 10) / 10 })
          .eq("id", recipe.id);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
