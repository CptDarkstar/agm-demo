import { getAuth, setPersistence, signInWithEmailAndPassword, browserSessionPersistence, signOut, onAuthStateChanged } from "firebase/auth";
import { writable } from "svelte/store";
import { auth } from "../lib/firebase/firebase"

export const authStore = writable({
    user: null,
    loading: true,
    data: {}
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, update the store
    authStore.set({
      user: {
        uid: user.uid,
        displayName: user.displayName,
        // ...other properties you want to store
      },
      loading: false,
      data: {} // any additional data you want to store
    });
  } else {
    // User is signed out, reset the store
    authStore.set({
      user: null,
      loading: false,
      data: {}
    });
  }
});

export const authHandlers = {
  login: async (email, pass) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // The authStore will be updated by the onAuthStateChanged listener
  },

  logOut: async () => {
    await signOut(auth);
    // The authStore will be updated by the onAuthStateChanged listener
  }
};

/* Session */
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    return signInWithEmailAndPassword(auth, email, password);
  })
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
  });