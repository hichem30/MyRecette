"use client";

import { useTranslations } from "@/lib/fr";
import { Star, StarHalf } from "lucide-react";

interface RatingDisplayProps {
  value: number;
  maxValue?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  reviewCount?: number;
}

/**
 * RatingDisplay - Displays a star rating based on numeric value
 * Used for showing recipe ratings, supermarket ratings, etc.
 */
export default function RatingDisplay({
  value,
  maxValue = 5,
  showValue = false,
  size = "md",
  className = "",
  reviewCount,
}: RatingDisplayProps) {
  const t = useTranslations("ratings");

  // Clamp value between 0 and maxValue
  const clampedValue = Math.min(Math.max(0, value), maxValue);
  const fullStars = Math.floor(clampedValue);
  const hasHalfStar = clampedValue % 1 >= 0.5;
  const emptyStars = maxValue - fullStars - (hasHalfStar ? 1 : 0);

  // Size classes
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const starClass = `${sizeClasses[size]} text-yellow-400`;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Star key={`full-${index}`} className={starClass} fill="currentColor" />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <StarHalf key="half" className={starClass} fill="currentColor" />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Star key={`empty-${index}`} className={starClass} />
        ))}
      </div>

      {/* Optional value display */}
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {clampedValue.toFixed(1)} {t("outOf5")}
        </span>
      )}

      {/* Optional review count */}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// Star rating with just the numeric value (no stars)
export function RatingValue({ value, maxValue = 5 }: { value: number; maxValue?: number }) {
  const clampedValue = Math.min(Math.max(0, value), maxValue);
  return <span className="font-semibold text-yellow-600">{clampedValue.toFixed(1)}</span>;
}