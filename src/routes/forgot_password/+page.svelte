<script>
    import '@fortawesome/fontawesome-free/css/all.min.css';
    import { getAuth, sendPasswordResetEmail } from "firebase/auth";

    let email = '';

    function forgotPassword() {
        const auth = getAuth();
        sendPasswordResetEmail(auth, email)
            .then(() => console.log('Password reset email sent'))
            .catch((error) => console.error(error));
       // Function to handle forgotten password
    };
</script>

<div class="main">
    <div class="content">
        <img class="logo" src="rnslogo.png" alt="RNS logo">
        <form on:submit|preventDefault={forgotPassword}>
            <p>Please enter your email to reset your password</p>
            <input type="email" bind:value={email} placeholder="Enter your email" required />
            <div class="button-group">
                <button onclick="history.back()">Go Back</button>
                <button type="submit">Reset Password</button>
            </div>
        </form>
    </div>
</div>

<style>
    .content{
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Merriweather', sans-serif;
        font-size: large;
    }
    form{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        background-color: rgba(255, 255, 255, 0.38);
        backdrop-filter: blur(20px);
        padding: 10px;
        border-radius: 4px;
    }
    p{
        font-family: 'Merriweather', sans-serif;
        font-size: larger;
    }
    input{
        font-family: 'Merriweather', sans-serif;
        font-size: large;
        text-align: center;
    }
    button{
        background: #6ba3ab;
        color: white;
        border: none;
        padding: 5px;
        font-family: 'Merriweather', sans-serif;
        font-size: large;
        font-weight: bold;
        cursor: pointer;
        border-radius: 4px;
    }
</style>