import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// Types for feed post creation
type FeedPostType = 'new_product' | 'price_change' | 'sale_start' | 'coupon_added' | 'bundle_added' | 'job_posted' | 'announcement';

interface CreateFeedPostRequest {
  type: FeedPostType;
  entity_id?: string;
  title: { en: string; es?: string };
  description?: { en: string; es?: string };
  image_url?: string;
  action_url: string;
  visibility?: 'public' | 'followers_only';
}

interface UpdateFeedPostRequest {
  type?: FeedPostType;
  entity_id?: string;
  title?: { en: string; es?: string };
  description?: { en: string; es?: string };
  image_url?: string;
  action_url?: string;
  active?: boolean;
  pinned?: boolean;
  visibility?: 'public' | 'followers_only';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';
  
  const cookieStore = await cookies();
  
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, maxAge: 60 * 60 });
        },
        remove(name: string) {
          cookieStore.set({ name, value: "", maxAge: 0 });
        },
      },
    }
  );
  
  // Check if supermarket exists and is a supermarket
  const { data: supermarket, error: supermarketErr } = await sb
    .from("profiles")
    .select("id, is_supermarket")
    .eq("id", supermarketId)
    .eq("is_supermarket", true)
    .maybeSingle();
  
  if (supermarketErr || !supermarket) {
    return NextResponse.json(
      { error: "Supermarket not found or is not a valid supermarket." },
      { status: 404 }
    );
  }
  
  // Get feed posts for this supermarket
  const { data, error, count } = await sb
    .from("supermarket_feed")
    .select(
      "id, type, entity_id, title, description, image_url, action_url, active, pinned, visibility, created_at, updated_at",
      { count: "exact" }
    )
    .eq("supermarket_id", supermarketId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);
  
  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to fetch feed posts." },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data,
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const cookieStore = await cookies();
  
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, maxAge: 60 * 60 });
        },
        remove(name: string) {
          cookieStore.set({ name, value: "", maxAge: 0 });
        },
      },
    }
  );
  
  // Get current user
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to create a feed post." },
      { status: 401 }
    );
  }
  
  // Check if user is the supermarket owner
  const { data: supermarket, error: supermarketErr } = await sb
    .from("profiles")
    .select("id, is_supermarket")
    .eq("id", supermarketId)
    .eq("is_supermarket", true)
    .maybeSingle();
  
  if (supermarketErr || !supermarket) {
    return NextResponse.json(
      { error: "Supermarket not found or is not a valid supermarket." },
      { status: 404 }
    );
  }
  
  // Check if user owns this supermarket
  if (supermarket.id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the supermarket owner can create feed posts." },
      { status: 403 }
    );
  }
  
  // Parse request body
  let body: CreateFeedPostRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
  
  // Validate required fields
  if (!body.type || !body.title || !body.action_url) {
    return NextResponse.json(
      { error: "Missing required fields: type, title, and action_url are required." },
      { status: 400 }
    );
  }
  
  // Create feed post
  const { data: feedPost, error: insertError } = await sb
    .from("supermarket_feed")
    .insert([
      {
        supermarket_id: supermarketId,
        type: body.type,
        entity_id: body.entity_id || null,
        title: body.title,
        description: body.description || null,
        image_url: body.image_url || null,
        action_url: body.action_url,
        visibility: body.visibility || 'public',
        active: true,
        pinned: false,
      },
    ])
    .select(
      "id, type, entity_id, title, description, image_url, action_url, active, pinned, visibility, created_at, updated_at"
    )
    .single();
  
  if (insertError) {
    console.error("Feed post creation error:", insertError);
    return NextResponse.json(
      { error: "Failed to create feed post." },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "Feed post created successfully.",
    data: feedPost,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post_id');
  
  if (!postId) {
    return NextResponse.json(
      { error: "Missing post_id parameter." },
      { status: 400 }
    );
  }
  
  const cookieStore = await cookies();
  
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, maxAge: 60 * 60 });
        },
        remove(name: string) {
          cookieStore.set({ name, value: "", maxAge: 0 });
        },
      },
    }
  );
  
  // Get current user
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to update a feed post." },
      { status: 401 }
    );
  }
  
  // Check if user is the supermarket owner
  const { data: supermarket, error: supermarketErr } = await sb
    .from("profiles")
    .select("id, is_supermarket")
    .eq("id", supermarketId)
    .eq("is_supermarket", true)
    .maybeSingle();
  
  if (supermarketErr || !supermarket) {
    return NextResponse.json(
      { error: "Supermarket not found or is not a valid supermarket." },
      { status: 404 }
    );
  }
  
  // Check if user owns this supermarket
  if (supermarket.id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the supermarket owner can update feed posts." },
      { status: 403 }
    );
  }
  
  // Verify post belongs to this supermarket
  const { data: existingPost, error: postErr } = await sb
    .from("supermarket_feed")
    .select("id, supermarket_id")
    .eq("id", postId)
    .maybeSingle();
  
  if (postErr || !existingPost) {
    return NextResponse.json(
      { error: "Feed post not found." },
      { status: 404 }
    );
  }
  
  if (existingPost.supermarket_id !== supermarketId) {
    return NextResponse.json(
      { error: "Feed post does not belong to this supermarket." },
      { status: 403 }
    );
  }
  
  // Parse request body
  let body: UpdateFeedPostRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
  
  // Build update object (only include fields that are provided)
  const updateData: Record<string, unknown> = {};
  if (body.type !== undefined) updateData.type = body.type;
  if (body.entity_id !== undefined) updateData.entity_id = body.entity_id;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.image_url !== undefined) updateData.image_url = body.image_url;
  if (body.action_url !== undefined) updateData.action_url = body.action_url;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.pinned !== undefined) updateData.pinned = body.pinned;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;
  
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update." },
      { status: 400 }
    );
  }
  
  updateData.updated_at = new Date().toISOString();
  
  // Update feed post
  const { data: updatedPost, error: updateError } = await sb
    .from("supermarket_feed")
    .update(updateData)
    .eq("id", postId)
    .select(
      "id, type, entity_id, title, description, image_url, action_url, active, pinned, visibility, created_at, updated_at"
    )
    .single();
  
  if (updateError) {
    console.error("Feed post update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update feed post." },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "Feed post updated successfully.",
    data: updatedPost,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post_id');
  
  if (!postId) {
    return NextResponse.json(
      { error: "Missing post_id parameter." },
      { status: 400 }
    );
  }
  
  const cookieStore = await cookies();
  
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, maxAge: 60 * 60 });
        },
        remove(name: string) {
          cookieStore.set({ name, value: "", maxAge: 0 });
        },
      },
    }
  );
  
  // Get current user
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to delete a feed post." },
      { status: 401 }
    );
  }
  
  // Check if user is the supermarket owner
  const { data: supermarket, error: supermarketErr } = await sb
    .from("profiles")
    .select("id, is_supermarket")
    .eq("id", supermarketId)
    .eq("is_supermarket", true)
    .maybeSingle();
  
  if (supermarketErr || !supermarket) {
    return NextResponse.json(
      { error: "Supermarket not found or is not a valid supermarket." },
      { status: 404 }
    );
  }
  
  // Check if user owns this supermarket
  if (supermarket.id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the supermarket owner can delete feed posts." },
      { status: 403 }
    );
  }
  
  // Verify post belongs to this supermarket
  const { data: existingPost, error: postErr } = await sb
    .from("supermarket_feed")
    .select("id, supermarket_id")
    .eq("id", postId)
    .maybeSingle();
  
  if (postErr || !existingPost) {
    return NextResponse.json(
      { error: "Feed post not found." },
      { status: 404 }
    );
  }
  
  if (existingPost.supermarket_id !== supermarketId) {
    return NextResponse.json(
      { error: "Feed post does not belong to this supermarket." },
      { status: 403 }
    );
  }
  
  // Delete feed post
  const { error: deleteError } = await sb
    .from("supermarket_feed")
    .delete()
    .eq("id", postId);
  
  if (deleteError) {
    console.error("Feed post deletion error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete feed post." },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "Feed post deleted successfully.",
  });
}
