<script>
  import { authHandlers } from "../store/store";
  import Textfield from "@smui/textfield";
  import Button, { Label } from "@smui/button";
  import AuthShell from "./AuthShell.svelte";
  import "$lib/styles/glass-field.css";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let email = "";
  let password = "";
  let emailError = "";
  let passwordError = "";
  let formError = "";
  let authenticating = false;
  let remember = true;
  let showPassword = false;
  let capsLockOn = false;

  function clearEmailError() {
    emailError = "";
  }

  function clearPasswordError() {
    passwordError = "";
  }

  function handlePasswordKeyUp(event) {
    capsLockOn = !!(event.getModifierState && event.getModifierState("CapsLock"));
  }

  function toggleRemember() {
    remember = !remember;
  }

  function handleRememberKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleRemember();
    }
  }

  async function handleAuthenticate() {
    if (authenticating) {
      return;
    }

    emailError = emailPattern.test(email)
      ? ""
      : email
        ? "That doesn't look like a valid email."
        : "Enter the email on your shareholder record.";
    passwordError = password ? "" : "Enter your password.";
    formError = "";

    if (emailError || passwordError) {
      return;
    }

    authenticating = true;
    try {
      await authHandlers.login(email, password, remember);
      // On success the root layout's onAuthStateChanged listener redirects to /dashboard.
    } catch (err) {
      console.error("There was an error signing in", err);
      formError =
        "Email or password is incorrect. Check your notice of meeting for your login details.";
      authenticating = false;
    }
  }
</script>

<AuthShell>
      <div class="cardHeading">
        <h1>Welcome, shareholder.</h1>
        <p class="subtitle">
          Sign in to view your voting topics and cast your votes.
        </p>
      </div>

      <!-- Demo only: shared test account for visitors. -->
      <div class="demoHint">
        <span class="demoHintTitle">Please use these login details.</span>
        <span>Email: <strong>test@test.com</strong></span>
        <span>Password: <strong>123456</strong></span>
      </div>

      {#if formError}
        <div class="alert" role="alert">
          <span class="alertIcon">!</span>
          <span>{formError}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={handleAuthenticate} novalidate>
        <div class="field">
          <Textfield
            class="glassField"
            type="email"
            variant="outlined"
            bind:value={email}
            label="Email address"
            input$autocomplete="email"
            disabled={authenticating}
            on:input={clearEmailError}
          ></Textfield>
          {#if emailError}
            <span class="fieldError">{emailError}</span>
          {/if}
        </div>

        <div class="field">
          <div class="pwWrap">
            <Textfield
              class="glassField"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              bind:value={password}
              label="Password"
              input$autocomplete="current-password"
              disabled={authenticating}
              on:input={clearPasswordError}
              on:keyup={handlePasswordKeyUp}
            ></Textfield>
            <button
              type="button"
              class="pwToggle"
              on:click={() => (showPassword = !showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {#if passwordError}
            <span class="fieldError">{passwordError}</span>
          {/if}
          {#if capsLockOn}
            <span class="capsHint">Caps Lock is on</span>
          {/if}
        </div>

        <div class="rowBetween">
          <span
            class="rememberToggle"
            role="checkbox"
            aria-checked={remember}
            tabindex="0"
            on:click={toggleRemember}
            on:keydown={handleRememberKeydown}
          >
            <span class="checkbox" class:checked={remember}>
              {#if remember}✓{/if}
            </span>
            Remember me
          </span>
          <a href="/forgot_password" rel="noreferrer noopener">Forgot password?</a
          >
        </div>

        <Button type="submit" disabled={authenticating} variant="raised">
          <Label
            >{#if authenticating}
              <i class="fa-solid fa-spinner fa-spin"></i>
            {:else}
              Sign in
            {/if}</Label
          >
        </Button>
      </form>
</AuthShell>

<style>
  .cardHeading {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cardHeading h1 {
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
  .demoHint {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 14px;
    line-height: 1.4;
    animation: pulse 2s infinite;
  }
  .demoHintTitle {
    font-weight: 600;
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.45);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
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
  .capsHint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
  .pwWrap {
    position: relative;
    display: flex;
  }
  .pwToggle {
    position: absolute;
    right: 6px;
    top: 8px;
    height: 36px;
    padding: 0 12px;
    border: 0;
    background: transparent;
    font: 500 13px "Roboto", sans-serif;
    color: #2f7f8b;
    cursor: pointer;
    border-radius: 8px;
    z-index: 1;
  }
  .pwToggle:hover {
    background: #e7f1f2;
  }
  .rowBetween {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    min-height: 24px;
  }
  .rowBetween a {
    color: #fff;
    font-size: 13px;
  }
  .rowBetween a:hover {
    color: #cfe6e9;
  }
  .rememberToggle {
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    user-select: none;
  }
  .checkbox {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid rgba(255, 255, 255, 0.75);
    box-sizing: border-box;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
  }
  .checkbox.checked {
    background: #fff;
    color: #0f3a40;
    border-color: #fff;
  }

  /* Field styles (.glassField) live in $lib/styles/glass-field.css. */

  /* Submit button: full-width white pill, matching the design */
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
  }
  @media (prefers-reduced-motion: reduce) {
    form :global(.mdc-button) {
      transition: none;
    }
    .demoHint {
      animation: none;
    }
  }

</style>
