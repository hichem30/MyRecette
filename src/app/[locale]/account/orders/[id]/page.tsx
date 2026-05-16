"use client";

import { ArrowLeft, Package } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const STATUS_FLOW: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

const STATUS_LABEL: Record<OrderStatus, { en: string; es: string; cls: string }> = {
  paid: { en: "Paid", es: "Pagado", cls: "bg-emerald-50 text-emerald-700" },
  processing: { en: "Processing", es: "Procesando", cls: "bg-amber-50 text-amber-700" },
  shipped: { en: "Shipped", es: "Enviado", cls: "bg-blue-50 text-blue-700" },
  delivered: { en: "Delivered", es: "Entregado", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { en: "Cancelled", es: "Cancelado", cls: "bg-neutral-100 text-neutral-600" },
  refunded: { en: "Refunded", es: "Reembolsado", cls: "bg-red-50 text-red-700" },
};

export default function MyOrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const locale = useLocale() as "en" | "es";
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured() || !id) {
      setOrder(null);
      return;
    }
    const sb = getSupabaseBrowserClient();
    let cancelled = false;
    sb.from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setOrder((data as Order | null) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const labels = useMemo(
    () => ({
      en: {
        title: "Order details",
        placed: "Placed on",
        items: "Items",
        unit: "Unit price",
        qty: "Qty",
        subtotal: "Subtotal",
        total: "Total",
        backToOrders: "Back to orders",
        timeline: "Status timeline",
        cancelled: "This order was cancelled.",
        refunded: "This order was refunded.",
      },
      es: {
        title: "Detalles del pedido",
        placed: "Realizado el",
        items: "Artículos",
        unit: "Precio unit.",
        qty: "Cant.",
        subtotal: "Subtotal",
        total: "Total",
        backToOrders: "Volver a pedidos",
        timeline: "Cronología del estado",
        cancelled: "Este pedido fue cancelado.",
        refunded: "Este pedido fue reembolsado.",
      },
    })[locale],
    [locale],
  );

  if (order === undefined) {
    return <div className="text-sm text-neutral-500">{locale === "en" ? "Loading…" : "Cargando…"}</div>;
  }
  if (order === null) return notFound();

  const status = order.status as OrderStatus;
  const currentIdx = STATUS_FLOW.indexOf(status);
  const date = new Date(order.created_at).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-barn-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {labels.backToOrders}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">{labels.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            <span className="font-mono">#{order.id.slice(0, 8)}</span> · {labels.placed} {date}
          </p>
        </div>
        <span
          className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_LABEL[status].cls}`}
        >
          {STATUS_LABEL[status][locale]}
        </span>
      </div>

      {status === "cancelled" || status === "refunded" ? (
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {status === "cancelled" ? labels.cancelled : labels.refunded}
        </p>
      ) : (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
            {labels.timeline}
          </p>
          <ol className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider">
            {STATUS_FLOW.map((s, idx) => {
              const done = idx <= currentIdx;
              return (
                <li
                  key={s}
                  className={`relative rounded-md px-2 py-2 ${
                    done ? "bg-barn-600 text-white" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {STATUS_LABEL[s][locale]}
                  {idx < STATUS_FLOW.length - 1 && (
                    <span
                      className={`absolute right-[-2px] top-1/2 hidden h-[2px] w-1 -translate-y-1/2 sm:block ${
                        done ? "bg-barn-600" : "bg-neutral-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
        <Package className="mr-1 inline h-4 w-4" /> {labels.items}
      </h2>
      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">{labels.items}</th>
              <th className="px-3 py-2">{labels.unit}</th>
              <th className="px-3 py-2">{labels.qty}</th>
              <th className="px-3 py-2 text-right">{labels.subtotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(order.line_items ?? []).map((li, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 font-medium">{li.product_name}</td>
                <td className="px-3 py-2 text-neutral-600">{formatPrice(li.unit_amount)}</td>
                <td className="px-3 py-2 text-neutral-600">{li.quantity}</td>
                <td className="px-3 py-2 text-right font-bold">
                  {formatPrice(li.unit_amount * li.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50">
              <td colSpan={3} className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                {labels.total}
              </td>
              <td className="px-3 py-2 text-right font-bold text-neutral-900">
                {formatPrice(Number(order.total_amount))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
