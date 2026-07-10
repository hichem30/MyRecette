import Image from "next/image";
import { useLocale, useTranslations } from "@/lib/fr";
import { ArrowRight, Grid3x3 } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category, productCount }: { category: Category; productCount: number }) {
  const locale = useLocale() as "en" | "es";
  const t = useTranslations("common");

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-card transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name?.[locale] || category.name?.en || category.name?.es || "Category"}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold tracking-wide text-neutral-700 shadow">
          {category.item_count ?? "—"}+ {t("items")}
        </div>
        <div className="absolute left-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-recette-700 shadow">
          <Grid3x3 className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-base font-bold text-neutral-900 group-hover:text-recette-700">
          {category.name[locale]}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            {productCount} {t("products")}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-recette-600">
            {t("browseCategory")} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
