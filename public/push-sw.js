// Upozornění pro service worker (vite-plugin-pwa ho přidá přes workbox.importScripts).
// Zprávu posílá funkce Supabase untrois-push: { title, body, url, tag }.
const BADGE_CACHE = "untrois-badge";

// Počet nepřečtených upozornění pro odznak na ikoně. Appka ho po otevření vynuluje (src/lib/push.ts).
async function bumpBadge() {
  if (!self.navigator.setAppBadge) return;
  try {
    const cache = await caches.open(BADGE_CACHE);
    const old = await cache.match("count");
    const count = (old ? Number(await old.text()) || 0 : 0) + 1;
    await cache.put("count", new Response(String(count)));
    await self.navigator.setAppBadge(count);
  } catch {
    // bez odznaku se nic nestane
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const scope = self.registration.scope;
  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title || "untrois", {
      body: data.body || "",
      tag: data.tag,
      icon: scope + "icon-192.png",
      badge: scope + "icon-192.png",
      data: { url: data.url || "" },
    }),
    bumpBadge(),
  ]));
});

// Ťuknutí na upozornění otevře appku na dané obrazovce (HashRouter: #/m/nakup).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = self.registration.scope + (event.notification.data && event.notification.data.url ? "#" + event.notification.data.url : "");
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
