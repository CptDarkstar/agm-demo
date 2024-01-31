import { signInWithEmailAndPassword, signOut } from "firebase/auth";
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

function persistentStore(key, initialValue) {
    const { subscribe, set, update } = writable(initialValue);
   
    const loadFromSessionStorage = () => {
       const value = sessionStorage.getItem(key);
       if (value) {
         set(JSON.parse(value));
       }
    };
   
    const saveToSessionStorage = (value) => {
       sessionStorage.setItem(key, JSON.stringify(value));
    };
   
    return {
       subscribe,
       set: (value) => {
         saveToSessionStorage(value);
         return set(value);
       },
       update: (updater) => {
         const newValue = updater($loggedInStore);
         saveToSessionStorage(newValue);
         return update(() => newValue);
       },
    };
}
   export const loggedInStore = persistentStore("loggedIn", false);