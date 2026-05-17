"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { revalidateAdmin } from "@/lib/admin/revalidate";
import ImageUploader from "@/components/admin/ImageUploader";
import { mockProducts } from "@/lib/data/mock-data";
import type { Bundle, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function EditBundle() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [bundle, setBundle] = useState<Partial<Bundle>>({
    name: { en: "", es: "" },
    description: { en: "", es: "" },
    bundle_price: 0,
    image_url: "",
    product_ids: [],
    active: true,
    starts_at: null,
    ends_at: null,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("products").select("*").then(({ data }) => setProducts((data as Product[]) ?? []));
    if (!isNew) {
      sb.from("bundles").select("*").eq("id", params.id).single().then(({ data }) => {
        if (data) setBundle(data as Bundle);
      });
    }
  }, [isNew, params.id]);

  const total = useMemo(() => {
    return (bundle.product_ids ?? []).reduce((s, id) => {
      const p = products.find((p) => p.id === id);
      return s + (p?.price ?? 0);
    }, 0);
  }, [bundle.product_ids, products]);

  const savings = Math.max(0, total - (bundle.bundle_price ?? 0));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.en.toLowerCase().includes(q));
  }, [products, search]);

  function toggle(productId: string) {
    setBundle((b) => {
      const ids = b.product_ids ?? [];
      const next = ids.includes(productId) ? ids.filter((x) => x !== productId) : [...ids, productId];
      return { ...b, product_ids: next };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!bundle.name?.en) {
      alert("Bundle needs an English name.");
      return;
    }
    if ((bundle.product_ids?.length ?? 0) < 2) {
      alert("Bundle needs at least 2 products.");
      return;
    }
    setSaving(true);
    if (!isSupabaseConfigured()) {
      alert("Configure Supabase to save.");
      setSaving(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    // Spanish is deprecated — mirror the English text into `es` so the JSONB
    // columns keep their existing shape.
    const en = bundle.name?.en ?? "";
    const descEn = bundle.description?.en ?? "";
    const payload = {
      name: { en, es: en },
      description: { en: descEn, es: descEn },
      bundle_price: bundle.bundle_price,
      image_url: bundle.image_url || null,
      product_ids: bundle.product_ids,
      active: bundle.active,
      starts_at: bundle.starts_at,
      ends_at: bundle.ends_at,
    };
    const { error } = isNew
      ? await sb.from("bundles").insert(payload)
      : await sb.from("bundles").update(payload).eq("id", params.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    await revalidateAdmin("bundles");
    router.replace("/admin/bundles");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/bundles" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-barn-700">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to bundles
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-bold">{isNew ? "New Bundle" : "Edit Bundle"}</h1>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <Field label="Name">
          <input required value={bundle.name?.en ?? ""} onChange={(e) => setBundle((b) => ({ ...b, name: { en: e.target.value, es: e.target.value } }))} className="adm-input" />
        </Field>

        <Field label="Description">
          <textarea rows={2} value={bundle.description?.en ?? ""} onChange={(e) => setBundle((b) => ({ ...b, description: { en: e.target.value, es: e.target.value } }))} className="adm-input" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bundle price (USD)">
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={bundle.bundle_price ?? 0}
              onChange={(e) => setBundle((b) => ({ ...b, bundle_price: Number(e.target.value) }))}
              className="adm-input"
            />
          </Field>
          <Field label="Bundle Image (optional)">
            <ImageUploader
              value={bundle.image_url ?? ""}
              onChange={(url) => setBundle((b) => ({ ...b, image_url: url }))}
              folder="bundles"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts (optional)">
            <input
              type="datetime-local"
              value={toLocalInput(bundle.starts_at)}
              onChange={(e) => setBundle((b) => ({ ...b, starts_at: fromLocalInput(e.target.value) }))}
              className="adm-input"
            />
          </Field>
          <Field label="Ends (optional)">
            <input
              type="datetime-local"
              value={toLocalInput(bundle.ends_at)}
              onChange={(e) => setBundle((b) => ({ ...b, ends_at: fromLocalInput(e.target.value) }))}
              className="adm-input"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!bundle.active}
            onChange={(e) => setBundle((b) => ({ ...b, active: e.target.checked }))}
            className="accent-barn-600"
          />
          Active (visible on storefront)
        </label>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
          <span className="font-semibold">Total of selected items: {formatPrice(total)}</span>
          {savings > 0 && (
            <span className="ml-2 text-emerald-700">→ customer saves {formatPrice(savings)}</span>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700">Products in this bundle ({(bundle.product_ids ?? []).length} selected)</label>
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-neutral-200">
            {filtered.map((p) => {
              const checked = (bundle.product_ids ?? []).includes(p.id);
              return (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2 text-sm last:border-b-0 ${checked ? "bg-amber-50" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} className="accent-barn-600" />
                  <span className="flex-1 truncate">{p.name.en}</span>
                  <span className="text-xs text-neutral-500">{formatPrice(p.price)}</span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-neutral-400">No products match.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-barn-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-barn-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : isNew ? "Create bundle" : "Save changes"}
        </button>
      </form>

      <style jsx>{`
        :global(.adm-input) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(212 212 212);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.adm-input:focus) {
          outline: 2px solid rgb(168 53 31 / 0.4);
          border-color: rgb(168 53 31);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
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
