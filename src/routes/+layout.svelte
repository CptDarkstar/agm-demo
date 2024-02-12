<script>
  import { onMount } from "svelte";
  import { auth, db } from "../lib/firebase/firebase";
  import { getDoc, doc, setDoc } from "firebase/firestore";
  import { authStore } from "../store/store";
  import "@fortawesome/fontawesome-free/css/all.min.css";

  const nonAuthRoutes = ["/", "/forgot_password"];

  onMount(() => {
    console.log("Mounting!");
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const currentPath = window.location.pathname;

      if (!user && !nonAuthRoutes.includes(currentPath)) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
          return;
        }
      }

      if (user && currentPath === "/") {
        window.location.href = "/dashboard";
        return;
      }

      if (!user) {
        return;
      }
      let dataToSetToStore;
      const docRef = doc(db, "user", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userRef = doc(db, "user", user.uid);
        dataToSetToStore = {
          email: user.email,
        };
        await setDoc(userRef, dataToSetToStore, { merge: true });
      } else {
        const userData = docSnap.data();
        dataToSetToStore = userData;
        /* console.log(docSnap); */
      }
      authStore.update((curr) => {
        return {
          ...curr,
          user,
          data: dataToSetToStore,
          loading: false,
        };
      });
    });
  });
</script>

<div class="mainContainer">
  <slot />
</div>

<style>
  .mainContainer {
    min-height: 100vh;
    background-image: url(../public/background.png);
    background-repeat: no-repeat;
    background-size: cover;
    color: black;
    position: relative;
    display: flex;
    flex-direction: column;
  }
</style>
