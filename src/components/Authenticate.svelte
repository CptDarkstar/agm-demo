<script>
  import { registerVersion } from "firebase/app";
  import {authHandlers} from "../store/store";
  import { auth } from "../lib/firebase/firebase";

    let email = '';
    let password = '';
    let error = false;
    let logIn = false;
    let register = false;
    let authenticating = false;

    async function handleAuthenticate() {
        if (authenticating) {
            return;
        }
        if (!email || !password) {
            error=true
            return;
        }
        authenticating = true;
        try {
            if (!register) {
                await authHandlers.login(email, password);
                alert('Logged in!')
            } else {
                await authHandlers.singup(email, password);
            }
        } catch (err) {
            console.log("There was an error", err);
            error=true;
            authenticating = false;
        }
};
</script>

<div class="authContainer">
    <img class="logo" src="rnslogo.png" alt="">
    <form>
        {#if error}
            <p class="error">The information you have enterd is not valid. Please contact RNS.</p>
        {/if}
        <div class="log-in-group01">
            <span class="log-in-text">
                <span class="log-in-text01">Welcome to</span>
                <span class="log-in-text02">RNS</span>
            </span>
        </div>
        <span class="log-in-text03">
            <span>Sign in</span>
        </span>
        <div class="log-in-group02">
            <span class="log-in-text05">
                <span>Enter your Email</span>
            </span>
            <input
                type="email"
                required=""
                placeholder="Email"
                class="log-in-textinput input"
                id="Email"
                bind:value={email}
            />
        </div>
        <div class="log-in-group03">
            <span class="log-in-text07">
                <span>Enter your Password</span>
            </span>
            <input
                type="password"
                required=""
                placeholder="Password"
                class="log-in-textinput1 input"
                id="Password"
                bind:value={password}
            />
        </div>
        <a
        href="https://#"
        target="_blank"
        rel="noreferrer noopener"
        class="log-in-text09"
        >
        <span>Forgot Password</span>
        </a>
        <div class="log-in-group04">
            <button on:click={handleAuthenticate} type="button" class="log-in-button button" id="btnLogin">
                {#if authenticating}
                    <i class="fa-solid fa-spinner fa-spin" style="color: #ffffff;"></i>
                {:else }
                Log In
                {/if}
            </button>
        </div>
    </form>
</div>

<style>
    .authContainer {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-content: flex-end;
        align-items: center;
        justify-content: center;
        flex: 1;
        /* padding: 20px; */
        padding-right: 100px;
    }
    .logo{
        align-self: flex-start;
    }
    form {
        display: flex;
        position: sticky;
        left: 100%;
        flex-direction: column;
        gap: 15px;
        width: 400px;
        max-width: 100%;
        margin: 0 auto;
        align-items:flex-start;
        border: none;
        border-radius: 10px;
        background-color: rgba(255, 255, 255, 0.415);
        backdrop-filter: blur(20px);
        padding: 15px;
        padding-left: 25px;
        padding-top: 25px;
        padding-bottom: 25px;
    }
    form input{
        width: 95%;
        font-size: large;
        height: 50px;
    }
    /* .log-in-textinput1{
        width: 97%;
        min-width: 97%;
    } */
    .log-in-text{
        font-size: 21px;
    }
    .log-in-text02{
        color: #6ba3ab;
        font-weight: bold;
    }
    .log-in-text03{
        font-size: 55px;
    }
    .log-in-group02{
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
    }
    .log-in-group03{
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
    }
    .log-in-group04{
        width: 100%;
        border: none;
        border-radius: 10px;
        background:#6ba3ab;
        cursor: pointer;
        padding: 10px 0;
        color: white;
        font-size: large;
    }
    form button{
        width: 100%;
        border: none;
        border-radius: 3px;
        background: #6ba3ab;
        cursor: pointer;
        padding: 10px 0;
        font-size: large;
        color: white;
        display: grid;
        place-items: center;
    }
    @media(max-width: 720px) {
        .authContainer{
            padding: 10px;
            padding-top: 0%;
            align-content: center;
        }
        .logo{
            width: 150px;
        }
    }
    @media(max-width: 430px) {
        .authContainer{
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            padding: 10px;
            justify-content: flex-start;
            align-items: flex-start;
        }
        .logo{
            width: 165px;
            align-self: center;
        }
        form{
            top: 5%;
        }
    }
</style>