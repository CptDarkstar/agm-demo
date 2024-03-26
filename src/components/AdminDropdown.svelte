<script>
  import Select, { Option } from "@smui/select";
  import Button, { Label } from "@smui/button";

  var fruits = ["Apple", "Orange", "Banana", "Mango"];
  var value = "";
  var received = undefined;
  function handleSubmit(e) { 
    e.preventDefault();
    received = e.currentTarget["fruit"].value;
  }
</script>

<div class="margins">
  <form on:submit={handleSubmit}>
    <Select bind:value label="Fruit" hiddenInput input$name="fruit">
      <Option value="" />
      {#each fruits as fruit}
        <Option value={fruit}>{fruit}</Option>
      {/each}
    </Select>

    <Button type="submit">
      <Label>Submit</Label>
    </Button>
  </form>

  <div style="margin-top: 1em;">
    <pre class="status">Received: {received != null
        ? received
        : "Not submitted yet."}</pre>
  </div>
</div>
