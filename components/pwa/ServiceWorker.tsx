"use client";

import { useEffect } from "react";

/** Registers the worker that keeps the app openable with no signal. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Never in development: assets are cached by URL, and Turbopack reuses
    // filenames while their contents change, so the worker serves stale code.
    // Declining to register is not enough, because a worker a production build
    // left on this same origin goes on controlling dev builds and doing exactly
    // that, which surfaces as a hydration mismatch rather than as a cache bug.
    // So development evicts it.
    if (process.env.NODE_ENV !== "production") {
      void evict();
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // A failed registration costs offline support, never the app itself.
    });
  }, []);

  return null;
}

/** Drops any worker holding this origin, and the assets it had cached. */
async function evict() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}
