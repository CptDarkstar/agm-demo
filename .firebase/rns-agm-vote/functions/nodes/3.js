

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.6fkobznJ.js","_app/immutable/chunks/scheduler.ZABxAMYF.js","_app/immutable/chunks/index.Qd1TfXfj.js","_app/immutable/chunks/firebase.mxMszc5n.js","_app/immutable/chunks/store.wnnLasNN.js"];
export const stylesheets = ["_app/immutable/assets/3.lvZCn2Jb.css"];
export const fonts = [];
