var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
var sharedMomentsArea = document.querySelector('#shared-moments');
let form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');
let videoPlayer = document.querySelector('#player');
let canvasElement = document.querySelector('#canvas');
let captureButton = document.querySelector('#capture-btn');
let imagePicker = document.querySelector('#image-picker');
let imagePickerArea = document.querySelector('#pick-image');
let picture;
let locationBtn = document.querySelector('#location-btn');
let locationLoader = document.querySelector('#location-loader');
let fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener('click', (event) => {
  let sawAlert = false;
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';
  navigator.geolocation.getCurrentPosition((position) => {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    console.log(position);
    fetchedLocation = {lat:position.coords.latitude, lng: position.coords.longitude};
    fetch(`https://www.mapquestapi.com/geocoding/v1/reverse?key=2VL5nYLwpFqkWt3aE9u2JEVBid0fWTaU&location=${fetchedLocation.lat}%2C${fetchedLocation.lng}&outFormat=json&thumbMaps=false`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
        locationInput.value = data.results[0].locations[0].adminArea5 + ', ' + data.results[0].locations[0].adminArea3 + ', ' + data.results[0].locations[0].adminArea1; // TODO: use google geocoding api
        document.querySelector('#manual-location').classList.add('is-focused');
      })


  }, (err) => {
    console.error(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';

    fetchedLocation = {lat:0, lng: 0};
    if (!sawAlert){
      alert(`couldn't fetch location, please enter manually'`);
      sawAlert = true;
    }
  }, {
    timeout: 7000, // 7s to find position before failing
  })
});

function initializeLocation() {
  if (!('geolocation' in navigator)){
    locationBtn.style.display = 'none';
  }
}

function initializeMedia() {
  if(!('mediaDevices' in navigator)){
    navigator.mediaDevices = {};
  }
  if (!('getUserMedia' in navigator.mediaDevices)){
    navigator.mediaDevices.getUserMedia = (constraints) => {
      let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({video: true}) // audio : true
    .then((stream) => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch((err) => {
      console.error(err);
      // show imagepicker as a fallback
      imagePickerArea.style.display = 'block';
    })
}
// get stream from video element, send it to canvas which will automatically snapshot it
captureButton.addEventListener('click', (event) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  let context = canvasElement.getContext('2d') // init how we want to draw on the canvas
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', (event) => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  // setTimeout(() => {
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

  initializeMedia();
  initializeLocation();
  // }, 1)

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiceResult => {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome === 'dismissed') {
        console.log('user cancelled installation');
      } else {
        console.log('user added to home screen');
      }
    });
    deferredPrompt = null;
  }
}

function closeCreatePostModal() {

  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';
  if (videoPlayer.srcObject){
    videoPlayer.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    })
  }
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1);
  // setTimeout(() => {
  //   createPostArea.style.display = 'none';
  // },300);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, offering cache on demand
function onSaveButtonClicked(event) {
  console.log(`clicked btn, event = `, event);
  if ('caches' in window) {
    caches.open('user-requested').then(cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '200px'; // 180px original
  cardTitle.style.backgroundPosition = 'bottom'; // Or try 'center'
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';

  /*
  // cache on demand
  var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'save';
  cardSaveButton.addEventListener('click', onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);
  */

  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(posts) {
  clearCards();
  console.log(`in update, posts = `, posts);
  posts.forEach(post => {
    console.log(`here post = `, post);
    createCard(post);
  });
}

const URL = 'https://pwagram-882f7.firebaseio.com/posts.json';
let networkDataReceived = false;

fetch(URL)
  .then(res => {
    return res.json();
  })
  .then(data => {
    networkDataReceived = true;
    console.log('from web ', data);
    let dataArray = Object.keys(data).map(key => data[key]);
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts').then(data => {
    if (!networkDataReceived) {
      // if we did receive network data, we don't want to overwrite it with the cache
      console.log('From indexedDB cache ', data);
      updateUI(data);
    }
  });
}

function sendData() {
  let postData = new FormData();
  postData.append('id', new Date().toISOString());
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, dt.id + '.png'); // third argument = overwrite title of image (we could check mimetype alternatively to be careful)


  fetch('https://us-central1-pwagram-882f7.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData,
  })
    .then((res) => {
      console.log(`sent data !, res = `, res);
      updateUI();
    })
}

form.addEventListener('submit', event => {
  console.log(`submitting form`);
  event.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    return;
  }
  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // backgroundSync
    console.log('using syncmanager');
    navigator.serviceWorker.ready.then(sw => {
      let post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        rawLocation: fetchedLocation,
        picture: picture,
      };
      writeData('sync-posts', post)
        .then(() => {
          return sw.sync.register('sync-new-post');
        })
        .then(() => {
          let snackbarContainer = document.querySelector('#confirmation-toast');
          let data = {
            message: 'Your Post was saved for syncing!',
          };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.error(err);
        })
      ;
    });
  } else {
    // fallback
    sendData();
  }
});
