import { createClient } from '@supabase/supabase-js';
import { LIVE, DEMO, SUPABASE_URL, SUPABASE_KEY } from './config';
import { TODAY, iso } from './dates';
import { DB, S, CLASSES, SUBJ, NAVS, cap } from './data';
import { paint, render, setSyncHook, toast } from './store';

export const sb = LIVE ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const SYNC = { last: {}, busy: false, again: false, failed: false, timer: null, poll: null, refreshing: false };
export const DICT = ['att', 'tatt', 'res', 'pub', 'hwSub', 'tt'];
export const LISTS = ['leaves', 'tleaves', 'hw', 'datesheet', 'anns', 'events'];
const sigOf = (v) => JSON.stringify(v);

function recMap(c) {
  const o = {};
  if (DICT.indexOf(c) > -1) { const src = DB[c] || {}; Object.keys(src).forEach((k) => { const s = sigOf(src[k]); if (s !== undefined) o[k] = s; }); }
  else (DB[c] || []).forEach((it) => { o[it.id] = sigOf(it); });
  return o;
}
async function fetchAll(table, cols, order) {
  const out = []; let from = 0;
  for (;;) {
    let q = sb.from(table).select(cols);
    order.forEach((o) => { q = q.order(o); });
    const r = await q.range(from, from + 999);
    if (r.error) throw r.error;
    out.push.apply(out, r.data);
    if (r.data.length < 1000) break;
    from += 1000;
  }
  return out;
}

export function pickUser(me) {
  if (!me) return null;
  if (me.role === 'teacher') return DB.teachers.find((t) => t.id === me.id) || null;
  if (me.role === 'parent') return DB.parents.find((p) => p.id === me.id) || null;
  const own = (DB[me.role === 'principal' ? 'principals' : 'admins'] || []).find((p) => p.id === me.id);
  const base = { id: me.id, name: me.full_name, phone: me.phone || '', user: me.username, active: true, photo: own ? own.photo : '' };
  // the principal's records are stored under the id "p0"
  return me.role === 'principal' ? Object.assign(base, { id: 'p0', realId: me.id }) : base;
}

export async function loadCore() {
  const all = await Promise.all([
    fetchAll('subjects', 'code,name', ['code']),
    fetchAll('classes', 'id,name,level,room,class_teacher,subjects', ['id']),
    fetchAll('students', 'id,full_name,roll,class_id,active,photo', ['id']),
    fetchAll('parent_students', 'parent_id,student_id', ['parent_id', 'student_id']),
    fetchAll('teacher_assignments', 'teacher_id,class_id,subject_code', ['class_id', 'subject_code']),
    fetchAll('profiles', 'id,username,full_name,phone,role,relation,active,photo', ['id']),
  ]);
  const [subj, cl, st, ps, ta, prof] = all;
  Object.keys(SUBJ).forEach((k) => { delete SUBJ[k]; }); subj.forEach((s) => { SUBJ[s.code] = s.name; });
  CLASSES.length = 0; cl.forEach((c) => CLASSES.push({ id: c.id, name: c.name, level: c.level, ct: c.class_teacher || '', subjects: c.subjects.slice(), room: c.room || '' }));
  DB.students = st.map((s) => ({ id: s.id, name: s.full_name, roll: s.roll, cid: s.class_id, active: s.active, photo: s.photo || '' }));
  const kids = {}, asg = {};
  ps.forEach((x) => { (kids[x.parent_id] = kids[x.parent_id] || []).push(x.student_id); });
  ta.forEach((x) => { (asg[x.teacher_id] = asg[x.teacher_id] || []).push([x.class_id, x.subject_code]); });
  const base = (p) => ({ id: p.id, name: p.full_name, phone: p.phone || '', user: p.username, active: p.active, photo: p.photo || '' });
  DB.teachers = prof.filter((p) => p.role === 'teacher').map((p) => Object.assign(base(p), { assign: asg[p.id] || [] }));
  DB.parents = prof.filter((p) => p.role === 'parent').map((p) => Object.assign(base(p), { rel: p.relation || 'Father', kids: kids[p.id] || [] }));
  DB.principals = prof.filter((p) => p.role === 'principal').map(base);
  DB.admins = prof.filter((p) => p.role === 'admin').map(base);
  if (S.me) { const u = pickUser(S.me.profile); if (u) S.user = u; }
}
export async function loadRecords() {
  const rows = await fetchAll('records', 'collection,id,data', ['collection', 'id']);
  DICT.forEach((c) => { DB[c] = {}; }); LISTS.forEach((c) => { DB[c] = []; });
  rows.forEach((r) => {
    if (DICT.indexOf(r.collection) > -1) DB[r.collection][r.id] = r.data;
    else if (LISTS.indexOf(r.collection) > -1) DB[r.collection].push(r.data);
  });
  LISTS.forEach((c) => DB[c].sort((a, b) => { const x = a.ts || '', y = b.ts || ''; return x < y ? 1 : x > y ? -1 : 0; }));
  SYNC.last = {}; DICT.concat(LISTS).forEach((c) => { SYNC.last[c] = recMap(c); });
}

export async function sync() {
  if (!LIVE || !S.user) return;
  if (SYNC.busy) { SYNC.again = true; return; }
  SYNC.busy = true;
  try {
    do {
      SYNC.again = false;
      const cols = DICT.concat(LISTS);
      for (let ci = 0; ci < cols.length; ci++) {
        const c = cols[ci], cur = recMap(c), last = SYNC.last[c] || (SYNC.last[c] = {}), up = [], del = [];
        Object.keys(cur).forEach((id) => { if (last[id] !== cur[id]) up.push(id); });
        Object.keys(last).forEach((id) => { if (!(id in cur)) del.push(id); });
        for (let i = 0; i < up.length; i += 200) {
          const chunk = up.slice(i, i + 200);
          const rows = chunk.map((id) => ({ collection: c, id, data: JSON.parse(cur[id]), updated_at: new Date().toISOString() }));
          const r = await sb.from('records').upsert(rows, { onConflict: 'collection,id' });
          if (r.error) throw r.error;
          chunk.forEach((id) => { last[id] = cur[id]; });
        }
        for (let i = 0; i < del.length; i += 100) {
          const chunk = del.slice(i, i + 100);
          const r = await sb.from('records').delete().eq('collection', c).in('id', chunk);
          if (r.error) throw r.error;
          chunk.forEach((id) => { delete last[id]; });
        }
      }
    } while (SYNC.again);
    SYNC.failed = false;
  } catch (e) {
    SYNC.failed = true; console.error('Save failed', e);
    if (e && e.code === '42501') {
      toast('You do not have permission to make that change. It was undone.');
      try { await loadRecords(); SYNC.failed = false; paint(); } catch (x) { /* ignore */ }
    } else {
      toast('Could not save to the database. Check your internet. Trying again soon.');
      clearTimeout(SYNC.timer); SYNC.timer = setTimeout(sync, 8000);
    }
  } finally { SYNC.busy = false; }
}
export function scheduleSync() { if (!LIVE || !S.user) return; clearTimeout(SYNC.timer); SYNC.timer = setTimeout(sync, 500); }
setSyncHook(scheduleSync);
export async function flushSync() {
  clearTimeout(SYNC.timer); SYNC.again = false; let n = 0;
  while (SYNC.busy && n++ < 50) await new Promise((r) => setTimeout(r, 100));
  await sync();
}
export function hasPending() {
  const cols = DICT.concat(LISTS);
  for (let i = 0; i < cols.length; i++) {
    const cur = recMap(cols[i]), last = SYNC.last[cols[i]] || {};
    for (const id in cur) if (last[id] !== cur[id]) return true;
    for (const id in last) if (!(id in cur)) return true;
  }
  return false;
}
export async function refresh() {
  if (!LIVE || !S.user || document.hidden || SYNC.busy || SYNC.refreshing) return;
  if (iso(new Date()) !== TODAY) { location.reload(); return; }
  SYNC.refreshing = true;
  try {
    await sync(); if (SYNC.failed || hasPending()) return;
    await loadRecords(); await loadCore(); paint();
  } catch (e) { console.error('Refresh failed', e); }
  finally { SYNC.refreshing = false; }
}
export const startPolling = () => { stopPolling(); SYNC.poll = setInterval(refresh, 45000); };
export const stopPolling = () => { if (SYNC.poll) { clearInterval(SYNC.poll); SYNC.poll = null; } };
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

/* ---------- read marks (notification bell) ---------- */
const readsKey = (id) => 'fgc.reads.' + id;
export function loadReads(id) { try { return JSON.parse(localStorage.getItem(readsKey(id)) || '{}') || {}; } catch (e) { return {}; } }
export function saveReads() { if (!LIVE || !S.user) return; try { localStorage.setItem(readsKey(S.user.id), JSON.stringify(S.reads[S.user.id] || {})); } catch (e) { /* ignore */ } }

/* ---------- sign in and out ---------- */
export async function enterApp(expect) {
  const ss = await sb.auth.getSession();
  const session = ss.data && ss.data.session;
  if (!session) return 'Please sign in.';
  const q = await sb.from('profiles').select('id,username,full_name,phone,role,relation,active').eq('id', session.user.id).maybeSingle();
  const me = q.data;
  if (q.error || !me) return 'This account is not set up for FG Campus yet. Please contact the school office.';
  if (!me.active) return 'This account is inactive. Please contact the school office.';
  if (expect && me.role !== expect) return 'This is ' + (/^[aeiou]/.test(me.role) ? 'an ' : 'a ') + me.role + ' account. Choose "' + cap(me.role) + '" above and sign in again.';
  S.me = { id: me.id, role: me.role, profile: me };
  await loadCore(); await loadRecords();
  const u = pickUser(me);
  if (!u) { S.me = null; return 'Your account could not be loaded. Please try again.'; }
  S.user = u; S.role = me.role; S.lrole = me.role; S.view = NAVS[me.role].items[0][0]; S.f = {}; S.child = null; S.workKey = '';
  S.reads[u.id] = loadReads(u.id);
  startPolling(); render();
  return true;
}
export function resetData() {
  CLASSES.length = 0; Object.keys(SUBJ).forEach((k) => { delete SUBJ[k]; });
  DB.teachers = []; DB.parents = []; DB.students = []; DB.principals = []; DB.admins = [];
  DICT.forEach((c) => { DB[c] = {}; }); LISTS.forEach((c) => { DB[c] = []; });
  SYNC.last = {}; S.me = null;
}

// Returns an error message, or '' on success.
export async function login(role, username, password) {
  const u = (username || '').trim().toLowerCase();
  if (!u || !password) return 'Enter your username and password.';
  if (DEMO) {
    const pool = role === 'admin' ? DB.admins : role === 'principal' ? DB.principals : role === 'teacher' ? DB.teachers : DB.parents;
    const m = pool.find((x) => x.user === u && x.pass === password);
    if (!m) return 'Wrong username or password for the ' + role + ' login.';
    if (m.active === false) return 'This account is inactive. Please contact the school office.';
    S.user = role === 'principal' ? Object.assign({}, m, { id: 'p0' }) : m; S.role = role; S.view = NAVS[role].items[0][0]; S.f = {}; S.child = null; S.workKey = '';
    S.reads[S.user.id] = S.reads[S.user.id] || {}; render(); return '';
  }
  try {
    const em = await sb.rpc('login_email', { p_username: u });
    if (em.error) throw em.error;
    if (!em.data) return 'Wrong username or password.';
    const si = await sb.auth.signInWithPassword({ email: em.data, password });
    if (si.error) return /banned/i.test(si.error.message) ? 'This account is inactive. Please contact the school office.' : 'Wrong username or password.';
    const res = await enterApp(role);
    if (res !== true) { await sb.auth.signOut(); resetData(); return res; }
    return '';
  } catch (e) { console.error(e); return 'Could not reach the server. Check your internet and try again.'; }
}
export async function demoLogin(role, username) {
  try {
    const res = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', role, username: role === 'admin' ? '' : username }) });
    const j = await res.json();
    if (!j.ok || !j.token_hash) return j.error || 'Could not sign in.';
    const vo = await sb.auth.verifyOtp({ token_hash: j.token_hash, type: 'magiclink' });
    if (vo.error) return 'Could not sign in. Please try again.';
    const out = await enterApp(role);
    if (out !== true) { await sb.auth.signOut(); resetData(); return out; }
    return '';
  } catch (e) { console.error(e); return 'Could not reach the server. Check your internet and try again.'; }
}
export async function logout() {
  if (LIVE) { stopPolling(); try { await flushSync(); } catch (e) { /* ignore */ } try { await sb.auth.signOut(); } catch (e) { /* ignore */ } resetData(); }
  S.user = null; S.role = null; render();
}
export async function init() {
  if (LIVE) {
    S.booting = true; paint();
    try {
      const dr = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) });
      const dj = await dr.json(); S.demoUsers = dj && dj.ok && dj.enabled ? dj.users : null;
    } catch (e) { S.demoUsers = null; }
    try {
      const ss = await sb.auth.getSession();
      if (ss.data && ss.data.session) { const r = await enterApp(); if (r !== true) { await sb.auth.signOut(); resetData(); } }
    } catch (e) { console.error(e); }
    S.booting = false;
  }
  paint();
}
