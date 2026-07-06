"use client";

import { useState, useEffect } from "react";
import { PlayCircle, Plus, Loader2 } from "lucide-react";
import type { RecipeVideo } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { VideoSubmit } from "@/components/VideoSubmit/VideoSubmit";
import { SocialShare } from "@/components/SocialShare/SocialShare";

interface VideoListProps {
  recipeId: string;
  recipeSlug: string;
  videos: RecipeVideo[];
  currentUserId?: string | null;
  className?: string;
}

export function VideoList({ recipeId, recipeSlug, videos: initialVideos, currentUserId, className = "" }: VideoListProps) {
  const [videos, setVideos] = useState<RecipeVideo[]>(initialVideos);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  const canSubmit = !!currentUserId;

  const handleVideoAdded = () => {
    // Refresh videos
    fetchVideos();
    setShowSubmitForm(false);
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${recipeSlug}/videos`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalVideos = videos.length;
  const userVideos = videos.filter((v) => v.user_id === currentUserId);
  const communityVideos = videos.filter((v) => v.user_id !== currentUserId);

  const displayVideos = activeTab === "user" ? userVideos : activeTab === "community" ? communityVideos : videos;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900">
            Recipe Videos
          </h2>
          <p className="text-neutral-600 mt-1">
            Watch how others make this recipe
          </p>
        </div>
        
        {canSubmit && (
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Your Video
          </button>
        )}
      </div>

      {/* Submit Form */}
      {showSubmitForm && canSubmit && (
        <VideoSubmit
          recipeId={recipeId}
          recipeSlug={recipeSlug}
          onVideoAdded={handleVideoAdded}
          className="mb-6"
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "videos"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          All ({totalVideos})
        </button>
        {canSubmit && (
          <button
            onClick={() => setActiveTab("user")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "user"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Your Videos ({userVideos.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("community")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "community"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Community ({communityVideos.length})
        </button>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-recette-600" />
        </div>
      ) : displayVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVideos.map((video) => (
            <div key={video.id} className="space-y-3">
              <VideoPlayer video={video} className="rounded-xl overflow-hidden" />
              
              {/* Social Share */}
              <div className="flex justify-end">
                <SocialShare
                  url={`https://myrecette.com/en/recipes/${recipeSlug}?video=${video.id}`}
                  title={video.title?.en || "Check out this recipe video"}
                  description={video.description?.en || "User-submitted recipe video"}
                  imageUrl={video.thumbnail_url}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <PlayCircle className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="font-semibold text-neutral-900">No videos yet</h3>
          <p className="text-neutral-600 mt-1">
            {canSubmit
              ? "Be the first to add a video for this recipe!"
              : "Be the first to share your cooking process with the community."}
          </p>
          {canSubmit && !showSubmitForm && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Your Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoList;
