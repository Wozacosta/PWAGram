/*
synchronously imports one or more scripts into the worker's scope.

If you had some functionality written in a separate script called foo.js that you wanted to use inside worker.js, you could import it using the following line:
importScripts('foo.js');

importScripts() and self.importScripts() are effectively equivalent
 */

// https://github.com/jakearchibald/idb
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

// lifecycle events
const CACHE_STATIC_NAME = 'static-v21';
const CACHE_DYNAMIC_NAME = 'dynamic-v7';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js', // no value in storing polyfills here, browser that needs them won't be able to access cache anyway...
  '/src/js/fetch.js', // ... but still useful for performance reason to cache them on new browsers
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons', // remote servers need to have cross-origin access enabled
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];

function trimCache(cacheName, maxItems) {
  let cacheToTrim = null;
  caches
    .open(cacheName)
    .then(cache => {
      cacheToTrim = cache;
      return cache.keys();
    })
    .then(keys => {
      if (keys.length > maxItems) {
        cacheToTrim.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
}

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service worker ...', event);
  event.waitUntil(
    // this ensures that the service worker will not install until the code inside waitUntil() has successfully occurred.
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', event => {
  // here = safe to update the cache (we're not in a running application anymore)
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache');
            return caches.delete(key);
          }
        })
      );
    })
  );
  console.log('[Service Worker] ACTIVATING');
  return self.clients.claim(); // ensures that sw are activated correctly
});

function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', event => {
  let url = 'https://pwagram-882f7.firebaseio.com/posts';
  // console.log(`url = ${event.request.url}`);

  if (event.request.url.indexOf(url) > -1) {
    // First Cache then Network strategy
    // Useful when you need to fetch the latest version all the time
    console.log(`first if in fecth event listener :)`);
    event.respondWith(
      fetch(event.request).then(res => {
        let clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            for (let key in data) {
              writeData('posts', data[key]);
            }
          });

        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // CACHE ONLY strategy for static files
    event.respondWith(caches.match(event.request));
  } else {
    // Cache with Network fallback strategy
    event.respondWith(
      caches
        .match(event.request)
        .then(response => {
          if (response) {
            return response; // returning value from the cache
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  cache.put(event.request.url, res.clone()); // Cloning the response is necessary because request and response streams can only be read once.
                  return res;
                });
              })
              .catch(err => {
                console.error('dynamic fetch then cache', err);
                return caches.open(CACHE_STATIC_NAME).then(cache => {
                  if (
                    event.request.headers.get('accept').includes('text/html')
                  ) {
                    return cache.match('/offline.html');
                  }
                });
              });
          }
        })
        .catch(err => {
          console.error('Error in respondwith match', err);
        })
    );
  }
});

const URL = 'https://pwagram-882f7.firebaseio.com/posts.json';

// Fired when sw thinks it has connectivity (or if a new sync task was registered and it had already connectivity)
self.addEventListener('sync', event => {
  // there's an internet connection here !
  console.log('[Service worker] Background syncing', event);
  if (event.tag === 'sync-new-post') {
    console.log('[Service woker] Syncing new posts !');
    event.waitUntil(
      readAllData('sync-posts').then(data => {
        for (let dt of data) {
          let postData = new FormData();
          postData.append('id', dt.id);
          postData.append('title', dt.title);
          postData.append('location', dt.location);
          postData.append('file', dt.picture, dt.id + '.png'); // third argument = overwrite title of image (we could check mimetype alternatively to be careful)


          fetch('https://us-central1-pwagram-882f7.cloudfunctions.net/storePostData', {
            method: 'POST',
            body: postData,
          }).then(res => {
            console.log(`sent data !, res = `, res);
            if (res.ok){
              res.json()
                .then((resData) => {
                  deleteItemFromData('sync-posts', resData.id);
                })
            }
          }).catch((err) => {
            console.error('Error while sending data ', err);
          });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  let notification = event.notification;
  let action = event.action;

  console.log(notification);

  if (action === 'confirm'){
    console.log('confirm was chosen!');
    notification.close();
  }else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then((clis) => {
          console.log(`clients clis = `, clis);
          let client = clis.find((c) => {
            return c.visibilityState === 'visible';
          });
          if (client !== undefined){
            client.navigate(notification.data.url);
            client.focus();
          }else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );

  }
})

self.addEventListener('notificationclose', (event) => {
  console.log('notification was closed', event);
})

self.addEventListener('push', (event) => {
  console.log('push notification received', event);
  let data = {
    title: 'Nouveau!',
    content: 'SMTHNG NEW HAPPENED',
    openUrl: '/',
  };
  if (event.data){
    data = JSON.parse(event.data.text());
    console.log(' now data = ', data);
  }

  let options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
