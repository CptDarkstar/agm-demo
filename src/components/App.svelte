<script>
    import VotingTopic from './VotingTopic.svelte';
  
    let topics = [
      { id:  1, title: 'Topic  1', yes:  0, no:  0, abstain:  0 },
      // ...more topics
    ];
  
    function handleVote(event) {
      const { detail } = event;
      const topicIndex = topics.findIndex(t => t.id === event.target.dataset.id);
      topics[topicIndex][detail.option]++;
    }
  </script>
  
  {#each topics as topic (topic.id)}
    <VotingTopic {topic} on:vote={handleVote} />
  {/each}