import { CheckCircle2 } from "lucide-react";
import { t } from "@/lib/fr";
import Link from "next/link";
import { CartClearOnMount } from "@/components/CartClearOnMount";
import { CheckoutSuccessRecorder } from "@/components/CheckoutSuccessRecorder";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id ?? "";
  const email = sp.email && sp.email.includes("@") ? sp.email : t("login.email");

  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <CartClearOnMount />
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("checkout.success")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {t("checkout.successBody", { email })}
      </p>

      {sessionId && (
        <CheckoutSuccessRecorder sessionId={sessionId} locale={"fr"} />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:border-recette-600 hover:text-recette-700"
        >
          {t("account.orders")}
        </Link>
        <Link
          href="/products"
          className="rounded-md bg-recette-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-recette-700"
        >
          {t("common.continueShopping")}
        </Link>
      </div>
    </section>
  );
}
