"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginCard() {
  const t = useTranslations("login");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [marketingOptin, setMarketingOptin] = useState(false);

  async function signInWithProvider(provider: "google") {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setSubmitting(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (mode === "sign_in") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        const userId = data.user?.id;
        let dest = "/";
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();
          if (profile?.role === "admin") dest = "/admin";
        }
        window.location.href = dest;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { marketing_optin: marketingOptin },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        // Best-effort update in case the auto-profile trigger doesn't pick up
        // the marketing flag from user metadata yet.
        if (data.user?.id && marketingOptin) {
          await supabase
            .from("profiles")
            .update({ marketing_optin: true })
            .eq("id", data.user.id);
        }
        setInfo("Account created — check your email to confirm.");
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-card sm:p-8">
      <h1 className="font-serif text-3xl font-bold text-neutral-900">
        {mode === "sign_in" ? t("welcome") : t("signUp")} <span>{t("wave")}</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

      <div className="mt-6 space-y-2.5">
        <ProviderButton onClick={() => signInWithProvider("google")} label={t("continueGoogle")}>
          <GoogleIcon />
        </ProviderButton>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200" />
        {t("continueWith")}
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-neutral-700">{t("email")}</span>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 focus-within:border-barn-600">
            <Mail className="h-4 w-4 text-neutral-400" />
            <input name="email" type="email" required placeholder={t("emailPlaceholder")} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">{t("password")}</span>
            <a href="#" className="text-xs font-semibold text-barn-600 hover:underline">{t("forgotPassword")}</a>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 focus-within:border-barn-600">
            <Lock className="h-4 w-4 text-neutral-400" />
            <input name="password" type={showPw ? "text" : "password"} required placeholder="••••••••" className="flex-1 bg-transparent text-sm outline-none" />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input type="checkbox" className="rounded border-neutral-300 accent-barn-600" />
          {t("rememberMe")}
        </label>

        {mode === "sign_up" && (
          <label className="flex items-start gap-2 rounded-md border border-barn-200 bg-barn-50/50 px-3 py-2.5 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={marketingOptin}
              onChange={(e) => setMarketingOptin(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none rounded border-neutral-300 accent-barn-600"
            />
            <span className="font-medium">{t("marketingOptin")}</span>
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-barn-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-barn-700 transition disabled:opacity-50"
        >
          {mode === "sign_in" ? t("signIn") : t("signUp")}
        </button>
      </form>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{info}</p>}

      <p className="mt-5 text-center text-sm text-neutral-600">
        {mode === "sign_in" ? t("noAccount") : t("haveAccount")}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
          className="font-bold text-barn-600 hover:underline"
        >
          {mode === "sign_in" ? t("signUp") : t("signIn")}
        </button>
      </p>

    </div>
  );
}

function ProviderButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:border-neutral-400 transition"
    >
      {children}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.3 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.3 29.5 4 24 4 16 4 9 8.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.3-8L6 32.6C8.7 39 15.8 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 5.9l6.5 5.4C40.3 36.5 44 30.7 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

