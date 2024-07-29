<script>
  import { onAuthStateChanged } from "firebase/auth";
  import { authStore } from "../store/store";
  import { writable, get } from "svelte/store";
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
  } from "firebase/firestore";
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
        const topicIndex = parseInt(topicId.split(" ")[1]) - 1;
        topicStates[topicIndex] = data.enabled;
      });
      userButtonStatus.set(!isAdmin);
    });
  }

  async function fetchProxies() {
    if (!user) return;
    const proxiesQuery = query(
      collection(db, "Proxies"),
      where("principalId", "==", user.uid)
    );
    const proxySnapshot = await getDocs(proxiesQuery);
    proxies = proxySnapshot.docs.map((doc) => doc.data());
  }

  async function castVote(userId, topicId, vote) {
    if (!userId || !topicId || !vote) {
      console.error(
        "Invalid data: Ensure all required fields are provided.",
        "userId=",
        userId,
        "topicId=",
        topicId,
        "vote=",
        vote
      );
      return;
    }

    try {
      // Fetch the user document from Firestore to get the shares
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error("User document does not exist");
        return;
      }

      const userData = userDoc.data();
      const shares = userData?.shares || 0;

      console.log("Casting vote with data:", {
        userId,
        topicId,
        vote,
        shares,
      });

      const newVote = {
        date: new Date().toISOString(),
        meetingId: "test",
        shares: shares,
        topicId: topicId,
        vote: vote,
      };

      // Atomically add a new vote to the 'votes' array
      await updateDoc(userDocRef, {
        votes: arrayUnion(newVote),
      });

      console.log("Vote added successfully");
    } catch (error) {
      console.error("Error adding vote: ", error);
    }
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
              //console.log("counting votes for topic", topicId);
              calculateResult += vote.shares;
            }
          });
        }
      });
      return calculateResult;
    });
  }

  async function hasVoted(userId, topicId) {
    //get user document by doc id
    const userDocRef = doc(db, "users", userId);
    let hasVoted = false;
    return getDoc(userDocRef)
    .then((doc) => {
      //loop through user votes and check if user has voted
      doc.data().votes.forEach((vote) => {
        console.log(vote.topicId, topicId);
        if (vote.topicId === topicId) {
          hasVoted = true;
        };
      });
      return hasVoted;
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
              <button
                class="mdc-button"
                on:click={() => console.log("Not working")}>Edit</button
              >
              <button
                class="mdc-button"
                on:click={() => console.log("Not working")}>Export</button
              >
              <button
                class="mdc-button"
                on:click={() => console.log("Not working")}>Clear</button
              >
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
            {#await hasVoted(user.uid, topicId)}
            <p>...checking</p>
            {:then hasVoted}
            {#if !hasVoted}
            <div class="voting_buttons">
              <button
                class="mdc-button"
                on:click={() =>
                  castVote(
                    user.uid,
                    topicId,
                    "yes",
                    console.log(authStore)
                  )}>Yes</button
              >
              <button
                class="mdc-button"
                on:click={() => castVote(user.uid, topicId, "no")}
                >No</button
              >
              <button
                class="mdc-button"
                on:click={() => castVote(user.uid, topicId, "abstain")}
                >Abstain</button
              >
            </div>
            {/if}
            {:catch error}
              <p style="color: red">{error.message}</p>
            {/await}
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
