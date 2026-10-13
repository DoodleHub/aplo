// aplo service worker: installability and offline use.
//
// - Build assets and icons: cache-first (their URLs never change content).
// - Pages and Next.js page data (RSC): network-first, falling back to the last copy seen,
//   so the journal opens and can be navigated without a connection. These hold journal
//   content, so the app deletes them on sign-out (see clearDeviceCopy in lib/local-db.ts).
const STATIC_CACHE = "aplo-static";
const PAGES_CACHE = "aplo-pages";
const RSC_CACHE = "aplo-rsc";
const CACHES = [STATIC_CACHE, PAGES_CACHE, RSC_CACHE];
const MAX_STATIC_ENTRIES = 400;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(trimStatic)
      .then(() => self.clients.claim()),
  );
});

// Old builds' assets pile up across deploys; drop the oldest.
async function trimStatic() {
  const cache = await caches.open(STATIC_CACHE);
  const keys = await cache.keys();
  const excess = keys.slice(0, Math.max(0, keys.length - MAX_STATIC_ENTRIES));
  await Promise.all(excess.filter((key) => !PRECACHE.includes(new URL(key.url).pathname)).map((key) => cache.delete(key)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, PAGES_CACHE, url.pathname, () => caches.match(OFFLINE_URL)));
    return;
  }

  if (request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(event, RSC_CACHE, rscKey(request, url), () => Response.error()));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(event, request));
  }
});

// The `_rsc` query param is a cache-buster that changes per request, so key RSC responses by
// path plus the headers that change what kind of payload comes back.
function rscKey(request, url) {
  const params = new URLSearchParams({
    prefetch: request.headers.get("Next-Router-Prefetch") ?? "",
    segment: request.headers.get("Next-Router-Segment-Prefetch") ?? "",
  });
  return `${url.pathname}?${params}`;
}

async function networkFirst(event, cacheName, key, fallback) {
  try {
    const response = await fetch(event.request);
    // Never keep redirects (e.g. to /login) or errors in place of a real page.
    if (response.ok && !response.redirected && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(caches.open(cacheName).then((cache) => cache.put(key, copy)));
    }
    return response;
  } catch {
    return (await caches.match(key, { cacheName })) ?? fallback();
  }
}

async function cacheFirst(event, request) {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
}

// The page that registered the worker loaded before it was in control, so neither it nor
// its assets went through the cache. The page sends its URL and asset list to fix that.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-page") return;
  const path = new URL(event.data.url, self.location.origin).pathname;
  const assets = (event.data.assets ?? []).filter(
    (asset) => new URL(asset, self.location.origin).pathname.startsWith("/_next/static/"),
  );
  event.waitUntil(
    Promise.all([
      caches.open(PAGES_CACHE).then(async (cache) => {
        if (await cache.match(path)) return;
        const response = await fetch(path, { credentials: "same-origin" });
        if (response.ok && !response.redirected) await cache.put(path, response);
      }),
      caches.open(STATIC_CACHE).then((cache) =>
        Promise.all(
          assets.map(async (asset) => {
            if (await cache.match(asset)) return;
            const response = await fetch(asset).catch(() => null);
            if (response?.ok) await cache.put(asset, response);
          }),
        ),
      ),
    ]),
  );
});
