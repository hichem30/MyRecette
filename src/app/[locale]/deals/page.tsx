import Image from "next/image";
import { Clock } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/ProductCard";
import { getDeals } from "@/lib/data";

export const revalidate = 60;

export default async function DealsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("deals");
  const deals = await getDeals();

  const maxOff = deals.reduce((acc, p) => {
    if (!p.original_price) return acc;
    const off = Math.round(((p.original_price - p.price) / p.original_price) * 100);
    return Math.max(acc, off);
  }, 0);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=2000&q=70"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
        </div>
        <div className="container-page py-16">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Clock className="h-3 w-3" /> {t("limitedTime")}
          </span>
          <h1 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-white/80">{t("subtitle")}</p>
          {maxOff > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-semibold">
              <span className="text-amber-300">%</span>
              {t("saveUpTo", { percent: maxOff })}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">
            {t("dealsAvailable", { count: deals.length })}
          </h2>
          <p className="text-xs text-neutral-500">{t("updatedDaily")}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
