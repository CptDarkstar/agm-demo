<script>
  import { onMount } from "svelte";
  import { auth, db } from "../lib/firebase/firebase";
  import { getDoc, doc, setDoc } from "firebase/firestore";
  import { authStore } from "../store/store";
  import "@fortawesome/fontawesome-free/css/all.min.css";

  const nonAuthRoutes = ["/", "/forgot_password"];

  onMount(() => {
    /* console.log("Mounting!"); */
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const currentPath = window.location.pathname;

      if (!user && !nonAuthRoutes.includes(currentPath)) {
        if (window.location.pathname !== "/", window.location.pathname !== "/download") {
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

      // Check if user has admin claim
      const idTokenResult = await user.getIdTokenResult();
      if (
        !idTokenResult.claims.admin &&
        (currentPath === "/admin" || currentPath === "/shareholders")
      ) {
        // Redirect non-admin users from admin and shareholders pages
        window.location.href = "/dashboard";
        return;
      }

      let dataToSetToStore;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userRef = doc(db, "users", user.uid);
        dataToSetToStore = {
          email: user.email,
        };
        await setDoc(userRef, dataToSetToStore, { merge: true });
      } else {
        const userData = docSnap.data();
        dataToSetToStore = userData;
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
    background-position: top center;
    background-attachment: fixed;
    color: black;
    position: relative;
    display: flex;
    flex-direction: column;
  }
</style>
