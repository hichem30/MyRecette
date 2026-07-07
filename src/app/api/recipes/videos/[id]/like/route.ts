import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

// POST: Like a video
// DELETE: Unlike a video

export async function POST(
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
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to like a video" },
        { status: 401 }
      );
    }

    // Check if video exists
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, like_count")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user already liked this video (using video_reactions table)
    const { data: existingLike, error: likeError } = await sb
      .from("video_reactions")
      .select("reaction_type")
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .eq("reaction_type", "like")
      .single();

    if (likeError && !likeError.message.includes("No rows found")) {
      console.error("Error checking like:", likeError);
      return NextResponse.json(
        { error: "Failed to check like status" },
        { status: 500 }
      );
    }

    if (existingLike) {
      return NextResponse.json(
        { error: "You already liked this video" },
        { status: 400 }
      );
    }

    // Create like reaction
    const { error: insertError } = await sb
      .from("video_reactions")
      .insert({
        video_id: videoId,
        user_id: user.id,
        reaction_type: "like",
      });

    if (insertError) {
      console.error("Error creating like:", insertError);
      return NextResponse.json(
        { error: "Failed to like video" },
        { status: 500 }
      );
    }

    // Increment like count
    await sb
      .from("recipe_videos")
      .update({ like_count: video.like_count + 1 })
      .eq("id", videoId);

    return NextResponse.json({
      success: true,
      like_count: video.like_count + 1,
      is_liked: true,
    });
  } catch (error) {
    console.error("Error liking video:", error);
    return NextResponse.json(
      { error: "Failed to like video" },
      { status: 500 }
    );
  }
}

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
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to unlike a video" },
        { status: 401 }
      );
    }

    // Check if video exists
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, like_count")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Delete like reaction
    const { error: deleteError } = await sb
      .from("video_reactions")
      .delete()
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .eq("reaction_type", "like");

    if (deleteError) {
      console.error("Error deleting like:", deleteError);
      return NextResponse.json(
        { error: "Failed to unlike video" },
        { status: 500 }
      );
    }

    // Decrement like count
    await sb
      .from("recipe_videos")
      .update({ like_count: Math.max(0, video.like_count - 1) })
      .eq("id", videoId);

    return NextResponse.json({
      success: true,
      like_count: Math.max(0, video.like_count - 1),
      is_liked: false,
    });
  } catch (error) {
    console.error("Error unliking video:", error);
    return NextResponse.json(
      { error: "Failed to unlike video" },
      { status: 500 }
    );
  }
}
