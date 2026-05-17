"use client";

import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, openCart, wishlist } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    function applyUser(user: { id?: string | null; email?: string | null; user_metadata?: Record<string, unknown> } | null) {
      if (cancelled) return;
      if (!user) {
        setAuthed(false);
        setIsAdmin(false);
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
      // Use the canonical /api/whoami endpoint so the admin badge picks
      // up the bootstrap owner email even if its profile.role somehow
      // drifted to 'user'.
      fetch("/api/whoami", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ isAdmin?: boolean }>)
        .then((me) => {
          if (cancelled) return;
          setIsAdmin(Boolean(me.isAdmin));
        })
        .catch(() => {
          /* keep current state on transient failure */
        });
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

  useEffect(() => {
    if (!userMenuOpen) return;
    function close(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userMenuOpen]);

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
          {/* Hide language toggle on mobile to free up space — it lives
              inside the hamburger drawer below. */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
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
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  isHome
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-neutral-300 text-neutral-700 hover:border-barn-600 hover:text-barn-700",
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate" title={displayName ?? ""}>
                  {displayName}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 w-52 rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-800 shadow-xl"
                >
                  <Link
                    href="/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    <User className="h-4 w-4" /> {t("account")}
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    <Package className="h-4 w-4" /> {t("myOrders")}
                  </Link>
                  <Link
                    href="/account/wishlist"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    <Heart className="h-4 w-4" /> {t("wishlist")}
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="my-1 border-t border-neutral-100" />
                      {/* /admin is not locale-prefixed; force a hard navigation
                          so the AdminShell layout (not LocaleLayout) takes over. */}
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md bg-barn-50 px-3 py-2 text-sm font-bold text-barn-700 hover:bg-barn-100"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </a>
                    </>
                  )}
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </button>
                </div>
              )}
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
            className="mx-auto flex max-w-3xl items-stretch gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
              setSearchOpen(false);
            }}
          >
            <div className="flex flex-1 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2">
              <Search className="h-4 w-4 flex-none text-neutral-400" />
              <input
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none text-neutral-800"
                autoFocus
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
            <div className="mt-2 flex items-center justify-between rounded-md px-3 py-2">
              <span className="text-sm font-medium text-neutral-700">{t("language")}</span>
              <LanguageSelector />
            </div>
            {authed ? (
              <>
                <div className="mt-2 border-t border-neutral-100 pt-2" />
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  <User className="h-4 w-4" /> {t("account")}
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  <Package className="h-4 w-4" /> {t("myOrders")}
                </Link>
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <User className="h-4 w-4" /> {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
