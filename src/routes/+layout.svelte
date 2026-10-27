<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { auth, db } from "$lib/firebase/firebase";
  import { getDoc, doc, setDoc } from "firebase/firestore";
  import { authStore, isAdmin } from "../store/store";
  import "@fortawesome/fontawesome-free/css/all.min.css";

  const nonAuthRoutes = ["/", "/forgot_password"];
  const adminRoutes = ["/admin", "/shareholders"];

  // Demo: the Admin mode toggle replaces the admin-claim check, so send
  // visitors away from the admin pages whenever it's off (including when
  // they switch it off while on one of those pages).
  $: if (browser && !$isAdmin && adminRoutes.includes($page.url.pathname)) {
    goto("/dashboard");
  }

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
