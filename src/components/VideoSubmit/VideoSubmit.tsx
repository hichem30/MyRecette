"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, X, Loader2, Check } from "lucide-react";
import type { RecipeVideo, RecipeVideoSubmission } from "@/lib/types";

interface VideoSubmitProps {
  recipeId: string;
  recipeSlug: string;
  onVideoAdded?: () => void;
  className?: string;
}

// YouTube URL validation patterns
const YOUTUBE_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/ /,
  /^https?:\/\/(www\.)?youtu\.be\/ /,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/ /,
  /^https?:\/\/(www\.)?youtube\.com\/live\/ /,
];

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
}

// Extract video ID from YouTube URL
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

// Get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// Get YouTube embed URL
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function VideoSubmit({ recipeId, recipeSlug, onVideoAdded, className = "" }: VideoSubmitProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState<Record<string, string>>({ en: "", fr: "", es: "", ar: "" });
  const [description, setDescription] = useState<Record<string, string>>({ en: "", fr: "", es: "", ar: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<{ thumbnail: string; videoId: string; embedUrl: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    setError(null);

    // Auto-extract preview if valid
    if (isValidYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        setPreview({
          thumbnail: getYouTubeThumbnail(videoId),
          videoId,
          embedUrl: getYouTubeEmbedUrl(videoId),
        });
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleTitleChange = (lang: string, value: string) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
  };

  const handleDescriptionChange = (lang: string, value: string) => {
    setDescription((prev) => ({ ...prev, [lang]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube video URL");
      setIsSubmitting(false);
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      setError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)");
      setIsSubmitting(false);
      return;
    }

    try {
      const submission: RecipeVideoSubmission = {
        video_url: videoUrl.trim(),
        title: Object.keys(title).some((k) => title[k].trim()) ? title : undefined,
        description: Object.keys(description).some((k) => description[k].trim()) ? description : undefined,
      };

      const response = await fetch(`/api/recipes/${recipeSlug}/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit video");
      }

      const video: RecipeVideo = await response.json();

      // Success!
      setSuccess(true);
      setVideoUrl("");
      setTitle({ en: "", fr: "", es: "", ar: "" });
      setDescription({ en: "", fr: "", es: "", ar: "" });
      setPreview(null);

      // Notify parent and refresh
      onVideoAdded?.();
      router.refresh();

      // Close form after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit video. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-6 ${className}`} ref={formRef}>
      <h3 className="font-semibold text-neutral-900 mb-4">
        <PlayCircle className="h-5 w-5 inline-block mr-2 text-barn-600" />
        Add Your Recipe Video
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* YouTube URL */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            YouTube Video URL *
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-barn-500 focus:border-barn-500 transition-colors"
            required
          />
          <p className="text-xs text-neutral-500 mt-1">
            Paste a YouTube video URL. Supports standard links, shortened links (youtu.be), and embed URLs.
          </p>
        </div>

        {/* Video Preview */}
        {preview && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <img
                src={preview.thumbnail}
                alt="Video preview"
                className="w-24 h-16 object-cover rounded-lg" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/placeholder-video.jpg";
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  YouTube Video Detected
                </p>
                <p className="text-xs text-neutral-500">
                  Video ID: {preview.videoId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoUrl("");
                  setPreview(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Title (Multi-language) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Video Title (Optional)
          </label>
          <div className="space-y-2">
            {(["en", "es", "fr", "ar"] as const).map((lang) => (
              <div key={lang} className="flex gap-2">
                <span className="w-8 text-xs text-neutral-500 pt-2">
                  {lang === "en" ? "EN" : lang === "es" ? "ES" : lang === "fr" ? "FR" : "AR"}
                </span>
                <input
                  type="text"
                  value={title[lang] || ""}
                  onChange={(e) => handleTitleChange(lang, e.target.value)}
                  placeholder={`Title in ${lang === "en" ? "English" : lang === "es" ? "Spanish" : lang === "fr" ? "French" : "Arabic"}`}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-barn-500 focus:border-barn-500 transition-colors text-sm"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Description (Multi-language) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description (Optional)
          </label>
          <div className="space-y-2">
            {(["en", "es", "fr", "ar"] as const).map((lang) => (
              <div key={lang} className="flex gap-2">
                <span className="w-8 text-xs text-neutral-500 pt-2">
                  {lang === "en" ? "EN" : lang === "es" ? "ES" : lang === "fr" ? "FR" : "AR"}
                </span>
                <textarea
                  value={description[lang] || ""}
                  onChange={(e) => handleDescriptionChange(lang, e.target.value)}
                  placeholder={`Description in ${lang === "en" ? "English" : lang === "es" ? "Spanish" : lang === "fr" ? "French" : "Arabic"}`}
                  rows={2}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-barn-500 focus:border-barn-500 transition-colors text-sm resize-none"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm">
            <Check className="h-4 w-4" />
            Video submitted successfully! It will appear after approval.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !videoUrl.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-barn-600 text-white font-semibold hover:bg-barn-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Video"
          )}
        </button>
      </form>
    </div>
  );
}

export default VideoSubmit;
