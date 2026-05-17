"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Category, PromoCode, Product } from "@/lib/types";

type FormState = {
  code: string;
  description: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
  applies_to_product_ids: string[];
  applies_to_category_slugs: string[];
};

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  max_uses: "",
  starts_at: "",
  ends_at: "",
  active: true,
  applies_to_product_ids: [],
  applies_to_category_slugs: [],
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function promoToForm(p: PromoCode): FormState {
  return {
    code: p.code,
    description: p.description ?? "",
    discount_type: p.discount_type,
    discount_value: Number(p.discount_value),
    max_uses: p.max_uses != null ? String(p.max_uses) : "",
    starts_at: toLocalInput(p.starts_at),
    ends_at: toLocalInput(p.ends_at),
    active: p.active,
    applies_to_product_ids: p.applies_to_product_ids ?? [],
    applies_to_category_slugs: p.applies_to_category_slugs ?? [],
  };
}

export default function AdminPromosPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [products, setProducts] = useState<Pick<Product, "id" | "name" | "slug" | "category_slug">[]>([]);
  const [categories, setCategories] = useState<Pick<Category, "slug" | "name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAdding(true);
  }
  function openEdit(p: PromoCode) {
    setEditingId(p.id);
    setForm(promoToForm(p));
    setAdding(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function closeForm() {
    setEditingId(null);
    setAdding(false);
    setForm(EMPTY_FORM);
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    Promise.all([
      sb.from("promo_codes").select("*").order("created_at", { ascending: false }),
      sb.from("products").select("id,name,slug,category_slug").order("name"),
      sb.from("categories").select("slug,name").order("slug"),
    ]).then(([promosRes, productsRes, categoriesRes]) => {
      setItems((promosRes.data as PromoCode[]) ?? []);
      setProducts((productsRes.data as Pick<Product, "id" | "name" | "slug" | "category_slug">[]) ?? []);
      setCategories((categoriesRes.data as Pick<Category, "slug" | "name">[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      alert("Configure Supabase to save.");
      return;
    }
    const sb = getSupabaseBrowserClient();
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      active: form.active,
      applies_to_product_ids: form.applies_to_product_ids.length > 0 ? form.applies_to_product_ids : null,
      applies_to_category_slugs:
        form.applies_to_category_slugs.length > 0 ? form.applies_to_category_slugs : null,
    };
    if (editingId) {
      const { data, error } = await sb
        .from("promo_codes")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) {
        alert(error.message);
        return;
      }
      setItems((prev) => prev.map((x) => (x.id === editingId ? (data as PromoCode) : x)));
    } else {
      const { data, error } = await sb.from("promo_codes").insert(payload).select().single();
      if (error) {
        alert(error.message);
        return;
      }
      setItems((prev) => [data as PromoCode, ...prev]);
    }
    closeForm();
  }

  async function toggleActive(p: PromoCode) {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("promo_codes").update({ active: !p.active }).eq("id", p.id);
    if (error) alert(error.message);
    else setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this promo code?")) return;
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("promo_codes").delete().eq("id", id);
    if (error) alert(error.message);
    else setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-neutral-500">
            {items.length} promo code{items.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          onClick={() => (adding ? closeForm() : openCreate())}
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> {adding ? "Cancel" : "New code"}
        </button>
      </div>

      {adding && (
        <form onSubmit={save} className="mb-5 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2">
          {editingId && (
            <div className="sm:col-span-2 -mb-1 text-xs font-semibold uppercase tracking-wide text-barn-700">
              Editing existing code
            </div>
          )}
          <label className="text-xs font-semibold text-neutral-700">
            Code
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm uppercase"
              placeholder="SUMMER10"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            Description (optional)
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              placeholder="Summer sale"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            Type
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "amount" })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="percent">Percent off</option>
              <option value="amount">Fixed amount ($)</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            {form.discount_type === "percent" ? "% off" : "$ off"}
            <input
              type="number"
              min={0}
              step={form.discount_type === "percent" ? 1 : 0.01}
              required
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            Max uses (empty = unlimited)
            <input
              type="number"
              min={1}
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 pt-5">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            Starts (optional)
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-700">
            Ends (optional)
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </label>

          <div className="sm:col-span-2 mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-neutral-700">
                  Limit to categories ({form.applies_to_category_slugs.length || "all"})
                </span>
                {form.applies_to_category_slugs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, applies_to_category_slugs: [] })}
                    className="text-[11px] text-neutral-500 hover:text-barn-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-200 bg-white p-2">
                {categories.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-neutral-400">No categories yet.</p>
                ) : (
                  categories.map((c) => {
                    const checked = form.applies_to_category_slugs.includes(c.slug);
                    return (
                      <label key={c.slug} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              applies_to_category_slugs: toggleInList(form.applies_to_category_slugs, c.slug),
                            })
                          }
                        />
                        <span className="font-medium">{c.name?.en || c.slug}</span>
                        <span className="text-neutral-400">/{c.slug}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                Leave empty to apply to all categories.
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-neutral-700">
                  Limit to specific products ({form.applies_to_product_ids.length || "all"})
                </span>
                {form.applies_to_product_ids.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, applies_to_product_ids: [] })}
                    className="text-[11px] text-neutral-500 hover:text-barn-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-200 bg-white p-2">
                {products.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-neutral-400">No products yet.</p>
                ) : (
                  products.map((p) => {
                    const checked = form.applies_to_product_ids.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              applies_to_product_ids: toggleInList(form.applies_to_product_ids, p.id),
                            })
                          }
                        />
                        <span className="font-medium">{p.name?.en || p.slug}</span>
                        <span className="text-neutral-400">/{p.category_slug}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                Either field matching is enough — leave empty to apply to all.
              </p>
            </div>
          </div>

          <button type="submit" className="sm:col-span-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white">
            {editingId ? "Save changes" : "Create code"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No promo codes yet.</td></tr>
            ) : (
              items.map((p) => {
                const productCount = p.applies_to_product_ids?.length ?? 0;
                const catCount = p.applies_to_category_slugs?.length ?? 0;
                const scopeLabel =
                  productCount === 0 && catCount === 0
                    ? "All products"
                    : [
                        catCount > 0 ? `${catCount} categor${catCount === 1 ? "y" : "ies"}` : null,
                        productCount > 0 ? `${productCount} product${productCount === 1 ? "" : "s"}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ");
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold">{p.code}</div>
                      {p.description && <div className="text-xs text-neutral-500">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {p.discount_type === "percent" ? `${p.discount_value}% off` : `$${p.discount_value} off`}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{scopeLabel}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : "—"}
                      {" → "}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {p.active ? "Active" : "Off"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="mr-3 inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-barn-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700"
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
