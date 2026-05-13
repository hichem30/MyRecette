import { Link } from "@/lib/i18n/navigation";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "light" ? "text-white" : "text-barn-700";
  const sub = variant === "light" ? "text-white/70" : "text-neutral-500";
  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="Red Barn Western Market home">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-barn-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`font-serif text-lg font-bold ${text}`}>Red Barn</span>
        <span className={`text-[10px] tracking-widest ${sub}`}>WESTERN MARKET</span>
      </span>
    </Link>
  );
}
