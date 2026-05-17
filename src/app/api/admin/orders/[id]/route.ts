import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const supabase = await getSupabaseRouteClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;

  const admin = getSupabaseAdminClient();
  if (!admin) return false;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") return true;

  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "").trim().toLowerCase();
  if (
    bootstrapEmail &&
    user.email &&
    user.email.trim().toLowerCase() === bootstrapEmail
  ) {
    return true;
  }
  return false;
}

const STATUS_VALUES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

/**
 * PATCH /api/admin/orders/[id] — admin-only status update for an order.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: { status?: string; notes?: string };
  try {
    body = (await req.json()) as { status?: string; notes?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const patch: { status?: string; notes?: string } = {};
  if (typeof body.status === "string") {
    if (!STATUS_VALUES.has(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.notes === "string") {
    patch.notes = body.notes.slice(0, 2000);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "supabase admin unavailable" }, { status: 503 });
  }

  const { error } = await admin.from("orders").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
