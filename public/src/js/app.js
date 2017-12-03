/*
  register service workers
  app.js has to be on every page the user might visit
  so that it can register the sw from any starting page (we can't be on the user landing on the index.html page)
  we need to be able to register the sw anywhere.
 */

if ('serviceWorker' in navigator) {
  console.log(`serviceWorkers supported in navigator`, navigator);
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('Service Worker registered !');
    })
  // tells the browser that support serviceWorkers that sw.js should be registered (and treated as
  // a background process
}
