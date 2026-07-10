"use client";

import { Heart, LogOut, ShoppingBag, User, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/fr";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AccountUser {
  email: string | null;
  name: string | null;
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as "en" | "es";
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "anon" | "user">("loading");
  const [user, setUser] = useState<AccountUser>({ email: null, name: null });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("anon");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    function applyUser(u: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
      if (cancelled) return;
      if (!u) {
        setStatus("anon");
        return;
      }
      const meta = u.user_metadata ?? {};
      const name =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      setUser({ email: u.email ?? null, name });
      setStatus("user");
    }

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => applyUser(session?.user ?? null));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "anon") {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [status, pathname, router]);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (status === "loading") {
    return (
      <div className="container-page py-16 text-center text-sm text-neutral-500">
        {locale === "en" ? "Loading…" : "Cargando…"}
      </div>
    );
  }
  if (status === "anon") return null;

  const nav: Array<{ href: string; label: string; icon: React.ElementType }> = [
    { href: "/account", label: locale === "en" ? "Profile" : "Perfil", icon: User },
    { href: "/account/orders", label: locale === "en" ? "Orders" : "Pedidos", icon: ShoppingBag },
    { href: "/account/wishlist", label: locale === "en" ? "Wishlist" : "Favoritos", icon: Heart },
    { href: "/account/favorites", label: locale === "en" ? "Favorite Recipes" : "Recetas Favoritas", icon: Star },
    { href: "/account/followed-supermarkets", label: locale === "en" ? "Followed Supermarkets" : "Supermercados Seguidos", icon: MapPin },
  ];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-4 border-b border-neutral-100 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {locale === "en" ? "Signed in as" : "Sesión iniciada como"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
              {user.name ?? user.email}
            </p>
            {user.name && user.email && (
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            )}
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-recette-50 text-recette-700"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <LogOut className="h-4 w-4" /> {locale === "en" ? "Sign out" : "Cerrar sesión"}
            </button>
          </nav>
        </aside>
        <main className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
