"use client";

import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  text?: string;
}

export function BackToTopButton({ text = "Back to Top" }: BackToTopButtonProps) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="inline-flex items-center gap-2 text-sm text-recette-600 hover:text-recette-700"
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
      {text}
    </button>
  );
}