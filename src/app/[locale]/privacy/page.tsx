import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { ShieldCheck, Eye, Lock, Database, Mail, Cookie, Globe, Calendar, User, Store } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true;

const privacySections = [
  {
    id: "information",
    icon: Database,
    titleKey: "informationTitle",
    contentKey: "informationContent",
  },
  {
    id: "data",
    icon: Lock,
    titleKey: "dataTitle",
    contentKey: "dataContent",
  },
  {
    id: "cookies",
    icon: Cookie,
    titleKey: "cookiesTitle",
    contentKey: "cookiesContent",
  },
  {
    id: "third-party",
    icon: Globe,
    titleKey: "thirdPartyTitle",
    contentKey: "thirdPartyContent",
  },
  {
    id: "security",
    icon: ShieldCheck,
    titleKey: "securityTitle",
    contentKey: "securityContent",
  },
  {
    id: "rights",
    icon: User,
    titleKey: "rightsTitle",
    contentKey: "rightsContent",
  },
  {
    id: "changes",
    icon: Calendar,
    titleKey: "changesTitle",
    contentKey: "changesContent",
  },
  {
    id: "contact",
    icon: Mail,
    titleKey: "contactTitle",
    contentKey: "contactContent",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const tC = await getTranslations("common");

  const lastUpdated = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-recette-100 mb-6">
            <ShieldCheck className="h-10 w-10 text-recette-700" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="mt-2 text-neutral-500">
            {t("lastUpdated")} {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("introTitle")}</h2>
          <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
            <p>{t("introParagraph1")}</p>
            <p>{t("introParagraph2")}</p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("contentsTitle")}</h2>
          <div className="not-prose">
            <ol className="space-y-2">
              {privacySections.map((section, index) => (
                <li key={section.id}>
                  <Link
                    href={`#${section.id}`}
                    className="text-recette-600 hover:text-recette-700 hover:underline"
                  >
                    {index + 1}. {t(section.titleKey)}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Privacy Sections */}
        <div className="space-y-12">
          {privacySections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-recette-100 flex-shrink-0">
                  <section.icon className="h-6 w-6 text-recette-700" />
                  <span className="absolute text-xs font-bold text-recette-600">{index + 1}</span>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-3">
                    {index + 1}. {t(section.titleKey)}
                  </h2>
                  <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
                    <p>{t(section.contentKey)}</p>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Supermarket-Specific Section */}
        <section className="mt-12 p-6 rounded-lg bg-recette-50 border border-recette-200">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-recette-700 flex-shrink-0">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-3">{t("supermarketTitle")}</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
                <p>{t("supermarketContent")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 p-6 rounded-lg border border-neutral-200">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("questionsTitle")}</h2>
          <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
            <p>{t("questionsContent")}</p>
            <div className="not-prose">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-recette-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-recette-700 transition"
              >
                <Mail className="h-4 w-4" />
                {t("contactUs")}
              </Link>
            </div>
          </div>
        </section>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 text-sm text-recette-600 hover:text-recette-700"
          >
            ↑ {t("backToTop")}
          </button>
        </div>
      </div>
    </div>
  );
}


