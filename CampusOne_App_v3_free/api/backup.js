// Vercel serverless function: automatic backup and keep-alive. Free.
//
// Why: the free Supabase plan has no backups and pauses a project after a week without use.
// A daily call to this function reads every table, saves a backup file in a private Supabase
// Storage bucket ("backups", the last 14 are kept) and touches the database so it stays awake.
//
// Who may call it:
//   - the Vercel cron job (it sends "Authorization: Bearer <CRON_SECRET>"), or
//   - a signed-in, active Admin (the "Download backup" button).
//
// Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same as the other functions)
// and CRON_SECRET (any long random text; Vercel sends it to the cron job automatically).
// Run supabase/update_v3_free_features.sql first (it creates the "backups" bucket).

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const KEEP = 14;
const TABLES = [
  ['profiles', 'id'], ['subjects', 'code'], ['classes', 'id'], ['students', 'id'],
  ['parent_students', 'parent_id,student_id'], ['teacher_assignments', 'class_id,subject_code'],
  ['records', 'collection,id'], ['audit_log', 'id'], ['inquiries', 'id'],
];

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const H = (extra) => ({ apikey: SERVICE_KEY, ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SERVICE_KEY } : {}), ...(extra || {}) });

async function isAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const who = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token } });
  if (!who.ok) return false;
  const user = await who.json();
  const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id) + '&select=role,active', { headers: H() });
  const rows = p.ok ? await p.json() : [];
  return Array.isArray(rows) && rows[0] && rows[0].role === 'admin' && rows[0].active === true;
}

async function readTable(name, order) {
  const out = []; let from = 0;
  for (;;) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + name + '?select=*&order=' + order + '&offset=' + from + '&limit=1000', { headers: H() });
    if (r.status === 404) return null; // table not created yet
    if (!r.ok) throw new HttpError(502, 'Could not read ' + name + ' (' + r.status + ').');
    const rows = await r.json(); out.push(...rows);
    if (rows.length < 1000) break;
    from += 1000;
  }
  return out;
}

async function buildBackup() {
  const data = { made_at: new Date().toISOString(), tables: {} };
  for (const [name, order] of TABLES) { const rows = await readTable(name, order.split(',').join(',')); if (rows) data.tables[name] = rows; }
  return data;
}

async function saveAndPrune(data) {
  const name = 'backup-' + data.made_at.slice(0, 10) + '.json';
  const up = await fetch(SUPABASE_URL + '/storage/v1/object/backups/' + name, {
    method: 'POST', headers: H({ 'Content-Type': 'application/json', 'x-upsert': 'true' }), body: JSON.stringify(data),
  });
  if (!up.ok) return { saved: false, note: 'Backup file not saved (is the "backups" bucket created? Run update_v3_free_features.sql).' };
  const ls = await fetch(SUPABASE_URL + '/storage/v1/object/list/backups', {
    method: 'POST', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefix: '', limit: 200, sortBy: { column: 'name', order: 'desc' } }),
  });
  const files = ls.ok ? (await ls.json()).map((f) => f.name).filter((n) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().reverse() : [];
  const old = files.slice(KEEP);
  if (old.length) await fetch(SUPABASE_URL + '/storage/v1/object/backups', { method: 'DELETE', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: old }) });
  return { saved: true, name, pruned: old.length };
}

export default async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, obj) => res.status(status).json(obj);
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) return send(200, { ok: true, enabled: false });
    const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const isCron = !!CRON_SECRET && bearer === CRON_SECRET;
    const mode = String((req.query && req.query.mode) || 'run');
    if (!isCron && !(await isAdmin(req))) throw new HttpError(401, 'Only the Admin or the scheduled job can use this.');
    const data = await buildBackup();
    const counts = Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, v.length]));
    if (mode === 'download' && !isCron) {
      res.setHeader('Content-Disposition', 'attachment; filename="backup-' + data.made_at.slice(0, 10) + '.json"');
      return send(200, data);
    }
    const saved = await saveAndPrune(data);
    return send(200, { ok: true, counts, ...saved });
  } catch (e) {
    return send(e instanceof HttpError ? e.status : 500, { ok: false, error: e instanceof HttpError ? e.message : 'Backup failed.' });
  }
};
