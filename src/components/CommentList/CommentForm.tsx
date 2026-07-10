"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";

interface CommentFormProps {
  recipeId: string;
  userId: string | null;
  onCommentAdded: () => void;
  lang: Locale;
}

export function CommentForm({ recipeId, userId, onCommentAdded, lang }: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for comment submission
    onCommentAdded();
    setContent("");
  };

  if (!userId) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-600">Please log in to leave a comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={lang === "es" ? "Escribe un comentario..." : lang === "fr" ? "Écrivez un commentaire..." : "Write a comment..."}
        className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-recette-500"
        rows={3}
      />
      <button
        type="submit"
        className="rounded-lg bg-recette-600 px-4 py-2 text-sm font-medium text-white hover:bg-recette-700"
      >
        {lang === "es" ? "Comentar" : lang === "fr" ? "Commenter" : "Comment"}
      </button>
    </form>
  );
}
