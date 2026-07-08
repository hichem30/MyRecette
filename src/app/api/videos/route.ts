import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Helper to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^\?]+)/,
    /youtube\.com\/embed\/([^\?]+)/,
    /youtube\.com\/shorts\/([^\?]+)/,
    /youtube\.com\/live\/([^\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Helper to extract Facebook video ID
function extractFacebookVideoId(url: string): string | null {
  const patterns = [
    /facebook\.com\/watch\/\?v=([^&]+)/,
    /facebook\.com\/[^\/]+\/videos\/([^\/?]+)/,
    /fb\.watch\/([^\/]+)/,
    /facebook\.com\/reel\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) return match[i];
      }
    }
  }
  return null;
}

// Helper to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// GET: Search and list videos with filtering and sorting
export async function GET(request: NextRequest) {
  const sb = await getSupabaseServerClient();

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
    const formattedVideos = ((videos as unknown as any[]) || []).map((v: any) => ({
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

// POST: Create a new recipe video
export async function POST(request: NextRequest) {
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { video_url, platform = 'youtube', title, description, recipe_id } = body;
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to submit a video" },
        { status: 401 }
      );
    }

    if (!video_url) {
      return NextResponse.json(
        { error: "video_url is required" },
        { status: 400 }
      );
    }

    if (platform !== 'youtube' && platform !== 'facebook') {
      return NextResponse.json(
        { error: "platform must be 'youtube' or 'facebook'" },
        { status: 400 }
      );
    }

    // Extract video IDs
    const youtube_video_id = platform === 'youtube' ? extractYouTubeVideoId(video_url) : null;
    const facebook_video_id = platform === 'facebook' ? extractFacebookVideoId(video_url) : null;

    // Create video
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .insert({
        user_id: user.id,
        recipe_id,
        platform,
        video_url,
        youtube_video_id,
        facebook_video_id,
        thumbnail_url: youtube_video_id ? getYouTubeThumbnail(youtube_video_id) : null,
        title: title || { en: "Untitled Video", es: "Video sin titulo", fr: "Vidéo sans titre", ar: "فيديو بدون عنوان" },
        description: description || {},
        is_approved: true,
        status: 'approved',
      })
      .select(
        "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at"
      )
      .single();

    if (videoError) {
      console.error("Error creating video:", videoError);
      throw videoError;
    }

    // Increment video count on recipe if recipe_id is provided
    if (recipe_id) {
      await sb.rpc("increment_recipe_video_count", { recipe_id });
    }

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
