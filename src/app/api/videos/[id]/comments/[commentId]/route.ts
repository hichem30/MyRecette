import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// DELETE: Delete a comment
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
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Check if comment exists and get it
    const { data: comment, error: commentError } = await sb
      .from("video_comments")
      .select("id, video_id, user_id")
      .eq("id", commentId)
      .eq("video_id", videoId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns the comment or is admin
    const isOwner = comment.user_id === user.id;
    
    // Check admin status
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete comment (and its replies due to CASCADE)
    const { error: deleteError } = await sb
      .from("video_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    // Decrement comment count on video
    await sb
      .from("recipe_videos")
      .update({ comment_count: sb.rpc("decrement", { table: "recipe_videos", column: "comment_count", id: videoId }) })
      .eq("id", videoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
