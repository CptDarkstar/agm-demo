<script>
  import { auth } from "../../lib/firebase/firebase";
  import { authHandlers } from "../../store/store";
  import { goto } from "$app/navigation";
  import { MDCMenu } from "@material/menu";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import Textfield from "@smui/textfield";
  import AdminDropdown from "../../components/AdminDropdown.svelte";
  import EditTopic from "../../components/EditTopic.svelte";
  import { onMount } from "svelte";
  import { onAuthStateChanged } from "firebase/auth";
  import { db } from "../../lib/firebase/firebase"; //Firebase configuration file
  import {
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    query,
    orderBy,
    limit,
  } from "firebase/firestore";
  import FileSaver from "file-saver";

  const { saveAs } = FileSaver;

  let menu = false;
  let clicked = "nothing yet";
  let isAdmin;
  let topics = [];
  let panelOpen = false;
  let open = false;
  let checked1 = false;
  let topicTitle = "";
  let topicDescription = "";

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          isAdmin = idTokenResult.claims.admin;
          /* console.log("Admin Page"); */
        });
      }
    });
  });

  //Menu
  const handleShareHoldersAction = () => {
    clicked = "Share Holders";
    goto("/shareholders");
  };

  const handleVotingAction = () => {
    clicked = "Voting";
    goto("/admin");
  };

  function openMDCMenu(selector) {
    const menuElement = document.querySelector(selector);
    const menu = new MDCMenu(menuElement);

    const button = document.getElementById("menu-button");
    button.addEventListener("click", () => {
      menu.open = !menu.open;
    });
  }
  // Fetch initial topics from the database
  onMount(async () => {
    const topicsCollection = collection(db, "Topics");
    const topicsSnapshot = await getDocs(topicsCollection);
    topics = topicsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  async function addNewTopic() {
    try {
      // Step 1: Get the last Topic ID
      const topicsRef = collection(db, "Topics");
      const lastTopicQuery = query(
        topicsRef,
        orderBy("__name__", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(lastTopicQuery);

      let lastTopicId = 0;

      if (!querySnapshot.empty) {
        const lastTopicDoc = querySnapshot.docs[0];
        const lastTopicIdString = lastTopicDoc.id;
        lastTopicId = parseInt(lastTopicIdString.split(" ")[1]);
      }

      // Step 2: Generate the new Topic ID
      const newTopicId = `Topic ${lastTopicId + 1}`;

      // Step 3: Add the new topic document with the new ID
      const newTopicRef = doc(topicsRef, newTopicId);
      await setDoc(newTopicRef, {
        title: topicTitle,
        description: topicDescription,
        enabled: false, // Set enabled to false by default
      });

      console.log("New topic added successfully with ID:", newTopicId);
    } catch (error) {
      console.error("Error adding new topic: ", error);
    }
  }

  // Function to download all documents as CSV
  async function downloadAllCSV() {
    try {
      const querySnapshot = await getDocs(collection(db, "Votes"));
      let csv =
        "topicId,yesPercentage,yesShares,noPercentage,noShares,abstainPercentage,abstainShares,totalSharesVoted\n";

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        csv += `${data.topicId},${data.yesPercentage},${data.yesShares},${data.noPercentage},${data.noShares},${data.abstainPercentage},${data.abstainShares},${data.totalSharesVoted}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "all_votes.csv");
    } catch (error) {
      console.error("Error downloading all CSV:", error);
    }
  }
</script>

<div class="maincontainer">
  <header data-role="Header" class="agm-voting-header">
    <a href="/dashboard">
      <img alt="logo" src="rnslogo.png" class="agm-voting-image logo" />
    </a>
    <div class="agm-voting-btn-group">
      <div id="demo-menu" class="mdc-menu-surface--anchor">
        <button
          id="menu-button"
          class="mdc-button mdc-button--raised"
          on:action={openMDCMenu(".mdc-menu")}>Menu</button
        >
        <div class="mdc-menu mdc-menu-surface">
          <ul
            class="mdc-deprecated-list"
            role="menu"
            aria-hidden="true"
            aria-orientation="vertical"
            tabindex="-1"
            bind:this={menu}
          >
            <a href="/shareholders">
              <li
                class="mdc-deprecated-list-item"
                role="menuitem"
                on:SMUI:action={handleShareHoldersAction}
              >
                <span class="mdc-deprecated-list-item__ripple"></span>
                <span class="mdc-deprecated-list-item__text">Share Holders</span
                >
              </li>
            </a>
            <a href="/admin">
              <li class="mdc-deprecated-list-item" role="menuitem">
                <span class="mdc-deprecated-list-item__ripple"></span>
                <span class="mdc-deprecated-list-item__text">Voting</span>
              </li>
            </a>
          </ul>
        </div>
      </div>
      <button
        class="mdc-button mdc-button--raised"
        on:click={authHandlers.logOut}
      >
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">Log out</span>
      </button>
    </div>
  </header>
  <div class="AdminDropdown">
    <AdminDropdown />
  </div>
  <div class="Topics">
    <EditTopic />
    <button class="mdc-button add_new" on:click={() => (open = true)}
      >Add New</button
    >
    <button class="mdc-button add_new" on:click={downloadAllCSV}>Export All</button>
  </div>

  <Dialog
    bind:open
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
  >
    <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
    <Title id="simple-title">Add New Topic</Title>
    <Content id="simple-content">
      <Textfield bind:value={topicTitle} label="Title" />
      <Textfield bind:value={topicDescription} label="Discription" />
    </Content>
    <Actions>
      <Button on:click={addNewTopic}>
        <Label>Add</Label>
      </Button>
      <Button on:click={() => (open = false)}>
        <Label>Cancel</Label>
      </Button>
    </Actions>
  </Dialog>
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  .mdc-button {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    font-size: 30px;
    color: white;
    padding-top: 30px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 30px;
  }
  * :global(.mdc-button):hover {
    background: #595959;
  }
  .mdc-menu-surface {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    top: 63px;
  }
  .mdc-deprecated-list-item:hover {
    background: #595959;
  }
  .mdc-deprecated-list-item__text {
    font-size: 30px;
    color: white;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
  }
  a {
    text-decoration: none;
  }
  .agm-voting-header {
    width: 100%;
    height: auto;
    display: flex;
    max-width: 1400px;
    min-width: 1400px;
    align-self: center;
    align-items: center;
    justify-content: space-between;
  }
  .agm-voting-btn-group {
    width: auto;
    height: auto;
    display: flex;
    align-items: center;
    border-radius: 4px;
    flex-direction: row;
    justify-content: space-between;
    gap: 30px;
  }
  .Topics {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 5px;
    border: 2px;
    border-style: solid;
    border-radius: 5px;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
  }
  .add_new {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
    font-size: 20px;
    color: white;
    padding-top: 30px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 30px;
    min-width: 60%;
  }
  @media (max-width: 720px) {
    .agm-voting-header {
      max-width: 100%;
      min-width: 100%;
    }
    .logo {
      width: 100px;
    }
  }
  @media (max-width: 430px) {
    .agm-voting-header {
      max-width: 100%;
      min-width: 100%;
    }
    .logo {
      width: 165px;
    }
    .agm-voting-btn-group {
      width: 65%;
      height: auto;
      display: flex;
      align-items: center;
      border-radius: 4px;
      flex-direction: row;
      justify-content: flex-end;
      gap: 10px;
    }
    * :global(.mdc-button) {
      font-size: 10px;
      padding-top: 2px;
      padding-left: 2px;
      padding-right: 2px;
      padding-bottom: 2px;
    }
    * :global(.mdc-deprecated-list-item__text) {
      font-size: 15px;
      padding-top: 0px;
      padding-left: 0px;
      border-radius: 0px;
      padding-right: 0px;
      padding-bottom: 0px;
    }
  }
</style>
