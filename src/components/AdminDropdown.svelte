<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import { collection, onSnapshot } from "firebase/firestore";
  import { db } from "$lib/firebase/firebase";
  import { NODE_API } from "$lib/proxies";
  import "$lib/styles/glass-dialog.css";

  let users = [];
  let pick = "";
  let granting = false;
  let error = "";
  let toast = "";
  let toastTimer = null;

  onMount(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (err) => console.error("Error getting users collection: ", err)
    );
    return () => {
      unsubscribe();
      clearTimeout(toastTimer);
    };
  });

  $: candidates = [...users].sort((a, b) =>
    (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "")
  );

  function flash(message) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ""), 2600);
  }

  // Admin is a Firebase Auth custom claim set by the Node backend. The browser
  // can't read other users' claims, so this panel can grant admin but can't
  // list or remove admins.
  async function makeAdmin() {
    const user = users.find((u) => u.id === pick);
    if (!user || granting) return;
    granting = true;
    error = "";
    try {
      await axios.post(`${NODE_API}/setCustomClaims/${user.id}`);
      pick = "";
      flash(`${user.displayName || user.email} is now an admin`);
    } catch (err) {
      console.error("Error granting admin:", err);
      error = "Couldn't grant admin access. Please try again.";
    } finally {
      granting = false;
    }
  }
</script>

<aside class="card">
  <div class="cardHead">
    <span class="eyebrow">Admins</span>
  </div>
  <form class="body" on:submit|preventDefault={makeAdmin}>
    <label class="gd-field">
      <span class="gd-label">Make a shareholder admin</span>
      <select class="gd-input" bind:value={pick} disabled={granting}>
        <option value="">Select shareholder…</option>
        {#each candidates as u (u.id)}
          <option value={u.id}>
            {u.displayName || "—"}{u.email ? ` — ${u.email}` : ""}
          </option>
        {/each}
      </select>
    </label>
    <button type="submit" class="whiteBtn" disabled={!pick || granting}>
      {granting ? "Granting…" : "Make admin"}
    </button>
    {#if error}
      <p class="gd-error" role="alert">{error}</p>
    {/if}
    <p class="note">They'll get admin access the next time they sign in.</p>
  </form>
</aside>

{#if toast}
  <div class="toast" role="status">{toast}</div>
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
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  }
  .eyebrow {
    font: 500 11px "Roboto Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
  }
  .body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .whiteBtn {
    height: 42px;
    border: 0;
    border-radius: 10px;
    background: #fff;
    color: #0f3a40;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
  }
  .whiteBtn:hover:not(:disabled) {
    background: #e7f1f2;
  }
  .whiteBtn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.7);
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
</style>
