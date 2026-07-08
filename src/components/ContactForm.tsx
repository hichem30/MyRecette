"use client";

import { Send } from "lucide-react";
import { useTranslations } from "@/lib/fr";
import { useState } from "react";

export function ContactForm() {
  const t = useTranslations("contact");
  const tC = useTranslations("common");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [chars, setChars] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("success");
      form.reset();
      setChars(0);
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8">
      <h3 className="font-serif text-xl font-bold">{t("sendMessage")}</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t("yourName")}>
          <input name="name" required placeholder="Jane Smith" className="input" />
        </Field>
        <Field label={t("yourEmail")}>
          <input name="email" type="email" required placeholder="jane@example.com" className="input" />
        </Field>
      </div>

      <Field label={`${t("yourMessage")}  ${chars}/500`} className="mt-4">
        <textarea
          name="message"
          required
          maxLength={500}
          rows={5}
          onChange={(e) => setChars(e.target.value.length)}
          placeholder={t("messagePlaceholder")}
          className="input resize-none"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-barn-600 px-4 py-3 text-sm font-bold text-white hover:bg-barn-700 transition disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? tC("submitting") : t("send")}
      </button>

      {status === "success" && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{t("successMessage")}</p>
      )}
      {status === "error" && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{t("errorMessage")}</p>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(212 212 212);
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: 2px solid rgb(168 53 31 / 0.4);
          border-color: rgb(168 53 31);
        }
      `}</style>
    </form>
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
