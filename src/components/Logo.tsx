import Link from "next/link";
import Image from "next/image";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "light" ? "text-white" : "text-recette-700";
  const sub = variant === "light" ? "text-white/70" : "text-neutral-500";
  return (
    <Link href="/" className="flex items-center gap-2 group min-w-0" aria-label="sucre et sel home">
      <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-lg bg-recette-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" aria-hidden>
          {/* Recipe book icon - represents recipe website */}
          <rect x="3" y="4" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1" />
          <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1" />
          <line x1="5" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1" />
          <rect x="17" y="4" width="1.5" height="16" rx="0.75" fill="currentColor"/>
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`font-serif text-base sm:text-lg font-bold whitespace-nowrap ${text}`}>sucre et sel</span>
        <span className={`text-[9px] sm:text-[10px] tracking-widest whitespace-nowrap ${sub}`}>Recettes & Courses</span>
      </span>
    </Link>
  );
}
