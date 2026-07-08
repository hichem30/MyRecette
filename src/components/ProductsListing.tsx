"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Filter, Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "@/lib/i18n/navigation";
import type { Category, Product } from "@/lib/types";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE = 10;

export function ProductsListing({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const locale = useLocale() as "en" | "es";
  const t = useTranslations("products");
  const tC = useTranslations("common");
  const sp = useSearchParams();
  const urlPage = Math.max(1, Number(sp.get("page") ?? "1"));
  const urlCategory = sp.get("category") ?? sp.get("cat") ?? "";
  const urlQ = sp.get("q") ?? "";

  const [query, setQuery] = useState(urlQ);
  const [activeCategory, setActiveCategory] = useState<string>(urlCategory);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [priceMax, setPriceMax] = useState<number>(500);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  // Keep listing in sync when the user changes ?q= via the header search
  // bar without unmounting this component.
  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);
  useEffect(() => {
    setActiveCategory(urlCategory);
  }, [urlCategory]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products
      .filter((p) => (activeCategory ? p.category_slug === activeCategory : true))
      .filter((p) => p.price <= priceMax)
      .filter((p) => (newArrivalsOnly ? p.new_arrival : true))
      .filter((p) => (onSaleOnly ? p.discount : true))
      .filter((p) => (freeShipping ? !!p.free_shipping : true))
      .filter((p) =>
        lower
          ? (p.name?.[locale] || "").toLowerCase().includes(lower) ||
            (p.description?.[locale] || "").toLowerCase().includes(lower)
          : true,
      )
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return 0;
      });
  }, [products, locale, query, activeCategory, sortBy, priceMax, newArrivalsOnly, onSaleOnly, freeShipping]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(urlPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Filters */}
      <aside className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="h-4 w-4" /> {t("filters")}
        </h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">{tC("sortBy")}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="newest">{tC("newest")}</option>
            <option value="price_asc">{tC("priceLowHigh")}</option>
            <option value="price_desc">{tC("priceHighLow")}</option>
          </select>
        </div>

        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("allCategories")}
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <button
                onClick={() => setActiveCategory("")}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                  activeCategory === "" ? "bg-barn-50 text-barn-700 font-semibold" : "hover:bg-neutral-50"
                }`}
              >
                {t("allCategories")} <span className="text-xs text-neutral-400">{products.length}</span>
              </button>
            </li>
            {categories.map((c) => {
              const count = products.filter((p) => p.category_slug === c.slug).length;
              const active = activeCategory === c.slug;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveCategory(c.slug)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      active ? "bg-barn-50 text-barn-700 font-semibold" : "hover:bg-neutral-50"
                    }`}
                  >
                    {c.name[locale]} <span className="text-xs text-neutral-400">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("priceRange")}
          </label>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="w-full accent-barn-600"
          />
          <p className="mt-1 text-xs text-neutral-500">$0 – ${priceMax}</p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("availability")}
          </p>
          <Toggle label={t("newArrivalsOnly")} value={newArrivalsOnly} onChange={setNewArrivalsOnly} />
          <Toggle label={t("onSaleOnly")} value={onSaleOnly} onChange={setOnSaleOnly} />
          <Toggle label={t("freeShipping")} value={freeShipping} onChange={setFreeShipping} />
        </div>
      </aside>

      {/* Listing */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <p className="text-xs text-neutral-500">
            {tC("showing")} <strong>{start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}</strong> {tC("of")} <strong>{filtered.length}</strong> {tC("results")}
          </p>
        </div>

        {paged.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
            {t("noProducts")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
            <PageLink page={Math.max(1, page - 1)} disabled={page === 1} label={tC("prev")} />
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              return (
                <PageLink key={n} page={n} label={String(n)} active={n === page} />
              );
            })}
            <PageLink page={Math.min(totalPages, page + 1)} disabled={page === totalPages} label={tC("next")} />
          </nav>
        )}
      </div>
    </div>
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
    <label className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50">
      <span className="text-neutral-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`inline-flex h-5 w-9 items-center rounded-full transition ${
          value ? "bg-barn-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            value ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function PageLink({
  page,
  label,
  active = false,
  disabled = false,
}: {
  page: number;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const sp = useSearchParams();
  const params = new URLSearchParams(sp.toString());
  params.set("page", String(page));
  if (disabled) {
    return (
      <span className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-400">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/products?${params.toString()}`}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-barn-600 bg-barn-600 text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-barn-600 hover:text-barn-700"
      }`}
    >
      {label}
    </Link>
  );
}
