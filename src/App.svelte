<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { db } from './lib/firebase/firebase'; //Firebase configuration file
  import { collection, getDocs, addDoc } from 'firebase/firestore';
  import VotingTopic from './components/VotingTopic.svelte';

  let topics = [];

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

{#each topics as topic (topic.id)}
  <VotingTopic {topic} on:vote={handleVote} />
{/each}
