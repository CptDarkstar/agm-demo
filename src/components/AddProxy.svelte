<script>
  import { onMount } from "svelte";
  import Select, { Option } from "@smui/select";
  import { db } from "$lib/firebase/firebase";
  import { collection, getDocs, doc } from "firebase/firestore";
  import selectedUser from "./EditUser.svelte";

  export let principalId;
  let proxyUserId = "";
  let topicId = "";
  let voteInstruction = "";
  let options = ['None', 'Yes', 'No', 'Abstain'];
  let option = 'None';


  var users = [];
  var topics = [];

  onMount(async () => {
    const usersCollection = collection(db, "users"); // Get user data for dropdown
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
    const Topics = collection(db, "Topics"); // Get Topic data for dropdown
    try {
      const querySnapshot = await getDocs(Topics);
      const topicData = [];
      querySnapshot.forEach((doc) => {
        topicData.push({ id: doc.id, ...doc.data() });
      });
      topics = topicData; // Update the topics array
    } catch (error) {
      console.error("Error getting topics collection: ", error);
    }
  });

  const createProxy = async () => {
    console.log(
      "principalId =",
      principalId,
      "proxyUserId =",
      proxyUserId,
      "topicId =",
      topicId,
      "voteInstruction =",
      voteInstruction
    );
    await collection("proxies").add({
      principalId,
      proxyUserId,
      topicId,
      voteInstruction,
    });
  };
</script>

<form on:submit|preventDefault={createProxy}>
  <input type="hidden" bind:value={principalId} />
  <!-- <button on:click={() => (console.log(voteInstruction))}>check topic data</button> -->
  <Select
    bind:value={proxyUserId} label="Select User" hiddenInput input$name="user">
    <Option value="" />
    {#each users as user}
      <Option value={user.id}>{user.displayName}</Option>
    {/each}
  </Select>
  
  <Select bind:value={topicId} label="Topic" hiddenInput input$name="user">
    <Option value="" />
    {#each topics as topic}
      <Option value={topic.id}>{topic.id}</Option>
    {/each}
  </Select>

  <Select bind:value={voteInstruction} label="Select Menu">
    {#each options as option}
      <Option value={option}>{option}</Option>
    {/each}
  </Select>
  <button type="submit">Assign Proxy</button>
</form>
