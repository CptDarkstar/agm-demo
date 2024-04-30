<script>
  import { onMount } from "svelte";
  import { auth, db } from "$lib/firebase/firebase"; //Firebase configuration file
  import { collection, getDocs, addDoc } from "firebase/firestore";
  import { onAuthStateChanged } from "firebase/auth";
  import VotingTopic from "./VotingTopic.svelte";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import IconButton, { Icon } from "@smui/icon-button";
  import Button, { Label } from "@smui/button";
  import Switch from "@smui/switch";
  import FormField from "@smui/form-field";

  let topics = [];
  let panelOpen = false;
  let isAdmin = false;
  let checked1 = false;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          isAdmin = idTokenResult.claims.admin;
          /* console.log(isAdmin); */
        });
      }
    });
  });

  // Fetch initial topics from the database
  onMount(async () => {
    const topicsCollection = collection(db, "Topics");
    const topicsSnapshot = await getDocs(topicsCollection);
    topics = topicsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  // Function to handle vote submission
  async function handleVote(event) {
    const {
      detail: { topicId, option },
    } = event;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    // Update local vote counts
    topic[option]++;

    // Write vote to Firebase
    try {
      await addDoc(collection(db, "Votes"), { topicId, option });
    } catch (error) {
      console.error("Error writing vote to Firebase", error);
    }
  }
</script>

<div class="accordion-container">
  <Accordion multiple>
    {#each topics as topic (topic.id)}
      {#if isAdmin}
        <Panel>
          <Header>
            {topic.title}
            <IconButton slot="icon" toggle pressed={panelOpen}>
              <Icon class="material-icons" on>expand_less</Icon>
              <Icon class="material-icons">expand_more</Icon>
            </IconButton>
          </Header>
          <Content><VotingTopic {topic} on:vote={handleVote} /></Content>
        </Panel>
      {:else}
        <Panel disabled>
          <Header>
            {topic.title}
            <IconButton slot="icon" toggle pressed={panelOpen}>
              <Icon class="material-icons" on>expand_less</Icon>
              <Icon class="material-icons">expand_more</Icon>
            </IconButton>
          </Header>
          <Content><VotingTopic {topic} on:vote={handleVote} /></Content>
        </Panel>
      {/if}
    {/each}
  </Accordion>
</div>