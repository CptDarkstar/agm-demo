import { getAuth, setPersistence, signInWithEmailAndPassword, browserSessionPersistence, signOut } from "firebase/auth";
import { writable } from "svelte/store";
import { auth } from "../lib/firebase/firebase"

export const authStore = writable({
    user: null,
    loading: true,
    data: {}
});

export const authHandlers = {
    login: async(email, pass) => {
        await signInWithEmailAndPassword(auth, email, pass)
    },

    logOut: async() => {
        await signOut(auth)
    }
};

/* const auth = getAuth(); */
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    return signInWithEmailAndPassword(auth, email, password);
  })
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
  });