<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { db } from './lib/firebase/firebase'; //Firebase configuration file
  import { collection, getDocs, addDoc } from 'firebase/firestore';
  import VotingTopic from './components/VotingTopic.svelte';
  import Accordion, { Panel, Header, Content } from '@smui-extra/accordion';
  import IconButton, { Icon } from '@smui/icon-button';

  let topics = [];
  let panelOpen = false;

  // Fetch initial topics from the database
  onMount(async () => {
    const topicsCollection = collection(db, 'Topics');
    const topicsSnapshot = await getDocs(topicsCollection);
    topics = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  // Function to handle vote submission
  async function handleVote(event) {
    const { detail: { topicId, option } } = event;
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    // Update local vote counts
    topic[option]++;

    // Write vote to Firebase
    try {
      await addDoc(collection(db, 'Votes'), { topicId, option });
    } catch (error) {
      console.error("Error writing vote to Firebase", error);
    }
  }
</script>

<!-- {#each topics as topic (topic.id)}
  <VotingTopic {topic} on:vote={handleVote} />
{/each} -->

<div class="accordion-container">
  <Accordion multiple>
    {#each topics as topic (topic.id)}
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
    {/each}
  </Accordion>
</div>