import { CheckCircle2 } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { CartClearOnMount } from "@/components/CartClearOnMount";

export default async function SuccessPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { email?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <CartClearOnMount />
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("success")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {t("successBody", { email: searchParams.email ?? "your inbox" })}
      </p>
      <Link
        href="/products"
        className="mt-6 rounded-md bg-barn-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-barn-700"
      >
        {locale === "en" ? "Continue Shopping" : "Seguir Comprando"}
      </Link>
    </section>
  );
}
