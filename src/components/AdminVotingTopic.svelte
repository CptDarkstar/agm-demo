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
    writeBatch,
  } from "firebase/firestore";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import IconButton, { Icon } from "@smui/icon-button";
  import FormField from "@smui/form-field";
  import Switch from "@smui/switch";
  import jsPDF from "jspdf";
  import FileSaver from "file-saver";

  const { saveAs } = FileSaver;

  let isAdmin = false;
  let panelOpen = false;
  let accordionItems = {};
  let topicStates = {};
  let user = null;
  let proxies = [];
  let votePercentages = writable({}); // Store vote percentages
  let votedTopics = writable({}); // Store which topics have been voted on
  let unsubscribe = onDestroy;

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

        // Update vote percentages
        countVotesPercentage(topicId);
      });
    });
  }

  function stopListening() {
    if (unsubscribe) {
      unsubscribe();
    }
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
      const proxies = userData.proxies || [];

      // Start with user's own vote
      const votesToCast = [
        {
          userId,
          shares,
          topicId,
          vote,
        },
      ];

      // Track used proxies by their `proxyUserId`
      const usedProxyIds = new Set();

      proxies.forEach((proxy) => {
        if (usedProxyIds.has(proxy.proxyUserId)) return; // Skip if proxy user already processed

        if (proxy.topicId === topicId && proxy.voteInstruction !== "None") {
          // Use specific proxy and skip any 'None' proxies for this `proxyUserId`
          votesToCast.push({
            userId: proxy.proxyUserId,
            userName: proxy.proxyUserName,
            shares: proxy.proxyUserShares,
            topicId,
            vote: proxy.voteInstruction,
          });
          usedProxyIds.add(proxy.proxyUserId);
        }
      });

      // Check for 'None' proxies only if no specific proxy has been used
      proxies.forEach((proxy) => {
        if (
          !usedProxyIds.has(proxy.proxyUserId) &&
          proxy.topicId === "None" &&
          proxy.voteInstruction === "None"
        ) {
          votesToCast.push({
            userId: proxy.proxyUserId,
            userName: proxy.proxyUserName,
            shares: proxy.proxyUserShares,
            topicId,
            vote,
          });
          usedProxyIds.add(proxy.proxyUserId);
        }
      });

      // Atomically add all votes
      const batch = writeBatch(db);
      votesToCast.forEach((vote) => {
        batch.update(userDocRef, {
          votes: arrayUnion(vote),
        });
      });
      await batch.commit();

      console.log("Vote(s) added successfully");

      // Update local state to reflect that the user has voted
      votedTopics.update((current) => ({
        ...current,
        [topicId]: true,
      }));
    } catch (error) {
      console.error("Error adding vote: ", error);
    }
  }

  async function addVoteToUser(
    userDocRef,
    topicId,
    vote,
    shares,
    proxy = null
  ) {
    const newVote = {
      date: new Date().toISOString(),
      meetingId: "test",
      shares: shares,
      topicId: topicId,
      vote: vote,
      proxy: proxy
        ? {
            proxyID: proxy.proxyID,
            proxyUserId: proxy.proxyUserId,
            proxyUserName: proxy.proxyUserName,
          }
        : null,
    };

    await updateDoc(userDocRef, {
      votes: arrayUnion(newVote),
    });

    // Update local state to reflect that the user has voted
    votedTopics.update((current) => ({
      ...current,
      [topicId]: true,
    }));
  }

  function countVotesPercentage(topicId) {
    const usersCollection = collection(db, "users");

    onSnapshot(usersCollection, (usersSnapshot) => {
      // Reset shares counters before each snapshot processing
      let yesShares = 0;
      let noShares = 0;
      let abstainShares = 0;

      usersSnapshot.forEach((userDoc) => {
        const userVotes = userDoc.data().votes;

        if (userVotes) {
          userVotes.forEach((vote) => {
            if (vote.topicId === topicId) {
              switch (vote.vote) {
                case "yes":
                  yesShares += vote.shares;
                  break;
                case "no":
                  noShares += vote.shares;
                  break;
                case "abstain":
                  abstainShares += vote.shares;
                  break;
              }
            }
          });
        }
      });

      // Calculate total shares that voted
      const totalSharesVoted = yesShares + noShares + abstainShares;

      // Calculate percentages
      const yesPercentage =
        totalSharesVoted === 0 ? 0 : (yesShares / totalSharesVoted) * 100;
      const noPercentage =
        totalSharesVoted === 0 ? 0 : (noShares / totalSharesVoted) * 100;
      const abstainPercentage =
        totalSharesVoted === 0 ? 0 : (abstainShares / totalSharesVoted) * 100;

      // Update the store with the new percentages
      votePercentages.update((current) => ({
        ...current,
        [topicId]: {
          yesPercentage: yesPercentage.toFixed(2),
          noPercentage: noPercentage.toFixed(2),
          abstainPercentage: abstainPercentage.toFixed(2),
        },
      }));

      // Function to save the results to Firebase
      const saveResultsToFirebase = async () => {
        const resultsData = {
          topicId,
          yesPercentage: yesPercentage.toFixed(2),
          noPercentage: noPercentage.toFixed(2),
          abstainPercentage: abstainPercentage.toFixed(2),
          totalSharesVoted,
          yesShares: yesShares,
          noShares: noShares,
          abstainShares: abstainShares,
        };

        const voteDocRef = doc(db, "Votes", topicId);

        try {
          await setDoc(voteDocRef, resultsData);
        } catch (error) {
          console.error("Error writing document to Firebase: ", error);
        }
      };

      // Call the async function
      saveResultsToFirebase();
    });
  }

  async function hasVoted(userId, topicId) {
    //get user document by doc id
    const userDocRef = doc(db, "users", userId);
    let hasVoted = false;
    return getDoc(userDocRef).then((doc) => {
      //loop through user votes and check if user has voted
      doc.data().votes.forEach((vote) => {
        //console.log(vote.topicId, topicId);
        if (vote.topicId === topicId) {
          hasVoted = true;
        }
      });
      return hasVoted;
    });
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

  async function clearVotesForTopic(topicId) {
    // Step 1: Fetch all users
    const usersSnapshot = await getDocs(collection(db, "users"));

    // Step 2: Loop through each user
    usersSnapshot.forEach(async (userDoc) => {
      const userData = userDoc.data();
      const userVotes = userData.votes || [];

      // Step 3: Filter out votes matching the topicId
      const updatedVotes = userVotes.filter((vote) => vote.topicId !== topicId);

      // Step 4: Update the user's votes in Firestore
      await updateDoc(doc(db, "users", userDoc.id), {
        votes: updatedVotes,
      });
    });

    console.log(`Votes with topicId: ${topicId} cleared for all users.`);
  }

  async function downloadCSV(topicId) {
    try {
      const docRef = doc(db, "Votes", topicId); // Fetch document by topicId
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let csv =
          "topicId,yesPercentage,yesShares,noPercentage,noShares,abstainPercentage,abstainShares,totalSharesVoted\n";
        csv += `${data.topicId},${data.yesPercentage},${data.yesShares},${data.noPercentage},${data.noShares},${data.abstainPercentage},${data.abstainShares},${data.totalSharesVoted}\n`;

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `${topicId}.csv`);
      } else {
        console.log("No document found for this topicId.");
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
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
              <button class="mdc-button" on:click={() => downloadCSV(topicId)}
                >Export Topic</button
              >
              <button
                class="mdc-button"
                on:click={() => clearVotesForTopic(topicId)}>Clear</button
              >
            </div>
            <div>
              {#if $votePercentages[topicId]}
                <span>
                  Yes:
                  <p
                    class="yesPercentage"
                    style="width: {$votePercentages[topicId].yesPercentage}%;"
                  >
                    {$votePercentages[topicId].yesPercentage}%
                  </p>
                </span>
                <span>
                  No:
                  <p
                    class="noPercentage"
                    style="width: {$votePercentages[topicId].noPercentage}%;"
                  >
                    {$votePercentages[topicId].noPercentage}%
                  </p>
                </span>
                <span>
                  Abstain:
                  <p
                    class="abstainPercentage"
                    style="width: {$votePercentages[topicId]
                      .abstainPercentage}%;"
                  >
                    {$votePercentages[topicId].abstainPercentage}%
                  </p>
                </span>
              {:else}
                <p>...calculating</p>
              {/if}
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
            {#await hasVoted(user.uid, topicId)}
              <p>...checking</p>
            {:then hasVoted}
              {#if !hasVoted && !$votedTopics[topicId]}
                <div class="voting_buttons">
                  <button
                    class="mdc-button"
                    disabled={!topicStates[i]}
                    on:click={() => castVote(user.uid, topicId, "yes")}
                    >Yes</button
                  >
                  <button
                    class="mdc-button"
                    disabled={!topicStates[i]}
                    on:click={() => castVote(user.uid, topicId, "no")}
                    >No</button
                  >
                  <button
                    class="mdc-button"
                    disabled={!topicStates[i]}
                    on:click={() => castVote(user.uid, topicId, "abstain")}
                    >Abstain</button
                  >
                </div>
              {:else}
                <span>
                  Yes:
                  <p
                    class="yesPercentage"
                    style="width: {$votePercentages[topicId].yesPercentage}%;"
                  >
                    {$votePercentages[topicId].yesPercentage}%
                  </p>
                </span>
                <span>
                  No:
                  <p
                    class="noPercentage"
                    style="width: {$votePercentages[topicId].noPercentage}%;"
                  >
                    {$votePercentages[topicId].noPercentage}%
                  </p>
                </span>
                <span>
                  Abstain:
                  <p
                    class="abstainPercentage"
                    style="width: {$votePercentages[topicId]
                      .abstainPercentage}%;"
                  >
                    {$votePercentages[topicId].abstainPercentage}%
                  </p>
                </span>
              {/if}
            {:catch error}
              <p style="color: red">{error.message}</p>
            {/await}
            <!-- <div>
              {#if $votePercentages[topicId]}
                <p>Yes: {$votePercentages[topicId].yesPercentage}%</p>
                <p>No: {$votePercentages[topicId].noPercentage}%</p>
                <p>Abstain: {$votePercentages[topicId].abstainPercentage}%</p>
              {:else}
                <p>...calculating</p>
              {/if}
            </div> -->
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
    width: 100%;
    gap: 1px;
  }

  .mdc-button {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    color: white;
    width: 100%;
  }

  .yesPercentage {
    background: #6ba3ab;
    height: 100%;
    border-radius: 10px;
    text-align: end;
  }

  .noPercentage {
    background: #6ba3ab;
    height: 100%;
    border-radius: 10px;
    text-align: end;
  }

  .abstainPercentage {
    background: #6ba3ab;
    height: 100%;
    border-radius: 10px;
    text-align: end;
  }
</style>
