"use client";

import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import { mockProducts } from "@/lib/data/mock-data";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState<number>(0);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

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

  function startEditStock(p: Product) {
    setEditingStockId(p.id);
    setStockDraft(p.stock);
  }

  function cancelEditStock() {
    setEditingStockId(null);
  }

  async function saveStock(id: string) {
    const newStock = Math.max(0, Math.floor(stockDraft));
    setSavingStockId(id);
    if (!isSupabaseConfigured()) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
      setSavingStockId(null);
      setEditingStockId(null);
      return;
    }
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("products").update({ stock: newStock }).eq("id", id);
    setSavingStockId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    setEditingStockId(null);
  }

  const filtered = products.filter((p) => {
    if (filter === "low") return p.stock > 0 && p.stock <= 5;
    if (filter === "out") return p.stock === 0;
    return true;
  });

  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Products</h1>
          <p className="text-sm text-neutral-500">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
            {filter !== "all" ? " (filtered)" : ""}.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md border px-3 py-1.5 font-semibold ${
            filter === "all"
              ? "border-barn-600 bg-barn-50 text-barn-700"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
          }`}
        >
          All ({products.length})
        </button>
        <button
          onClick={() => setFilter("low")}
          className={`rounded-md border px-3 py-1.5 font-semibold ${
            filter === "low"
              ? "border-amber-500 bg-amber-50 text-amber-700"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
          }`}
        >
          Low stock ({lowCount})
        </button>
        <button
          onClick={() => setFilter("out")}
          className={`rounded-md border px-3 py-1.5 font-semibold ${
            filter === "out"
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
          }`}
        >
          Out of stock ({outCount})
        </button>
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
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No products match the filter.</td></tr>
            ) : (
              filtered.map((p) => {
                const stockColor =
                  p.stock === 0
                    ? "bg-red-50 text-red-700"
                    : p.stock <= 5
                    ? "bg-amber-50 text-amber-700"
                    : "bg-neutral-50 text-neutral-700";
                const stockLabel =
                  p.stock === 0 ? "OUT" : p.stock <= 5 ? "LOW" : null;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name.en}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.category_slug}</td>
                    <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {editingStockId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={stockDraft}
                            onChange={(e) => setStockDraft(Number(e.target.value))}
                            className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-barn-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveStock(p.id)}
                            disabled={savingStockId === p.id}
                            aria-label="Save"
                            className="rounded-md p-1 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditStock}
                            aria-label="Cancel"
                            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditStock(p)}
                          title="Click to adjust stock"
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold hover:ring-2 hover:ring-offset-1 ${stockColor}`}
                        >
                          {p.stock}
                          {stockLabel && <span className="text-[10px] tracking-wide">{stockLabel}</span>}
                        </button>
                      )}
                    </td>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
