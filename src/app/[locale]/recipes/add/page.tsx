"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Clock,
  Users,
  Flame,
  Tag,
  Image as ImageIcon,
  Link as LinkIcon,
  ChefHat,
  Trash2,
  Loader2,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Ingredient, NewRecipeFormData, RecipeIngredientSuggestion } from "@/lib/types";

// Mock ingredients for local development
const mockIngredients: Ingredient[] = [
  { id: "i-1", canonical_name: "chicken", display_name: { en: "Chicken", es: "Pollo" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-2", canonical_name: "beef", display_name: { en: "Beef", es: "Carne de res" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-3", canonical_name: "pork", display_name: { en: "Pork", es: "Cerdo" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-4", canonical_name: "fish", display_name: { en: "Fish", es: "Pescado" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-5", canonical_name: "shrimp", display_name: { en: "Shrimp", es: "Camarones" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-6", canonical_name: "tomato", display_name: { en: "Tomato", es: "Tomate" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-7", canonical_name: "onion", display_name: { en: "Onion", es: "Cebolla" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-8", canonical_name: "garlic", display_name: { en: "Garlic", es: "Ajo" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-9", canonical_name: "carrot", display_name: { en: "Carrot", es: "Zanahoria" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-10", canonical_name: "potato", display_name: { en: "Potato", es: "Papa" }, category: "vegetable", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-11", canonical_name: "spaghetti", display_name: { en: "Spaghetti", es: "Espaguetis" }, category: "grain", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-12", canonical_name: "rice", display_name: { en: "Rice", es: "Arroz" }, category: "grain", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-13", canonical_name: "flour", display_name: { en: "Flour", es: "Harina" }, category: "grain", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-14", canonical_name: "egg", display_name: { en: "Egg", es: "Huevo" }, category: "protein", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-15", canonical_name: "milk", display_name: { en: "Milk", es: "Leche" }, category: "dairy", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-16", canonical_name: "cheese", display_name: { en: "Cheese", es: "Queso" }, category: "dairy", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-17", canonical_name: "butter", display_name: { en: "Butter", es: "Mantequilla" }, category: "dairy", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-18", canonical_name: "olive oil", display_name: { en: "Olive Oil", es: "Aceite de oliva" }, category: "oil", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-19", canonical_name: "salt", display_name: { en: "Salt", es: "Sal" }, category: "spice", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "i-20", canonical_name: "pepper", display_name: { en: "Pepper", es: "Pimienta" }, category: "spice", is_common: true, is_basic: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const cuisines = [
  "Italian", "Mexican", "American", "French", "Asian", "Chinese", "Indian", "Japanese", "Mediterranean", "Greek", "Spanish", "Thai", "Vietnamese",
];

const mealTypes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snack" },
  { value: "appetizer", label: "Appetizer" },
  { value: "drink", label: "Drink" },
];

const difficulties = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

const dietaryTags = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "keto",
  "low-carb",
  "paleo",
  "halal",
  "kosher",
];

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// YouTube URL validation and extraction
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  if (url.startsWith("https://www.youtube.com/embed/")) {
    return url.split("/embed/")[1];
  }
  
  if (url.startsWith("https://youtu.be/")) {
    return url.split("/")[3];
  }
  
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

export default function AddRecipePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale] = useState<"en" | "es">("en");
  
  // Form state
  const [formData, setFormData] = useState<NewRecipeFormData>({
    title: { en: "", es: "" },
    slug: "",
    description: { en: "", es: "" },
    instructions: [],
    prep_time_minutes: null,
    cook_time_minutes: null,
    servings: undefined,
    difficulty: null,
    image_url: "",
    video_url: "",
    cuisine: "",
    meal_type: null,
    dietary_tags: [],
    published: true,
    ingredients: [],
  });
  
  // Ingredients state
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] = useState("");
  const [newIngredientNotes, setNewIngredientNotes] = useState("");
  
  // Instruction state
  const [newInstruction, setNewInstruction] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "ingredients" | "instructions" | "media">("basic");
  
  // Fetch ingredients
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAllIngredients(mockIngredients);
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
  
  // Filter ingredients for autocomplete
  useEffect(() => {
    if (!ingredientSearch) {
      setFilteredIngredients([]);
      return;
    }
    
    const query = ingredientSearch.toLowerCase();
    const filtered = allIngredients.filter(
      (i) =>
        i.canonical_name.toLowerCase().includes(query) ||
        i.display_name?.en?.toLowerCase().includes(query) ||
        i.display_name?.es?.toLowerCase().includes(query)
    );
    setFilteredIngredients(filtered);
    setShowIngredientDropdown(filtered.length > 0);
  }, [ingredientSearch, allIngredients]);
  
  // Update slug when title changes
  useEffect(() => {
    if (formData.title.en) {
      const slug = generateSlug(formData.title.en);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title.en]);
  
  // Handle ingredient selection
  const handleSelectIngredient = (ingredient: Ingredient) => {
    setIngredientSearch("");
    setSelectedIngredient(ingredient.canonical_name);
    setShowIngredientDropdown(false);
  };
  
  // Add ingredient to recipe
  const addIngredient = () => {
    if (!selectedIngredient) return;
    
    const existingIndex = formData.ingredients?.findIndex(
      (i) => i.ingredient_id === selectedIngredient
    );
    
    if (existingIndex !== -1 && existingIndex !== undefined && formData.ingredients) {
      // Update existing ingredient
      const updated = [...formData.ingredients];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newIngredientQuantity ? parseFloat(newIngredientQuantity) : null,
        unit: newIngredientUnit || null,
        notes: newIngredientNotes || null,
      };
      setFormData({ ...formData, ingredients: updated });
    } else {
      // Add new ingredient
      const newIngredients = formData.ingredients || [];
      newIngredients.push({
        ingredient_id: selectedIngredient,
        quantity: newIngredientQuantity ? parseFloat(newIngredientQuantity) : null,
        unit: newIngredientUnit || null,
        notes: newIngredientNotes || null,
        position: newIngredients.length + 1,
      });
      setFormData({ ...formData, ingredients: newIngredients });
    }
    
    // Reset
    setSelectedIngredient("");
    setIngredientSearch("");
    setNewIngredientQuantity("");
    setNewIngredientUnit("");
    setNewIngredientNotes("");
  };
  
  // Remove ingredient
  const removeIngredient = (index: number) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: newIngredients });
  };
  
  // Add instruction
  const addInstruction = () => {
    if (!newInstruction.trim()) return;
    
    const newInstructions = formData.instructions || [];
    newInstructions.push(newInstruction);
    setFormData({ ...formData, instructions: newInstructions });
    setNewInstruction("");
  };
  
  // Remove instruction
  const removeInstruction = (index: number) => {
    const newInstructions = [...(formData.instructions || [])];
    newInstructions.splice(index, 1);
    setFormData({ ...formData, instructions: newInstructions });
  };
  
  // Update instruction
  const updateInstruction = (index: number, text: string) => {
    const newInstructions = [...(formData.instructions || [])];
    newInstructions[index] = text;
    setFormData({ ...formData, instructions: newInstructions });
  };
  
  // Update ingredient field
  const updateIngredientField = (
    index: number,
    field: "quantity" | "unit" | "notes",
    value: string
  ) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: field === "quantity" ? (value ? parseFloat(value) : null) : (value || null),
    };
    setFormData({ ...formData, ingredients: newIngredients });
  };
  
  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    if (url) {
      // Check if it's a direct image URL or needs validation
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };
  
  // Handle form field change
  const handleChange = (field: keyof NewRecipeFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Handle translatable field change
  const handleTranslatableChange = (field: "title" | "description", lang: "en" | "es", value: string) => {
    setFormData({
      ...formData,
      [field]: { ...formData[field], [lang]: value },
    });
  };
  
  // Handle dietary tags toggle
  const toggleDietaryTag = (tag: string) => {
    const tags = formData.dietary_tags || [];
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setFormData({ ...formData, dietary_tags: newTags });
  };
  
  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.title?.en?.trim()) {
      errors.push("English title is required");
    }
    
    if (!formData.slug?.trim()) {
      errors.push("Slug is required");
    }
    
    if (!formData.instructions || formData.instructions.length === 0) {
      errors.push("At least one instruction is required");
    }
    
    if (!formData.ingredients || formData.ingredients.length === 0) {
      errors.push("At least one ingredient is required");
    }
    
    if (formData.prep_time_minutes !== null && formData.prep_time_minutes !== undefined && formData.prep_time_minutes < 0) {
      errors.push("Prep time cannot be negative");
    }
    
    if (formData.cook_time_minutes !== null && formData.cook_time_minutes !== undefined && formData.cook_time_minutes < 0) {
      errors.push("Cook time cannot be negative");
    }
    
    if (formData.servings !== null && formData.servings !== undefined && formData.servings <= 0) {
      errors.push("Servings must be greater than 0");
    }
    
    // Validate YouTube URL if provided
    if (formData.video_url && !extractYouTubeId(formData.video_url)) {
      errors.push("Invalid YouTube URL format");
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const sb = getSupabaseBrowserClient();
      const { data: { user }, error: userError } = await sb.auth.getUser();
      
      if (userError || !user) {
        setError("You must be signed in to add a recipe");
        setSubmitting(false);
        return;
      }
      
      // Prepare data for API
      const submitData = {
        ...formData,
        author_id: user.id,
        // Ensure ingredients have proper IDs
        ingredients: formData.ingredients?.map((ing) => {
          // Look up the ingredient ID from canonical name
          const ingredient = allIngredients.find((i) => i.canonical_name === ing.ingredient_id);
          return {
            ...ing,
            ingredient_id: ingredient?.id || ing.ingredient_id,
          };
        }),
      };
      
      // Submit to API
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess("Recipe added successfully!");
        // Redirect to recipe detail page
        setTimeout(() => {
          router.push(`/${locale}/recipes/${data.slug}`);
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add recipe");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Recipe submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get ingredient name from ID
  const getIngredientName = (ingredientId: string): string => {
    const ingredient = allIngredients.find((i) => i.id === ingredientId || i.canonical_name === ingredientId);
    return ingredient?.display_name?.en || ingredient?.canonical_name || ingredientId;
  };
  
  // Check if form is dirty for save reminder
  const isFormDirty = useMemo(() => {
    return (
      formData.title.en !== "" ||
      formData.title.es !== "" ||
      formData.description?.en !== "" ||
      formData.description?.es !== "" ||
      (formData.instructions?.length || 0) > 0 ||
      (formData.ingredients?.length || 0) > 0 ||
      formData.image_url !== "" ||
      formData.video_url !== ""
    );
  }, [formData]);
  
  // Memoize for performance
  const memoizedIngredients = useMemo(() => formData.ingredients || [], [formData.ingredients]);
  const memoizedInstructions = useMemo(() => formData.instructions || [], [formData.instructions]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-neutral-900">Add New Recipe</h1>
            <p className="text-neutral-600 mt-1">
              Share your favorite recipe with the sucre et sel community
            </p>
          </div>
          <Link
            href={`/${locale}/recipes`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      {/* Progress / Tabs */}
      <div className="flex gap-1 mb-8">
        {[
          { id: "basic", label: "Basic Info" },
          { id: "ingredients", label: "Ingredients" },
          { id: "instructions", label: "Instructions" },
          { id: "media", label: "Media" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-barn-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
          {success}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Recipe Title</label>
                <span className="text-red-500">*</span>
              </div>
              <p className="text-sm text-neutral-500">
                Give your recipe a clear, descriptive title
              </p>
              
              {/* English Title */}
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">
                  English <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title.en}
                  onChange={(e) => handleTranslatableChange("title", "en", e.target.value)}
                  placeholder="e.g., Spaghetti Bolognese"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                />
              </div>
              
              {/* Spanish Title */}
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">
                  Spanish (optional)
                </label>
                <input
                  type="text"
                  value={formData.title.es}
                  onChange={(e) => handleTranslatableChange("title", "es", e.target.value)}
                  placeholder="e.g., Espaguetis a la boloñesa"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                />
              </div>
              
              {/* Slug */}
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-neutral-100 rounded-lg text-neutral-500 text-sm">
                    myrecette.com/{locale}/recipes/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="spaghetti-bolognese"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Description</label>
              </div>
              <p className="text-sm text-neutral-500">
                Describe your recipe to entice others to try it
              </p>
              
              {/* English Description */}
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">
                  English
                </label>
                <textarea
                  value={formData.description?.en || ""}
                  onChange={(e) => handleTranslatableChange("description", "en", e.target.value)}
                  placeholder="e.g., A classic Italian pasta dish with rich meat sauce..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors resize-none"
                />
              </div>
              
              {/* Spanish Description */}
              <div className="space-y-1">
                <label className="text-sm text-neutral-600">
                  Spanish (optional)
                </label>
                <textarea
                  value={formData.description?.es || ""}
                  onChange={(e) => handleTranslatableChange("description", "es", e.target.value)}
                  placeholder="e.g., Un clásico plato italiano de pasta con rica salsa de carne..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors resize-none"
                />
              </div>
            </div>
            
            {/* Recipe Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prep Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Prep Time</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.prep_time_minutes || ""}
                    onChange={(e) => handleChange("prep_time_minutes", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                    min="0"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                  <span className="px-3 py-2.5 bg-neutral-100 rounded-lg text-neutral-600 text-sm">
                    minutes
                  </span>
                </div>
              </div>
              
              {/* Cook Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Cook Time</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.cook_time_minutes || ""}
                    onChange={(e) => handleChange("cook_time_minutes", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                    min="0"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                  <span className="px-3 py-2.5 bg-neutral-100 rounded-lg text-neutral-600 text-sm">
                    minutes
                  </span>
                </div>
              </div>
              
              {/* Servings */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Servings</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.servings || ""}
                    onChange={(e) => handleChange("servings", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                    min="1"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                  <span className="px-3 py-2.5 bg-neutral-100 rounded-lg text-neutral-600 text-sm">
                    people
                  </span>
                </div>
              </div>
              
              {/* Difficulty */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Difficulty</label>
                </div>
                <select
                  value={formData.difficulty || ""}
                  onChange={(e) => handleChange("difficulty", e.target.value || null)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                >
                  <option value="">Select difficulty</option>
                  {difficulties.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Cuisine */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Cuisine</label>
                </div>
                <select
                  value={formData.cuisine || ""}
                  onChange={(e) => handleChange("cuisine", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                >
                  <option value="">Select cuisine</option>
                  {cuisines.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              {/* Meal Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-barn-600" />
                  <label className="font-semibold text-neutral-900">Meal Type</label>
                </div>
                <select
                  value={formData.meal_type || ""}
                  onChange={(e) => handleChange("meal_type", e.target.value || null)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                >
                  <option value="">Select meal type</option>
                  {mealTypes.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Dietary Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Dietary Tags</label>
              </div>
              <p className="text-sm text-neutral-500">
                Select any dietary restrictions or preferences
              </p>
              <div className="flex flex-wrap gap-2">
                {dietaryTags.map((tag) => {
                  const isSelected = formData.dietary_tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-barn-600 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Publish Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published !== false}
                  onChange={(e) => handleChange("published", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-barn-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-barn-600"></div>
              </label>
              <span className="text-sm text-neutral-700">
                Publish recipe immediately
              </span>
            </div>
          </div>
        )}
        
        {/* Ingredients Tab */}
        {activeTab === "ingredients" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Ingredients</label>
                <span className="text-red-500">*</span>
              </div>
              <p className="text-sm text-neutral-500">
                Add all ingredients needed for this recipe
              </p>
            </div>
            
            {/* Add Ingredient */}
            <div className="space-y-4 p-4 rounded-xl border border-neutral-200">
              <h4 className="font-semibold text-neutral-900">Add Ingredient</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Ingredient Search */}
                <div className="relative">
                  <label className="block text-sm text-neutral-600 mb-1">
                    Ingredient <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    onFocus={() => setShowIngredientDropdown(filteredIngredients.length > 0)}
                    placeholder="Search ingredients..."
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                  
                  {/* Ingredient Suggestions */}
                  {showIngredientDropdown && filteredIngredients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-10 max-h-60 overflow-y-auto">
                      {filteredIngredients.slice(0, 10).map((ingredient) => (
                        <button
                          key={ingredient.id}
                          type="button"
                          onClick={() => handleSelectIngredient(ingredient)}
                          className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                        >
                          <span className="text-lg">{ingredient.display_name?.en || ingredient.canonical_name}</span>
                          <span className="text-xs text-neutral-500 capitalized">{ingredient.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Quantity */}
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Quantity (optional)
                  </label>
                  <input
                    type="text"
                    value={newIngredientQuantity}
                    onChange={(e) => setNewIngredientQuantity(e.target.value)}
                    placeholder="1, 200, 1.5"
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                </div>
                
                {/* Unit */}
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Unit (optional)
                  </label>
                  <select
                    value={newIngredientUnit}
                    onChange={(e) => setNewIngredientUnit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  >
                    <option value="">None</option>
                    <option value="g">grams</option>
                    <option value="kg">kilograms</option>
                    <option value="oz">ounces</option>
                    <option value="lb">pounds</option>
                    <option value="ml">milliliters</option>
                    <option value="l">liters</option>
                    <option value="cup">cups</option>
                    <option value="tbsp">tablespoons</option>
                    <option value="tsp">teaspoons</option>
                    <option value="piece">pieces</option>
                    <option value="slice">slices</option>
                    <option value="can">cans</option>
                    <option value="bunch">bunches</option>
                  </select>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={newIngredientNotes}
                    onChange={(e) => setNewIngredientNotes(e.target.value)}
                    placeholder="chopped, diced, etc."
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addIngredient}
                disabled={!selectedIngredient}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 disabled:opacity-50 font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Ingredient
              </button>
            </div>
            
            {/* Ingredient List */}
            {memoizedIngredients.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-neutral-900">
                  Recipe Ingredients ({memoizedIngredients.length})
                </h4>
                
                <div className="space-y-3">
                  {memoizedIngredients.map((ing, index) => {
                    const name = allIngredients.find(
                      (i) => i.id === ing.ingredient_id || i.canonical_name === ing.ingredient_id
                    )?.display_name?.en || ing.ingredient_id;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{name}</p>
                          <p className="text-sm text-neutral-500">
                            {ing.quantity && `${ing.quantity} ${ing.unit || ""}`}
                            {ing.notes && `, ${ing.notes}`}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {memoizedIngredients.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <ChefHat className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
                <p>No ingredients added yet</p>
              </div>
            )}
          </div>
        )}
        
        {/* Instructions Tab */}
        {activeTab === "instructions" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Instructions</label>
                <span className="text-red-500">*</span>
              </div>
              <p className="text-sm text-neutral-500">
                Add step-by-step instructions for making this recipe
              </p>
            </div>
            
            {/* Add Instruction */}
            <div className="space-y-4 p-4 rounded-xl border border-neutral-200">
              <h4 className="font-semibold text-neutral-900">Add Instruction Step</h4>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder={`e.g., Heat olive oil in a large pan over medium heat...`}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addInstruction();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addInstruction}
                  disabled={!newInstruction.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-barn-600 text-white hover:bg-barn-700 disabled:opacity-50 font-semibold transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
            
            {/* Instruction List */}
            {memoizedInstructions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-neutral-900">
                  Recipe Steps ({memoizedInstructions.length})
                </h4>
                
                <div className="space-y-3">
                  {memoizedInstructions.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-barn-600 text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-neutral-700">{step}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {memoizedInstructions.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <LinkIcon className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
                <p>No instructions added yet</p>
              </div>
            )}
          </div>
        )}
        
        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="space-y-6">
            {/* Image */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Recipe Image</label>
              </div>
              <p className="text-sm text-neutral-500">
                Add a photo of your finished dish
              </p>
              
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-neutral-300 bg-neutral-50">
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Recipe preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleImageUrlChange("");
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                      <ImageIcon className="h-10 w-10 mb-2" />
                      <p className="text-sm">Add image URL</p>
                    </div>
                  )}
                </div>
                
                <input
                  type="url"
                  value={formData.image_url || ""}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                />
              </div>
            </div>
            
            {/* Video */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-barn-600" />
                <label className="font-semibold text-neutral-900">Video Tutorial</label>
              </div>
              <p className="text-sm text-neutral-500">
                Add a YouTube video showing how to make this recipe
              </p>
              
              <div className="space-y-3">
                {formData.video_url && getYouTubeEmbedUrl(formData.video_url) && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(formData.video_url)!}
                      title="Recipe video preview"
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <button
                      type="button"
                      onClick={() => handleChange("video_url", "")}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                <input
                  type="url"
                  value={formData.video_url || ""}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-barn-500 focus:border-barn-500 outline-none transition-colors"
                />
                {formData.video_url && !getYouTubeEmbedUrl(formData.video_url) && (
                  <p className="text-sm text-amber-600">Invalid YouTube URL format</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button (fixed at bottom) */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-neutral-200 py-4 -mx-4 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              {isFormDirty && (
                <p className="text-sm text-neutral-500">
                  {memoizedIngredients.length} ingredients, {memoizedInstructions.length} steps
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-barn-600 text-white hover:bg-barn-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Publish Recipe
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Add useMemo import
import { useMemo } from "react";
