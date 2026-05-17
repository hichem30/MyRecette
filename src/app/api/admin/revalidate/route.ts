import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Tag / path map used by the catalog ISR pages. When admins update a
// product/category/bundle/promo etc., we surgically purge only the
// affected pages instead of waiting for the full 1-hour ISR window.
const PATH_MAP: Record<string, string[]> = {
  products: [
    "/en",
    "/es",
    "/en/products",
    "/es/products",
    "/en/deals",
    "/es/deals",
  ],
  categories: [
    "/en",
    "/es",
    "/en/categories",
    "/es/categories",
  ],
  // Bundles are surfaced inside /deals.
  bundles: ["/en/deals", "/es/deals"],
  promos: [],
  delivery: [],
};

export async function POST(request: Request) {
  const sb = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  let body: { scope?: keyof typeof PATH_MAP; slug?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const scope = body.scope ?? "products";
  const slug = body.slug?.trim();

  const paths = PATH_MAP[scope] ?? [];
  for (const p of paths) revalidatePath(p);

  if (scope === "products" && slug) {
    revalidatePath(`/en/products/${slug}`);
    revalidatePath(`/es/products/${slug}`);
  }
  if (scope === "categories" && slug) {
    revalidatePath(`/en/categories/${slug}`);
    revalidatePath(`/es/categories/${slug}`);
  }

  return NextResponse.json({ ok: true, scope, paths });
}
