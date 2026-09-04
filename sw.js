/* Service worker — sprawia, że aplikacja działa bez internetu. */

const CACHE = "rental-v1";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll przerywa się przy pierwszym brakującym pliku, więc dodajemy pojedynczo:
      // ikony PNG są opcjonalne i mogą jeszcze nie istnieć.
      .then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/**
 * Najpierw sieć, w razie braku — cache.
 * Po wgraniu poprawek na GitHub aplikacja pobiera nową wersję,
 * a bez zasięgu otwiera zapamiętaną.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html")))
  );
});
