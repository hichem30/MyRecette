"use client";

import { useState, useTransition } from "react";
import type { VideoComment } from "@/lib/types";
import { VideoCommentForm } from "../VideoCommentForm/VideoCommentForm";
import { VideoCommentItem } from "../VideoCommentItem/VideoCommentItem";

interface VideoCommentListProps {
  comments: VideoComment[];
  videoId: string;
  currentUserId: string | null;
  lang: string;
  onCommentAdded?: (comment: VideoComment) => void;
  className?: string;
}

export function VideoCommentList({ 
  comments: initialComments, 
  videoId, 
  currentUserId, 
  lang,
  onCommentAdded,
  className = ""
}: VideoCommentListProps) {
  const [comments, setComments] = useState<VideoComment[]>(initialComments);
  const [isLoading, setIsLoading] = useTransition();

  const handleCommentAdded = (newComment: VideoComment) => {
    // Add the new comment to the list and notify parent
    setComments(prev => [newComment, ...prev]);
    onCommentAdded?.(newComment);
  };

  const handleCommentLiked = (commentId: string, isLiked: boolean) => {
    // Update the like status of the comment in the list
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, 
              is_liked: isLiked, 
              like_count: isLiked 
                ? (comment.like_count || 0) + 1 
                : Math.max((comment.like_count || 1) - 1, 0) 
            } 
          : comment
      )
    );
  };

  if (!comments || comments.length === 0) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <p className="text-neutral-500">
          {lang === "es" ? "No hay comentarios aún. Sé el primero en comentar." :
           lang === "fr" ? "Aucun commentaire pour le moment. Soyez le premier à commenter." :
           lang === "ar" ? "لا توجد تعليقات بعد. كن أول من يعلق." :
           "No comments yet. Be the first to comment."}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment form */}
      {currentUserId && (
        <VideoCommentForm
          videoId={videoId}
          userId={currentUserId}
          lang={lang}
          onCommentAdded={handleCommentAdded}
        />
      )}
      
      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <VideoCommentItem
            key={comment.id}
            comment={comment}
            videoId={videoId}
            currentUserId={currentUserId}
            lang={lang}
            onCommentAdded={handleCommentAdded}
            onCommentLiked={handleCommentLiked}
          />
        ))}
      </div>
      
      {!currentUserId && (
        <p className="text-sm text-neutral-600">
          {lang === "es" ? "Inicia sesión para publicar un comentario" :
           lang === "fr" ? "Connectez-vous pour publier un commentaire" :
           lang === "ar" ? "قم بتسجيل الدخول لنشر تعليق" :
           "Sign in to post a comment"}
        </p>
      )}
    </div>
  );
}