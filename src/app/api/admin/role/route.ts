import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase service role not configured." }, { status: 500 });
  }

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : "user";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  // Authenticate the caller and confirm they are themselves an admin.
  const sbSession = await getSupabaseRouteClient();
  const {
    data: { user: caller },
    error: userErr,
  } = await sbSession.auth.getUser();
  if (userErr || !caller) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: callerProfile } = await sbSession
    .from("profiles")
    .select("role, email")
    .eq("id", caller.id)
    .maybeSingle();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  // Disallow demoting yourself (otherwise the org might lock everyone out).
  if (role !== "admin" && callerProfile.email?.toLowerCase() === email) {
    return NextResponse.json({ error: "You cannot demote yourself." }, { status: 400 });
  }

  // Look up the target profile by email (case-insensitive).
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service-role client unavailable." }, { status: 500 });
  }
  const { data: target } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();
  if (!target) {
    return NextResponse.json(
      {
        error:
          "No registered user found for that email. Ask them to sign up first at /login or /admin/login, then promote them.",
      },
      { status: 404 },
    );
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", target.id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email: target.email, role });
}
