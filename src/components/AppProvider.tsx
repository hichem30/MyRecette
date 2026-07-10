"use client";

import { Suspense, useState, useEffect } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadingSpinner, FullPageLoader } from "./LoadingSpinner";

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={<FullPageLoader message="Chargement de la page..." />}
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Server-side wrapper that doesn't cause hydration issues
export function AppProviderServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
