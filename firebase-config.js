/*
  CONFIGURACIÓN FIREBASE
  1) Crea un proyecto en Firebase.
  2) Activa Authentication > Anonymous.
  3) Crea Cloud Firestore.
  4) En Project settings > Your apps > Web app, copia aquí firebaseConfig.
*/

const firebaseConfig = {
  apiKey: "PEGA_AQUI_API_KEY",
  authDomain: "PEGA_AQUI_AUTH_DOMAIN",
  projectId: "PEGA_AQUI_PROJECT_ID",
  storageBucket: "PEGA_AQUI_STORAGE_BUCKET",
  messagingSenderId: "PEGA_AQUI_MESSAGING_SENDER_ID",
  appId: "PEGA_AQUI_APP_ID"
};

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
