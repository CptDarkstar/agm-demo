<script>
    export let results = [];
  </script>
  
  <section>
    <h2>Voting Results</h2>
    <ul>
      {#each results as result (result.id)}
        <li>
          <strong>{result.title}:</strong>
          Yes: {result.yes}, No: {result.no}, Abstain: {result.abstain}
        </li>
      {/each}
    </ul>
  </section>