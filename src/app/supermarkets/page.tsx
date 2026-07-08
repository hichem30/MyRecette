import type { Metadata } from "next";
import { setRequestLocale, t } from "@/lib/fr";
import { ShoppingBag, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getAllSupermarkets } from "@/lib/data";
import SupermarketCard from "@/components/SupermarketCard";
import type { SupermarketProfile } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrecette.com";
  const url = `${base}/${lang}/supermarkets`;
  
  return {
    title: `Discover Supermarkets — sucre et sel`,
    description: "Find and follow local supermarkets to discover products, coupons, bundles, and job opportunities.",
    alternates: { canonical: url },
    openGraph: {
      title: `Discover Supermarkets — sucre et sel`,
      description: "Find and follow local supermarkets to discover products, coupons, bundles, and job opportunities.",
      url,
      siteName: "sucre et sel",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Discover Supermarkets — sucre et sel`,
      description: "Find and follow local supermarkets to discover products, coupons, bundles, and job opportunities.",
    },
  };
}

// Category filter chips
function CategoryFilter({
  categories,
  selectedCategory,
  lang,
}: {
  categories: string[];
  selectedCategory: string | null;
  lang: "en" | "es";
}) {
  const categoryLabels: Record<string, { en: string; es: string }> = {
    all: { en: "All", es: "Todos" },
    groceries: { en: "Groceries", es: "Comestibles" },
    fresh: { en: "Fresh", es: "Frescos" },
    organic: { en: "Organic", es: "Orgánico" },
    sustainable: { en: "Sustainable", es: "Sostenible" },
    ecofriendly: { en: "Eco-Friendly", es: "Ecológico" },
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      <button
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === null
            ? "bg-recette-600 text-white"
            : "bg-white text-neutral-600 hover:bg-neutral-100"
        }`}
      >
        {categoryLabels.all[lang]}
      </button>
      {categories.map((category) => {
        const label = categoryLabels[category.toLowerCase()]?.[lang] || category;
        return (
          <button
            key={category}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              selectedCategory === category
                ? "bg-recette-600 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Search bar component
function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
      <input
        type="search"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-recette-500 focus:border-recette-500 outline-none transition-colors"
      />
    </div>
  );
}

// Sort options
function SortOptions() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-neutral-300 bg-white">
      <TrendingUp className="h-4 w-4 text-neutral-500" />
      <select className="text-sm text-neutral-700 bg-transparent border-none outline-none cursor-pointer">
        <option>Popular</option>
        <option>Newest</option>
        <option>Nearby</option>
      </select>
    </div>
  );
}

export default async function SupermarketsDiscoveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { category, search, sort } = await searchParams;
  
  setRequestLocale(locale);
  
  const lang = locale as "en" | "es";
  const t = await getTranslations("common");
  
  // Fetch all supermarkets
  const supermarkets = await getAllSupermarkets();
  
  // Get all unique categories from supermarkets
  const allCategories = Array.from(
    new Set(supermarkets.flatMap((s) => s.category_tags || []).filter(Boolean))
  );
  
  // Filter supermarkets
  let filteredSupermarkets = [...supermarkets];
  
  // Filter by category
  if (category) {
    filteredSupermarkets = filteredSupermarkets.filter((s) =>
      s.category_tags?.includes(category)
    );
  }
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSupermarkets = filteredSupermarkets.filter((s) => {
      const name = s.supermarket_name[lang]?.toLowerCase() || s.supermarket_name.en?.toLowerCase() || "";
      const description = s.description?.[lang]?.toLowerCase() || s.description?.en?.toLowerCase() || "";
      const tags = s.category_tags?.join(" ").toLowerCase() || "";
      return name.includes(searchLower) || description.includes(searchLower) || tags.includes(searchLower);
    });
  }
  
  // Sort supermarkets
  switch (sort) {
    case "newest":
      filteredSupermarkets.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "nearby":
      // For now, just sort by follower count as proxy
      filteredSupermarkets.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
      break;
    default: // Popular
      filteredSupermarkets.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900">
          Discover Supermarkets
        </h1>
        <p className="text-neutral-600 mt-2 max-w-2xl mx-auto">
          Find and follow local supermarkets to discover products, coupons, bundles, and job opportunities.
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder={`Search supermarkets...`} />
        <SortOptions />
      </div>
      
      {/* Category Filters */}
      {allCategories.length > 0 && (
        <CategoryFilter
          categories={allCategories}
          selectedCategory={category || null}
          lang={lang}
        />
      )}
      
      {/* Results */}
      {filteredSupermarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {filteredSupermarkets.map((supermarket) => (
            <SupermarketCard
              key={supermarket.id}
              supermarket={supermarket}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <ShoppingBag className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-semibold text-neutral-900">No supermarkets found</h3>
          <p className="text-neutral-600 mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
