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
  <div class="voting_button">
    <button class="mdc-button" on:click={() => castVote('yes')}>Yes</button>
    <Button on:click={() => castVote('yes')} variant="raised">
      <Label>Yes</Label>
    </Button>
    <button on:click={() => castVote('no')}>No</button>
    <button on:click={() => castVote('abstain')}>Abstain</button>
  </div>
</div>


<style>

  .voting_button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 30%;
  }

  .mdc-button {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    font-size: 20px;
    color: white;
    padding-top: 30px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 30px;
  }

</style>