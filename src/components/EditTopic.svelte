<script>
  import { onMount } from "svelte";
  import { db } from "$lib/firebase/firebase";
  import {
    collection,
    doc,
    updateDoc,
    setDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
  } from "firebase/firestore";
  import FileSaver from "file-saver";
  import { sortTopicIds, nextTopicId } from "$lib/topics";
  import "$lib/styles/glass-dialog.css";

  const { saveAs } = FileSaver;
  const TYPES = ["Ordinary", "Special"];

  let topicsById = {};
  let votesById = {};
  let loaded = false;

  let unsubTopics = null;
  let unsubVotes = null;

  onMount(() => {
    unsubTopics = onSnapshot(
      collection(db, "Topics"),
      (snapshot) => {
        const next = {};
        snapshot.forEach((d) => (next[d.id] = d.data()));
        topicsById = next;
        loaded = true;
      },
      (error) => console.error("Error listening to topics: ", error)
    );
    unsubVotes = onSnapshot(collection(db, "Votes"), (snapshot) => {
      const next = {};
      snapshot.forEach((d) => (next[d.id] = d.data()));
      votesById = next;
    });

    return () => {
      if (unsubTopics) unsubTopics();
      if (unsubVotes) unsubVotes();
      clearTimeout(toastTimer);
    };
  });

  $: topicIds = sortTopicIds(Object.keys(topicsById));

  function typeOf(topic) {
    return topic?.type === "Special" ? "Special" : "Ordinary";
  }

  function votedShares(topicId) {
    return Number(votesById[topicId]?.totalSharesVoted) || 0;
  }

  function fmt(n) {
    return (Number(n) || 0).toLocaleString("en-ZA");
  }

  // ---- Toast --------------------------------------------------------------

  let toast = "";
  let toastTimer = null;

  function flash(message) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ""), 2600);
  }

  // ---- Inline edit (one topic open at a time, its own draft) --------------

  let openId = null;
  let draft = { type: "Ordinary", title: "", description: "" };
  let savingEdit = false;
  let editError = "";

  function toggleOpen(topicId) {
    if (openId === topicId) {
      openId = null;
      return;
    }
    const topic = topicsById[topicId];
    openId = topicId;
    draft = {
      type: typeOf(topic),
      title: topic.title || "",
      description: topic.description || "",
    };
    editError = "";
  }

  $: openTopic = openId ? topicsById[openId] : null;
  $: dirty =
    !!openTopic &&
    (draft.type !== typeOf(openTopic) ||
      draft.title.trim() !== (openTopic.title || "") ||
      draft.description.trim() !== (openTopic.description || ""));
  $: canSave = dirty && !!draft.title.trim() && !savingEdit;

  async function saveEdit() {
    if (!canSave) return;
    savingEdit = true;
    editError = "";
    try {
      // `enabled` is deliberately untouched, so a live topic stays live.
      await updateDoc(doc(db, "Topics", openId), {
        title: draft.title.trim(),
        description: draft.description.trim(),
        type: draft.type,
      });
      openId = null;
      flash("Topic saved");
    } catch (error) {
      console.error("Error updating topic:", error);
      editError = "Couldn't save this topic. Please try again.";
    } finally {
      savingEdit = false;
    }
  }

  // ---- Add / Delete dialogs -----------------------------------------------

  let modal = null; // "add" | "delete"
  let targetId = null;
  let addDraft = { type: "Ordinary", title: "", description: "" };
  let adding = false;
  let addError = "";
  let deleting = false;
  let deleteError = "";

  function openAdd() {
    openId = null;
    addDraft = { type: "Ordinary", title: "", description: "" };
    addError = "";
    modal = "add";
  }

  function openDelete(topicId) {
    targetId = topicId;
    deleteError = "";
    modal = "delete";
  }

  function closeModal() {
    if (adding || deleting) return;
    modal = null;
    targetId = null;
  }

  async function addTopic() {
    const title = addDraft.title.trim();
    if (!title || adding) return;
    adding = true;
    addError = "";
    try {
      // Read the current IDs fresh so the new ID can't collide with an existing one.
      const snapshot = await getDocs(collection(db, "Topics"));
      const newId = nextTopicId(snapshot.docs.map((d) => d.id));
      await setDoc(doc(db, "Topics", newId), {
        title,
        description: addDraft.description.trim(),
        type: addDraft.type,
        enabled: false, // new topics start hidden
      });
      adding = false;
      closeModal();
      flash(`${title} added`);
    } catch (error) {
      console.error("Error adding new topic: ", error);
      addError = "Couldn't add this topic. Please try again.";
      adding = false;
    }
  }

  async function confirmDelete() {
    if (deleting) return;
    const topicId = targetId;
    const title = topicsById[topicId]?.title || topicId;
    deleting = true;
    deleteError = "";
    try {
      // 1. Remove this topic's votes and proxy instructions from every shareholder.
      //    Proxies' None/None "free vote" entries are kept, so the proxy itself stays.
      const usersSnapshot = await getDocs(collection(db, "users"));
      await Promise.all(
        usersSnapshot.docs.map((userDoc) => {
          const data = userDoc.data();
          const update = {};
          const votes = data.votes || [];
          const keptVotes = votes.filter((v) => v.topicId !== topicId);
          if (keptVotes.length !== votes.length) update.votes = keptVotes;
          const proxies = data.proxies || [];
          const keptProxies = proxies.filter((p) => p.topicId !== topicId);
          if (keptProxies.length !== proxies.length) update.proxies = keptProxies;
          return Object.keys(update).length
            ? updateDoc(doc(db, "users", userDoc.id), update)
            : null;
        })
      );
      // 2. Topic before its results doc: an open dashboard re-saves Votes/{id} for
      //    every topic it knows about, so removing the topic first stops it coming back.
      await deleteDoc(doc(db, "Topics", topicId));
      await deleteDoc(doc(db, "Votes", topicId));
      if (openId === topicId) openId = null;
      deleting = false;
      closeModal();
      flash(`${title} deleted`);
    } catch (error) {
      console.error("Error deleting topic: ", error);
      deleteError = "Couldn't delete this topic. Please try again.";
      deleting = false;
    }
  }

  // ---- Export all ----------------------------------------------------------

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function pct(part, total) {
    return total ? ((part / total) * 100).toFixed(2) : "0.00";
  }

  function exportAll() {
    const header = [
      "Topic ID",
      "#",
      "Type",
      "Title",
      "Description",
      "Yes shares",
      "No shares",
      "Abstain shares",
      "Total shares",
      "Yes %",
      "No %",
      "Abstain %",
    ];
    const rows = topicIds.map((topicId, i) => {
      const topic = topicsById[topicId];
      const v = votesById[topicId] || {};
      const yes = Number(v.yesShares) || 0;
      const no = Number(v.noShares) || 0;
      const abstain = Number(v.abstainShares) || 0;
      const total = yes + no + abstain;
      return [
        topicId,
        i + 1,
        typeOf(topic),
        topic.title || "",
        topic.description || "",
        yes,
        no,
        abstain,
        total,
        pct(yes, total),
        pct(no, total),
        pct(abstain, total),
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "agm-topics-results.csv"
    );
    flash(`Exported ${rows.length} ${rows.length === 1 ? "topic" : "topics"}`);
  }

  function handleWindowKeydown(event) {
    if (event.key === "Escape" && modal) closeModal();
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<section class="card">
  <div class="cardHead">
    <div class="headLeft">
      <span class="eyebrow">Topics</span>
      <span class="chip">
        {topicIds.length} {topicIds.length === 1 ? "topic" : "topics"}
      </span>
    </div>
    <div class="headActions">
      <button type="button" class="ghostBtn" disabled={!topicIds.length} on:click={exportAll}>
        Export all (CSV)
      </button>
      <button type="button" class="whiteBtn" on:click={openAdd}>+ Add topic</button>
    </div>
  </div>

  {#if !loaded}
    <p class="empty"><i class="fa-solid fa-spinner fa-spin" aria-label="Loading"></i></p>
  {:else}
    {#each topicIds as topicId, i (topicId)}
      {@const topic = topicsById[topicId]}
      {@const voted = votedShares(topicId)}
      {@const type = typeOf(topic)}
      <div class="row">
        <button
          type="button"
          class="rowHead"
          aria-expanded={openId === topicId}
          on:click={() => toggleOpen(topicId)}
        >
          <span class="idx">{String(i + 1).padStart(2, "0")}</span>
          <span class="text">
            <span class="title">{topic.title || topicId}</span>
            {#if topic.description}
              <span class="desc">{topic.description}</span>
            {/if}
          </span>
          <span class="voted">{voted > 0 ? `${fmt(voted)} voted` : ""}</span>
          <span class="typeBadge" class:special={type === "Special"}>{type}</span>
          <span class="chev" class:open={openId === topicId} aria-hidden="true">▾</span>
        </button>

        {#if openId === topicId}
          <div class="editor">
            {#if voted > 0}
              <div class="notice">
                {fmt(voted)} shares have already voted on this topic. Changing the
                wording won't reset those votes.
              </div>
            {/if}
            <div class="gd-field">
              <span class="gd-label">Type</span>
              <div class="segments" role="radiogroup" aria-label="Topic type">
                {#each TYPES as option}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.type === option}
                    class:on={draft.type === option}
                    on:click={() => (draft.type = option)}
                  >
                    {option}
                  </button>
                {/each}
              </div>
            </div>
            <label class="gd-field">
              <span class="gd-label">Title</span>
              <input class="gd-input" type="text" bind:value={draft.title} />
            </label>
            <label class="gd-field">
              <span class="gd-label">Description</span>
              <textarea class="gd-input gd-textarea" rows="3" bind:value={draft.description}></textarea>
            </label>
            {#if editError}
              <p class="gd-error" role="alert">{editError}</p>
            {/if}
            <div class="editorActions">
              <button type="button" class="dangerBtn" on:click={() => openDelete(topicId)}>
                Delete topic
              </button>
              <div class="editorRight">
                <button
                  type="button"
                  class="ghostBtn small"
                  disabled={savingEdit}
                  on:click={() => (openId = null)}
                >
                  Cancel
                </button>
                <button type="button" class="whiteBtn small" disabled={!canSave} on:click={saveEdit}>
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No topics yet. Add the first one.</p>
    {/each}
  {/if}
</section>

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

{#if modal === "add"}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="gd-scrim" on:click|self={closeModal}>
    <form
      class="gd-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-topic-title"
      on:submit|preventDefault={addTopic}
      novalidate
    >
      <div class="gd-head">
        <span id="add-topic-title" class="gd-title">Add new topic</span>
        <span class="gd-sub">New topics start hidden. Make them live from the dashboard.</span>
      </div>
      <div class="gd-field">
        <span class="gd-label">Type</span>
        <div class="segments" role="radiogroup" aria-label="Topic type">
          {#each TYPES as option}
            <button
              type="button"
              role="radio"
              aria-checked={addDraft.type === option}
              class:on={addDraft.type === option}
              on:click={() => (addDraft.type = option)}
            >
              {option}
            </button>
          {/each}
        </div>
      </div>
      <label class="gd-field">
        <span class="gd-label">Title *</span>
        <input
          class="gd-input"
          type="text"
          placeholder="e.g. Ordinary Resolution 8"
          bind:value={addDraft.title}
        />
      </label>
      <label class="gd-field">
        <span class="gd-label">Description</span>
        <textarea
          class="gd-input gd-textarea"
          rows="3"
          placeholder="What shareholders are voting on"
          bind:value={addDraft.description}
        ></textarea>
      </label>
      {#if addError}
        <p class="gd-error" role="alert">{addError}</p>
      {/if}
      <div class="gd-actions">
        <button type="button" class="gd-btn gd-btn-ghost" disabled={adding} on:click={closeModal}>
          Cancel
        </button>
        <button
          type="submit"
          class="gd-btn gd-btn-primary"
          disabled={!addDraft.title.trim() || adding}
        >
          {adding ? "Adding…" : "Add topic"}
        </button>
      </div>
    </form>
  </div>
{/if}

{#if modal === "delete" && topicsById[targetId]}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="gd-scrim" on:click|self={closeModal}>
    <div class="gd-dialog deleteDialog" role="dialog" aria-modal="true" aria-labelledby="delete-topic-title">
      <span id="delete-topic-title" class="gd-title">Delete topic?</span>
      <p class="deleteText">
        <b>{topicsById[targetId].title || targetId}</b> and all its votes will be removed,
        including proxy instructions for it. This can't be undone.
      </p>
      {#if deleteError}
        <p class="gd-error" role="alert">{deleteError}</p>
      {/if}
      <div class="gd-actions">
        <button type="button" class="gd-btn gd-btn-ghost" disabled={deleting} on:click={closeModal}>
          Cancel
        </button>
        <button type="button" class="gd-btn gd-btn-danger" disabled={deleting} on:click={confirmDelete}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    border-radius: 24px;
    background: rgba(12, 44, 49, 0.42);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    backdrop-filter: blur(28px) saturate(1.4);
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
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
    flex-wrap: wrap;
  }
  .headLeft {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .headActions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
  }
  .ghostBtn,
  .whiteBtn,
  .dangerBtn {
    height: 40px;
    padding: 0 16px;
    border-radius: 10px;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
  }
  .small {
    font-size: 13px;
  }
  .ghostBtn {
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .ghostBtn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  .whiteBtn {
    border: 0;
    background: #fff;
    color: #0f3a40;
  }
  .whiteBtn:hover:not(:disabled) {
    background: #e7f1f2;
  }
  .dangerBtn {
    border: 1px solid rgba(255, 138, 144, 0.55);
    background: transparent;
    color: #ffc2c5;
    font-size: 13px;
  }
  .dangerBtn:hover {
    background: rgba(192, 40, 47, 0.25);
  }
  .ghostBtn:disabled,
  .whiteBtn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .row:last-child {
    border-bottom: 0;
  }
  .rowHead {
    width: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto auto 20px;
    align-items: center;
    gap: 14px;
    padding: 15px 20px;
    border: 0;
    background: transparent;
    color: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .rowHead:hover {
    background: rgba(255, 255, 255, 0.05);
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .voted {
    font: 12px "Roboto Mono", monospace;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
  }
  .typeBadge {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(159, 214, 220, 0.18);
    color: #d6f1f4;
  }
  .typeBadge.special {
    background: rgba(255, 196, 92, 0.18);
    color: #ffe2ad;
  }
  .chev {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    transition: transform 0.2s;
  }
  .chev.open {
    transform: rotate(180deg);
  }
  .editor {
    padding: 4px 20px 22px 66px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .notice {
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(255, 196, 92, 0.14);
    border: 1px solid rgba(255, 196, 92, 0.45);
    font-size: 13px;
    color: #ffe2ad;
  }
  .segments {
    display: flex;
    padding: 3px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    width: max-content;
  }
  .segments button {
    height: 32px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #fff;
    font: 500 13px "Roboto", sans-serif;
    cursor: pointer;
  }
  .segments button.on {
    background: #fff;
    color: #0f3a40;
  }
  .editorActions {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .editorRight {
    display: flex;
    gap: 8px;
  }
  .empty {
    margin: 0;
    padding: 48px 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }
  .deleteDialog {
    width: min(440px, 100%);
    gap: 14px;
  }
  .deleteText {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.85);
  }
  .deleteText b {
    color: #fff;
  }
  .toast {
    position: fixed;
    z-index: 40;
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

  @media (max-width: 600px) {
    .cardHead {
      padding: 14px 16px;
    }
    .rowHead {
      grid-template-columns: 24px minmax(0, 1fr) auto 16px;
      gap: 10px;
      padding: 14px 16px;
    }
    .voted {
      grid-column: 2;
      grid-row: 2;
    }
    .voted:empty {
      display: none;
    }
    .editor {
      padding: 4px 16px 18px;
    }
  }
</style>
