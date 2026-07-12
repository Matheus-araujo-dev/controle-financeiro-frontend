// Service Worker — Web Push handler
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Alerta financeiro', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Alerta financeiro', {
      body: payload.body ?? '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: payload.tag ?? 'alerta',
      data: { url: payload.url ?? '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(url);
        } else {
          clients.openWindow(url);
        }
      })
  );
});
