// idb : This is your entry point to the API. It's exposed to the global scope unless you're using a module system
// idb.open(name, version, upgradeCallback)
let dbPromise = idb.open('post-store', 1, (db) => {
  if (!db.objectStoreNames.contains('posts')){
    db.createObjectStore('posts', {keyPath: 'id'});
  }
});


function writeData(st, data) {
  dbPromise
    .then((db) => {
      let tx = db.transaction(st, 'readwrite'); // readonly
      let store = tx.objectStore(st);
      store.put(data);
      return tx.complete;
    })
}