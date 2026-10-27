<script>
  import { page } from "$app/stores";
  import { authHandlers, isAdmin } from "../store/store";

  const MENU_ITEMS = [
    { href: "/dashboard", title: "Dashboard", sub: "Live resolutions and results" },
    { href: "/shareholders", title: "Shareholders", sub: "Add, edit or remove shareholders" },
    { href: "/admin", title: "Resolutions", sub: "Add, edit or remove topics" },
  ];

  export let logoLink = true;

  let menuOpen = false;
  let menuWrap;

  function handleWindowClick(event) {
    if (menuOpen && menuWrap && !menuWrap.contains(event.target)) {
      menuOpen = false;
    }
  }

  function handleWindowKeydown(event) {
    if (event.key === "Escape") {
      menuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<header class="appHeader">
  <div class="badge">
    {#if logoLink}
      <a href="/dashboard" aria-label="Back to dashboard">
        <img alt="RNS Home Loans" src="/rnslogo.png" class="logo" />
      </a>
    {:else}
      <img alt="RNS Home Loans" src="/rnslogo.png" class="logo" />
    {/if}
  </div>

  <div class="actions">
    <!-- Demo only: lets visitors switch the admin views on and off. -->
    <button
      type="button"
      class="modeToggle"
      role="switch"
      aria-checked={$isAdmin}
      on:click={() => isAdmin.update((on) => !on)}
    >
      <span class="track" class:on={$isAdmin}><span class="thumb"></span></span>
      Admin mode <span class="demoTag">Demo</span>
    </button>
    {#if $isAdmin}
      <div class="menuWrap" bind:this={menuWrap}>
        <button
          type="button"
          class="menuBtn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          on:click={() => (menuOpen = !menuOpen)}
        >
          Menu <span class="caret">▾</span>
        </button>
        {#if menuOpen}
          <div class="menu" role="menu">
            {#each MENU_ITEMS as item (item.href)}
              <a
                href={item.href}
                role="menuitem"
                class:current={$page.url.pathname === item.href}
                aria-current={$page.url.pathname === item.href ? "page" : undefined}
                on:click={() => (menuOpen = false)}
              >
                <span class="itemTitle">{item.title}</span>
                <span class="itemSub">{item.sub}</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    <button type="button" class="logoutBtn" on:click={authHandlers.logOut}>
      Log out
    </button>
  </div>
</header>

<style>
  .appHeader {
    position: relative;
    z-index: 5;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    font-family: "Roboto", sans-serif;
  }
  .badge {
    display: flex;
    align-items: center;
    padding: 10px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 16px;
  }
  .badge a {
    display: flex;
  }
  .logo {
    width: clamp(96px, 20vw, 140px);
    height: auto;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .menuWrap {
    position: relative;
  }
  /* Same teal glass as the Menu button so the two sit together. */
  .modeToggle {
    height: 44px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 12px;
    background: rgba(15, 58, 64, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #fff;
    font: 500 14px "Roboto", sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .modeToggle:hover {
    background: rgba(15, 58, 64, 0.7);
  }
  .track {
    position: relative;
    width: 34px;
    height: 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.25);
    transition: background 0.2s;
  }
  .track.on {
    background: #5fd08a;
  }
  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
  }
  .track.on .thumb {
    transform: translateX(14px);
  }
  .demoTag {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.18);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  /* Teal-tinted glass (not the design's white glass) so it stays readable on
     the light-background pages (/admin, /shareholders) as well as the dark dashboard. */
  .menuBtn {
    height: 44px;
    padding: 0 18px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 12px;
    background: rgba(15, 58, 64, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #fff;
    font: 500 14px "Roboto", sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .menuBtn:hover {
    background: rgba(15, 58, 64, 0.7);
  }
  .caret {
    font-size: 10px;
  }
  .menu {
    position: absolute;
    top: 52px;
    left: 0;
    width: 240px;
    padding: 6px;
    border-radius: 14px;
    background: #fff;
    color: #0e1f23;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }
  .menu a {
    padding: 12px 14px;
    border-radius: 10px;
    color: #0e1f23;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .menu a:hover,
  .menu a:focus-visible,
  .menu a.current {
    background: #eef5f6;
  }
  .itemTitle {
    font-weight: 600;
    font-size: 14px;
  }
  .itemSub {
    font-size: 12px;
    color: #5c686b;
  }
  .logoutBtn {
    height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    background: #fff;
    color: #0f3a40;
    font: 600 14px "Roboto", sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  }
  .logoutBtn:hover {
    background: #e7f1f2;
  }
  @media (max-width: 430px) {
    .menu {
      left: auto;
      right: 0;
    }
  }
</style>
