// Vercel serverless function: lets the Admin create and manage login accounts.
//
// Why this exists: creating or deleting a login needs Supabase's secret "service role" key,
// and that key must never be placed in the web page. It lives here, on the server, as a
// Vercel environment variable. Every call is checked: the caller must be a signed-in,
// active Admin, otherwise nothing happens.
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   SUPABASE_URL                e.g. https://abcdxyz.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   the secret service_role key (never share it)
//   EMAIL_DOMAIN                optional, default "fgcampus.app". Logins are stored as
//                               username@EMAIL_DOMAIN; no email is ever sent to it.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'fgcampus.app';

const ROLES = ['admin', 'principal', 'teacher', 'parent'];
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function supa(path, options = {}) {
  const res = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      // Old-style keys are JWTs and go in Authorization too. New "sb_secret_" keys go in apikey only.
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

function errText(r, fallback) {
  const b = r.body || {};
  return b.msg || b.message || b.error_description || b.error || fallback;
}

async function requireAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in again.');
  const who = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token },
  });
  if (!who.ok) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const user = await who.json();
  const p = await supa('/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id) + '&select=id,role,active');
  const row = p.ok && Array.isArray(p.body) ? p.body[0] : null;
  if (!row || row.role !== 'admin' || !row.active) throw new HttpError(403, 'Only an Admin can do this.');
  return row;
}

function cleanName(v, label) {
  const s = String(v || '').trim();
  if (s.length < 3 || s.length > 80) throw new HttpError(400, label + ' must be 3 to 80 characters.');
  return s;
}
function cleanUsername(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!USERNAME_RE.test(s)) throw new HttpError(400, 'Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore.');
  return s;
}
function cleanPassword(v) {
  const s = String(v || '');
  if (s.length < 8 || s.length > 72) throw new HttpError(400, 'Password must be 8 to 72 characters.');
  return s;
}
function cleanId(v) {
  const s = String(v || '');
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new HttpError(400, 'Invalid account.');
  return s;
}

const actions = {
  async createUser(b) {
    const role = String(b.role || '');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Unknown role.');
    const username = cleanUsername(b.username);
    const password = cleanPassword(b.password);
    const full_name = cleanName(b.full_name, 'Name');
    const phone = String(b.phone || '').trim().slice(0, 30);
    const relation = role === 'parent' ? String(b.relation || 'Father').slice(0, 20) : '';
    const email = username + '@' + EMAIL_DOMAIN;

    const taken = await supa('/rest/v1/profiles?username=eq.' + encodeURIComponent(username) + '&select=id');
    if (taken.ok && taken.body && taken.body.length) throw new HttpError(409, 'This username is already taken. Choose another.');

    const created = await supa('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    if (!created.ok) {
      const msg = errText(created, 'Could not create the login.');
      if (/invalid/i.test(msg) && /email/i.test(msg)) {
        throw new HttpError(400, 'Supabase rejected the login address "' + email + '". Set the EMAIL_DOMAIN environment variable in Vercel to a domain you own, then try again.');
      }
      throw new HttpError(created.status === 422 ? 409 : 400, msg);
    }
    const id = created.body.id;
    const prof = await supa('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ id, username, email, full_name, phone, role, relation, active: true }),
    });
    if (!prof.ok) {
      await supa('/auth/v1/admin/users/' + id, { method: 'DELETE' });   // undo
      throw new HttpError(400, errText(prof, 'Could not save the account.'));
    }
    return { id, username };
  },

  async updateUser(b) {
    const id = cleanId(b.id);
    const patch = {};
    if (b.full_name !== undefined) patch.full_name = cleanName(b.full_name, 'Name');
    if (b.phone !== undefined) patch.phone = String(b.phone || '').trim().slice(0, 30);
    if (b.relation !== undefined) patch.relation = String(b.relation || '').slice(0, 20);
    if (b.username !== undefined) {
      const username = cleanUsername(b.username);
      const same = await supa('/rest/v1/profiles?username=eq.' + encodeURIComponent(username) + '&id=neq.' + id + '&select=id');
      if (same.ok && same.body && same.body.length) throw new HttpError(409, 'This username is already taken. Choose another.');
      const email = username + '@' + EMAIL_DOMAIN;
      const cur = await supa('/rest/v1/profiles?id=eq.' + id + '&select=username');
      if (cur.ok && cur.body && cur.body[0] && cur.body[0].username !== username) {
        const up = await supa('/auth/v1/admin/users/' + id, { method: 'PUT', body: JSON.stringify({ email, email_confirm: true }) });
        if (!up.ok) throw new HttpError(400, errText(up, 'Could not change the username.'));
        patch.username = username;
        patch.email = email;
      }
    }
    if (Object.keys(patch).length) {
      const r = await supa('/rest/v1/profiles?id=eq.' + id, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch),
      });
      if (!r.ok) throw new HttpError(400, errText(r, 'Could not save the changes.'));
    }
    return { id };
  },

  async resetPassword(b) {
    const id = cleanId(b.id);
    const password = cleanPassword(b.password);
    const r = await supa('/auth/v1/admin/users/' + id, { method: 'PUT', body: JSON.stringify({ password }) });
    if (!r.ok) throw new HttpError(400, errText(r, 'Could not change the password.'));
    return { id };
  },

  async setActive(b, admin) {
    const id = cleanId(b.id);
    const active = !!b.active;
    if (id === admin.id && !active) throw new HttpError(400, 'You cannot deactivate your own account.');
    const r = await supa('/auth/v1/admin/users/' + id, {
      method: 'PUT', body: JSON.stringify({ ban_duration: active ? 'none' : '876000h' }),
    });
    if (!r.ok) throw new HttpError(400, errText(r, 'Could not change the account status.'));
    const p = await supa('/rest/v1/profiles?id=eq.' + id, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ active }),
    });
    if (!p.ok) throw new HttpError(400, errText(p, 'Could not save the account status.'));
    return { id, active };
  },

  async deleteUser(b, admin) {
    const id = cleanId(b.id);
    if (id === admin.id) throw new HttpError(400, 'You cannot remove your own account.');
    const r = await supa('/auth/v1/admin/users/' + id, { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw new HttpError(400, errText(r, 'Could not remove the account.'));
    return { id };
  },
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new HttpError(500, 'The server is not set up yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.');
    }
    const admin = await requireAdmin(req);
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    const fn = Object.prototype.hasOwnProperty.call(actions, body.action) ? actions[body.action] : null;
    if (!fn) throw new HttpError(400, 'Unknown action.');
    const out = await fn(body, admin);
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ ok: false, error: e instanceof HttpError ? e.message : 'Something went wrong on the server.' });
  }
};
