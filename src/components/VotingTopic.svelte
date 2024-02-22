<script>
  import { createEventDispatcher } from 'svelte';
  import Button, { Label } from '@smui/button';

  const dispatch = createEventDispatcher();

  export let topic;

  function castVote(option) {
    dispatch('vote', { topicId: topic.id, option });
  }
</script>

<div>
  <h2>{topic.title}</h2>
  <p>{topic.description}</p>
  <div class="voting_buttons">
    <button class="mdc-button" on:click={() => castVote('yes')}>Yes</button>
    <!-- <Button on:click={() => castVote('yes')} variant="raised">
      <Label>Yes</Label>
    </Button> -->
    <button class="mdc-button" on:click={() => castVote('no')}>No</button>
    <button class="mdc-button" on:click={() => castVote('abstain')}>Abstain</button>
  </div>
</div>


<style>

  .voting_buttons {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 30%;
    gap: 1px;
  }

  .mdc-button {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    color: white;
    width: 100%;
  }

</style>