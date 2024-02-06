<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
  
    let selectedOption = '';
  
    function selectOption(option) {
      selectedOption = option;
      dispatch('vote', { option });
    }
  </script>
  
  <div class="topic">
    <h2><!-- {topicTitle} --> Test</h2>
    <div class="options">
      <button on:click={() => selectOption('yes')}>Yes</button>
      <button on:click={() => selectOption('no')}>No</button>
      <button on:click={() => selectOption('abstain')}>Abstain</button>
    </div>
  </div>