
// lifecycle events
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service worker ...', event);
  event.waitUntil(
    caches.open('static')
      .then((cache) => { // cache = created cache
        console.log('[Service Worker] Precaching App Shell');
        // methods : https://developer.mozilla.org/en-US/docs/Web/API/Cache
        // match : see if our cache has a resource
        // add : execute request then store response (= fetch() + put())
        // put : store url and its reponse
        // delete
        // keys : display an array of Cache keys
        cache.add('/src/js/app.js')
      })
  ); // open a new cache
  // waitUntil to avoid conflict in fetch event listener
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] activating Service worker ...', event);
  return self.clients.claim(); // ensures that sw are activated correctly
});

// non-lifecycle events
self.addEventListener('fetch', (event) => {
  // console.log(`[Serivce Worker] fetch event for ${event.request.url}`, event);
  // event.respondWith('<h1>Hi</h1>'); override response

  // fetch data with cache if available
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // null if not in cache
        if (response){
          console.log(`request for ${event.request.url} in cache !`);
          return response; // returning value from the cache
        }else {
          return fetch(event.request);
        }
      })
      .catch((err) => {
        console.error(err);
      })
  );
});