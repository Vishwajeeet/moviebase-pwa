// Firebase initialization

const firebaseApp = firebase.initializeApp(
  APP_CONFIG.firebase
);

const db = firebase.firestore();

const auth = firebase.auth();