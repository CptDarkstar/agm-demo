<script>
  import { authHandlers } from "../../store/store";
  import Register from "../../components/Register.svelte";
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  /* import { updateUserDataInFirestore } from './firebaseUtils'; */
  import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
  } from "firebase/firestore";
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

  /* let selectedUser = null; // Track the user being edited */

  onMount(async () => {
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
  });

  // Edit user function
  const editUser = (user) => {
    showEditModal(user); // Show the modal and set the selected user
  };
  // Function to handle editing user
  const handleEditUser = (user) => {
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
    const updatedShares = editedShares;

    // Pass the updated user information to the Firestore update function
    /* updateUserDataInFirestore(
      selectedUser.id,
      updatedName,
      updatedEmail,
      updatedShares
    ); */

    hideEditModal();
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
  };
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
      <div
        data-thq="thq-dropdown"
        class="drop_down_menu list-item agm-voting-dropdown"
      >
        <div data-thq="thq-dropdown-toggle" class="agm-voting-dropdown-toggle">
          <span class="agm-voting-text">Menu</span>
        </div>
        <ul data-thq="thq-dropdown-list" class="agm-voting-dropdown-list">
          <a href="/shareholders">
            <li data-thq="thq-dropdown" class="agm-voting-dropdown01 list-item">
              <div
                data-thq="thq-dropdown-toggle"
                class="agm-voting-dropdown-toggle01"
              >
                <i
                  id="icon"
                  class="icon fa-regular fa-user"
                  style="color: #ffffff;"
                ></i>
                <span class="agm-voting-text01">Share Holders</span>
              </div>
            </li>
          </a>
          <a href="/admin">
            <li data-thq="thq-dropdown" class="agm-voting-dropdown03 list-item">
              <div
                data-thq="thq-dropdown-toggle"
                class="agm-voting-dropdown-toggle03"
              >
                <i
                  class="icon fa-solid fa-square-poll-vertical"
                  style="color: #ffffff;"
                ></i>
                <span class="agm-voting-text03">Voting</span>
              </div>
            </li>
          </a>
        </ul>
      </div>
      <button on:click={authHandlers.logOut} class="log_out button"
        >Log Out</button
      >
    </div>
  </header>
  <Register />
  <h1>All Users</h1>
  <ul>
    {#each users as user}
      <li>
        <p>Name: {user.displayName}</p>
        <p>Email: {user.email}</p>
        <p>Shares: {user.shares}</p>
        <button on:click={() => editUser(user.id)}>Edit</button>
        <button on:click={() => deleteUser(user.id)}>Delete</button>
      </li>
    {/each}
  </ul>
  {#if showModal}
    <div class="edit-modal">
      <p>User: {selectedUser.name}</p>
      <ul>
        <li>
          <p>Name:</p>
          <input type="text" bind:value={editedName} />
        </li>
        <!-- Other input fields for editing user information -->
        <li>
          <p>Email:</p>
          <input type="text" bind:value={editedEmail} />
        </li>
        <li>
          <p>Shares:</p>
          <input type="number" bind:value={editedShares} />
        </li>
      </ul>
      <button
        on:click={() =>
          handleSaveChanges(editedName, editedEmail, editedShares)}
        >Save Changes</button
      >
      <button on:click={handleCloseEditModal}>Close</button>
    </div>
  {/if}
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  [data-thq="thq-dropdown"]:hover > [data-thq="thq-dropdown-list"] {
    display: flex;
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
  .log_out {
    color: #ffffff;
    width: auto;
    height: 100%;
    font-size: 30px;
    text-align: center;
    border-width: 0px;
    margin-right: 32px;
    text-decoration: none;
    background-color: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
  }
  .button {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-color: var(--dl-color-gray-black);
    border-radius: 4px;
  }
  .agm-voting-dropdown-toggle {
    fill: #595959;
    color: #ffffff;
    width: 100%;
    display: inline-flex;
    align-items: center;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
    justify-content: flex-start;
    background-color: #6ba3ab;
    cursor: pointer;
  }
  .agm-voting-dropdown-list {
    top: 125px;
    right: auto;
    /* width: 234%; */
    height: auto;
    display: none;
    z-index: 100;
    position: absolute;
    transition: 0.3s;
    align-items: stretch;
    flex-direction: column;
    list-style-type: none;
    background-color: #6ba3ab;
    list-style-position: inside;
  }
  .agm-voting-dropdown01 {
    width: 100%;
    cursor: pointer;
    height: 100%;
    display: inline-block;
    position: relative;
    border-color: var(--dl-color-gray-black);
    border-width: 1px;
    border-radius: var(--dl-radius-radius-radius4);
    text-decoration: none;
    background-color: #6ba3ab;
    border-bottom-width: 0px;
    border-top-left-radius: var(--dl-radius-radius-radius4);
    border-top-right-radius: var(--dl-radius-radius-radius4);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .agm-voting-dropdown-toggle01,
  .agm-voting-dropdown-toggle03 {
    fill: #595959;
    color: #ffffff;
    width: 100%;
    display: inline-flex;
    transition: 0.3s;
    align-items: center;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
    gap: 10px;
  }
  .agm-voting-text {
    width: 96px;
    font-size: 30px;
    font-style: normal;
    text-align: center;
    font-weight: 500;
    margin-right: 4px;
    vertical-align: middle;
  }
  .agm-voting-text01,
  .agm-voting-text03 {
    width: 100%;
    cursor: pointer;
    display: flex;
    font-size: 30px;
    font-style: normal;
    font-weight: 500;
    color: white;
  }
  .agm-voting-dropdown-toggle01:hover,
  .agm-voting-dropdown-toggle03:hover {
    fill: #fff;
    color: #fff;
    background-color: #595959;
  }
  @media (max-width: 720px) {
    .agm-voting-header {
      max-width: 100%;
      min-width: 100%;
    }
    .logo {
      width: 100px;
    }
    .agm-voting-text,
    .agm-voting-text01,
    .agm-voting-text03 {
      width: 100%;
      font-size: 15px;
      font-style: normal;
      text-align: center;
      font-weight: 500;
      margin-right: 4px;
      vertical-align: middle;
    }
    .agm-voting-dropdown-list {
      top: 97px;
      right: 3.9%;
      border-radius: 4px;
      /* width: 234%; */
      height: auto;
      display: none;
      z-index: 100;
      position: absolute;
      transition: 0.3s;
      align-items: stretch;
      flex-direction: column;
      list-style-type: none;
      background-color: #6ba3ab;
      list-style-position: inside;
    }
    .log_out {
      font-size: 15px;
      margin-right: 0%;
      padding-top: 8px;
      padding-left: 16px;
      border-radius: 4px;
      padding-right: 16px;
      padding-bottom: 8px;
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
    .agm-voting-text,
    .agm-voting-text01,
    .agm-voting-text03 {
      width: 100%;
      font-size: 15px;
      font-style: normal;
      text-align: center;
      font-weight: 500;
      margin-right: 4px;
      vertical-align: middle;
    }
    .log_out {
      font-size: 15px;
      margin-right: 0%;
      padding-top: 8px;
      padding-left: 16px;
      border-radius: 4px;
      padding-right: 16px;
      padding-bottom: 8px;
    }
  }
</style>
