"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="mb-4 text-6xl text-recette-600">⚠️</div>
          <h2 className="text-xl font-bold text-neutral-900">
            Une erreur est survenue
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {this.state.error?.message || "Quelque chose n\'a pas fonctionné comme prévu."}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error display component
export function ErrorDisplay({
  error,
  onRetry,
  message,
}: {
  error?: Error | string | null;
  onRetry?: () => void;
  message?: string;
}) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 text-6xl text-recette-600">⚠️</div>
      <h2 className="text-xl font-bold text-neutral-900">
        {message || "Une erreur est survenue"}
      </h2>
      {errorMessage && (
        <p className="mt-2 text-sm text-neutral-600">{errorMessage}</p>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-6"
          variant="outline"
        >
          Réessayer
        </Button>
      )}
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 text-4xl text-neutral-400">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-neutral-500 max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
