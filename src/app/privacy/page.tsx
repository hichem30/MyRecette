import type { Metadata } from "next";
import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import Link from "next/link";
import { ShieldCheck, Eye, Lock, Database, Mail, Cookie, Globe, Calendar, User, Store, ArrowUp } from "lucide-react";
import { BackToTopButton } from "@/components/BackToTopButton";

export const revalidate = 3600;
export const dynamicParams = true;

const privacySections = [
  {
    id: "information",
    icon: Database,
    titleKey: "privacy.informationTitle",
    contentKey: "privacy.informationContent",
  },
  {
    id: "data",
    icon: Lock,
    titleKey: "privacy.dataTitle",
    contentKey: "privacy.dataContent",
  },
  {
    id: "cookies",
    icon: Cookie,
    titleKey: "privacy.cookiesTitle",
    contentKey: "privacy.cookiesContent",
  },
  {
    id: "third-party",
    icon: Globe,
    titleKey: "privacy.thirdPartyTitle",
    contentKey: "privacy.thirdPartyContent",
  },
  {
    id: "security",
    icon: ShieldCheck,
    titleKey: "privacy.securityTitle",
    contentKey: "privacy.securityContent",
  },
  {
    id: "rights",
    icon: User,
    titleKey: "privacy.rightsTitle",
    contentKey: "privacy.rightsContent",
  },
  {
    id: "changes",
    icon: Calendar,
    titleKey: "privacy.changesTitle",
    contentKey: "privacy.changesContent",
  },
  {
    id: "contact",
    icon: Mail,
    titleKey: "privacy.contactTitle",
    contentKey: "privacy.contactContent",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
  };
}

export default async function PrivacyPage() {

  const lastUpdated = new Date().toLocaleDateString('fr-FR', {
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
          <h1 className="font-serif text-4xl font-bold text-neutral-900">{t("privacy.title")}</h1>
          <p className="mt-2 text-neutral-500">
            {t("privacy.lastUpdated")} {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("privacy.introTitle")}</h2>
          <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
            <p>{t("privacy.introParagraph1")}</p>
            <p>{t("privacy.introParagraph2")}</p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("privacy.contentsTitle")}</h2>
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
              <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-3">{t("privacy.supermarketTitle")}</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
                <p>{t("privacy.supermarketContent")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 p-6 rounded-lg border border-neutral-200">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-4">{t("privacy.questionsTitle")}</h2>
          <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
            <p>{t("privacy.questionsContent")}</p>
            <div className="not-prose">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-recette-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-recette-700 transition"
              >
                <Mail className="h-4 w-4" />
                {t("privacy.contactUs")}
              </Link>
            </div>
          </div>
        </section>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <BackToTopButton text={t("privacy.backToTop")} />
        </div>
      </div>
    </div>
  );
}


