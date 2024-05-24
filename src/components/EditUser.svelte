<script>
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
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
  let editedName = "";
  let editAgency = "";
  let editedEmail = "";
  let editedShares = 0;
  let open = false;
  let sortColumn = "";
  let sortDirection = "asc";

  onMount(async () => {
    const usersCollection = collection(db, "users");
    try {
      const querySnapshot = await getDocs(usersCollection);
      const userData = [];
      querySnapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      users = userData;
    } catch (error) {
      console.error("Error getting users collection: ", error);
    }
  });

  const editUser = (user) => {
    showEditModal(user);
  };

  const handleEditUser = (user) => {
    showEditModal(user);
  };

  const handleCloseEditModal = () => {
    hideEditModal();
  };

  async function handleSaveChanges(user) {
    try {
      const userData = {
        displayName: editedName,
        email: editedEmail,
        agency: editAgency,
        shares: editedShares,
      };
      const response = await axios.put(
        `https://agm-node-cptdarkstar.onrender.com/updateUser/${user.id}`,
        userData
      );
      console.log("User data updated successfully:", response.data);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }

  const unsubscribe = editStore.subscribe((value) => {
    showModal = value.showModal;
    selectedUser = value.selectedUser;
  });

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  const dispatch = createEventDispatcher();

  const deleteUser = async (userId) => {
    try {
      await axios.delete(
        `https://agm-node-cptdarkstar.onrender.com/deleteUser/${userId}`
      );
      users = users.filter((user) => user.id !== userId);
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

  function sortUsers(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }

    users = [...users].sort((a, b) => {
      if (a[column] < b[column]) return sortDirection === "asc" ? -1 : 1;
      if (a[column] > b[column]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
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
    <Textfield bind:value={editAgency} label="Agency" />
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
    <Button on:click={handleCloseEditModal}>
      <Label>Cancel</Label>
    </Button>
  </Actions>
</Dialog>

<DataTable table$aria-label="User list" style="width: auto;">
  <Head>
    <Row>
      <Cell
        style="width: 100%; cursor: pointer;"
        on:click={() => sortUsers("agency")}>Agency</Cell
      >
      <Cell
        style="width: 100%; cursor: pointer;"
        on:click={() => sortUsers("displayName")}>Name</Cell
      >
      <Cell style="cursor: pointer;" on:click={() => sortUsers("email")}
        >Email</Cell
      >
      <Cell
        style="cursor: pointer;"
        numeric
        on:click={() => sortUsers("shares")}>Shares</Cell
      >
      <Cell>Edit User</Cell>
    </Row>
  </Head>
  <Body>
    {#each users as user}
      <Row>
        <Cell>{user.agency}</Cell>
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
