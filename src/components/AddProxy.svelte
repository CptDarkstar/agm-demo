<script>
  import { onMount } from "svelte";
  import Select, { Option } from "@smui/select";
  import axios from "axios";
  import { db } from "$lib/firebase/firebase";
  import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    arrayUnion,
    getDoc,
  } from "firebase/firestore";
  import { v4 as uuidv4 } from "uuid";

  export let principalId;
  export let principalName;
  let proxyUserId = "";
  let proxyUserName = "";
  let proxyUserShares = 0;
  let topicId = "";
  let voteInstruction = "";
  let options = ["None", "yes", "no", "abstain"];
  let option = "None";
  let none = "None"

  let users = [];
  let sortedUsers = [];
  let topics = [];

  onMount(async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Sort users alphabetically by displayName
        sortedUsers = users.slice().sort((a, b) => a.agency.localeCompare(b.agency));

      const topicsCollection = collection(db, "Topics");
      const topicsSnapshot = await getDocs(topicsCollection);
      topics = topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  });

  $: {
    const selectedProxyUser = users.find((user) => user.id === proxyUserId);
    proxyUserShares = selectedProxyUser ? selectedProxyUser.shares : 0;
    proxyUserName = selectedProxyUser ? selectedProxyUser.displayName : "";
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
      "proxyUserShares =",
      proxyUserShares,
      "topicId =",
      topicId,
      "voteInstruction =",
      voteInstruction
    );
    const userDocRef = doc(db, "users", principalId);
    const userDoc = await getDoc(userDocRef);
    try {
      const proxyID = uuidv4(); // Generate a unique ID using uuid

      const proxyData = {
        proxyID: proxyID,
        principalId: principalId,
        principalName: principalName,
        proxyUserId: proxyUserId,
        proxyUserName: proxyUserName,
        proxyUserShares: proxyUserShares,
        topicId: topicId,
        voteInstruction: voteInstruction,
      };

      const userDocRef = doc(db, "users", principalId);
      const proxyUser = doc(db, "users", proxyUserId);

      await axios.post(
        `https://agm-node-cptdarkstar.onrender.com/disableUser/${proxyUserId}`
      );
      await updateDoc(userDocRef, {
        proxies: arrayUnion(proxyData),
      });
      await updateDoc(proxyUser, {
        proxyTo: principalName,
      });

      console.log("Document successfully written with Proxy ID:", proxyID);
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };
</script>

<form on:submit|preventDefault={createProxy}>
  <input type="hidden" bind:value={principalId} />
  <input type="hidden" bind:value={principalName} />

  <Select
    bind:value={proxyUserId}
    label="Select User"
    hiddenInput
    input$name="user"
  >
    <Option value="" />
    {#each sortedUsers as user}
      <Option value={user.id}>{user.agency}</Option>
    {/each}
  </Select>

  <Select bind:value={topicId} label="Topic" hiddenInput input$name="user">
    <Option value="None">None</Option>
    {#each topics as topic}
      <Option value={topic.id}>{topic.title}</Option>
      {/each}
  </Select>

  <Select bind:value={voteInstruction} label="Vote Instruction">
    {#each options as option}
      <Option value={option}>{option}</Option>
    {/each}
  </Select>

  <p>Shares: {proxyUserShares}</p>
  <button type="submit">Assign Proxy</button>
</form>
