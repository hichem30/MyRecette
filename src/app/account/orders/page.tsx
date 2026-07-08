"use client";

import { ChevronRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<OrderStatus, { en: string; es: string; cls: string }> = {
  paid: { en: "Paid", es: "Pagado", cls: "bg-emerald-50 text-emerald-700" },
  processing: { en: "Processing", es: "Procesando", cls: "bg-amber-50 text-amber-700" },
  shipped: { en: "Shipped", es: "Enviado", cls: "bg-blue-50 text-blue-700" },
  delivered: { en: "Delivered", es: "Entregado", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { en: "Cancelled", es: "Cancelado", cls: "bg-neutral-100 text-neutral-600" },
  refunded: { en: "Refunded", es: "Reembolsado", cls: "bg-red-50 text-red-700" },
};

export default function MyOrdersPage() {
  const locale = useLocale() as "en" | "es";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/orders/mine", { cache: "no-store" });
        const json = (await res.json()) as { orders?: Order[] };
        if (cancelled) return;
        setOrders(json.orders ?? []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const labels = {
    en: {
      title: "My Orders",
      subtitle: "Track the status of your past purchases.",
      empty: "You have not placed any orders yet.",
      browse: "Browse products",
      order: "Order",
      placed: "Placed",
      total: "Total",
      items: "items",
      view: "View",
    },
    es: {
      title: "Mis Pedidos",
      subtitle: "Sigue el estado de tus compras anteriores.",
      empty: "Todavía no has realizado ningún pedido.",
      browse: "Ver productos",
      order: "Pedido",
      placed: "Realizado",
      total: "Total",
      items: "artículos",
      view: "Ver",
    },
  }[locale];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">{labels.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">{labels.subtitle}</p>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-neutral-500">{labels.empty}</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-md bg-recette-600 px-5 py-2 text-sm font-bold text-white hover:bg-recette-700"
            >
              {labels.browse}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const date = new Date(o.created_at).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const itemCount = (o.line_items ?? []).reduce((s, l) => s + (l.quantity ?? 0), 0);
              const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.paid;
              return (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-recette-400 hover:bg-neutral-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                          {labels.order}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-800">
                          {o.order_number ?? `#${o.id.slice(0, 8)}`}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                          {st[locale]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-baseline gap-3 text-sm">
                        <span className="text-neutral-500">{date}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-neutral-500">
                          {itemCount} {labels.items}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <span className="font-bold text-neutral-900">{formatPrice(Number(o.total_amount))}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-none text-neutral-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
