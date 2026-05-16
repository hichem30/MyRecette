"use client";

import { ChevronDown, ChevronRight, Copy, Mail, Search, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-200 text-neutral-700",
  refunded: "bg-red-50 text-red-700",
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState("");

  // Pre-fill the email filter when arriving from /admin/staff?email=…
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("email");
    if (p) setEmailFilter(p);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setItems((data as Order[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function changeStatus(id: string, status: OrderStatus) {
    setSavingStatusId(id);
    if (!isSupabaseConfigured()) {
      setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setSavingStatusId(null);
      return;
    }
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("orders").update({ status }).eq("id", id);
    setSavingStatusId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function copyEmail(e: string | null | undefined) {
    if (!e) return;
    navigator.clipboard.writeText(e).catch(() => {
      /* ignore — Firefox / older browsers */
    });
  }

  const filteredItems = useMemo(() => {
    const q = emailFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => (o.customer_email ?? "").toLowerCase().includes(q));
  }, [items, emailFilter]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Orders</h1>
      <p className="text-sm text-neutral-500">
        {filteredItems.length} of {items.length} order{items.length === 1 ? "" : "s"}
        {emailFilter ? ` matching “${emailFilter}”` : ""}.
      </p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Orders are written by the Stripe webhook into Supabase. Configure both before this works.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2">
        <Search className="h-4 w-4 flex-none text-neutral-400" />
        <input
          type="search"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          placeholder="Filter by customer email…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {emailFilter && (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => setEmailFilter("")}
            className="text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stripe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                {emailFilter ? `No orders match “${emailFilter}”.` : "No orders yet."}
              </td></tr>
            ) : (
              filteredItems.map((o) => {
                const isOpen = expanded === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td className="px-2 py-3 align-top">
                        <button
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                          className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 align-top">
                        {o.customer_email ? (
                          <span className="flex items-center gap-1.5">
                            {o.customer_email}
                            <button
                              type="button"
                              aria-label="Copy email"
                              title="Copy email"
                              onClick={() => copyEmail(o.customer_email)}
                              className="text-neutral-400 hover:text-barn-700"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={`mailto:${o.customer_email}`}
                              aria-label="Email customer"
                              title="Email customer"
                              className="text-neutral-400 hover:text-barn-700"
                            >
                              <Mail className="h-3 w-3" />
                            </a>
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">{o.line_items?.length ?? 0}</td>
                      <td className="px-4 py-3 align-top font-bold">${o.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3 align-top">
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                          disabled={savingStatusId === o.id}
                          className={`rounded-md border-0 px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-barn-500 ${
                            STATUS_STYLE[o.status] ?? "bg-neutral-50 text-neutral-700"
                          }`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-neutral-400">
                        {o.stripe_session_id?.slice(0, 14)}…
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-neutral-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                            Line items
                          </div>
                          {!o.line_items || o.line_items.length === 0 ? (
                            <p className="text-xs text-neutral-400">No line items recorded.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead className="text-neutral-500">
                                <tr>
                                  <th className="py-1 text-left">Product</th>
                                  <th className="py-1 text-right">Qty</th>
                                  <th className="py-1 text-right">Unit</th>
                                  <th className="py-1 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {o.line_items.map((li, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1">{li.product_name}</td>
                                    <td className="py-1 text-right">{li.quantity}</td>
                                    <td className="py-1 text-right">${li.unit_amount.toFixed(2)}</td>
                                    <td className="py-1 text-right font-bold">
                                      ${(li.unit_amount * li.quantity).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <p className="mt-3 text-xs text-neutral-500">
                            Stripe session: <span className="font-mono">{o.stripe_session_id}</span>
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
