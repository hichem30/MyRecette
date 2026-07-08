"use client";

import { useState, useTransition } from "react";
import { Users, Heart, MessageSquare } from "lucide-react";
import type { VideoComment } from "@/lib/types";
import { VideoCommentForm } from "../VideoCommentForm/VideoCommentForm";

interface VideoCommentItemProps {
  comment: VideoComment;
  videoId: string;
  currentUserId: string | null;
  lang: string;
  onCommentAdded: (comment: VideoComment) => void;
  onCommentLiked?: (commentId: string, isLiked: boolean) => void;
}

// Simple relative time formatter
function formatRelativeTime(dateString: string, lang: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInWeek = 604800;
  const secondsInMonth = 2592000;
  const secondsInYear = 31536000;

  if (diffInSeconds < secondsInMinute) {
    const seconds = Math.floor(diffInSeconds);
    return seconds <= 1 ? 
      (lang === "es" ? "hace un segundo" : 
       lang === "fr" ? "il y a une seconde" : 
       lang === "ar" ? "منذ ثانية" : "a second ago") :
      (lang === "es" ? `hace ${seconds} segundos` : 
       lang === "fr" ? `il y a ${seconds} secondes` : 
       lang === "ar" ? `منذ ${seconds} ثوان` : `${seconds} seconds ago`);
  }
  
  if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return minutes <= 1 ?
      (lang === "es" ? "hace un minuto" : 
       lang === "fr" ? "il y a une minute" : 
       lang === "ar" ? "منذ دقيقة" : "a minute ago") :
      (lang === "es" ? `hace ${minutes} minutos` : 
       lang === "fr" ? `il y a ${minutes} minutes` : 
       lang === "ar" ? `منذ ${minutes} دقائق` : `${minutes} minutes ago`);
  }

  if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return hours <= 1 ?
      (lang === "es" ? "hace una hora" : 
       lang === "fr" ? "il y a une heure" : 
       lang === "ar" ? "منذ ساعة" : "an hour ago") :
      (lang === "es" ? `hace ${hours} horas` : 
       lang === "fr" ? `il y a ${hours} heures` : 
       lang === "ar" ? `منذ ${hours} ساعات` : `${hours} hours ago`);
  }

  if (diffInSeconds < secondsInWeek) {
    const days = Math.floor(diffInSeconds / secondsInDay);
    return days <= 1 ?
      (lang === "es" ? "hace un día" : 
       lang === "fr" ? "il y a un jour" : 
       lang === "ar" ? "منذ يوم" : "a day ago") :
      (lang === "es" ? `hace ${days} días` : 
       lang === "fr" ? `il y a ${days} jours` : 
       lang === "ar" ? `منذ ${days} أيام` : `${days} days ago`);
  }

  if (diffInSeconds < secondsInMonth) {
    const weeks = Math.floor(diffInSeconds / secondsInWeek);
    return weeks <= 1 ?
      (lang === "es" ? "hace una semana" : 
       lang === "fr" ? "il y a une semaine" : 
       lang === "ar" ? "منذ أسبوع" : "a week ago") :
      (lang === "es" ? `hace ${weeks} semanas` : 
       lang === "fr" ? `il y a ${weeks} semaines` : 
       lang === "ar" ? `منذ ${weeks} أسابيع` : `${weeks} weeks ago`);
  }

  if (diffInSeconds < secondsInYear) {
    const months = Math.floor(diffInSeconds / secondsInMonth);
    return months <= 1 ?
      (lang === "es" ? "hace un mes" : 
       lang === "fr" ? "il y a un mois" : 
       lang === "ar" ? "منذ شهر" : "a month ago") :
      (lang === "es" ? `hace ${months} meses` : 
       lang === "fr" ? `il y a ${months} mois` : 
       lang === "ar" ? `منذ ${months} أشهر` : `${months} months ago`);
  }

  const years = Math.floor(diffInSeconds / secondsInYear);
  return years <= 1 ?
    (lang === "es" ? "hace un año" : 
     lang === "fr" ? "il y a un an" : 
     lang === "ar" ? "منذ عام" : "a year ago") :
    (lang === "es" ? `hace ${years} años` : 
     lang === "fr" ? `il y a ${years} ans` : 
     lang === "ar" ? `منذ ${years} سنوات` : `${years} years ago`);
}

export function VideoCommentItem({ 
  comment, 
  videoId, 
  currentUserId, 
  lang, 
  onCommentAdded,
  onCommentLiked
}: VideoCommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || !comment.id) return;
    
    setIsLiking(true);
    try {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/videos/${videoId}/comments/${comment.id}/like`, {
        method,
        credentials: "include",
      });

      if (response.ok) {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        onCommentLiked?.(comment.id, newIsLiked);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = () => {
    if (!currentUserId) {
      // User not logged in - could show login prompt
      return;
    }
    setShowReplyForm(!showReplyForm);
  };

  const handleReplyAdded = (newComment: VideoComment) => {
    // Reset reply form and notify parent
    setShowReplyForm(false);
    // Note: In a real implementation, we'd need to handle adding the reply to the UI
    // For now, just notify parent which should refresh the comment list
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-neutral-100">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user?.profile_picture_url ? (
            <img
              src={comment.user.profile_picture_url}
              alt={comment.user.email || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-recette-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-recette-600" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">
                {(typeof comment.user?.supermarket_name === 'string' ? comment.user?.supermarket_name : 
                  typeof comment.user?.supermarket_name === 'object' ? (comment.user?.supermarket_name as Record<string, string>)?.[lang] : null) || comment.user?.email || 
                 (lang === "es" ? "Anónimo" : 
                  lang === "fr" ? "Anonyme" : 
                  lang === "ar" ? "مجهول" : "Anonymous")}
              </span>
            </div>
            <span className="text-sm text-neutral-500">
              {formatRelativeTime(comment.created_at, lang)}
            </span>
          </div>
          
          {/* Comment text */}
          <p className="text-neutral-700 mt-2">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-recette-600 transition-colors"
            >
              <Heart 
                className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-neutral-600"}`} 
              />
              <span>{comment.like_count || 0}</span>
            </button>
            <button
              onClick={handleReply}
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-recette-600 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>
                {lang === "es" ? "Responder" : 
                 lang === "fr" ? "Répondre" : 
                 lang === "ar" ? "رد" : "Reply"}
              </span>
            </button>
          </div>
          
          {/* Reply form */}
          {showReplyForm && currentUserId && (
            <div className="mt-3 ml-10">
              <VideoCommentForm
                videoId={videoId}
                userId={currentUserId}
                lang={lang}
                onCommentAdded={handleReplyAdded}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}