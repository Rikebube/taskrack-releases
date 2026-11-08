// Ana ekrana eklenen web sürümü: uygulama dosyalarını saklar, böylece internet yokken de açılır.
// Yalnızca aynı adresten gelen GET istekleri işlenir; Supabase istekleri ve kullanıcı verisi saklanmaz.
const CACHE = "taskrack-v1";
const HOME = new URL("./", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch(HOME, { cache: "no-cache" });
      if (res.ok) {
        const html = await res.clone().text();
        await cache.put(HOME, res);
        const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll(assets).catch(() => undefined);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Adları içeriğe bağlı dosyalar değişmez: önce saklanan kopya.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then(async (res) => {
            if (res.ok) await (await caches.open(CACHE)).put(request, res.clone());
            return res;
          }),
      ),
    );
    return;
  }

  // Sayfa ve diğer dosyalar: önce ağ (güncellemeler hemen gelsin), internet yoksa saklanan kopya.
  event.respondWith(
    fetch(request)
      .then(async (res) => {
        if (res.ok) await (await caches.open(CACHE)).put(request.mode === "navigate" ? HOME : request, res.clone());
        return res;
      })
      .catch(async () => (await caches.match(request.mode === "navigate" ? HOME : request)) ?? Response.error()),
  );
});
