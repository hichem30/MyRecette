"use client";

import { Package2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Bundle, Product } from "@/lib/types";
import { mockProducts } from "@/lib/data/mock-data";
import { formatPrice } from "@/lib/utils";

export default function AdminBundlesPage() {
  const [items, setItems] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    Promise.all([
      sb.from("bundles").select("*").order("created_at", { ascending: false }),
      sb.from("products").select("*"),
    ]).then(([b, p]) => {
      setItems((b.data as Bundle[]) ?? []);
      setProducts((p.data as Product[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this bundle?")) return;
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("bundles").delete().eq("id", id);
    if (error) alert(error.message);
    else setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function toggleActive(b: Bundle) {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("bundles").update({ active: !b.active }).eq("id", b.id);
    if (error) alert(error.message);
    else setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x)));
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Bundles</h1>
          <p className="text-sm text-neutral-500">{items.length} bundle{items.length === 1 ? "" : "s"}.</p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> New bundle
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No bundles yet — create your first to show grouped product deals on the storefront.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((b) => {
            const total = b.product_ids.reduce((s, id) => {
              const p = products.find((p) => p.id === id);
              return s + (p?.price ?? 0);
            }, 0);
            const savings = Math.max(0, total - b.bundle_price);
            return (
              <div key={b.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-barn-600" />
                      <h3 className="truncate font-bold">{b.name.en || "(untitled)"}</h3>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{b.product_ids.length} items · {formatPrice(b.bundle_price)}{savings > 0 ? ` (save ${formatPrice(savings)})` : ""}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(b)}
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      b.active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {b.active ? "Active" : "Off"}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <Link href={`/admin/bundles/${b.id}`} className="font-semibold text-barn-700 hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => remove(b.id)} className="inline-flex items-center gap-1 text-neutral-600 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
