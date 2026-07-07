"use client";

import { useState } from "react";
import { Share2, Check, Copy, Facebook, Twitter, MessageCircle, Linkedin, Mail } from "lucide-react";
import type { SocialPlatform, SocialShareData } from "@/lib/types";

interface SocialShareProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
}

// Social platform share URLs
const getSocialShareUrl = (
  platform: SocialPlatform,
  data: { url: string; title?: string; description?: string; imageUrl?: string }
): string => {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title || "");
  const encodedDescription = encodeURIComponent(data.description || "");
  const encodedImage = encodeURIComponent(data.imageUrl || "");

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${encodedDescription ? ` ${encodedDescription}` : ""}`;
    case "messageCircle":
      return `https://wa.me/?text=${encodedTitle} ${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedDescription} ${encodedUrl}`;
    default:
      return encodedUrl;
  }
};

// Platform icons and colors
const platformConfig: Record<SocialPlatform, { icon: React.ReactNode; color: string; label: string }> = {
  facebook: { icon: <Facebook className="h-5 w-5" />, color: "bg-[#1877F2] hover:bg-[#166FE5]", label: "Facebook" },
  twitter: { icon: <Twitter className="h-5 w-5" />, color: "bg-[#1DA1F2] hover:bg-[#1A8CD8]", label: "Twitter" },
  messageCircle: { icon: <MessageCircle className="h-5 w-5" />, color: "bg-[#25D366] hover:bg-[#128C7E]", label: "WhatsApp" },
  linkedin: { icon: <Linkedin className="h-5 w-5" />, color: "bg-[#0A66C2] hover:bg-[#0850A0]", label: "LinkedIn" },
  email: { icon: <Mail className="h-5 w-5" />, color: "bg-neutral-700 hover:bg-neutral-800", label: "Email" },
};

const platforms: SocialPlatform[] = ["facebook", "twitter", "messageCircle", "linkedin", "email"];

export function SocialShare({ url, title, description, imageUrl, className = "" }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareData: SocialShareData = {
    platform: "facebook",
    url,
    title,
    description,
    imageUrl,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async (platform: SocialPlatform) => {
    if (platform === "email" || platform === "messageCircle") {
      // For mobile, open directly
      const shareUrl = getSocialShareUrl(platform, shareData);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // For web share API (Chrome, Edge, etc.)
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: title || "My Recette",
          text: description || "Check out this recipe!",
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fallback to opening share URL
      const shareUrl = getSocialShareUrl(platform, shareData);
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors"
        disabled={isSharing}
      >
        <Share2 className="h-5 w-5" />
        Share
      </button>

      {/* Share Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <h4 className="font-semibold text-neutral-900">Share Recipe</h4>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-left">{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          {/* Social Platforms */}
          <div className="px-4 py-2">
            <p className="text-xs text-neutral-500 mb-2">Share to</p>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((platform) => {
                const { icon, color, label } = platformConfig[platform];
                return (
                  <button
                    key={platform}
                    onClick={() => handleShare(platform)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg ${color} text-white hover:opacity-90 transition-opacity`}
                    title={label}
                  >
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default SocialShare;
