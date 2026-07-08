"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { Recipe, RecipeComment, RecipeVideo, Locale } from "@/lib/types";
import { VideoList } from "@/components/VideoList/VideoList";
import { VideoEmbed } from "@/components/VideoEmbed/VideoEmbed";
import { SocialShare } from "@/components/SocialShare/SocialShare";

interface RecipeCommunityTabsProps {
  recipe: Recipe;
  comments: RecipeComment[];
  userId: string | null;
  lang: Locale;
}

// Simple StarRating component for comments
function StarRating({ rating, lang }: { rating: number | null; lang: Locale }) {
  if (!rating) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-amber-400 fill-amber-400">★</span>
        ))}
        {hasHalf && <span className="text-amber-400 fill-amber-400 opacity-50">★</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-amber-400 opacity-20">★</span>
        ))}
      </div>
      <span className="text-sm text-neutral-600">{rating.toFixed(1)}</span>
    </div>
  );
}

// Simple CommentItem component
function SimpleCommentItem({ comment, lang }: { comment: RecipeComment; lang: Locale }) {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-neutral-100">
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
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          
          {/* Comment text */}
          <p className="text-neutral-700 mt-2">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

// Simple CommentList for tabs
function SimpleCommentList({ comments, lang }: { comments: RecipeComment[]; lang: Locale }) {
  if (!comments || comments.length === 0) return (
    <div className="text-center py-8">
      <p className="text-neutral-500">No comments yet. Be the first to comment!</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <SimpleCommentItem key={comment.id} comment={comment} lang={lang} />
      ))}
    </div>
  );
}


export function RecipeCommunityTabs({ recipe, comments, userId, lang }: RecipeCommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<"videos" | "comments">("comments");

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">
          Community Content
        </h2>
        <SocialShare
          url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/${lang}/recipes/${recipe.slug}`}
          title={recipe.title[lang] || recipe.title.en || "sucre et sel Recipe"}
          description={recipe.description?.[lang] || recipe.description?.en || ""}
          imageUrl={recipe.image_url || undefined}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "videos"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Videos ({recipe.video_count || 0})
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "comments"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Comments ({recipe.comment_count || comments.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "videos" ? (
          <>
            {/* Recipe Author Video (if exists) */}
            {recipe.video_url && (
              <div className="mb-8">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Recipe Author Video
                </h3>
                <VideoEmbed url={recipe.video_url} />
              </div>
            )}

            {/* User-submitted Videos */}
            <VideoList
              recipeId={recipe.id}
              recipeSlug={recipe.slug}
              videos={recipe.videos || []}
              currentUserId={userId}
            />
          </>
        ) : (
          <SimpleCommentList comments={comments} lang={lang} />
        )}
      </div>
    </div>
  );
}

export default RecipeCommunityTabs;
