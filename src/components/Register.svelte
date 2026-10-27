<script>
  import { createEventDispatcher } from "svelte";
  import axios from "axios";
  import "$lib/styles/glass-dialog.css";

  export let open = false;

  const dispatch = createEventDispatcher();

  let displayName = "";
  let agency = "";
  let email = "";
  let password = "";
  let shares = 0;
  let saving = false;
  let error = "";

  $: invalid = !displayName.trim() || !email.trim() || !password.trim();

  // Clear the form whenever the dialog closes, so the next open starts blank.
  function reset() {
    displayName = "";
    agency = "";
    email = "";
    password = "";
    shares = 0;
    error = "";
  }

  function close() {
    if (saving) return;
    reset();
    dispatch("close");
  }

  async function createUser() {
    if (invalid || saving) return;
    saving = true;
    error = "";
    const userData = {
      email: email.trim(),
      agency: agency.trim(),
      displayName: displayName.trim(),
      password,
      shares: Math.max(0, parseInt(shares, 10) || 0),
    };
    try {
      await axios.post(
        "https://agm-demo-node.onrender.com/createUser",
        userData
      );
      reset();
      dispatch("created", { name: userData.displayName, email: userData.email });
    } catch (err) {
      console.error("Error creating user:", err);
      error =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Couldn't create this shareholder. Check the details and try again.";
    } finally {
      saving = false;
    }
  }

  function handleKeydown(event) {
    if (open && event.key === "Escape") close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="gd-scrim" on:click|self={close}>
    <form
      class="gd-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-shareholder-title"
      on:submit|preventDefault={createUser}
      novalidate
    >
      <div class="gd-head">
        <span id="add-shareholder-title" class="gd-title">Add shareholder</span>
        <span class="gd-sub">They sign in with this email and password.</span>
      </div>

      <div class="gd-fields">
        <label class="gd-field">
          <span class="gd-label">Name *</span>
          <input class="gd-input" type="text" bind:value={displayName} autocomplete="off" />
        </label>
        <label class="gd-field">
          <span class="gd-label">Agency</span>
          <input class="gd-input" type="text" bind:value={agency} autocomplete="off" />
        </label>
        <label class="gd-field">
          <span class="gd-label">Email *</span>
          <input class="gd-input" type="email" bind:value={email} autocomplete="off" />
        </label>
        <label class="gd-field">
          <span class="gd-label">Password *</span>
          <input class="gd-input" type="password" bind:value={password} autocomplete="new-password" />
        </label>
        <label class="gd-field">
          <span class="gd-label">Shares</span>
          <input class="gd-input" type="number" min="0" step="1" bind:value={shares} />
        </label>
      </div>

      {#if error}
        <p class="gd-error" role="alert">{error}</p>
      {/if}

      <div class="gd-actions">
        <button type="button" class="gd-btn gd-btn-ghost" disabled={saving} on:click={close}>
          Cancel
        </button>
        <button type="submit" class="gd-btn gd-btn-primary" disabled={invalid || saving}>
          {saving ? "Registering…" : "Register"}
        </button>
      </div>
    </form>
  </div>
{/if}
