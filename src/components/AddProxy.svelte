<script>
  import { createEventDispatcher } from "svelte";
  import { doc, updateDoc } from "firebase/firestore";
  import { db } from "$lib/firebase/firebase";
  import { topicNumber } from "$lib/topics";
  import {
    INSTRUCTIONS,
    instructionFor,
    replaceGiverEntries,
    buildProxyEntries,
    disableGiver,
    releaseGiver,
  } from "$lib/proxies";
  import "$lib/styles/glass-dialog.css";

  export let giver; // the shareholder giving the proxy
  export let users = [];
  export let topics = []; // [{ id, title, description }], already sorted
  export let givenTo = {}; // from indexProxies()

  const dispatch = createEventDispatcher();

  // Snapshot of this giver's current proxy when the dialog opened.
  const current = givenTo[giver.id];

  let holderId = current ? current.holderId : "";
  let instructions = {};
  for (const topic of topics) {
    const existing = current ? instructionFor(current.entries, topic.id) : null;
    instructions[topic.id] = existing && existing !== "free" ? existing : "free";
  }

  let saving = false;
  let error = "";

  // No chains: someone who has given their own proxy is disabled and can't vote.
  $: holderOptions = users
    .filter((u) => u.id !== giver.id && (!givenTo[u.id] || u.id === holderId))
    .sort((a, b) =>
      (a.displayName || "").localeCompare(b.displayName || "")
    );

  $: shareText = (Number(giver.shares) || 0).toLocaleString("en-ZA");

  function topicCode(topicId) {
    const n = topicNumber(topicId);
    return Number.isFinite(n) ? `T${n}` : topicId;
  }

  function summary(entries) {
    const set = topics
      .map((t) => {
        const ins = instructionFor(entries, t.id);
        if (!ins || ins === "free") return null;
        return `${topicCode(t.id)} ${INSTRUCTIONS.find((i) => i.key === ins)?.label || ins}`;
      })
      .filter(Boolean);
    if (!set.length) return "free vote on all";
    return set.join(", ") + (set.length < topics.length ? ", rest free" : "");
  }

  function setAll(key) {
    for (const topic of topics) instructions[topic.id] = key;
    instructions = instructions;
  }

  function close() {
    if (saving) return;
    dispatch("close");
  }

  async function assign() {
    const holder = users.find((u) => u.id === holderId);
    if (!holder || saving) return;
    saving = true;
    error = "";
    try {
      if (!current) {
        await disableGiver(giver.id);
      }
      // Clear this giver's entries from any other holder (including a previous one).
      for (const u of users) {
        if (u.id === holder.id) continue;
        if ((u.proxies || []).some((e) => e.proxyUserId === giver.id)) {
          await replaceGiverEntries(u.id, giver.id);
        }
      }
      const entries = buildProxyEntries(
        giver,
        holder,
        topics.map((t) => t.id),
        instructions
      );
      await replaceGiverEntries(holder.id, giver.id, entries);
      await updateDoc(doc(db, "users", giver.id), {
        proxyTo: holder.displayName || "",
      });
      dispatch("saved", {
        message: `Proxy assigned to ${holder.displayName || "shareholder"}`,
      });
    } catch (err) {
      console.error("Error assigning proxy:", err);
      error = "Couldn't save this proxy. Please try again.";
    } finally {
      saving = false;
    }
  }

  async function removeProxy() {
    if (saving) return;
    saving = true;
    error = "";
    try {
      for (const u of users) {
        if ((u.proxies || []).some((e) => e.proxyUserId === giver.id)) {
          await replaceGiverEntries(u.id, giver.id);
        }
      }
      await releaseGiver(giver.id);
      dispatch("removed", { message: "Proxy removed" });
    } catch (err) {
      console.error("Error removing proxy:", err);
      error = "Couldn't remove this proxy. Please try again.";
    } finally {
      saving = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="gd-scrim" on:click|self={close}>
  <div
    class="gd-dialog proxyDialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="proxy-title"
  >
    <div class="gd-head">
      <span id="proxy-title" class="gd-title">Proxy for {giver.displayName || "shareholder"}</span>
      <span class="gd-sub">
        {giver.agency ? `${giver.agency} · ` : ""}all {shareText} shares go to the proxy.
        {giver.displayName || "They"} won't be able to sign in to vote while the proxy is in place.
      </span>
    </div>

    {#if current}
      <div class="currentProxy">
        <span>
          Current proxy: <b>{current.holderName || "—"}</b> · {summary(current.entries)}
        </span>
        <button type="button" class="removeBtn" disabled={saving} on:click={removeProxy}>
          Remove proxy
        </button>
      </div>
    {/if}

    <label class="gd-field">
      <span class="gd-label">Proxy (votes on their behalf)</span>
      <select class="gd-input" bind:value={holderId} disabled={saving}>
        <option value="">Select shareholder…</option>
        {#each holderOptions as u (u.id)}
          <option value={u.id}>
            {u.displayName || u.email}{u.agency ? ` — ${u.agency}` : ""}
          </option>
        {/each}
      </select>
    </label>

    <div class="instr">
      <div class="instrHead">
        <span class="gd-label">Vote instructions</span>
        <div class="bulk">
          <span>Set all:</span>
          {#each INSTRUCTIONS as option}
            <button type="button" disabled={saving} on:click={() => setAll(option.key)}>
              {option.label}
            </button>
          {/each}
        </div>
      </div>

      {#if topics.length}
        <div class="matrix">
          {#each topics as topic (topic.id)}
            <div class="matrixRow">
              <div class="topicText">
                <span class="topicTitle">{topic.title || topic.id}</span>
                {#if topic.description}
                  <span class="topicDesc">{topic.description}</span>
                {/if}
              </div>
              <div class="segments" role="radiogroup" aria-label="Instruction for {topic.title || topic.id}">
                {#each INSTRUCTIONS as option}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={instructions[topic.id] === option.key}
                    class:on={instructions[topic.id] === option.key}
                    style={instructions[topic.id] === option.key
                      ? `background: ${option.key === "free" ? "#fff" : option.color};`
                      : ""}
                    disabled={saving}
                    on:click={() => (instructions[topic.id] = option.key)}
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="gd-sub">No resolutions yet — the proxy will get a free vote on any added later.</p>
      {/if}
      <span class="hint">
        Free: the proxy decides. Yes, No or Abstain: these shares are counted that way on that
        resolution, whatever the proxy votes.
      </span>
    </div>

    {#if error}
      <p class="gd-error" role="alert">{error}</p>
    {/if}

    <div class="gd-actions">
      <button type="button" class="gd-btn gd-btn-ghost" disabled={saving} on:click={close}>
        Cancel
      </button>
      <button
        type="button"
        class="gd-btn gd-btn-primary"
        disabled={!holderId || saving}
        on:click={assign}
      >
        {saving ? "Saving…" : current ? "Update proxy" : "Assign proxy"}
      </button>
    </div>
  </div>
</div>

<style>
  .proxyDialog {
    width: min(680px, 100%);
  }
  .currentProxy {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(159, 214, 220, 0.14);
    border: 1px solid rgba(159, 214, 220, 0.4);
    font-size: 14px;
  }
  .removeBtn {
    height: 34px;
    padding: 0 14px;
    border: 1px solid rgba(255, 138, 144, 0.55);
    border-radius: 9px;
    background: transparent;
    color: #ffc2c5;
    font: 600 12px "Roboto", sans-serif;
    cursor: pointer;
  }
  .removeBtn:hover:not(:disabled) {
    background: rgba(192, 40, 47, 0.25);
  }
  .instr {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .instrHead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .bulk {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  .bulk button {
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 7px;
    background: transparent;
    color: #fff;
    font: 500 12px "Roboto", sans-serif;
    cursor: pointer;
  }
  .bulk button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }
  .matrix {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    overflow: hidden;
  }
  .matrixRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .matrixRow:last-child {
    border-bottom: 0;
  }
  .topicText {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .topicTitle {
    font-size: 14px;
    font-weight: 600;
  }
  .topicDesc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .segments {
    display: flex;
    padding: 3px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.07);
    gap: 2px;
  }
  .segments button {
    height: 30px;
    padding: 0 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font: 600 12px "Roboto", sans-serif;
    cursor: pointer;
  }
  .segments button.on {
    color: #0e1f23;
  }
  .hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.45;
  }
  @media (max-width: 600px) {
    .matrixRow {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .segments {
      justify-self: start;
    }
  }
</style>
