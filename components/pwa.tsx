"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Registers the service worker that makes aplo installable and usable offline. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const firstVisit = !navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        if (!firstVisit) return;
        const assets = performance.getEntriesByType("resource").map((entry) => entry.name);
        registration.active?.postMessage({ type: "cache-page", url: location.href, assets });
      })
      .catch((error) => console.error("Service worker registration failed:", error));
  }, []);

  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Whether the browser reports no network connection. */
export function useIsOffline() {
  return useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
}
