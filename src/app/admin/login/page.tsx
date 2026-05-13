"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. See README.md.",
      );
      setSubmitting(false);
      return;
    }
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.replace("/admin");
    setSubmitting(false);
  }

  async function provider(p: "google" | "facebook") {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: p,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-xs text-neutral-500 hover:text-barn-700">← Back to store</Link>
        <h1 className="mt-3 font-serif text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to manage Red Barn Western Market.</p>

        <div className="mt-5 space-y-2">
          <button onClick={() => provider("google")} className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:border-neutral-400">
            Continue with Google
          </button>
          <button onClick={() => provider("facebook")} className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:border-neutral-400">
            Continue with Facebook
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" /> or with email <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={signIn} className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 focus-within:border-barn-600">
            <Mail className="h-4 w-4 text-neutral-400" />
            <input name="email" type="email" required placeholder="admin@redbarnwesternmarket.com" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 focus-within:border-barn-600">
            <Lock className="h-4 w-4 text-neutral-400" />
            <input name="password" type="password" required placeholder="••••••••" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-barn-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-barn-700 disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <p className="mt-4 text-center text-xs text-neutral-400">
          First time? Sign up with an OAuth provider above — then run the SQL in README.md
          to promote yourself to <code>admin</code>.
        </p>
      </div>
    </div>
  );
}
