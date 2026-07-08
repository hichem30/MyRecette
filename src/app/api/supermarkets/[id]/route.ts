import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET: Get a single supermarket by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await getSupabaseServerClient();
  const { id } = await params;
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      supermarket: {
        id: "s-1",
        supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
        slug: "fresh-mart",
        profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
        banner_url: "https://images.unsplash.com/photo-1555507036-ab794f4ade0a?auto=format&fit=crop&w=800&q=80",
        description: { en: "Premium grocery store offering fresh produce, organic products, and local specialties." },
        address: { line1: "123 Main St", line2: "", city: "Paris", state: "Ile-de-France", postal_code: "75001", country: "France" },
        phone: "+33123456789",
        email: "contact@freshmart.fr",
        website: "https://freshmart.fr",
        product_count: 1247,
        follower_count: 842,
        rating: 4.7,
        review_count: 234,
        subscription_status: "active",
        is_verified: true,
        is_followed: false,
        opening_hours: [
          { day: "Monday", opens: "08:00", closes: "20:00", is_open: true },
          { day: "Tuesday", opens: "08:00", closes: "20:00", is_open: true },
          { day: "Wednesday", opens: "08:00", closes: "20:00", is_open: true },
          { day: "Thursday", opens: "08:00", closes: "20:00", is_open: true },
          { day: "Friday", opens: "08:00", closes: "22:00", is_open: true },
          { day: "Saturday", opens: "09:00", closes: "21:00", is_open: true },
          { day: "Sunday", opens: "10:00", closes: "18:00", is_open: true }
        ],
        location_geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
        social_links: {
          facebook: "https://facebook.com/freshmart",
          instagram: "https://instagram.com/freshmart",
          twitter: "https://twitter.com/freshmart",
          linkedin: ""
        },
        categories: ["Grocery", "Organic", "Local Products"],
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-07-01T14:25:00Z"
      }
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";
    
    // Get supermarket details
    const { data: supermarket, error: supermarketError } = await sb
      .from("profiles")
      .select(
        "id, supermarket_name, slug, profile_picture_url, banner_url, description, " +
        "address, phone, email, website, product_count, follower_count, rating, review_count, " +
        "subscription_status, is_verified, opening_hours, location_geometry, created_at, updated_at, " +
        "social_links, categories"
      )
      .eq("id", id)
      .maybeSingle();

    if (supermarketError || !supermarket) {
      console.error("Error fetching supermarket:", supermarketError);
      return NextResponse.json(
        { error: "Supermarket not found" },
        { status: 404 }
      );
    }

    // Check if current user follows this supermarket
    const user = await getCurrentUser();
    let isFollowed = false;
    
    if (user) {
      const { data: follow, error: followError } = await sb
        .from("supermarket_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("supermarket_id", id)
        .maybeSingle();

      if (!followError && follow) {
        isFollowed = true;
      }
    }

    // Format response
    const s = supermarket as any;
    const formattedSupermarket = {
      ...s,
      supermarket_name: s.supermarket_name?.[lang] || s.supermarket_name?.en || "Unnamed Supermarket",
      description: s.description?.[lang] || s.description?.en || "",
      address: s.address || {},
      social_links: s.social_links || {},
      categories: s.categories || [],
      is_followed: isFollowed
    };

    return NextResponse.json({
      supermarket: formattedSupermarket
    });

  } catch (error) {
    console.error("Error fetching supermarket:", error);
    return NextResponse.json(
      { error: "Failed to fetch supermarket" },
      { status: 500 }
    );
  }
}

// PUT: Update supermarket (admin or owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await getSupabaseServerClient();
  const { id } = await params;
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check if user is admin or the supermarket owner
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    // Check if user is admin
    const whoami = await fetch("/api/whoami", { cache: "no-store" })
      .then(res => res.json()) as { isAdmin?: boolean };

    const isAdmin = whoami?.isAdmin || profile.role === "admin";
    
    // Check if user owns this supermarket
    const { data: supermarket, error: supermarketError } = await sb
      .from("profiles")
      .select("id, supermarket_name, slug, description, address, phone, email, website, opening_hours, social_links, categories, location_geometry")
      .eq("id", id)
      .maybeSingle();

    if (supermarketError || !supermarket) {
      return NextResponse.json(
        { error: "Supermarket not found" },
        { status: 404 }
      );
    }

    const isOwner = supermarket.id === user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden - Only admin or supermarket owner can update" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update supermarket
    const { data: updatedSupermarket, error: updateError } = await sb
      .from("profiles")
      .update({
        supermarket_name: body.supermarket_name || supermarket.supermarket_name,
        slug: body.slug || supermarket.slug,
        description: body.description || supermarket.description,
        address: body.address || supermarket.address,
        phone: body.phone || supermarket.phone,
        email: body.email || supermarket.email,
        website: body.website || supermarket.website,
        opening_hours: body.opening_hours || supermarket.opening_hours,
        social_links: body.social_links || supermarket.social_links,
        categories: body.categories || supermarket.categories,
        location_geometry: body.location_geometry || supermarket.location_geometry,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id, supermarket_name, slug, updated_at")
      .single();

    if (updateError) {
      console.error("Error updating supermarket:", updateError);
      return NextResponse.json(
        { error: "Failed to update supermarket" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Supermarket updated successfully",
      supermarket: updatedSupermarket
    });

  } catch (error) {
    console.error("Error updating supermarket:", error);
    return NextResponse.json(
      { error: "Failed to update supermarket" },
      { status: 500 }
    );
  }
}

// DELETE: Delete supermarket (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await getSupabaseServerClient();
  const { id } = await params;
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const whoami = await fetch("/api/whoami", { cache: "no-store" })
      .then(res => res.json()) as { isAdmin?: boolean };

    const isAdmin = whoami?.isAdmin;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only admin can delete supermarkets" },
        { status: 403 }
      );
    }

    // Delete supermarket
    const { error: deleteError } = await sb
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting supermarket:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete supermarket" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Supermarket deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting supermarket:", error);
    return NextResponse.json(
      { error: "Failed to delete supermarket" },
      { status: 500 }
    );
  }
}