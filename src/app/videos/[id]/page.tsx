import type { Metadata } from "next";
import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  ThumbsUp,
  Laugh,
  Heart as HeartIcon,
  Frown,
  Smile,
  Angry,
  Plus,
  PlayCircle,
  Loader2 
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RecipeVideo, VideoComment, VideoReaction, VideoPlatform, VideoReactionType } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { SocialShare } from "@/components/SocialShare/SocialShare";
import { VideoCommentList } from "@/components/VideoCommentList/VideoCommentList";
import { getCurrentUser } from "@/lib/supabase/user";
import { cn } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

// Mock data for local development
const mockVideo: RecipeVideo = {
  id: "v-1",
  recipe_id: "r-1",
  user_id: "user-1",
  platform: "youtube",
  video_url: "https://www.youtube.com/watch?v=3a0v8W1Tn9k",
  youtube_video_id: "3a0v8W1Tn9k",
  thumbnail_url: "https://img.youtube.com/vi/3a0v8W1Tn9k/mqdefault.jpg",
  title: { en: "Spaghetti Bolognese - My Variation", es: "Espaguetis a la boloñesa - Mi versión" },
  description: { en: "Here's how I make the perfect Spaghetti Bolognese at home. I've been cooking this recipe for over 10 years and it's always a hit with my family.", es: "Así es como preparo los Espaguetis a la boloñesa perfectos en casa. Llevo más de 10 años cocinando esta receta y siempre es un éxito con mi familia." },
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
};

const mockComments: VideoComment[] = [
  {
    id: "c-1",
    video_id: "v-1",
    user_id: "user-2",
    content: "Great tutorial! I tried this method and it turned out amazing. Thanks for sharing!",
    like_count: 3,
    is_approved: true,
    is_spam: false,
    created_at: "2024-06-20T11:30:00Z",
    updated_at: "2024-06-20T11:30:00Z",
    user: {
      id: "user-2",
      email: "homecook@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=100&q=80",
    },
    replies: [],
  },
  {
    id: "c-2",
    video_id: "v-1",
    user_id: "user-3",
    content: "What kind of pasta do you recommend for this dish? I usually use spaghetti but want to try something different.",
    like_count: 1,
    is_approved: true,
    is_spam: false,
    created_at: "2024-06-20T12:45:00Z",
    updated_at: "2024-06-20T12:45:00Z",
    user: {
      id: "user-3",
      email: "pasta_lover@myrecette.com",
      supermarket_name: null,
      profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    },
    replies: [
      {
        id: "c-3",
        video_id: "v-1",
        user_id: "user-1",
        parent_id: "c-2",
        content: "I personally love using tagliatelle or pappardelle for Bolognese. The wider noodles hold the sauce better!",
        like_count: 2,
        is_approved: true,
        is_spam: false,
        created_at: "2024-06-20T13:15:00Z",
        updated_at: "2024-06-20T13:15:00Z",
        user: {
          id: "user-1",
          email: "chef@myrecette.com",
          supermarket_name: null,
          profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
        },
        replies: [],
      },
    ],
  },
];

const reactionTypes: { type: VideoReactionType; label: string; icon: React.ReactNode }[] = [
  { type: 'like', label: 'Like', icon: <ThumbsUp className="h-5 w-5" /> },
  { type: 'love', label: 'Love', icon: <HeartIcon className="h-5 w-5" /> },
  { type: 'laugh', label: 'Laugh', icon: <Laugh className="h-5 w-5" /> },
  { type: 'surprised', label: 'Surprised', icon: <Smile className="h-5 w-5" /> },
  { type: 'sad', label: 'Sad', icon: <Frown className="h-5 w-5" /> },
  { type: 'angry', label: 'Angry', icon: <Angry className="h-5 w-5" /> },
];

async function getVideoById(videoId: string): Promise<RecipeVideo | null> {
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
      .eq("id", videoId)
      .eq("is_approved", true)
      .eq("status", "approved")
      .single();

    if (error || !data) {
      console.error("Error fetching video:", error);
      return null;
    }

    const video = data as any;
    return {
      ...video,
      user: video.profiles ? { ...video.profiles } : null,
      recipe: video.recipes ? { ...video.recipes } : null,
    };
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}

async function getVideoComments(videoId: string): Promise<VideoComment[]> {
  const sb = await getSupabaseServerClient();
  
  try {
    const { data, error } = await sb
      .from("video_comments")
      .select(
        "id, video_id, user_id, parent_id, content, like_count, is_approved, is_spam, created_at, updated_at, " +
        "profiles:user_id(id, email, supermarket_name, profile_picture_url)"
      )
      .eq("video_id", videoId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    // Organize comments into parent-child relationships
    const commentsMap = new Map<string, VideoComment>();
    
    (data as any[] || []).forEach((c: any) => {
      commentsMap.set(c.id, {
        ...c,
        user: c.profiles ? { ...c.profiles } : null,
        replies: [],
      });
    });

    const rootComments: VideoComment[] = [];
    
    commentsMap.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies?.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error("Database error:", error);
    return mockComments;
  }
}

async function getVideoReactions(videoId: string): Promise<Record<VideoReactionType, number>> {
  const sb = await getSupabaseServerClient();
  
  try {
    const { data, error } = await (sb as any)
      .from("video_reactions")
      .select("reaction_type, count")
      .eq("video_id", videoId)
      .group("reaction_type");

    if (error) {
      console.error("Error fetching reactions:", error);
      return { like: 0, love: 0, laugh: 0, surprised: 0, sad: 0, angry: 0 };
    }

    const counts: Record<VideoReactionType, number> = {
      like: 0,
      love: 0,
      laugh: 0,
      surprised: 0,
      sad: 0,
      angry: 0,
    };

    (data as any[] || []).forEach((r: any) => {
      if (r.reaction_type in counts) {
        counts[r.reaction_type as VideoReactionType] = (r.count as number) || 0;
      }
    });

    return counts;
  } catch (error) {
    console.error("Database error:", error);
    return { like: 0, love: 0, laugh: 0, surprised: 0, sad: 0, angry: 0 };
  }
}

async function getUserReaction(videoId: string, userId: string): Promise<VideoReactionType | null> {
  const sb = await getSupabaseServerClient();
  
  try {
    const { data, error } = await sb
      .from("video_reactions")
      .select("reaction_type")
      .eq("video_id", videoId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.reaction_type as VideoReactionType;
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}

async function getRelatedVideos(videoId: string, recipeId: string, limit: number = 4): Promise<RecipeVideo[]> {
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
      .eq("recipe_id", recipeId)
      .eq("is_approved", true)
      .eq("status", "approved")
      .neq("id", videoId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching related videos:", error);
      return [];
    }

    return (data as any[] || []).map((v: any) => ({
      ...v,
      user: v.profiles ? { ...v.profiles } : null,
      recipe: v.recipes ? { ...v.recipes } : null,
    }));
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  
  // Try to get video title
  const video = await getVideoById(id);
  const title = video?.title?.en || video?.title?.es || t("video");

  return {
    title: `${title} | ${t("title")}`,
    description: video?.description?.en || t("description"),
    openGraph: {
      title,
      description: video?.description?.en || t("description"),
      images: [video?.thumbnail_url || '/images/og-image.png'],
    },
  };
}

export default async function VideoDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}) {
  const { locale, id } = await params;
  
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const tC = await getTranslations("common");

  // Fetch video data
  const video = await getVideoById(id);
  
  if (!video) {
    notFound();
  }

  // Fetch related data
  const [comments, reactions, user] = await Promise.all([
    getVideoComments(video.id),
    getVideoReactions(video.id),
    getCurrentUser(),
  ]);

  // Get user's reaction if logged in
  const userReaction = user ? await getUserReaction(video.id, user.id) : null;
  
  // Get related videos (from same recipe)
  const relatedVideos = await getRelatedVideos(video.id, video.recipe_id, 4);

  const displayTitle = video.title?.en || video.title?.es || video.title?.fr || video.title?.ar || "Untitled Video";
  const displayDescription = video.description?.en || video.description?.es || video.description?.fr || video.description?.ar || "";
  const displayUser = video.user?.supermarket_name?.en || video.user?.email || "Anonymous";
  const displayRecipe = video.recipe?.title?.en || video.recipe?.title?.es || "Unknown Recipe";

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
        <Link href="/videos" className="hover:text-recette-600 transition-colors">
          {t("backToVideos")}
        </Link>
      </nav>

      {/* Video Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-neutral-900 mb-2">
          {displayTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              video.platform === 'facebook' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {video.platform}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {video.view_count.toLocaleString()} {t("views")}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {video.like_count.toLocaleString()} {t("likes")}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {comments.length} {t("comments")}
          </span>
          <span>
            {t("by")} {displayUser}
          </span>
          <span>
            {t("forRecipe")} <Link href={`/recipes/${video.recipe?.slug}`} className="text-recette-600 hover:underline">{displayRecipe}</Link>
          </span>
          <span>
            {new Date(video.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player Column */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="mb-6">
            <VideoPlayer 
              video={video} 
              showControls={true} 
              className="rounded-xl shadow-lg"
            />
          </div>

          {/* Video Description */}
          <div className="bg-neutral-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-neutral-900 mb-3">{t("videoDetails")}</h3>
            <p className="text-neutral-700 whitespace-pre-wrap">{displayDescription}</p>
          </div>

          {/* Reactions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-neutral-900 mb-4">{t("reactions")}</h3>
            <div className="flex items-center gap-4">
              {reactionTypes.map(({ type, label, icon }) => {
                const count = reactions[type] || 0;
                const isActive = userReaction === type;
                return (
                  <button
                    key={type}
                    disabled={!user}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50",
                      isActive 
                        ? "bg-recette-50 ring-2 ring-recette-500" 
                        : "hover:bg-neutral-100"
                    )}
                    title={user ? `${t("reactWith")} ${label}` : "Sign in to react"}
                  >
                    <span className={cn("text-xl", isActive ? "text-recette-600" : "text-neutral-600")}>{icon}</span>
                    <span className="text-xs text-neutral-600">{count.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-900">{t("comments")} ({comments.length})</h3>
              {user && (
                <button className="text-sm text-recette-600 hover:text-recette-700 font-medium">
                  + {t("addComment")}
                </button>
              )}
            </div>

            {/* Video Comments */}
            <VideoCommentList
              comments={comments}
              videoId={video.id}
              currentUserId={user?.id || null}
              lang={locale}
            />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Share Section */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">{t("share")}</h3>
            <SocialShare
              url={`https://myrecette.com/${locale}/videos/${video.id}`}
              title={displayTitle}
              description={displayDescription}
              imageUrl={video.thumbnail_url || undefined}
            />
          </div>

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">{t("relatedVideos")}</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => {
                  const relatedTitle = relatedVideo.title?.en || relatedVideo.title?.es || "Untitled Video";
                  const relatedUser = relatedVideo.user?.supermarket_name?.en || relatedVideo.user?.email || "Anonymous";
                  
                  return (
                    <Link
                      key={relatedVideo.id}
                      href={`/videos/${relatedVideo.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={relatedVideo.thumbnail_url || '/images/placeholder-video.jpg'}
                          alt={relatedTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <PlayCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{relatedTitle}</p>
                        <p className="text-sm text-neutral-500">{relatedUser}</p>
                        <p className="text-xs text-neutral-400">
                          {relatedVideo.view_count.toLocaleString()} views
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Stats */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <Eye className="h-6 w-6 mx-auto text-recette-600 mb-1" />
                <p className="font-bold text-neutral-900">{video.view_count.toLocaleString()}</p>
                <p className="text-xs text-neutral-600">Views</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <Heart className="h-6 w-6 mx-auto text-recette-600 mb-1" />
                <p className="font-bold text-neutral-900">{video.like_count.toLocaleString()}</p>
                <p className="text-xs text-neutral-600">Likes</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <MessageCircle className="h-6 w-6 mx-auto text-recette-600 mb-1" />
                <p className="font-bold text-neutral-900">{video.comment_count.toLocaleString()}</p>
                <p className="text-xs text-neutral-600">Comments</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <Share2 className="h-6 w-6 mx-auto text-recette-600 mb-1" />
                <p className="font-bold text-neutral-900">{video.share_count.toLocaleString()}</p>
                <p className="text-xs text-neutral-600">Shares</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


