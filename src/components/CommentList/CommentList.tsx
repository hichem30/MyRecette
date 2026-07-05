"use client";

import { useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import type { RecipeComment, Locale } from "@/lib/types";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface CommentListProps {
  comments: RecipeComment[];
  recipeId: string;
  userId: string | null;
  lang: Locale;
  onCommentAdded: () => void;
}

export function CommentList({ comments, recipeId, userId, lang, onCommentAdded }: CommentListProps) {
  if (!comments || comments.length === 0) return null;
  
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-neutral-900">
        Comments ({comments.length})
      </h3>
      
      {/* Comment form */}
      <CommentForm
        recipeId={recipeId}
        userId={userId}
        onCommentAdded={onCommentAdded}
        lang={lang}
      />
      
      {/* Comments */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            recipeId={recipeId}
            userId={userId}
            lang={lang}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}

export default CommentList;
