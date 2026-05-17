"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface RecordResponse {
  ok: boolean;
  session_id?: string;
  step?: string;
  payment_status?: string;
  customer_email?: string | null;
  order_id?: string;
  already_recorded?: boolean;
  reason?: string;
  detail?: string;
}

/**
 * Client-side: posts the Stripe session id back to /api/orders/record so
 * the order row is reliably saved in Supabase (idempotent on session id).
 *
 * Surfaces failures inline so the customer immediately sees what went
 * wrong instead of finding out later when /account/orders is empty.
 */
export function CheckoutSuccessRecorder({
  sessionId,
  locale,
}: {
  sessionId: string;
  locale: "en" | "es";
}) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "recording" }
    | { status: "ok"; res: RecordResponse }
    | { status: "error"; res: RecordResponse }
  >({ status: "idle" });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function attemptOnce(): Promise<RecordResponse> {
      const res = await fetch("/api/orders/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
        cache: "no-store",
      });
      return (await res.json()) as RecordResponse;
    }

    async function go() {
      setState({ status: "recording" });
      // Stripe sometimes redirects a touch before payment_status flips to
      // "paid" — try a few times with backoff so the customer doesn't see
      // a misleading "session not paid" message on the success page.
      const delays = [0, 1500, 3000, 5000];
      let last: RecordResponse | null = null;
      for (const d of delays) {
        if (d > 0) await new Promise((r) => setTimeout(r, d));
        if (cancelled) return;
        try {
          last = await attemptOnce();
        } catch (err) {
          last = {
            ok: false,
            reason: "NETWORK_ERROR",
            detail: err instanceof Error ? err.message : "fetch failed",
          };
        }
        if (last.ok) break;
        if (last.reason !== "SESSION_NOT_PAID") break;
      }
      if (cancelled || !last) return;
      setState(last.ok ? { status: "ok", res: last } : { status: "error", res: last });
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state.status === "idle" || state.status === "recording") {
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        {locale === "en" ? "Saving your order…" : "Guardando tu pedido…"}
      </div>
    );
  }

  if (state.status === "ok") {
    const wasDup = state.res.already_recorded;
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        {locale === "en"
          ? wasDup
            ? "Order saved (already on file)."
            : "Order saved to your account."
          : wasDup
            ? "Pedido guardado (ya en archivo)."
            : "Pedido guardado en tu cuenta."}
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-md rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-bold">
            {locale === "en"
              ? "Your payment went through, but we couldn't save the order automatically."
              : "Tu pago fue procesado, pero no pudimos guardar el pedido automáticamente."}
          </p>
          <p className="mt-1">
            {locale === "en"
              ? "Please contact support with the reference below — we'll sort it right away. Your charge is safe."
              : "Por favor contáctanos con la referencia siguiente; lo resolveremos enseguida. Tu cargo está seguro."}
          </p>
          <dl className="mt-3 space-y-1 font-mono text-[11px]">
            <div>
              <dt className="inline font-bold">session: </dt>
              <dd className="inline break-all">{state.res.session_id ?? sessionId}</dd>
            </div>
            {state.res.reason && (
              <div>
                <dt className="inline font-bold">reason: </dt>
                <dd className="inline">{state.res.reason}</dd>
              </div>
            )}
            {state.res.detail && (
              <div>
                <dt className="inline font-bold">detail: </dt>
                <dd className="inline">{state.res.detail}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
