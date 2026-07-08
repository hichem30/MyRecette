import type { Metadata } from "next";
import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import Link from "next/link";
import { FileText, User, ShoppingCart, CreditCard, Store, ShieldCheck, Database, Calendar, Mail } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true;

const termsSections = [
  {
    id: "acceptance",
    icon: FileText,
    titleKey: "acceptanceTitle",
    contentKey: "acceptanceContent",
  },
  {
    id: "changes",
    icon: Calendar,
    titleKey: "changesTitle",
    contentKey: "changesContent",
  },
  {
    id: "user-responsibilities",
    icon: User,
    titleKey: "userResponsibilitiesTitle",
    contentKey: "userResponsibilitiesContent",
  },
  {
    id: "prohibited",
    icon: ShieldCheck,
    titleKey: "prohibitedTitle",
    contentKey: "prohibitedContent",
  },
  {
    id: "purchases",
    icon: ShoppingCart,
    titleKey: "purchasesTitle",
    contentKey: "purchasesContent",
  },
  {
    id: "payments",
    icon: CreditCard,
    titleKey: "paymentsTitle",
    contentKey: "paymentsContent",
  },
  {
    id: "supermarket-subscriptions",
    icon: Store,
    titleKey: "supermarketSubscriptionsTitle",
    contentKey: "supermarketSubscriptionsContent",
  },
  {
    id: "content",
    icon: Database,
    titleKey: "contentTitle",
    contentKey: "contentContent",
  },
  {
    id: "termination",
    icon: ShieldCheck,
    titleKey: "terminationTitle",
    contentKey: "terminationContent",
  },
  {
    id: "disclaimer",
    icon: ShieldCheck,
    titleKey: "disclaimerTitle",
    contentKey: "disclaimerContent",
  },
  {
    id: "liability",
    icon: ShieldCheck,
    titleKey: "liabilityTitle",
    contentKey: "liabilityContent",
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
  const t = await getTranslations({ locale, namespace: "terms" });
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");
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
            <FileText className="h-10 w-10 text-recette-700" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="mt-2 text-neutral-500">
            {t("lastUpdated")} {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
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
              {termsSections.map((section, index) => (
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

        {/* Terms Sections */}
        <div className="space-y-12">
          {termsSections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative inline-flex items-center justify-center h-12 w-12 rounded-full bg-recette-100 flex-shrink-0">
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

        {/* sucre et sel Specific Section */}
        <section className="mt-12 p-6 rounded-lg bg-recette-50 border border-recette-200">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-recette-700 flex-shrink-0">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-3">{t("myRecetteTitle")}</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
                <p>{t("myRecetteContent")}</p>
                <ul>
                  <li>{t("myRecetteFeature1")}</li>
                  <li>{t("myRecetteFeature2")}</li>
                  <li>{t("myRecetteFeature3")}</li>
                  <li>{t("myRecetteFeature4")}</li>
                </ul>
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
