// lifecycle events
const CACHE_STATIC_NAME = 'static-v7';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service worker ...', event);
  event.waitUntil( // this ensures that the service worker will not install until the code inside waitUntil() has successfully occurred.
    caches.open(CACHE_STATIC_NAME).then(cache => {
      // we use the caches.open() method to create a new cache called v1, which will be version 1 of our site resources cache.
      // This returns a promise for a created cache; once resolved,
      // we then call a function that calls addAll() on the created cache,
      // which for its parameter takes an array of origin-relative URLs to all the resources you want to cache.

      //If the promise is rejected, the install fails, and the worker won’t do anything.
      // This is ok, as you can fix your code and then try again the next time registration occurs.
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

self.addEventListener('activate', event => {
  // here = safe to update the cache (we're not in a running application anymore)
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME){
            console.log('[Service Worker] Removing old cache');
            return caches.delete(key);
          }
        })); // takes array of promise and waits for all of them to finish
      })
  )
  console.log('[Service Worker] activating Service worker ...');
  return self.clients.claim(); // ensures that sw are activated correctly
});

// non-lifecycle events
self.addEventListener('fetch', event => {
  // console.log(`[Serivce Worker] fetch event for ${event.request.url}`);
  // event.respondWith('<h1>Hi</h1>'); override response

  // fetch data with cache if available
  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        // null if not in cache
        if (response) {
          // console.log(`request for ${event.request.url} in cache !`);
          return response; // returning value from the cache
        } else {
          return fetch(event.request).then(res => {
            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(event.request.url, res.clone()); // Cloning the response is necessary because request and response streams can only be read once.
              /*
                 In order to return the response to the browser and put it in the cache we have to clone it.
                 So the original gets returned to the browser and the clone gets sent to the cache.
                  They are each read once.
               */
              return res;
            });
          }).catch(err => {
            console.error('dynamic fetch then cache', err);
          })
        }
      })
      .catch(err => {
        console.error(err);
      })
  );
});


// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers