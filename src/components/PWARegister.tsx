"use client";

import { useEffect } from "react";

/**
 * SW kill-switch register.
 *
 * Earlier versions of /sw.js cached HTML responses, which caused stale UI
 * on desktop after deploys. /sw.js is now a no-op that unregisters itself
 * on activation. This component:
 *   1. Proactively unregisters any service workers already attached to
 *      this origin (cleans up the bad cache from previous deploys).
 *   2. Clears any caches left behind by the old SW.
 *
 * Once everyone has run this cleanup once, future deploys behave like a
 * regular SPA — straight network requests, no SW indirection.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      } catch {
        /* ignore */
      }
      try {
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);
  return null;
}
