import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

// POST: Track a video view

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const sb = await getSupabaseServerClient();

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

    // Get IP address and user agent from headers
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if video exists
    const { data: video, error: videoError } = await sb
      .from("recipe_videos")
      .select("id, view_count")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if this view already exists (same video + user + IP)
    // For simplicity, we'll just track unique IP + user combinations per video
    const userId = user?.id;
    const { data: existingView, error: viewError } = await sb
      .from("recipe_video_views")
      .select("id")
      .eq("video_id", videoId)
      .eq("user_id", userId || null)
      .eq("ip_address", ipAddress)
      .single();

    if (viewError && !viewError.message.includes("No rows found")) {
      console.error("Error checking view:", viewError);
    }

    // If view doesn't exist, create it
    if (!existingView) {
      const { error: insertError } = await sb
        .from("recipe_video_views")
        .insert({
          video_id: videoId,
          user_id: userId || null,
          ip_address: ipAddress,
          user_agent: userAgent,
        });

      if (insertError) {
        console.error("Error creating view:", insertError);
      } else {
        // Increment view count
        await sb
          .from("recipe_videos")
          .update({ view_count: video.view_count + 1 })
          .eq("id", videoId);
      }
    }

    return NextResponse.json({
      success: true,
      view_count: existingView ? video.view_count : video.view_count + 1,
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    // Don't fail the request - tracking is best-effort
    return NextResponse.json({ success: true });
  }
}
