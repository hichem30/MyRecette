import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import { Clock, Mail, MapPin, Phone, Facebook } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { BulkQuoteForm } from "@/components/BulkQuoteForm";

// Static content + client-rendered forms — pre-render the shell at build
// time, no worker invocation per visit.
export const dynamic = "force-static";

export default async function ContactPage() {
  return (
    <>
      <PageHeader title={t("contact.title")} subtitle={t("contact.subtitle")} eyebrow={t("nav.contact")} />

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <h2 className="font-serif text-2xl font-bold text-neutral-900">{t("contact.weAreHere")}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t("contact.weAreHereBody")}</p>

            <ul className="mt-6 space-y-5 text-sm">
              <ContactRow Icon={Phone} label={t("contact.phone")}>
                <a href="tel:+33123456789" className="hover:text-recette-700">+33 1 23 45 67 89</a>
              </ContactRow>
              <ContactRow Icon={Mail} label={t("contact.email")}>
                <a href="mailto:hello@myrecette.com" className="break-all hover:text-recette-700">
                  hello@myrecette.com
                </a>
              </ContactRow>
              <ContactRow Icon={MapPin} label={t("contact.address")}>Paris, France</ContactRow>
              <ContactRow Icon={Clock} label={t("contact.hoursLabel")}>{t("contact.hours")}</ContactRow>
            </ul>

            <p className="mt-8 text-xs font-bold tracking-widest text-neutral-500">{t("contact.followUs")}</p>
            <div className="mt-2 flex gap-2">
              <a
                href="https://facebook.com/myrecetteapp"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-recette-600 hover:text-recette-700"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <BulkQuoteForm />
    </>
  );
}

function ContactRow({
  Icon,
  label,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-recette-50 text-recette-700">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</p>
        <p className="text-neutral-800">{children}</p>
      </div>
    </li>
  );
}
