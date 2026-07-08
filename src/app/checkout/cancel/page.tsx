import { XCircle } from "lucide-react";
import { t } from "@/lib/fr";
import Link from "next/link";

export default async function CancelPage() {
  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <XCircle className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-bold">{t("checkout.cancel")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">{t("checkout.cancelBody")}</p>
      <Link
        href="/products"
        className="mt-6 rounded-md bg-recette-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-recette-700"
      >
        {t("common.continueShopping")}
      </Link>
    </section>
  );
}
