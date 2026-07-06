import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ShoppingListWithItems,
  ShoppingListFormData,
  ShoppingListItemFormData,
  ShoppingListApiResponse,
} from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock data for local development
    const mockList: ShoppingListWithItems = {
      id: listId,
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
      items: [
        {
          id: "sli-1",
          shopping_list_id: listId,
          product_id: "prod-1",
          ingredient_id: null,
          custom_name: null,
          quantity: 2,
          unit: "kg",
          notes: "Fresh and organic",
          is_checked: false,
          position: 1,
          created_at: "2024-06-20T10:05:00Z",
          updated_at: "2024-06-20T10:05:00Z",
          product: {
            id: "prod-1",
            name: { en: "Apples", es: "Manzanas", fr: "Pommes", ar: "تفاح" },
            price: 2.99,
            image_url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=100&q=80",
            slug: "apples",
          },
          ingredient: null,
        },
        {
          id: "sli-2",
          shopping_list_id: listId,
          product_id: null,
          ingredient_id: "ing-2",
          custom_name: "Fresh Milk",
          quantity: 1,
          unit: "liter",
          notes: "Whole milk",
          is_checked: true,
          position: 2,
          created_at: "2024-06-20T10:10:00Z",
          updated_at: "2024-06-20T10:15:00Z",
          product: null,
          ingredient: {
            id: "ing-2",
            canonical_name: "milk",
            display_name: { en: "Milk", es: "Leche", fr: "Lait", ar: "حليب" },
            category: "dairy",
          },
        },
        {
          id: "sli-3",
          shopping_list_id: listId,
          product_id: null,
          ingredient_id: null,
          custom_name: "Bread",
          quantity: 1,
          unit: null,
          notes: "Sourdough",
          is_checked: false,
          position: 3,
          created_at: "2024-06-20T10:20:00Z",
          updated_at: "2024-06-20T10:20:00Z",
          product: null,
          ingredient: null,
        },
      ],
    };

    return NextResponse.json({ shoppingList: mockList } as ShoppingListApiResponse);
  }

  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the shopping list
    const { data: list, error: listError } = await sb
      .from("shopping_lists")
      .select(
        "id, user_id, name, description, is_public, share_token, created_at, updated_at, " +
        "user:user_id(id, email, profile_picture_url)"
      )
      .eq("id", listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: "Shopping list not found" },
        { status: 404 }
      );
    }

    // Check if user owns this list or it's public
    const isOwner = list.user_id === user.id;
    const isPublic = list.is_public;

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get items for this list
    const { data: items, error: itemsError } = await sb
      .from("shopping_list_items")
      .select(
        "id, shopping_list_id, product_id, ingredient_id, custom_name, quantity, unit, notes, is_checked, position, created_at, updated_at, " +
        "product:product_id(id, name, price, image_url, slug), " +
        "ingredient:ingredient_id(id, canonical_name, display_name, category)"
      )
      .eq("shopping_list_id", listId)
      .order("position", { ascending: true });

    const shoppingList: ShoppingListWithItems = {
      ...(list as any),
      items: items || [],
    };

    return NextResponse.json({ shoppingList } as ShoppingListApiResponse);

  } catch (error) {
    console.error("Error in GET /api/shopping-lists/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock response for local development
    const body = await request.json();
    const { name, description, is_public }: ShoppingListFormData = body;

    return NextResponse.json({
      shoppingList: {
        id: listId,
        user_id: "user-1",
        name: name || "Updated List",
        description: description || null,
        is_public: is_public || false,
        share_token: null,
        created_at: "2024-06-20T10:00:00Z",
        updated_at: new Date().toISOString(),
        user: { id: "user-1", email: "user@example.com", profile_picture_url: null },
        items: [],
        items_count: 0,
      },
    } as ShoppingListApiResponse);
  }

  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the shopping list
    const { data: list, error: listError } = await sb
      .from("shopping_lists")
      .select("id, user_id")
      .eq("id", listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: "Shopping list not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (list.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, is_public }: ShoppingListFormData = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "List name is required" },
        { status: 400 }
      );
    }

    // Update the shopping list
    const { data: updatedList, error: updateError } = await sb
      .from("shopping_lists")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listId)
      .select(
        "id, user_id, name, description, is_public, share_token, created_at, updated_at, " +
        "user:user_id(id, email, profile_picture_url)"
      )
      .single();

    if (updateError || !updatedList) {
      console.error("Error updating shopping list:", updateError);
      return NextResponse.json(
        { error: "Failed to update shopping list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ shoppingList: { ...updatedList, items: [] } } as ShoppingListApiResponse);

  } catch (error) {
    console.error("Error in PUT /api/shopping-lists/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock response for local development
    return NextResponse.json({ success: true, message: "Shopping list deleted" });
  }

  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the shopping list to check ownership
    const { data: list, error: listError } = await sb
      .from("shopping_lists")
      .select("id, user_id")
      .eq("id", listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: "Shopping list not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (list.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the shopping list (and its items via cascade)
    const { error: deleteError } = await sb
      .from("shopping_lists")
      .delete()
      .eq("id", listId);

    if (deleteError) {
      console.error("Error deleting shopping list:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete shopping list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Shopping list deleted" });

  } catch (error) {
    console.error("Error in DELETE /api/shopping-lists/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping list" },
      { status: 500 }
    );
  }
}