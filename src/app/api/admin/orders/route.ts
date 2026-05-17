import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
} from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

async function requireAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await getSupabaseRouteClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false };

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") return { ok: true, userId: user.id };

  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "").trim().toLowerCase();
  if (
    bootstrapEmail &&
    user.email &&
    user.email.trim().toLowerCase() === bootstrapEmail
  ) {
    return { ok: true, userId: user.id };
  }
  return { ok: false };
}

/**
 * Returns every order in the system, sorted newest first. Admin-only.
 * Uses the service-role client so it never depends on the legacy orders
 * RLS policy aligning correctly.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ orders: [], error: "forbidden" }, { status: 403 });
  }
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ orders: [], error: "supabase admin client unavailable" }, { status: 200 });
  }
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ orders: [], error: error.message }, { status: 200 });
  }
  return NextResponse.json({ orders: (data as Order[]) ?? [] }, { status: 200 });
}
