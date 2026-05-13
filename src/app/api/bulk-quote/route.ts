import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

const QuoteSchema = z.object({
  company: z.string().min(1).max(200),
  contact: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  project_type: z.string().min(1).max(200),
  estimated_quantity: z.string().min(1).max(400),
  delivery: z.enum(["deliver", "pickup"]),
  timeline: z.string().min(1).max(80),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = QuoteSchema.parse(body);

    if (!isSupabaseConfigured()) {
      console.warn("[bulk-quote] Supabase not configured. Captured (dev only):", parsed);
      return NextResponse.json({ ok: true, dev: true });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: true, dev: true });

    await admin.from("bulk_quotes").insert({
      ...parsed,
      status: "new",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
