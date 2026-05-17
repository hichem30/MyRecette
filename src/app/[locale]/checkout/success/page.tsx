import { CheckCircle2 } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { CartClearOnMount } from "@/components/CartClearOnMount";
import { CheckoutSuccessRecorder } from "@/components/CheckoutSuccessRecorder";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const sessionId = sp.session_id ?? "";
  const email =
    sp.email && sp.email.includes("@")
      ? sp.email
      : locale === "en"
        ? "your inbox"
        : "su correo";

  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <CartClearOnMount />
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("success")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {t("successBody", { email })}
      </p>

      {sessionId && (
        <CheckoutSuccessRecorder sessionId={sessionId} locale={locale as "en" | "es"} />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:border-barn-600 hover:text-barn-700"
        >
          {locale === "en" ? "View my orders" : "Ver mis pedidos"}
        </Link>
        <Link
          href="/products"
          className="rounded-md bg-barn-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-barn-700"
        >
          {locale === "en" ? "Continue Shopping" : "Seguir Comprando"}
        </Link>
      </div>
    </section>
  );
}
