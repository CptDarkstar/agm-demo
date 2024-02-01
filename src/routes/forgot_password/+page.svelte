<script>
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

<div>
    <form on:submit|preventDefault={forgotPassword}>
        <input type="email" bind:value={email} placeholder="Enter your email" required />
        <button type="submit">Reset Password</button>
   </form>
</div>
   