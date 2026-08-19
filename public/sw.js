// MidTime Progressive Web App Service Worker
const CACHE_NAME = "midtime-pwa-v1.0.0";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logo.png"
];

// Installation event: Cache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation event: Clean up previous cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for dynamic API queries, Stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and chrome-extension/external cross-origins
  if (event.request.method !== "GET") return;

  // For API search or dynamic backend calls: Network first with graceful fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "অফলাইন মোড: ইন্টারনেট সংযোগ নেই" }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // For static assets and navigation requests: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML page navigation, fallback to root index.html
          if (event.request.mode === "navigate") {
            return caches.match("/index.html") || caches.match("/");
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
