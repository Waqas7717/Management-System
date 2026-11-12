// Vercel serverless function: phone alerts (web push) for parents. Free.
// Needs env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (and optional VAPID_SUBJECT),
// plus the same SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as the other functions.
// Does nothing until the keys are set and the push_subs table exists (see supabase/update_fees_alerts.sql).
import webpush from 'web-push';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PUB = process.env.VAPID_PUBLIC_KEY || '', PRIV = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@fgcampus.example';

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const H = () => ({ apikey: SERVICE_KEY, ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SERVICE_KEY } : {}), 'Content-Type': 'application/json' });
const rest = (path, init) => fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({ headers: H() }, init));
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

async function whoIs(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in again.');
  const who = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token } });
  if (!who.ok) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const user = await who.json();
  const p = await rest('profiles?id=eq.' + encodeURIComponent(user.id) + '&select=id,role,active');
  const rows = p.ok ? await p.json() : [];
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || !row.active) throw new HttpError(403, 'This account cannot use alerts.');
  return row;
}

const inList = (a) => '(' + a.map((x) => '"' + String(x).replace(/"/g, '') + '"').join(',') + ')';

async function parentIdsFor({ sids, cids, all }) {
  if (all) { const r = await rest('profiles?role=eq.parent&active=eq.true&select=id'); return r.ok ? (await r.json()).map((x) => x.id) : []; }
  let ids = (sids || []).slice();
  if (!ids.length && cids && cids.length) { const r = await rest('students?class_id=in.' + encodeURIComponent(inList(cids)) + '&active=eq.true&select=id'); ids = r.ok ? (await r.json()).map((x) => x.id) : []; }
  if (!ids.length) return [];
  const r = await rest('parent_students?student_id=in.' + encodeURIComponent('(' + ids.join(',') + ')') + '&select=parent_id');
  return r.ok ? Array.from(new Set((await r.json()).map((x) => x.parent_id))) : [];
}

async function pushTo(userIds, payload) {
  if (!userIds.length) return 0;
  const r = await rest('push_subs?user_id=in.' + encodeURIComponent(inList(userIds)) + '&select=id,sub');
  const subs = r.ok ? await r.json() : [];
  let sent = 0; const dead = [];
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification(s.sub, JSON.stringify(payload)); sent++; }
    catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.id); }
  }));
  if (dead.length) await rest('push_subs?id=in.' + encodeURIComponent(inList(dead)), { method: 'DELETE' });
  return sent;
}

export default async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, obj) => res.status(status).json(obj);
  try {
    if (req.method !== 'POST') return send(405, { ok: false, error: 'Use POST.' });
    if (!PUB || !PRIV || !SUPABASE_URL || !SERVICE_KEY) return send(200, { ok: true, enabled: false });
    webpush.setVapidDetails(SUBJECT, PUB, PRIV);
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
    const action = String(b.action || '');
    if (action === 'key') return send(200, { ok: true, enabled: true, key: PUB });
    const me = await whoIs(req);
    if (action === 'subscribe') {
      const sub = b.sub; if (!sub || !sub.endpoint || !sub.keys) throw new HttpError(400, 'Bad subscription.');
      await rest('push_subs?endpoint=eq.' + encodeURIComponent(sub.endpoint), { method: 'DELETE' });
      const r = await rest('push_subs', { method: 'POST', body: JSON.stringify({ user_id: me.id, endpoint: sub.endpoint, sub }) });
      if (!r.ok) throw new HttpError(500, 'Could not save the subscription. Has the database update been run?');
      return send(200, { ok: true });
    }
    if (action === 'unsubscribe') { await rest('push_subs?user_id=eq.' + encodeURIComponent(me.id) + '&endpoint=eq.' + encodeURIComponent(clip(b.endpoint, 600)), { method: 'DELETE' }); return send(200, { ok: true }); }
    if (!['teacher', 'admin', 'principal'].includes(me.role)) throw new HttpError(403, 'Only staff can send alerts.');
    if (action === 'absent') {
      const sids = Array.isArray(b.sids) ? b.sids.slice(0, 80) : [];
      let n = 0;
      for (const sid of sids) {
        const sr = await rest('students?id=eq.' + encodeURIComponent(sid) + '&select=id,full_name');
        const st = sr.ok ? (await sr.json())[0] : null; if (!st) continue;
        n += await pushTo(await parentIdsFor({ sids: [sid] }), { title: 'Absent today', body: st.full_name + ' was marked absent' + (b.subject ? ' in ' + clip(b.subject, 40) : '') + '.', url: '/' });
      }
      return send(200, { ok: true, sent: n });
    }
    if (action === 'notice') {
      const aud = b.aud || {}; if (aud.kind === 'teachers') return send(200, { ok: true, sent: 0 });
      const ids = await parentIdsFor({ all: aud.kind === 'all' || aud.kind === 'parents', cids: aud.cids, sids: aud.sids });
      const n = await pushTo(ids, { title: clip(b.title, 80) || 'New notice', body: clip(b.body, 140), url: '/' });
      return send(200, { ok: true, sent: n });
    }
    throw new HttpError(400, 'Unknown action.');
  } catch (e) { return send(e.status || 500, { ok: false, error: e.message || 'Server error.' }); }
};
