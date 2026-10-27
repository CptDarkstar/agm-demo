<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import { onAuthStateChanged } from "firebase/auth";
  import AdminVotingTopic from "../../components/AdminVotingTopic.svelte";
  import AppHeader from "../../components/AppHeader.svelte";
  import { onMount } from "svelte";
  import { collection, doc, getDoc } from "firebase/firestore";
  import { auth, db } from "$lib/firebase/firebase";
  import bgPhoto from "../../public/background.png";

  let userData = {}; // Initialize userData with an empty object

  $: shareCount = Number(userData.shares) || 0;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(collection(db, "users"), user.uid);
        try {
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            userData = userSnapshot.data(); // Store the entire user data in the userData object
          } else {
            console.error("No such document for the user!");
          }
        } catch (error) {
          console.error("Error getting user document: ", error);
        }
      }
    });

    return () => unsubscribe(); // Clean up the subscription when the component is destroyed
  });
</script>

<div class="dashboard">
  <img class="bgPhoto" src={bgPhoto} alt="" />
  <div class="overlay"></div>

  <AppHeader logoLink={false} />

  <main class="content">
    <div class="greeting">
      {#if Object.keys(userData).length === 0}
        <i class="fa-solid fa-spinner fa-spin" aria-label="Loading"></i>
      {:else}
        <h1>Hi {userData.displayName}.</h1>
        <p>
          You will be voting with
          <b>{shareCount.toLocaleString()} {shareCount === 1 ? "share" : "shares"}</b>.
        </p>
      {/if}
    </div>

    <AdminVotingTopic />
  </main>
</div>

<style>
  .dashboard {
    position: relative;
    min-height: 100vh;
    background: #0f3a40;
    box-sizing: border-box;
    padding: clamp(12px, 3vw, 40px);
    color: #fff;
    font-family: "Roboto", sans-serif;
  }
  /* Fixed so the photo stays put while a long resolution list scrolls. */
  .bgPhoto {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 18% 100%;
    filter: saturate(0.7);
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(15, 58, 64, 0.55) 0%,
      rgba(10, 35, 39, 0.9) 55%
    );
  }
  .content {
    position: relative;
    max-width: 900px;
    margin: 48px auto 0;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .greeting {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;
    font-size: 28px;
  }
  .greeting h1 {
    margin: 0;
    font: 600 clamp(32px, 4vw, 48px) / 1.05 "Roboto", sans-serif;
    letter-spacing: -0.035em;
  }
  .greeting p {
    margin: 0;
    font-size: 17px;
    color: rgba(255, 255, 255, 0.85);
  }
  .greeting b {
    color: #fff;
  }
</style>
