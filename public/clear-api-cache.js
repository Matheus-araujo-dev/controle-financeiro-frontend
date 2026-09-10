/* global self */
// Financial responses from older releases must never survive a worker update.
self.addEventListener('activate', event => {
  event.waitUntil(self.caches.delete('api-cache'));
});
