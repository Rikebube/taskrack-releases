// Müşteri sayfasının tarayıcı bildirimleri (share.sql v17 > share_push_subs). Kapsamı yalnızca push/ klasörüdür:
// sayfaları önbelleğe almaz, uygulamanın PWA hizmet çalışanıyla karışmaz. Yalnızca bildirimi gösterir ve tıklanınca
// müşteri sayfasını açar.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "TaskRack", body: event.data ? event.data.text() : "" };
  }
  const title = typeof data.title === "string" ? data.title : "TaskRack";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      icon: new URL("../taskrack-logo.svg", self.location.href).href,
      data: { url: typeof data.url === "string" ? data.url : null },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (!url) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url === url && "focus" in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});
