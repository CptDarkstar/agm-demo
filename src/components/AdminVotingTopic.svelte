<script>
  import { onAuthStateChanged } from "firebase/auth";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { auth, db } from "$lib/firebase/firebase";
  import { collection, doc, updateDoc, setDoc, getDoc, onSnapshot, query, where, getDocs, addDoc } from "firebase/firestore";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import IconButton, { Icon } from "@smui/icon-button";
  import FormField from "@smui/form-field";
  import Switch from "@smui/switch";

  let isAdmin = false;
  let panelOpen = false;
  let accordionItems = {};
  let topicStates = {};
  let userButtonStatus = writable(true);
  let user = null;
  let proxies = [];

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        user = u;
        const idTokenResult = await u.getIdTokenResult();
        isAdmin = idTokenResult.claims.admin;
        setupRealtimeListener();
        await fetchProxies();
      }
    });

    return () => {
      unsubscribe();
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
        const topicIndex = parseInt(topicId.split(' ')[1]) - 1;
        topicStates[topicIndex] = data.enabled;
      });
      userButtonStatus.set(!isAdmin);
    });
  }

  async function fetchProxies() {
    if (!user) return;
    const proxiesQuery = query(collection(db, "Proxies"), where("principalId", "==", user.uid));
    const proxySnapshot = await getDocs(proxiesQuery);
    proxies = proxySnapshot.docs.map(doc => doc.data());
  }

  async function castVote(topicId, vote) {
    if (!user) return;

    // Cast user's own vote
    await addDoc(collection(db, "Votes"), {
      userId: user.uid,
      userDisplayName: user.displayName,
      shares: user.shares,
      topicId,
      vote
    })

    // Cast votes for any proxies
    /* for (const proxy of proxies) {
      if (proxy.topicId === topicId) {
        await addDoc(collection(db, "Votes"), {
          userId: proxy.proxyUserId,
          topicId,
          vote: '',//proxy.voteInstruction || vote // Use instruction if provided, else user's vote
        });
      }
    } */
  }


  function countVotes(topicId) {
    const usersCollection = collection(db, "users");
    let calculateResult = 0;
    return getDocs(usersCollection).then((usersSnapshot) => {
      usersSnapshot.forEach((userDoc) => {
        const userVotes = userDoc.data().votes;
        if (userVotes) {
          userVotes.forEach((vote) => {
            if (vote.topicId === topicId) {
              console.log("counting votes for topic", topicId);
              calculateResult += vote.shares;
            }
          })
        }
      });
      return calculateResult;
    })
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
      await setDoc(docRef, { enabled: !currentValue });
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
            <div class="voting_buttons">
              <div>
                <FormField>
                  <Switch
                    bind:checked={topicStates[i]}
                    on:click={() => toggleUserButton(i)}
                  />
                  <span slot="label">
                    {#if topicStates[i]}
                      Active
                    {:else}
                      Inactive
                    {/if}
                  </span>
                </FormField>
              </div>
              <button class="mdc-button" on:click={() => console.log("Not working")}>Edit</button>
              <button class="mdc-button" on:click={() => console.log("Not working")}>Export</button>
              <button class="mdc-button" on:click={() => console.log("Not working")}>Clear</button>
            </div>
          </Content>
        </Panel>
      {/each}
    {:else}
      {#each Object.keys(accordionItems) as topicId, i}
        <Panel disabled={!topicStates[i]}>
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
            <div class="voting_buttons">
              <button class="mdc-button" on:click={() => castVote(topicId, "yes")}>Yes</button>
              <button class="mdc-button" on:click={() => castVote(topicId, "no")}>No</button>
              <button class="mdc-button" on:click={() => castVote(topicId, "abstain")}>Abstain</button>
            </div>
            {#await countVotes(topicId)}
	          <p>...calculating</p>
            {:then calculatedValue}
	          <p>Result: {calculatedValue}</p>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
          </Content>
        </Panel>
      {/each}
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
