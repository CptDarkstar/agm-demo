<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let topic;

  function castVote(option) {
    dispatch('vote', { topicId: topic.id, option });
  }
</script>

<div>
  <h2>{topic.title}</h2>
  <button on:click={() => castVote('yes')}>Yes</button>
  <button on:click={() => castVote('no')}>No</button>
  <button on:click={() => castVote('abstain')}>Abstain</button>
</div>