"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

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

    // The offline worker precaches many photographs. Wait for the first globe
    // frame so those downloads do not compete with the initial engine/texture.
    if (document.querySelector('.globe-canvas[data-ready="true"]')) {
      void register();
    } else {
      window.addEventListener("chrono-earth:globe-ready", register, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("chrono-earth:globe-ready", register);
    };
  }, []);

  return null;
}

export default ServiceWorkerRegistration;
