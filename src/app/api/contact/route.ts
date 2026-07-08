import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.parse(body);

    if (!isSupabaseConfigured()) {
      // Stage to console in dev so the form still "works" before Supabase is set up
      console.warn("[contact] Supabase not configured. Captured (dev only):", parsed);
      return NextResponse.json({ ok: true, dev: true });
    }

    const admin = await getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, dev: true });
    }

    await admin.from("messages").insert({
      name: parsed.name,
      email: parsed.email,
      message: parsed.message,
      read: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
