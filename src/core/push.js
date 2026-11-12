import { LIVE } from './config';
import { sb } from './sync';

async function token() { const ss = await sb.auth.getSession(); return ss.data && ss.data.session ? ss.data.session.access_token : ''; }
async function call(body) {
  const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() }, body: JSON.stringify(body) });
  return r.json().catch(() => null);
}
export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const pushOn = () => { try { return localStorage.getItem('fgc.push') === '1' && Notification.permission === 'granted'; } catch (e) { return false; } };
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const b64 = (s) => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };

// Returns '' on success, or a message to show.
export async function enablePush() {
  if (!LIVE) return 'Alerts work on the live site, not in demo mode.';
  if (!pushSupported()) return 'This browser cannot show alerts. On iPhone, install the app first.';
  const k = await call({ action: 'key' });
  if (!k || !k.enabled) return 'Alerts are not switched on yet. Please ask the school office.';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'Alerts were blocked. Allow notifications for this site in your browser settings.';
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(k.key) });
  const r = await call({ action: 'subscribe', sub: sub.toJSON() });
  if (!r || !r.ok) return (r && r.error) || 'Could not turn on alerts.';
  try { localStorage.setItem('fgc.push', '1'); } catch (e) { /* ignore */ }
  return '';
}

// Staff actions. Fire and forget: a failure here never blocks saving.
const send = (body) => { if (LIVE) call(body).catch(() => {}); };
export const alertAbsent = (sids, subject) => { if (sids.length) send({ action: 'absent', sids, subject }); };
export const alertNotice = (a) => send({ action: 'notice', title: a.title, body: a.body, aud: a.aud });
