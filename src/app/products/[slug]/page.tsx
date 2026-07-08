import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { t } from "@/lib/fr";
import { getProductName } from "@/lib/products/service";
import { ChevronRight, Clock, FlaskConical, Heart, MapPin, ShoppingCart, Star, Users, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getAllProducts, getProductBySlug } from "@/lib/data";
import { formatPrice, isDiscountWindowActive } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { ProductCTAs } from "@/components/ProductCTAs";
import { ProductShare } from "@/components/ProductShare";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { RecordProductView } from "@/components/RecordProductView";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, Recipe, Ingredient, SupermarketIngredientAvailability } from "@/lib/types";

// Mock data for local development
const mockRecipesUsingProduct: Recipe[] = [
  {
    id: "r-1",
    title: { fr: "Spaghetti Bolognese" },
    slug: "spaghetti-bolognese",
    description: { fr: "Un classique plat italien de pâtes avec une riche sauce à la viande" },
    author_id: "user-1",
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    servings: 4,
    difficulty: "medium",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    rating_count: 234,
    favorite_count: 89,
    cuisine: "Italian",
    meal_type: "dinner",
    published: true,
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-06-20T14:30:00Z",
    author: { id: "user-1", email: "chef@myrecette.com", supermarket_name: null },
  },
  {
    id: "r-2",
    title: { fr: "Soupe Tomate-Basilic" },
    slug: "tomato-basil-soup",
    description: { fr: "Une soupe rafraîchissante à base de tomates et de basilic frais" },
    author_id: "user-2",
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    servings: 2,
    difficulty: "easy",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
    rating: 4.5,
    rating_count: 156,
    favorite_count: 67,
    cuisine: "Italian",
    meal_type: "lunch",
    published: true,
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-06-15T11:00:00Z",
    author: { id: "user-2", email: "homechef@myrecette.com", supermarket_name: null },
  },
];

const mockIngredients: Ingredient[] = [
  { id: "i-tomato", canonical_name: "tomato", display_name: { fr: "Tomate" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-onion", canonical_name: "onion", display_name: { fr: "Oignon" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-garlic", canonical_name: "garlic", display_name: { fr: "Ail" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const mockAvailability: SupermarketIngredientAvailability[] = [
  {
    supermarket_id: "sm-1",
    supermarket_name: { fr: "Supermarché FreshMart" },
    location_geometry: null,
    distance_meters: 1200,
    ingredient_count: 5,
    total_price: 12.49,
    available_ingredients: [
      { ingredient: "Tomate", price: 2.99, in_stock: true },
      { ingredient: "Oignon", price: 0.99, in_stock: true },
      { ingredient: "Ail", price: 1.49, in_stock: true },
    ],
    missing_ingredients: [],
  },
  {
    supermarket_id: "sm-2",
    supermarket_name: { fr: "Marché GreenGrocer" },
    location_geometry: null,
    distance_meters: 2500,
    ingredient_count: 2,
    total_price: 8.25,
    available_ingredients: [
      { ingredient: "Tomate", price: 3.25, in_stock: true },
      { ingredient: "Oignon", price: 1.00, in_stock: true },
    ],
    missing_ingredients: [{ ingredient: "Ail" }],
  },
];

// Helper to format difficulty
function getDifficultyLabel(difficulty: string | null | undefined): string {
  const labels: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };
  return labels[difficulty || ""] || difficulty || "";
}

// Helper to format time
function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Star rating component
function StarRating({ rating, count }: { rating: number | null; count?: number }) {
  const maxStars = 5;
  const fullStars = rating ? Math.floor(rating) : 0;
  const hasHalf = rating ? rating % 1 >= 0.5 : false;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 text-amber-400 fill-amber-400" />
        ))}
        {hasHalf && <Star className="h-4 w-4 text-amber-400 fill-amber-400 opacity-50" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-amber-400 opacity-20" />
        ))}
      </div>
      {rating && <span className="text-sm text-neutral-600">{rating.toFixed(1)} {count && `(${count.toLocaleString()})`}</span>}
    </div>
  );
}

// Recipe Card for product page
function RecipeCardForProduct({ recipe }: { recipe: Recipe }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/fr/${recipe.slug}`} className="block">
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.title?.fr || "Recette"} width={400} height={250} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-recette-100 to-recette-200 flex items-center justify-center">
            <Users className="h-8 w-8 text-recette-400" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 group-hover:text-recette-700 line-clamp-1">{recipe.title?.fr}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{recipe.description?.fr}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
            <span><Clock className="h-3.5 w-3.5 inline" /> {formatTime(recipe.prep_time_minutes)} prep, {formatTime(recipe.cook_time_minutes)} cook</span>
            <span><Users className="h-3.5 w-3.5 inline" /> Serves {recipe.servings || 1}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <StarRating rating={recipe.rating ?? null} count={recipe.rating_count} />
            <span className="text-xs text-neutral-500">{recipe.favorite_count?.toLocaleString() || "0"} favorites</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Ingredient matching info for product
function IngredientMatchingInfo({ product, ingredients }: { product: Product; ingredients: Ingredient[] }) {
  const productName = product.name?.fr || product.name?.en || "";
  const matchingIngredients = ingredients.filter(ing =>
    productName.toLowerCase().includes(ing.canonical_name.toLowerCase()) ||
    ing.canonical_name.toLowerCase().includes(productName.toLowerCase())
  );

  if (matchingIngredients.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">
        <FlaskConical className="h-5 w-5 inline-block mr-2 text-recette-600" />
        Ingredient Information
      </h3>
      <div className="flex flex-wrap gap-2">
        {matchingIngredients.map((ingredient) => (
          <span key={ingredient.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            {ingredient.display_name?.fr || ingredient.canonical_name}
          </span>
        ))}
      </div>
      <p className="text-sm text-neutral-600">This product is identified as these ingredients in our recipe database.</p>
    </div>
  );
}

// Supermarket availability panel
function SupermarketAvailabilityPanel({ availability }: { availability: SupermarketIngredientAvailability[] }) {
  if (!availability || availability.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">
        <MapPin className="h-5 w-5 inline-block mr-2 text-recette-600" />
        Available at Nearby Supermarkets
      </h3>
      <div className="space-y-4">
        {availability.map((supermarket) => {
          const allAvailable = supermarket.missing_ingredients.length === 0;
          const completionPercent = (supermarket.ingredient_count / (supermarket.ingredient_count + supermarket.missing_ingredients.length)) * 100;

          return (
            <div key={supermarket.supermarket_id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-recette-600" />
                    <h4 className="font-semibold text-neutral-900">{supermarket.supermarket_name?.fr}</h4>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>{supermarket.ingredient_count} of {supermarket.ingredient_count + supermarket.missing_ingredients.length} ingredients</span>
                      {supermarket.distance_meters && <span>{(supermarket.distance_meters / 1000).toFixed(1)} km away</span>}
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div className={`h-full bg-${allAvailable ? "emerald" : "amber"}-500 transition-all`} style={{ width: `${completionPercent}%` }} />
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">
                    Total: <span className="font-semibold text-recette-600">{supermarket.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </p>
                  <div className="mt-3 space-y-1">
                    {supermarket.available_ingredients.map((item) => (
                      <div key={item.ingredient} className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item.ingredient}</span>
                        <span className="ml-auto font-medium">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {!item.in_stock && <span className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded">Low stock</span>}
                      </div>
                    ))}
                    {supermarket.missing_ingredients.map((item) => (
                      <div key={item.ingredient} className="flex items-center gap-2 text-sm text-neutral-500">
                        <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>{item.ingredient}</span>
                        <span className="ml-auto text-xs">Not available</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href={`/fr/${supermarket.supermarket_id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-recette-50 text-recette-700 hover:bg-recette-100 text-sm font-medium transition-colors">
                    <ShoppingCart className="h-4 w-4" /> View Store
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const all = await getAllProducts();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.redbarnmarket.workers.dev";
  const url = `${base}/${product.slug}`;
  const name = product.name?.fr || product.name?.en || "";
  const description = product.description?.fr?.slice(0, 160) || name;
  return {
    title: `${name} — My Recette`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} — My Recette`,
      description,
      url,
      siteName: "My Recette",
      type: "website",
      images: product.image_url ? [{ url: product.image_url, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — My Recette`,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Get user session
  const sb = await getSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();

  const all = await getAllProducts();
  const related = all
    .filter((p) => p.category_slug === product.category_slug && p.id !== product.id)
    .slice(0, 4);

  // For now, use mock data for sucre et sel features
  // In production, fetch from database
  const recipesUsingProduct = mockRecipesUsingProduct;
  const matchingIngredients = mockIngredients;
  const supermarketAvailability = mockAvailability;

  // JSON-LD structured data for SEO rich results
  const name = product.name?.fr || product.name?.en || "Product";
  const description = product.description?.fr || product.description?.en || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: product.image_url,
    sku: product.id,
    brand: { "@type": "Brand", name: "sucre et sel" },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sucre-et-sel.sucre-et-sel.workers.dev"}/fr/${product.slug}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-page pt-6">
        <nav className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href={`/fr/`} className="hover:text-recette-700">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/fr/products`} className="hover:text-recette-700">
            Produits
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-700">{product.name?.fr || "Produit"}</span>
        </nav>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
            <Image
              src={product.image_url}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-4 top-4 flex flex-col gap-1">
              {product.new_arrival && (
                <span className="rounded-md bg-recette-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t("new")}
                </span>
              )}
              {product.discount &&
                product.discount_text &&
                isDiscountWindowActive(product.discount_starts_at, product.discount_ends_at) && (
                  <span className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {product.discount_text?.fr}
                  </span>
                )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-recette-600">
              {product.category_slug.replace(/-/g, " ")}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">
              {name}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-900">{formatPrice(product.price)}</span>
              {product.original_price && (
                <>
                  <span className="text-base text-neutral-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {t("you_save")} {formatPrice(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-neutral-600">{product.description?.fr}</p>

            <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                  product.stock === 0
                    ? "bg-red-50 text-red-700"
                    : product.stock <= 5
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {product.stock === 0
                  ? t("outOfStock")
                  : product.stock <= 5
                  ? t("onlyXLeft", { count: product.stock })
                  : `${product.stock} ${t("inStock")}`}
              </span>
              {product.free_shipping && (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <ShoppingCart className="h-3.5 w-3.5" /> {t("freeShipping")}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-stretch gap-2 sm:gap-3">
              <ProductCTAs product={product} />
              <ProductShare product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="container-page pb-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Ingredient Matching Information */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 mb-8">
              <IngredientMatchingInfo product={product} ingredients={matchingIngredients} />
            </div>

            {/* Recipes Using This Product */}
            {recipesUsingProduct.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 mb-8">
                <h3 className="font-semibold text-neutral-900 mb-6">
                  <Users className="h-5 w-5 inline-block mr-2 text-recette-600" />
                  Recipes Using This Product
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recipesUsingProduct.slice(0, 6).map((recipe) => (
                    <RecipeCardForProduct key={recipe.id} recipe={recipe} />
                  ))}
                </div>
                {recipesUsingProduct.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/fr/recipes?ingredient=${encodeURIComponent(product.name?.fr || "")}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-50 text-recette-700 hover:bg-recette-100 font-medium transition-colors"
                    >
                      View All {recipesUsingProduct.length} Recipes
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Supermarket Availability */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-24">
              <SupermarketAvailabilityPanel availability={supermarketAvailability} />
            </div>

            {/* Product Stats */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-8">
              <h3 className="font-semibold text-neutral-900 mb-4">Product Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Category</span>
                  <span className="font-medium text-neutral-900">
                    {product.category_slug.replace(/-/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Stock Status</span>
                  <span
                    className={`font-medium ${
                      product.stock === 0
                        ? "text-red-600"
                        : product.stock <= 5
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {product.stock === 0
                      ? "Out of Stock"
                      : product.stock <= 5
                      ? "Low Stock"
                      : "In Stock"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Product ID</span>
                  <span className="font-medium text-neutral-900 text-xs">{product.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecordProductView productId={product.id} />
      <RecentlyViewed products={all} exclude={product.id} />

      {related.length > 0 && (
        <section className="bg-neutral-50 py-12">
          <div className="container-page">
            <h2 className="mb-6 font-serif text-2xl font-bold">
              {false ? "Related Products" : "Productos Relacionados"}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
