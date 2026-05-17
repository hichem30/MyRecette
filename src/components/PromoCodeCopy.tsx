"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function PromoCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for older browsers / restricted contexts.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-white px-3 py-1.5 font-mono text-base font-bold tracking-widest text-amber-800 hover:border-amber-600 hover:bg-amber-50"
      aria-label={`Copy promo code ${code}`}
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4 text-neutral-500 group-hover:text-amber-700" />
      )}
    </button>
  );
}
