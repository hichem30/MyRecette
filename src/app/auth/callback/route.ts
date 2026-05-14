import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = getSupabaseRouteClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const next = url.searchParams.get("next") ?? "/";
  return NextResponse.redirect(new URL(next, url.origin));
}
