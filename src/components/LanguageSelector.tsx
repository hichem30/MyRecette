"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/lib/fr";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { useTransition } from "react";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function setLocale(next: "en" | "es") {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide hover:border-barn-600 hover:text-barn-700 transition ${
          compact ? "" : ""
        }`}
        onClick={() => setLocale(locale === "en" ? "es" : "en")}
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        {locale === "en" ? "EN" : "ES"}
      </button>
    </div>
  );
}
