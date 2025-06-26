<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import { authHandlers } from "../../store/store";
  import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
  import AdminVotingTopic from "../../components/AdminVotingTopic.svelte";
  import Header from "../../components/Header.svelte";
  import { authStore } from "../../store/store";
  import { onMount } from "svelte";
  import { collection, doc, getDoc } from "firebase/firestore";
  import { auth, db } from "$lib/firebase/firebase";
  import { goto } from "$app/navigation";
  import { MDCMenu } from "@material/menu";

  /* let menu = Menu; */
  let menu = false;
  let clicked = "nothing yet";
  let userData = {}; // Initialize userData with an empty object
  let isAdmin;

  const handleShareHoldersAction = () => {
    clicked = "Share Holders";
    goto("/shareholders");
  };

  const handleVotingAction = () => {
    clicked = "Voting";
    goto("/admin");
  };

  function openMDCMenu(selector) {
    const menuElement = document.querySelector(selector);
    const menu = new MDCMenu(menuElement);

    const button = document.getElementById("menu-button");
    button.addEventListener("click", () => {
      menu.open = !menu.open;
    });
  }

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        /* user.getIdTokenResult().then((idTokenResult) => {
          isAdmin = idTokenResult.claims.admin;
          console.log(isAdmin);
        }); */
        const userDocRef = doc(collection(db, "users"), user.uid);
        try {
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            userData = userSnapshot.data(); // Store the entire user data in the userData object
          } else {
            console.log("No such document for the user!");
          }
        } catch (error) {
          console.error("Error getting user document: ", error);
        }
      } else {
        console.log("User is signed out!");
      }
    });

    return () => unsubscribe(); // Clean up the subscription when the component is destroyed
  });
</script>

<div class="maincontainer">
  <Header />
  <!-- <header data-role="Header" class="agm-voting-header">
    <img alt="logo" src="rnslogo.png" class="agm-voting-image logo" />
    <div class="agm-voting-btn-group">
      {#if isAdmin}
        <div
          id="demo-menu"
          class="admin mdc-menu-surface--anchor">
          <button
            id="menu-button"
            class="mdc-button mdc-button--raised admin"
            on:action={openMDCMenu(".mdc-menu")}>Menu</button>
          <div class="mdc-menu mdc-menu-surface">
          <ul
            class="mdc-deprecated-list"
            role="menu"
            aria-hidden="true"
            aria-orientation="vertical"
            tabindex="-1"
            bind:this={menu}
          >
            <a href="/shareholders">
              <li
                class="mdc-deprecated-list-item"
                role="menuitem"
                on:SMUI:action={handleShareHoldersAction}
              >
                <span class="mdc-deprecated-list-item__ripple"></span>
                <span class="mdc-deprecated-list-item__text">Share Holders</span
                >
              </li>
            </a>
            <a href="/admin">
              <li class="mdc-deprecated-list-item" role="menuitem">
                <span class="mdc-deprecated-list-item__ripple"></span>
                <span class="mdc-deprecated-list-item__text">Voting</span>
              </li>
            </a>
          </ul>
          </div>
        </div>
      {/if}
      <button
        class="mdc-button mdc-button--raised"
        on:click={authHandlers.logOut}
      >
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">Log out</span>
      </button>
    </div>
  </header> -->
  <h1 class="userText">
    {#if Object.keys(userData).length === 0}
      <i class="fa-solid fa-spinner fa-spin"></i>
    {:else}
      <p>Hi {userData.displayName}.</p>
      <br />
      <p>You will be voting with {userData.shares} shares.</p>
    {/if}
  </h1>
  <br />
  <AdminVotingTopic /> 
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  * :global(.mdc-button):hover {
    background: #595959;
  }
  .userText {
    text-align: center;
  }
</style>
