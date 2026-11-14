/* Red Van Daredevil PWA service worker.
   Imported by /sw.js so the worker controls the whole game, not just /mobile/. */
const CACHE = "redvan-v0.2.0";
const ASSETS = [
  "./index.html",
  "./styles/styles.css",
  "./js/constants.js",
  "./js/lib.js",
  "./js/abstract.js",
  "./js/assets.js",
  "./js/routes.js",
  "./js/audio.js",
  "./js/state.js",
  "./js/progression.js",
  "./js/world.js",
  "./js/gameplay.js",
  "./js/hud.js",
  "./js/main.js",
  "./mobile/manifest.webmanifest",
  "./mobile/icons/icon-192.png",
  "./mobile/icons/icon-512.png",
  "./mobile/icons/maskable-512.png",
  "./mobile/icons/apple-touch-icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("redvan-") && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === "navigate") return caches.match("./index.html");
        throw new Error("offline and not cached");
      });
    })
  );
});
