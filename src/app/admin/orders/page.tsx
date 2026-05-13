"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Orders</h1>
      <p className="text-sm text-neutral-500">{items.length} order{items.length === 1 ? "" : "s"}.</p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Orders are written by the Stripe webhook into Supabase. Configure both before this works.
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stripe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No orders yet.</td></tr>
            ) : (
              items.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{o.customer_email}</td>
                  <td className="px-4 py-3">{o.line_items.length}</td>
                  <td className="px-4 py-3 font-bold">${o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">{o.stripe_session_id.slice(0, 14)}…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
