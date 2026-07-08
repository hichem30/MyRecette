import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import type { VideoReactionType } from "@/lib/types";

export const runtime = "nodejs";

const validReactionTypes: VideoReactionType[] = ['like', 'love', 'laugh', 'surprised', 'sad', 'angry'];

// DELETE: Remove a reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reactionType: string }> }
) {
  const { id: videoId, reactionType } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Validate reaction type
    if (!validReactionTypes.includes(reactionType as VideoReactionType)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Check if reaction exists
    const { data: reaction, error: reactionError } = await sb
      .from("video_reactions")
      .select("id")
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .eq("reaction_type", reactionType)
      .single();

    if (reactionError || !reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    // Delete reaction
    const { error: deleteError } = await sb
      .from("video_reactions")
      .delete()
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .eq("reaction_type", reactionType);

    if (deleteError) {
      console.error("Error deleting reaction:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reaction removed",
    });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return NextResponse.json(
      { error: "Failed to delete reaction" },
      { status: 500 }
    );
  }
}
