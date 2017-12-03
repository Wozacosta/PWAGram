
// lifecycle events
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service worker ...', event);
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] activating Service worker ...', event);
  return self.clients.claim(); // ensures that sw are activated correctly
});

// non-lifecycle events
self.addEventListener('fetch', (event) => {
  // console.log(`[Serivce Worker] fetch event for ${event.request.url}`, event);
  // event.respondWith('<h1>Hi</h1>'); override response
  // event.respondWith(fetch(event.request));
});