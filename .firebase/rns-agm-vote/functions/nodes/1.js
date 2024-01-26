

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.VJkjQLpP.js","_app/immutable/chunks/scheduler.ZABxAMYF.js","_app/immutable/chunks/index.Qd1TfXfj.js","_app/immutable/chunks/entry.A2K3OjCX.js"];
export const stylesheets = [];
export const fonts = [];
