// Vercel serverless function: optional "demo sign in" without passwords.
//
// It does nothing unless the Vercel environment variable DEMO_LOGIN is set to "on".
// When it is on, anyone who opens the site can pick a Principal, Teacher or Parent from a list
// (and press one button for the Admin) and be signed in. Use it for demos only, with demo data.
// To switch it off again: delete DEMO_LOGIN in Vercel (or set it to anything else) and redeploy.
//
// Other environment variables it needs (already set for the Admin tools):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ENABLED = String(process.env.DEMO_LOGIN || '').toLowerCase() === 'on';

async function supa(path, options = {}) {
  const res = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SERVICE_KEY } : {}),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = { message: text }; }
  return { ok: res.ok, status: res.status, body };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, obj) => res.status(status).json(obj);
  try {
    if (req.method !== 'POST') return send(405, { ok: false, error: 'Use POST.' });
    if (!ENABLED || !SUPABASE_URL || !SERVICE_KEY) return send(200, { ok: true, enabled: false });
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};

    if (b.action === 'list') {
      const r = await supa('/rest/v1/profiles?active=eq.true&role=in.(principal,teacher,parent)&select=username,full_name,role,relation&order=full_name.asc');
      if (!r.ok) return send(200, { ok: false, error: 'Could not load the list.' });
      return send(200, { ok: true, enabled: true, users: r.body.map(p => ({ role: p.role, username: p.username, name: p.full_name })) });
    }

    if (b.action === 'login') {
      const role = String(b.role || '');
      if (!['admin', 'principal', 'teacher', 'parent'].includes(role)) return send(400, { ok: false, error: 'Unknown role.' });
      let q = '/rest/v1/profiles?active=eq.true&role=eq.' + role + '&select=email,username&order=created_at.asc&limit=1';
      if (role !== 'admin') q = '/rest/v1/profiles?active=eq.true&role=eq.' + role + '&username=eq.' + encodeURIComponent(String(b.username || '').toLowerCase()) + '&select=email,username&limit=1';
      const p = await supa(q);
      const row = p.ok && Array.isArray(p.body) ? p.body[0] : null;
      if (!row) return send(404, { ok: false, error: 'That account was not found or is inactive.' });
      const link = await supa('/auth/v1/admin/generate_link', { method: 'POST', body: JSON.stringify({ type: 'magiclink', email: row.email }) });
      const token = link.ok && link.body ? (link.body.hashed_token || (link.body.properties && link.body.properties.hashed_token)) : null;
      if (!token) return send(500, { ok: false, error: 'Could not start the session.' });
      return send(200, { ok: true, token_hash: token });
    }

    return send(400, { ok: false, error: 'Unknown action.' });
  } catch (e) {
    return send(500, { ok: false, error: 'Something went wrong on the server.' });
  }
};
