import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// POST: Like a comment
// DELETE: Unlike a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: videoId, commentId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to like a comment" },
        { status: 401 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await sb
      .from("video_comments")
      .select("id, video_id, like_count")
      .eq("id", commentId)
      .eq("video_id", videoId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const { data: existingLike, error: likeError } = await sb
      .from("video_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
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
        { error: "You already liked this comment" },
        { status: 400 }
      );
    }

    // Create like
    const { error: insertError } = await sb
      .from("video_comment_likes")
      .insert({
        comment_id: commentId,
        user_id: user.id,
      });

    if (insertError) {
      console.error("Error creating like:", insertError);
      return NextResponse.json(
        { error: "Failed to like comment" },
        { status: 500 }
      );
    }

    // Increment like count
    await sb
      .from("video_comments")
      .update({ like_count: comment.like_count + 1 })
      .eq("id", commentId);

    return NextResponse.json({
      success: true,
      like_count: comment.like_count + 1,
      is_liked: true,
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: videoId, commentId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to unlike a comment" },
        { status: 401 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await sb
      .from("video_comments")
      .select("id, like_count")
      .eq("id", commentId)
      .eq("video_id", videoId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Delete like
    const { error: deleteError } = await sb
      .from("video_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting like:", deleteError);
      return NextResponse.json(
        { error: "Failed to unlike comment" },
        { status: 500 }
      );
    }

    // Decrement like count
    await sb
      .from("video_comments")
      .update({ like_count: Math.max(0, comment.like_count - 1) })
      .eq("id", commentId);

    return NextResponse.json({
      success: true,
      like_count: Math.max(0, comment.like_count - 1),
      is_liked: false,
    });
  } catch (error) {
    console.error("Error unliking comment:", error);
    return NextResponse.json(
      { error: "Failed to unlike comment" },
      { status: 500 }
    );
  }
}
