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
        <!-- <form on:submit|preventDefault={forgotPassword}>
            <p>Please enter your email to reset your password</p>
            <input type="email" bind:value={email} placeholder="Enter your email" required />
            <div class="button-group">
                <button onclick="history.back()">Go Back</button>
                <button type="submit">Reset Password</button>
            </div>
        </form> -->
        <div class="div-3">
            <div class="div-4">
              <div class="div-5">
                <div class="column">
                  <i class="fa-solid fa-unlock fa-shake fa-10x" style="color: #6ba3ab; --fa-animation-duration: 10s;"></i>
                </div>
                <div class="column-2">
                  <div class="div-6">
                    <div class="div-7">
                      Forgot
                      <br />
                      Your
                      <span style="color: rgba(107, 163, 171, 1)">Password?</span>
                    </div>
                    <form on:submit|preventDefault={forgotPassword}>
                      <div class="div-8">Provide us with your email for varication</div>
                      <input type="email" bind:value={email} placeholder="Enter your email" required class="div-9"/>
                      <button class="div-10">Reset</button>
                    </form>
                    <div class="div-11" style="cursor: pointer;" onclick="history.back()">
                      Go back to
                      <span style="text-decoration: underline; color: rgba(107, 163, 171, 1);">
                        Login
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
    </div>
</div>
  
<style>
  .main{
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .div-3 {
    position: relative;
    border-radius: 10px;
    box-shadow: 6px 6px 10px 0px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(6.5px);
    background-color: rgba(255, 255, 255, 0.53);
    display: flex;
    width: 870px;
    max-width: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: end;
    /* margin: 194px 107px 145px 0; */
    padding: 50px 60px;
  }
  @media (max-width: 991px) {
    .div-3 {
      /* margin: 40px 10px 40px 0; */
      padding: 0 20px;
      max-width: 91%;
    }
    i {
      font-size: 3em;
    }
  }
  .div-4 {
    width: 737px;
    max-width: 100%;
    margin: 95px 17px 76px 0;
  }
  @media (max-width: 991px) {
    .div-4 {
      margin: 25px 0px 25px 0;
     }
  }
  .div-5 {
    gap: 20px;
    display: flex;
  }
  @media (max-width: 991px) {
    .div-5 {
      flex-direction: column;
      align-items: stretch;
      gap: 0px;
    }
  }
  .column {
    display: flex;
    flex-direction: column;
    align-content: center;
    flex-wrap: wrap;
    line-height: normal;
    width: 30%;
    margin-left: 0px;
  }
  @media (max-width: 991px) {
    .column {
      width: 100%;
    }
  }
  /* .img-2 {
    aspect-ratio: 0.91;
    object-fit: auto;
    object-position: center;
    width: 200px;
    fill: #000;
    filter: drop-shadow(6px 8px 9.4px rgba(0, 0, 0, 0.25));
    margin-top: 13px;
    max-width: 100%;
    flex-grow: 1;
  } */
  @media (max-width: 991px) {
    .logo {
      max-width: 41%;
    }
  }
  .column-2 {
    display: flex;
    flex-direction: column;
    line-height: normal;
    width: 70%;
    /* margin-left: 20px; */
  }
  @media (max-width: 991px) {
    .column-2 {
      width: 100%;
    }
  }
  .div-6 {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    color: #6ba3ab;
    font-weight: 400;
  }
  @media (max-width: 991px) {
    .div-6 {
      max-width: 100%;
      margin-top: 40px;
    }
  }
  .div-7 {
    font: 40px Merriweather, sans-serif;
  }
  @media (max-width: 991px) {
    .div-7 {
      max-width: 100%;
      font-size: 27px;
    }
  }
  .div-8 {
    color: #868686;
    text-transform: capitalize;
    margin-top: 14px;
    font: 16px Merriweather, sans-serif;
  }
  @media (max-width: 991px) {
    .div-8 {
      max-width: 100%;
      font-size: 13px;
    }
  }
  .div-9 {
    border-radius: 10px;
    border: 2px solid #767676;
    background-color: #fff;
    margin-top: 12px;
    height: 44px;
  }
  @media (max-width: 991px) {
    .div-9 {
      max-width: 100%;
    }
  }
  .div-10 {
    text-shadow: 3px 1px 3px rgba(0, 0, 0, 0.73);
    border-radius: 10px;
    background-color: #6ba3ab;
    margin-top: 5px;
    justify-content: center;
    color: #fff;
    white-space: nowrap;
    text-align: center;
    padding: 6px 16px;
    font: 17px Merriweather, sans-serif;
  }
  @media (max-width: 991px) {
    .div-10 {
      max-width: 100%;
      white-space: initial;
    }
  }
  .div-11 {
    text-align: center;
    text-decoration-line: underline;
    align-self: center;
    margin-top: 8px;
    font: 18px Merriweather, sans-serif;
  }

  .content{
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Merriweather', sans-serif;
      font-size: large;
      max-width: 100%;
  }
  /* form{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      background-color: rgba(255, 255, 255, 0.38);
      backdrop-filter: blur(20px);
      padding: 10px;
      border-radius: 4px;
  } */
  /* p{
    font-family: 'Merriweather', sans-serif;
    font-size: larger;
  } */
  input{
    font-family: 'Merriweather', sans-serif;
    font-size: medium;
    text-align: center;
    width: 100%;
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
    width: 100%;
  }
</style>