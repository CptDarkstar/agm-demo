<script>
  import { onMount } from "svelte";
  import Select, { Option } from "@smui/select";
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
  let options = ["None", "Yes", "No", "Abstain"];
  let option = "None";

  let users = [];
  let topics = [];

  onMount(async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
      await updateDoc(userDocRef, {
        proxies: arrayUnion(proxyData),
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
    {#each users as user}
      <Option value={user.id}>{user.displayName}</Option>
    {/each}
  </Select>

  <Select bind:value={topicId} label="Topic" hiddenInput input$name="user">
    <Option value="" />
    {#each topics as topic}
      <Option value={topic.id}>{topic.title}</Option>
    {/each}
  </Select>

  <Select bind:value={voteInstruction} label="Select Menu">
    {#each options as option}
      <Option value={option}>{option}</Option>
    {/each}
  </Select>

  <p>Shares: {proxyUserShares}</p>
  <button type="submit">Assign Proxy</button>
</form>
