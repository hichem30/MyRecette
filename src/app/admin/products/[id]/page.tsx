"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { revalidateAdmin } from "@/lib/admin/revalidate";
import ImageUploader from "@/components/admin/ImageUploader";
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
    free_shipping: false,
    discount_starts_at: null,
    discount_ends_at: null,
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
    // Spanish has been deprecated — mirror the English text into the `es`
    // slot so the existing JSONB columns still validate and any old `[lang]`
    // reads on the storefront keep working.
    const en = product.name?.en ?? "";
    const descEn = product.description?.en ?? "";
    const dtEn = product.discount_text?.en ?? "";
    const payload = {
      ...product,
      name: { en, es: en },
      description: { en: descEn, es: descEn },
      discount_text: product.discount
        ? { en: dtEn, es: dtEn }
        : product.discount_text ?? null,
      slug: product.slug || en.toLowerCase().replace(/\s+/g, "-"),
    };
    const { error } = isNew
      ? await sb.from("products").insert(payload)
      : await sb.from("products").update(payload).eq("id", params.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    await revalidateAdmin("products", payload.slug);
    router.replace("/admin/products");
  }

  function setName(value: string) {
    setProduct((p) => ({ ...p, name: { en: value, es: value } }));
  }
  function setDesc(value: string) {
    setProduct((p) => ({ ...p, description: { en: value, es: value } }));
  }
  function setDiscountText(value: string) {
    setProduct((p) => ({ ...p, discount_text: { en: value, es: value } }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-barn-700">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to products
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-bold">{isNew ? "Add Product" : "Edit Product"}</h1>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <Field label="Name">
          <input required value={product.name?.en ?? ""} onChange={(e) => setName(e.target.value)} className="adm-input" />
        </Field>

        <Field label="Description">
          <textarea rows={3} value={product.description?.en ?? ""} onChange={(e) => setDesc(e.target.value)} className="adm-input" />
        </Field>

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

        <Field label="Product Image">
          <ImageUploader
            value={product.image_url ?? ""}
            onChange={(url) => setProduct((p) => ({ ...p, image_url: url }))}
            folder="products"
          />
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
          <Toggle label="Free shipping on this product" value={!!product.free_shipping} onChange={(v) => setProduct((p) => ({ ...p, free_shipping: v }))} />
          <Toggle
            label={product.published ? "Published (visible to customers)" : "Draft (admin only)"}
            value={!!product.published}
            onChange={(v) => setProduct((p) => ({ ...p, published: v }))}
          />
        </div>

        {product.discount && (
          <>
            <Field label="Discount Text">
              <input value={product.discount_text?.en ?? ""} onChange={(e) => setDiscountText(e.target.value)} placeholder="22% OFF" className="adm-input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount starts (optional)">
                <input
                  type="datetime-local"
                  value={toLocalInput(product.discount_starts_at)}
                  onChange={(e) => setProduct((p) => ({ ...p, discount_starts_at: fromLocalInput(e.target.value) }))}
                  className="adm-input"
                />
              </Field>
              <Field label="Discount ends (optional)">
                <input
                  type="datetime-local"
                  value={toLocalInput(product.discount_ends_at)}
                  onChange={(e) => setProduct((p) => ({ ...p, discount_ends_at: fromLocalInput(e.target.value) }))}
                  className="adm-input"
                />
              </Field>
            </div>
            <p className="text-xs text-neutral-500">
              Leave dates empty for an open-ended sale. When set, the discount badge only shows during this window.
            </p>
          </>
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
