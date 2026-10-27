<script>
  import { onAuthStateChanged } from "firebase/auth";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
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
    writeBatch,
  } from "firebase/firestore";
  import FileSaver from "file-saver";
  import { sortTopicIds } from "$lib/topics";
  import { isAdmin } from "../store/store";

  const { saveAs } = FileSaver;

  const VOTE_OPTIONS = [
    { key: "yes", label: "Yes", color: "#5fd08a" },
    { key: "no", label: "No", color: "#ff8a90" },
    { key: "abstain", label: "Abstain", color: "#cfd8da" },
  ];

  let accordionItems = {};
  let user = null;
  let proxies = [];
  let votePercentages = writable({}); // Store vote percentages + share totals
  let votedTopics = writable({}); // Store which topics have been voted on

  let topicsLoaded = false; // false until the first Topics snapshot arrives
  let selectedTopicId = null; // admin: which row is expanded
  let confirmTopicId = null; // admin: which topic the clear-votes dialog is for
  let clearing = false;
  let castingTopicId = null; // shareholder: vote in flight, buttons disabled
  let toast = "";
  let toastTimer = null;

  let unsubAuth = null;
  let unsubTopics = null;
  let unsubUsers = null;
  let latestUsersSnapshot = null; // cached so a Topics change can also trigger a recompute without waiting for the next users-collection change

  $: sortedTopicIds = sortTopicIds(Object.keys(accordionItems));
  $: liveTopicIds = sortedTopicIds.filter((id) => accordionItems[id]?.enabled);

  onMount(() => {
    unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        user = u;
        setupRealtimeListener();
        setupUsersListener();
        await fetchProxies();
      }
    });

    return () => {
      stopListening();
      clearTimeout(toastTimer);
    };
  });

  function setupRealtimeListener() {
    if (unsubTopics) return; // already subscribed
    const topicsCollectionRef = collection(db, "Topics");
    unsubTopics = onSnapshot(topicsCollectionRef, (snapshot) => {
      accordionItems = {};
      snapshot.forEach((doc) => {
        accordionItems[doc.id] = doc.data();
      });
      topicsLoaded = true;

      // Recompute vote totals for the current topic list using the last known users snapshot
      recomputeAllVotePercentages();
    });
  }

  // Single listener on the whole `users` collection, shared by every topic,
  // instead of opening a new one per topic on every Topics-collection change.
  function setupUsersListener() {
    if (unsubUsers) return; // already subscribed
    const usersCollectionRef = collection(db, "users");
    unsubUsers = onSnapshot(usersCollectionRef, (usersSnapshot) => {
      latestUsersSnapshot = usersSnapshot;
      recomputeAllVotePercentages();
    });
  }

  function recomputeAllVotePercentages() {
    if (!latestUsersSnapshot) return;
    Object.keys(accordionItems).forEach((topicId) => {
      computeAndSaveVotePercentage(topicId, latestUsersSnapshot);
    });
  }

  function stopListening() {
    if (unsubAuth) {
      unsubAuth();
      unsubAuth = null;
    }
    if (unsubTopics) {
      unsubTopics();
      unsubTopics = null;
    }
    if (unsubUsers) {
      unsubUsers();
      unsubUsers = null;
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

      // Update local state to reflect that the user has voted
      votedTopics.update((current) => ({
        ...current,
        [topicId]: true,
      }));
    } catch (error) {
      console.error("Error adding vote: ", error);
    }
  }

  // Disables a topic's buttons while its vote is being written, so a fast
  // double-click can't add the same vote twice.
  async function handleVote(topicId, vote) {
    if (castingTopicId) return;
    castingTopicId = topicId;
    try {
      await castVote(user.uid, topicId, vote);
    } finally {
      castingTopicId = null;
    }
  }

  // Tallies one topic's votes from an already-fetched `users` snapshot (no
  // listener of its own), updates the local store, and persists the
  // aggregate to Votes/{topicId}. Called for every topic whenever the
  // shared users listener (or the topics listener) fires.
  function computeAndSaveVotePercentage(topicId, usersSnapshot) {
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

    const totalSharesVoted = yesShares + noShares + abstainShares;

    const yesPercentage =
      totalSharesVoted === 0 ? 0 : (yesShares / totalSharesVoted) * 100;
    const noPercentage =
      totalSharesVoted === 0 ? 0 : (noShares / totalSharesVoted) * 100;
    const abstainPercentage =
      totalSharesVoted === 0 ? 0 : (abstainShares / totalSharesVoted) * 100;

    votePercentages.update((current) => ({
      ...current,
      [topicId]: {
        yesPercentage: yesPercentage.toFixed(2),
        noPercentage: noPercentage.toFixed(2),
        abstainPercentage: abstainPercentage.toFixed(2),
        yesShares,
        noShares,
        abstainShares,
        totalSharesVoted,
      },
    }));

    saveVoteResultsToFirebase(topicId, {
      yesPercentage,
      noPercentage,
      abstainPercentage,
      totalSharesVoted,
      yesShares,
      noShares,
      abstainShares,
    });
  }

  async function saveVoteResultsToFirebase(topicId, results) {
    const resultsData = {
      topicId,
      yesPercentage: results.yesPercentage.toFixed(2),
      noPercentage: results.noPercentage.toFixed(2),
      abstainPercentage: results.abstainPercentage.toFixed(2),
      totalSharesVoted: results.totalSharesVoted,
      yesShares: results.yesShares,
      noShares: results.noShares,
      abstainShares: results.abstainShares,
    };

    const voteDocRef = doc(db, "Votes", topicId);

    try {
      await setDoc(voteDocRef, resultsData);
    } catch (error) {
      console.error("Error writing document to Firebase: ", error);
    }
  }

  async function hasVoted(userId, topicId) {
    //get user document by doc id
    const userDocRef = doc(db, "users", userId);
    let hasVoted = false;
    return getDoc(userDocRef).then((doc) => {
      //loop through user votes and check if user has voted
      (doc.data()?.votes || []).forEach((vote) => {
        if (vote.topicId === topicId) {
          hasVoted = true;
        }
      });
      return hasVoted;
    });
  }

  async function toggleUserButton(topicId) {
    const currentValue = !!accordionItems[topicId]?.enabled;
    const title = topicTitle(topicId);
    try {
      await updateDoc(doc(db, "Topics", topicId), { enabled: !currentValue });
      flash(
        currentValue
          ? `${title} hidden from shareholders`
          : `${title} is now live`
      );
    } catch (error) {
      console.error("Error toggling topic: ", error);
      flash(`Couldn't update ${title}`);
    }
  }

  async function clearVotesForTopic(topicId) {
    const usersSnapshot = await getDocs(collection(db, "users"));

    // Wait for every write, so callers know when the clear has actually finished.
    // Users with no votes on this topic are skipped (nothing to change).
    await Promise.all(
      usersSnapshot.docs.map((userDoc) => {
        const userVotes = userDoc.data().votes || [];
        const updatedVotes = userVotes.filter(
          (vote) => vote.topicId !== topicId
        );
        if (updatedVotes.length === userVotes.length) return null;
        return updateDoc(doc(db, "users", userDoc.id), {
          votes: updatedVotes,
        });
      })
    );
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
        return true;
      } else {
        console.error("No document found for this topicId.");
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
    return false;
  }

  function topicTitle(topicId) {
    return accordionItems[topicId]?.title || topicId;
  }

  function formatShares(n) {
    return Number(n || 0).toLocaleString("en-ZA");
  }

  function flash(message) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ""), 2600);
  }

  function toggleRow(topicId) {
    selectedTopicId = selectedTopicId === topicId ? null : topicId;
  }

  async function exportTopic(topicId) {
    const ok = await downloadCSV(topicId);
    flash(
      ok
        ? `Exported ${topicTitle(topicId)} results`
        : `No results to export for ${topicTitle(topicId)} yet`
    );
  }

  async function confirmClear() {
    const topicId = confirmTopicId;
    const title = topicTitle(topicId);
    clearing = true;
    try {
      await clearVotesForTopic(topicId);
      flash(`Votes cleared on ${title}`);
    } catch (error) {
      console.error("Error clearing votes: ", error);
      flash(`Couldn't clear votes on ${title}`);
    } finally {
      clearing = false;
      confirmTopicId = null;
    }
  }

  function handleWindowKeydown(event) {
    if (event.key === "Escape" && confirmTopicId && !clearing) {
      confirmTopicId = null;
    }
  }

  function focusOnMount(node) {
    node.focus();
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if !topicsLoaded}
  <section class="card">
    <p class="empty"><i class="fa-solid fa-spinner fa-spin" aria-label="Loading"></i></p>
  </section>
{:else if $isAdmin}
  <section class="card">
    <div class="cardHead">
      <span class="eyebrow">Resolutions</span>
      <span class="chip">
        {liveTopicIds.length ? `${liveTopicIds.length} live` : "None live"}
      </span>
    </div>

    {#each sortedTopicIds as topicId, i (topicId)}
      {@const topic = accordionItems[topicId]}
      {@const results = $votePercentages[topicId]}
      <div class="row">
        <div class="rowHead">
          <button
            type="button"
            class="rowMain"
            aria-expanded={selectedTopicId === topicId}
            on:click={() => toggleRow(topicId)}
          >
            <span class="idx">{String(i + 1).padStart(2, "0")}</span>
            <span class="text">
              <span class="title">{topic.title || topicId}</span>
              {#if topic.description}
                <span class="desc">{topic.description}</span>
              {/if}
            </span>
            {#if topic.enabled}
              <span class="status live">
                <span class="dot"></span>{results?.yesPercentage ?? "0.00"}% yes
              </span>
            {:else}
              <span class="status">Hidden</span>
            {/if}
          </button>
          <button
            type="button"
            class="toggle"
            class:on={topic.enabled}
            role="switch"
            aria-checked={!!topic.enabled}
            aria-label="Show {topic.title || topicId} to shareholders"
            on:click={() => toggleUserButton(topicId)}
          >
            <span class="knob"></span>
          </button>
        </div>

        {#if selectedTopicId === topicId}
          <div class="detail">
            <div class="bars">
              {#each VOTE_OPTIONS as option}
                <div class="barRow">
                  <span>{option.label}</span>
                  <span class="track">
                    <span
                      class="fill"
                      style="width: {results?.[`${option.key}Percentage`] ?? 0}%; background: {option.color};"
                    ></span>
                  </span>
                  <b class="pct">{results?.[`${option.key}Percentage`] ?? "0.00"}%</b>
                  <span class="shares">{formatShares(results?.[`${option.key}Shares`])}</span>
                </div>
              {/each}
            </div>
            <div class="detailFoot">
              <span class="total">{formatShares(results?.totalSharesVoted)} shares voted</span>
              <div class="detailActions">
                <button type="button" class="btnLight" on:click={() => exportTopic(topicId)}>
                  Export results
                </button>
                <button type="button" class="btnDanger" on:click={() => (confirmTopicId = topicId)}>
                  Clear votes
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No resolutions yet. Add them from Menu → Resolutions.</p>
    {/each}
  </section>
{:else}
  <section class="card">
    <div class="cardHead">
      <span class="eyebrow">Resolutions</span>
      <span class="chip">
        {liveTopicIds.length ? `${liveTopicIds.length} open` : "None open"}
      </span>
    </div>

    {#each liveTopicIds as topicId (topicId)}
      {@const topic = accordionItems[topicId]}
      {@const results = $votePercentages[topicId]}
      <div class="row">
        <div class="voterTopic">
          <span class="title">{topic.title || topicId}</span>
          {#if topic.description}
            <span class="desc">{topic.description}</span>
          {/if}

          {#await hasVoted(user.uid, topicId)}
            <p class="muted">Checking…</p>
          {:then voted}
            {#if !voted && !$votedTopics[topicId]}
              <div class="voteButtons">
                <button
                  type="button"
                  class="btnLight"
                  disabled={castingTopicId === topicId}
                  on:click={() => handleVote(topicId, "yes")}>For</button
                >
                <button
                  type="button"
                  class="btnLight"
                  disabled={castingTopicId === topicId}
                  on:click={() => handleVote(topicId, "no")}>Against</button
                >
                <button
                  type="button"
                  class="btnLight"
                  disabled={castingTopicId === topicId}
                  on:click={() => handleVote(topicId, "abstain")}>Abstain</button
                >
              </div>
            {:else}
              <div class="bars voterBars">
                {#each VOTE_OPTIONS as option}
                  <div class="barRow">
                    <span>{option.label}</span>
                    <span class="track">
                      <span
                        class="fill"
                        style="width: {results?.[`${option.key}Percentage`] ?? 0}%; background: {option.color};"
                      ></span>
                    </span>
                    <b class="pct">{results?.[`${option.key}Percentage`] ?? "0.00"}%</b>
                  </div>
                {/each}
              </div>
            {/if}
          {:catch error}
            <p class="errorText">{error.message}</p>
          {/await}
        </div>
      </div>
    {:else}
      <p class="empty">No resolutions are open for voting right now.</p>
    {/each}
  </section>
{/if}

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

{#if confirmTopicId}
  <div class="scrim">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="clear-title">
      <div id="clear-title" class="dialogTitle">Clear all votes?</div>
      <p>
        Every vote cast on <b>{topicTitle(confirmTopicId)}</b> will be permanently
        deleted. This can't be undone.
      </p>
      <div class="dialogActions">
        <button
          type="button"
          class="btnCancel"
          disabled={clearing}
          use:focusOnMount
          on:click={() => (confirmTopicId = null)}>Cancel</button
        >
        <button type="button" class="btnConfirm" disabled={clearing} on:click={confirmClear}>
          {clearing ? "Clearing…" : "Clear votes"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    border-radius: 24px;
    background: rgba(12, 44, 49, 0.42);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    color: #fff;
    font-family: "Roboto", sans-serif;
  }
  .cardHead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  }
  .eyebrow {
    font: 500 11px "Roboto Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
  }
  .chip {
    font-size: 12px;
    font-weight: 500;
    padding: 5px 11px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
  }
  .row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .row:last-child {
    border-bottom: 0;
  }
  .rowHead {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-right: 24px;
  }
  .rowHead:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .rowMain {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 16px 0 16px 24px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .idx {
    font: 500 12px "Roboto Mono", monospace;
    color: rgba(255, 255, 255, 0.65);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .title {
    font-size: 15px;
    font-weight: 600;
  }
  .desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.75);
  }
  .status {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }
  .status.live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #9ff0bd;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #5fd08a;
  }
  .toggle {
    flex: none;
    width: 44px;
    height: 26px;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.28);
    padding: 3px;
    cursor: pointer;
    display: flex;
  }
  .toggle.on {
    background: #5fd08a;
  }
  .knob {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
  }
  .toggle.on .knob {
    transform: translateX(18px);
  }
  .detail {
    padding: 4px 24px 22px 72px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .barRow {
    display: grid;
    grid-template-columns: 70px minmax(0, 1fr) 72px 110px;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }
  .voterBars .barRow {
    grid-template-columns: 70px minmax(0, 1fr) 72px;
  }
  .track {
    height: 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;
    display: flex;
  }
  .fill {
    transition: width 0.6s;
  }
  .pct {
    text-align: right;
  }
  .shares,
  .total {
    font: 12px "Roboto Mono", monospace;
    color: rgba(255, 255, 255, 0.7);
    text-align: right;
  }
  .detailFoot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .detailActions {
    display: flex;
    gap: 8px;
  }
  .btnLight {
    height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: #fff;
    color: #0f3a40;
    font: 600 13px "Roboto", sans-serif;
    cursor: pointer;
  }
  .btnLight:hover:not(:disabled) {
    background: #e7f1f2;
  }
  .btnLight:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .btnDanger {
    height: 38px;
    padding: 0 16px;
    border: 1px solid rgba(255, 138, 144, 0.6);
    border-radius: 10px;
    background: transparent;
    color: #ffc2c5;
    font: 600 13px "Roboto", sans-serif;
    cursor: pointer;
  }
  .btnDanger:hover {
    background: rgba(192, 40, 47, 0.25);
  }
  .voterTopic {
    padding: 18px 24px 22px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .voteButtons {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .voteButtons .btnLight {
    height: 44px;
    font-size: 14px;
  }
  .voterBars {
    margin-top: 10px;
  }
  .muted {
    margin: 8px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }
  .errorText {
    margin: 8px 0 0;
    font-size: 13px;
    color: #ffd4d6;
  }
  .empty {
    margin: 0;
    padding: 24px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    text-align: center;
  }
  .toast {
    position: fixed;
    z-index: 20;
    left: 50%;
    bottom: 28px;
    transform: translateX(-50%);
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    padding: 12px 18px;
    border-radius: 12px;
    background: #fff;
    color: #0e1f23;
    font: 500 14px "Roboto", sans-serif;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  .scrim {
    position: fixed;
    z-index: 30;
    inset: 0;
    background: rgba(5, 20, 23, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .dialog {
    width: min(420px, 100%);
    box-sizing: border-box;
    border-radius: 20px;
    background: #fff;
    color: #0e1f23;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-family: "Roboto", sans-serif;
  }
  .dialogTitle {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .dialog p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #3a4547;
  }
  .dialogActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
  .btnCancel {
    height: 44px;
    padding: 0 18px;
    border: 1px solid #d3dbdc;
    border-radius: 10px;
    background: #fff;
    color: #0e1f23;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
  }
  .btnConfirm {
    height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 10px;
    background: #c0282f;
    color: #fff;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
  }
  .btnConfirm:hover:not(:disabled) {
    background: #a61f26;
  }
  .btnCancel:disabled,
  .btnConfirm:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 600px) {
    .cardHead {
      padding: 16px;
    }
    .rowHead {
      padding-right: 16px;
      gap: 12px;
    }
    .rowMain {
      grid-template-columns: 24px minmax(0, 1fr);
      gap: 4px 12px;
      padding: 14px 0 14px 16px;
    }
    .rowMain .status {
      grid-column: 2;
    }
    .detail {
      padding: 4px 16px 18px;
    }
    .barRow {
      grid-template-columns: 56px minmax(0, 1fr) 56px;
      gap: 8px;
    }
    .barRow .shares {
      grid-column: 2 / -1;
      text-align: left;
      margin-top: -4px;
    }
    .voterTopic {
      padding: 16px;
    }
    .voteButtons .btnLight {
      padding: 0 8px;
    }
  }
</style>
