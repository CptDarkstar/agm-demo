<!-- Shared frame for the signed-out pages (login, forgot password): background
     photo + teal wash, logo badge, and the frosted card on the right. The
     page's own content goes in the card via <slot />. -->
<script>
  import bgPhoto from "../public/background.png";
</script>

<div class="authPage">
  <img class="bgPhoto" src={bgPhoto} alt="" />
  <div class="overlay"></div>

  <header class="badge">
    <img class="badgeLogo" src="/rnslogo.png" alt="RNS Home Loans" />
  </header>

  <main class="cardWrap">
    <div class="card">
      <slot />
    </div>
  </main>
</div>

<style>
  .authPage {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: #0f3a40;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: clamp(12px, 3vw, 40px);
    font-family: "Roboto", sans-serif;
  }
  .bgPhoto {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 20% 65%;
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
  .badge {
    position: relative;
    display: flex;
    align-items: center;
    align-self: flex-start;
    padding: 10px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 14px;
  }
  .badgeLogo {
    width: clamp(140px, 45vw, 230px);
    height: auto;
  }
  .cardWrap {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-top: 24px;
  }
  .card {
    width: min(440px, 100%);
    border-radius: 24px;
    background: rgba(250, 252, 252, 0.14);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    padding: clamp(24px, 4vw, 40px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 24px;
    color: #fff;
  }

  @media (max-width: 720px) {
    .cardWrap {
      justify-content: center;
    }
  }
  @media (max-width: 430px) {
    .card {
      gap: 20px;
    }
  }
</style>
