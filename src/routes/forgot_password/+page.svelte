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
    }
    form{
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>