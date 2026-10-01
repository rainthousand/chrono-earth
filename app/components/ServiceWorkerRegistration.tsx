"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    let registrationTimer: number | undefined;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (!cancelled) {
          await registration.update();
        }
      } catch {
        // Offline support is progressive enhancement; the archive remains usable.
      }
    };

    // Precaching photographs must not compete with the opening camera flight.
    // Observe the completed transition too: first-frame ready starts that flight.
    const schedule = () => {
      window.clearTimeout(registrationTimer);
      if (!document.querySelector('.globe-canvas[data-ready="true"]') ||
        document.querySelector('.civilization-opening')) return;
      registrationTimer = window.setTimeout(() => {
        if (!cancelled) void register();
      }, 3500);
    };
    window.addEventListener("chrono-earth:globe-ready", schedule);
    window.addEventListener("chrono-earth:opening-finished", schedule);
    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(registrationTimer);
      window.removeEventListener("chrono-earth:globe-ready", schedule);
      window.removeEventListener("chrono-earth:opening-finished", schedule);
    };
  }, []);

  return null;
}

export default ServiceWorkerRegistration;
