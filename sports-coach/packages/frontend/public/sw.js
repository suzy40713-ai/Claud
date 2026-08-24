self.addEventListener("push", (event) => {
  let payload = { title: "Cadenzo", body: "Nouvelle alerte." };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "Cadenzo", body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    })
  );
});

// Pas de cache offline pour le MVP : ce handler existe pour satisfaire les
// criteres d'installabilite PWA (manifest + service worker enregistre avec
// un handler fetch).
self.addEventListener("fetch", () => {});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/plan");
    })
  );
});
