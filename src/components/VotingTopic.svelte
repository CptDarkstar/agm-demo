<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { onAuthStateChanged } from "firebase/auth";
  import { auth, db } from "$lib/firebase/firebase"; //Firebase configuration file
  import Button, { Label } from "@smui/button";
  import Switch from "@smui/switch";
  import FormField from "@smui/form-field";

  const dispatch = createEventDispatcher();

  let isAdmin = false;
  let checked1 = false;

  export let topic;

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

  function castVote(option) {
    dispatch("vote", { topicId: topic.id, option });
  }
</script>

<div>
  <h2>{topic.title}</h2>
  <p>{topic.description}</p>
  <div class="voting_buttons">
    {#if isAdmin}
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
    {:else}
      <button class="mdc-button" on:click={() => castVote("yes")}>Yes</button>
      <button class="mdc-button" on:click={() => castVote("no")}>No</button>
      <button class="mdc-button" on:click={() => castVote("abstain")}>Abstain</button>
    {/if}
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
