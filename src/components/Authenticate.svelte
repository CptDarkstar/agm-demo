<script>
  import { registerVersion } from "firebase/app";
  import { authHandlers } from "../store/store";
  import { auth } from "../lib/firebase/firebase";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import Button, { Label } from "@smui/button";

  let email = "";
  let password = "";
  let error = false;
  let logIn = false;
  let register = false;
  let authenticating = false;

  async function handleAuthenticate() {
    if (authenticating) {
      return;
    }
    if (!email || !password) {
      error = true;
      return;
    }
    authenticating = true;
    try {
      if (!register) {
        await authHandlers.login(email, password);
        /* alert('Logged in!') */
      } else {
        await authHandlers.singup(email, password);
      }
    } catch (err) {
      console.log("There was an error", err);
      error = true;
      authenticating = false;
    }
  }
</script>

<div class="authContainer">
  <img class="logo" src="rnslogo.png" alt="" />
  <form>
    {#if error}
      <p class="error">
        The information you have enterd is not valid. Please contact RNS.
      </p>
    {/if}
    <div class="log-in-group01">
      <span class="log-in-text">
        <span class="log-in-text01">Welcome to</span>
        <span class="log-in-text02">RNS</span>,<br>
        <span class="log-in-text01">Please use these login details.</span><br>
        <span class="log-in-text01">Email: test@test.com</span><br>
        <span class="log-in-text01">Password: 123456</span>
      </span>
    </div>
    <span class="log-in-text03">
      <span>Sign in</span>
    </span>
    <div class="log-in-group02">
      <span class="log-in-text05">
        <span>Enter your Email</span>
      </span>
      <Textfield
        class="shaped-outlined"
        type="email"
        required
        variant="outlined"
        bind:value={email}
        label="Email"
      ></Textfield>
    </div>
    <div class="log-in-group03">
      <span class="log-in-text07">
        <span>Enter your Password</span>
      </span>
      <Textfield
        class="shaped-outlined"
        type="password"
        required
        variant="outlined"
        bind:value={password}
        label="Password"
      ></Textfield>
    </div>
    <a href="/forgot_password" rel="noreferrer noopener" class="log-in-text09">
      <span>Forgot Password</span>
    </a>
    <div class="log-in-group04">
      <Button on:click={handleAuthenticate} variant="raised">
        <Label
          >{#if authenticating}
            <i class="fa-solid fa-spinner fa-spin" style="color: #ffffff;"></i>
          {:else}
            Log In
          {/if}</Label
        >
      </Button>
    </div>
  </form>
</div>

<style>
  *
    :global(
      .shaped-outlined .mdc-notched-outline .mdc-notched-outline__leading
    ) {
    border-radius: 28px 0 0 28px;
    width: 28px;
  }
  *
    :global(
      .shaped-outlined .mdc-notched-outline .mdc-notched-outline__trailing
    ) {
    border-radius: 0 28px 28px 0;
  }
  * :global(.shaped-outlined .mdc-notched-outline .mdc-notched-outline__notch) {
    max-width: calc(100% - 28px * 2);
  }
  *
    :global(
      .shaped-outlined.mdc-text-field--with-leading-icon:not(
          .mdc-text-field--label-floating
        )
        .mdc-floating-label
    ) {
    left: 16px;
  }
  * :global(.shaped-outlined + .mdc-text-field-helper-line) {
    padding-left: 32px;
    padding-right: 28px;
  }
  :global(.shaped-outlined) {
    width: 100%;
  }
  .authContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-content: flex-end;
    align-items: center;
    justify-content: center;
    flex: 1;
    /* padding: 20px; */
    padding-right: 100px;
  }
  .logo {
    align-self: flex-start;
  }
  form {
    display: flex;
    position: sticky;
    left: 100%;
    flex-direction: column;
    gap: 15px;
    width: 400px;
    max-width: 100%;
    margin: 0 auto;
    align-items: flex-start;
    border: none;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.415);
    backdrop-filter: blur(20px);
    padding: 15px;
    padding-left: 25px;
    padding-top: 25px;
    padding-bottom: 25px;
  }
  /* form input {
    width: 95%;
    font-size: large;
    height: 50px;
  } */
  /* .log-in-textinput1{
        width: 97%;
        min-width: 97%;
    } */
  .log-in-text {
    font-size: 21px;
  }
  .log-in-text02 {
    color: #6ba3ab;
    font-weight: bold;
  }
  .log-in-text03 {
    font-size: 55px;
  }
  .log-in-group02 {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .log-in-group03 {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .log-in-group04 {
    width: 100%;
    /* border: none;
    border-radius: 10px;
    background: #6ba3ab;
    cursor: pointer;
    padding: 10px 0;
    color: white;
    font-size: large; */
  }
  * :global(.mdc-button) {
    width: 100%;
    border-radius: 20px;
    cursor: pointer;
    font-family: "Merriweather", sans-serif;
    font-size: large;
    color: white;
  }
  @media (max-width: 720px) {
    .authContainer {
      padding: 10px;
      padding-top: 0%;
      align-content: center;
    }
    .logo {
      width: 150px;
    }
  }
  @media (max-width: 430px) {
    .authContainer {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      padding: 10px;
      justify-content: flex-start;
      align-items: flex-start;
    }
    .logo {
      width: 165px;
      align-self: center;
    }
    form {
      top: 5%;
    }
  }
</style>
