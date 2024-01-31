<script>
  import { onMount } from "svelte";
  import { auth, db } from "../lib/firebase/firebase";
  import { getDoc, doc, setDoc } from "firebase/firestore";
  import '@fortawesome/fontawesome-free/css/all.min.css';

  const nonAuthRoutes = ["/"];
  
  onMount(() => {
 console.log("Mounting!");
 const unsubscribe = auth.onAuthStateChanged(async user => {
    const currentPath = window.location.pathname;

    if (user) {
      sessionStorage.setItem('loggedIn', 'true'); // User is logged in

      if (currentPath === "/") {
        window.location.href = "/dashboard";
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
    } else {
      sessionStorage.removeItem('loggedIn'); // User is not logged in

      if (!nonAuthRoutes.includes(currentPath)) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
          return;
        }
      }
    }

    // Check if the user is logged in
    if (!user && sessionStorage.getItem('loggedIn') === 'true') {
        sessionStorage.removeItem('loggedIn');
        window.location.href = "/";
        return;
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
