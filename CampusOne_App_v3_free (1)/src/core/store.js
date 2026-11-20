// Tiny external store: components subscribe and re-render whenever render()/paint() runs.
const listeners = new Set();
let version = 0;
let syncHook = null;

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => version;
export const setSyncHook = (fn) => { syncHook = fn; };
export const paint = () => { version++; listeners.forEach((l) => l()); };
// render() = repaint and queue a save of any changed records (live mode)
export const render = () => { paint(); if (syncHook) syncHook(); };

// Bridge so plain modules can show toasts and confirm dialogs owned by React.
export const bus = { toast: null, ask: null, modal: null };
export const toast = (m) => { if (bus.toast) bus.toast(m); };
export const ask = (message, yes, fn) => { if (bus.ask) bus.ask(message, yes, fn); };
