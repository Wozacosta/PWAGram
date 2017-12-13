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
    .register('/service-worker.js') // The scope parameter is optional, and can be used to specify the subset of your content that you want the service worker to control
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

function displayConfirmNotification() {
  if ('serviceWorker' in navigator){
    let options = {
      body: 'Your sw successfully subscribed to our notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      lang: 'en-US',
      vibrate: [100, 50, 200, 50, 400], // vibrationms pausems vibrations ms
      badge: '/src/images/icons/app-icon-96x96.png', // recommended (becomes blackwhite icon in notif tray)
      tag: 'confirm-notification', // same tags notifications will stack instead of spamming the user
      renotify: true, // new notif of same tag won't vibrate and alert the user if set to false
      actions: [
        {action: 'confirm', title: 'okay', icon: '/src/images/icons/app-icon-96x96.png'},
        {action: 'cancel', title: 'cancel', icon: '/src/images/icons/app-icon-96x96.png'},
      ]
    };
    navigator.serviceWorker.ready
      .then((swreg) => {
          swreg.showNotification('Successfully subscribed', options)
      });
  }

  // new Notification('Successfully subscribed', options);
}

function configurePushSub() {
  console.log('in configurePushSub');
  if (!('serviceWorker' in navigator)) {
    console.error('no serviceworker in navigator :(');
    return;
  }
  let reg;
  navigator.serviceWorker.ready
    .then((swreg) => {
      console.log('configurepushsub sw ready');
      reg = swreg;
      return swreg.pushManager.getSubscription(); // returns any existing subscription
    })
    .then((sub) => {
      console.log('configurepushsub got subscription list');
      if (sub === null){
        // createa new subscription
        const vapidPublicKey = 'BKbAEj2As7mzFqczoYdnnYonUOgfByDNAhPrO-zJsE2Bimbc7IWXf_HFFpumoetHkvBY31mnM3bu9xYiXr2lf8M';
        let convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      }else {
        console.log(' we have a subscription already !')
        // we have a subscription
      }
    })
    .then((newSub) => {
      console.log('configurepushsub made new subscription');
      return fetch('https://pwagram-882f7.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newSub)
      })
    })
    .then((res) => {
      console.log('configurepushsub finished fetching')
      console.log(res);
      if (res.ok){
        displayConfirmNotification();
      }
    })
    .catch((err) => {
      console.error('configurepushsub error')
      console.error(err);
    })
}

function askForNotificationPermission() {
  Notification.requestPermission().then((result) => {
    if (result === 'denied') {
      console.log('Permission wasn\'t granted. Allow a retry.');
      return;
    }
    if (result === 'default') {
      console.log('The permission request was dismissed.');
      return;
    }
    // Do something with the granted permission.
    // result = granted
    console.log('The permission request was granted');
    // TODO: hide btn
    // displayConfirmNotification();
    configurePushSub();
  });
}

let enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if ('Notification' in window && 'serviceWorker' in navigator){ // the browser supports notifications
  enableNotificationsButtons.forEach((btn) => {
      btn.style.display = 'inline-block';
      btn.addEventListener('click', askForNotificationPermission);
  })
}
