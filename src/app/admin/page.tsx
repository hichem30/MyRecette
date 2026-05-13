"use client";

import { Mail, Package, ShoppingBag, Tags } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStats({ products: 0, orders: 0, revenue: 0, unreadMessages: 0 });
      return;
    }
    const sb = getSupabaseBrowserClient();
    Promise.all([
      sb.from("products").select("*", { count: "exact", head: true }),
      sb.from("orders").select("total_amount"),
      sb.from("messages").select("*", { count: "exact", head: true }).eq("read", false),
    ]).then(([prod, orders, msgs]) => {
      const revenue = (orders.data ?? []).reduce(
        (acc: number, o: { total_amount?: number }) => acc + (o.total_amount ?? 0),
        0,
      );
      setStats({
        products: prod.count ?? 0,
        orders: orders.data?.length ?? 0,
        revenue,
        unreadMessages: msgs.count ?? 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-neutral-500">Welcome to the Red Barn admin console.</p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Supabase not configured.</strong> Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then run the SQL
          migrations from <code>supabase/migrations/</code>. See <code>README.md</code> for the
          full guide.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={stats?.products ?? "—"} Icon={Package} />
        <StatCard label="Total Orders" value={stats?.orders ?? "—"} Icon={ShoppingBag} />
        <StatCard
          label="Total Revenue"
          value={
            stats ? `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"
          }
          Icon={Tags}
        />
        <StatCard label="Unread Messages" value={stats?.unreadMessages ?? "—"} Icon={Mail} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard href="/admin/products" title="Manage Products" body="Add, edit, or remove items from the store." />
        <ActionCard href="/admin/categories" title="Manage Categories" body="Organize the storefront catalog tree." />
        <ActionCard href="/admin/orders" title="View Orders" body="Inspect Stripe checkout sessions and payouts." />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-barn-50 text-barn-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-barn-600 hover:shadow-card"
    >
      <p className="text-sm font-bold text-neutral-900">{title}</p>
      <p className="mt-1 text-xs text-neutral-500">{body}</p>
    </Link>
  );
}
