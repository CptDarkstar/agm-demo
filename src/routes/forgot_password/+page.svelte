<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import { sendPasswordResetEmail } from "firebase/auth";
  import Textfield from "@smui/textfield";
  import Button, { Label } from "@smui/button";
  import { auth } from "$lib/firebase/firebase";
  import AuthShell from "../../components/AuthShell.svelte";
  import "$lib/styles/glass-field.css";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let email = "";
  let emailError = "";
  let formError = "";
  let sending = false;
  let sent = false;
  let sentTo = "";

  function clearErrors() {
    emailError = "";
    formError = "";
  }

  async function sendResetLink() {
    if (sending) return;
    const address = email.trim();
    emailError = emailPattern.test(address)
      ? ""
      : address
        ? "That doesn't look like a valid email."
        : "Enter the email on your shareholder record.";
    formError = "";
    if (emailError) return;

    sending = true;
    try {
      await sendPasswordResetEmail(auth, address);
      showSent(address);
    } catch (error) {
      switch (error?.code) {
        // Same screen as success, so the page never reveals which emails are registered.
        case "auth/user-not-found":
          showSent(address);
          break;
        case "auth/invalid-email":
          emailError = "That doesn't look like a valid email.";
          break;
        case "auth/too-many-requests":
          formError = "Too many attempts. Please wait a few minutes and try again.";
          break;
        case "auth/network-request-failed":
          formError =
            "Couldn't connect. Check your internet connection and try again.";
          break;
        default:
          console.error("Error sending password reset email:", error);
          formError =
            "Something went wrong sending the reset email. Please try again.";
      }
    } finally {
      sending = false;
    }
  }

  function showSent(address) {
    sentTo = address;
    sent = true;
  }

  function useDifferentEmail() {
    email = "";
    sentTo = "";
    clearErrors();
    sent = false;
  }
</script>

<AuthShell>
  <a class="backPill" href="/">← Back to sign in</a>

  {#if !sent}
    <div class="cardHeading">
      <h1>Reset your password.</h1>
      <p class="subtitle">
        Enter the email on your shareholder record and we'll send you a link to
        set a new password.
      </p>
    </div>

    {#if formError}
      <div class="alert" role="alert">
        <span class="alertIcon">!</span>
        <span>{formError}</span>
      </div>
    {/if}

    <form on:submit|preventDefault={sendResetLink} novalidate>
      <div class="field">
        <Textfield
          class="glassField"
          type="email"
          variant="outlined"
          bind:value={email}
          label="Email address"
          input$autocomplete="email"
          disabled={sending}
          on:input={clearErrors}
        ></Textfield>
        {#if emailError}
          <span class="fieldError">{emailError}</span>
        {/if}
      </div>

      <Button type="submit" disabled={sending} variant="raised">
        <Label
          >{#if sending}
            <i class="fa-solid fa-spinner fa-spin"></i> Sending…
          {:else}
            Send reset link
          {/if}</Label
        >
      </Button>
    </form>
  {:else}
    <div class="sent" role="status">
      <span class="tick" aria-hidden="true">✓</span>
      <h1>Check your inbox.</h1>
      <p class="subtitle">
        If <b>{sentTo}</b> is on our records, we've sent a reset link. It may take
        a few minutes, so check your spam folder too.
      </p>
      <a class="whiteLink" href="/">Back to sign in</a>
      <button type="button" class="textBtn" on:click={useDifferentEmail}>
        Use a different email
      </button>
    </div>
  {/if}

  <div class="help">
    Still can't get in? Call RNS on
    <a href="tel:+27118946920">011 894 6920</a>.
  </div>
</AuthShell>

<style>
  .backPill {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font: 500 12px "Roboto", sans-serif;
    text-decoration: none;
  }
  .backPill:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  .cardHeading {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h1 {
    margin: 0;
    font: 600 clamp(28px, 4vw, 38px) / 1.05 "Roboto", sans-serif;
    letter-spacing: -0.03em;
  }
  .subtitle {
    margin: 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.5;
  }
  .subtitle b {
    color: #fff;
    overflow-wrap: anywhere;
  }
  .alert {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(192, 40, 47, 0.9);
    font-size: 14px;
    line-height: 1.4;
  }
  .alertIcon {
    font-weight: 700;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fieldError {
    font-size: 13px;
    color: #ffd4d6;
  }

  /* Submit button: full-width white pill, same as the login page */
  form :global(.mdc-button) {
    width: 100%;
    height: 52px;
    border-radius: 12px;
    background: #fff;
    color: #0f3a40;
    cursor: pointer;
    font-family: "Roboto", sans-serif;
    font-size: 15px;
    font-weight: 600;
    transition: transform 100ms ease-out;
  }
  form :global(.mdc-button:hover) {
    background: #e7f1f2;
  }
  form :global(.mdc-button:active) {
    transform: scale(0.97);
  }
  form :global(.mdc-button .fa-spinner) {
    color: #0f3a40;
    margin-right: 8px;
  }
  @media (prefers-reduced-motion: reduce) {
    form :global(.mdc-button) {
      transition: none;
    }
  }

  .sent {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .tick {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #fff;
    color: #0f3a40;
    display: grid;
    place-items: center;
    font-size: 22px;
    font-weight: 700;
  }
  .whiteLink {
    margin-top: 10px;
    height: 52px;
    border-radius: 12px;
    background: #fff;
    color: #0f3a40;
    font: 600 15px "Roboto", sans-serif;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .whiteLink:hover {
    background: #e7f1f2;
  }
  .textBtn {
    height: 44px;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font: 500 13px "Roboto", sans-serif;
    cursor: pointer;
  }
  .textBtn:hover {
    color: #fff;
  }
  .help {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.5;
  }
  .help a {
    color: #fff;
    font-weight: 600;
    white-space: nowrap;
  }
  .help a:hover {
    color: #cfe6e9;
  }
</style>
