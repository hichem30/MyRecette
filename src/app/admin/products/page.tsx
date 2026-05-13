"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import { mockProducts } from "@/lib/data/mock-data";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as Product[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    if (!isSupabaseConfigured()) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Products</h1>
          <p className="text-sm text-neutral-500">{products.length} item{products.length === 1 ? "" : "s"}.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {!isSupabaseConfigured() && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Read‑only mode.</strong> Showing the bundled mock data. Configure Supabase to enable CRUD.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No products yet.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name.en}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.category_slug}</td>
                  <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.new_arrival && <span className="mr-1 rounded bg-barn-50 px-1.5 py-0.5 text-barn-700">NEW</span>}
                    {p.discount && <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">SALE</span>}
                    {p.featured && <span className="mr-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">FEAT</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-barn-700">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="ml-3 inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
