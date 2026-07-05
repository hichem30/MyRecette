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

// Get YouTube embed URL
function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function VideoEmbed({ url, title, className = "" }: VideoEmbedProps) {
  const embedUrl = useMemo(() => getYouTubeEmbedUrl(url), [url]);

  if (!embedUrl) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="font-semibold text-neutral-900">{title}</h3>}
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <iframe
          src={embedUrl}
          title={title || "Recipe Video"}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default VideoEmbed;
