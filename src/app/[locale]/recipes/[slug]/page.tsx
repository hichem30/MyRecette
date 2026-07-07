"use client";

import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { useState } from "react";
import {
  Clock,
  Heart,
  Star,
  Users,
  ShoppingCart,
  MessageSquare,
  Share2,
  CheckCircle,
  XCircle,
  PlayCircle,
  MapPin,
  Tag,
  ChefHat,
  Flame,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Recipe, RecipeComment, Ingredient, SupermarketIngredientAvailability, RecipeVideo } from "@/lib/types";
import { VideoList } from "@/components/VideoList";
import { SocialShare } from "@/components/SocialShare";
import { VideoEmbed } from "@/components/VideoEmbed/VideoEmbed";
import { RecipeCommunityTabs } from "@/components/RecipeCommunityTabs/RecipeCommunityTabs";

// Mock data for local development
const mockRecipe: Recipe = {
  id: "r-1",
  title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
  slug: "spaghetti-bolognese",
  description: {
    en: "A classic Italian pasta dish with rich meat sauce, perfect for family dinners.",
    es: "Un clásico plato italiano de pasta con rica salsa de carne, perfecto para cenas familiares.",
  },
  author_id: "user-1",
  instructions: [
    { step: 1, text: { en: "Heat olive oil in a large pan over medium heat.", es: "Calienta el aceite de oliva en una sartén grande a fuego medio." } },
    { step: 2, text: { en: "Add minced beef and cook until browned.", es: "Añade la carne picada y cocina hasta que se dore." } },
    { step: 3, text: { en: "Stir in onions, carrots, and celery. Cook for 5 minutes.", es: "Añade cebollas, zanahorias y apio. Cocina por 5 minutos." } },
    { step: 4, text: { en: "Add tomato sauce, salt, and pepper. Simmer for 30 minutes.", es: "Añade la salsa de tomate, sal y pimienta. Cocina a fuego lento por 30 minutos." } },
    { step: 5, text: { en: "Cook spaghetti according to package instructions. Drain and serve with sauce.", es: "Cocina los espaguetis según las instrucciones del paquete. Escurre y sirve con la salsa." } },
  ],
  prep_time_minutes: 15,
  cook_time_minutes: 45,
  servings: 4,
  difficulty: "medium",
  image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
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
  author: {
    id: "user-1",
    email: "chef@myrecette.com",
    supermarket_name: null,
  },
  ingredients: [
    {
      id: "ri-1",
      recipe_id: "r-1",
      ingredient_id: "i-spaghetti",
      ingredient: {
        id: "i-spaghetti",
        canonical_name: "spaghetti",
        display_name: { en: "Spaghetti", es: "Espaguetis" },
        category: "grain",
        is_common: true,
        is_basic: true,
      },
      quantity: 400,
      unit: "g",
      notes: null,
      position: 1,
      created_at: "2024-01-10T09:00:00Z",
    },
    {
      id: "ri-2",
      recipe_id: "r-1",
      ingredient_id: "i-ground-beef",
      ingredient: {
        id: "i-ground-beef",
        canonical_name: "ground beef",
        display_name: { en: "Ground Beef", es: "Carne molida" },
        category: "protein",
        is_common: true,
        is_basic: true,
      },
      quantity: 500,
      unit: "g",
      notes: null,
      position: 2,
      created_at: "2024-01-10T09:00:00Z",
    },
    {
      id: "ri-3",
      recipe_id: "r-1",
      ingredient_id: "i-onion",
      ingredient: {
        id: "i-onion",
        canonical_name: "onion",
        display_name: { en: "Onion", es: "Cebolla" },
        category: "vegetable",
        is_common: true,
        is_basic: true,
      },
      quantity: 1,
      unit: null,
      notes: "finely chopped",
      position: 3,
      created_at: "2024-01-10T09:00:00Z",
    },
    {
      id: "ri-4",
      recipe_id: "r-1",
      ingredient_id: "i-carrot",
      ingredient: {
        id: "i-carrot",
        canonical_name: "carrot",
        display_name: { en: "Carrot", es: "Zanahoria" },
        category: "vegetable",
        is_common: true,
        is_basic: true,
      },
      quantity: 1,
      unit: null,
      notes: null,
      position: 4,
      created_at: "2024-01-10T09:00:00Z",
    },
    {
      id: "ri-5",
      recipe_id: "r-1",
      ingredient_id: "i-tomato",
      ingredient: {
        id: "i-tomato",
        canonical_name: "tomato",
        display_name: { en: "Tomato", es: "Tomate" },
        category: "vegetable",
        is_common: true,
        is_basic: true,
      },
      quantity: 400,
      unit: "g",
      notes: "crushed",
      position: 5,
      created_at: "2024-01-10T09:00:00Z",
    },
  ],
  comments: [],
  is_favorited: false,
  video_count: 2,
  videos: [
    {
      id: "v-1",
      recipe_id: "r-1",
      user_id: "user-2",
      platform: "youtube",
      video_url: "https://www.youtube.com/watch?v=3a0v8W1Tn9k",
      youtube_video_id: "3a0v8W1Tn9k",
      thumbnail_url: "https://img.youtube.com/vi/3a0v8W1Tn9k/mqdefault.jpg",
      title: { en: "Spaghetti Bolognese - My Home Version", es: "Espaguetis a la boloñesa - Mi versión casera" },
      description: { en: "Here's how I make this classic dish at home", es: "Así es como preparo este plato clásico en casa" },
      like_count: 45,
      comment_count: 8,
      share_count: 5,
      view_count: 234,
      is_approved: true,
      status: "approved",
      created_at: "2024-06-20T10:00:00Z",
      updated_at: "2024-06-20T10:00:00Z",
      user: {
        id: "user-2",
        email: "homecook@myrecette.com",
        supermarket_name: null,
        profile_picture_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=100&q=80",
      },
    },
    {
      id: "v-2",
      recipe_id: "r-1",
      user_id: "user-3",
      platform: "facebook",
      video_url: "https://www.facebook.com/watch/?v=123456789",
      facebook_video_id: "123456789",
      thumbnail_url: null,
      title: { en: "Quick Bolognese Method", es: "Método rápido de Boloñesa" },
      description: { en: "A faster way to make this dish", es: "Una forma más rápida de preparar este plato" },
      like_count: 32,
      comment_count: 5,
      share_count: 3,
      view_count: 189,
      is_approved: true,
      status: "approved",
      created_at: "2024-06-19T14:30:00Z",
      updated_at: "2024-06-19T14:30:00Z",
      user: {
        id: "user-3",
        email: "quickcook@myrecette.com",
        supermarket_name: null,
        profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      },
    },
  ],
};

const mockComments: RecipeComment[] = [
  {
    id: "c-1",
    recipe_id: "r-1",
    author_id: "user-2",
    parent_id: null,
    content: "This recipe is amazing! My family loved it. I added a bit of red wine to the sauce for extra flavor.",
    rating: 5,
    is_approved: true,
    is_spam: false,
    created_at: "2024-06-15T18:30:00Z",
    updated_at: "2024-06-15T18:30:00Z",
    author: {
      id: "user-2",
      email: "foodlover@email.com",
      supermarket_name: null,
    },
    replies: [],
  },
  {
    id: "c-2",
    recipe_id: "r-1",
    author_id: "user-3",
    parent_id: null,
    content: "Great recipe! I used ground turkey instead of beef and it turned out great.",
    rating: 4,
    is_approved: true,
    is_spam: false,
    created_at: "2024-06-10T12:15:00Z",
    updated_at: "2024-06-10T12:15:00Z",
    author: {
      id: "user-3",
      email: "healthychef@email.com",
      supermarket_name: null,
    },
    replies: [
      {
        id: "c-3",
        recipe_id: "r-1",
        author_id: "user-1",
        parent_id: "c-2",
        content: "Great tip! Ground turkey is a healthier option.",
        rating: null,
        is_approved: true,
        is_spam: false,
        created_at: "2024-06-11T09:20:00Z",
        updated_at: "2024-06-11T09:20:00Z",
        author: {
          id: "user-1",
          email: "chef@myrecette.com",
          supermarket_name: null,
        },
        replies: [],
      },
    ],
  },
];

const mockAvailability: SupermarketIngredientAvailability[] = [
  {
    supermarket_id: "sm-1",
    supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
    location_geometry: null,
    distance_meters: 1200,
    ingredient_count: 5,
    total_price: 12.49,
    available_ingredients: [
      { ingredient: "Spaghetti", price: 2.99, in_stock: true },
      { ingredient: "Ground Beef", price: 5.99, in_stock: true },
      { ingredient: "Onion", price: 0.99, in_stock: true },
      { ingredient: "Carrot", price: 1.49, in_stock: true },
      { ingredient: "Tomato", price: 1.03, in_stock: true },
    ],
    missing_ingredients: [],
  },
  {
    supermarket_id: "sm-2",
    supermarket_name: { en: "GreenGrocer Market", es: "Mercado GreenGrocer" },
    location_geometry: null,
    distance_meters: 2500,
    ingredient_count: 4,
    total_price: 13.75,
    available_ingredients: [
      { ingredient: "Spaghetti", price: 3.25, in_stock: true },
      { ingredient: "Ground Beef", price: 6.50, in_stock: true },
      { ingredient: "Onion", price: 1.00, in_stock: true },
      { ingredient: "Carrot", price: 1.50, in_stock: true },
    ],
    missing_ingredients: [{ ingredient: "Tomato" }],
  },
];

const mockIngredients: Ingredient[] = [
  { id: "i-spaghetti", canonical_name: "spaghetti", display_name: { en: "Spaghetti", es: "Espaguetis" }, category: "grain", is_common: true, is_basic: true },
  { id: "i-ground-beef", canonical_name: "ground beef", display_name: { en: "Ground Beef", es: "Carne molida" }, category: "protein", is_common: true, is_basic: true },
  { id: "i-onion", canonical_name: "onion", display_name: { en: "Onion", es: "Cebolla" }, category: "vegetable", is_common: true, is_basic: true },
  { id: "i-carrot", canonical_name: "carrot", display_name: { en: "Carrot", es: "Zanahoria" }, category: "vegetable", is_common: true, is_basic: true },
  { id: "i-tomato", canonical_name: "tomato", display_name: { en: "Tomato", es: "Tomate" }, category: "vegetable", is_common: true, is_basic: true },
];

export const revalidate = 60;
export const dynamicParams = true;

// Helper to extract YouTube video ID from URL
function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Handle full YouTube URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  // Handle embed URL (already just the ID)
  if (url.startsWith("https://www.youtube.com/embed/")) {
    return url.split("/embed/")[1];
  }
  
  // Handle youtu.be short URL
  if (url.startsWith("https://youtu.be/")) {
    return url.split("/")[3];
  }
  
  return null;
}

// Helper to format YouTube embed URL
function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

// Helper to format time
function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Helper to format difficulty
function getDifficultyLabel(difficulty: string | null | undefined, lang: "en" | "es"): string {
  const labels: Record<string, { en: string; es: string }> = {
    easy: { en: "Easy", es: "Fácil" },
    medium: { en: "Medium", es: "Media" },
    hard: { en: "Hard", es: "Difícil" },
    expert: { en: "Expert", es: "Experto" },
  };
  return labels[difficulty || ""]?.[lang] || difficulty || "";
}

// Helper to format date
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

// Star rating component
function StarRating({ rating, count, lang }: { rating: number | null; count?: number; lang: "en" | "es" }) {
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
      {rating && (
        <span className="text-sm text-neutral-600">
          {rating.toFixed(1)} {count && `(${count.toLocaleString()})`}
        </span>
      )}
    </div>
  );
}

// Recipe metadata badges
function RecipeBadges({ recipe, lang }: { recipe: Recipe; lang: "en" | "es" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {recipe.cuisine && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-recette-50 text-recette-700 text-sm font-medium">
          <ChefHat className="h-3.5 w-3.5" />
          {recipe.cuisine}
        </span>
      )}
      {recipe.meal_type && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
          <Clock className="h-3.5 w-3.5" />
          {getMealTypeLabel(recipe.meal_type, lang)}
        </span>
      )}
      {recipe.difficulty && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
          <Flame className="h-3.5 w-3.5" />
          {getDifficultyLabel(recipe.difficulty, lang)}
        </span>
      )}
      {recipe.dietary_tags?.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium capitalize"
        >
          <Tag className="h-3.5 w-3.5" />
          {tag}
        </span>
      ))}
    </div>
  );
}

// Ingredient list
function IngredientList({ ingredients, lang }: { ingredients: Recipe["ingredients"]; lang: "en" | "es" }) {
  if (!ingredients || ingredients.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">Ingredients</h3>
      <ul className="space-y-2">
        {ingredients.map((item, index) => {
          const ingredient = item.ingredient;
          const name = ingredient?.display_name?.[lang] || ingredient?.display_name?.en || ingredient?.canonical_name || "";
          
          return (
            <li key={item.id || index} className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-neutral-700">
                {item.quantity && item.unit ? `${item.quantity} ${item.unit}` : ""}
                {item.quantity && !item.unit ? item.quantity : ""}
                {(item.quantity || item.unit) && name ? " of " : ""}
                <span className="font-medium text-neutral-900">{name}</span>
                {item.notes && <span className="text-neutral-500">, {item.notes}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Instructions list
function Instructions({ instructions, lang }: { instructions: Recipe["instructions"]; lang: "en" | "es" }) {
  if (!instructions || instructions.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">Instructions</h3>
      <div className="space-y-3">
        {instructions.map((step, index) => (
          <div key={step.step} className="flex gap-3 p-3 rounded-lg border border-neutral-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-recette-600 text-white flex items-center justify-center font-semibold">
              {step.step}
            </div>
            <p className="text-neutral-700">{step.text[lang] || step.text.en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comment form (client component)
function CommentFormClient({
  recipeId,
  userId,
  onCommentAdded,
  lang,
}: {
  recipeId: string;
  userId: string | null;
  onCommentAdded: () => void;
  lang: "en" | "es";
}) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Please sign in to leave a comment");
      return;
    }
    if (!content.trim()) {
      setError("Please enter your comment");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating }),
        credentials: "include",
      });
      
      if (response.ok) {
        setContent("");
        setRating(null);
        onCommentAdded();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to post comment");
      }
    } catch (err) {
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border border-neutral-200">
      <h4 className="font-semibold text-neutral-900">Leave a Comment</h4>
      
      {/* Rating */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-neutral-700">Rating:</label>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-0.5"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  (hoverRating && hoverRating >= star) || (rating && rating >= star)
                    ? "text-amber-400 fill-amber-400"
                    : "text-amber-400 opacity-30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      
      {/* Comment */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={lang === "es" ? "Escribe tu comentario..." : "Write your comment..."}
        rows={4}
        className="w-full p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-recette-500 focus:border-recette-500 outline-none transition-colors resize-none"
        disabled={submitting}
      />
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-recette-600 text-white hover:bg-recette-700 disabled:opacity-50 font-semibold transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        {submitting ? "Posting..." : lang === "es" ? "Publicar" : "Post Comment"}
      </button>
    </form>
  );
}

function CommentForm({ recipeId, userId, onCommentAdded, lang }: {
  recipeId: string;
  userId: string | null;
  onCommentAdded: () => void;
  lang: "en" | "es";
}) {
  return (
    <CommentFormClient
      recipeId={recipeId}
      userId={userId}
      onCommentAdded={onCommentAdded}
      lang={lang}
    />
  );
}

// Comment list
function CommentList({
  comments,
  recipeId,
  userId,
  lang,
  onCommentAdded,
}: {
  comments: RecipeComment[];
  recipeId: string;
  userId: string | null;
  lang: "en" | "es";
  onCommentAdded: () => void;
}) {
  if (!comments || comments.length === 0) return null;
  
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-neutral-900">
        Comments ({comments.length})
      </h3>
      
      {/* Comment form */}
      <CommentForm
        recipeId={recipeId}
        userId={userId}
        onCommentAdded={onCommentAdded}
        lang={lang}
      />
      
      {/* Comments */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            recipeId={recipeId}
            userId={userId}
            lang={lang}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}

// Single comment with replies
function CommentItem({
  comment,
  recipeId,
  userId,
  lang,
  onCommentAdded,
}: {
  comment: RecipeComment;
  recipeId: string;
  userId: string | null;
  lang: "en" | "es";
  onCommentAdded: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const handleReply = () => {
    if (!userId) {
      // Show login prompt
      return;
    }
    setShowReplyForm(!showReplyForm);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-recette-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-recette-600" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-neutral-900">
                {comment.author?.email || "Anonymous"}
              </span>
              {comment.rating && (
                <span className="ml-2">
                  <StarRating rating={comment.rating} lang={lang} />
                </span>
              )}
            </div>
            <span className="text-sm text-neutral-500">
              {new Date(comment.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          
          {/* Content */}
          <p className="text-neutral-700 mt-1">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleReply}
              className="text-sm text-recette-600 hover:text-recette-700 font-medium flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              Reply
            </button>
          </div>
          
          {/* Reply form */}
          {showReplyForm && userId && (
            <div className="mt-3 ml-10">
              <CommentForm
                recipeId={recipeId}
                userId={userId}
                onCommentAdded={onCommentAdded}
                lang={lang}
              />
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-10 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  recipeId={recipeId}
                  userId={userId}
                  lang={lang}
                  onCommentAdded={onCommentAdded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Favorite button component
function FavoriteButtonClient({
  recipeId,
  isFavorited: initialIsFavorited,
  userId,
  onToggle,
}: {
  recipeId: string;
  isFavorited: boolean;
  userId: string;
  onToggle: (isFavorited: boolean) => void;
}) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  
  const handleToggle = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const method = isFavorited ? "DELETE" : "POST";
      const response = await fetch(`/api/recipes/${recipeId}/favorites`, {
        method,
        credentials: "include",
      });
      
      if (response.ok) {
        const newState = !isFavorited;
        setIsFavorited(newState);
        onToggle(newState);
      }
    } catch (error) {
      console.error("Favorite error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
        isFavorited
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFavorited ? "fill-red-600 text-red-600" : "text-neutral-600"
        }`}
      />
      <span className="text-sm font-medium">
        {loading ? "..." : isFavorited ? "Favorited" : "Favorite"}
      </span>
    </button>
  );
}

function FavoriteButton({
  recipeId,
  isFavorited,
  userId,
  count,
  onToggle,
}: {
  recipeId: string;
  isFavorited: boolean;
  userId: string | null;
  count: number;
  onToggle: (isFavorited: boolean) => void;
}) {
  if (!userId) {
    return (
      <button
        onClick={() => { /* Show login prompt */ }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      >
        <Heart className="h-5 w-5 text-neutral-600" />
        <span className="text-sm font-medium">Favorite ({count.toLocaleString()})</span>
      </button>
    );
  }
  
  return (
    <FavoriteButtonClient
      recipeId={recipeId}
      isFavorited={isFavorited}
      userId={userId}
      onToggle={onToggle}
    />
  );
}

// Availability panel
function AvailabilityPanel({
  availability,
  lang,
}: {
  availability: SupermarketIngredientAvailability[];
  lang: "en" | "es";
}) {
  if (!availability || availability.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">
        Available at Nearby Supermarkets
      </h3>
      
      <div className="space-y-4">
        {availability.map((supermarket) => {
          const allAvailable = supermarket.missing_ingredients.length === 0;
          const completionPercent = (
            (supermarket.ingredient_count / (supermarket.ingredient_count + supermarket.missing_ingredients.length)) *
            100
          );
          
          return (
            <div
              key={supermarket.supermarket_id}
              className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-recette-600" />
                    <h4 className="font-semibold text-neutral-900">
                      {supermarket.supermarket_name[lang] || supermarket.supermarket_name.en}
                    </h4>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>
                        {supermarket.ingredient_count} of {
                          supermarket.ingredient_count + supermarket.missing_ingredients.length
                        } ingredients
                      </span>
                      <span>
                        {supermarket.distance_meters
                          ? `${(supermarket.distance_meters / 1000).toFixed(1)} km away`
                          : ""}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className={`h-full bg-${allAvailable ? "emerald" : "amber"}-500 transition-all`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Price */}
                  <p className="text-sm text-neutral-600 mt-2">
                    Total estimated price: {supermarket.total_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  
                  {/* Ingredient details */}
                  <div className="mt-3 space-y-1">
                    {supermarket.available_ingredients.map((item) => (
                      <div
                        key={item.ingredient}
                        className="flex items-center gap-2 text-sm text-neutral-600"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item.ingredient}</span>
                        <span className="ml-auto font-medium text-neutral-900">
                          {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {!item.in_stock && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                            Low stock
                          </span>
                        )}
                      </div>
                    ))}
                    {supermarket.missing_ingredients.map((item) => (
                      <div
                        key={item.ingredient}
                        className="flex items-center gap-2 text-sm text-neutral-500"
                      >
                        <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>{item.ingredient}</span>
                        <span className="ml-auto text-xs">Not available</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action */}
                <div className="flex-shrink-0">
                  <Link
                    href={`/${lang}/supermarkets/${supermarket.supermarket_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-recette-50 text-recette-700 hover:bg-recette-100 text-sm font-medium transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Shop
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

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const lang = locale as "en" | "es" | "fr" | "ar";
  const t = await getTranslations("common");
  
  // Get user session
  const sb = getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id;
  
  // For now, use mock data
  // In production, fetch from database:
  // const recipe = await getRecipeBySlug(slug, userId);
  // const comments = await getRecipeComments(slug);
  // const availability = await checkIngredientAvailability(recipe.ingredients, userLocation);
  
  const recipe: Recipe = {
    ...mockRecipe,
    is_favorited: false,
    comments: mockComments,
  };
  
  const comments = mockComments;
  const availability = mockAvailability;
  const ingredients = mockIngredients;
  
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title[lang] || recipe.title.en,
    description: recipe.description?.[lang] || recipe.description?.en,
    author: {
      "@type": "Person",
      name: recipe.author?.email || "My Recette",
    },
    datePublished: recipe.published_at || recipe.created_at,
    dateModified: recipe.updated_at,
    prepTime: recipe.prep_time_minutes ? `PT${recipe.prep_time_minutes}M` : undefined,
    cookTime: recipe.cook_time_minutes ? `PT${recipe.cook_time_minutes}M` : undefined,
    totalTime: recipe.prep_time_minutes && recipe.cook_time_minutes
      ? `PT${recipe.prep_time_minutes + recipe.cook_time_minutes}M`
      : undefined,
    recipeYield: recipe.servings?.toString(),
    recipeCategory: recipe.cuisine,
    recipeCuisine: recipe.cuisine,
    aggregateRating: recipe.rating && recipe.rating_count
      ? {
          "@type": "AggregateRating",
          ratingValue: recipe.rating,
          reviewCount: recipe.rating_count,
        }
      : undefined,
    interactionStatistic: recipe.view_count
      ? {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ViewAction",
          userInteractionCount: recipe.view_count,
        }
      : undefined,
    image: recipe.image_url,
    video: recipe.video_url ? {
      "@type": "VideoObject",
      name: `${recipe.title[lang] || recipe.title.en} - Video Tutorial`,
      embedUrl: getYouTubeEmbedUrl(recipe.video_url),
      uploadDate: recipe.video_url ? new Date().toISOString() : undefined,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href={`/${lang}/`} className="hover:text-recette-600">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${lang}/recipes`} className="hover:text-recette-600">
            Recipes
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">
            {recipe.title[lang] || recipe.title.en}
          </span>
        </nav>
      </div>
      
      {/* Main Content */}
      <article className="max-w-6xl mx-auto px-4 pb-8">
        {/* Recipe Header */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {/* Image */}
          <div className="relative">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title[lang] || recipe.title.en || "Recipe"}
                width={1200}
                height={600}
                className="w-full h-64 md:h-96 object-cover"
                priority
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-recette-100 to-recette-200 flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-recette-400" />
              </div>
            )}
            
            {/* Video button overlay */}
            {recipe.video_url && (
              <div className="absolute top-4 right-4">
                <a
                  href={`#video`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-sm font-medium text-neutral-900 shadow-lg transition-colors"
                >
                  <PlayCircle className="h-4 w-4" />
                  Watch Video
                </a>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="p-6 md:p-8">
            <div className="max-w-4xl">
              {/* Category */}
              {recipe.cuisine && (
                <p className="text-sm text-recette-600 font-medium mb-2 capitalize">
                  {recipe.cuisine}
                </p>
              )}
              
              {/* Title */}
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-neutral-900 mb-2">
                {recipe.title[lang] || recipe.title.en}
              </h1>
              
              {/* Description */}
              <p className="text-neutral-600 text-lg mb-4">
                {recipe.description?.[lang] || recipe.description?.en}
              </p>
              
              {/* Author and Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>By {recipe.author?.email || "My Recette"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(recipe.prep_time_minutes)} prep, {formatTime(recipe.cook_time_minutes)} cook
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Serves {recipe.servings || "1"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{recipe.rating?.toFixed(1) || "0"} ({recipe.rating_count?.toLocaleString() || "0"} ratings)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{recipe.favorite_count?.toLocaleString() || "0"} favorites</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span>{getDifficultyLabel(recipe.difficulty, lang)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <FavoriteButton
                  recipeId={recipe.id}
                  isFavorited={recipe.is_favorited || false}
                  userId={userId || undefined}
                  count={recipe.favorite_count || 0}
                  onToggle={(isFavorited) => {
                    // Update state
                  }}
                />
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                  <Share2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <Link
                  href={`/${lang}/recipes/${recipe.slug}/print`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                >
                  <Tag className="h-5 w-5" />
                  <span className="text-sm font-medium">Print</span>
                </Link>
              </div>
              
              {/* Tags */}
              <RecipeBadges recipe={recipe} lang={lang} />
            </div>
          </div>
        </div>
        
        {/* Recipe Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ingredients */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
              <IngredientList ingredients={recipe.ingredients || []} lang={lang} />
            </section>
            
            {/* Instructions */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
              <Instructions instructions={recipe.instructions || []} lang={lang} />
            </section>
            
            {/* Community Content Tabs */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
              <RecipeCommunityTabs
                recipe={recipe}
                comments={comments}
                userId={userId || null}
                lang={lang}
              />
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Recipe Stats */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-24">
              <h3 className="font-semibold text-neutral-900 mb-4">Recipe Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-recette-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-recette-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Total Time</p>
                    <p className="font-semibold text-neutral-900">
                      {formatTime((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Servings</p>
                    <p className="font-semibold text-neutral-900">{recipe.servings || "1"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Difficulty</p>
                    <p className="font-semibold text-neutral-900">
                      {getDifficultyLabel(recipe.difficulty, lang)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Star className="h-5 w-5 text-emerald-600 fill-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Rating</p>
                    <p className="font-semibold text-neutral-900">
                      {recipe.rating?.toFixed(1) || "0"}/5
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Published date */}
              <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-500">Published</p>
                <p className="text-sm text-neutral-600">
                  {formatDate(recipe.published_at || recipe.created_at)}
                </p>
              </div>
            </div>
            
            {/* Availability */}
            <AvailabilityPanel availability={availability} lang={lang} />
          </div>
        </div>
      </article>
    </>
  );
}
