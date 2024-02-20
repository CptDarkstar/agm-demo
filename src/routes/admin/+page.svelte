<script>
  import App from "../../App.svelte";
  import { authHandlers } from "../../store/store";
  import { goto } from "$app/navigation";
  import Button, { Label } from "@smui/button";
  import Menu from "@smui/menu";
  import List, { Item, Separator, Text } from "@smui/list";

  let menu = Menu;
  let clicked = "nothing yet";

  //Menu
  const handleShareHoldersAction = () => {
    clicked = "Share Holders";
    goto("/shareholders");
  };

  const handleVotingAction = () => {
    clicked = "Voting";
    goto("/admin");
  };

</script>

<div class="maincontainer">
  <header data-role="Header" class="agm-voting-header">
    <a href="/dashboard">
      <img alt="logo" src="rnslogo.png" class="agm-voting-image logo" />
    </a>
    <div class="agm-voting-btn-group">
      <Button on:click={() => menu.setOpen(true)}>
        <Label>Menu</Label>
      </Button>
      <Menu bind:this={menu}>
        <List>
          <Item on:SMUI:action={handleShareHoldersAction}>
            <Text>Share Holders</Text>
          </Item>
          <Separator />
          <Item on:SMUI:action={handleVotingAction}>
            <Text>Voting</Text>
          </Item>
        </List>
      </Menu>
      <Button on:click={authHandlers.logOut} variant="raised">
        <Label>Log Out</Label>
      </Button>
    </div>
  </header>
</div>

<style>
  .maincontainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  * :global(.mdc-button) {
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
  * :global(.mdc-menu) {
    background: #6ba3ab;
    font-family: "Merriweather", sans-serif;
  }
  * :global(.mdc-deprecated-list-item):hover {
    background: #595959;
  }
  * :global(.mdc-deprecated-list-item__text) {
    font-size: 30px;
    color: white;
    padding-top: 8px;
    padding-left: 16px;
    border-radius: 4px;
    padding-right: 16px;
    padding-bottom: 8px;
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
