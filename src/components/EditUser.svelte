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
    getDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    arrayRemove,
    deleteField,
  } from "firebase/firestore";
  import {
    editUserStore,
    showEditModal,
    hideEditModal,
    updateUserInFirestore,
  } from "../store/editUserStore";
  //import Cell from "@smui/data-table/src/Cell.svelte";

  let users = [];
  let proxies = [];
  let proxyTo = "";
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
  let loading = true;
  let sortedUsers = [];
  let currentSortKey = "agency"; // Set default sort key to agency
  let sortOrder = 1; // Always ascending order (1)

  onMount(async () => {
    await usersCollection();
    await initProxies();
  });

  // Get User collection
  const usersCollection = async () => {
    const usersRef = collection(db, "users");
    try {
      onSnapshot(usersRef, (snapshot) => {
        const userData = [];
        snapshot.forEach((doc) => {
          userData.push({ id: doc.id, ...doc.data() });
        });
        users = userData;

        // Sort the data by default key (displayName) after fetching the data
        sortData(currentSortKey);
      });
    } catch (error) {
      console.error("Error getting users collection: ", error);
    }
  };

  // Get proxies from the user's document
  const initProxies = async () => {
    const userDocRef = doc(db, "users", selectedUser); // Reference to the specific user's document

    try {
      onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const proxyData = userData.proxies || []; // Get proxies array or default to an empty array
          proxies = proxyData.map((proxy, index) => ({ id: index, ...proxy }));
          loading = false;
        } else {
          console.error("User document not found");
          loading = false;
        }
      });
    } catch (error) {
      console.error("Error getting proxies from user document: ", error);
    }
  };

  const handleCloseEditModal = () => {
    hideEditModal();
  };

  async function handleSaveChanges(selectedUser) {
    try {
      const userData = {
        displayName: editedName,
        email: editedEmail,
        agency: editAgency,
        shares: editedShares,
      };
      const response = await axios.put(
        `https://agm-demo-node.onrender.com/updateUser/${selectedUser}`,
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
        `https://agm-demo-node.onrender.com/deleteUser/${userId}`
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
  const deleteProxy = async (proxyId, proxyUserId) => {
    const userDocRef = doc(db, "users", selectedUser);
    const deleteProxyTo = doc(db, "users", proxyUserId);

    try {
      const userDoc = await getDoc(userDocRef);
      const userProxyDoc = await getDoc(deleteProxyTo);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const proxyToDelete = userData.proxies.find(
          (proxy) => proxy.proxyID === proxyId
        );
        console.log("Proxy User Id =", proxyUserId);

        if (proxyToDelete) {
          await axios.post(
            `https://agm-demo-node.onrender.com/enableUser/${proxyUserId}`
          );
          await updateDoc(userDocRef, {
            proxies: arrayRemove(proxyToDelete),
          });
          await updateDoc(deleteProxyTo, {
            proxyTo: deleteField(deleteProxyTo),
          });
          console.log("Proxy deleted successfully");
          console.log("Proxy User enabled");
          console.log("Deleted =", deleteProxyTo);
        } else {
          console.error("Proxy not found");
        }
      } else {
        console.error("User document not found");
      }
    } catch (error) {
      console.error("Error deleting proxy: ", error);
    }
  };

  // Handle delete confirmation
  function handleDeleteProxyConfirmation(proxyId, proxyUserId) {
    if (confirm("Are you sure you want to delete this proxy?")) {
      deleteProxy(proxyId, proxyUserId);
    }
  }

  // Sort data by key and keep it always sorted
  function sortData(key) {
    if (!users.length) return; // Prevent sorting if no data is available

    sortedUsers = [...users].sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  }
</script>

<!-- Edit User Dialog -->
<Dialog
  bind:open
  aria-labelledby="simple-title"
  aria-describedby="simple-content"
>
  <Title id="simple-title">Edit User:</Title>
  <Content id="simple-content">
    <Textfield
      bind:value={editedName}
      label="Name"
      placeholder={selectedUserName}
    />
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
                  on:click={() =>
                    handleDeleteProxyConfirmation(
                      proxy.proxyID,
                      proxy.proxyUserId
                    )}
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
        <Cell style="width: 100%;">Agency</Cell>
        <Cell style="width: 100%;">Name</Cell>
        <Cell>Email</Cell>
        <Cell numeric>Shares</Cell>
        <Cell>Edit User</Cell>
        <Cell>Proxy To</Cell>
      </Row>
    </Head>
    <Body>
      {#each sortedUsers as user}
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
                editedName = user.displayName;
                editAgency = user.agency;
                editedEmail = user.email;
                editedShares = user.shares;
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
                proxyTo = user.proxyTo;
                console.log('Proxy To:', proxyTo)
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
          <Cell>{#if user.proxyTo === undefined}-{:else}{user.proxyTo}{/if}</Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>
{/if}

<style>
</style>
