

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.BoVmMi28.js","_app/immutable/chunks/scheduler.ZABxAMYF.js","_app/immutable/chunks/index.Qd1TfXfj.js","_app/immutable/chunks/firebase.mxMszc5n.js","_app/immutable/chunks/store.wnnLasNN.js"];
export const stylesheets = ["_app/immutable/assets/2.DGmtqV8c.css"];
export const fonts = [];
