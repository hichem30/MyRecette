"use client";

import { ArrowLeft, CheckCircle2, Package, Truck } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

// Map the 6 admin statuses down to the 3 customer-facing stages.
function customerStage(s: OrderStatus): 0 | 1 | 2 | -1 {
  if (s === "paid" || s === "processing") return 0;
  if (s === "shipped") return 1;
  if (s === "delivered") return 2;
  return -1; // cancelled / refunded
}

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
        timeline: "Shipping status",
        stagePreparing: "Preparing",
        stageShipped: "On the way",
        stageArrived: "Arrived",
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
        timeline: "Estado del envío",
        stagePreparing: "Preparando",
        stageShipped: "En camino",
        stageArrived: "Entregado",
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
  const stage = customerStage(status);
  const stages: Array<{ key: string; label: string; Icon: typeof Package }> = [
    { key: "prep", label: labels.stagePreparing, Icon: Package },
    { key: "ship", label: labels.stageShipped, Icon: Truck },
    { key: "arrived", label: labels.stageArrived, Icon: CheckCircle2 },
  ];
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
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
            {labels.timeline}
          </p>
          <ol className="relative grid grid-cols-3 gap-2">
            {/* base line */}
            <span
              aria-hidden
              className="absolute left-[16%] right-[16%] top-5 -z-0 h-1 rounded bg-neutral-200"
            />
            <span
              aria-hidden
              className="absolute left-[16%] top-5 -z-0 h-1 rounded bg-barn-600 transition-all"
              style={{
                width:
                  stage <= 0
                    ? "0%"
                    : stage === 1
                    ? "34%"
                    : stage === 2
                    ? "68%"
                    : "0%",
              }}
            />
            {stages.map((s, idx) => {
              const done = idx <= stage;
              const active = idx === stage;
              const Icon = s.Icon;
              return (
                <li key={s.key} className="relative z-10 flex flex-col items-center">
                  <span
                    className={`mb-1 flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                      done
                        ? "border-barn-600 bg-barn-600 text-white"
                        : "border-neutral-200 bg-white text-neutral-300"
                    } ${active ? "ring-4 ring-barn-200" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      done ? "text-barn-700" : "text-neutral-400"
                    }`}
                  >
                    {s.label}
                  </span>
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
