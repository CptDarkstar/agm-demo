<script>
  import { authHandlers } from "../../store/store";
  import Register from "../../components/Register.svelte";
  import EditUser from "../../components/EditUser.svelte";
/*   import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase"; */
  /* import { updateUserDataInFirestore } from './firebaseUtils'; */
  import { goto } from "$app/navigation";
  import Button, { Label } from "@smui/button";
  import Menu from "@smui/menu";
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
  let menu = Menu;
  let clicked = "nothing yet";

  //Menu
  const handleShareHoldersAction = () => {
    clicked = "Share Holders";
    goto("/shareholders");
  };

  const handleVotingAction = () => {
    clicked = "Voting";
    goto("/admin");
  };

  /* let selectedUser = null; // Track the user being edited */

/*   onMount(async () => {
    const usersCollection = collection(db, "user");
    try {
      const querySnapshot = await getDocs(usersCollection);
      const userData = [];
      querySnapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      users = userData; // Update the users array
    } catch (error) {
      console.error("Error getting users collection: ", error);
    }
  }); */

  // Edit user function
/*   const editUser = (user) => {
    showEditModal(user); // Show the modal and set the selected user
  }; */
  // Function to handle editing user
/*   const handleEditUser = (user) => {
    showEditModal(user); // Show the edit modal with the selected user
  };
  // Function to handle closing the edit modal
  const handleCloseEditModal = () => {
    hideEditModal(); // Hide the edit modal
  };

  // Merged handleSaveChanges function with the additional functionality
  const handleSaveChanges = async (displayName, email, shares) => {

    if (
      !displayName ||
      typeof displayName !== "string" ||
      displayName.trim() === ""
    ) {
      console.error("Error: Invalid display name");
      return;
    }

    if (!email || typeof email !== "string") {
      console.error("Error: Invalid email");
      return;
    }

    const sharesNumber = parseInt(shares, 10);
    if (isNaN(sharesNumber)) {
      console.error("Error: Invalid shares value");
      return;
    }

    editUserStore.update((store) => {
      if (store.selectedUser && typeof store.selectedUser === "object") {
        store.selectedUser = {
          ...store.selectedUser,
          name: displayName,
          email: email,
          shares: sharesNumber,
        };
      }
      return store;
    });

    const updatedUser = $editUserStore.selectedUser; // Access the value directly from the store

    if (updatedUser) {
      const userDocRef = doc(collection(db, "user"), updatedUser); // Use collection function if 'users' is the collection name

      const userData = {
        displayName: displayName,
        email: email,
        shares: sharesNumber,
      };

      try {
        await updateDoc(userDocRef, userData);
        console.log("User data updated in Firestore successfully");
      } catch (error) {
        console.error("Error updating user data in Firestore:", error);
      }
    } else {
      console.error("Error: No user selected for update");
    }

    // Obtain the updated user information from the edited fields
    const updatedName = editedName;
    const updatedEmail = editedEmail;
    const updatedShares = editedShares; */

    // Pass the updated user information to the Firestore update function
    /* updateUserDataInFirestore(
      selectedUser.id,
      updatedName,
      updatedEmail,
      updatedShares
    ); */

    /* hideEditModal();
  };

  // Subscribe to the editUserStore to get the showModal and selectedUser values
  const unsubscribe = editStore.subscribe((value) => {
    showModal = value.showModal;
    selectedUser = value.selectedUser;
  });

  // Unsubscribe from the store when the component is destroyed
  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  // Delete user function
  const deleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "user", userId)); // Delete user from Firestore
      // For example: await deleteDoc(doc(db, 'user', userId));
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  }; */
</script>

<div class="maincontainer">
  <header data-role="Header" class="agm-voting-header">
    <a href="/dashboard">
      <img
        alt="logo"
        src="rnslogo.png"
        class="agm-voting-image logo"
        href="/dashboard"
      />
    </a>
    <div class="agm-voting-btn-group">
      <Button on:click={() => menu.setOpen(true)}>
        <Label>Menu</Label>
      </Button>
      <Menu bind:this={menu}>
        <List>
          <Item on:SMUI:action={handleShareHoldersAction}>
            <Text>Share Holders</Text>
          </Item>
          <Separator />
          <Item on:SMUI:action={handleVotingAction}>
            <Text>Voting</Text>
          </Item>
        </List>
      </Menu>
      <Button on:click={authHandlers.logOut} variant="raised">
        <Label>Log Out</Label>
      </Button>
    </div>
  </header>
  <Register />
  <h1>All Users</h1>
  <EditUser />
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  * :global(.mdc-button) {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    font-size: 30px;
    color: white;
    padding-top: 30px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 30px;
  }
  * :global(.mdc-button):hover {
    background: #595959;
  }
  * :global(.mdc-menu) {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
  }
  * :global(.mdc-deprecated-list-item):hover {
    background: #595959;
  }
  * :global(.mdc-deprecated-list-item__text) {
    font-size: 30px;
    color: white;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
  }
  .agm-voting-header {
    width: 100%;
    height: auto;
    display: flex;
    max-width: 1400px;
    min-width: 1400px;
    align-self: center;
    align-items: center;
    justify-content: space-between;
  }
  .agm-voting-btn-group {
    width: auto;
    height: auto;
    display: flex;
    align-items: center;
    border-radius: 4px;
    flex-direction: row;
    justify-content: space-between;
    gap: 30px;
  }
  @media (max-width: 720px) {
    .agm-voting-header {
      max-width: 100%;
      min-width: 100%;
    }
    .logo {
      width: 100px;
    }
  }
  @media (max-width: 430px) {
    .agm-voting-header {
      max-width: 100%;
      min-width: 100%;
    }
    .logo {
      width: 165px;
    }
    .agm-voting-btn-group {
      width: 65%;
      height: auto;
      display: flex;
      align-items: center;
      border-radius: 4px;
      flex-direction: row;
      justify-content: flex-end;
      gap: 10px;
    }
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
