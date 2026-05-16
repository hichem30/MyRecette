"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { mockCategories, mockProducts } from "@/lib/data/mock-data";

export default function EditProduct() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [product, setProduct] = useState<Partial<Product>>({
    name: { en: "", es: "" },
    description: { en: "", es: "" },
    discount_text: { en: "", es: "" },
    price: 0,
    stock: 0,
    image_url: "",
    category_slug: "",
    discount: false,
    new_arrival: true,
    featured: false,
    published: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setCategories(mockCategories);
      if (!isNew) {
        const found = mockProducts.find((p) => p.id === params.id);
        if (found) setProduct(found);
      }
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("categories").select("*").then(({ data }) => setCategories((data as Category[]) ?? []));
    if (!isNew) {
      sb.from("products").select("*").eq("id", params.id).single().then(({ data }) => {
        if (data) setProduct(data as Product);
      });
    }
  }, [isNew, params.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (!isSupabaseConfigured()) {
      alert("Read-only mode — configure Supabase to save.");
      setSaving(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    const payload = {
      ...product,
      slug: product.slug || (product.name?.en ?? "").toLowerCase().replace(/\s+/g, "-"),
    };
    const { error } = isNew
      ? await sb.from("products").insert(payload)
      : await sb.from("products").update(payload).eq("id", params.id);
    setSaving(false);
    if (error) alert(error.message);
    else router.replace("/admin/products");
  }

  function setName(lang: "en" | "es", value: string) {
    setProduct((p) => ({ ...p, name: { ...(p.name ?? { en: "", es: "" }), [lang]: value } }));
  }
  function setDesc(lang: "en" | "es", value: string) {
    setProduct((p) => ({ ...p, description: { ...(p.description ?? { en: "", es: "" }), [lang]: value } }));
  }
  function setDiscountText(lang: "en" | "es", value: string) {
    setProduct((p) => ({ ...p, discount_text: { ...(p.discount_text ?? { en: "", es: "" }), [lang]: value } }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-barn-700">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to products
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-bold">{isNew ? "Add Product" : "Edit Product"}</h1>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (English)">
            <input required value={product.name?.en ?? ""} onChange={(e) => setName("en", e.target.value)} className="adm-input" />
          </Field>
          <Field label="Name (Spanish)">
            <input value={product.name?.es ?? ""} onChange={(e) => setName("es", e.target.value)} className="adm-input" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description (English)">
            <textarea rows={3} value={product.description?.en ?? ""} onChange={(e) => setDesc("en", e.target.value)} className="adm-input" />
          </Field>
          <Field label="Description (Spanish)">
            <textarea rows={3} value={product.description?.es ?? ""} onChange={(e) => setDesc("es", e.target.value)} className="adm-input" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (USD)">
            <input type="number" step="0.01" required value={product.price ?? 0} onChange={(e) => setProduct((p) => ({ ...p, price: Number(e.target.value) }))} className="adm-input" />
          </Field>
          <Field label="Original Price">
            <input type="number" step="0.01" value={product.original_price ?? ""} onChange={(e) => setProduct((p) => ({ ...p, original_price: Number(e.target.value) }))} className="adm-input" />
          </Field>
          <Field label="Stock">
            <input type="number" required value={product.stock ?? 0} onChange={(e) => setProduct((p) => ({ ...p, stock: Number(e.target.value) }))} className="adm-input" />
          </Field>
        </div>

        <Field label="Image URL">
          <input value={product.image_url ?? ""} onChange={(e) => setProduct((p) => ({ ...p, image_url: e.target.value }))} className="adm-input" />
        </Field>

        <Field label="Category">
          <select required value={product.category_slug ?? ""} onChange={(e) => setProduct((p) => ({ ...p, category_slug: e.target.value }))} className="adm-input">
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name.en}</option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle label="Discount" value={!!product.discount} onChange={(v) => setProduct((p) => ({ ...p, discount: v }))} />
          <Toggle label="New Arrival" value={!!product.new_arrival} onChange={(v) => setProduct((p) => ({ ...p, new_arrival: v }))} />
          <Toggle label="Featured" value={!!product.featured} onChange={(v) => setProduct((p) => ({ ...p, featured: v }))} />
          <Toggle
            label={product.published ? "Published (visible to customers)" : "Draft (admin only)"}
            value={!!product.published}
            onChange={(v) => setProduct((p) => ({ ...p, published: v }))}
          />
        </div>

        {product.discount && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount Text (English)">
              <input value={product.discount_text?.en ?? ""} onChange={(e) => setDiscountText("en", e.target.value)} placeholder="22% OFF" className="adm-input" />
            </Field>
            <Field label="Discount Text (Spanish)">
              <input value={product.discount_text?.es ?? ""} onChange={(e) => setDiscountText("es", e.target.value)} placeholder="22% DESC" className="adm-input" />
            </Field>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-barn-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-barn-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
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

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border border-neutral-300 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="accent-barn-600" />
    </label>
  );
}
