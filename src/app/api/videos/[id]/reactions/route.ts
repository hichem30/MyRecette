import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import type { VideoReactionType } from "@/lib/types";

export const runtime = "nodejs";

const validReactionTypes: VideoReactionType[] = ['like', 'love', 'laugh', 'surprised', 'sad', 'angry'];

// GET: Get all reactions for a video (counts by type)
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
    const { data, error } = await sb
      .from("video_reactions")
      .select("reaction_type, count")
      .eq("video_id", videoId)
      .group("reaction_type");

    if (error) {
      console.error("Error fetching reactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }

    // Initialize all reaction types with 0
    const counts: Record<VideoReactionType, number> = {
      like: 0,
      love: 0,
      laugh: 0,
      surprised: 0,
      sad: 0,
      angry: 0,
    };

    // Fill in the counts from the database
    (data || []).forEach((r) => {
      const reactionType = r.reaction_type as VideoReactionType;
      if (validReactionTypes.includes(reactionType)) {
        counts[reactionType] = (r.count as number) || 0;
      }
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST: Add or update a reaction
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
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in to react" },
        { status: 401 }
      );
    }

    // Check if video exists
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reaction_type } = body;

    if (!reaction_type) {
      return NextResponse.json(
        { error: "reaction_type is required" },
        { status: 400 }
      );
    }

    if (!validReactionTypes.includes(reaction_type)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be one of: like, love, laugh, surprised, sad, angry" },
        { status: 400 }
      );
    }

    // Check if user already reacted
    const { data: existingReaction, error: reactionError } = await sb
      .from("video_reactions")
      .select("reaction_type")
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .single();

    if (reactionError && !reactionError.message.includes("No rows found")) {
      console.error("Error checking reaction:", reactionError);
      return NextResponse.json(
        { error: "Failed to check reaction status" },
        { status: 500 }
      );
    }

    // If user already reacted, we need to handle it differently
    if (existingReaction) {
      // If changing reaction type
      if (existingReaction.reaction_type !== reaction_type) {
        // Delete old reaction
        const { error: deleteError } = await sb
          .from("video_reactions")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id)
          .eq("reaction_type", existingReaction.reaction_type);

        if (deleteError) {
          console.error("Error deleting old reaction:", deleteError);
          return NextResponse.json(
            { error: "Failed to update reaction" },
            { status: 500 }
          );
        }

        // Create new reaction
        const { error: insertError } = await sb
          .from("video_reactions")
          .insert({
            video_id: videoId,
            user_id: user.id,
            reaction_type,
          });

        if (insertError) {
          console.error("Error creating new reaction:", insertError);
          return NextResponse.json(
            { error: "Failed to update reaction" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          reaction_type,
          message: "Reaction updated",
        });
      } else {
        // Already reacted with same type
        return NextResponse.json({
          success: true,
          reaction_type,
          message: "Already reacted",
        });
      }
    }

    // Create new reaction
    const { error: insertError } = await sb
      .from("video_reactions")
      .insert({
        video_id: videoId,
        user_id: user.id,
        reaction_type,
      });

    if (insertError) {
      console.error("Error creating reaction:", insertError);
      return NextResponse.json(
        { error: "Failed to create reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reaction_type,
      message: "Reaction added",
    });
  } catch (error) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}
