import Link from "next/link";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "light" ? "text-white" : "text-barn-700";
  const sub = variant === "light" ? "text-white/70" : "text-neutral-500";
  return (
    <Link href="/" className="flex items-center gap-2 group min-w-0" aria-label="sucre et sel home">
      <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-lg bg-barn-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" aria-hidden>
          <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`font-serif text-base sm:text-lg font-bold whitespace-nowrap ${text}`}>sucre et sel</span>
        <span className={`text-[9px] sm:text-[10px] tracking-widest whitespace-nowrap ${sub}`}></span>
      </span>
    </Link>
  );
}
