<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import { getAuth, sendPasswordResetEmail } from "firebase/auth";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import Button, { Label } from "@smui/button";

  let email = "";

  function forgotPassword() {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => console.log("Password reset email sent"))
      .catch((error) => console.error(error));
    // Function to handle forgotten password
  }
</script>

<div class="main">
  <div class="content">
    <img class="logo" src="rnslogo.png" alt="RNS logo" />
    <!-- <form on:submit|preventDefault={forgotPassword}>
            <p>Please enter your email to reset your password</p>
            <input type="email" bind:value={email} placeholder="Enter your email" required />
            <div class="button-group">
                <button onclick="history.back()">Go Back</button>
                <button type="submit">Reset Password</button>
            </div>
        </form> -->
    <div class="div-5">
      <div class="column">
        <i
          class="fa-solid fa-unlock fa-shake fa-10x"
          style="color: #6ba3ab; --fa-animation-duration: 10s;"
        ></i>
      </div>
      <div class="column-2">
        <div class="div-6">
          <div class="div-7">
            Forgot
            <br />
            Your
            <span style="color: #ad2227">Password?</span>
          </div>
          <form on:submit|preventDefault={forgotPassword}>
            <div class="div-8">Provide us with your email for varication</div>
            <Textfield
              class="shaped-outlined"
              type="email"
              required
              variant="outlined"
              bind:value={email}
              label="Email"
            ></Textfield>
            <!-- <button class="div-10">Reset</button> -->
            <Button variant="raised">
              <Label>Reset</Label>
            </Button>
          </form>
          <div
            class="div-11"
            style="cursor: pointer;font-weight:bold;"
            onclick="history.back()"
          >
            Go back to
            <span style="text-decoration: underline; color: #ad2227;">
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  *
    :global(
      .shaped-outlined .mdc-notched-outline .mdc-notched-outline__leading
    ) {
    border-radius: 28px 0 0 28px;
    width: 28px;
  }
  *:global(
      .shaped-outlined .mdc-notched-outline .mdc-notched-outline__trailing
    ) {
    border-radius: 0 28px 28px 0;
  }
  * :global(.shaped-outlined .mdc-notched-outline .mdc-notched-outline__notch) {
    max-width: calc(100% - 28px * 2);
  }
  *:global(
      .shaped-outlined.mdc-text-field--with-leading-icon:not(
          .mdc-text-field--label-floating
        ).mdc-floating-label
    ) {
    left: 16px;
  }
  * :global(.shaped-outlined + .mdc-text-field-helper-line) {
    padding-left: 32px;
    padding-right: 28px;
  }
    :global(.shaped-outlined){
    width: 100%;
  }

  .main {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .div-5 {
    position: relative;
    border-radius: 10px;
    box-shadow: 6px 6px 10px 0px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(6.5px);
    background-color: rgba(255, 255, 255, 0.53);
    display: flex;
    align-content: center;
    width: 700px;
    max-width: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /* margin: 194px 107px 145px 0; */
    padding: 50px 60px;
  }
  i {
    text-shadow: 3px 1px 3px rgba(0, 0, 0, 0.73);
  }
  @media (max-width: 991px) {
    .div-5 {
      flex-direction: column;
      align-items: stretch;
      gap: 0px;
      padding: 50px 15px;
    }
    .fa-10x {
      font-size: 4em;
    }
  }
  .column {
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    flex-wrap: wrap;
    line-height: normal;
    width: 30%;
    margin-left: 0px;
  }
  @media (max-width: 991px) {
    .column {
      width: 100%;
    }
  }
  /* .img-2 {
    aspect-ratio: 0.91;
    object-fit: auto;
    object-position: center;
    width: 200px;
    fill: #000;
    filter: drop-shadow(6px 8px 9.4px rgba(0, 0, 0, 0.25));
    margin-top: 13px;
    max-width: 100%;
    flex-grow: 1;
  } */
  @media (max-width: 991px) {
    .logo {
      max-width: 41%;
    }
  }
  .column-2 {
    display: flex;
    flex-direction: column;
    line-height: normal;
    width: 70%;
    text-align: center;
    /* margin-left: 20px; */
  }
  @media (max-width: 991px) {
    .column-2 {
      width: 100%;
    }
  }
  .div-6 {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    color: #ad2227;
    font-weight: 400;
  }
  @media (max-width: 991px) {
    .div-6 {
      max-width: 100%;
      margin-top: 40px;
    }
  }
  .div-7 {
    font:
      40px Merriweather,
      sans-serif;
    font-weight: bold;
    color: #ad2227;
    /* text-shadow: 3px 1px 3px rgba(0, 0, 0, 0.73);
    text-shadow:
      -1px -1px 0 #000,  
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000; */
  }
  @media (max-width: 991px) {
    .div-7 {
      max-width: 100%;
      font-size: 27px;
    }
  }
  .div-8 {
    color: #868686;
    text-transform: capitalize;
    margin-top: 14px;
    font:
      16px Merriweather,
      sans-serif;
  }
  @media (max-width: 991px) {
    .div-8 {
      max-width: 100%;
      font-size: 13px;
    }
  }
  .div-11 {
    font-weight: bold;
    text-align: center;
    text-decoration-line: underline;
    align-self: center;
    margin-top: 8px;
    font:
      18px Merriweather,
      sans-serif;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: "Merriweather", sans-serif;
    font-size: large;
    max-width: 100%;
  }
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px;
  }
  /* p{
    font-family: 'Merriweather', sans-serif;
    font-size: larger;
  } */

  * :global(.mdc-button) {
    color: white;
    box-shadow: 6px 6px 10px 0px rgba(0, 0, 0, 0.25);
    font-family: "Merriweather", sans-serif;
    font-size: large;
    font-weight: bold;
    cursor: pointer;
    border-radius: 20px;
    width: 100%;
  }
</style>
