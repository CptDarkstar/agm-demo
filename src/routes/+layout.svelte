<script>
  import { onMount } from "svelte";
  import { auth, db } from "../lib/firebase/firebase";
  import { getDoc, doc, setDoc } from "firebase/firestore";
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import { loggedInStore } from '../store/store';

  const nonAuthRoutes = ["/"];
  
  onMount(() => {
    console.log("Mounting!");
    const unsubscribe = auth.onAuthStateChanged(async user => {
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

      const docRef = doc(db, 'users', user.uid)
            const docSnap = await getDoc(docRef)
            if (!docSnap.exists()) {
                const userRef = doc(db, 'user', user.uid)
                await setDoc(
                    userRef,
                    {
                        email: user.email, 
                    }
                );
            } else {
                const userData = docSnap.data()

            }
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
