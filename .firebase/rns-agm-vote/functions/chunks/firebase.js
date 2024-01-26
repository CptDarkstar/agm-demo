import { getApps, initializeApp, getApp, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDO5PoainkCKKYQAqUvf-jM4hsd7Cn2cXU",
  authDomain: "rns-agm-vote.firebaseapp.com",
  projectId: "rns-agm-vote",
  storageBucket: "rns-agm-vote.appspot.com",
  messagingSenderId: "619154242072",
  appId: "1:619154242072:web:e9c3ad885ad759f210616d"
};
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
  deleteApp(firebaseApp);
  firebaseApp = initializeApp(firebaseConfig);
}
getFirestore(firebaseApp);
getAuth(firebaseApp);
