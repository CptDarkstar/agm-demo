<script>
  import { onAuthStateChanged } from "firebase/auth";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { auth, db } from "$lib/firebase/firebase"; //Firebase configuration file
  import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    setDoc,
  } from "firebase/firestore";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import IconButton, { Icon } from "@smui/icon-button";
  import FormField from "@smui/form-field";
  import Switch from "@smui/switch";

  let isAdmin = false;
  let panelOpen = false;
  let topics = [];
  let accordionItems = {};
  let topicStates = {};
  let userButtonStatus = writable(true);
  let topic1 = false;
  let topic2 = false;
  let topic3 = false;
  let topic4 = false;
  let topic5 = false;
  let topic6 = false;
  let topic7 = false;
  let topic8 = false;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          isAdmin = idTokenResult.claims.admin;
          fetchData();
        });
      }
    });
  });

  async function fetchData() {
    accordionItems = {};
    for (let i = 1; i <= 8; i++) {
      const docRef = doc(db, "Topics", `Topic ${i}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        accordionItems[`Topic ${i}`] = docSnap.data();
        topicStates[i - 1] = docSnap.data().enabled;
      }
    }
    userButtonStatus.set(!isAdmin);
  }

  async function toggleUserButton(topicIndex) {
    const currentValue = topicStates[topicIndex];
    topicStates[topicIndex] = !currentValue;
    const topicId = `Topic ${topicIndex + 1}`;
    const docRef = doc(db, "Topics", topicId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { enabled: !currentValue });
    } else {
      // Create a new document if it doesn't exist
      await setDoc(docRef, { enabled: !currentValue });
    }
  }
</script>

<div>
  <Accordion>
    {#if isAdmin}
    {#each [1, 2, 3, 4, 5, 6, 7, 8] as topicIndex}
    <Panel>
      <Header>
        {accordionItems[`Topic ${topicIndex}`] && accordionItems[`Topic ${topicIndex}`].title}
        <IconButton slot="icon" toggle pressed={panelOpen}>
          <Icon class="material-icons" on>expand_less</Icon>
          <Icon class="material-icons">expand_more</Icon>
        </IconButton>
      </Header>
      <Content>
        <p>
          {accordionItems[`Topic ${topicIndex}`] && accordionItems[`Topic ${topicIndex}`].description}
        </p>
        <div class="voting_buttons">
          <div>
            <FormField>
              <Switch
                bind:checked={topicStates[topicIndex]}
                on:click={() => toggleUserButton(topicIndex - 1)}
              />
              <span slot="label">
                {#if topicStates[topicIndex - 1]}
                  Active
                {:else}
                  Inactive
                {/if}
              </span>
            </FormField>
          </div>
          <button class="mdc-button" on:click={() => "yes"}>Yes</button>
          <button class="mdc-button" on:click={() => "no"}>No</button>
          <button class="mdc-button" on:click={() => "abstain"}>Abstain</button>
        </div>
      </Content>
    </Panel>
  {/each}
    {:else}
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as topicIndex}
        <Panel disabled={!topicStates[topicIndex - 1]}>
          <Header>
            {accordionItems[`Topic ${topicIndex}`] &&
              accordionItems[`Topic ${topicIndex}`].title}
            <IconButton slot="icon" toggle pressed={panelOpen}>
              <Icon class="material-icons" on>expand_less</Icon>
              <Icon class="material-icons">expand_more</Icon>
            </IconButton>
          </Header>
          <Content>
            <p>
              {accordionItems[`Topic ${topicIndex}`] &&
                accordionItems[`Topic ${topicIndex}`].description}
            </p>
            <div class="voting_buttons">
              <button class="mdc-button" on:click={() => "yes"}>Yes</button>
              <button class="mdc-button" on:click={() => "no"}>No</button>
              <button class="mdc-button" on:click={() => "abstain"}
                >Abstain</button
              >
            </div>
          </Content>
        </Panel>
      {/each}
      <!-- Repeat the above panel structure for each topic -->
    {/if}
  </Accordion>
</div>

<style>
  .voting_buttons {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 30%;
    gap: 1px;
  }

  .mdc-button {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    color: white;
    width: 100%;
  }
</style>
