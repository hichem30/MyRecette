import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET: List all supermarkets with filtering and sorting
export async function GET(request: NextRequest) {
  const sb = getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      supermarkets: [
        {
          id: "s-1",
          supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
          slug: "fresh-mart",
          profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
          banner_url: "https://images.unsplash.com/photo-1555507036-ab794f4ade0a?auto=format&fit=crop&w=800&q=80",
          description: { en: "Premium grocery store offering fresh produce, organic products, and local specialties." },
          address: { line1: "123 Main St", city: "Paris", state: "Ile-de-France", country: "France" },
          phone: "+33123456789",
          email: "contact@freshmart.fr",
          website: "https://freshmart.fr",
          product_count: 1247,
          follower_count: 842,
          rating: 4.7,
          review_count: 234,
          subscription_status: "active",
          is_verified: true,
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
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: "s-2",
          supermarket_name: { en: "Green Grocer", es: "Verdulero Verde", fr: "Épicerie Verte", ar: "بقال أخضر" },
          slug: "green-grocer",
          profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          banner_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80",
          description: { en: "Your neighborhood organic market with farm-fresh produce." },
          address: { line1: "456 Oak Ave", city: "Paris", state: "Ile-de-France", country: "France" },
          phone: "+33198765432",
          email: "info@greengrocer.com",
          website: "https://greengrocer.com",
          product_count: 856,
          follower_count: 528,
          rating: 4.8,
          review_count: 187,
          subscription_status: "active",
          is_verified: true,
          opening_hours: [
            { day: "Monday", opens: "07:00", closes: "19:00", is_open: true },
            { day: "Tuesday", opens: "07:00", closes: "19:00", is_open: true },
            { day: "Wednesday", opens: "07:00", closes: "19:00", is_open: true },
            { day: "Thursday", opens: "07:00", closes: "19:00", is_open: true },
            { day: "Friday", opens: "07:00", closes: "20:00", is_open: true },
            { day: "Saturday", opens: "08:00", closes: "18:00", is_open: true },
            { day: "Sunday", opens: "09:00", closes: "17:00", is_open: true }
          ],
          location_geometry: { type: "Point", coordinates: [2.3456, 48.8678] },
          created_at: "2024-02-20T14:45:00Z"
        },
        {
          id: "s-3",
          supermarket_name: { en: "Bio Market", es: "Mercado Bio", fr: "Marché Bio", ar: "سوق بيولوجي" },
          slug: "bio-market",
          profile_picture_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
          banner_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
          description: { en: "Certified organic products and health foods." },
          address: { line1: "789 Pine Rd", city: "Lyon", state: "Auvergne-Rhône-Alpes", country: "France" },
          phone: "+33456789012",
          email: "hello@biomarket.com",
          website: "https://biomarket.com",
          product_count: 623,
          follower_count: 341,
          rating: 4.6,
          review_count: 98,
          subscription_status: "active",
          is_verified: false,
          opening_hours: [
            { day: "Monday", opens: "09:00", closes: "18:00", is_open: true },
            { day: "Tuesday", opens: "09:00", closes: "18:00", is_open: true },
            { day: "Wednesday", opens: "09:00", closes: "18:00", is_open: true },
            { day: "Thursday", opens: "09:00", closes: "18:00", is_open: true },
            { day: "Friday", opens: "09:00", closes: "19:00", is_open: true },
            { day: "Saturday", opens: "09:00", closes: "16:00", is_open: true },
            { day: "Sunday", opens: "closed", closes: "closed", is_open: false }
          ],
          location_geometry: { type: "Point", coordinates: [4.8357, 45.7640] },
          created_at: "2024-03-10T09:20:00Z"
        }
      ],
      total: 3,
      limit: 20,
      offset: 0
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const isVerified = searchParams.get("verified");
    const sort = searchParams.get("sort");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const lang = searchParams.get("lang") || "en";

    // Base query
    let query = sb
      .from("profiles")
      .select(
        "id, supermarket_name, slug, profile_picture_url, banner_url, description, " +
        "address, phone, email, website, product_count, follower_count, rating, review_count, " +
        "subscription_status, is_verified, opening_hours, location_geometry, created_at, " +
        "social_links, categories"
      )
      .not("supermarket_name", "is", null)
      .not("supermarket_name", "eq", "{}");

    // Apply filters
    if (isVerified !== null) {
      query = query.eq("is_verified", isVerified === "true");
    }

    if (category) {
      // Filter by category - this assumes supermarket profiles have a categories field
      query = query.contains("categories", `[${category}]`);
    }

    // Text search
    if (q) {
      const searchLower = q.toLowerCase();
      query = query.or(
        `supermarket_name->>${lang}.ilike.%${searchLower}%,` +
        `supermarket_name->>en.ilike.%${searchLower}%,` +
        `description->>${lang}.ilike.%${searchLower}%,` +
        `description->>en.ilike.%${searchLower}%`
      );
    }

    // Ordering
    switch (sort) {
      case "rating":
        query = query.order("rating", { ascending: false, nullsFirst: false });
        break;
      case "products":
        query = query.order("product_count", { ascending: false });
        break;
      case "followers":
        query = query.order("follower_count", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default: // nearest or relevance
        query = query.order("rating", { ascending: false, nullsFirst: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: supermarkets, error, count } = await query;

    if (error) {
      console.error("Error fetching supermarkets:", error);
      return NextResponse.json(
        { error: "Failed to fetch supermarkets" },
        { status: 500 }
      );
    }

    // Format response
    const formattedSupermarkets = (supermarkets || []).map((s: any) => ({
      ...s,
      supermarket_name: s.supermarket_name?.[lang] || s.supermarket_name?.en || "Unnamed Supermarket",
      description: s.description?.[lang] || s.description?.en || "",
      address: s.address || {},
      // Calculate distance if user location is available (not implemented here)
      distance_km: null
    }));

    return NextResponse.json({
      supermarkets: formattedSupermarkets,
      total: count || formattedSupermarkets.length,
      limit,
      offset
    });

  } catch (error) {
    console.error("Error fetching supermarkets:", error);
    return NextResponse.json(
      { error: "Failed to fetch supermarkets" },
      { status: 500 }
    );
  }
}