"use client";

import { Check, Copy, Facebook, Mail, MessageCircle, Share2, Twitter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ProductShare({ product }: { product: Product }) {
  const locale = useLocale() as "en" | "es";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [url, setUrl] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const title = `${product.name[locale]} — ${formatPrice(product.price)}`;
  const text =
    locale === "en"
      ? `Check out ${product.name.en} at Red Barn Western Market`
      : `Mira ${product.name.es} en Red Barn Western Market`;

  async function nativeShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title, text, url });
      setOpen(false);
    } catch {
      /* user cancelled */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not allowed */
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const channels: Array<{ name: string; href: string; icon: React.ElementType; className: string }> = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
      className: "text-[#1877F2] hover:bg-[#1877F2]/10",
    },
    {
      name: "Messenger",
      href: `https://www.facebook.com/dialog/send?app_id=140586622674265&link=${encodedUrl}&redirect_uri=${encodedUrl}`,
      icon: MessageCircle,
      className: "text-[#00B2FF] hover:bg-[#00B2FF]/10",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: MessageCircle,
      className: "text-[#25D366] hover:bg-[#25D366]/10",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      icon: Twitter,
      className: "text-neutral-700 hover:bg-neutral-100",
    },
    {
      name: locale === "en" ? "Email" : "Correo",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A${encodedUrl}`,
      icon: Mail,
      className: "text-neutral-700 hover:bg-neutral-100",
    },
  ];

  return (
    <div className="relative inline-flex flex-none" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:text-barn-700"
        aria-label={locale === "en" ? "Share" : "Compartir"}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl"
        >
          {canNativeShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              <Share2 className="h-4 w-4" />
              {locale === "en" ? "Share via…" : "Compartir vía…"}
            </button>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">{locale === "en" ? "Link copied!" : "¡Enlace copiado!"}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {locale === "en" ? "Copy link" : "Copiar enlace"}
              </>
            )}
          </button>
          <div className="my-1 border-t border-neutral-100" />
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${c.className}`}
              >
                <Icon className="h-4 w-4" />
                {c.name}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
