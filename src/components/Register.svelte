<script>
  import { createUserWithEmailAndPassword } from "firebase/auth";
  import { auth, db } from "../lib/firebase/firebase"; // Assuming you have a db export in your firebase.js
  import { collection, doc, setDoc } from "firebase/firestore";

  let email = "";
  let displayName = "";
  let password = ""; // Variable for password
  let shares = 0;
  let error = false;

  async function register() {
    try {
      // Create the user without signing them in
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

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
</script>

{#if error}
  <p class="error">
    The information you have entered is not valid. Please contact RNS.
  </p>
{/if}

<form on:submit|preventDefault={register}>
  <label>
    Email:
    <input type="email" bind:value={email} required />
  </label>
  <label>
    Name:
    <input type="text" bind:value={displayName} required />
  </label>
  <label>
    Password:
    <input type="password" bind:value={password} required />
    <!-- Add password input -->
  </label>
  <label>
    Shares:
    <input type="number" bind:value={shares} required />
  </label>
  <button type="submit">Register</button>
</form>
