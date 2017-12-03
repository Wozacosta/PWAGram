
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service worker ...', event);
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service worker ...', event);
  return self.clients.claim(); // ensures that sw are activated correctly
});