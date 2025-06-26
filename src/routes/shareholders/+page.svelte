<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import { authHandlers } from "../../store/store";
  import Register from "../../components/Register.svelte";
  import EditUser from "../../components/EditUser.svelte";
  import Header from "../../components/Header.svelte";
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  /* import { updateUserDataInFirestore } from './firebaseUtils'; */
  import { goto } from "$app/navigation";
  import Button, { Label } from "@smui/button";
  import { MDCMenu } from "@material/menu";
  import List, { Item, Separator, Text } from "@smui/list";
  /*   import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
  } from "firebase/firestore"; */
  import {
    editUserStore,
    showEditModal,
    hideEditModal,
    updateUserInFirestore,
  } from "../../store/editUserStore";

  let users = [];
  let editStore = editUserStore;
  let showModal;
  let selectedUser;
  let editedName = ""; // Define and initialize editedName
  let editedEmail = ""; // Define and initialize editedEmail
  let editedShares = 0; // Define and initialize editedShares as a number
  let menu = false;
  let clicked = "nothing yet";
  let isAdmin = true;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          isAdmin = idTokenResult.claims.admin;
        });
      }
    });
  });

  //Menu
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
</script>

{#if isAdmin}
  <div class="maincontainer">
    <Header />
    <h1>All Users</h1>
    <EditUser />
    <Register />
  </div>
{/if}

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  * :global(.mdc-button):hover {
    background: #595959;
  }
  @media (max-width: 430px) {

    * :global(.mdc-button) {
      font-size: 10px;
      padding-top: 2px;
      padding-left: 2px;
      padding-right: 2px;
      padding-bottom: 2px;
    }
    * :global(.mdc-deprecated-list-item__text) {
      font-size: 15px;
      padding-top: 0px;
      padding-left: 0px;
      border-radius: 0px;
      padding-right: 0px;
      padding-bottom: 0px;
    }
  }
</style>
