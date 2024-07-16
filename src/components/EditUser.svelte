<script>
  import { onMount, onDestroy } from "svelte";
  import Select, { Option } from "@smui/select";
  import { auth, db } from "$lib/firebase/firebase";
  import AddProxy from "./AddProxy.svelte";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import Button, { Label } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Textfield from "@smui/textfield";
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
  import {
    collection,
    getDocs,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
  } from "firebase/firestore";
  import {
    editUserStore,
    showEditModal,
    hideEditModal,
    updateUserInFirestore,
  } from "../store/editUserStore";

  let users = [];
  let proxies = [];
  let editStore = editUserStore;
  let showModal;
  let selectedUser;
  let selectedUserName;
  let editedName = "";
  let editAgency = "";
  let editedEmail = "";
  let editedShares = 0;
  let open = false;
  let openProxy = false;
  let openAddProxy = false;
  let sortColumn = "";
  let sortDirection = "asc";
  let loading = true;

  onMount(async () => {
    await usersCollection();
    await initProxies();
  });

  // Get User colcetion
  const usersCollection = async () => {
    const usersRef = collection(db, "users");
    try {
      onSnapshot(usersRef, (snapshot) => {
        const userData = [];
        snapshot.forEach((doc) => {
          userData.push({ id: doc.id, ...doc.data() });
        });
        users = userData;
        loading = false;
      });
    } catch (error) {
      console.error("Error getting users collection: ", error);
      loading = false;
    }
  };

  // Get proxy colcetion
  const initProxies = async () => {
    const proxyRef = collection(db, "proxies");

    const proxyCollection = query(
      proxyRef,
      where("principalId", "==", selectedUser)
    );
    try {
      onSnapshot(proxyCollection, (snapshot) => {
        const proxyData = [];
        snapshot.forEach((doc) => {
          proxyData.push({ id: doc.id, ...doc.data() });
        });
        proxies = proxyData;
        loading = false;
      });
    } catch (error) {
      console.error("Error getting proxies collection: ", error);
    }
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
  // Delete Proxy
  const deleteProxy = async (proxyId) => {
    try {
      await deleteDoc(doc(db, "proxies", proxyId));
      console.log("Proxy deleted successfully");
    } catch (error) {
      console.error("Error deleting proxy: ", error);
    }
  };

  function handleDeleteProxyConfirmation(proxyId) {
    if (confirm("Are you sure you want to delete this proxy?")) {
      deleteProxy(proxyId);
    }
  }
  //
</script>

<!-- Edit User Dialog -->
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

<!-- Add Proxy Dialog -->
<Dialog
  class="proxy"
  bind:open={openProxy}
  fullscreen
  aria-labelledby="over-fullscreen-title"
  aria-describedby="over-fullscreen-title"
>
  <Title id="over-fullscreen-title">Add Proxy:</Title>
  <Content id="fullscreen-content">
    {#if loading}
      <p>Loading...</p>
    {:else}
      <DataTable table$aria-label="Proxies list" style="width: auto;">
        <Head>
          <Row>
            <Cell style="width: 100%; cursor: pointer;">Proxy</Cell>
            <Cell style="width: 100%; cursor: pointer;">Shares</Cell>
            <Cell style="width: 100%; cursor: pointer;">Topic</Cell>
            <Cell style="cursor: pointer;">Vote</Cell>
            <Cell></Cell>
          </Row>
        </Head>
        <Body>
          {#each proxies as proxy}
            <Row>
              <Cell>{proxy.proxyUserName}</Cell>
              <Cell>{proxy.proxyUserShares}</Cell>
              <Cell>{proxy.topicId}</Cell>
              <Cell>{proxy.voteInstruction}</Cell>
              <Cell>
                <button
                  class="mdc-button mdc-button--raised"
                  on:click={() => handleDeleteProxyConfirmation(proxy.id)}
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
    {/if}
  </Content>
  <Actions>
    <Button
      on:click={() => {
        openAddProxy = true;
      }}
    >
      <Label>Add</Label>
    </Button>
    <Button
      on:click={() => {
        openProxy = false;
      }}
    >
      <Label>Cancel</Label>
    </Button>
  </Actions>
</Dialog>

<!-- Add Proxy Form Dialog -->
<Dialog
  class="addProxy"
  bind:open={openAddProxy}
  fullscreen
  aria-labelledby="fullscreen-title"
  aria-describedby="fullscreen-content"
>
  <Title id="fullscreen-title">Add Proxy:</Title>
  <Content id="fullscreen-content">
    <AddProxy
      bind:principalId={selectedUser}
      bind:principalName={selectedUserName}
    />
  </Content>
  <Actions>
    <Button
      on:click={() => {
        openAddProxy = false;
        openProxy = true;
      }}
    >
      <Label>Cancel</Label>
    </Button>
  </Actions>
</Dialog>

<!-- Users Data Table -->
{#if Object.keys(users).length === 0}
  <i class="fa-solid fa-spinner fa-spin"></i>
{:else}
  <DataTable table$aria-label="User list" style="width: auto;">
    <Head>
      <Row>
        <Cell style="width: 100%; cursor: pointer;">Agency</Cell>
        <Cell style="width: 100%; cursor: pointer;">Name</Cell>
        <Cell style="cursor: pointer;">Email</Cell>
        <Cell style="cursor: pointer;" numeric>Shares</Cell>
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
                selectedUser = user.id;
                open = true;
              }}
            >
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__focus-ring"></span>
              <span class="mdc-button__label">Edit</span>
            </button>

            <button
              class="mdc-button mdc-button--raised"
              on:click={async () => {
                selectedUser = user.id;
                selectedUserName = user.displayName;
                await initProxies();
                openProxy = true;
              }}
            >
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__focus-ring"></span>
              <span class="mdc-button__label">Add Proxy</span>
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
{/if}

<style>
</style>
