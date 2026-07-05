import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@supabase/server";

export const runtime = "nodejs";

interface CreateRecipeVideoRequest {
  video_url: string;
  title?: { en?: string; es?: string; fr?: string; ar?: string };
  description?: { en?: string; es?: string; fr?: string; ar?: string };
}

interface UpdateRecipeVideoRequest {
  video_url?: string;
  title?: { en?: string; es?: string; fr?: string; ar?: string };
  description?: { en?: string; es?: string; fr?: string; ar?: string };
  status?: 'pending' | 'approved' | 'rejected' | 'deleted';
}

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

// Helper to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Helper to get embed URL
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export async function GET(
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
    // Get recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Get videos for this recipe
    const { data: videos, error: videosError } = await sb
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, video_url, title, description, youtube_video_id, thumbnail_url, " +
        "duration_seconds, like_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .eq("recipe_id", recipe.id)
      .eq("is_approved", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (videosError) throw videosError;

    return NextResponse.json(videos || []);
  } catch (error) {
    console.error("Error fetching recipe videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe videos" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to submit a video" },
        { status: 401 }
      );
    }

    // Get recipe ID from slug
    const { data: recipe, error: recipeError } = await sb
      .from("recipes")
      .select("id, author_id")
      .eq("slug", slug)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body: CreateRecipeVideoRequest = await request.json();

    if (!body.video_url) {
      return NextResponse.json(
        { error: "video_url is required" },
        { status: 400 }
      );
    }

    // Validate and extract YouTube video ID
    const videoId = extractYouTubeVideoId(body.video_url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Prepare video data
    const videoData = {
      recipe_id: recipe.id,
      user_id: user.id,
      video_url: body.video_url,
      youtube_video_id: videoId,
      thumbnail_url: getYouTubeThumbnail(videoId),
      title: body.title || null,
      description: body.description || null,
      is_approved: true, // No content moderation per requirements
      status: "approved" as const,
      like_count: 0,
      view_count: 0,
    };

    // Create video
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .insert([videoData])
      .select(
        "id, recipe_id, user_id, video_url, title, description, youtube_video_id, thumbnail_url, " +
        "duration_seconds, like_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .single();

    if (videoError) throw videoError;

    // Increment video count on recipe
    await sb
      .from("recipes")
      .update({ video_count: recipe.video_count + 1 })
      .eq("id", recipe.id);

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe video:", error);
    return NextResponse.json(
      { error: "Failed to create recipe video" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("video_id");

  if (!videoId) {
    return NextResponse.json(
      { error: "video_id parameter is required" },
      { status: 400 }
    );
  }

  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get video
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, user_id, recipe_id")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user owns the video or is recipe author or admin
    const isOwner = video.user_id === user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden - you can only edit your own videos" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateRecipeVideoRequest = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.video_url !== undefined) {
      const newVideoId = extractYouTubeVideoId(body.video_url);
      if (newVideoId) {
        updateData.video_url = body.video_url;
        updateData.youtube_video_id = newVideoId;
        updateData.thumbnail_url = getYouTubeThumbnail(newVideoId);
      }
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    // Update video
    const { data: updatedVideo, error: updateError } = await sb
      .from("recipe_videos")
      .update(updateData)
      .eq("id", videoId)
      .select(
        "id, recipe_id, user_id, video_url, title, description, youtube_video_id, thumbnail_url, " +
        "duration_seconds, like_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error("Error updating recipe video:", error);
    return NextResponse.json(
      { error: "Failed to update recipe video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("video_id");

  if (!videoId) {
    return NextResponse.json(
      { error: "video_id parameter is required" },
      { status: 400 }
    );
  }

  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get video
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, user_id, recipe_id")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user owns the video or is admin
    const isOwner = video.user_id === user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own videos" },
        { status: 403 }
      );
    }

    // Delete video
    const { error: deleteError } = await sb
      .from("recipe_videos")
      .delete()
      .eq("id", videoId);

    if (deleteError) throw deleteError;

    // Decrement video count on recipe
    await sb
      .from("recipes")
      .update({ video_count: sb.rpc("decrement_video_count", { recipe_id: video.recipe_id }) })
      .eq("id", video.recipe_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe video:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe video" },
      { status: 500 }
    );
  }
}
