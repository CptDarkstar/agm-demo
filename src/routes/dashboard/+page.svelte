<script>
import { authHandlers } from "../../store/store";
  let show = false
  let content = ''
  /* $: onValueChange(content); */

  function anime(element) {
    console.log('HI!');

    return {
      destroy() {
        console.log('Bye!');
      }
    }
  }

  /* let active = false
    
  

  function animate() {
     if (active = true) {
      icon.classList.add('fa-beat')
    } else {
      icon.classList.remove('fa-beat')
    }
  }
  function freez(){
    menu.classList.remove('fa-beat')
  } */
  
  /* const icon = document.getElementsByID('icon'); */
</script>


<div class="maincontainer">
    
    <header data-role="Header" class="agm-voting-header">
      <img
        alt="logo"
        src="rnslogo.png"
        class="agm-voting-image Logo"
      />
      <div class="agm-voting-btn-group">
        
        <div
        data-thq="thq-dropdown"
        class="drop_down_menu list-item agm-voting-dropdown"
        >
          <div
            data-thq="thq-dropdown-toggle"
            class="agm-voting-dropdown-toggle"
          >
                <span class="agm-voting-text">Menu</span>
          </div>
          <ul data-thq="thq-dropdown-list" class="agm-voting-dropdown-list">
            <a on:mouseenter={anime} on:mouseleave={anime} href="Share Holders">
              <li
                data-thq="thq-dropdown"
                class="agm-voting-dropdown01 list-item"
              >
                <div
                  data-thq="thq-dropdown-toggle"
                  class="agm-voting-dropdown-toggle01"
                >
                  <i bind:this={content} id="icon" class="icon fa-regular fa-user" style="color: #ffffff;"></i>
                  <span class="agm-voting-text01">Share Holders</span>
                </div>
              </li>
            </a>
            <a href="Voting">
              <li
                data-thq="thq-dropdown"
                class="agm-voting-dropdown03 list-item"
              >
                <div
                  data-thq="thq-dropdown-toggle"
                  class="agm-voting-dropdown-toggle03"
                >
                    <i class="icon fa-solid fa-square-poll-vertical" style="color: #ffffff;"></i>
                    <span class="agm-voting-text03">Voting</span>
                </div>
              </li>
            </a>
          </ul>
        </div>
        <button on:click={authHandlers.logOut} class="log_out button">Log Out</button>
      </div>
    </header>
</div>

<style>

  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  [data-thq="thq-dropdown"]:hover > [data-thq="thq-dropdown-list"] {
            display: flex;
  }
  .agm-voting-header {
    width: 100%;
    height: 150px;
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
  .log_out {
    color: #ffffff;
    width: auto;
    height: auto;
    font-size: 30px;
    border-width: 0px;
    margin-right: 32px;
    text-decoration: none;
    background-color: #6ba3ab;
  }
  .button {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-color: var(--dl-color-gray-black);
    border-radius: 4px;
  }
  .agm-voting-dropdown-toggle {
    fill: #595959;
    color: #ffffff;
    width: 100%;
    display: inline-flex;
    align-items: center;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
    justify-content: flex-start;
    background-color: #6ba3ab;
    cursor: pointer;
  }
  .agm-voting-dropdown-list {
    top: 102px;
    right: 23.9%;
    /* width: 234%; */
    height: auto;
    display: none;
    z-index: 100;
    position: absolute;
    transition: 0.3s;
    align-items: stretch;
    flex-direction: column;
    list-style-type: none;
    background-color: #6ba3ab;
    list-style-position: inside;
    
  }
  .agm-voting-dropdown01 {
    width: 100%;
    cursor: pointer;
    height: 100%;
    display: inline-block;
    position: relative;
    border-color: var(--dl-color-gray-black);
    border-width: 1px;
    border-radius: var(--dl-radius-radius-radius4);
    text-decoration: none;
    background-color: #6ba3ab;
    border-bottom-width: 0px;
    border-top-left-radius: var(--dl-radius-radius-radius4);
    border-top-right-radius: var(--dl-radius-radius-radius4);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .agm-voting-dropdown-toggle01,.agm-voting-dropdown-toggle03 {
    fill: #595959;
    color: #ffffff;
    width: 100%;
    display: inline-flex;
    transition: 0.3s;
    align-items: center;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
    gap: 10px;
  }
  .agm-voting-text {
  width: 96px;
  font-size: 30px;
  font-style: normal;
  text-align: center;
  font-weight: 500;
  margin-right: 4px;
  vertical-align: middle;
  }
  .agm-voting-text01, .agm-voting-text03 {
      width: 100%;
      cursor: pointer;
      display: flex;
      font-size: 30px;
      font-style: normal;
      font-weight: 500;
      color: white;
  }
  .agm-voting-dropdown-toggle01:hover, .agm-voting-dropdown-toggle03:hover {
    fill: #fff;
    color: #fff;
    background-color: #595959;
  }
</style>