<script>
  import { ref, listAll, getDownloadURL } from "firebase/storage";
  import { storage, db } from "$lib/firebase/firebase"; // Firebase config
  import { collection, addDoc } from "firebase/firestore";
  import Textfield from "@smui/textfield";
  import JSZip from "jszip";
  import FileSaver from "file-saver"; // for downloading the ZIP
  const { saveAs } = FileSaver;

  let name = "";
  let files = [];
  const currentYear = new Date().getFullYear();
  const folderPath = "RNS AGM 2024";

  // Function to fetch documents from Firebase Storage
  async function fetchDocuments() {
    const storageRef = ref(storage, folderPath);

    try {
      const result = await listAll(storageRef);
      files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { name: itemRef.name, url };
        })
      );
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }

  // Fetch documents on mount
  fetchDocuments();

  // Function to download all files as a ZIP
  async function handleDownload() {
    if (name.trim() === "") {
      alert("Please enter your name and surname before downloading.");
      return;
    }

    // Save the name and timestamp to Firestore
    try {
      await addDoc(collection(db, "downloaded"), {
        name: name,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving user info to Firestore:", error);
    }

    // Create a new ZIP file using JSZip
    const zip = new JSZip();

    // Fetch and add each file to the ZIP
    try {
      for (const file of files) {
        const response = await fetch(file.url); // Fetch the file data
        const blob = await response.blob(); // Convert to blob
        zip.file(file.name, blob); // Add file to the ZIP
      }

      // Generate the ZIP file and trigger download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `AGM_Documents_${currentYear}.zip`); // Download the ZIP file
    } catch (error) {
      console.error("Error creating ZIP:", error);
    }
  }
</script>

<div class="maincontainer">
  <header data-role="Header" class="agm-voting-header">
    <img alt="logo" src="rnslogo.png" class="agm-voting-image logo" />
  </header>

  <div class="download">
    <h1>AGM {currentYear} Documents</h1>
    <span>
      Please enter your name and surname below and click download to receive the
      compiled document pack for the {currentYear} AGM.
    </span>

    <Textfield bind:value={name} label="Name & Surname" />

    <button class="mdc-button mdc-button--raised" on:click={handleDownload}>
      <span class="mdc-button__ripple"></span>
      <span class="mdc-button__focus-ring"></span>
      <span class="mdc-button__label">Download</span>
    </button>

    <div class="file-list">
      <h3>Files to download:</h3>
      <ul>
        {#each files as file}
          <li>{file.name}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .download {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .file-list {
    margin-top: 20px;
  }
</style>