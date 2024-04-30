<!-- <script>
  import { createEventDispatcher } from "svelte";
  import Button, { Label } from "@smui/button";
  import Switch from "@smui/switch";
  import FormField from "@smui/form-field";

  const dispatch = createEventDispatcher();

  export let topic;
  let checked1 = false;
</script>

<div>
  <h2>{topic.title}</h2>
  <p>{topic.description}</p>
  <div class="action_buttons">
    <div>
      <FormField>
        <Switch bind:checked={checked1} />
        <span slot="label"
          >{#if checked1}
            Active
          {:else}
            Inactive
          {/if}</span
        >
      </FormField>
    </div>
    <button class="mdc-button" on:click={() => "no"}>Edit</button>
    <button class="mdc-button" on:click={() => "abstain"}>Delete</button>
  </div>
</div>

<style>
  .action_buttons {
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
 -->