"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Mail,
  Package,
  Plus,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface DashboardData {
  products: number;
  outOfStock: number;
  revenue30d: number;
  revenuePrev30d: number;
  orders30d: number;
  unreadMessages: number;
  recentOrders: RecentOrder[];
  recentMessages: RecentMessage[];
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  customer_email: string | null;
  status: string;
}

interface RecentMessage {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  subject: string | null;
  read: boolean;
}

const STATUS_CLS: Record<string, string> = {
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-600",
  refunded: "bg-red-50 text-red-700",
};

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null; // n/a if previous zero and curr non-zero
  return Math.round(((curr - prev) / prev) * 100);
}

function formatMoney(v: number): string {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setData({
        products: 0,
        outOfStock: 0,
        revenue30d: 0,
        revenuePrev30d: 0,
        orders30d: 0,
        unreadMessages: 0,
        recentOrders: [],
        recentMessages: [],
      });
      return;
    }
    const sb = getSupabaseBrowserClient();
    const now = Date.now();
    const d30 = new Date(now - 30 * 86_400_000).toISOString();
    const d60 = new Date(now - 60 * 86_400_000).toISOString();

    Promise.all([
      sb.from("products").select("id, stock"),
      sb.from("orders").select("total_amount, created_at").gte("created_at", d60),
      sb.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
      sb
        .from("orders")
        .select("id, created_at, total_amount, customer_email, status")
        .order("created_at", { ascending: false })
        .limit(5),
      sb
        .from("messages")
        .select("id, created_at, name, email, subject, read")
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([prod, ordersRange, msgsCount, recentOrders, recentMessages]) => {
      const productList = (prod.data ?? []) as Array<{ id: string; stock: number | null }>;
      const orderRange = (ordersRange.data ?? []) as Array<{
        total_amount: number | null;
        created_at: string;
      }>;
      const d30Ts = new Date(d30).getTime();
      const rev30 = orderRange
        .filter((o) => new Date(o.created_at).getTime() >= d30Ts)
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const revPrev = orderRange
        .filter((o) => new Date(o.created_at).getTime() < d30Ts)
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const orders30 = orderRange.filter((o) => new Date(o.created_at).getTime() >= d30Ts).length;

      setData({
        products: productList.length,
        outOfStock: productList.filter((p) => (p.stock ?? 0) <= 0).length,
        revenue30d: rev30,
        revenuePrev30d: revPrev,
        orders30d: orders30,
        unreadMessages: msgsCount.count ?? 0,
        recentOrders: (recentOrders.data ?? []) as RecentOrder[],
        recentMessages: (recentMessages.data ?? []) as RecentMessage[],
      });
    });
  }, []);

  const revChange = data ? pctChange(data.revenue30d, data.revenuePrev30d) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900">Dashboard</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-barn-700"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      {!isSupabaseConfigured() && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Supabase not configured.</strong> Add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in <code>.env.local</code> (or your Cloudflare/Vercel project) and run the SQL
          migrations from <code>supabase/migrations/</code>. Live numbers will appear here.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          sub="Last 30 days"
          value={data ? formatMoney(data.revenue30d) : "—"}
          change={revChange}
          Icon={DollarSign}
          accent="emerald"
        />
        <MetricCard
          label="Orders"
          sub="Last 30 days"
          value={data ? data.orders30d.toLocaleString() : "—"}
          Icon={ShoppingBag}
          accent="blue"
        />
        <MetricCard
          label="Products"
          sub={data && data.outOfStock > 0 ? `${data.outOfStock} out of stock` : "Live in catalog"}
          value={data ? data.products.toLocaleString() : "—"}
          Icon={Package}
          accent="amber"
          alert={Boolean(data && data.outOfStock > 0)}
        />
        <MetricCard
          label="Unread messages"
          sub="Customer inbox"
          value={data ? data.unreadMessages.toLocaleString() : "—"}
          Icon={Mail}
          accent="violet"
          alert={Boolean(data && data.unreadMessages > 0)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Recent orders</h2>
              <p className="text-xs text-neutral-500">Most recent customer purchases.</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-barn-700 hover:text-barn-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <div className="divide-y divide-neutral-100">
            {data === null ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-neutral-50" />
              ))
            ) : data.recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-400">
                No orders yet — they will appear here once customers check out.
              </div>
            ) : (
              data.recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-800">
                      {o.customer_email ?? "Guest checkout"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      #{o.id.slice(0, 8)} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span
                    className={`hidden rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${
                      STATUS_CLS[o.status] ?? STATUS_CLS.paid
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="w-20 text-right text-sm font-semibold text-neutral-900">
                    {formatMoney(Number(o.total_amount) || 0)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Recent messages</h2>
              <p className="text-xs text-neutral-500">Customer support inbox.</p>
            </div>
            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-1 text-xs font-semibold text-barn-700 hover:text-barn-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <div className="divide-y divide-neutral-100">
            {data === null ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-neutral-50" />
              ))
            ) : data.recentMessages.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-400">
                No messages yet.
              </div>
            ) : (
              data.recentMessages.map((m) => (
                <Link
                  key={m.id}
                  href="/admin/messages"
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-neutral-50"
                >
                  <span
                    className={`mt-1 inline-block h-2 w-2 flex-none rounded-full ${
                      m.read ? "bg-neutral-200" : "bg-barn-600"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-800">
                      {m.name?.trim() || m.email}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {m.subject || "(no subject)"} · {timeAgo(m.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/products" Icon={Package} title="Products" body="Add, edit, restock." />
          <QuickAction href="/admin/promos" Icon={Tag} title="Promo codes" body="Manage discount codes." />
          <QuickAction href="/admin/orders" Icon={ShoppingBag} title="Orders" body="Update shipping status." />
          <QuickAction href="/admin/staff" Icon={Users} title="Staff" body="Invite team members." />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  sub,
  value,
  change,
  Icon,
  accent,
  alert,
}: {
  label: string;
  sub: string;
  value: string;
  change?: number | null;
  Icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "blue" | "amber" | "violet";
  alert?: boolean;
}) {
  const tones: Record<typeof accent, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${tones[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {typeof change === "number" && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
              change >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${alert ? "text-amber-700" : "text-neutral-900"}`}
      >
        {value}
      </p>
      <p className="text-xs text-neutral-400">{sub}</p>
    </div>
  );
}

function QuickAction({
  href,
  Icon,
  title,
  body,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-barn-500 hover:shadow-md"
    >
      <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md bg-neutral-100 text-neutral-600 group-hover:bg-barn-50 group-hover:text-barn-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
        <p className="truncate text-xs text-neutral-500">{body}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 flex-none text-neutral-300 group-hover:text-barn-600" />
    </Link>
  );
}
