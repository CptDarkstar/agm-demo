<script>
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import LinearProgress from "@smui/linear-progress";
  import Button, { Label } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Textfield from "@smui/textfield";
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
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
  let id = "";
  let editedName = ""; // Define and initialize editedName
  let editedEmail = ""; // Define and initialize editedEmail
  let editedShares = 0; // Define and initialize editedShares as a number
  let open = false;
  let clicked = "Nothing yet.";

  onMount(async () => {
    const usersCollection = collection(db, "users");
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
    console.log("Edit user:", user);
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

  //Server side to Update User
  async function handleSaveChanges(user) {
    try {
      const userData = {
        displayName: editedName,
        email: editedEmail,
        shares: editedShares,
      }; // Correct assignment of values to keys
      console.log("userData:", userData);
      const response = await axios.put(
        `https://agm-node-cptdarkstar.onrender.com/updateUser/${user.id}`,
        userData
      );
      console.log("User data updated successfully:", response.data);
      // Optionally, you can handle success feedback or navigation here
    } catch (error) {
      console.error("Error updating user data:", error);
      // Optionally, you can handle error feedback here
    }
  }

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

  // Create event dispatcher to dispatch custom events
  const dispatch = createEventDispatcher();

  const deleteUser = async (userId) => {
    try {
      await axios.delete(
        `https://agm-node-cptdarkstar.onrender.com/deleteUser/${userId}`
      );
      // Once the delete request is successful, you can update the UI or perform any other actions as needed
      console.log("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  };

  function handleDeleteConfirmation(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(userId);
    }
  }
</script>

<Dialog
  bind:open
  aria-labelledby="simple-title"
  aria-describedby="simple-content"
>
  <Title id="simple-title">Edit User:</Title>
  <Content id="simple-content">
    <Textfield bind:value={editedName} label="Name" />
    <Textfield type="email" bind:value={editedEmail} label="Email" />
    <Textfield type="number" bind:value={editedShares} label="Shares" />
  </Content>
  <Actions>
    <Button
      on:click={() => {
        handleSaveChanges(selectedUser);
      }}
    >
      <Label>Save Changes</Label>
    </Button>
    <Button on:click={() => (clicked = "Cancel")}>
      <Label>Cancel</Label>
    </Button>
  </Actions>
</Dialog>

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
          <button
            class="mdc-button mdc-button--raised"
            on:click={() => {
              selectedUser = user;
              open = true;
            }}
          >
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__focus-ring"></span>
            <span class="mdc-button__label">Edit</span>
          </button>
          <button
            class="mdc-button mdc-button--raised"
            on:click={() => handleDeleteConfirmation(user.id)}
          >
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__focus-ring"></span>
            <span class="mdc-button__label">Delete</span>
          </button>
        </Cell>
      </Row>
    {/each}
  </Body>
</DataTable>
