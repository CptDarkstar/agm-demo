<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import { collection, onSnapshot } from "firebase/firestore";
  import { db } from "$lib/firebase/firebase";
  import { sortTopicIds, topicNumber } from "$lib/topics";
  import {
    NODE_API,
    INSTRUCTIONS,
    indexProxies,
    instructionFor,
    replaceGiverEntries,
    releaseGiver,
    updateGiverDetails,
  } from "$lib/proxies";
  import Register from "./Register.svelte";
  import AddProxy from "./AddProxy.svelte";
  import "$lib/styles/glass-dialog.css";

  let users = [];
  let topicsById = {};
  let loaded = false;

  let unsubUsers = null;
  let unsubTopics = null;

  onMount(() => {
    unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        loaded = true;
      },
      (error) => console.error("Error getting users collection: ", error)
    );
    unsubTopics = onSnapshot(collection(db, "Topics"), (snapshot) => {
      const next = {};
      snapshot.forEach((d) => (next[d.id] = d.data()));
      topicsById = next;
    });

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubTopics) unsubTopics();
      clearTimeout(toastTimer);
    };
  });

  // ---- Derived data -------------------------------------------------------

  let givenTo = {};
  let heldBy = {};
  $: ({ givenTo, heldBy } = indexProxies(users));
  $: usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  $: topics = sortTopicIds(Object.keys(topicsById)).map((id) => ({
    id,
    title: topicsById[id].title || "",
    description: topicsById[id].description || "",
  }));
  $: totalShares = users.reduce((sum, u) => sum + (Number(u.shares) || 0), 0);
  $: proxiesGiven = Object.keys(givenTo).length;

  function fmt(n) {
    return (Number(n) || 0).toLocaleString("en-ZA");
  }

  function nameOf(userId, fallback = "") {
    return usersById[userId]?.displayName || fallback;
  }

  function topicCode(topicId) {
    const n = topicNumber(topicId);
    return Number.isFinite(n) ? `T${n}` : topicId;
  }

  // ---- Search, filter, sort -----------------------------------------------

  let query = "";
  let onlyProxy = false;
  let sortKey = "agency";
  let sortDir = 1;

  const sortValue = {
    agency: (u) => (u.agency || "").toLowerCase(),
    name: (u) => (u.displayName || "").toLowerCase(),
    shares: (u) => Number(u.shares) || 0,
  };

  function sortBy(key) {
    if (sortKey === key) {
      sortDir = -sortDir;
    } else {
      sortKey = key;
      sortDir = key === "shares" ? -1 : 1;
    }
  }

  $: needle = query.trim().toLowerCase();
  $: rows = users
    .filter(
      (u) =>
        (!needle ||
          `${u.displayName || ""} ${u.agency || ""} ${u.email || ""}`
            .toLowerCase()
            .includes(needle)) &&
        (!onlyProxy || givenTo[u.id] || heldBy[u.id])
    )
    .sort((a, b) => {
      const x = sortValue[sortKey](a);
      const y = sortValue[sortKey](b);
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });

  // ---- Selection ----------------------------------------------------------

  let selectedId = null;
  let pendingSelectEmail = null; // select a newly added user once the snapshot includes them

  $: if (pendingSelectEmail) {
    const added = users.find(
      (u) => (u.email || "").toLowerCase() === pendingSelectEmail
    );
    if (added) {
      selectedId = added.id;
      pendingSelectEmail = null;
    }
  }

  $: selected = usersById[selectedId] || rows[0] || null;
  $: selGiven = selected ? givenTo[selected.id] : null;
  $: selHeld = selected ? heldBy[selected.id] || [] : [];
  $: selHeldShares = selHeld.reduce((sum, h) => sum + h.shares, 0);
  $: selWeight = (selGiven ? 0 : Number(selected?.shares) || 0) + selHeldShares;

  // ---- Toast --------------------------------------------------------------

  let toast = "";
  let toastTimer = null;

  function flash(message) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ""), 2600);
  }

  // ---- Dialogs ------------------------------------------------------------

  let modal = null; // "add" | "edit" | "delete" | "proxy"
  let targetId = null;

  function openModal(kind, userId = null) {
    modal = kind;
    targetId = userId;
    if (kind === "edit") {
      const u = usersById[userId];
      editForm = {
        displayName: u.displayName || "",
        agency: u.agency || "",
        email: u.email || "",
        shares: Number(u.shares) || 0,
      };
      editError = "";
    }
    if (kind === "delete") {
      deleteError = "";
    }
  }

  function closeModal() {
    if (saving || deleting) return;
    modal = null;
    targetId = null;
  }

  function handleWindowKeydown(event) {
    if (event.key === "Escape" && (modal === "edit" || modal === "delete")) {
      closeModal();
    }
  }

  // Edit
  let editForm = { displayName: "", agency: "", email: "", shares: 0 };
  let saving = false;
  let editError = "";

  $: editInvalid = !editForm.displayName.trim() || !editForm.email.trim();

  async function saveEdit() {
    if (editInvalid || saving) return;
    const before = usersById[targetId];
    const data = {
      displayName: editForm.displayName.trim(),
      email: editForm.email.trim(),
      agency: editForm.agency.trim(),
      shares: Math.max(0, parseInt(editForm.shares, 10) || 0),
    };
    saving = true;
    editError = "";
    try {
      await axios.put(`${NODE_API}/updateUser/${targetId}`, data);
      // If they've given a proxy, keep the share/name copies on the holder's entries in step.
      const given = givenTo[targetId];
      if (
        given &&
        (data.shares !== (Number(before?.shares) || 0) ||
          data.displayName !== (before?.displayName || ""))
      ) {
        await updateGiverDetails(given.holderId, targetId, {
          name: data.displayName,
          shares: data.shares,
        });
      }
      saving = false;
      closeModal();
      flash("Changes saved");
    } catch (error) {
      console.error("Error updating user data:", error);
      editError = "Couldn't save changes. Please try again.";
      saving = false;
    }
  }

  // Delete
  let deleting = false;
  let deleteError = "";

  async function confirmDelete() {
    if (deleting) return;
    const id = targetId;
    const name = nameOf(id, "Shareholder");
    deleting = true;
    deleteError = "";
    try {
      // They hold proxies: let those givers sign in and vote again.
      for (const held of heldBy[id] || []) {
        if (usersById[held.giverId]) {
          await releaseGiver(held.giverId);
        }
      }
      // They gave a proxy: remove their entries from the holder.
      for (const u of users) {
        if (u.id !== id && (u.proxies || []).some((e) => e.proxyUserId === id)) {
          await replaceGiverEntries(u.id, id);
        }
      }
      await axios.delete(`${NODE_API}/deleteUser/${id}`);
      if (selectedId === id) selectedId = null;
      deleting = false;
      closeModal();
      flash(`${name} deleted`);
    } catch (error) {
      console.error("Error deleting user: ", error);
      deleteError = "Couldn't delete this shareholder. Please try again.";
      deleting = false;
    }
  }

  // Add (Register) and proxy dialogs report back via events
  function handleCreated(event) {
    modal = null;
    flash(`${event.detail.name} added`);
    pendingSelectEmail = event.detail.email.toLowerCase();
  }

  function handleProxyDone(event) {
    modal = null;
    targetId = null;
    flash(event.detail.message);
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div class="wrap">
  <div class="top">
    <div class="intro">
      <h1>Shareholders</h1>
      <p>Manage holders, their shares and proxy instructions.</p>
    </div>
    <div class="stats">
      <div class="stat">
        <span class="eyebrow">Holders</span>
        <span class="statValue">{fmt(users.length)}</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Total shares</span>
        <span class="statValue">{fmt(totalShares)}</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Proxies given</span>
        <span class="statValue">{fmt(proxiesGiven)}</span>
      </div>
    </div>
  </div>

  <section class="card">
    <div class="toolbar">
      <div class="filters">
        <input
          class="search"
          type="search"
          placeholder="Search name, agency or email"
          aria-label="Search shareholders"
          bind:value={query}
        />
        <button
          type="button"
          class="pill"
          class:active={onlyProxy}
          aria-pressed={onlyProxy}
          on:click={() => (onlyProxy = !onlyProxy)}
        >
          <span class="pillDot"></span>Has proxy
        </button>
        <span class="count">
          {rows.length === users.length
            ? `${rows.length} shown`
            : `${rows.length} of ${users.length}`}
        </span>
      </div>
      <button type="button" class="addBtn" on:click={() => openModal("add")}>
        + Add shareholder
      </button>
    </div>

    {#if !loaded}
      <p class="empty"><i class="fa-solid fa-spinner fa-spin" aria-label="Loading"></i></p>
    {:else}
      <div class="split">
        <div class="list">
          <div class="sortBar">
            <span>Sort</span>
            <button type="button" on:click={() => sortBy("agency")}>
              Agency {sortKey === "agency" ? (sortDir > 0 ? "↑" : "↓") : ""}
            </button>
            <button type="button" on:click={() => sortBy("name")}>
              Name {sortKey === "name" ? (sortDir > 0 ? "↑" : "↓") : ""}
            </button>
            <button type="button" on:click={() => sortBy("shares")}>
              Shares {sortKey === "shares" ? (sortDir > 0 ? "↑" : "↓") : ""}
            </button>
          </div>

          {#each rows as u (u.id)}
            {@const held = (heldBy[u.id] || []).reduce((sum, h) => sum + h.shares, 0)}
            <button
              type="button"
              class="row"
              class:selected={selected && selected.id === u.id}
              on:click={() => (selectedId = u.id)}
            >
              <span class="rowText">
                <span class="rowName">{u.displayName || u.email || "—"}</span>
                <span class="rowAgency">{u.agency || "—"}</span>
              </span>
              <span class="rowMeta">
                <span class="mono">{fmt(u.shares)}</span>
                {#if held > 0}
                  <span class="heldTag">+{fmt(held)} held</span>
                {/if}
                {#if givenTo[u.id]}
                  <span class="proxyTag">
                    → {nameOf(givenTo[u.id].holderId, givenTo[u.id].holderName)}
                  </span>
                {/if}
              </span>
            </button>
          {:else}
            <p class="empty">No shareholders match.</p>
          {/each}
        </div>

        <div class="detail">
          {#if selected}
            <div class="detailHead">
              <div class="who">
                <span class="eyebrow">{selected.agency || "No agency"}</span>
                <span class="whoName">{selected.displayName || "—"}</span>
                <span class="whoEmail">{selected.email || ""}</span>
              </div>
              <div class="detailActions">
                <button type="button" class="ghostBtn" on:click={() => openModal("edit", selected.id)}>
                  Edit
                </button>
                <button type="button" class="dangerBtn" on:click={() => openModal("delete", selected.id)}>
                  Delete
                </button>
              </div>
            </div>

            <div class="tiles">
              <div class="tile">
                <span class="eyebrow">Own shares</span>
                <span class="tileValue">{fmt(selected.shares)}</span>
              </div>
              <div class="tile">
                <span class="eyebrow">Held by proxy</span>
                <span class="tileValue">{fmt(selHeldShares)}</span>
              </div>
              <div class="tile">
                <span class="eyebrow">Votes with</span>
                <span class="tileValue">{fmt(selWeight)}</span>
              </div>
            </div>

            <div class="block">
              <div class="blockHead">
                <span class="eyebrow">Proxy given</span>
                <button type="button" class="proxyBtn" on:click={() => openModal("proxy", selected.id)}>
                  {selGiven ? "Edit proxy" : "Add proxy"}
                </button>
              </div>
              {#if selGiven}
                <div class="panel">
                  <span class="panelText">
                    <b>{nameOf(selGiven.holderId, selGiven.holderName)}</b> votes all
                    {fmt(selected.shares)} shares. {selected.displayName || "They"} can't sign in to
                    vote while this proxy is in place.
                  </span>
                  {#if topics.length}
                    <div class="chips">
                      {#each topics as t (t.id)}
                        {@const ins = instructionFor(selGiven.entries, t.id)}
                        {@const opt = INSTRUCTIONS.find((o) => o.key === ins)}
                        <span class="chip" title={t.title}>
                          <span class="chipCode">{topicCode(t.id)}</span>
                          <b style="color: {opt ? opt.color : 'rgba(255,255,255,.5)'}">
                            {opt ? opt.label : "—"}
                          </b>
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <span class="muted">Votes directly. No proxy assigned.</span>
              {/if}
            </div>

            <div class="block">
              <span class="eyebrow">Proxies held for others</span>
              {#if selHeld.length}
                <div class="heldList">
                  {#each selHeld as h (h.giverId)}
                    <div class="heldRow">
                      <span class="heldWho">
                        <b>{nameOf(h.giverId, h.name)}</b>
                        <span class="rowAgency">{usersById[h.giverId]?.agency || ""}</span>
                      </span>
                      <span class="heldMode">{h.instructed ? "Instructed" : "Free vote"}</span>
                      <span class="mono">{fmt(h.shares)}</span>
                    </div>
                  {/each}
                </div>
              {:else}
                <span class="muted">None.</span>
              {/if}
            </div>
          {:else}
            <p class="muted">No shareholders yet. Add one to get started.</p>
          {/if}
        </div>
      </div>
    {/if}
  </section>
</div>

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

<Register open={modal === "add"} on:close={closeModal} on:created={handleCreated} />

{#if modal === "proxy" && usersById[targetId]}
  <AddProxy
    giver={usersById[targetId]}
    {users}
    {topics}
    {givenTo}
    on:close={closeModal}
    on:saved={handleProxyDone}
    on:removed={handleProxyDone}
  />
{/if}

{#if modal === "edit"}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="gd-scrim" on:click|self={closeModal}>
    <form
      class="gd-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      on:submit|preventDefault={saveEdit}
      novalidate
    >
      <div class="gd-head">
        <span id="edit-title" class="gd-title">Edit shareholder</span>
        <span class="gd-sub">{usersById[targetId]?.agency || ""}</span>
      </div>
      <div class="gd-fields">
        <label class="gd-field">
          <span class="gd-label">Name *</span>
          <input class="gd-input" type="text" bind:value={editForm.displayName} />
        </label>
        <label class="gd-field">
          <span class="gd-label">Agency</span>
          <input class="gd-input" type="text" bind:value={editForm.agency} />
        </label>
        <label class="gd-field">
          <span class="gd-label">Email *</span>
          <input class="gd-input" type="email" bind:value={editForm.email} />
        </label>
        <label class="gd-field">
          <span class="gd-label">Shares</span>
          <input class="gd-input" type="number" min="0" step="1" bind:value={editForm.shares} />
        </label>
      </div>
      {#if editError}
        <p class="gd-error" role="alert">{editError}</p>
      {/if}
      <div class="gd-actions">
        <button type="button" class="gd-btn gd-btn-ghost" disabled={saving} on:click={closeModal}>
          Cancel
        </button>
        <button type="submit" class="gd-btn gd-btn-primary" disabled={editInvalid || saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  </div>
{/if}

{#if modal === "delete"}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="gd-scrim" on:click|self={closeModal}>
    <div class="gd-dialog deleteDialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <span id="delete-title" class="gd-title">Delete shareholder?</span>
      <p class="gd-sub deleteText">
        <b>{nameOf(targetId, "This shareholder")}</b> ({fmt(usersById[targetId]?.shares)} shares)
        will be removed, along with any proxies they gave or hold. This can't be undone.
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
  .wrap {
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: #fff;
    font-family: "Roboto", sans-serif;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h1 {
    margin: 0;
    font: 600 clamp(30px, 3.6vw, 44px) / 1.05 "Roboto", sans-serif;
    letter-spacing: -0.035em;
  }
  .intro p {
    margin: 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.8);
  }
  .stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .stat {
    padding: 12px 16px;
    border-radius: 14px;
    background: rgba(12, 44, 49, 0.42);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 110px;
  }
  .eyebrow {
    font: 500 10px "Roboto Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
  }
  .statValue,
  .tileValue {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .card {
    border-radius: 24px;
    background: rgba(12, 44, 49, 0.42);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
    flex-wrap: wrap;
  }
  .filters {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    flex: 1 1 360px;
  }
  .search {
    flex: 1 1 220px;
    max-width: 340px;
    height: 40px;
    box-sizing: border-box;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font: 400 14px "Roboto", sans-serif;
    outline: none;
  }
  .search::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
  .search:focus {
    border-color: #9fd6dc;
  }
  .pill {
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    font: 500 13px "Roboto", sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pill.active {
    border-color: #9fd6dc;
    background: rgba(159, 214, 220, 0.28);
  }
  .pillDot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #9fd6dc;
  }
  .count,
  .mono {
    font: 12px "Roboto Mono", monospace;
    color: rgba(255, 255, 255, 0.7);
  }
  .mono {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
  }
  .addBtn {
    height: 40px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: #fff;
    color: #0f3a40;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
  }
  .addBtn:hover {
    background: #e7f1f2;
  }
  .split {
    display: flex;
    flex-wrap: wrap;
    min-height: 520px;
  }
  .list {
    flex: 1 1 300px;
    max-width: 400px;
    border-right: 1px solid rgba(255, 255, 255, 0.14);
    max-height: max(520px, calc(100vh - 330px));
    overflow: auto;
  }
  .sortBar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    gap: 14px;
    padding: 10px 18px;
    background: rgba(16, 52, 57, 0.96);
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font: 500 11px "Roboto Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
  }
  .sortBar button {
    all: unset;
    cursor: pointer;
  }
  .sortBar button:focus-visible {
    outline: 1px solid #9fd6dc;
  }
  .row {
    width: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px 18px;
    border: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:hover {
    background: rgba(255, 255, 255, 0.07);
  }
  .row.selected {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: inset 3px 0 0 #9fd6dc;
  }
  .rowText {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .rowName {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rowAgency {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rowMeta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .heldTag {
    font: 11px "Roboto Mono", monospace;
    color: #9fd6dc;
  }
  .proxyTag {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(159, 214, 220, 0.2);
    color: #d6f1f4;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .detail {
    flex: 2 1 420px;
    min-width: 0;
    padding: 28px clamp(18px, 3vw, 36px);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .detailHead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .whoName {
    font: 600 28px/1.1 "Roboto", sans-serif;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }
  .whoEmail {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    overflow-wrap: anywhere;
  }
  .detailActions {
    display: flex;
    gap: 8px;
  }
  .ghostBtn,
  .dangerBtn {
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    font: 600 13px "Roboto", sans-serif;
    cursor: pointer;
  }
  .ghostBtn {
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .ghostBtn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .dangerBtn {
    border: 1px solid rgba(255, 138, 144, 0.55);
    background: transparent;
    color: #ffc2c5;
  }
  .dangerBtn:hover {
    background: rgba(192, 40, 47, 0.25);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .tile {
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.14);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .blockHead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .proxyBtn {
    height: 34px;
    padding: 0 14px;
    border: 1px solid rgba(159, 214, 220, 0.55);
    border-radius: 9px;
    background: rgba(159, 214, 220, 0.14);
    color: #d6f1f4;
    font: 600 12px "Roboto", sans-serif;
    cursor: pointer;
  }
  .proxyBtn:hover {
    background: rgba(159, 214, 220, 0.26);
  }
  .panel {
    padding: 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.14);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .panelText {
    font-size: 14px;
    line-height: 1.5;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 12px;
  }
  .chipCode {
    font-family: "Roboto Mono", monospace;
    color: rgba(255, 255, 255, 0.75);
  }
  .heldList {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
  }
  .heldRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 14px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 14px;
  }
  .heldRow:last-child {
    border-bottom: 0;
  }
  .heldWho {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .heldMode {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
  .muted {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.72);
  }
  .empty {
    margin: 0;
    padding: 40px 18px;
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

  @media (max-width: 760px) {
    .list {
      max-width: none;
      flex-basis: 100%;
      border-right: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      max-height: 50vh;
    }
    .split {
      min-height: 0;
    }
    .toolbar {
      padding: 14px 16px;
    }
    .search {
      max-width: none;
    }
    .addBtn {
      width: 100%;
    }
    .detail {
      padding: 22px 16px;
    }
    .heldRow {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .heldMode {
      grid-column: 1;
      grid-row: 2;
    }
  }
</style>
