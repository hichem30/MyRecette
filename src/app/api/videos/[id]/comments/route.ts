import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

interface CreateVideoCommentRequest {
  content: string;
  parent_id?: string | null;
}

interface UpdateVideoCommentRequest {
  content?: string;
}

// GET: Get all comments for a video
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
    const { data: comments, error } = await sb
      .from("video_comments")
      .select(
        "id, video_id, user_id, parent_id, content, like_count, is_approved, is_spam, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .eq("video_id", videoId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Organize comments into parent-child relationships
    const commentsMap = new Map<string, any>();
    
    (comments || []).forEach((c) => {
      commentsMap.set(c.id, {
        ...c,
        user: c.profiles ? { ...c.profiles } : null,
        replies: [],
      });
    });

    const rootComments: any[] = [];
    
    commentsMap.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return NextResponse.json(rootComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST: Create a new comment
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
        { error: "Unauthorized - please sign in to comment" },
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
    const body: CreateVideoCommentRequest = await request.json();

    if (!body.content || body.content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Check if parent comment exists (if provided)
    if (body.parent_id) {
      const { data: parentComment, error: parentError } = await sb
        .from("video_comments")
        .select("id, video_id")
        .eq("id", body.parent_id)
        .eq("video_id", videoId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create comment
    const commentData = {
      video_id: videoId,
      user_id: user.id,
      parent_id: body.parent_id || null,
      content: body.content.trim(),
      like_count: 0,
      is_approved: true, // No content moderation per requirements
      is_spam: false,
    };

    const { data: comment, error: commentError } = await sb
      .from("video_comments")
      .insert([commentData])
      .select(
        "id, video_id, user_id, parent_id, content, like_count, is_approved, is_spam, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Increment comment count on video
    await sb
      .from("recipe_videos")
      .update({ comment_count: sb.rpc("increment", { table: "recipe_videos", column: "comment_count", id: videoId }) })
      .eq("id", videoId);

    return NextResponse.json({
      ...comment,
      user: comment.profiles ? { ...comment.profiles } : null,
      replies: [],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
