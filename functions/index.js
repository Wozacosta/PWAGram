const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
var serviceAccount = require('./pwagram_fb-key.json');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
admin.initializeApp({
  databaseURL: 'https://pwagram-882f7.firebaseio.com/',
  credential: admin.credential.cert(serviceAccount),
});

exports.storePostData = functions.https.onRequest((request, response) => {
  let { id, title, location, image } = request.body;
  cors(request, response, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id,
        title,
        location,
        image,
      })
      .then(() => {
        webpush.setVapidDetails(
          'mailto:wozacosta@gmail.com',
          'BKbAEj2As7mzFqczoYdnnYonUOgfByDNAhPrO-zJsE2Bimbc7IWXf_HFFpumoetHkvBY31mnM3bu9xYiXr2lf8M',
          'uluup1cqd8hbl3FmGPeqeMaedWLNWpDRl6iHnGBMw98'
        );
        return admin.database().ref('subscriptions').once('value');
      })
      .then((subscriptions) => {
        subscriptions.forEach((sub) => {
          let pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };
          webpush.sendNotification(pushConfig, JSON.stringify({
            title: 'New post',
            content: 'a new post was added!'
          })).catch((err) => {
            console.error(err);
          })
        })


        response.status(201).json({
          message: 'Data stored',
          id,
        });
      })
      .catch(err => {
        response.status(500).json({ error: err });
      });
  });
});
