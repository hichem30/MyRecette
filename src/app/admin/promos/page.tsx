"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PromoCode } from "@/lib/types";

export default function AdminPromosPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "amount",
    discount_value: 10,
    max_uses: "" as string,
    starts_at: "",
    ends_at: "",
    active: true,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as PromoCode[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function create(e: React.FormEvent) {
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
    };
    const { data, error } = await sb.from("promo_codes").insert(payload).select().single();
    if (error) {
      alert(error.message);
      return;
    }
    setItems((prev) => [data as PromoCode, ...prev]);
    setAdding(false);
    setForm({
      code: "",
      description: "",
      discount_type: "percent",
      discount_value: 10,
      max_uses: "",
      starts_at: "",
      ends_at: "",
      active: true,
    });
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

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-neutral-500">{items.length} promo code{items.length === 1 ? "" : "s"}.</p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> {adding ? "Cancel" : "New code"}
        </button>
      </div>

      {adding && (
        <form onSubmit={create} className="mb-5 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2">
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
          <button type="submit" className="sm:col-span-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white">
            Create code
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
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No promo codes yet.</td></tr>
            ) : (
              items.map((p) => (
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
                    <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700">
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
