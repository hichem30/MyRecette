import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const supabase = await getSupabaseRouteClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[auth/callback] unexpected error:", msg);
    }
  }
  // Validate `next` to prevent open-redirect: must be a relative path
  // starting with a single "/" (not "//" which browsers treat as protocol-relative).
  const requested = url.searchParams.get("next");
  const next = requested && /^\/(?!\/)/.test(requested) ? requested : "/";
  return NextResponse.redirect(new URL(next, url.origin));
}
