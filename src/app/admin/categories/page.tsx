"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mockCategories } from "@/lib/data/mock-data";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems(mockCategories);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("categories").select("*").then(({ data }) => {
      setItems((data as Category[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      alert("Configure Supabase to save.");
      return;
    }
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb
      .from("categories")
      .insert({ slug, name: { en: nameEn, es: nameEs } })
      .select()
      .single();
    if (error) alert(error.message);
    else if (data) {
      setItems((prev) => [...prev, data as Category]);
      setAdding(false);
      setNameEn("");
      setNameEs("");
      setSlug("");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    if (!isSupabaseConfigured()) {
      setItems((p) => p.filter((c) => c.id !== id));
      return;
    }
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) alert(error.message);
    else setItems((p) => p.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Categories</h1>
          <p className="text-sm text-neutral-500">{items.length} categor{items.length === 1 ? "y" : "ies"}.</p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="mb-5 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-3">
          <input placeholder="Slug" required value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
          <input placeholder="Name (EN)" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
          <input placeholder="Name (ES)" value={nameEs} onChange={(e) => setNameEs(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
          <button type="submit" className="sm:col-span-3 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white">Create</button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Name (ES)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No categories yet.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3">{c.name.en}</td>
                  <td className="px-4 py-3 text-neutral-500">{c.name.es}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(c.id)} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700">
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
