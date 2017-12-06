const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
var serviceAccount = require("./pwagram_fb-key.json");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
admin.initializeApp({
  databaseURL: 'https://pwagram-882f7.firebaseio.com/',
  credential: admin.credential.cert(serviceAccount)
})

exports.storePostData = functions.https.onRequest((request, response) => {
  let {id, title, location, image} = request.body;
 cors(request, response, () => {
   admin.database().ref('posts').push({
     id,
     title,
     location,
     image
   })
     .then(() => {
       response.status(201).json({
         message: 'Data stored',
         id
       })
     })
     .catch((err) => {
       response.status(500).json({error: err});
     })
 });
});
