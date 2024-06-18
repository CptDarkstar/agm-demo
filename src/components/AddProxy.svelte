<script>
    import { db } from "$lib/firebase/firebase";
    let principalId = '';
    let proxyUserId = '';
    let topicId = '';
    let voteInstruction = '';
  
    const createProxy = async () => {
      await db.collection('proxies').add({
        principalId,
        proxyUserId,
        topicId,
        voteInstruction
      });
    };
  </script>
  
  <form on:submit|preventDefault={createProxy}>
    <input type="text" bind:value={principalId} placeholder="Principal User ID" />
    <input type="text" bind:value={proxyUserId} placeholder="Proxy User ID" />
    <input type="text" bind:value={topicId} placeholder="Topic ID" />
    <input type="text" bind:value={voteInstruction} placeholder="Vote Instruction (optional)" />
    <button type="submit">Assign Proxy</button>
  </form>
  