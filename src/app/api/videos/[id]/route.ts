import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET: Get a single video by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get video with user and recipe information
    const { data: video, error } = await sb
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, " +
        "title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url), " +
        "recipes:recipe_id(id, slug, title)"
      )
      .eq("id", videoId)
      .eq("is_approved", true)
      .eq("status", "approved")
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: "Video not found or not approved" },
        { status: 404 }
      );
    }

    // Format the response
    return NextResponse.json({
      ...video,
      user: video.profiles ? { ...video.profiles } : null,
      recipe: video.recipes ? { ...video.recipes } : null,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

// PATCH: Update a video (admin or owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
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

    // Check if video exists
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, user_id")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = video.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden - you can only edit your own videos" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Only allow certain fields to be updated
    const allowedFields = ["title", "description", "status", "is_approved"];
    const updateData: Record<string, unknown> = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Admins can update status and is_approved, owners can only update title and description
    if (!isAdmin) {
      delete updateData.status;
      delete updateData.is_approved;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
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
        "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, " +
        "title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json(
        { error: "Failed to update video" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a video (admin or owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
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

    // Check if video exists
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

    // Check if user is admin
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = video.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own videos" },
        { status: 403 }
      );
    }

    // Delete video (cascade will delete related comments, reactions, etc.)
    const { error: deleteError } = await sb
      .from("recipe_videos")
      .delete()
      .eq("id", videoId);

    if (deleteError) {
      console.error("Error deleting video:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete video" },
        { status: 500 }
      );
    }

    // Decrement video count on recipe
    await sb
      .from("recipes")
      .update({ video_count: sb.rpc("decrement", { table: "recipes", column: "video_count", id: video.recipe_id }) })
      .eq("id", video.recipe_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
