/**
 * Pennywise service worker.
 *
 * Scope is deliberately narrow: keep the app openable with no signal, and keep
 * static assets instant. Pages are server-rendered, so navigation is
 * network-first and falls back to the last good copy of that page. Writes are
 * not intercepted here; the outbox in the app handles those, where it can see
 * what a queued expense actually means.
 */

const CACHE = "pennywise-v1";
const OFFLINE_FALLBACK = "/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match(OFFLINE_FALLBACK));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

const STATIC = /^\/(_next\/static|icon|apple-touch-icon|manifest)/;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (STATIC.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
