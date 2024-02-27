<script>
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import LinearProgress from "@smui/linear-progress";
  import Button from "@smui/button";
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
  } from "../store/editUserStore";

  let users = [];
  let editStore = editUserStore;
  let showModal;
  let selectedUser;
  let editedName = ""; // Define and initialize editedName
  let editedEmail = ""; // Define and initialize editedEmail
  let editedShares = 0; // Define and initialize editedShares as a number

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

<!-- <ul>
  {#each users as user}
    <li>
      <p>Name: {user.displayName}</p>
      <p>Email: {user.email}</p>
      <p>Shares: {user.shares}</p>
      <button on:click={() => editUser(user.id)}>Edit</button>
      <button on:click={() => deleteUser(user.id)}>Delete</button>
    </li>
  {/each}
</ul> -->
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
      on:click={() => handleSaveChanges(editedName, editedEmail, editedShares)}
      >Save Changes</button
    >
    <button on:click={handleCloseEditModal}>Close</button>
  </div>
{/if}

<DataTable table$aria-label="User list" style="width: auto;">
  <Head>
    <Row>
      <Cell style="width: 100%;">Name</Cell>
      <Cell>Email</Cell>
      <Cell numeric>Shares</Cell>
      <Cell>Edit User</Cell>
    </Row>
  </Head>
  <Body>
    {#each users as user}
      <Row>
        <Cell>{user.displayName}</Cell>
        <Cell>{user.email}</Cell>
        <Cell numeric>{user.shares}</Cell>
        <Cell>
          <button on:click={() => editUser(user.id)}>Edit</button>
          <button on:click={() => deleteUser(user.id)}>Delete</button></Cell
        >
      </Row>
    {/each}
  </Body>
</DataTable>
