import { c as create_ssr_component, f as add_attribute, v as validate_component } from "../../chunks/ssr.js";
import "firebase/app";
import "firebase/auth";
import "../../chunks/firebase.js";
const css = {
  code: ".authContainer.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{display:flex;flex-direction:column;flex-wrap:wrap;align-content:flex-end;align-items:center;justify-content:center;flex:1;padding-right:100px}form.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{display:flex;flex-direction:column;gap:15px;width:400px;max-width:100%;margin:0 auto;align-items:flex-start;border:none;border-radius:10px;background-color:rgba(255, 255, 255, 0.415);backdrop-filter:blur(20px);padding:15px;padding-left:25px;padding-top:25px;padding-bottom:25px}form.s-GrBPrfD7xd3p input.s-GrBPrfD7xd3p{width:95%;font-size:large;height:50px}.log-in-text.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{font-size:21px}.log-in-text02.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{color:#6ba3ab;font-weight:bold}.log-in-text03.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{font-size:55px}.log-in-group02.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{display:flex;flex-direction:column;width:100%;gap:10px}.log-in-group03.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{display:flex;flex-direction:column;width:100%;gap:10px}.log-in-group04.s-GrBPrfD7xd3p.s-GrBPrfD7xd3p{width:100%;border:none;border-radius:10px;background:#6ba3ab;cursor:pointer;padding:10px 0;color:white;font-size:large}form.s-GrBPrfD7xd3p button.s-GrBPrfD7xd3p{width:100%;border:none;border-radius:3px;background:#6ba3ab;cursor:pointer;padding:10px 0;font-size:large;color:white;display:grid;place-items:center}",
  map: null
};
const Authenticate = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let email = "";
  let password = "";
  $$result.css.add(css);
  return `<div class="authContainer s-GrBPrfD7xd3p"><img src="rnslogo.png" alt=""> <form class="s-GrBPrfD7xd3p">${``} <div class="log-in-group01"><span class="log-in-text s-GrBPrfD7xd3p"><span class="log-in-text01" data-svelte-h="svelte-zgebh9">Welcome to</span> <span class="log-in-text02 s-GrBPrfD7xd3p" data-svelte-h="svelte-x5rlii">RNS</span></span></div> <span class="log-in-text03 s-GrBPrfD7xd3p"><span data-svelte-h="svelte-k61wwi">Sign in</span></span> <div class="log-in-group02 s-GrBPrfD7xd3p"><span class="log-in-text05"><span data-svelte-h="svelte-ioxwgb">Enter your Email</span></span> <input type="email" required="" placeholder="Email" class="log-in-textinput input s-GrBPrfD7xd3p" id="Email"${add_attribute("value", email, 0)}></div> <div class="log-in-group03 s-GrBPrfD7xd3p"><span class="log-in-text07"><span data-svelte-h="svelte-1mvxqmo">Enter your Password</span></span> <input type="password" required="" placeholder="Password" class="log-in-textinput1 input s-GrBPrfD7xd3p" id="Password"${add_attribute("value", password, 0)}></div> <a href="https://#" target="_blank" rel="noreferrer noopener" class="log-in-text09"><span data-svelte-h="svelte-1fgc3pq">Forgot Password</span></a> <div class="log-in-group04 s-GrBPrfD7xd3p"><button type="button" class="log-in-button button s-GrBPrfD7xd3p" id="btnLogin">${`Log In`}</button></div></form> </div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Authenticate, "Authenticate").$$render($$result, {}, {}, {})}`;
});
export {
  Page as default
};
