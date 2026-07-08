import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET: Get user's feed (recipes from followed supermarkets and popular content)
export async function GET(request: NextRequest) {
  const sb = await getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({
      feed_items: [
        {
          id: "feed-1",
          type: "new_recipe",
          recipe: {
            id: "r-1",
            slug: "classic-french-ratatouille",
            title: { en: "Classic French Ratatouille" },
            main_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
            author: { id: "s-1", name: "Fresh Mart", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80", is_supermarket: true },
            created_at: "2024-07-05T10:30:00Z",
            rating: 4.8,
            favorite_count: 1284
          },
          supermarket: {
            id: "s-1",
            supermarket_name: { en: "Fresh Mart" },
            profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
          },
          timestamp: "2024-07-05T10:30:00Z",
          action: "published"
        },
        {
          id: "feed-2",
          type: "new_product",
          product: {
            id: "p-1",
            slug: "organic-tomatoes",
            name: { en: "Organic Vine Tomatoes" },
            image_url: "https://images.unsplash.com/photo-1592841200221-21e7500398b3?auto=format&fit=crop&w=200&q=80",
            price: 2.99,
            on_sale: false
          },
          supermarket: {
            id: "s-1",
            supermarket_name: { en: "Fresh Mart" },
            profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
          },
          timestamp: "2024-07-04T15:45:00Z",
          action: "added"
        },
        {
          id: "feed-3",
          type: "new_coupon",
          coupon: {
            id: "c-1",
            code: "SUMMER20",
            title: { en: "20% Off Summer Produce" },
            description: { en: "Get 20% off all fresh fruits and vegetables this summer" },
            discount_amount: 20,
            discount_type: "percentage",
            expiration_date: "2024-08-31"
          },
          supermarket: {
            id: "s-2",
            supermarket_name: { en: "Green Grocer" },
            profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
          },
          timestamp: "2024-07-03T09:20:00Z",
          action: "created"
        },
        {
          id: "feed-4",
          type: "new_bundle",
          bundle: {
            id: "b-1",
            title: { en: "BBQ Summer Bundle" },
            description: { en: "Everything you need for the perfect summer BBQ" },
            original_price: 45.00,
            discounted_price: 35.00,
            discount_percentage: 22.22,
            products_count: 8
          },
          supermarket: {
            id: "s-1",
            supermarket_name: { en: "Fresh Mart" },
            profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
          },
          timestamp: "2024-07-02T11:15:00Z",
          action: "launched"
        },
        {
          id: "feed-5",
          type: "popular_recipe",
          recipe: {
            id: "r-2",
            slug: "easy-chocolate-cake",
            title: { en: "Easy Chocolate Cake" },
            main_image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
            author: { id: "user-2", name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80", is_supermarket: false },
            created_at: "2024-06-22T16:45:00Z",
            rating: 4.9,
            favorite_count: 2156,
            trending_score: 95
          },
          timestamp: "2024-07-01T08:00:00Z",
          action: "trending"
        }
      ],
      has_more: true,
      next_cursor: "feed-5"
    });
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to view your feed" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");
    const lang = searchParams.get("lang") || "en";

    // Get followed supermarket IDs
    const { data: follows, error: followsError } = await sb
      .from("supermarket_follows")
      .select("supermarket_id")
      .eq("user_id", user.id);

    if (followsError) {
      console.error("Error fetching follows:", followsError);
      return NextResponse.json(
        { error: "Failed to fetch feed" },
        { status: 500 }
      );
    }

    const followedSupermarketIds = follows?.map(f => f.supermarket_id) || [];

    // Get feed items
    const feedItems: any[] = [];

    // 1. New recipes from followed supermarkets
    if (followedSupermarketIds.length > 0) {
      const { data: recipes, error: recipesError } = await sb
        .from("recipes")
        .select(
          "id, slug, title, main_image, rating, favorite_count, created_at, " +
          "author_id, profiles:author_id(id, email, supermarket_name, profile_picture_url, full_name)"
        )
        .in("author_id", followedSupermarketIds)
        .eq("is_approved", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!recipesError) {
        recipes?.forEach((r: any) => {
          feedItems.push({
            id: `recipe-${r.id}`,
            type: "new_recipe",
            recipe: {
              ...r,
              title: r.title?.[lang] || r.title?.en || "Untitled",
              author: r.profiles ? {
                id: r.profiles.id,
                email: r.profiles.email,
                name: r.profiles.full_name || r.profiles.supermarket_name || r.profiles.email?.split('@')[0],
                avatar: r.profiles.profile_picture_url,
                is_supermarket: !!r.profiles.supermarket_name
              } : null
            },
            supermarket: r.profiles && r.profiles.supermarket_name ? {
              id: r.author_id,
              supermarket_name: { en: r.profiles.supermarket_name },
              profile_picture_url: r.profiles.profile_picture_url
            } : null,
            timestamp: r.created_at,
            action: "published"
          });
        });
      }
    }

    // 2. New products from followed supermarkets
    if (followedSupermarketIds.length > 0) {
      const { data: products, error: productsError } = await sb
        .from("products")
        .select(
          "id, slug, name, image_url, price, on_sale, created_at, supermarket_id, supermarkets:supermarket_id(id, supermarket_name, profile_picture_url)"
        )
        .in("supermarket_id", followedSupermarketIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!productsError) {
        products?.forEach((p: any) => {
          feedItems.push({
            id: `product-${p.id}`,
            type: "new_product",
            product: {
              ...p,
              name: p.name?.[lang] || p.name?.en || "Untitled"
            },
            supermarket: p.supermarkets ? {
              id: p.supermarket_id,
              supermarket_name: { en: p.supermarkets.supermarket_name },
              profile_picture_url: p.supermarkets.profile_picture_url
            } : null,
            timestamp: p.created_at,
            action: "added"
          });
        });
      }
    }

    // 3. Coupons and promotions from followed supermarkets
    if (followedSupermarketIds.length > 0) {
      const { data: coupons, error: couponsError } = await sb
        .from("coupons")
        .select(
          "id, code, title, description, discount_amount, discount_type, expiration_date, created_at, supermarket_id, supermarkets:supermarket_id(id, supermarket_name, profile_picture_url)"
        )
        .in("supermarket_id", followedSupermarketIds)
        .gte("expiration_date", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!couponsError) {
        coupons?.forEach((c: any) => {
          feedItems.push({
            id: `coupon-${c.id}`,
            type: "new_coupon",
            coupon: {
              ...c,
              title: c.title?.[lang] || c.title?.en || "Untitled",
              description: c.description?.[lang] || c.description?.en || ""
            },
            supermarket: c.supermarkets ? {
              id: c.supermarket_id,
              supermarket_name: { en: c.supermarkets.supermarket_name },
              profile_picture_url: c.supermarkets.profile_picture_url
            } : null,
            timestamp: c.created_at,
            action: "created"
          });
        });
      }
    }

    // 4. Bundles from followed supermarkets
    if (followedSupermarketIds.length > 0) {
      const { data: bundles, error: bundlesError } = await sb
        .from("bundles")
        .select(
          "id, title, description, original_price, discounted_price, created_at, supermarket_id, supermarkets:supermarket_id(id, supermarket_name, profile_picture_url)"
        )
        .in("supermarket_id", followedSupermarketIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!bundlesError) {
        bundles?.forEach((b: any) => {
          const discountPercentage = b.original_price > 0 ? 
            ((b.original_price - b.discounted_price) / b.original_price * 100) : 0;
          
          feedItems.push({
            id: `bundle-${b.id}`,
            type: "new_bundle",
            bundle: {
              ...b,
              title: b.title?.[lang] || b.title?.en || "Untitled",
              description: b.description?.[lang] || b.description?.en || "",
              discount_percentage: Math.round(discountPercentage * 10) / 10
            },
            supermarket: b.supermarkets ? {
              id: b.supermarket_id,
              supermarket_name: { en: b.supermarkets.supermarket_name },
              profile_picture_url: b.supermarkets.profile_picture_url
            } : null,
            timestamp: b.created_at,
            action: "launched"
          });
        });
      }
    }

    // 5. Trending recipes (fallback if no followed supermarkets)
    if (feedItems.length === 0 || followedSupermarketIds.length === 0) {
      const { data: trendingRecipes, error: trendingError } = await sb
        .from("recipes")
        .select(
          "id, slug, title, main_image, rating, favorite_count, created_at, " +
          "author_id, profiles:author_id(id, email, supermarket_name, profile_picture_url, full_name)"
        )
        .eq("is_approved", true)
        .eq("status", "published")
        .gte("favorite_count", 100)
        .order("favorite_count", { ascending: false })
        .limit(limit);

      if (!trendingError) {
        trendingRecipes?.forEach((r: any) => {
          feedItems.push({
            id: `trending-${r.id}`,
            type: "popular_recipe",
            recipe: {
              ...r,
              title: r.title?.[lang] || r.title?.en || "Untitled",
              author: r.profiles ? {
                id: r.profiles.id,
                email: r.profiles.email,
                name: r.profiles.full_name || r.profiles.supermarket_name || r.profiles.email?.split('@')[0],
                avatar: r.profiles.profile_picture_url,
                is_supermarket: !!r.profiles.supermarket_name
              } : null,
              trending_score: r.favorite_count
            },
            timestamp: r.created_at,
            action: "trending"
          });
        });
      }
    }

    // Sort all feed items by timestamp (newest first)
    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const limitedFeedItems = feedItems.slice(0, limit);

    return NextResponse.json({
      feed_items: limitedFeedItems,
      has_more: feedItems.length > limit,
      next_cursor: limitedFeedItems.length > 0 ? limitedFeedItems[limitedFeedItems.length - 1].id : null
    });

  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}