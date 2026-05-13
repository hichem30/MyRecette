// Red Barn Western Market - Service Worker
// Implements:
//   - Precache app shell on install
//   - Cache-first for images, fonts, static assets
//   - Network-first with cache fallback for HTML / API responses

const CACHE_VERSION = "v1";
const SHELL_CACHE = `rb-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rb-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/", "/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !/\.(?:png|jpg|jpeg|webp|avif|svg|gif|woff2?)$/.test(url.pathname)) return;

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|webp|avif|svg|gif|woff2?|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // HTML/navigation: network-first with cache fallback
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c ?? caches.match("/offline.html"))),
    );
    return;
  }
});
