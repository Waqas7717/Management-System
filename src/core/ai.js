import { LIVE } from './config';
import { sb } from './sync';

/* calls the /api/ai server function. Returns { ok, text, error }. Nothing is sent unless a person clicks an AI button. */
export async function askAI(action, body) {
  if (!LIVE) return { ok: false, error: 'AI works on the live site once the AI key is added in Vercel.' };
  try {
    const ss = await sb.auth.getSession();
    const token = ss.data && ss.data.session ? ss.data.session.access_token : '';
    const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ ...body, action }) });
    const j = await r.json().catch(() => null);
    if (!j) return { ok: false, error: 'Could not reach the AI service.' };
    if (j.ok && j.enabled === false) return { ok: false, error: 'AI is not switched on yet. The Admin needs to add the AI key in Vercel.' };
    return j.ok ? { ok: true, text: j.text } : { ok: false, error: j.error || 'AI could not answer.' };
  } catch (e) { return { ok: false, error: 'Could not reach the AI service. Check your internet.' }; }
}
