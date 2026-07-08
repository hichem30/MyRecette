import { Award, Headphones, Lock, Truck } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LoginCard } from "@/components/LoginCard";

// LoginCard handles all dynamic state client-side; the page shell is fully
// static so it ships from CDN with zero worker CPU.
export const dynamic = "force-static";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("login");

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="container-page flex flex-col items-center py-10">
        <LoginCard />

        <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
          {[
            { Icon: Award, label: t("trustedQuality") },
            { Icon: Truck, label: t("fastDelivery") },
            { Icon: Headphones, label: t("ranchSupport") },
            { Icon: Lock, label: t("securePrivate") },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-xs text-neutral-500">
              <Icon className="h-4 w-4 text-barn-600" />
              {label}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} sucre et sel · All rights reserved.
        </p>
      </div>
    </section>
  );
}
