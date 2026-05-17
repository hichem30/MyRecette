"use client";

import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Package2,
  Search,
  Settings,
  ShoppingBag,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", Icon: Package },
      { href: "/admin/categories", label: "Categories", Icon: Tags },
      { href: "/admin/bundles", label: "Bundles", Icon: Package2 },
      { href: "/admin/promos", label: "Promo Codes", Icon: Ticket },
    ],
  },
  {
    label: "Sales",
    items: [{ href: "/admin/orders", label: "Orders", Icon: ShoppingBag }],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/messages", label: "Messages", Icon: Mail },
      { href: "/admin/quotes", label: "Quote Requests", Icon: MessageSquare },
      { href: "/admin/campaigns", label: "Campaigns", Icon: Megaphone },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/delivery", label: "Delivery Zones", Icon: MapPin },
      { href: "/admin/staff", label: "Staff", Icon: Users },
    ],
  },
];

function findCurrent(pathname: string): { group: string | null; item: NavItem | null } {
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.href === pathname) return { group: g.label, item: it };
    }
  }
  // Fall back to longest prefix match (deeper routes like /admin/products/abc)
  let best: { group: string; item: NavItem } | null = null;
  let bestLen = 0;
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.href !== "/admin" && pathname.startsWith(it.href) && it.href.length > bestLen) {
        best = { group: g.label, item: it };
        bestLen = it.href.length;
      }
    }
  }
  return best ?? { group: null, item: null };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "anon" | "non_admin" | "admin">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Don't auth-gate the login page
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("anon");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function loadRole() {
      // Canonical role check via /api/whoami — self-heals the bootstrap
      // owner email if the profile row drifted, and is resistant to any
      // RLS quirks because the server can fall back to the service role.
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        if (!res.ok) throw new Error(`whoami ${res.status}`);
        const me = (await res.json()) as {
          authenticated: boolean;
          email: string | null;
          isAdmin: boolean;
        };
        if (cancelled) return;
        if (!me.authenticated) {
          setStatus("anon");
          setEmail(null);
          return;
        }
        setEmail(me.email);
        setStatus(me.isAdmin ? "admin" : "non_admin");
      } catch {
        // Fall back to a direct lookup if /api/whoami is unreachable
        // (offline preview, etc.). Worst-case lands the user on /admin/login.
        const { data: userData } = await supabase.auth.getUser();
        if (cancelled) return;
        const user = userData.user;
        if (!user) {
          setStatus("anon");
          setEmail(null);
          return;
        }
        setEmail(user.email ?? null);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setStatus(profile?.role === "admin" ? "admin" : "non_admin");
      }
    }

    loadRole();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadRole();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLogin) return;
    if (status === "anon") router.replace("/admin/login");
    else if (status === "non_admin") router.replace("/");
  }, [status, isLogin, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Poll the unread-messages count for the sidebar badge. Only runs once
  // the user is confirmed admin so non-admins never trigger the query.
  useEffect(() => {
    if (status !== "admin") return;
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      try {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("read", false);
        if (!cancelled) setUnreadCount(count ?? 0);
      } catch {
        /* network blip — try again on the next tick */
      }
      if (!cancelled) timer = setTimeout(load, 30_000);
    }
    load();

    // Refresh immediately when the messages page reports a state change.
    function onUpdate() {
      load();
    }
    window.addEventListener("messages:read-changed", onUpdate);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("messages:read-changed", onUpdate);
    };
  }, [status, pathname]);

  async function signOut() {
    if (!isSupabaseConfigured()) {
      router.replace("/admin/login");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const current = useMemo(() => findCurrent(pathname), [pathname]);

  if (isLogin) return <>{children}</>;
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }
  if (status !== "admin") return null;

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-barn-600 text-sm font-bold text-white">
          RB
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-widest text-barn-600">Red Barn</p>
          <p className="text-sm font-semibold text-neutral-900">Admin Console</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {group.label}
            </p>
            {group.items.map(({ href, label, Icon }) => {
              const active =
                href === pathname || (href !== "/admin" && pathname.startsWith(href));
              const badge = href === "/admin/messages" && unreadCount > 0 ? unreadCount : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-barn-50 font-semibold text-barn-700"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-none ${active ? "text-barn-700" : "text-neutral-400"}`} />
                  <span className="truncate">{label}</span>
                  {badge > 0 && (
                    <span
                      className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-barn-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                      aria-label={`${badge} unread`}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-200 px-4 py-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
            {(email ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-neutral-800">{email ?? "Admin"}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">Owner</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            title="Open storefront in a new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-none border-r border-neutral-200 bg-white md:flex md:flex-col">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl md:hidden">
            {sidebar}
          </aside>
        </>
      )}

      {/* Right side: topbar + content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 md:hidden"
          >
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center gap-1.5 text-sm text-neutral-500">
            <Link href="/admin" className="hover:text-barn-700">Admin</Link>
            {current.group && current.item && current.item.href !== "/admin" && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
                <span className="text-neutral-400">{current.group}</span>
                <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
                <span className="font-semibold text-neutral-800">{current.item.label}</span>
              </>
            )}
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-400 sm:flex">
            <Search className="h-3.5 w-3.5" />
            <span>Quick search</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
