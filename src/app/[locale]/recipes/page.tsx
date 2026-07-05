import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import {
  Search,
  Clock,
  Flame,
  Star,
  Heart,
  ChefHat,
  Tag,
  Grid3X3,
  List,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

// Mock recipes for local development
const mockRecipes: Recipe[] = [
  {
    id: "r-1",
    title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
    slug: "spaghetti-bolognese",
    description: {
      en: "A classic Italian pasta dish with rich meat sauce",
      es: "Un clásico plato italiano de pasta con salsa de carne",
    },
    author_id: "user-1",
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    servings: 4,
    difficulty: "medium",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    video_url: "https://www.youtube.com/embed/3a0v8W1Tn9k",
    rating: 4.7,
    rating_count: 234,
    view_count: 1250,
    favorite_count: 89,
    cuisine: "Italian",
    meal_type: "dinner",
    dietary_tags: ["none"],
    published: true,
    published_at: "2024-01-15T10:00:00Z",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-06-20T14:30:00Z",
    author: { id: "user-1", email: "chef@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
  {
    id: "r-2",
    title: { en: "Chicken Caesar Salad", es: "Ensalada César con Pollo" },
    slug: "chicken-caesar-salad",
    description: {
      en: "Fresh romaine lettuce with grilled chicken, croutons, and creamy Caesar dressing",
      es: "Lechuga romana fresca con pollo a la parrilla, croutons y aderezo César cremoso",
    },
    author_id: "user-2",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 2,
    difficulty: "easy",
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80",
    rating: 4.5,
    rating_count: 189,
    view_count: 980,
    favorite_count: 67,
    cuisine: "American",
    meal_type: "lunch",
    dietary_tags: ["gluten-free"],
    published: true,
    published_at: "2024-02-20T14:00:00Z",
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-06-18T09:20:00Z",
    author: { id: "user-2", email: "foodie@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
  {
    id: "r-3",
    title: { en: "Chocolate Lava Cake", es: "Pastel de Chocolate Volcán" },
    slug: "chocolate-lava-cake",
    description: {
      en: "Warm chocolate cake with a molten center, served with vanilla ice cream",
      es: "Pastel de chocolate caliente con centro líquido, servido con helado de vainilla",
    },
    author_id: "user-3",
    prep_time_minutes: 10,
    cook_time_minutes: 12,
    servings: 4,
    difficulty: "medium",
    image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    rating_count: 342,
    view_count: 2150,
    favorite_count: 156,
    cuisine: "French",
    meal_type: "dessert",
    dietary_tags: ["vegetarian"],
    published: true,
    published_at: "2024-03-10T16:00:00Z",
    created_at: "2024-03-05T11:00:00Z",
    updated_at: "2024-06-15T10:45:00Z",
    author: { id: "user-3", email: "dessertlover@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
  {
    id: "r-4",
    title: { en: "Beef Tacos", es: "Tacos de Carne" },
    slug: "beef-tacos",
    description: {
      en: "Spiced ground beef in warm tortillas with fresh toppings",
      es: "Carne molida condimentada en tortillas calientes con toppings frescos",
    },
    author_id: "user-4",
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    servings: 4,
    difficulty: "easy",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    rating: 4.3,
    rating_count: 98,
    view_count: 650,
    favorite_count: 45,
    cuisine: "Mexican",
    meal_type: "dinner",
    dietary_tags: ["gluten-free"],
    published: true,
    published_at: "2024-04-05T12:00:00Z",
    created_at: "2024-04-01T08:00:00Z",
    updated_at: "2024-05-20T15:30:00Z",
    author: { id: "user-4", email: "mexicanfood@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
  {
    id: "r-5",
    title: { en: "Vegetable Stir Fry", es: "Salteado de Verduras" },
    slug: "vegetable-stir-fry",
    description: {
      en: "Colorful vegetables wok-fried with a savory sauce",
      es: "Verduras coloridas salteadas en wok con una salsa sabrosa",
    },
    author_id: "user-5",
    prep_time_minutes: 10,
    cook_time_minutes: 8,
    servings: 2,
    difficulty: "easy",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    rating: 4.6,
    rating_count: 156,
    view_count: 890,
    favorite_count: 56,
    cuisine: "Asian",
    meal_type: "lunch",
    dietary_tags: ["vegan", "vegetarian", "gluten-free"],
    published: true,
    published_at: "2024-05-15T11:00:00Z",
    created_at: "2024-05-10T09:00:00Z",
    updated_at: "2024-06-10T14:20:00Z",
    author: { id: "user-5", email: "healthy@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
  {
    id: "r-6",
    title: { en: "Margherita Pizza", es: "Pizza Margherita" },
    slug: "margherita-pizza",
    description: {
      en: "Classic Italian pizza with tomato sauce, fresh mozzarella, and basil",
      es: "Pizza clásica italiana con salsa de tomate, mozzarella fresca y albahaca",
    },
    author_id: "user-1",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 4,
    difficulty: "medium",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    rating_count: 456,
    view_count: 3200,
    favorite_count: 234,
    cuisine: "Italian",
    meal_type: "dinner",
    dietary_tags: ["vegetarian"],
    published: true,
    published_at: "2024-01-25T18:00:00Z",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-06-25T09:15:00Z",
    author: { id: "user-1", email: "chef@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: false,
  },
];

// Helper functions
function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getDifficultyLabel(difficulty: string | null | undefined): string {
  const labels: Record<string, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
  };
  return labels[difficulty || ""] || difficulty || "";
}

function StarRating({ rating, count }: { rating: number | null; count?: number }) {
  if (!rating) return null;
  
  const maxStars = 5;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
        ))}
        {hasHalf && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 opacity-50" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-amber-400 opacity-20" />
        ))}
      </div>
      <span className="text-xs text-neutral-500">({count?.toLocaleString()})</span>
    </div>
  );
}

// Recipe card component
function RecipeCard({
  recipe,
  lang,
  view = "grid",
}: {
  recipe: Recipe;
  lang: "en" | "es";
  view?: "grid" | "list";
}) {
  const title = recipe.title[lang] || recipe.title.en || "Recipe";
  const description = recipe.description?.[lang] || recipe.description?.en || "";
  const author = recipe.author?.email || "My Recette";
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  
  if (view === "list") {
    return (
      <Link
        href={`/${lang}/recipes/${recipe.slug}`}
        className="flex gap-4 p-4 rounded-xl border border-neutral-200 hover:shadow-md transition-shadow"
      >
        {/* Image */}
        <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={title}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-barn-100 to-barn-200 flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-barn-400" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-barn-600 font-medium capitalize">{recipe.cuisine}</span>
            <StarRating rating={recipe.rating} count={recipe.rating_count} />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2">{description}</p>
          
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(totalTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings || "1"} servings</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>{getDifficultyLabel(recipe.difficulty)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{(recipe.favorite_count || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  
  // Grid view
  return (
    <Link
      href={`/${lang}/recipes/${recipe.slug}`}
      className="group"
    >
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={title}
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-barn-100 to-barn-200 flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-barn-400" />
            </div>
          )}
          
          {/* Badge */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-700">
              <ChefHat className="h-3 w-3" />
              {recipe.cuisine}
            </span>
          </div>
          
          {/* Favorite count */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-700">
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
              {(recipe.favorite_count || 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1">{title}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2">{description}</p>
          
          {/* Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-sm text-neutral-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(totalTime)}
              </span>
              <StarRating rating={recipe.rating} count={recipe.rating_count} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Filter categories
const categories = [
  { id: "all", label: { en: "All Recipes", es: "Todas las Recetas" }, count: 0 },
  { id: "italian", label: { en: "Italian", es: "Italiana" }, count: 0 },
  { id: "mexican", label: { en: "Mexican", es: "Mexicana" }, count: 0 },
  { id: "asian", label: { en: "Asian", es: "Asiática" }, count: 0 },
  { id: "american", label: { en: "American", es: "Americana" }, count: 0 },
  { id: "french", label: { en: "French", es: "Francesa" }, count: 0 },
];

const difficulties = [
  { id: "all", label: { en: "All Difficulties", es: "Todas las Dificultades" } },
  { id: "easy", label: { en: "Easy", es: "Fácil" } },
  { id: "medium", label: { en: "Medium", es: "Media" } },
  { id: "hard", label: { en: "Hard", es: "Difícil" } },
];

const mealTypes = [
  { id: "all", label: { en: "All Meal Types", es: "Todos los Tipos" } },
  { id: "breakfast", label: { en: "Breakfast", es: "Desayuno" } },
  { id: "lunch", label: { en: "Lunch", es: "Almuerzo" } },
  { id: "dinner", label: { en: "Dinner", es: "Cena" } },
  { id: "dessert", label: { en: "Dessert", es: "Postre" } },
  { id: "snack", label: { en: "Snack", es: "Merienda" } },
];

const sortOptions = [
  { id: "popular", label: { en: "Most Popular", es: "Más Populares" } },
  { id: "newest", label: { en: "Newest", es: "Más Recientes" } },
  { id: "rating", label: { en: "Top Rated", es: "Mejor Valorados" } },
  { id: "quick", label: { en: "Quickest", es: "Más Rápidos" } },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrecette.com";
  const url = `${base}/${lang}/recipes`;
  
  return {
    title: `Recipes — My Recette`,
    description: "Discover delicious recipes with step-by-step instructions. Find the perfect dish for any occasion.",
    alternates: { canonical: url },
    openGraph: {
      title: `Recipes — My Recette`,
      description: "Discover delicious recipes with step-by-step instructions.",
      url,
      siteName: "My Recette",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Recipes — My Recette`,
      description: "Discover delicious recipes with step-by-step instructions.",
    },
  };
}

export default async function RecipesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ 
    search?: string;
    category?: string;
    difficulty?: string;
    meal_type?: string;
    sort?: string;
    view?: "grid" | "list";
  }>;
}) {
  const { locale } = await params;
  const { search, category, difficulty, meal_type, sort, view: viewParam } = await searchParams;
  
  setRequestLocale(locale);
  
  const lang = locale as "en" | "es";
  const t = await getTranslations("common");
  
  // Get user session for favorites
  const sb = getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id;
  
  // For now, use mock recipes
  // In production: const recipes = await getAllRecipes();
  let recipes = [...mockRecipes];
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    recipes = recipes.filter((r) => {
      const title = r.title[lang]?.toLowerCase() || r.title.en?.toLowerCase() || "";
      const description = r.description?.[lang]?.toLowerCase() || r.description?.en?.toLowerCase() || "";
      return title.includes(searchLower) || description.includes(searchLower);
    });
  }
  
  // Filter by category
  if (category && category !== "all") {
    recipes = recipes.filter((r) => r.cuisine?.toLowerCase() === category.toLowerCase());
  }
  
  // Filter by difficulty
  if (difficulty && difficulty !== "all") {
    recipes = recipes.filter((r) => r.difficulty === difficulty);
  }
  
  // Filter by meal type
  if (meal_type && meal_type !== "all") {
    recipes = recipes.filter((r) => r.meal_type === meal_type);
  }
  
  // Sort
  switch (sort) {
    case "newest":
      recipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case "rating":
      recipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "quick":
      recipes.sort((a, b) => ((a.prep_time_minutes || 0) + (a.cook_time_minutes || 0)) - ((b.prep_time_minutes || 0) + (b.cook_time_minutes || 0)));
      break;
    default: // popular
      recipes.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  }
  
  // View mode
  const view = viewParam === "list" ? "list" : "grid";
  
  // Update category counts
  const categoryCounts = categories.reduce((acc, cat) => {
    if (cat.id !== "all") {
      acc[cat.id] = mockRecipes.filter((r) => r.cuisine?.toLowerCase() === cat.id.toLowerCase()).length;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900">
          Delicious Recipes
        </h1>
        <p className="text-neutral-600 mt-2 max-w-2xl mx-auto">
          Find the perfect recipe for any occasion. From quick weeknight dinners to impressive desserts.
        </p>
      </div>
      
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="search"
            placeholder={lang === "es" ? "Buscar recetas..." : "Search recipes..."}
            defaultValue={search || ""}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
          />
        </div>
        
        {/* Add Recipe Button */}
        <Link
          href={`/${lang}/recipes/add`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-barn-600 text-white hover:bg-barn-700 font-semibold transition-colors whitespace-nowrap"
        >
          <Tag className="h-5 w-5" />
          {lang === "es" ? "Añadir Receta" : "Add Recipe"}
        </Link>
        
        {/* View Toggle */}
        <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white p-0.5">
          <button
            className={`p-2 rounded-md transition-colors ${
              view === "grid"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${
              view === "list"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Category:</span>
            <select
              defaultValue={category || "all"}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-sm focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label[lang]} {cat.id !== "all" && `(${categoryCounts[cat.id] || 0})`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Difficulty:</span>
            <select
              defaultValue={difficulty || "all"}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-sm focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none"
            >
              {difficulties.map((d) => (
                <option key={d.id} value={d.id}>{d.label[lang]}</option>
              ))}
            </select>
          </div>
          
          {/* Meal Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Meal Type:</span>
            <select
              defaultValue={meal_type || "all"}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-sm focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none"
            >
              {mealTypes.map((m) => (
                <option key={m.id} value={m.id}>{m.label[lang]}</option>
              ))}
            </select>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-neutral-600">Sort by:</span>
            <select
              defaultValue={sort || "popular"}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-sm focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none"
            >
              {sortOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label[lang]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Results */}
      {recipes.length > 0 ? (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            Showing {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
          
          <div className={`grid gap-6 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                lang={lang}
                view={view}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <ChefHat className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-semibold text-neutral-900">No recipes found</h3>
          <p className="text-neutral-600 mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
