import { XCircle } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <XCircle className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("cancel")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">{t("cancelBody")}</p>
      <Link
        href="/products"
        className="mt-6 rounded-md bg-recette-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-recette-700"
      >
        {locale === "en" ? "Continue Shopping" : "Seguir Comprando"}
      </Link>
    </section>
  );
}
