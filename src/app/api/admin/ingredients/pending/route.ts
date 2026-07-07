import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - List pending ingredient mappings with filters
export async function GET(request: Request) {
  const sb = await getSupabaseRouteClient();
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit") || "100";
  const offset = searchParams.get("offset") || "0";

  // Check admin/supermarket permissions
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("id, role, is_supermarket")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "Profile not found." },
      { status: 404 }
    );
  }

  // Only admins and supermarkets can access this
  if (!profile.is_supermarket && profile.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized. Only admins and supermarkets can access ingredient mappings." },
      { status: 403 }
    );
  }

  try {
    // Build query
    let query = sb
      .from("pending_ingredient_mappings")
      .select(
        `id, product_id, supermarket_id, suggested_ingredient_id, suggested_ingredient_name, confidence, status, created_at, resolved_by, resolved_at, notes,
         products:product_id(id, name, slug),
         supermarkets:supermarket_id(id, supermarket_name),
         ingredients:suggested_ingredient_id(id, canonical_name, display_name, category, subcategory)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset ? parseInt(offset) : 0, offset ? parseInt(offset) + parseInt(limit) - 1 : parseInt(limit) - 1);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // For supermarkets, only show their own mappings unless they're admin
    if (!profile.is_supermarket && profile.role !== "admin") {
      // This shouldn't happen due to the check above, but being explicit
      query = query.eq("supermarket_id", user.id);
    } else if (profile.is_supermarket && profile.role !== "admin") {
      query = query.eq("supermarket_id", user.id);
    }

    const { data: mappings, error: mappingsError, count } = await query;

    if (mappingsError) {
      throw mappingsError;
    }

    // Process results
    const processedMappings = (mappings as unknown as Array<{
      id: string;
      product_id: string;
      supermarket_id: string | null;
      suggested_ingredient_id: string | null;
      suggested_ingredient_name: string;
      confidence: number;
      status: string;
      created_at: string;
      resolved_by: string | null;
      resolved_at: string | null;
      notes: string | null;
      products: { id: string; name: Record<string, string>; slug: string } | null;
      supermarkets: { id: string; supermarket_name: Record<string, string> } | null;
      ingredients: { id: string; canonical_name: string; display_name: Record<string, string>; category: string; subcategory: string | null } | null;
    }>).map((m) => ({
      id: m.id,
      product_id: m.product_id,
      product_name: m.products?.name?.en ?? "Unknown Product",
      product_slug: m.products?.slug,
      supermarket_id: m.supermarket_id,
      supermarket_name: m.supermarkets?.supermarket_name?.en ?? null,
      suggested_ingredient_id: m.suggested_ingredient_id,
      suggested_ingredient_name: m.suggested_ingredient_name ?? m.ingredients?.canonical_name ?? "Unknown",
      ingredient_category: m.ingredients?.category,
      ingredient_subcategory: m.ingredients?.subcategory,
      confidence: m.confidence,
      status: m.status,
      created_at: m.created_at,
      resolved_by: m.resolved_by,
      resolved_at: m.resolved_at,
      notes: m.notes,
    }));

    // Apply search filter (client-side since it spans multiple fields)
    let filteredMappings = processedMappings;
    if (search) {
      const query = search.toLowerCase();
      filteredMappings = processedMappings.filter(
        (m) =>
          m.product_name.toLowerCase().includes(query) ||
          m.suggested_ingredient_name.toLowerCase().includes(query) ||
          (m.supermarket_name?.toLowerCase() ?? "").includes(query)
      );
    }

    // Apply category filter
    if (category && category !== "all") {
      filteredMappings = filteredMappings.filter(
        (m) => m.ingredient_category === category
      );
    }

    return NextResponse.json({
      mappings: filteredMappings,
      total: count ?? 0,
      filteredCount: filteredMappings.length,
    });
  } catch (error) {
    console.error("Error fetching pending mappings:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch pending mappings",
      },
      { status: 500 }
    );
  }
}

// POST - Bulk update pending ingredient mappings
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient();

  // Check admin permissions
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("id, role, is_supermarket")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "Profile not found." },
      { status: 404 }
    );
  }

  // Only admins can bulk update (supermarkets can only manage their own via individual requests)
  if (profile.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized. Only admins can perform bulk actions." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { ids, action, reason } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided for bulk action." },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject", "ignore"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'ignore'." },
        { status: 400 }
      );
    }

    // Get the admin client for transactions
    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder",
      {
        cookies: {
          get() { return ""; },
          set() {},
          remove() {},
        },
      }
    );

    const userId = user.id;
    const now = new Date().toISOString();

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    const processedIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);

      // Get the pending mappings for this batch
      const { data: mappings, error: fetchError } = await adminSb
        .from("pending_ingredient_mappings")
        .select("id, product_id, suggested_ingredient_id, status")
        .in("id", batch);

      if (fetchError) {
        throw fetchError;
      }

      const mappingsToUpdate = (mappings as Array<{
        id: string;
        product_id: string;
        suggested_ingredient_id: string | null;
        status: string;
      }>) ?? [];

      // Create product_ingredients mappings for approved items
      if (action === "approve") {
        const mappingsToCreate = mappingsToUpdate
          .filter((m) => m.suggested_ingredient_id && m.product_id && m.status === "pending")
          .map((m) => ({
            product_id: m.product_id,
            ingredient_id: m.suggested_ingredient_id!,
            mapping_method: "admin",
            confidence: 1.0,
            is_primary: false,
            created_at: now,
            updated_at: now,
          }));

        if (mappingsToCreate.length > 0) {
          const { error: insertError } = await adminSb
            .from("product_ingredients")
            .insert(mappingsToCreate)
            .select();

          if (insertError) {
            console.error("Error creating product_ingredients:", insertError);
            // Continue with status update even if mapping creation failed
          }
        }
      }

      // Update the pending mappings status
      const { error: updateError } = await adminSb
        .from("pending_ingredient_mappings")
        .update({
          status: action,
          resolved_by: userId,
          resolved_at: now,
          notes: action === "reject" ? reason : undefined,
        })
        .in("id", batch)
        .select("id");

      if (updateError) {
        console.error("Error updating pending mappings:", updateError);
        // Mark all in batch as failed
        batch.forEach((id) => {
          errors.push({ id, error: updateError.message });
        });
      } else {
        processedIds.push(...batch);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedIds.length,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to perform bulk action",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a single pending ingredient mapping
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient();

  // Check permissions
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("id, role, is_supermarket")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "Profile not found." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { id, action, reason, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required." },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject", "ignore"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'ignore'." },
        { status: 400 }
      );
    }

    // Get the pending mapping to check ownership
    const { data: pendingMapping, error: fetchError } = await sb
      .from("pending_ingredient_mappings")
      .select("id, product_id, suggested_ingredient_id, status, supermarket_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !pendingMapping) {
      return NextResponse.json(
        { error: "Pending mapping not found." },
        { status: 404 }
      );
    }

    // Check ownership - only admin or the supermarket that created it can manage
    if (!profile.is_supermarket && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    if (profile.is_supermarket && profile.role !== "admin" && pendingMapping.supermarket_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only manage your own supermarket's mappings." },
        { status: 403 }
      );
    }

    // Get admin client
    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder",
      {
        cookies: {
          get() { return ""; },
          set() {},
          remove() {},
        },
      }
    );

    const userId = user.id;
    const now = new Date().toISOString();

    // If approving, create the product_ingredients mapping first
    if (action === "approve" && pendingMapping.suggested_ingredient_id && pendingMapping.product_id) {
      const { error: insertError } = await adminSb
        .from("product_ingredients")
        .insert({
          product_id: pendingMapping.product_id,
          ingredient_id: pendingMapping.suggested_ingredient_id,
          mapping_method: "admin",
          confidence: 1.0,
          is_primary: false,
          created_at: now,
          updated_at: now,
        })
        .select();

      if (insertError) {
        console.error("Error creating product_ingredients mapping:", insertError);
        // Continue with status update
      }
    }

    // Update the pending mapping
    const { error: updateError } = await adminSb
      .from("pending_ingredient_mappings")
      .update({
        status: action,
        resolved_by: userId,
        resolved_at: now,
        notes: action === "reject" ? reason ?? notes : notes,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Fetch updated mapping to return
    const { data: updatedMapping } = await sb
      .from("pending_ingredient_mappings")
      .select(
        `id, product_id, supermarket_id, suggested_ingredient_id, suggested_ingredient_name, confidence, status, created_at, resolved_by, resolved_at, notes,
         products:product_id(id, name, slug),
         supermarkets:supermarket_id(id, supermarket_name),
         ingredients:suggested_ingredient_id(id, canonical_name, display_name, category, subcategory)`
      )
      .eq("id", id)
      .maybeSingle();

    const processedMapping = updatedMapping ? {
      id: (updatedMapping as any).id,
      product_id: (updatedMapping as any).product_id,
      product_name: (updatedMapping as any).products?.name?.en ?? "Unknown Product",
      supermarket_id: (updatedMapping as any).supermarket_id,
      supermarket_name: (updatedMapping as any).supermarkets?.supermarket_name?.en ?? null,
      suggested_ingredient_id: (updatedMapping as any).suggested_ingredient_id,
      suggested_ingredient_name: (updatedMapping as any).suggested_ingredient_name ?? (updatedMapping as any).ingredients?.canonical_name ?? "Unknown",
      confidence: (updatedMapping as any).confidence,
      status: (updatedMapping as any).status,
      created_at: (updatedMapping as any).created_at,
      resolved_by: (updatedMapping as any).resolved_by,
      resolved_at: (updatedMapping as any).resolved_at,
      notes: (updatedMapping as any).notes,
    } : null;

    return NextResponse.json({
      success: true,
      mapping: processedMapping,
    });
  } catch (error) {
    console.error("Error updating pending mapping:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update pending mapping",
      },
      { status: 500 }
    );
  }
}
