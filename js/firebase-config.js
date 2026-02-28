// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBWP2m1qx2bMpqChzACT5VmeJjZdXVuFjs",
  authDomain: "project-jsi-final.firebaseapp.com",
  projectId: "project-jsi-final",
  messagingSenderId: "12599530024",
  appId: "1:12599530024:web:7e2c31a2007eb72499db1d"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);

console.log("Firebase initialized:", firebase.app().name);

// Services
const auth = firebase.auth();
const db = firebase.firestore();
