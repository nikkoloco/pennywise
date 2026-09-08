"use client";

import { useEffect } from "react";

/** Registers the worker that keeps the app openable with no signal. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Never in development: assets are cached by URL, and Turbopack reuses
    // filenames while their contents change, so the worker serves stale CSS.
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // A failed registration costs offline support, never the app itself.
    });
  }, []);

  return null;
}
