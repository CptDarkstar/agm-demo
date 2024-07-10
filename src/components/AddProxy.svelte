<script>
  import { onMount } from "svelte";
  import Select, { Option } from "@smui/select";
  import { db } from "$lib/firebase/firebase";
  import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
  import selectedUser from "./EditUser.svelte";
  import selectedUserName from "./EditUser.svelte";

  export let principalId;
  export let principalName;
  let proxyUserId = "";
  let proxyUserName = "";
  let topicId = "";
  let voteInstruction = "";
  let options = ["None", "Yes", "No", "Abstain"];
  let option = "None";

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

  // Function to get user name based on user ID
  $: proxyUserId, (proxyUserName = getUserName(proxyUserId));

  function getUserName(userId) {
    const user = users.find((user) => user.id == userId);
    return user ? user.displayName : "";
  }

  const createProxy = async () => {
    console.log(
      "principalId =",
      principalId,
      "principalName =",
      principalName,
      "proxyUserId =",
      proxyUserId,
      "proxyUserName =",
      proxyUserName,
      "topicId =",
      topicId,
      "voteInstruction =",
      voteInstruction
    );
    try {
      await addDoc(collection(db, "proxies"), {
        principalId,
        principalName,
        proxyUserId,
        proxyUserName,
        topicId,
        voteInstruction,
      });
      console.log("Document successfully written!");
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };
</script>

<form on:submit|preventDefault={createProxy}>
  <input type="hidden" bind:value={principalId} />
  <input type="hidden" bind:value={principalName} />
  <!-- <button on:click={() => (console.log(voteInstruction))}>check topic data</button> -->
  <Select
    bind:value={proxyUserId}
    label="Select User"
    hiddenInput
    input$name="user"
  >
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
