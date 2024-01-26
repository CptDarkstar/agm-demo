import { c as create_ssr_component } from "../../chunks/ssr.js";
import "../../chunks/firebase.js";
import "firebase/firestore";
const css = {
  code: ".mainContainer.s-7IPF32Wcq3s8{min-height:100vh;background-image:url(../public/background.png);background-repeat:no-repeat;background-size:cover;color:black;position:relative;display:flex;flex-direction:column}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="mainContainer s-7IPF32Wcq3s8">${slots.default ? slots.default({}) : ``} </div>`;
});
export {
  Layout as default
};
