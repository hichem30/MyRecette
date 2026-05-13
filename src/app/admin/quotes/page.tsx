"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BulkQuote } from "@/lib/types";

export default function AdminQuotesPage() {
  const [items, setItems] = useState<BulkQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("bulk_quotes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setItems((data as BulkQuote[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Quote Requests</h1>
      <p className="text-sm text-neutral-500">{items.length} request{items.length === 1 ? "" : "s"}.</p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Configure Supabase to receive contractor / bulk quote requests.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-400">
            No quote requests yet.
          </p>
        ) : (
          items.map((q) => (
            <article key={q.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{q.company}</p>
                  <p className="text-xs text-neutral-500">{q.contact} · {q.email} · {q.phone}</p>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{q.status}</span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <Item label="Project" value={q.project_type} />
                <Item label="Quantity" value={q.estimated_quantity} />
                <Item label="Delivery" value={q.delivery} />
                <Item label="Timeline" value={q.timeline} />
                <Item label="Received" value={new Date(q.created_at).toLocaleString()} />
              </dl>
              {q.notes && <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{q.notes}</p>}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-neutral-800">{value}</dd>
    </div>
  );
}
