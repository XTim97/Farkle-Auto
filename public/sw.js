const CACHE_NAME = "farkle-auto-cache-v1.3.0";

const urlsToCache = [
  "/Farkle-Auto/",
  "/Farkle-Auto/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
