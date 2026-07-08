"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { RecipeComment, Locale } from "@/lib/types";

interface CommentItemProps {
  comment: RecipeComment;
  recipeId: string;
  userId: string | null;
  lang: Locale;
  onCommentAdded: () => void;
}

// Simple relative time formatter
function formatRelativeTime(dateString: string, lang: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInWeek = 604800;
  const secondsInMonth = 2592000;

  if (diffInSeconds < secondsInMinute) {
    return lang === "es" ? "Hace unos segundos" : lang === "fr" ? "Il y a quelques secondes" : "A few seconds ago";
  }
  if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return lang === "es" ? `Hace ${minutes}m` : lang === "fr" ? `Il y a ${minutes} min` : `${minutes}m ago`;
  }
  if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return lang === "es" ? `Hace ${hours}h` : lang === "fr" ? `Il y a ${hours}h` : `${hours}h ago`;
  }
  if (diffInSeconds < secondsInWeek) {
    const days = Math.floor(diffInSeconds / secondsInDay);
    return lang === "es" ? `Hace ${days}d` : lang === "fr" ? `Il y a ${days}j` : `${days}d ago`;
  }
  if (diffInSeconds < secondsInMonth) {
    const weeks = Math.floor(diffInSeconds / secondsInWeek);
    return lang === "es" ? `Hace ${weeks}s` : lang === "fr" ? `Il y a ${weeks} sem` : `${weeks}w ago`;
  }
  const months = Math.floor(diffInSeconds / secondsInMonth);
  return lang === "es" ? `Hace ${months}m` : lang === "fr" ? `Il y a ${months} mois` : `${months}mo ago`;
}

export function CommentItem({ comment, userId, lang }: CommentItemProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!userId || !comment.id) return;
    setIsLiking(true);
    try {
      // Placeholder for like functionality
    } catch (error) {
      console.error("Error liking comment:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const userName = comment.author?.supermarket_name 
    ? (typeof comment.author.supermarket_name === 'string' 
        ? comment.author.supermarket_name 
        : comment.author.supermarket_name?.[lang])
    : comment.author?.email || (
        lang === "es" ? "Anónimo" : 
        lang === "fr" ? "Anonyme" : 
        "Anonymous"
      );

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200">
            <Users className="h-5 w-5 text-neutral-600" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-neutral-900">{userName}</span>
              <span className="ml-2 text-sm text-neutral-500">
                {formatRelativeTime(comment.created_at, lang)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-neutral-700">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}
