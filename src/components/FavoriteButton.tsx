"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  isFavorited: boolean;
  entityType: "recipe" | "video" | "product" | "supermarket";
  entityId: string;
  onToggle?: (isFavorited: boolean) => void | Promise<void>;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
  useOptimisticUpdate?: boolean;
}

/**
 * FavoriteButton - Toggle button for favoriting entities
 * Used for recipes, videos, products, and supermarkets
 * Supports optimistic updates for better UX
 */
export default function FavoriteButton({
  isFavorited: initialIsFavorited,
  entityType,
  entityId,
  onToggle,
  size = "md",
  showLabel = false,
  className = "",
  disabled = false,
  useOptimisticUpdate = true,
}: FavoriteButtonProps) {
  const t = useTranslations("favorites");
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const router = useRouter();

  // Sync with external changes
  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited]);

  const handleToggle = async () => {
    if (disabled) return;

    if (useOptimisticUpdate) {
      // Optimistic update
      setIsFavorited(!isFavorited);
    }

    try {
      await onToggle?.(!isFavorited);
    } catch (error) {
      // Revert if error
      if (useOptimisticUpdate) {
        setIsFavorited(isFavorited);
      }
    }

    // Refresh the page to update the favorite status
    router.refresh();
  };

  // Size classes
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconClass = `${sizeClasses[size]} transition-all duration-200`;

  // Animation classes for the heart
  const getHeartClass = () => {
    if (isPending) {
      return "animate-pulse";
    }
    if (isFavorited) {
      return "text-red-500 fill-red-500";
    }
    return "text-gray-400 hover:text-red-500 hover:fill-red-500";
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      className={`
        flex items-center gap-2
        ${isPending ? "opacity-70 cursor-wait" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      aria-label={isFavorited ? t("removeFavorite") : t("addToFavorites")}
      aria-pressed={isFavorited}
    >
      <Heart
        className={`${iconClass} ${getHeartClass()}`}
        strokeWidth={1.5}
      />

      {showLabel && (
        <span
          className={`
            text-sm font-medium transition-colors duration-200
            ${isFavorited ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}
          `}
        >
          {isFavorited ? t("removeFavorite") : t("addToFavorites")}
        </span>
      )}
    </button>
  );
}

// Simple favorite icon without label (for compact use)
export function FavoriteIcon({
  isFavorited,
  onClick,
  size = "md",
  className = "",
  disabled = false,
}: {
  isFavorited: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <Heart
      className={`
        ${sizeClasses[size]} transition-all duration-200
        ${isFavorited ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      strokeWidth={1.5}
      onClick={disabled ? undefined : onClick}
    />
  );
}

// Favorite button with count
export function FavoriteButtonWithCount({
  isFavorited,
  count,
  onToggle,
  size = "md",
  className = "",
  disabled = false,
}: {
  isFavorited: boolean;
  count: number;
  onToggle?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center gap-1
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <Heart
        className={`
          ${sizeClasses[size]} transition-all duration-200
          ${isFavorited ? "text-red-500 fill-red-500" : "text-gray-400"}
        `}
        strokeWidth={1.5}
      />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {count.toLocaleString()}
      </span>
    </button>
  );
}