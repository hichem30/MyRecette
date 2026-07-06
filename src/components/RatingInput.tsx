"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  maxValue?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  onChange?: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  showLabel?: boolean;
}

/**
 * RatingInput - Interactive star rating input component
 * Allows users to rate recipes, products, supermarkets, etc.
 * Can be used in both interactive and read-only modes
 */
export default function RatingInput({
  value,
  maxValue = 5,
  size = "md",
  className = "",
  onChange,
  disabled = false,
  readOnly = false,
  showLabel = false,
}: RatingInputProps) {
  const t = useTranslations("ratings");
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [internalValue, setInternalValue] = useState<number>(value);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Size classes
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const starClass = `${sizeClasses[size]} transition-all duration-200`;
  const isInteractive = !disabled && !readOnly;

  const handleClick = (selectedValue: number) => {
    if (!isInteractive) return;
    const newValue = internalValue === selectedValue ? 0 : selectedValue;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleMouseEnter = (hoveredValue: number) => {
    if (!isInteractive) return;
    setHoverValue(hoveredValue);
  };

  const handleMouseLeave = () => {
    if (!isInteractive) return;
    setHoverValue(null);
  };

  const displayValue = hoverValue ?? internalValue;
  const clampedValue = Math.min(Math.max(0, displayValue), maxValue);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("rateThis")}
        </span>
      )}

      <div className="flex items-center">
        {Array.from({ length: maxValue }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= clampedValue;
          const isPartial = false; // We use whole stars only for input

          return (
            <button
              key={starValue}
              type="button"
              className={`
                relative ${starClass}
                ${isInteractive ? "cursor-pointer" : "cursor-default"}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled || readOnly}
              aria-label={`${starValue} ${t("outOf5")}`}
            >
              {/* Background star (empty) */}
              <Star
                className={starClass}
                strokeWidth={1.5}
                fill="none"
                stroke="currentColor"
                color="#e5e7eb"
              />

              {/* Filled star overlay */}
              {isFilled && (
                <Star
                  className={`absolute inset-0 ${starClass}`}
                  strokeWidth={1.5}
                  fill="currentColor"
                  stroke="currentColor"
                  color="#fbbf24"
                  style={{
                    clipPath: isPartial
                      ? `inset(0 ${100 - (clampedValue - Math.floor(clampedValue)) * 100}% 0 0)`
                      : "none",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {showLabel && internalValue > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {internalValue} {t("outOf5")}
        </span>
      )}
    </div>
  );
}

// Simple star rating with clickable stars (alternative implementation)
export function SimpleRatingInput({
  value,
  maxValue = 5,
  onChange,
  size = "md",
  disabled = false,
}: {
  value: number;
  maxValue?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (selectedValue: number) => {
    if (disabled) return;
    onChange?.(selectedValue);
  };

  return (
    <div className="flex items-center">
      {Array.from({ length: maxValue }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => handleClick(starValue)}
            disabled={disabled}
            className={`
              ${sizeClasses[size]} transition-colors duration-200
              ${isFilled ? "text-yellow-400" : "text-gray-300"}
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            <Star
              fill={isFilled ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}