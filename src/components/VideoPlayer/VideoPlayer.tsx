"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Fullscreen, Heart, Eye, Share2 } from "lucide-react";
import type { RecipeVideo, VideoPlatform } from "@/lib/types";

interface VideoPlayerProps {
  video: RecipeVideo;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^\?]+)/,
    /youtube\.com\/embed\/([^\?]+)/,
    /youtube\.com\/shorts\/([^\?]+)/,
    /youtube\.com\/live\/([^\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Extract Facebook video ID from URL
function extractFacebookVideoId(url: string): string | null {
  const patterns = [
    /facebook\.com\/watch\/\?v=([^&]+)/,
    /facebook\.com\/([^\/]+)\/videos\/([^\/]+)/,
    /fb\.watch\/([^\/]+)/,
    /facebook\.com\/reel\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Return the first non-empty capture group
      for (let i = 1; i < match.length; i++) {
        if (match[i]) return match[i];
      }
    }
  }
  return null;
}

// Get YouTube embed URL
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`;
}

// Get YouTube thumbnail URL (higher quality)
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Get Facebook embed URL
function getFacebookEmbedUrl(videoId: string): string {
  return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${videoId}&show_text=0`;
}

// Get Facebook thumbnail URL (using oEmbed API as fallback)
function getFacebookThumbnail(videoId: string): string {
  // Facebook thumbnails are harder to get directly, use a placeholder or oEmbed
  return `/images/facebook-placeholder.jpg`;
}

export function VideoPlayer({ video, showControls = true, autoPlay = false, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.like_count || 0);
  const [viewCount, setViewCount] = useState(video.view_count || 0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const platform: VideoPlatform = video.platform || 
    (video.youtube_video_id ? 'youtube' : 
    (video.facebook_video_id || video.video_url.includes('facebook') || video.video_url.includes('fb.watch') ? 'facebook' : 'youtube'));

  // Extract appropriate video ID based on platform
  let videoId: string | null = null;
  let embedUrl: string | null = null;
  
  if (platform === 'youtube') {
    videoId = video.youtube_video_id || extractYouTubeVideoId(video.video_url);
    embedUrl = videoId ? getYouTubeEmbedUrl(videoId) : null;
  } else if (platform === 'facebook') {
    videoId = video.facebook_video_id || extractFacebookVideoId(video.video_url);
    embedUrl = videoId ? getFacebookEmbedUrl(videoId) : null;
  }

  // Handle like
  const handleLike = async () => {
    try {
      const response = await fetch(`/api/recipes/videos/${video.id}/like`, {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(!liked);
        setLikeCount(data.like_count || (liked ? likeCount - 1 : likeCount + 1));
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    }
  };

  // Track view when video starts playing
  useEffect(() => {
    if (isPlaying && videoId && video.id) {
      // Increment view count
      const timer = setTimeout(() => {
        fetch(`/api/recipes/videos/${video.id}/view`, {
          method: "POST",
        }).catch(console.error);
      }, 5000); // Count view after 5 seconds of playing

      return () => clearTimeout(timer);
    }
  }, [isPlaying, videoId, video.id]);

  if (!embedUrl) {
    return (
      <div className={`bg-neutral-100 rounded-xl aspect-video flex items-center justify-center ${className}`}>
        <p className="text-neutral-500 text-sm">Invalid video URL</p>
      </div>
    );
  }

  // Facebook iframes need different allow attributes
  const iframeAllow = platform === 'facebook' 
    ? "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
    : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

  return (
    <div className={`bg-neutral-900 rounded-xl overflow-hidden relative ${className}`}>
      {/* Video Embed (YouTube or Facebook) */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full aspect-video"
        frameBorder="0"
        allow={iframeAllow}
        allowFullScreen
        title={video.title?.en || "Recipe Video"}
      />

      {/* Custom Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-between p-4">
          {/* Top Controls */}
          <div className="flex justify-between items-start">
            {/* Close button for fullscreen */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Fullscreen className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Left: Play/Pause, Time */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white ml-0.5" />
                )}
              </button>
              <div className="text-white/80 text-sm">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Volume, Fullscreen, Like, Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  liked ? "text-red-400" : "text-white/80 hover:text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                <span>{likeCount.toLocaleString()}</span>
              </button>

              <button
                className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{viewCount.toLocaleString()}</span>
              </button>

              <button
                className="text-white/80 hover:text-white transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Fullscreen className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="p-4 bg-white">
        <div className="flex items-start gap-3">
          {video.user?.profile_picture_url && (
            <img
              src={video.user.profile_picture_url}
              alt={video.user.email}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-neutral-900 truncate">
              {video.title?.en || video.title?.es || video.title?.fr || video.title?.ar || "Untitled Video"}
            </h4>
            <p className="text-sm text-neutral-500">
              {video.user?.supermarket_name?.en || video.user?.email}
            </p>
            {video.description?.en && (
              <p className="text-sm text-neutral-600 mt-1">{video.description.en}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Format time in MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default VideoPlayer;
