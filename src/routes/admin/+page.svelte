<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import AdminDropdown from "../../components/AdminDropdown.svelte";
  import EditTopic from "../../components/EditTopic.svelte";
  import AppHeader from "../../components/AppHeader.svelte";
  import { isAdmin } from "../../store/store";
  import bgPhoto from "../../public/background.png";

</script>

{#if $isAdmin}
  <div class="page">
    <img class="bgPhoto" src={bgPhoto} alt="" />
    <div class="overlay"></div>

    <AppHeader logoLink={true} />

    <main class="content">
      <div class="intro">
        <h1>Resolutions</h1>
        <p>
          Create and edit the topics shareholders vote on, and manage who has
          admin access.
        </p>
      </div>

      <div class="columns">
        <div class="topicsCol">
          <EditTopic />
        </div>
        <div class="adminsCol">
          <AdminDropdown />
        </div>
      </div>
    </main>
  </div>
{/if}

<style>
  .page {
    position: relative;
    min-height: 100vh;
    background: #0f3a40;
    box-sizing: border-box;
    padding: clamp(12px, 3vw, 40px);
    color: #fff;
    font-family: "Roboto", sans-serif;
  }
  /* Fixed so the photo stays put while the page scrolls. */
  .bgPhoto {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 18% 100%;
    filter: saturate(0.7);
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(15, 58, 64, 0.55) 0%,
      rgba(10, 35, 39, 0.9) 55%
    );
  }
  .content {
    position: relative;
    max-width: 1180px;
    margin: 40px auto 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h1 {
    margin: 0;
    font: 600 clamp(30px, 3.6vw, 44px) / 1.05 "Roboto", sans-serif;
    letter-spacing: -0.035em;
  }
  .intro p {
    margin: 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.8);
  }
  .columns {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-start;
  }
  .topicsCol {
    flex: 2 1 560px;
    min-width: 0;
  }
  .adminsCol {
    flex: 1 1 300px;
    min-width: 0;
  }
</style>
