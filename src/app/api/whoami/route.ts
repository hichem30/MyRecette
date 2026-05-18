import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseRouteClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Canonical "who is signed in" lookup used by both the storefront login
 * card and the admin shell. Always returns a stable shape so the UI can
 * decide where to send the user.
 *
 *   { authenticated: bool, email: string | null, isAdmin: bool }
 *
 * It also self-heals one tricky case: the user whose email matches
 * any entry in ADMIN_BOOTSTRAP_EMAIL (comma-separated list of bootstrap
 * owners) signed up before the bootstrap trigger existed and ended up
 * with `role = 'user'`. We auto-promote them to admin here so the next
 * login lands them in /admin instead of the storefront.
 */
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ authenticated: false, email: null, isAdmin: false });
  }

  const email = user.email ?? null;
  const bootstrapEmails = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const matchesBootstrap =
    bootstrapEmails.length > 0 &&
    email !== null &&
    bootstrapEmails.includes(email.toLowerCase());

  // Read the user's profile.role under their own RLS context first.
  let role: string | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
  } catch {
    /* fall through */
  }

  // Self-heal: if the user matches the bootstrap owner email but their
  // profile still says "user", promote them via the service-role client
  // (bypasses RLS) so they don't get stuck looking like a customer.
  if (matchesBootstrap && role !== "admin") {
    const admin = getSupabaseAdminClient();
    if (admin) {
      try {
        await admin
          .from("profiles")
          .upsert(
            { id: user.id, email, role: "admin" },
            { onConflict: "id" },
          );
        role = "admin";
      } catch {
        /* if the upsert fails, fall back to whatever we already read */
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    email,
    isAdmin: role === "admin",
  });
}
