<script>
  import { onAuthStateChanged } from "firebase/auth";
  import { onMount, onDestroy } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import {
    collection,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    arrayUnion,
    addDoc,
    deleteDoc,
  } from "firebase/firestore";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import IconButton, { Icon } from "@smui/icon-button";
  import Button, { Label } from "@smui/button";
  import Textfield from "@smui/textfield";

  let isAdmin = false;
  let panelOpen = false;
  let accordionItems = {};
  let user = null;
  let topicStates = {};
  let unsubscribe = onDestroy;
  let newVoteTopic = "";
  let newVoteDiscription = "";

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        user = u;
        const idTokenResult = await u.getIdTokenResult();
        isAdmin = idTokenResult.claims.admin;
        setupRealtimeListener();
      }
    });

    return () => {
      unsubscribe();
      stopListening();
    };
  });

  function setupRealtimeListener() {
    const topicsCollectionRef = collection(db, "Topics");
    onSnapshot(topicsCollectionRef, (snapshot) => {
      accordionItems = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const topicId = doc.id;
        accordionItems[topicId] = data;
        const topicIndex = parseInt(topicId.split(" ")[1]) - 1;
        topicStates[topicIndex] = data.enabled;
      });
    });
  }

  function stopListening() {
    if (unsubscribe) {
      unsubscribe();
    }
  }

  async function updateTopic(topicId) {
    const docRef = doc(db, "Topics", topicId);
    try {
      const docSnap = getDoc(docRef);
      await updateDoc(docRef, {
        title: newVoteTopic,
        description: newVoteDiscription,
      });
    } catch (error) {
      console.error("Error getting document:", error);
    }
  }

  // Delete Topic
  async function deleteTopic(topicId) {
    const docRef = doc(db, "Topics", topicId);
    try {
      await deleteDoc(docRef);
      console.log("Topic deleted successfully");
    } catch (error) {
      console.error("Error deleting topic: ", error);
    }
  }

  // Handle delete confirmation
  function handleDeleteTopicConfirmation(topicId) {
    if (confirm("Are you sure you want to delete this topic?")) {
      deleteTopic(topicId);
    }
  }
</script>

<div>
  <Accordion>
    {#if isAdmin}
      {#each Object.keys(accordionItems) as topicId, i}
        <Panel>
          <Header>
            {accordionItems[topicId] && accordionItems[topicId].title}
            <IconButton slot="icon" toggle pressed={panelOpen}>
              <Icon class="material-icons" on>expand_less</Icon>
              <Icon class="material-icons">expand_more</Icon>
            </IconButton>
          </Header>
          <Content>
            <p>
              {accordionItems[topicId] && accordionItems[topicId].description}
            </p>
            <div class="Content">
              <Textfield bind:value={newVoteTopic} label="Title" />
              <Textfield bind:value={newVoteDiscription} label="Discription" />
              <Button
                on:click={() => {
                  updateTopic(topicId);
                }}
              >
                <Label>Save Changes</Label>
              </Button>
              <Button
                on:click={() => {
                  handleDeleteTopicConfirmation(topicId);
                }}
              >
                <Label>Dellete Topic</Label>
              </Button>
            </div>
          </Content>
        </Panel>
      {/each}
    {/if}
  </Accordion>
</div>

<style>
  .Content {
    display: flex;
    flex-direction: column;
  }
</style>
