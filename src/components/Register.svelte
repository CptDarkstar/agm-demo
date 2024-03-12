<script>
  import { createUserWithEmailAndPassword } from "firebase/auth";
  import { auth, db } from "../lib/firebase/firebase"; // Assuming you have a db export in your firebase.js
  import { collection, doc, setDoc } from "firebase/firestore";
  import MenuSurface from "@smui/menu-surface";
  import Textfield from "@smui/textfield";
  import Button from "@smui/button";
  import axios from "axios";

  let surface = MenuSurface;
  let name = "";
  let email = "";
  let displayName = "";
  let password = ""; // Variable for password
  let shares = 0;
  let error = false;

  async function register() {
    try {
      // Create the user without signing them in
      /* const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      ); */

      // Save user details including shares to Firestore
      const userRef = doc(db, "user", userCredential.user.uid);
      await setDoc(userRef, {
        email,
        displayName,
        shares,
      });

      // Optionally, you can sign out the user immediately after creating the account
      // auth.signOut(); // Uncomment this line if you want to force sign out

      // Redirect to a success page or home page
      // goto('/success'); // Comment out or remove this line if you don't want to redirect
    } catch (err) {
      console.error("Error registering user: ", err);
      error = true;
      // Handle error, e.g., display a message to the user
    }
  }

  async function createUser(userData) {
    console.log(userData);
    try {
      const response = await axios.post(
        //"https://agm-node-cptdarkstar.onrender.com/createUser",
        "https://agm-node-cptdarkstar.onrender.com/createUser",
        userData
      );
      console.log(response.data); // Log the response from the backend
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // Call createUser function with user data
  // createUser({
  //   email,
  //   displayName,
  //   password,
  //   shares,
  // });
</script>

{#if error}
  <p class="error">
    The information you have entered is not valid. Please contact RNS.
  </p>
{/if}

<div style="min-width: 100px;">
  <Button on:click={() => surface.setOpen(true)}>Add Share Holder</Button>
  <MenuSurface bind:this={surface} anchorCorner="BOTTOM_LEFT">
    <form on:submit|preventDefault={() => createUser({ email, displayName, password, shares })}>
      <div
        style="margin: 1em; display: flex; flex-direction: column; align-items: flex-end;"
      >
        <!-- <label>
          Email:
          <input type="email" bind:value={email} required />
        </label> -->
        <Textfield bind:value={displayName} label="Name" required />
        <!-- <label>
          Name:
          <input type="text" bind:value={displayName} required />
        </label> -->
        <Textfield bind:value={email} label="Email" required />
        <!-- <label>
          Password:
          <input type="password" bind:value={password} required />
        </label> -->
        <Textfield
          type="password"
          bind:value={password}
          label="Password"
          required
        />
        <!-- <label>
          Shares:
          <input type="number" bind:value={shares} required />
        </label> -->
        <Textfield type="number" bind:value={shares} label="Shares" />
        <!-- <button type="submit">Register</button> -->
        <Button style="margin-top: 1em;" type="submit">Register</Button>
        <Button
          style="margin-top: 1em;"
          on:click={() => surface.setOpen(false)}
        >
          Close
        </Button>
      </div>
    </form>
  </MenuSurface>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
</style>
