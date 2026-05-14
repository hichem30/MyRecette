import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = getSupabaseRouteClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Validate `next` to prevent open-redirect: must be a relative path
  // starting with a single "/" (not "//" which browsers treat as protocol-relative).
  const requested = url.searchParams.get("next");
  const next = requested && /^\/(?!\/)/.test(requested) ? requested : "/";
  return NextResponse.redirect(new URL(next, url.origin));
}
