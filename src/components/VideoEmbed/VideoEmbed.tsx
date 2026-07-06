"use client";

import { useMemo } from "react";

interface VideoEmbedProps {
  url: string | null | undefined;
  title?: string;
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
    /facebook\.com\/[^\/]+\/videos\/([^\/?]+)/,
    /fb\.watch\/([^\/]+)/,
    /facebook\.com\/reel\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) return match[i];
      }
    }
  }
  return null;
}

// Get YouTube embed URL
function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

// Get Facebook embed URL
function getFacebookEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const videoId = extractFacebookVideoId(url);
  if (!videoId) return null;
  return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${videoId}&show_text=0`;
}

// Detect platform from URL
function getPlatform(url: string | null | undefined): 'youtube' | 'facebook' | null {
  if (!url) return null;
  if (url.includes('facebook') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  return null;
}

export function VideoEmbed({ url, title, className = "" }: VideoEmbedProps) {
  const platform = useMemo(() => getPlatform(url), [url]);
  
  let embedUrl: string | null = null;
  
  if (platform === 'youtube') {
    embedUrl = getYouTubeEmbedUrl(url);
  } else if (platform === 'facebook') {
    embedUrl = getFacebookEmbedUrl(url);
  }

  if (!embedUrl) return null;

  // Facebook iframes need different allow attributes
  const allow = platform === 'facebook' 
    ? "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
    : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="font-semibold text-neutral-900">{title}</h3>}
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <iframe
          src={embedUrl}
          title={title || "Recipe Video"}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow={allow}
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default VideoEmbed;
