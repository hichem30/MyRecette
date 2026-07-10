"use client";

import { cn } from "@/lib/utils";

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
      <svg
        className={cn("animate-spin text-recette-600", sizeClasses[size], className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="text-sm text-neutral-600">{text}</span>}
    </div>
  );
}

export function FullPageLoader({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-sm text-neutral-600">{message}</p>
    </div>
  );
}

export function Skeleton({
  className,
  variant = "rect",
}: {
  className?: string;
  variant?: "rect" | "circle" | "text";
}) {
  const baseClasses = "animate-pulse bg-neutral-200";
  const variantClasses = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded-full h-4",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-hidden="true"
    />
  );
}

// Card skeleton loader
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
      <Skeleton className="h-40 w-full" variant="rect" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-1/4" variant="text" />
          <Skeleton className="h-4 w-1/4" variant="text" />
        </div>
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" variant="text" />
        </td>
      ))}
    </tr>
  );
}
