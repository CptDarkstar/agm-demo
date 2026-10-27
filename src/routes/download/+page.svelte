<script>
  import { db } from "$lib/firebase/firebase"; // Firebase config
  import { collection, addDoc } from "firebase/firestore";
  import JSZip from "jszip";
  import FileSaver from "file-saver"; // for downloading the ZIP
  import logo from "../../public/rnslogo.png";
  const { saveAs } = FileSaver;

  let name = "";
  let nameErr = "";
  let downloadErr = "";
  let loading = false;
  let done = false;
  const currentYear = new Date().getFullYear();

  // PDFs served from static/agm-docs/ (available at /agm-docs/<name>).
  // `name` is the real file name (used inside the ZIP), `title` is the label shown on the page.
  // Demo: sample placeholder PDFs, not the real RNS AGM documents.
  const fileList = [
    { name: "1.Sample Chairman's Cover Letter.pdf", title: "Sample Chairman's Cover Letter" },
    { name: "2.Sample RSVP Notice.pdf", title: "Sample RSVP Notice" },
    { name: "3.Sample Agenda.pdf", title: "Sample Agenda" },
    { name: "4.Sample Director Nomination.pdf", title: "Sample Director Nomination" },
    { name: "5.Sample Notice of AGM.pdf", title: "Sample Notice of AGM" },
    { name: "6.Sample Proxy Form.pdf", title: "Sample Proxy Form" },
    { name: "7.Sample Chairman's Report.pdf", title: "Sample Chairman's Report" },
    { name: "8.Sample Financial Statements.pdf", title: "Sample Financial Statements" },
  ];
  const files = fileList.map((f, i) => ({
    ...f,
    n: String(i + 1).padStart(2, "0"),
    url: `/agm-docs/${f.name}`,
  }));

  // Function to download all files as a ZIP
  async function handleDownload() {
    const trimmed = name.trim();
    if (trimmed.split(/\s+/).length < 2) {
      nameErr = trimmed
        ? "Please include your surname."
        : "Enter your name and surname.";
      return;
    }
    nameErr = "";
    downloadErr = "";
    loading = true;

    // Save the name and timestamp to Firestore
    try {
      await addDoc(collection(db, "downloaded"), {
        name: trimmed,
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
        // encodeURI handles the spaces/parentheses in the file names
        const response = await fetch(encodeURI(file.url));
        if (!response.ok) {
          throw new Error(`Could not load ${file.name} (${response.status})`);
        }
        const blob = await response.blob();
        zip.file(file.name, blob);
      }

      // Generate the ZIP file and trigger download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `AGM_Documents_${currentYear}.zip`);
      done = true;
    } catch (error) {
      console.error("Error creating ZIP:", error);
      downloadErr = "Something went wrong preparing your pack. Please try again.";
    } finally {
      loading = false;
    }
  }

  function retry() {
    done = false;
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="page">
  <div class="photo"></div>
  <div class="overlay"></div>

  <div class="top">
    <div class="brand">
      <img src={logo} alt="RNS Home Loans" />
      <span>AGM {currentYear} Documents</span>
    </div>
  </div>

  <main>
    <div class="card">
      <div class="intro">
        <div class="chip">
          <span>Document pack</span><span class="dot">·</span><span>AGM {currentYear}</span>
        </div>
        <h1>Your AGM documents.</h1>
        <p>
          Enter your name and surname to download the full {currentYear} AGM
          document pack as one file.
        </p>
      </div>

      {#if !done}
        <form on:submit|preventDefault={handleDownload} novalidate>
          <label>
            <span class="sr-only">Name and surname</span>
            <input
              type="text"
              autocomplete="name"
              placeholder="Name & surname"
              bind:value={name}
              on:input={() => (nameErr = "")}
              disabled={loading}
              class:invalid={nameErr}
            />
            {#if nameErr}<span class="err">{nameErr}</span>{/if}
          </label>
          {#if downloadErr}<span class="err" role="alert">{downloadErr}</span>{/if}
          <button type="submit" disabled={loading}>
            {#if loading}<span class="spinner"></span>{/if}
            <span>{loading ? "Preparing your pack…" : "Download document pack"}</span>
          </button>
        </form>
      {:else}
        <div class="success" role="status">
          <span class="tick">✓</span>
          <div class="success-text">
            <span class="success-title">Download started</span>
            <span class="success-sub">
              Thanks, {name.trim()}. Nothing downloading?
              <a href="#retry" on:click|preventDefault={retry}>Try again</a>
            </span>
          </div>
        </div>
      {/if}

      <div class="list">
        <div class="list-head">
          <span>Included in the pack</span>
          <span>{files.length} files · PDF</span>
        </div>
        <ol>
          {#each files as f}
            <li>
              <span class="num">{f.n}</span>
              <span class="title">{f.title}</span>
              <span class="badge">PDF</span>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </main>
</div>

<style>
  .page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: #0f3a40;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: clamp(12px, 3vw, 40px);
    font-family: Geist, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #fff;
  }

  .photo {
    position: absolute;
    inset: 0;
    background: url("../../public/background.png") 18% 100% / cover no-repeat;
    filter: saturate(0.7);
  }

  .overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        100deg,
        rgba(15, 58, 64, 0) 28%,
        rgba(15, 58, 64, 0.55) 60%,
        rgba(10, 35, 39, 0.88) 100%
      ),
      linear-gradient(0deg, rgba(10, 35, 39, 0.55) 0%, rgba(10, 35, 39, 0) 45%);
  }

  .top {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 22px 12px 14px;
    background: rgba(255, 255, 255, 0.72);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-radius: 18px;
  }

  .brand img {
    width: 88px;
    height: auto;
  }

  .brand span {
    font: 600 16px Geist, sans-serif;
    color: #0e1f23;
  }

  main {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 24px;
  }

  .card {
    width: min(480px, 100%);
    border-radius: 24px;
    background: rgba(12, 44, 49, 0.42);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    padding: clamp(24px, 4vw, 40px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chip {
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    font: 500 12px Geist, sans-serif;
  }

  .dot {
    opacity: 0.6;
  }

  h1 {
    margin: 8px 0 0;
    font: 600 clamp(30px, 4vw, 40px) / 1.05 Geist, sans-serif;
    letter-spacing: -0.035em;
  }

  p {
    margin: 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.5;
    text-wrap: pretty;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  input {
    height: 52px;
    padding: 0 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.94);
    font: 15px Geist, sans-serif;
    color: #0e1f23;
    outline: none;
    box-sizing: border-box;
  }

  input::placeholder {
    color: #7d8b8e;
  }

  input:focus {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35);
  }

  input.invalid {
    border-color: rgba(255, 120, 128, 0.95);
  }

  .err {
    font-size: 13px;
    color: #ffd4d6;
  }

  button {
    height: 52px;
    border: 0;
    border-radius: 12px;
    background: #fff;
    color: #0f3a40;
    font: 600 15px Geist, sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  button:hover:not(:disabled) {
    background: #e7f1f2;
  }

  button:disabled {
    cursor: default;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(15, 58, 64, 0.25);
    border-top-color: #0f3a40;
    animation: rns-spin 0.8s linear infinite;
  }

  @keyframes rns-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .success {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
  }

  .tick {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fff;
    color: #0f3a40;
    display: grid;
    place-items: center;
    font-weight: 700;
  }

  .success-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .success-title {
    font-size: 15px;
    font-weight: 600;
  }

  .success-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .success-sub a {
    color: #fff;
  }

  .success-sub a:hover {
    color: #cfe6e9;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .list-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font: 500 11px "Geist Mono", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  li {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  }

  .num {
    font: 500 12px "Geist Mono", monospace;
    color: rgba(255, 255, 255, 0.65);
  }

  .title {
    font-size: 14px;
    line-height: 1.35;
    text-wrap: pretty;
  }

  .badge {
    font: 500 10px "Geist Mono", monospace;
    letter-spacing: 0.06em;
    padding: 3px 6px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.85);
  }
</style>
