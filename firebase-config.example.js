

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkjOpPPO_0ANowaHxsWgsQsGxBf7y6v7M",
  authDomain: "adivina-la-cancion-8cc62.firebaseapp.com",
  projectId: "adivina-la-cancion-8cc62",
  storageBucket: "adivina-la-cancion-8cc62.firebasestorage.app",
  messagingSenderId: "100344908259",
  appId: "1:100344908259:web:786b2d1f04660f3e86b8d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const firebaseConfigured = !Object.values(firebaseConfig)
  .some(value => String(value).startsWith("PEGA_AQUI"));

window.firebaseConfigured = firebaseConfigured;
window.firebaseReady = Promise.resolve(false);

if (firebaseConfigured) {
  firebase.initializeApp(firebaseConfig);
  window.gameDb = firebase.firestore();
  window.firebaseReady = firebase.auth().signInAnonymously()
    .then(() => true)
    .catch(error => {
      console.error("No se pudo iniciar Firebase de forma anónima:", error);
      return false;
    });
} else {
  console.warn("Firebase aún no está configurado. El juego funcionará, pero el ranking será local en cada celular.");
}
