import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ShoppingList,
  ShoppingListFormData,
  ShoppingListsApiResponse,
  ShoppingListApiResponse,
} from "@/lib/types";

// Mock data for local development
const mockShoppingLists: ShoppingList[] = [
  {
    id: "sl-1",
    user_id: "user-1",
    name: "Weekly Groceries",
    description: "My weekly shopping list",
    is_public: false,
    share_token: null,
    created_at: "2024-06-20T10:00:00Z",
    updated_at: "2024-06-20T10:00:00Z",
    user: {
      id: "user-1",
      email: "user@example.com",
      profile_picture_url: null,
    },
    items_count: 5,
  },
  {
    id: "sl-2",
    user_id: "user-1",
    name: "Party Supplies",
    description: "For the weekend BBQ",
    is_public: false,
    share_token: null,
    created_at: "2024-06-18T14:30:00Z",
    updated_at: "2024-06-19T09:15:00Z",
    user: {
      id: "user-1",
      email: "user@example.com",
      profile_picture_url: null,
    },
    items_count: 8,
  },
];

export async function GET(request: NextRequest) {
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json({ shoppingLists: mockShoppingLists, total: mockShoppingLists.length } as ShoppingListsApiResponse);
  }

  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get("include_items") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get shopping lists for this user
    let query = sb
      .from("shopping_lists")
      .select(
        "id, user_id, name, description, is_public, share_token, created_at, updated_at, " +
        "user:user_id(id, email, profile_picture_url)",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: lists, error: listsError, count } = await query;

    if (listsError) {
      console.error("Error fetching shopping lists:", listsError);
      return NextResponse.json(
        { error: "Failed to fetch shopping lists" },
        { status: 500 }
      );
    }

    // If requested, include items count
    const shoppingLists = lists ? (lists as any[]).map(list => ({
      ...list,
      items_count: 0, // Would be populated from a separate query
    })) : [];

    // Get items count for each list
    if (shoppingLists.length > 0) {
      const listIds = shoppingLists.map(l => l.id);
      const { data: itemsCounts, error: countsError } = await sb
        .from("shopping_list_items")
        .select("shopping_list_id, count(*) as count")
        .in("shopping_list_id", listIds)
        // @ts-ignore - Supabase .group() method
        .group("shopping_list_id");

      if (!countsError && itemsCounts) {
        const countsMap = new Map<string, number>();
        (itemsCounts as any[]).forEach((item: any) => {
          countsMap.set(item.shopping_list_id, parseInt(item.count));
        });

        shoppingLists.forEach(list => {
          list.items_count = countsMap.get(list.id) || 0;
        });
      }
    }

    // Include items if requested
    if (includeItems && shoppingLists.length > 0) {
      const listIds = shoppingLists.map(l => l.id);
      const { data: items, error: itemsError } = await sb
        .from("shopping_list_items")
        .select(
          "id, shopping_list_id, product_id, ingredient_id, custom_name, quantity, unit, notes, is_checked, position, created_at, updated_at, " +
          "product:product_id(id, name, price, image_url, slug), " +
          "ingredient:ingredient_id(id, canonical_name, display_name, category)"
        )
        .in("shopping_list_id", listIds)
        .order("position", { ascending: true });

      if (!itemsError && items) {
        const itemsByList = new Map<string, any[]>();
        (items as any[]).forEach(item => {
          const listId = item.shopping_list_id;
          if (!itemsByList.has(listId)) {
            itemsByList.set(listId, []);
          }
          itemsByList.get(listId)?.push(item);
        });

        shoppingLists.forEach(list => {
          list.items = itemsByList.get(list.id) || [];
        });
      }
    }

    return NextResponse.json({
      shoppingLists,
      total: count || shoppingLists.length,
    } as ShoppingListsApiResponse);

  } catch (error) {
    console.error("Error in GET /api/shopping-lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping lists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock response for local development
    const body = await request.json();
    const { name, description, is_public } = body;
    
    const newList: ShoppingList = {
      id: `sl-mock-${Date.now()}`,
      user_id: "user-1",
      name,
      description: description || null,
      is_public: is_public || false,
      share_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: "user-1",
        email: "user@example.com",
        profile_picture_url: null,
      },
      items_count: 0,
    };

    return NextResponse.json({ shoppingList: { ...newList, items: [] } } as ShoppingListApiResponse);
  }

  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, is_public = false }: ShoppingListFormData = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "List name is required" },
        { status: 400 }
      );
    }

    // Create new shopping list
    const { data: newList, error: createError } = await sb
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public,
        share_token: is_public ? generateShareToken() : null,
      })
      .select(
        "id, user_id, name, description, is_public, share_token, created_at, updated_at, " +
        "user:user_id(id, email, profile_picture_url)"
      )
      .single();

    if (createError || !newList) {
      console.error("Error creating shopping list:", createError);
      return NextResponse.json(
        { error: "Failed to create shopping list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ shoppingList: { ...(newList as unknown as ShoppingList), items: [], items_count: 0 } } as ShoppingListApiResponse);

  } catch (error) {
    console.error("Error in POST /api/shopping-lists:", error);
    return NextResponse.json(
      { error: "Failed to create shopping list" },
      { status: 500 }
    );
  }
}

// Helper function to generate share tokens
function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}