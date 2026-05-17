"use client";

import { Percent, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { revalidateAdmin } from "@/lib/admin/revalidate";
import { mockCategories } from "@/lib/data/mock-data";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [slug, setSlug] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);

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
    if (error) {
      alert(error.message);
      return;
    }
    if (data) {
      setItems((prev) => [...prev, data as Category]);
      setAdding(false);
      setNameEn("");
      setNameEs("");
      setSlug("");
      await revalidateAdmin("categories", (data as Category).slug);
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
    if (error) {
      alert(error.message);
      return;
    }
    setItems((p) => p.filter((c) => c.id !== id));
    await revalidateAdmin("categories");
  }

  async function saveDiscount(c: Category, percent: number, startsAt: string | null, endsAt: string | null) {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb
      .from("categories")
      .update({ discount_percent: percent, discount_starts_at: startsAt, discount_ends_at: endsAt })
      .eq("id", c.id);
    if (error) {
      alert(error.message);
      return;
    }
    await revalidateAdmin("categories", c.slug);
    setItems((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? { ...x, discount_percent: percent, discount_starts_at: startsAt, discount_ends_at: endsAt }
          : x,
      ),
    );
    setEditingDiscount(null);
  }

  return (
    <div className="max-w-4xl">
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
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No categories yet.</td></tr>
            ) : (
              items.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3">{c.name.en}</td>
                    <td className="px-4 py-3 text-neutral-500">{c.name.es}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.discount_percent && c.discount_percent > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                          {c.discount_percent}% off
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingDiscount(editingDiscount === c.id ? null : c.id)}
                        className="mr-3 inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-barn-700"
                      >
                        <Percent className="h-3.5 w-3.5" /> {editingDiscount === c.id ? "Cancel" : "Sale"}
                      </button>
                      <button onClick={() => remove(c.id)} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                  {editingDiscount === c.id && (
                    <tr className="bg-neutral-50">
                      <td colSpan={5} className="px-4 py-4">
                        <DiscountEditor category={c} onSave={(p, s, e) => saveDiscount(c, p, s, e)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiscountEditor({
  category,
  onSave,
}: {
  category: Category;
  onSave: (percent: number, startsAt: string | null, endsAt: string | null) => void;
}) {
  const [percent, setPercent] = useState(category.discount_percent ?? 0);
  const [starts, setStarts] = useState(toLocalInput(category.discount_starts_at));
  const [ends, setEnds] = useState(toLocalInput(category.discount_ends_at));

  return (
    <div className="grid items-end gap-3 sm:grid-cols-[120px_1fr_1fr_auto]">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-neutral-700">% off</span>
        <input
          type="number"
          min={0}
          max={90}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-neutral-700">Starts (optional)</span>
        <input
          type="datetime-local"
          value={starts}
          onChange={(e) => setStarts(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-neutral-700">Ends (optional)</span>
        <input
          type="datetime-local"
          value={ends}
          onChange={(e) => setEnds(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>
      <button
        onClick={() => onSave(percent, fromLocalInput(starts), fromLocalInput(ends))}
        className="h-9 rounded-md bg-barn-600 px-4 text-xs font-bold text-white hover:bg-barn-700"
      >
        Save
      </button>
    </div>
  );
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
