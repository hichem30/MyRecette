import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
} from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Returns the orders that belong to the currently signed-in customer.
 *
 * We deliberately fetch under the service-role client (filtered by the
 * authenticated user's email) instead of relying on the public RLS
 * policy. The historical RLS rule did a subquery against `auth.users`
 * which authenticated users can't read by default — so the customer
 * page came back empty even when the order row was present. Doing the
 * email lookup server-side keeps the customer's history reliable AND
 * still scoped (we never return orders for any other user).
 */
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email?.trim().toLowerCase() ?? null;
  if (!email) {
    return NextResponse.json({ orders: [] satisfies Order[] }, { status: 200 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    // Without the service role we cannot reliably bypass the legacy RLS
    // rule. Return an empty list; the page will surface "no orders yet".
    console.warn(
      "[api/orders/mine] SUPABASE_SERVICE_ROLE_KEY missing — cannot return orders for",
      email,
    );
    return NextResponse.json({ orders: [] satisfies Order[] }, { status: 200 });
  }

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .ilike("customer_email", email)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[api/orders/mine] query failed:", error.message);
    return NextResponse.json({ orders: [], error: error.message }, { status: 200 });
  }

  return NextResponse.json({ orders: (data as Order[]) ?? [] }, { status: 200 });
}
