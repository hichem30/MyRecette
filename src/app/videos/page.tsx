import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Search, PlayCircle, Clock, Eye, Heart, MessageCircle, Share2, Filter, SortDesc, Grid3X3, List } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RecipeVideo, VideoPlatform } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { SocialShare } from "@/components/SocialShare/SocialShare";

export const revalidate = 60;
export const dynamicParams = true;

// Mock videos for local development
const mockVideos: RecipeVideo[] = [
  {
    id: "v-1",
    recipe_id: "r-1",
    user_id: "user-1",
    platform: "youtube",
    video_url: "https://www.youtube.com/watch?v=3a0v8W1Tn9k",
    youtube_video_id: "3a0v8W1Tn9k",
    thumbnail_url: "https://img.youtube.com/vi/3a0v8W1Tn9k/mqdefault.jpg",
    title: { en: "Spaghetti Bolognese - My Variation", es: "Espaguetis a la boloñesa - Mi versión" },
    description: { en: "Here's how I make the perfect Spaghetti Bolognese at home", es: "Así es como preparo los Espaguetis a la boloñesa perfectos en casa" },
    like_count: 45,
    comment_count: 8,
    share_count: 5,
    view_count: 234,
    is_approved: true,
    status: "approved",
    created_at: "2024-06-20T10:00:00Z",
    updated_at: "2024-06-20T10:00:00Z",
    user: {
      id: "user-1",
      email: "chef@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    },
    recipe: {
      id: "r-1",
      slug: "spaghetti-bolognese",
      title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
    },
  },
  {
    id: "v-2",
    recipe_id: "r-1",
    user_id: "user-2",
    platform: "facebook",
    video_url: "https://www.facebook.com/watch/?v=123456789",
    facebook_video_id: "123456789",
    thumbnail_url: null,
    title: { en: "Spaghetti Bolognese - Quick Method", es: "Espaguetis a la boloñesa - Método rápido" },
    description: { en: "A quicker way to make this classic dish", es: "Una forma más rápida de preparar este plato clásico" },
    like_count: 32,
    comment_count: 12,
    share_count: 3,
    view_count: 189,
    is_approved: true,
    status: "approved",
    created_at: "2024-06-19T14:30:00Z",
    updated_at: "2024-06-19T14:30:00Z",
    user: {
      id: "user-2",
      email: "homecook@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=100&q=80",
    },
    recipe: {
      id: "r-1",
      slug: "spaghetti-bolognese",
      title: { en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa" },
    },
  },
  {
    id: "v-3",
    recipe_id: "r-2",
    user_id: "user-3",
    platform: "youtube",
    video_url: "https://www.youtube.com/watch?v=abc123def456",
    youtube_video_id: "abc123def456",
    thumbnail_url: "https://img.youtube.com/vi/abc123def456/mqdefault.jpg",
    title: { en: "Chicken Caesar Salad Tutorial", es: "Tutorial de Ensalada César con Pollo" },
    description: { en: "Step by step guide to the perfect Caesar salad", es: "Guía paso a paso para la ensalada César perfecta" },
    like_count: 67,
    comment_count: 5,
    share_count: 8,
    view_count: 345,
    is_approved: true,
    status: "approved",
    created_at: "2024-06-18T09:15:00Z",
    updated_at: "2024-06-18T09:15:00Z",
    user: {
      id: "user-3",
      email: "saladmaster@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    },
    recipe: {
      id: "r-2",
      slug: "chicken-caesar-salad",
      title: { en: "Chicken Caesar Salad", es: "Ensalada César con Pollo" },
    },
  },
  {
    id: "v-4",
    recipe_id: "r-3",
    user_id: "user-1",
    platform: "youtube",
    video_url: "https://www.youtube.com/watch?v=xyz789uvw123",
    youtube_video_id: "xyz789uvw123",
    thumbnail_url: "https://img.youtube.com/vi/xyz789uvw123/mqdefault.jpg",
    title: { en: "Chocolate Lava Cake - Secret Tip", es: "Pastel de Chocolate Volcán - Consejo secreto" },
    description: { en: "The secret to making the perfect lava cake every time", es: "El secreto para hacer el pastel volcán perfecto cada vez" },
    like_count: 89,
    comment_count: 23,
    share_count: 15,
    view_count: 567,
    is_approved: true,
    status: "approved",
    created_at: "2024-06-17T16:45:00Z",
    updated_at: "2024-06-17T16:45:00Z",
    user: {
      id: "user-1",
      email: "chef@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    },
    recipe: {
      id: "r-3",
      slug: "chocolate-lava-cake",
      title: { en: "Chocolate Lava Cake", es: "Pastel de Chocolate Volcán" },
    },
  },
];

async function getAllVideos(): Promise<RecipeVideo[]> {
  const sb = await getSupabaseServerClient();
  
  try {
    const { data, error } = await sb
      .from("recipe_videos")
      .select(
        "id, recipe_id, user_id, platform, video_url, youtube_video_id, facebook_video_id, thumbnail_url, " +
        "title, description, like_count, comment_count, share_count, view_count, is_approved, status, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url), " +
        "recipes:recipe_id(id, slug, title)"
      )
      .eq("is_approved", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }

    return (data as any[] || []).map((v: any) => ({
      ...v,
      user: v.profiles ? { ...v.profiles } : null,
      recipe: v.recipes ? { ...v.recipes } : null,
    }));
  } catch (error) {
    console.error("Database error:", error);
    // Return mock data for local development
    return mockVideos;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function VideosPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ locale: string }>; 
  searchParams: Promise<{ 
    q?: string; 
    platform?: VideoPlatform; 
    sort?: string; 
    recipe?: string; 
  }> 
}) {
  const { locale } = await params;
  const { q, platform: platformFilter, sort, recipe } = await searchParams;
  
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const tC = await getTranslations("common");

  // Fetch all videos
  let videos = await getAllVideos();

  // Apply filters
  if (q) {
    const searchLower = q.toLowerCase();
    videos = videos.filter(
      (v) => 
        v.title?.en?.toLowerCase().includes(searchLower) ||
        v.title?.es?.toLowerCase().includes(searchLower) ||
        v.title?.fr?.toLowerCase().includes(searchLower) ||
        v.title?.ar?.toLowerCase().includes(searchLower) ||
        v.description?.en?.toLowerCase().includes(searchLower) ||
        v.recipe?.title?.en?.toLowerCase().includes(searchLower)
    );
  }

  if (platformFilter && (platformFilter === 'youtube' || platformFilter === 'facebook')) {
    videos = videos.filter((v) => v.platform === platformFilter);
  }

  if (recipe) {
    const recipeLower = recipe.toLowerCase();
    videos = videos.filter(
      (v) => 
        v.recipe?.title?.en?.toLowerCase().includes(recipeLower) ||
        v.recipe?.slug?.toLowerCase().includes(recipeLower)
    );
  }

  // Apply sorting
  switch (sort) {
    case 'views':
      videos.sort((a, b) => b.view_count - a.view_count);
      break;
    case 'likes':
      videos.sort((a, b) => b.like_count - a.like_count);
      break;
    case 'newest':
      videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'comments':
      videos.sort((a, b) => b.comment_count - a.comment_count);
      break;
    default:
      // Default: newest first
      videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const totalVideos = videos.length;
  const youtubeVideos = videos.filter((v) => v.platform === 'youtube').length;
  const facebookVideos = videos.filter((v) => v.platform === 'facebook').length;

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle className="h-8 w-8 text-recette-600" />
          <h1 className="font-serif text-3xl font-bold text-neutral-900">{t("title")}</h1>
        </div>
        <p className="text-neutral-600">{t("subtitle")}</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              name="q"
              placeholder={t("searchPlaceholder")}
              defaultValue={q || ''}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-recette-500 focus:border-recette-500 transition-colors"
            />
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-1">
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}sort=${sort || 'newest'}`}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !platformFilter 
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All ({totalVideos})
          </Link>
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}platform=youtube&sort=${sort || 'newest'}`}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === 'youtube'
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            YouTube ({youtubeVideos})
          </Link>
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}platform=facebook&sort=${sort || 'newest'}`}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === 'facebook'
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Facebook ({facebookVideos})
          </Link>
        </div>

        {/* Sort */}
        <div className="flex gap-1">
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}${platformFilter ? `platform=${platformFilter}&` : ''}sort=newest`}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === 'newest' || !sort
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <SortDesc className="h-4 w-4" />
            Newest
          </Link>
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}${platformFilter ? `platform=${platformFilter}&` : ''}sort=views`}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === 'views'
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Eye className="h-4 w-4" />
            Views
          </Link>
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}${platformFilter ? `platform=${platformFilter}&` : ''}sort=likes`}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === 'likes'
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Heart className="h-4 w-4" />
            Likes
          </Link>
          <Link
            href={`/videos?${q ? `q=${encodeURIComponent(q)}&` : ''}${platformFilter ? `platform=${platformFilter}&` : ''}sort=comments`}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === 'comments'
                ? 'bg-recette-600 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Comments
          </Link>
        </div>
      </div>

      {/* Results */}
      {totalVideos > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => {
            const displayTitle = video.title?.en || video.title?.es || video.title?.fr || video.title?.ar || "Untitled Video";
            const displayRecipe = video.recipe?.title?.en || video.recipe?.title?.es || "Unknown Recipe";
            const displayUser = video.user?.supermarket_name?.en || video.user?.email || "Anonymous";

            return (
              <div key={video.id} className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-neutral-100">
                  <Link href={`/videos/${video.id}`} className="block">
                    <VideoPlayer 
                      video={video} 
                      showControls={false} 
                      className="rounded-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <div className="text-white">
                        <h3 className="font-semibold line-clamp-2">{displayTitle}</h3>
                        <p className="text-sm text-white/80 mt-1">
                          {displayRecipe} • {displayUser}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {video.view_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {video.like_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {video.comment_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      video.platform === 'facebook' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {video.platform}
                    </span>
                    <SocialShare
                      url={`https://myrecette.com/${locale}/videos/${video.id}`}
                      title={displayTitle}
                      description={video.description?.en}
                      imageUrl={video.thumbnail_url || undefined}
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-neutral-500">
                  {new Date(video.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <PlayCircle className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-semibold text-neutral-900">{t("noResults")}</h3>
          <p className="text-neutral-600 mt-1">
            {q 
              ? tC("noResults")
              : t("noVideosYet")
            }
          </p>
        </div>
      )}
    </div>
  );
}
