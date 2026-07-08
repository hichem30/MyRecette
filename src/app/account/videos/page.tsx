"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "@/lib/fr";
import Link from "next/link";
import { PlayCircle, Plus, Eye, Heart, MessageCircle, Share2, Trash2, Edit2, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { SocialShare } from "@/components/SocialShare/SocialShare";

export default function UserVideosPage() {
  const locale = useLocale() as "en" | "es" | "fr" | "ar";
  const t = useTranslations("account");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data: userData } = await sb.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data: videos, error } = await sb
        .from("recipe_videos")
        .select(
          "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, " +
          "title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at, " +
          "profiles:user_id(id, email, supermarket_name, profile_picture_url), " +
          "recipes:recipe_id(id, slug, title)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setVideos(videos || []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (videoId: string) => {
    if (!userId || !window.confirm("Are you sure you want to delete this video?")) return;

    setDeleting(videoId);
    try {
      const sb = getSupabaseBrowserClient();
      const { error } = await sb
        .from("recipe_videos")
        .delete()
        .eq("id", videoId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting video:", error);
        alert("Failed to delete video. Please try again.");
      } else {
        // Remove from local state
        setVideos(videos.filter(v => v.id !== videoId));
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const labels = {
    en: {
      title: "My Videos",
      noVideos: "You haven't uploaded any videos yet.",
      uploadFirst: "Upload your first video",
      browseRecipes: "Browse recipes to add videos",
      deleteConfirm: "Are you sure you want to delete this video?",
      stats: "Stats",
    },
    es: {
      title: "Mis Videos",
      noVideos: "No has subido ningún video todavía.",
      uploadFirst: "Sube tu primer video",
      browseRecipes: "Explora recetas para añadir videos",
      deleteConfirm: "¿Estás seguro de que quieres eliminar este video?",
      stats: "Estadísticas",
    },
    fr: {
      title: "Mes Vidéos",
      noVideos: "Vous n'avez pas encore téléchargé de vidéos.",
      uploadFirst: "Téléchargez votre première vidéo",
      browseRecipes: "Parcourez les recettes pour ajouter des vidéos",
      deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette vidéo ?",
      stats: "Statistiques",
    },
    ar: {
      title: "فيديوهاتي",
      noVideos: "لم تقم برفع أي فيديوهات بعد.",
      uploadFirst: "رفع أول فيديو",
      browseRecipes: "تصفح الوصفات لإضافة فيديوهات",
      deleteConfirm: "هل أنت متأكد من أنك تريد حذف هذا الفيديو؟",
      stats: "إحصائيات",
    },
  }[locale];

  if (loading) {
    return (
      <div className="container-page py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-recette-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle className="h-8 w-8 text-recette-600" />
          <h1 className="font-serif text-3xl font-bold text-neutral-900">{labels.title}</h1>
        </div>
        <p className="text-neutral-600">{t("videosSubtitle") || "Manage your uploaded recipe videos"}</p>
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const displayTitle = video.title?.en || video.title?.es || video.title?.fr || video.title?.ar || "Untitled Video";
            const displayRecipe = video.recipes?.title?.en || video.recipes?.title?.es || "Unknown Recipe";
            
            return (
              <div key={video.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                {/* Video Player */}
                <div className="relative">
                  <Link href={`/videos/${video.id}`} className="block">
                    <VideoPlayer video={video} showControls={false} />
                  </Link>
                  
                  {/* Platform Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      video.platform === 'facebook' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {video.platform}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deleting === video.id}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
                    title="Delete video"
                  >
                    {deleting === video.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 truncate">{displayTitle}</h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {labels.stats}: {video.view_count.toLocaleString()} views, {video.like_count.toLocaleString()} likes
                      </p>
                    </div>
                    <Link
                      href={`/recipes/${video.recipes?.slug || '#'}`}
                      className="text-sm text-recette-600 hover:underline flex-shrink-0"
                    >
                      {displayRecipe}
                    </Link>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-neutral-500 mt-2">
                    {new Date(video.created_at).toLocaleDateString(locale === 'ar' ? 'en-US' : locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                    <Link
                      href={`/videos/${video.id}`}
                      className="text-sm text-recette-600 hover:text-recette-700 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <SocialShare
                      url={`https://myrecette.com/${locale}/videos/${video.id}`}
                      title={displayTitle}
                      description={video.description?.en}
                      imageUrl={video.thumbnail_url}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <PlayCircle className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-semibold text-neutral-900">{labels.noVideos}</h3>
          <p className="text-neutral-600 mt-1">
            {labels.uploadFirst}
          </p>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {labels.browseRecipes}
          </Link>
        </div>
      )}
    </div>
  );
}
