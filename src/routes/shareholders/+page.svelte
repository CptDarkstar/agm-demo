<script>
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import EditUser from "../../components/EditUser.svelte";
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
      <EditUser />
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
    max-width: 1240px;
    margin: 40px auto 0;
  }
</style>
