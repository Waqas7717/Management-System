// Connection settings. The anon (publishable) key is safe to ship in a web page.
// NEVER put the service_role key here.
// Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set both to empty for demo mode),
// or open the site with ?demo=1 to try the built-in sample data without a database.
const env = import.meta.env;
const forceDemo =
  env.VITE_FORCE_DEMO === '1' ||
  (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? 'https://jbxmptfzwlqtbrmbucou.supabase.co';
export const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_bNLvkCllBp4F0mfgCdj1oA_zXdFx43v';
export const LIVE = !forceDemo && !!(SUPABASE_URL && SUPABASE_KEY);
export const DEMO = !LIVE;
