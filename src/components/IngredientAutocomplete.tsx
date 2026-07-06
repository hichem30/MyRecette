"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface Ingredient {
  id: string;
  canonical_name: string;
  display_name: Record<string, string>;
  plural_name?: Record<string, string>;
  category?: string;
  subcategory?: string;
  is_common: boolean;
  is_basic: boolean;
  description?: string;
}

interface IngredientAutocompleteProps {
  onSelect?: (ingredient: Ingredient) => void;
  onRemove?: (ingredient: Ingredient) => void;
  selectedIngredients?: Ingredient[];
  placeholder?: string;
  maxSelections?: number;
  categoryFilter?: string;
  className?: string;
  locale?: string;
}

/**
 * IngredientAutocomplete - Autocomplete search for ingredients
 * Used in recipe search, shopping list creation, etc.
 * Features debounced search, selected ingredient chips, and category filtering
 */
export default function IngredientAutocomplete({
  onSelect,
  onRemove,
  selectedIngredients = [],
  placeholder,
  maxSelections = 10,
  categoryFilter,
  className = "",
  locale = "en",
}: IngredientAutocompleteProps) {
  const t = useTranslations("ingredients");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch ingredient suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() && !categoryFilter) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query);
      }
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      params.set("limit", "10");
      params.set("is_common", "true");

      const response = await fetch(`/api/ingredients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch ingredients");
      }

      const data = await response.json();
      
      // Filter out already selected ingredients
      const filteredSuggestions = data.ingredients?.filter(
        (ingredient: Ingredient) =>
          !selectedIngredients.some((selected) => selected.id === ingredient.id)
      ) || [];

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error("Error fetching ingredient suggestions:", err);
      setError("Failed to load ingredient suggestions");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, selectedIngredients]);

  // Fetch suggestions when search query or category filter changes
  useEffect(() => {
    fetchSuggestions(debouncedSearchQuery);
  }, [debouncedSearchQuery, categoryFilter, fetchSuggestions]);

  // Handle selection
  const handleSelect = (ingredient: Ingredient) => {
    if (selectedIngredients.length >= maxSelections) return;
    
    onSelect?.(ingredient);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Handle removal
  const handleRemove = (ingredient: Ingredient) => {
    onRemove?.(ingredient);
  };

  // Handle input focus and blur
  const handleFocus = () => {
    if (searchQuery || categoryFilter) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Small delay to allow click on suggestion to work
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Get display name in current locale
  const getDisplayName = (ingredient: Ingredient) => {
    return (
      ingredient.display_name?.[locale] ||
      ingredient.display_name?.en ||
      ingredient.canonical_name
    );
  };

  // Check if ingredient is selected
  const isSelected = (ingredient: Ingredient) => {
    return selectedIngredients.some((selected) => selected.id === ingredient.id);
  };

  // Handle key down for suggestion navigation
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Selected ingredients (chips) */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full text-sm"
            >
              <span>{getDisplayName(ingredient)}</span>
              <button
                type="button"
                onClick={() => handleRemove(ingredient)}
                className="p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-colors"
                aria-label="Remove ingredient"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search
            className="absolute left-3 w-5 h-5 text-gray-400"
            strokeWidth={1.5}
          />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("search")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute right-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && (searchQuery || categoryFilter) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.length > 0 ? (
              <ul className="py-1">
                {suggestions.map((ingredient, index) => (
                  <li
                    key={ingredient.id}
                    onClick={() => handleSelect(ingredient)}
                    className={`
                      px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                      ${highlightedIndex === index ? "bg-gray-100 dark:bg-gray-700" : ""}
                      ${isSelected(ingredient) ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getDisplayName(ingredient)}
                      </span>
                      {ingredient.is_common && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                          {t("common")}
                        </span>
                      )}
                      {ingredient.category && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ingredient.category}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : isLoading ? (
              <div className="py-3 px-3">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="py-3 px-3 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("noIngredients")}
              </div>
            )}
          </div>
        )}

        {/* Max selections reached */}
        {selectedIngredients.length >= maxSelections && searchQuery && (
          <p className="text-sm text-amber-600 mt-1">
            Maximum {maxSelections} ingredients selected
          </p>
        )}
      </div>
    </div>
  );
}

// Simple ingredient selector without autocomplete (for mobile/less complex use)
export function SimpleIngredientSelector({
  ingredients,
  selectedIds,
  onToggle,
  className = "",
}: {
  ingredients: Ingredient[];
  selectedIds: string[];
  onToggle: (ingredientId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ingredients.map((ingredient) => {
        const isSelected = selectedIds.includes(ingredient.id);
        const displayName = (
          ingredient.display_name?.en ||
          ingredient.canonical_name
        );

        return (
          <button
            key={ingredient.id}
            type="button"
            onClick={() => onToggle(ingredient.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${isSelected
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }
            `}
          >
            {displayName}
          </button>
        );
      })}
    </div>
  );
}