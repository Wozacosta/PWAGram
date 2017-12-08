// idb : This is your entry point to the API. It's exposed to the global scope unless you're using a module system
// idb.open(name, version, upgradeCallback)
let dbPromise = idb.open('post-store', 1, (db) => {
  if (!db.objectStoreNames.contains('posts')){
    db.createObjectStore('posts', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('sync-posts')){
    db.createObjectStore('sync-posts', {keyPath: 'id'});
  }
});


function writeData(st, data) {
  return dbPromise
    .then((db) => {
      let tx = db.transaction(st, 'readwrite');
      let store = tx.objectStore(st);
      store.put(data);
      return tx.complete; // must return on every write operation to make sure that the DB integrity is there
    })
}

function readAllData(st) {
  return dbPromise
    .then( (db) => {
      let tx = db.transaction(st, 'readonly');
      let store = tx.objectStore(st);
      return store.getAll(); // get(id) for single element
    })
}

function clearAllData(st) {
  return dbPromise
    .then((db) => {
      let tx = db.transaction(st, 'readwrite');
      let store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    });
}

function deleteItemFromData(st, id){
  return dbPromise
    .then((db) => {
      let tx = db.transaction(st, 'readwrite');
      let store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log(`item ${id} deleted`);
    })
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}