import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { auth } from "$lib/firebase/firebase";

// Demo only: the "Admin mode" switch in AppHeader stands in for the admin
// custom claim, so visitors can try the admin pages. It's kept in
// sessionStorage so refreshing /admin or /shareholders doesn't switch it off.
const ADMIN_MODE_KEY = "demoAdminMode";
export const isAdmin = writable(
  browser && sessionStorage.getItem(ADMIN_MODE_KEY) === "true"
);
if (browser) {
  isAdmin.subscribe((value) =>
    sessionStorage.setItem(ADMIN_MODE_KEY, String(value))
  );
}

export const authStore = writable({
  user: null,
  loading: true,
  data: {},
  admin: null,
});

// Firebase Auth only exists in the browser (see firebase.js), so skip this
// listener during server-side rendering.
if (browser) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
    
      // User is signed in, update the store
      authStore.set({
        user: {
          uid: user.uid,
          displayName: user.displayName,
          admin: user.admin,
          // ...other properties you want to store
        },
        loading: false,
        data: {}, // any additional data you want to store
      });
    } else {
      // User is signed out, reset the store
      authStore.set({
        user: null,
        loading: false,
        data: {},
      });
    }
  });
}

export const authHandlers = {
  login: async (email, pass, remember = true) => {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );
    await signInWithEmailAndPassword(auth, email, pass);
    // The authStore will be updated by the onAuthStateChanged listener
  },

  logOut: async () => {
    await signOut(auth);
    isAdmin.set(false);
    // The authStore will be updated by the onAuthStateChanged listener
  },
};
