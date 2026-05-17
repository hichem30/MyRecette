import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
} from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Returns a single order by id, but only if it belongs to the currently
 * signed-in customer (or the caller is an admin). Same reasoning as
 * /api/orders/mine — we do the email check server-side instead of
 * relying on the orders RLS subquery against auth.users.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ order: null }, { status: 404 });

  const supabase = await getSupabaseRouteClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ order: null }, { status: 401 });

  const email = user.email?.trim().toLowerCase() ?? null;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.warn("[api/orders/mine/[id]] missing SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ order: null }, { status: 200 });
  }

  // Admin can fetch any order.
  let isAdmin = false;
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  } catch {
    /* keep isAdmin false on lookup failure */
  }

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ order: null }, { status: 200 });
  }

  const order = data as Order;
  const ownsIt =
    email !== null &&
    order.customer_email !== null &&
    order.customer_email.trim().toLowerCase() === email;
  if (!isAdmin && !ownsIt) {
    return NextResponse.json({ order: null }, { status: 403 });
  }

  return NextResponse.json({ order }, { status: 200 });
}
