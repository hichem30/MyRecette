import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

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
      { error: "Unauthorized. Please sign in to follow a supermarket." },
      { status: 401 }
    );
  }
  
  // Check if supermarket exists
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
  
  // Check if already following
  const { data: existingFollow, error: followErr } = await sb
    .from("supermarket_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("supermarket_id", supermarketId)
    .maybeSingle();
  
  if (followErr) {
    console.error("Follow check error:", followErr);
    return NextResponse.json(
      { error: "Failed to check follow status." },
      { status: 500 }
    );
  }
  
  if (existingFollow) {
    return NextResponse.json(
      { 
        success: false, 
        error: "You are already following this supermarket.",
        is_following: true 
      },
      { status: 400 }
    );
  }
  
  // Follow the supermarket
  const { error: insertError } = await sb
    .from("supermarket_follows")
    .insert([
      {
        user_id: user.id,
        supermarket_id: supermarketId,
      },
    ]);
  
  if (insertError) {
    console.error("Follow insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to follow supermarket." },
      { status: 500 }
    );
  }
  
  // Get updated follower count
  const { count, error: countError } = await sb
    .from("supermarket_follows")
    .select("*", { count: "exact", head: true })
    .eq("supermarket_id", supermarketId);
  
  return NextResponse.json({
    success: true,
    is_following: true,
    follower_count: countError ? 0 : count,
  });
}

export async function DELETE(
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
      { error: "Unauthorized. Please sign in to unfollow a supermarket." },
      { status: 401 }
    );
  }
  
  // Check if supermarket exists
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
  
  // Unfollow the supermarket
  const { error: deleteError } = await sb
    .from("supermarket_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("supermarket_id", supermarketId);
  
  if (deleteError) {
    console.error("Unfollow error:", deleteError);
    return NextResponse.json(
      { error: "Failed to unfollow supermarket." },
      { status: 500 }
    );
  }
  
  // Get updated follower count
  const { count, error: countError } = await sb
    .from("supermarket_follows")
    .select("*", { count: "exact", head: true })
    .eq("supermarket_id", supermarketId);
  
  return NextResponse.json({
    success: true,
    is_following: false,
    follower_count: countError ? 0 : count,
  });
}

export async function GET(
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
    return NextResponse.json({
      is_following: false,
      follower_count: 0,
    });
  }
  
  // Check if following
  const { data: existingFollow, error: followErr } = await sb
    .from("supermarket_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("supermarket_id", supermarketId)
    .maybeSingle();
  
  // Get follower count
  const { count, error: countError } = await sb
    .from("supermarket_follows")
    .select("*", { count: "exact", head: true })
    .eq("supermarket_id", supermarketId);
  
  return NextResponse.json({
    is_following: !followErr && existingFollow !== null,
    follower_count: countError ? 0 : count,
  });
}
