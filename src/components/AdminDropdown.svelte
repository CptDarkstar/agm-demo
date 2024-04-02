<script>
  import { onMount } from "svelte";
  import { db } from "$lib/firebase/firebase";
  import axios from "axios";
  import Select, { Option } from "@smui/select";
  import Button, { Label } from "@smui/button";
  import {
    collection,
    getDocs,
    doc,
  } from "firebase/firestore";

  var users = [];
  var value = "";
  var received = undefined;

  onMount(async () => {
    const usersCollection = collection(db, "users");
    try {
      const querySnapshot = await getDocs(usersCollection);
      const userData = [];
      querySnapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      users = userData; // Update the users array
    } catch (error) {
      console.error("Error getting users collection: ", error);
    }
  });

  async function handleSubmit(e) { 
    e.preventDefault();
    received = e.currentTarget["user"].value;
    await axios.post(
        `https://agm-node-cptdarkstar.onrender.com/setCustomClaims/${value}`
      );
  }
</script>

<div class="margins">
  <form on:submit={handleSubmit}>
    <Select bind:value label="Make User Admin" hiddenInput input$name="user">
      <Option value="" />
      {#each users as user}
        <Option value={user.id}>{user.displayName}</Option>
      {/each}
    </Select>

    <Button type="submit">
      <Label>Make Admin</Label>
    </Button>
  </form>

</div>
