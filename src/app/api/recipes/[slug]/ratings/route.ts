import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET: Get ratings for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const sb = await getSupabaseServerClient();
  const { slug } = await params;
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      ratings: [
        { id: "rating-1", recipe_id: "r-1", user_id: "user-1", rating: 5, created_at: "2024-06-10T10:00:00Z" },
        { id: "rating-2", recipe_id: "r-1", user_id: "user-2", rating: 4, created_at: "2024-06-11T08:00:00Z" },
        { id: "rating-3", recipe_id: "r-1", user_id: "user-3", rating: 5, created_at: "2024-06-12T09:00:00Z" }
      ],
      average_rating: 4.67,
      total_ratings: 3,
      rating_distribution: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 }
    });
  }

  try {
    // Get recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Get all ratings
    const { data: ratings, error: ratingsError } = await sb
      .from("recipe_ratings")
      .select("id, recipe_id, user_id, rating, created_at, profiles:user_id(id, email, supermarket_name, profile_picture_url, full_name)")
      .eq("recipe_id", recipe.id);

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
      return NextResponse.json(
        { error: "Failed to fetch ratings" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const allRatings = (ratings || []).map((r: any) => r.rating);
    const totalRatings = allRatings.length;
    const averageRating = totalRatings > 0 ? allRatings.reduce((a: number, b: number) => a + b, 0) / totalRatings : 0;
    
    // Rating distribution
    const ratingDistribution: Record<number, number> = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    allRatings.forEach((r: number) => {
      if (r >= 1 && r <= 5) ratingDistribution[Math.round(r)]++;
    });

    // Format response
    const formattedRatings = (ratings || []).map((r: any) => ({
      ...r,
      user: r.profiles ? {
        id: r.profiles.id,
        email: r.profiles.email,
        name: r.profiles.full_name || r.profiles.supermarket_name || r.profiles.email?.split('@')[0],
        avatar: r.profiles.profile_picture_url,
        is_supermarket: !!r.profiles.supermarket_name
      } : null
    }));

    return NextResponse.json({
      ratings: formattedRatings,
      average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      total_ratings: totalRatings,
      rating_distribution: ratingDistribution
    });

  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

// POST: Add or update a user's rating for a recipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const sb = await getSupabaseServerClient();
  const { slug } = await params;
  
  if (!isSupabaseConfigured()) {
    // Return mock response for local development
    return NextResponse.json({
      message: "Rating saved (mock)",
      rating: { id: "rating-new", recipe_id: "r-1", user_id: "user-1", rating: 5, created_at: new Date().toISOString() }
    });
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to rate" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate rating
    const rating = body.rating;
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Check if user already rated this recipe
    const { data: existingRating, error: existingError } = await sb
      .from("recipe_ratings")
      .select("id")
      .eq("recipe_id", recipe.id)
      .eq("user_id", user.id)
      .maybeSingle();

    let result;
    
    if (existingRating) {
      // Update existing rating
      result = await sb
        .from("recipe_ratings")
        .update({
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingRating.id)
        .select("id, recipe_id, user_id, rating, created_at")
        .single();
    } else {
      // Create new rating
      result = await sb
        .from("recipe_ratings")
        .insert({
          recipe_id: recipe.id,
          user_id: user.id,
          rating: rating
        })
        .select("id, recipe_id, user_id, rating, created_at")
        .single();
    }

    if (result.error) {
      console.error("Error saving rating:", result.error);
      return NextResponse.json(
        { error: "Failed to save rating" },
        { status: 500 }
      );
    }

    // Update recipe rating
    const { data: allRatings, error: ratingsError } = await sb
      .from("recipe_ratings")
      .select("rating")
      .eq("recipe_id", recipe.id);

    if (!ratingsError && allRatings) {
      const ratings = allRatings.map((r: any) => r.rating);
      const averageRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      
      await sb
        .from("recipes")
        .update({
          rating: Math.round(averageRating * 10) / 10,
          review_count: ratings.length
        })
        .eq("id", recipe.id);
    }

    return NextResponse.json({
      message: "Rating saved successfully",
      rating: result.data
    });

  } catch (error) {
    console.error("Error saving rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}