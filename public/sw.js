/* global self, caches, fetch, URL */

const CACHE_PREFIX = "chrono-earth-";
const CACHE_VERSION = "2026-08-03-v2";
const PRECACHE_NAME = `${CACHE_PREFIX}precache-${CACHE_VERSION}`;
const RUNTIME_NAME = `${CACHE_PREFIX}runtime-${CACHE_VERSION}`;
const JOURNEY_CACHE_PREFIX = `${CACHE_PREFIX}journey-${CACHE_VERSION}-`;

const JOURNEY_MESSAGE_TYPES = {
  install: "CHRONO_JOURNEY_PACK_INSTALL",
  remove: "CHRONO_JOURNEY_PACK_REMOVE",
  query: "CHRONO_JOURNEY_PACK_QUERY",
  progress: "CHRONO_JOURNEY_PACK_PROGRESS",
  complete: "CHRONO_JOURNEY_PACK_COMPLETE",
  error: "CHRONO_JOURNEY_PACK_ERROR",
  state: "CHRONO_JOURNEY_PACK_STATE",
};

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/chrono-earth-192.png",
  "/icons/chrono-earth-512.png",
  "/images/earth-blue-marble-4k.jpg",
  "/images/history/acropolis-of-athens.webp",
  "/images/history/aksum.webp",
  "/images/history/alhambra.webp",
  "/images/history/angkor-wat.webp",
  "/images/history/bagan.webp",
  "/images/history/bamiyan-buddhas.webp",
  "/images/history/borobudur.webp",
  "/images/history/carthage.webp",
  "/images/history/chichen-itza.webp",
  "/images/history/colosseum.webp",
  "/images/history/delphi.webp",
  "/images/history/djenne.webp",
  "/images/history/dome-of-the-rock.webp",
  "/images/history/forbidden-city.webp",
  "/images/history/giza-pyramids.webp",
  "/images/history/great-wall.webp",
  "/images/history/great-zimbabwe.webp",
  "/images/history/hadrians-wall.webp",
  "/images/history/hagia-sophia.webp",
  "/images/history/hampi.webp",
  "/images/history/kilwa-kisiwani.webp",
  "/images/history/knossos.webp",
  "/images/history/lalibela.webp",
  "/images/history/machu-picchu.webp",
  "/images/history/meroe.webp",
  "/images/history/moai-rapa-nui.webp",
  "/images/history/mogao-caves.webp",
  "/images/history/mont-saint-michel.webp",
  "/images/history/nara-todai-ji.webp",
  "/images/history/notre-dame-paris.webp",
  "/images/history/persepolis.webp",
  "/images/history/petra.webp",
  "/images/history/pompeii.webp",
  "/images/history/samarkand-registan.webp",
  "/images/history/sanchi.webp",
  "/images/history/stonehenge.webp",
  "/images/history/taj-mahal.webp",
  "/images/history/teotihuacan.webp",
  "/images/history/tikal.webp",
  "/images/history/timbuktu.webp",
];

function isCacheableResponse(response) {
  return (
    response.ok &&
    response.type !== "opaque" &&
    !response.headers.get("cache-control")?.includes("no-store")
  );
}

async function cacheSuccessfulResponse(cache, request) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return undefined;
  }
}

async function precacheAppShell() {
  const cache = await caches.open(PRECACHE_NAME);
  const settledAssets = await Promise.allSettled(
    PRECACHE_URLS.map((url) => cacheSuccessfulResponse(cache, url)),
  );
  const rootResult = settledAssets[0];

  if (rootResult.status !== "fulfilled" || !rootResult.value?.ok) {
    return;
  }

  const html = await rootResult.value.clone().text();
  const assetUrls = Array.from(
    html.matchAll(/(?:src|href)=["']([^"']+)["']/g),
    (match) => match[1],
  ).filter((value) => {
    const url = new URL(value, self.location.origin);
    return (
      url.origin === self.location.origin &&
      (url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/_next/static/"))
    );
  });

  await Promise.allSettled(
    assetUrls.map((url) => cacheSuccessfulResponse(cache, url)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(CACHE_PREFIX) &&
                key !== PRECACHE_NAME &&
                key !== RUNTIME_NAME &&
                !key.startsWith(JOURNEY_CACHE_PREFIX),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function journeyCacheName(packId) {
  return `${JOURNEY_CACHE_PREFIX}${encodeURIComponent(packId)}`;
}

function replyToClient(port, payload) {
  port?.postMessage(payload);
}

function validateJourneyRequest(packId, urls) {
  if (typeof packId !== "string" || !/^[a-z0-9-]{1,64}$/.test(packId)) {
    throw new Error("无效的旅程包标识");
  }
  if (!Array.isArray(urls) || urls.length === 0 || urls.length > 64) {
    throw new Error("无效的旅程资源列表");
  }

  return [...new Set(urls)].map((value) => {
    if (typeof value !== "string") throw new Error("无效的旅程资源地址");
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
      throw new Error("离线包仅允许缓存站内资源");
    }
    return url.href;
  });
}

async function installJourneyPack(packId, urls, port) {
  const resources = validateJourneyRequest(packId, urls);
  const cacheName = journeyCacheName(packId);
  await caches.delete(cacheName);
  const cache = await caches.open(cacheName);

  try {
    for (let index = 0; index < resources.length; index += 1) {
      const request = new Request(resources[index], { credentials: "same-origin" });
      const response = await fetch(request);
      if (!isCacheableResponse(response)) {
        throw new Error(`资源不可缓存：${new URL(resources[index]).pathname}`);
      }
      await cache.put(request, response);
      replyToClient(port, {
        type: JOURNEY_MESSAGE_TYPES.progress,
        packId,
        completed: index + 1,
        total: resources.length,
      });
    }
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }

  replyToClient(port, { type: JOURNEY_MESSAGE_TYPES.complete, packId });
}

async function removeJourneyPack(packId, port) {
  validateJourneyRequest(packId, ["/"]);
  await caches.delete(journeyCacheName(packId));
  replyToClient(port, { type: JOURNEY_MESSAGE_TYPES.complete, packId });
}

async function queryJourneyPacks(port) {
  const keys = await caches.keys();
  const installedPackIds = keys
    .filter((key) => key.startsWith(JOURNEY_CACHE_PREFIX))
    .map((key) => decodeURIComponent(key.slice(JOURNEY_CACHE_PREFIX.length)));
  replyToClient(port, { type: JOURNEY_MESSAGE_TYPES.state, installedPackIds });
}

self.addEventListener("message", (event) => {
  const message = event.data;
  const port = event.ports?.[0];
  if (!message || typeof message.type !== "string" || !port) return;

  let operation;
  if (message.type === JOURNEY_MESSAGE_TYPES.install) {
    operation = installJourneyPack(message.packId, message.urls, port);
  } else if (message.type === JOURNEY_MESSAGE_TYPES.remove) {
    operation = removeJourneyPack(message.packId, port);
  } else if (message.type === JOURNEY_MESSAGE_TYPES.query) {
    operation = queryJourneyPacks(port);
  } else {
    return;
  }

  event.waitUntil(
    operation.catch((error) =>
      replyToClient(port, {
        type: JOURNEY_MESSAGE_TYPES.error,
        packId: message.packId,
        message: error instanceof Error ? error.message : "离线缓存失败",
      }),
    ),
  );
});

async function networkFirst(request) {
  const runtimeCache = await caches.open(RUNTIME_NAME);

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await runtimeCache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await runtimeCache.match(request)) ??
      (await caches.match(request, { ignoreSearch: true })) ??
      (await caches.match("/"))
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const runtimeCache = await caches.open(RUNTIME_NAME);
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    await runtimeCache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  const isStaticAsset =
    ["font", "image", "script", "style", "worker"].includes(
      request.destination,
    ) ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/cesium/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/");

  if (!isStaticAsset) {
    return;
  }

  const shouldPreferNetwork = ["script", "style", "worker"].includes(
    request.destination,
  );
  event.respondWith(
    shouldPreferNetwork ? networkFirst(request) : cacheFirst(request),
  );
});
