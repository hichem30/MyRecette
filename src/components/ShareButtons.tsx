"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/fr";
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle, Linkedin, Mail, Image } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  showLabel?: boolean;
  platforms?: ("facebook" | "twitter" | "whatsapp" | "pinterest" | "linkedin" | "email" | "copy")[];
}

/**
 * ShareButtons - Social sharing buttons for recipes, videos, and other content
 * Supports multiple platforms with proper URL encoding
 */
export default function ShareButtons({
  url,
  title = "",
  description = "",
  imageUrl,
  className = "",
  showLabel = false,
  platforms = ["facebook", "twitter", "whatsapp", "copy"],
}: ShareButtonsProps) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  // Social platform share URLs
  const getShareUrl = (platform: string) => {
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${encodedDescription ? ` ${encodedDescription}` : ""}`;
      case "whatsapp":
        return `https://wa.me/?text=${encodedTitle}${encodedDescription ? ` - ${encodedDescription}` : ""} ${url}`;
      case "pinterest":
        return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${imageUrl || encodedUrl}&description=${encodedTitle}`;
      case "linkedin":
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}&source=${url}`;
      case "email":
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription || url}`;
      default:
        return url;
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  // Open share window
  const openShareWindow = (shareUrl: string, platform: string) => {
    // For email, use mailto which is handled by email clients
    if (platform === "email") {
      window.location.href = shareUrl;
      return;
    }

    // For other platforms, open in new window
    window.open(
      shareUrl,
      `_blank_${platform}`,
      "width=600,height=400,top=100,left=100,scrollbars=yes,resizable=yes"
    );
  };

  // Platform icons and labels
  const platformConfigs = {
    facebook: { icon: Facebook, label: "Facebook", color: "text-blue-600" },
    twitter: { icon: Twitter, label: "Twitter", color: "text-sky-500" },
    whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-green-500" },
    pinterest: { icon: Image, label: "Pinterest", color: "text-red-600" },
    linkedin: { icon: Linkedin, label: "LinkedIn", color: "text-blue-700" },
    email: { icon: Mail, label: "Email", color: "text-gray-600" },
    copy: { icon: copied ? Check : Copy, label: t("copyLink"), color: "text-gray-600" },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {platforms.map((platform) => {
        const config = platformConfigs[platform as keyof typeof platformConfigs];
        const Icon = config.icon;

        // Special handling for copy button
        if (platform === "copy") {
          return (
            <button
              key={platform}
              type="button"
              onClick={handleCopy}
              className={`
                flex items-center gap-1 p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors duration-200
                ${config.color}
              `}
              aria-label={config.label}
              title={config.label}
            >
              <Icon className="w-5 h-5" />
              {showLabel && (
                <span className="text-sm font-medium">{config.label}</span>
              )}
            </button>
          );
        }

        return (
          <button
            key={platform}
            type="button"
            onClick={() => openShareWindow(getShareUrl(platform), platform)}
            className={`
              flex items-center gap-1 p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200
              ${config.color}
            `}
            aria-label={config.label}
            title={config.label}
          >
            <Icon className="w-5 h-5" />
            {showLabel && (
              <span className="text-sm font-medium">{config.label}</span>
            )}
          </button>
        );
      })}

      {/* Native share button for mobile devices */}
      {typeof window !== "undefined" && navigator.share && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.share({
                title,
                text: description,
                url,
              });
            } catch (error) {
              console.log("Share cancelled or failed:", error);
            }
          }}
          className={`
            flex items-center gap-1 p-2 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
            text-gray-600 dark:text-gray-400
          `}
          aria-label="Share"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
          {showLabel && <span className="text-sm font-medium">Share</span>}
        </button>
      )}
    </div>
  );
}

// Individual share button component
export function ShareButton({
  platform,
  url,
  title,
  className = "",
  showLabel = false,
}: {
  platform: "facebook" | "twitter" | "whatsapp" | "pinterest" | "linkedin" | "email" | "copy";
  url: string;
  title?: string;
  className?: string;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const getIcon = () => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "whatsapp":
        return <MessageCircle className="w-5 h-5" />;
      case "pinterest":
        return <Image className="w-5 h-5" />;
      case "linkedin":
        return <Linkedin className="w-5 h-5" />;
      case "email":
        return <Mail className="w-5 h-5" />;
      case "copy":
        return copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />;
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (platform) {
      case "facebook":
        return "Facebook";
      case "twitter":
        return "Twitter";
      case "whatsapp":
        return "WhatsApp";
      case "pinterest":
        return "Pinterest";
      case "linkedin":
        return "LinkedIn";
      case "email":
        return "Email";
      case "copy":
        return "Copy Link";
      default:
        return "Share";
    }
  };

  const handleClick = () => {
    if (platform === "copy") {
      handleCopy();
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=${title || ""}&body=${url}`;
    } else {
      const shareUrl = getShareUrl(platform, url, title || "");
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const getShareUrl = (platform: string, url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case "whatsapp":
        return `https://wa.me/?text=${encodedTitle} ${url}`;
      case "pinterest":
        return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
      case "linkedin":
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
      default:
        return url;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        flex items-center gap-1 p-2 rounded-lg
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors duration-200
        ${className}
      `}
      aria-label={getLabel()}
    >
      {getIcon()}
      {showLabel && <span className="text-sm font-medium">{getLabel()}</span>}
    </button>
  );
}