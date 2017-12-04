/*
  register service workers
  app.js has to be on every page the user might visit
  so that it can register the sw from any starting page (we can't be on the user landing on the index.html page)
  we need to be able to register the sw anywhere.
 */

let deferredPrompt;

if (!window.Promise){
  window.Promise = Promise;
}

/*
  The outer block performs a feature detection test to make sure service workers are supported before trying to register one.
 */
if ('serviceWorker' in navigator) {
  // console.log(`serviceWorkers supported in navigator`, navigator);
  navigator.serviceWorker
    .register('/sw.js') // The scope parameter is optional, and can be used to specify the subset of your content that you want the service worker to control
    .then(() => {
      console.log('Service Worker registered !');
      // A single service worker can control many pages.
      // Each time a page within your scope is loaded, the service worker is installed against that page and operates on it.
      // Bear in mind therefore that you need to be careful with global variables in the service worker script: each page doesn’t get its own unique worker.
    })
    .catch((err) => {
      console.error(err);
    })
  // This registers a service worker, which runs in a worker context, and therefore has no DOM access.
  // You then run code in the service worker outside of your normal pages to control their loading.
}

window.addEventListener('beforeinstallprompt', (event) => {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});