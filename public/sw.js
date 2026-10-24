// Service worker for Web Push (src/lib/push.ts). It only shows notifications; it caches nothing.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'next', {
      body: data.body || '',
      tag: data.tag,
      renotify: Boolean(data.tag),
      requireInteraction: Boolean(data.requireInteraction),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      lang: 'uk',
      data: { url: data.url || '/app' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app', self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).pathname.startsWith(target.pathname));
      return open ? open.focus() : self.clients.openWindow(target.href);
    }),
  );
});
