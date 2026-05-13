"use client";

import { Clock, DollarSign, FileText, Phone, Truck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function BulkQuoteForm() {
  const t = useTranslations("bulk");
  const tC = useTranslations("common");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/bulk-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-neutral-900 py-14 text-white">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {t("badge")}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-white/80">{t("body")}</p>

          <ul className="mt-6 space-y-4">
            {[
              { Icon: DollarSign, title: t("volumePricing"), body: t("volumePricingBody") },
              { Icon: Truck, title: t("jobSite"), body: t("jobSiteBody") },
              { Icon: User, title: t("dedicated"), body: t("dedicatedBody") },
              { Icon: Clock, title: t("fastTurnaround"), body: t("fastTurnaroundBody") },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md bg-white/10 text-amber-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{t("urgent")}</p>
            <p className="mt-1 text-lg font-bold">+1 (918) 245‑8112</p>
            <p className="text-xs text-white/70">{t("urgentBody")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 text-neutral-900 shadow-2xl sm:p-8">
          <h3 className="font-serif text-xl font-bold">{t("requestQuote")}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t("requestQuoteBody")}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label={`${t("company")} *`}>
              <input name="company" required placeholder="Smith Contracting LLC" className="bk-input" />
            </Field>
            <Field label={`${t("contactPerson")} *`}>
              <input name="contact" required placeholder="John Smith" className="bk-input" />
            </Field>
            <Field label={`${t("email")} *`}>
              <input name="email" type="email" required placeholder="john@smithcontracting.com" className="bk-input" />
            </Field>
            <Field label={`${t("phone")} *`}>
              <input name="phone" required placeholder="+1 (918) 000‑0000" className="bk-input" />
            </Field>
          </div>

          <Field label={`${t("projectType")} *`} className="mt-4">
            <input name="project_type" required className="bk-input" />
          </Field>

          <Field label={`${t("estQty")} *`} className="mt-4">
            <input name="estimated_quantity" required placeholder={t("estQtyHelp")} className="bk-input" />
          </Field>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold text-neutral-700">{t("delivery")} *</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:border-barn-600">
                <input type="radio" name="delivery" value="deliver" required className="accent-barn-600" />
                {t("deliverYes")}
              </label>
              <label className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:border-barn-600">
                <input type="radio" name="delivery" value="pickup" required className="accent-barn-600" />
                {t("deliverNo")}
              </label>
            </div>
          </fieldset>

          <Field label={`${t("timeline")} *`} className="mt-4">
            <select name="timeline" required className="bk-input">
              <option value="">—</option>
              <option value="asap">ASAP (1‑3 days)</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="flexible">Flexible</option>
            </select>
          </Field>

          <Field label={t("notes")} className="mt-4">
            <textarea name="notes" rows={4} maxLength={500} placeholder={t("notesPlaceholder")} className="bk-input resize-none" />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            {submitting ? tC("submitting") : t("submit")}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-neutral-500">
            {t("responseTime")} <a href="tel:+19182458112" className="font-semibold text-barn-700"><Phone className="inline h-3 w-3" /> +1 (918) 245‑8112</a>
          </p>

          {status === "success" && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{t("successMessage")}</p>
          )}
          {status === "error" && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{tC("noResults")}</p>
          )}

          <style jsx>{`
            :global(.bk-input) {
              width: 100%;
              border-radius: 0.375rem;
              border: 1px solid rgb(212 212 212);
              background: white;
              padding: 0.625rem 0.75rem;
              font-size: 0.875rem;
            }
            :global(.bk-input:focus) {
              outline: 2px solid rgb(168 53 31 / 0.4);
              border-color: rgb(168 53 31);
            }
          `}</style>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
