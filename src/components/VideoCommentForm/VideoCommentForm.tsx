"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import type { VideoComment } from "@/lib/types";

interface VideoCommentFormProps {
  videoId: string;
  userId: string;
  lang: string;
  onCommentAdded: (comment: VideoComment) => void;
  className?: string;
}

export function VideoCommentForm({ 
  videoId, 
  userId, 
  lang, 
  onCommentAdded,
  className = ""
}: VideoCommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError(lang === "es" ? "Por favor, escribe un comentario" : 
               lang === "fr" ? "Veuillez écrire un commentaire" :
               lang === "ar" ? "الرجاء كتابة تعليق" :
               "Please write a comment");
      return;
    }

    setError(null);
    
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: null }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      const newComment = await response.json();
      startTransition(() => {
        setContent("");
        onCommentAdded(newComment);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          lang === "es" ? "Añade un comentario..." :
          lang === "fr" ? "Ajoutez un commentaire..." :
          lang === "ar" ? "أضف تعليق..." :
          "Add a comment..."
        }
        rows={3}
        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-recette-500 focus:border-recette-500 transition-colors resize-none"
        disabled={isPending}
      />
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-recette-600 text-white rounded-lg hover:bg-recette-700 disabled:opacity-50 transition-colors font-medium"
        >
          <Send className="h-4 w-4" />
          {isPending ? 
            (lang === "es" ? "Publicando..." : 
             lang === "fr" ? "Publication..." : 
             lang === "ar" ? "جاري النشر..." : 
             "Posting...") : 
            (lang === "es" ? "Publicar" : 
             lang === "fr" ? "Publier" : 
             lang === "ar" ? "نشر" : 
             "Post Comment")}
        </button>
      </div>
    </form>
  );
}