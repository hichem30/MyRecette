import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET: Search and list videos with filtering and sorting
export async function GET(request: NextRequest) {
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const platform = searchParams.get("platform");
    const sort = searchParams.get("sort");
    const recipe = searchParams.get("recipe");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Base query
    let query = sb
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, " +
        "title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url), " +
        "recipes:recipe_id(id, slug, title)"
      )
      .eq("is_approved", true)
      .eq("status", "approved");

    // Apply filters
    if (platform && (platform === "youtube" || platform === "facebook")) {
      query = query.eq("platform", platform);
    }

    if (recipe) {
      // Search in recipe title
      query = query.or(`recipes.title->>en.ilike.%${recipe}%,recipes.title->>es.ilike.%${recipe}%`);
    }

    // Ordering
    switch (sort) {
      case "views":
        query = query.order("view_count", { ascending: false });
        break;
      case "likes":
        query = query.order("like_count", { ascending: false });
        break;
      case "comments":
        query = query.order("comment_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: videos, error, count } = await query;

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json(
        { error: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    // Format response
    const formattedVideos = (videos || []).map((v) => ({
      ...v,
      user: v.profiles ? { ...v.profiles } : null,
      recipe: v.recipes ? { ...v.recipes } : null,
    }));

    // Apply text search filter (client-side filtering is not ideal, but for simple cases)
    let filteredVideos = formattedVideos;
    if (q) {
      const searchLower = q.toLowerCase();
      filteredVideos = formattedVideos.filter(
        (v) => 
          v.title?.en?.toLowerCase().includes(searchLower) ||
          v.title?.es?.toLowerCase().includes(searchLower) ||
          v.title?.fr?.toLowerCase().includes(searchLower) ||
          v.title?.ar?.toLowerCase().includes(searchLower) ||
          v.description?.en?.toLowerCase().includes(searchLower) ||
          v.description?.es?.toLowerCase().includes(searchLower) ||
          v.recipe?.title?.en?.toLowerCase().includes(searchLower) ||
          v.recipe?.title?.es?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      videos: filteredVideos,
      total: count || filteredVideos.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
