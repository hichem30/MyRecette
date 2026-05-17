"use client";

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Package2,
  ShoppingBag,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "anon" | "non_admin" | "admin">("loading");
  const [email, setEmail] = useState<string | null>(null);

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

  async function signOut() {
    if (!isSupabaseConfigured()) {
      router.replace("/admin/login");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (isLogin) return <>{children}</>;
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }
  if (status !== "admin") return null;

  const nav = [
    { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", Icon: Package },
    { href: "/admin/categories", label: "Categories", Icon: Tags },
    { href: "/admin/bundles", label: "Bundles", Icon: Package2 },
    { href: "/admin/promos", label: "Promo Codes", Icon: Ticket },
    { href: "/admin/orders", label: "Orders", Icon: ShoppingBag },
    { href: "/admin/messages", label: "Messages", Icon: Mail },
    { href: "/admin/quotes", label: "Quote Requests", Icon: MessageSquare },
    { href: "/admin/campaigns", label: "Campaigns", Icon: Megaphone },
    { href: "/admin/delivery", label: "Delivery Zones", Icon: MapPin },
    { href: "/admin/staff", label: "Staff", Icon: Users },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-none flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="border-b border-neutral-200 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-barn-600">Red Barn</p>
          <p className="text-sm font-bold text-neutral-900">Admin Console</p>
        </div>
        <nav className="flex-1 px-3 py-4">
          {nav.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-barn-50 text-barn-700"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 px-5 py-4">
          {email && <p className="mb-2 truncate text-xs text-neutral-500">{email}</p>}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </a>
          <button
            onClick={signOut}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
    </div>
  );
}
