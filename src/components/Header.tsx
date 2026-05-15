"use client";

import { Heart, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { itemCount, openCart, wishlist } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    function applyUser(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
      if (cancelled) return;
      if (!user) {
        setAuthed(false);
        setDisplayName(null);
        return;
      }
      setAuthed(true);
      const meta = user.user_metadata ?? {};
      const fullName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      const first = fullName ? fullName.split(" ")[0] : null;
      setDisplayName(first ?? user.email ?? null);
    }

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const navItems = [
    { href: "/", key: "home" },
    { href: "/products", key: "products" },
    { href: "/deals", key: "deals" },
    { href: "/categories", key: "categories" },
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" },
  ] as const;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        isHome ? "bg-neutral-900/80 backdrop-blur text-white" : "bg-white shadow-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Logo variant={isHome ? "light" : "dark"} />

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition",
                  active
                    ? isHome
                      ? "bg-white/10 text-white"
                      : "bg-barn-50 text-barn-700"
                    : isHome
                      ? "text-white/80 hover:text-white"
                      : "text-neutral-700 hover:text-barn-700",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-none items-center gap-0.5 sm:gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("search")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
              isHome ? "text-white/80 hover:text-white" : "text-neutral-600 hover:text-barn-700",
            )}
          >
            <Search className="h-4 w-4" />
          </button>
          <LanguageSelector />
          <Link
            href="/wishlist"
            aria-label={t("wishlist")}
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition",
              isHome ? "text-white/80 hover:text-white" : "text-neutral-600 hover:text-barn-700",
            )}
          >
            <Heart className="h-4 w-4" />
            {wishlist.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-barn-600 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            onClick={openCart}
            aria-label={t("cart")}
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition",
              isHome ? "text-white/80 hover:text-white" : "text-neutral-600 hover:text-barn-700",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-barn-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
          {authed ? (
            <div
              className={cn(
                "hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                isHome
                  ? "border-white/30 text-white"
                  : "border-neutral-300 text-neutral-700",
              )}
            >
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate" title={displayName ?? ""}>
                {displayName}
              </span>
              <button
                onClick={handleSignOut}
                aria-label={t("logout")}
                className={cn(
                  "ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                  isHome ? "hover:bg-white/10" : "hover:bg-neutral-100 hover:text-barn-700",
                )}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isHome
                  ? "border-white/30 text-white hover:bg-white/10"
                  : "border-neutral-300 text-neutral-700 hover:border-barn-600 hover:text-barn-700",
              )}
            >
              <User className="h-3.5 w-3.5" />
              {t("login")}
            </Link>
          )}
          <button
            className={cn(
              "inline-flex md:hidden h-9 w-9 items-center justify-center rounded-md",
              isHome ? "text-white" : "text-neutral-700",
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-neutral-200 bg-white px-3 py-3 sm:px-6 lg:px-8">
          <form
            action="/products"
            method="GET"
            className="mx-auto flex max-w-3xl items-stretch gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2">
              <Search className="h-4 w-4 flex-none text-neutral-400" />
              <input
                name="q"
                placeholder={t("search")}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none text-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="flex-none rounded-full bg-barn-600 px-4 text-sm font-bold text-white hover:bg-barn-700"
              aria-label={t("search")}
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white shadow-lg">
          <div className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t(item.key)}
              </Link>
            ))}
            {authed ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700">
                  <User className="h-4 w-4" />
                  <span className="truncate">{displayName}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
