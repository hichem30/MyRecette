"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Heart, Clock, Users, Flame } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Recipe } from "@/lib/types";

// Mock data for local development
const mockFavorites: Recipe[] = [
  {
    id: "r-1",
    title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
    slug: "spaghetti-bolognese",
    description: { en: "A classic Italian pasta dish with rich meat sauce", es: "Un clásico plato italiano de pasta con rica salsa de carne" },
    author_id: "user-1",
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    servings: 4,
    difficulty: "medium",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
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
    is_favorited: true,
  },
  {
    id: "r-2",
    title: { en: "Chicken Stir Fry", es: "Salteado de pollo" },
    slug: "chicken-stir-fry",
    description: { en: "Quick and easy chicken stir fry with vegetables", es: "Salteado de pollo rápido y fácil con verduras" },
    author_id: "user-2",
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 2,
    difficulty: "easy",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80",
    rating: 4.5,
    rating_count: 156,
    view_count: 872,
    favorite_count: 67,
    cuisine: "Asian",
    meal_type: "dinner",
    dietary_tags: ["gluten_free"],
    published: true,
    published_at: "2024-02-15T10:00:00Z",
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-06-15T11:00:00Z",
    author: { id: "user-2", email: "homechef@myrecette.com", supermarket_name: null },
    ingredients: [],
    comments: [],
    is_favorited: true,
  },
];

// Helper to format time
function formatTime(minutes: number | null | undefined, lang: "en" | "es"): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} ${lang === "en" ? "min" : "min"}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}${lang === "en" ? "h" : "h"} ${mins}${lang === "en" ? "min" : "min"}` : `${hours}${lang === "en" ? "h" : "h"}`;
}

// Helper to get difficulty label
function getDifficultyLabel(difficulty: string | null | undefined, lang: "en" | "es"): string {
  const labels: Record<string, { en: string; es: string }> = {
    easy: { en: "Easy", es: "Fácil" },
    medium: { en: "Medium", es: "Media" },
    hard: { en: "Hard", es: "Difícil" },
    expert: { en: "Expert", es: "Experto" },
  };
  return labels[difficulty || ""]?.[lang] || difficulty || "";
}

// Helper to get meal type label
function getMealTypeLabel(mealType: string | null | undefined, lang: "en" | "es"): string {
  const labels: Record<string, { en: string; es: string }> = {
    breakfast: { en: "Breakfast", es: "Desayuno" },
    lunch: { en: "Lunch", es: "Almuerzo" },
    dinner: { en: "Dinner", es: "Cena" },
    dessert: { en: "Dessert", es: "Postre" },
    snack: { en: "Snack", es: "Merienda" },
    appetizer: { en: "Appetizer", es: "Entrante" },
    drink: { en: "Drink", es: "Bebida" },
  };
  return labels[mealType || ""]?.[lang] || mealType || "";
}

// Recipe card component
function RecipeCard({ recipe, lang }: { recipe: Recipe; lang: "en" | "es" }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/${lang}/recipes/${recipe.slug}`} className="block">
        {recipe.image_url ? (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title[lang] || recipe.title.en || "Recipe"}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-700">
                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                {lang === "en" ? "Favorite" : "Favorito"}
              </span>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-recette-100 to-recette-200 flex items-center justify-center">
            <Flame className="h-8 w-8 text-recette-400" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 group-hover:text-recette-700 line-clamp-1">
            {recipe.title[lang] || recipe.title.en}
          </h3>
          <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
            {recipe.description?.[lang] || recipe.description?.en}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(recipe.prep_time_minutes, lang)} prep, {formatTime(recipe.cook_time_minutes, lang)} cook
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings || 1}
            </span>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {getDifficultyLabel(recipe.difficulty, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-neutral-900">
                {recipe.rating?.toFixed(1) || "0"}/5
              </span>
              <span className="text-xs text-neutral-500">
                ({recipe.rating_count?.toLocaleString() || "0"})
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              {recipe.favorite_count?.toLocaleString() || "0"} {lang === "en" ? "favorites" : "favoritos"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function AccountFavorites() {
  const t = useTranslations("account");
  const locale = useLocale() as "en" | "es";
  const [favorites, setFavorites] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    if (!isSupabaseConfigured()) {
      setFavorites(mockFavorites);
      setLoading(false);
      return;
    }

    const sb = getSupabaseBrowserClient();
    
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // Get user's favorite recipe IDs
      const { data: favoritesData, error: favoritesError } = await sb
        .from("recipe_favorites")
        .select("recipe_id")
        .eq("user_id", user.id);

      if (favoritesError || !favoritesData || cancelled) {
        setLoading(false);
        return;
      }

      const recipeIds = favoritesData.map((f) => f.recipe_id);
      
      if (recipeIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Get recipe details
      const { data: recipesData, error: recipesError } = await sb
        .from("recipes")
        .select(
          "id, title, slug, description, author_id, prep_time_minutes, cook_time_minutes, servings, " +
          "difficulty, image_url, rating, rating_count, view_count, favorite_count, " +
          "cuisine, meal_type, dietary_tags, published, published_at, created_at, updated_at, " +
          "author:profiles(id, email, supermarket_name)"
        )
        .in("id", recipeIds)
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (recipesError || !recipesData || cancelled) {
        setLoading(false);
        return;
      }

      // Mark all as favorited
      const recipes = recipesData.map((r) => ({
        ...r,
        is_favorited: true,
        ingredients: [],
        comments: [],
      })) as Recipe[];

      setFavorites(recipes);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">
        {locale === "en" ? "My Favorite Recipes" : "Mis Recetas Favoritas"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {locale === "en"
          ? "Recipes you've saved to your favorites list."
          : "Recetas que has guardado en tu lista de favoritas."}
      </p>
      
      <div className="mt-5">
        {loading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center text-sm text-neutral-400">
            {locale === "en" ? "Loading…" : "Cargando…"}
          </div>
        ) : favorites === null ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center text-sm text-neutral-400">
            {locale === "en" ? "Error loading favorites" : "Error al cargar favoritas"}
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Heart className="h-12 w-12 text-neutral-300" />
              <p className="text-sm text-neutral-500">
                {locale === "en"
                  ? "You haven't favorited any recipes yet."
                  : "Aún no has guardado ninguna receta en favoritas."}
              </p>
              <Link
                href={`/${locale}/recipes`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white hover:bg-recette-700 text-sm font-medium transition-colors"
              >
                {locale === "en" ? "Browse Recipes" : "Explorar Recetas"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} lang={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
