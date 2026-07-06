"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Fire,
  Heart,
  Search,
  Sparkles,
  Star,
  Tag,
  Users,
  X,
  MapPin,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Ingredient, RecipeSearchResult, SupermarketIngredientAvailability } from "@/lib/types";

// Ingredient category groups for organization
const INGREDIENT_CATEGORIES = [
  { id: "vegetable", label: "Vegetables", icon: "🥦", color: "emerald" },
  { id: "fruit", label: "Fruits", icon: "🍎", color: "rose" },
  { id: "protein", label: "Proteins", icon: "🍗", color: "amber" },
  { id: "dairy", label: "Dairy", icon: "🧀", color: "blue" },
  { id: "grain", label: "Grains & Bread", icon: "🍞", color: "neutral" },
  { id: "spice", label: "Spices", icon: "🌶️", color: "orange" },
  { id: "herb", label: "Herbs", icon: "🌿", color: "green" },
  { id: "oil", label: "Oils & Vinegars", icon: "🫒", color: "yellow" },
  { id: "baking", label: "Baking", icon: "🍰", color: "purple" },
  { id: "canned", label: "Canned & Packaged", icon: "🥫", color: "gray" },
  { id: "nuts", label: "Nuts & Seeds", icon: "🌰", color: "brown" },
  { id: "beverage", label: "Beverages", icon: "🍷", color: "indigo" },
  { id: "miscellaneous", label: "Miscellaneous", icon: "🍳", color: "neutral" },
];

const CATEGORY_COLORS: Record<string, string> = {
  vegetable: "bg-emerald-100 text-emerald-800",
  fruit: "bg-rose-100 text-rose-800",
  protein: "bg-amber-100 text-amber-800",
  dairy: "bg-blue-100 text-blue-800",
  grain: "bg-neutral-100 text-neutral-800",
  spice: "bg-orange-100 text-orange-800",
  herb: "bg-green-100 text-green-800",
  oil: "bg-yellow-100 text-yellow-800",
  baking: "bg-purple-100 text-purple-800",
  canned: "bg-gray-100 text-gray-800",
  nuts: "bg-amber-100 text-amber-800",
  beverage: "bg-indigo-100 text-indigo-800",
  miscellaneous: "bg-neutral-100 text-neutral-800",
};

// Trending ingredient searches (could be fetched from database later)
const TRENDING_SEARCHES = [
  "chicken",
  "tomato",
  "pasta",
  "cheese",
  "egg",
  "beef",
  "potato",
  "onion",
  "garlic",
  "flour",
];

export default function RecipesSearchPage() {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [recipes, setRecipes] = useState<RecipeSearchResult[]>([]);
  const [availability, setAvailability] = useState<SupermarketIngredientAvailability[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all ingredients
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const sb = getSupabaseBrowserClient();
    sb.from("ingredients")
      .select("id, canonical_name, display_name, category, subcategory, is_common, is_basic")
      .order("is_common", { ascending: false })
      .order("canonical_name")
      .then((res) => {
        const ingredients = (res.data as Ingredient[]) ?? [];
        setAllIngredients(ingredients);
        setLoading(false);
      });
  }, []);

  // Filter ingredients by search query and category
  const filteredIngredients = useMemo(() => {
    let result = allIngredients;

    // Apply category filter
    if (activeCategory) {
      result = result.filter((i) => i.category === activeCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.canonical_name.toLowerCase().includes(query) ||
          i.display_name?.en?.toLowerCase().includes(query) ||
          (i.subcategory?.toLowerCase().includes(query) ?? false)
      );
    }

    // Remove already selected ingredients
    result = result.filter((i) => !selectedIngredients.includes(i.canonical_name));

    return result;
  }, [allIngredients, searchQuery, activeCategory, selectedIngredients]);

  // Group ingredients by category for display
  const ingredientsByCategory = useMemo(() => {
    const grouped: Record<string, Ingredient[]> = {};
    filteredIngredients.forEach((ingredient) => {
      if (!grouped[ingredient.category]) {
        grouped[ingredient.category] = [];
      }
      grouped[ingredient.category].push(ingredient);
    });
    return grouped;
  }, [filteredIngredients]);

  // Search for recipes when ingredients change
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setRecipes([]);
      setAvailability([]);
      return;
    }

    // Debounce search
    const timer = setTimeout(() => {
      searchRecipes(selectedIngredients);
      if (userLocation) {
        checkAvailability(selectedIngredients, userLocation);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedIngredients, userLocation]);

  // Search for recipes by selected ingredients
  async function searchRecipes(ingredientNames: string[]) {
    if (ingredientNames.length === 0) {
      setRecipes([]);
      return;
    }

    setSearching(true);

    if (!isSupabaseConfigured()) {
      // Mock data for demo mode
      const mockRecipes: RecipeSearchResult[] = [
        {
          recipe_id: "1",
          title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
          slug: "spaghetti-bolognese",
          image_url: "/images/spaghetti.jpg",
          rating: 4.8,
          rating_count: 245,
          view_count: 12500,
          favorite_count: 850,
          prep_time_minutes: 20,
          cook_time_minutes: 40,
          servings: 4,
          difficulty: "medium",
          meal_type: "dinner",
          ingredient_match_count: 3,
          total_ingredients: 8,
          missing_ingredients_count: 0,
        },
        {
          recipe_id: "2",
          title: { en: "Chicken Stir Fry", es: "Pollo salteado" },
          slug: "chicken-stir-fry",
          image_url: "/images/chicken-stir-fry.jpg",
          rating: 4.6,
          rating_count: 180,
          view_count: 8500,
          favorite_count: 420,
          prep_time_minutes: 15,
          cook_time_minutes: 20,
          servings: 2,
          difficulty: "easy",
          meal_type: "dinner",
          ingredient_match_count: 2,
          total_ingredients: 6,
          missing_ingredients_count: 1,
        },
      ];
      setRecipes(mockRecipes);
      setSearching(false);
      return;
    }

    try {
      const sb = getSupabaseBrowserClient();
      const { data, error } = await sb
        .rpc("find_recipes_by_ingredients", {
          p_ingredient_names: ingredientNames,
          p_min_match: 1,
          p_limit: 50,
        });

      if (error) {
        console.error("Error searching recipes:", error);
        setRecipes([]);
      } else {
        setRecipes(data as RecipeSearchResult[]);
      }
    } catch (error) {
      console.error("Recipe search error:", error);
      setRecipes([]);
    } finally {
      setSearching(false);
    }
  }

  // Check ingredient availability at nearby supermarkets
  async function checkAvailability(ingredientNames: string[], location: { lat: number; lng: number }) {
    if (ingredientNames.length === 0) {
      setAvailability([]);
      return;
    }

    if (!isSupabaseConfigured()) {
      // Mock data for demo mode
      const mockAvailability: SupermarketIngredientAvailability[] = [
        {
          supermarket_id: "1",
          supermarket_name: { en: "Fresh Market", es: "Mercado Fresco" },
          distance_meters: 2500,
          ingredient_count: 3,
          total_price: 8.50,
          available_ingredients: [
            { ingredient: "chicken", price: 5.99, in_stock: true },
            { ingredient: "tomato", price: 1.50, in_stock: true },
            { ingredient: "onion", price: 1.01, in_stock: true },
          ],
          missing_ingredients: [],
        },
        {
          supermarket_id: "2",
          supermarket_name: { en: "Super Foods", es: "Super Alimentos" },
          distance_meters: 5200,
          ingredient_count: 2,
          total_price: 7.80,
          available_ingredients: [
            { ingredient: "chicken", price: 5.50, in_stock: true },
            { ingredient: "tomato", price: 2.30, in_stock: true },
          ],
          missing_ingredients: [{ ingredient: "onion" }],
        },
      ];
      setAvailability(mockAvailability);
      return;
    }

    try {
      const sb = getSupabaseBrowserClient();
      // Convert lat/lng to geography point
      const point = `SRID=4326;POINT(${location.lng} ${location.lat})`;

      const { data, error } = await sb
        .rpc("check_ingredient_availability", {
          p_ingredient_names: ingredientNames,
          p_user_location: point,
          p_max_distance_meters: 50000, // 50km
        });

      if (error) {
        console.error("Error checking availability:", error);
        setAvailability([]);
      } else {
        setAvailability(data as SupermarketIngredientAvailability[]);
      }
    } catch (error) {
      console.error("Availability check error:", error);
      setAvailability([]);
    }
  }

  // Request user location
  async function requestLocation() {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        // Re-check availability with new location
        if (selectedIngredients.length > 0) {
          checkAvailability(selectedIngredients, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      } catch (error) {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
      }
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }

  // Add ingredient to selection
  function addIngredient(canonicalName: string) {
    if (!selectedIngredients.includes(canonicalName)) {
      setSelectedIngredients([...selectedIngredients, canonicalName]);
    }
    setSearchQuery("");
    setActiveCategory(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }

  // Remove ingredient from selection
  function removeIngredient(canonicalName: string) {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== canonicalName));
  }

  // Clear all selected ingredients
  function clearAllIngredients() {
    setSelectedIngredients([]);
    setShowAvailability(false);
  }

  // Get ingredient by canonical name
  function getIngredientByName(canonicalName: string): Ingredient | undefined {
    return allIngredients.find((i) => i.canonical_name === canonicalName);
  }

  // Quick add trending ingredient
  function quickAddIngredient(name: string) {
    const ingredient = allIngredients.find(
      (i) => i.canonical_name === name || i.display_name?.en?.toLowerCase() === name.toLowerCase()
    );
    if (ingredient && !selectedIngredients.includes(ingredient.canonical_name)) {
      addIngredient(ingredient.canonical_name);
    }
  }

  // Toggle favorite
  function toggleFavorite(recipeId: string) {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
    }
    setFavorites(newFavorites);
  }

  // Format rating display
  function formatRating(rating: number | null | undefined, count: number | null | undefined) {
    if (rating === null || rating === undefined) {
      return null;
    }
    return (
      <div className="flex items-center gap-0.5">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
        {count && count > 0 && (
          <span className="text-xs text-neutral-500">({count})</span>
        )}
      </div>
    );
  }

  // Format duration
  function formatDuration(prep?: number, cook?: number) {
    const parts: string[] = [];
    if (prep) parts.push(`${prep}min prep`);
    if (cook) parts.push(`${cook}min cook`);
    if (parts.length === 0) return null;
    return (
      <div className="flex items-center gap-1 text-xs text-neutral-500">
        <Clock className="h-3 w-3" />
        <span>{parts.join(" | ")}</span>
      </div>
    );
  }

  // Get category info
  function getCategoryInfo(categoryId: string) {
    return INGREDIENT_CATEGORIES.find((c) => c.id === categoryId);
  }

  // Visible categories (only those with ingredients)
  const visibleCategories = useMemo(() => {
    return INGREDIENT_CATEGORIES.filter((cat) => {
      if (activeCategory) return cat.id === activeCategory;
      const categoryIngredients = allIngredients.filter((i) => i.category === cat.id);
      return categoryIngredients.length > 0;
    });
  }, [allIngredients, activeCategory]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-sm font-bold text-neutral-900 hover:text-recette-600">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={selectedIngredients.length === 0 
                    ? "Search for ingredients... (e.g., chicken, tomato, pasta)" 
                    : `Find recipes with ${selectedIngredients.join(", ")}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (selectedIngredients.length > 0) {
                      setActiveCategory(null);
                    }
                  }}
                  className="block w-full rounded-full border-0 bg-neutral-100 py-2 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-recette-500 focus:outline-none"
                />
                {selectedIngredients.length > 0 && (
                  <button
                    onClick={clearAllIngredients}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showAvailability && userLocation && (
                <button
                  onClick={() => setShowAvailability(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Hide Stores
                </button>
              )}
              {showAvailability && !userLocation && (
                <button
                  onClick={requestLocation}
                  className="inline-flex items-center gap-1.5 rounded-full border border-recette-600 bg-recette-50 px-3 py-1.5 text-xs font-semibold text-recette-700 hover:bg-recette-100"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Enable Location
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Selected Ingredients */}
        {selectedIngredients.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-neutral-800">
                Selected Ingredients ({selectedIngredients.length})
              </h2>
              <button
                onClick={clearAllIngredients}
                className="text-xs text-neutral-500 hover:text-recette-600"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ingredientName) => {
                const ingredient = getIngredientByName(ingredientName);
                const category = getCategoryInfo(ingredient?.category ?? "miscellaneous");
                return (
                  <span
                    key={ingredientName}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 border-${CATEGORY_COLORS[ingredient?.category ?? "miscellaneous"]?.split(" ")[0].replace("bg-", "").replace("text-", "")}-200 px-3 py-1.5 text-xs font-semibold ${CATEGORY_COLORS[ingredient?.category ?? "miscellaneous"]}`}
                  >
                    {category?.icon}
                    <span>{ingredient?.display_name?.en ?? ingredientName}</span>
                    <button
                      onClick={() => removeIngredient(ingredientName)}
                      className="ml-1 rounded-full p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setShowAvailability(!showAvailability)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  showAvailability
                    ? "bg-recette-600 text-white"
                    : "border border-recette-600 text-recette-700 hover:bg-recette-50"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {showAvailability ? "Hide" : "Show"} Nearby Stores
              </button>
            </div>
          </div>
        )}

        {/* Ingredient Selection / Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Ingredient Browser */}
          <aside className="lg:col-span-1">
            {loading ? (
              <div className="flex h-96 items-center justify-center text-neutral-500">
                <Sparkles className="h-5 w-5 animate-spin" />
                <span className="ml-2">Loading ingredients...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Trending Section */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Trending Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {TRENDING_SEARCHES.map((name) => {
                      const ingredient = allIngredients.find(
                        (i) => i.canonical_name === name || i.display_name?.en?.toLowerCase() === name.toLowerCase()
                      );
                      if (!ingredient) return null;
                      return (
                        <button
                          key={name}
                          onClick={() => quickAddIngredient(name)}
                          disabled={selectedIngredients.includes(ingredient.canonical_name)}
                          className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:border-recette-300 hover:bg-recette-50 hover:text-recette-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>{ingredient.display_name?.en ?? name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Browse by Category
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                          activeCategory === cat.id
                            ? `bg-${cat.color}-100 text-${cat.color}-800`
                            : "border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ingredients List */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    {activeCategory 
                      ? `Ingredients in ${getCategoryInfo(activeCategory)?.label ?? activeCategory}`
                      : "All Ingredients"}
                    {filteredIngredients.length > 0 && (
                      <span className="ml-1 text-xs text-neutral-400">
                        ({filteredIngredients.length})
                      </span>
                    )}
                  </h3>

                  {filteredIngredients.length === 0 ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
                      <Search className="mx-auto h-8 w-8 text-neutral-300" />
                      <p className="mt-2 text-sm">No ingredients found</p>
                      {searchQuery && (
                        <p className="mt-1 text-xs">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(ingredientsByCategory).map(([category, ingredients]) => {
                        const categoryInfo = getCategoryInfo(category);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-semibold text-neutral-700">
                                {categoryInfo?.icon} {categoryInfo?.label ?? category}
                              </h4>
                              <span className="text-xs text-neutral-400">
                                ({ingredients.length})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {ingredients.map((ingredient) => (
                                <button
                                  key={ingredient.id}
                                  onClick={() => addIngredient(ingredient.canonical_name)}
                                  className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:border-recette-300 hover:bg-recette-50 hover:text-recette-700"
                                >
                                  {ingredient.is_common && (
                                    <Fire className="h-3 w-3 text-amber-500" />
                                  )}
                                  <span>{ingredient.display_name?.en ?? ingredient.canonical_name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Center: Recipe Results */}
          <div className="lg:col-span-2">
            {selectedIngredients.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-recette-50">
                  <Search className="h-10 w-10 text-recette-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-neutral-900">
                  Find Recipes by Ingredients
                </h2>
                <p className="mb-4 text-sm text-neutral-600">
                  Select ingredients you have or want to use, and we'll show you recipes that match.
                </p>
                <p className="text-xs text-neutral-500">
                  Like Supercook - just select what you have in your kitchen!
                </p>

                {/* Quick Start Buttons */}
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => quickAddIngredient("chicken")}
                    className="rounded-full border border-recette-200 bg-recette-50 px-4 py-2 text-sm font-medium text-recette-700 hover:bg-recette-100"
                  >
                    Chicken
                  </button>
                  <button
                    onClick={() => quickAddIngredient("beef")}
                    className="rounded-full border border-recette-200 bg-recette-50 px-4 py-2 text-sm font-medium text-recette-700 hover:bg-recette-100"
                  >
                    Beef
                  </button>
                  <button
                    onClick={() => quickAddIngredient("pasta")}
                    className="rounded-full border border-recette-200 bg-recette-50 px-4 py-2 text-sm font-medium text-recette-700 hover:bg-recette-100"
                  >
                    Pasta
                  </button>
                  <button
                    onClick={() => quickAddIngredient("tomato")}
                    className="rounded-full border border-recette-200 bg-recette-50 px-4 py-2 text-sm font-medium text-recette-700 hover:bg-recette-100"
                  >
                    Tomato
                  </button>
                  <button
                    onClick={() => quickAddIngredient("egg")}
                    className="rounded-full border border-recette-200 bg-recette-50 px-4 py-2 text-sm font-medium text-recette-700 hover:bg-recette-100"
                  >
                    Egg
                  </button>
                </div>
              </div>
            ) : searching ? (
              <div className="flex h-96 items-center justify-center text-neutral-500">
                <Sparkles className="h-6 w-6 animate-spin" />
                <span className="ml-2">Searching for recipes...</span>
              </div>
            ) : recipes.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                  <Search className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-amber-800">
                  No Recipes Found
                </h2>
                <p className="mb-4 text-sm text-amber-700">
                  We couldn't find any recipes with the selected ingredients.
                </p>
                <p className="text-xs text-amber-600">
                  Try adding more ingredients or removing some to broaden your search.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      {recipes.length} Recipe{recipes.length !== 1 ? "s" : ""} Found
                    </h2>
                    <p className="text-sm text-neutral-500">
                      matching your selected ingredients
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      Sort by: Relevance
                    </span>
                  </div>
                </div>

                {/* Recipe Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {recipes.map((recipe) => {
                    const isFavorited = favorites.has(recipe.recipe_id);
                    const matchPercentage = 
                      recipe.ingredient_match_count / recipe.total_ingredients;

                    return (
                      <Link
                        key={recipe.recipe_id}
                        href={`/recipes/${recipe.slug}`}
                        className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-lg"
                      >
                        {/* Recipe Image */}
                        <div className="relative aspect-video bg-neutral-100">
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title.en}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-recette-100 to-recette-50">
                              <Tag className="h-12 w-12 text-recette-600 opacity-50" />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute left-3 top-3 flex gap-1.5">
                            {recipe.difficulty && (
                              <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-neutral-700 backdrop-blur">
                                {recipe.difficulty}
                              </span>
                            )}
                            {recipe.meal_type && (
                              <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-neutral-700 backdrop-blur">
                                {recipe.meal_type}
                              </span>
                            )}
                          </div>

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(recipe.recipe_id);
                            }}
                            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-neutral-600 hover:bg-white hover:text-recette-600 backdrop-blur transition"
                          >
                            <Heart
                              className={`h-5 w-5 ${isFavorited ? "fill-recette-600 text-recette-600" : ""}`}
                            />
                          </button>

                          {/* Match Badge */}
                          <div className="absolute bottom-3 left-3 rounded-full bg-recette-600 px-2 py-1 text-xs font-bold text-white">
                            {recipe.ingredient_match_count}/{recipe.total_ingredients} match
                          </div>
                        </div>

                        {/* Recipe Info */}
                        <div className="p-4">
                          <h3 className="mb-1 font-semibold text-neutral-900 line-clamp-1">
                            {recipe.title.en}
                          </h3>

                          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {formatRating(recipe.rating, recipe.rating_count)}
                            {formatDuration(recipe.prep_time_minutes, recipe.cook_time_minutes)}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <Users className="h-3.5 w-3.5" />
                              <span>{recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}</span>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-recette-600" />
                          </div>

                          {/* Missing Ingredients */}
                          {recipe.missing_ingredients_count > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>
                                Missing {recipe.missing_ingredients_count} ingredient{recipe.missing_ingredients_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Availability Panel (when enabled) */}
        {showAvailability && (
          <div className="mt-8 rounded-xl border border-recette-200 bg-recette-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-recette-800">
                Available at Nearby Stores
              </h2>
              {userLocation && (
                <button
                  onClick={requestLocation}
                  className="text-xs text-recette-600 hover:text-recette-800"
                >
                  Refresh Location
                </button>
              )}
            </div>

            {availability.length === 0 ? (
              <div className="rounded-xl border border-recette-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-recette-100">
                  <ShoppingCart className="h-6 w-6 text-recette-400" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-recette-800">
                  {userLocation ? "No stores found nearby" : "Enable location to see nearby stores"}
                </h3>
                <p className="text-xs text-recette-600">
                  {userLocation 
                    ? "Try expanding your search radius or check back later." 
                    : "We need your location to show which supermarkets have these ingredients."}
                </p>
                {!userLocation && (
                  <button
                    onClick={requestLocation}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-recette-600 px-4 py-2 text-xs font-bold text-white hover:bg-recette-700"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Enable Location
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {availability.map((supermarket) => (
                  <div
                    key={supermarket.supermarket_id}
                    className="rounded-xl border border-recette-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900">
                            {supermarket.supermarket_name?.en ?? "Unknown Supermarket"}
                          </h3>
                          {supermarket.distance_meters && (
                            <span className="text-xs text-recette-600">
                              {(supermarket.distance_meters / 1000).toFixed(1)} km away
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>
                            {supermarket.ingredient_count} of {selectedIngredients.length} ingredients
                          </span>
                        </div>

                        {/* Available Ingredients */}
                        <div className="flex flex-wrap gap-1.5">
                          {supermarket.available_ingredients.map((item) => (
                            <span
                              key={item.ingredient}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {item.ingredient} (€{item.price.toFixed(2)})
                            </span>
                          ))}
                        </div>

                        {/* Missing Ingredients */}
                        {supermarket.missing_ingredients.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {supermarket.missing_ingredients.map((item) => (
                              <span
                                key={item.ingredient}
                                className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                              >
                                <XCircle className="h-3 w-3" />
                                {item.ingredient}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-recette-700">
                            Total: €{supermarket.total_price.toFixed(2)}
                          </span>
                          <Link
                            href={`/supermarkets/${supermarket.supermarket_id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-recette-600 px-3 py-1.5 text-xs font-semibold text-recette-700 hover:bg-recette-50"
                          >
                            View Store
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Price Comparison */}
                      {availability.length > 1 && supermarket.total_price > 0 && (
                        <div className="ml-4 flex items-center">
                          {supermarket.total_price === Math.min(...availability.map((a) => a.total_price)) && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                              Best Price
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-neutral-500">
        <p>
          Supercook-style ingredient search | Select ingredients to find matching recipes
        </p>
      </footer>
    </div>
  );
}
