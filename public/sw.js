
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
        cache.addAll([
          '/',
          '/index.html',
          '/src/js/app.js',
          '/src/js/feed.js',
          '/src/js/promise.js', // no value in storing polyfills here, browser that needs them won't be able to access cache anyway
          '/src/js/fetch.js', // still useful for performance reason to cache them on new browsers
          '/src/js/material.min.js',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/images/main-image.jpg',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons', // remote servers need to have cross-origin access enabled
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
        ]);
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
  console.log(`[Serivce Worker] fetch event for ${event.request.url}`, event);
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