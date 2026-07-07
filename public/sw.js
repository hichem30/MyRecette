// sucre et sel — Service Worker kill switch.
//
// Past versions cached HTML, which caused stale UI on desktop after deploys
// (e.g. user logged in as admin but shown the customer-only view because
// JS bundle was stale). This SW deliberately does nothing and unregisters
// itself so old caches are flushed.
//
// We keep the file so existing clients that already have a SW installed
// hit this no-op and self-cleanup on their next page load.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (_) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (_) {
        /* ignore */
      }
      const clients = await self.clients.matchAll({ type: "window" });
      for (const c of clients) {
        try {
          c.navigate(c.url);
        } catch (_) {
          /* some browsers reject .navigate(); ignore */
        }
      }
    })(),
  );
});

// Do not intercept fetches. Let the network/browser handle them so
// users always get fresh HTML and assets.
