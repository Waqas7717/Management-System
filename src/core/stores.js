// All writes to students, accounts, classes and subjects. liveStore talks to Supabase
// (and the /api/admin function for logins); demoStore edits the in-memory sample data.
import { DEMO } from './config';
import { DB, S, CLASSES, SUBJ, cls, stu, uid, ROLE_LIST, allUsers } from './data';
import { sb, loadCore, sync } from './sync';

async function callAdmin(action, payload) {
  const ss = await sb.auth.getSession();
  const token = ss.data && ss.data.session ? ss.data.session.access_token : '';
  let res, j = null;
  try {
    res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(Object.assign({ action }, payload)) });
    j = await res.json();
  } catch (e) { if (!res) throw new Error('Could not reach the server. Check your internet.'); }
  if (!res || !res.ok || !j || !j.ok) throw new Error((j && j.error) || 'The server could not finish this (' + (res ? res.status : 'no reply') + '). Is the /api/admin function deployed?');
  return j;
}
function dbErr(r, map) {
  if (!r.error) return r;
  const m = (map && map[r.error.code]) || r.error.message || 'Database error.';
  throw new Error(m);
}

const liveStore = {
  async saveMyPhoto(photo) {
    const r = await sb.from('profiles').update({ photo }).eq('id', S.user.realId || S.user.id).select('id');
    dbErr(r);
    if (!r.data || !r.data.length) throw new Error('This account cannot change its photo. Ask the school admin.');
    await loadCore();
  },
  async saveStudent(id, v) {
    const row = { full_name: v.name, class_id: v.cid, roll: v.roll };
    if (v.photo !== undefined) row.photo = v.photo;
    dbErr(id ? await sb.from('students').update(row).eq('id', id) : await sb.from('students').insert(row), { 23505: 'This roll number is already used in that class.' });
    await loadCore();
  },
  async setStudentActive(id, on) { dbErr(await sb.from('students').update({ active: on }).eq('id', id)); await loadCore(); },
  async removeStudent(id) {
    dbErr(await sb.from('students').delete().eq('id', id));
    DB.leaves = DB.leaves.filter((l) => l.sid !== id);
    await loadCore(); await sync();
  },
  async saveAccount(role, id, v) {
    if (!id) {
      const j = await callAdmin('createUser', { role, username: v.username, password: v.password, full_name: v.name, phone: v.phone, relation: v.rel });
      let photoFailed = false;
      if (v.photo) { const r = await sb.from('profiles').update({ photo: v.photo }).eq('id', j.id); if (r.error) photoFailed = true; }
      await loadCore(); return { id: j.id, photoFailed };
    }
    const cur = ROLE_LIST[role]().find((x) => x.id === id);
    const p = { id, full_name: v.name, phone: v.phone, relation: role === 'parent' ? v.rel : undefined };
    if (cur && cur.user !== v.username) p.username = v.username;
    await callAdmin('updateUser', p);
    if (v.photo !== undefined) dbErr(await sb.from('profiles').update({ photo: v.photo }).eq('id', id));
    await loadCore(); return { id };
  },
  async setKids(pid, kids) {
    const cur = (DB.parents.find((p) => p.id === pid) || { kids: [] }).kids;
    const add = kids.filter((k) => cur.indexOf(k) < 0), rem = cur.filter((k) => kids.indexOf(k) < 0);
    if (add.length) dbErr(await sb.from('parent_students').insert(add.map((k) => ({ parent_id: pid, student_id: k }))));
    for (let i = 0; i < rem.length; i++) dbErr(await sb.from('parent_students').delete().eq('parent_id', pid).eq('student_id', rem[i]));
    await loadCore();
  },
  async setAssignments(tid, pairs) {
    const cur = (DB.teachers.find((t) => t.id === tid) || { assign: [] }).assign;
    const rem = cur.filter((a) => !pairs.some((x) => x[0] === a[0] && x[1] === a[1]));
    for (let i = 0; i < rem.length; i++) dbErr(await sb.from('teacher_assignments').delete().eq('class_id', rem[i][0]).eq('subject_code', rem[i][1]).eq('teacher_id', tid));
    if (pairs.length) dbErr(await sb.from('teacher_assignments').upsert(pairs.map((a) => ({ teacher_id: tid, class_id: a[0], subject_code: a[1] })), { onConflict: 'class_id,subject_code' }));
    await loadCore();
  },
  async setActive(role, id, on) { await callAdmin('setActive', { id, active: on }); await loadCore(); },
  async resetPassword(role, id, pw) { await callAdmin('resetPassword', { id, password: pw }); },
  async removeAccount(role, id) {
    await callAdmin('deleteUser', { id });
    if (role === 'teacher') DB.tleaves = DB.tleaves.filter((l) => l.tid !== id);
    await loadCore(); await sync();
  },
  async saveClass(id, v) {
    const row = { name: v.name, level: v.level, room: v.room, class_teacher: v.ct || null, subjects: v.subjects };
    if (id) {
      dbErr(await sb.from('classes').update(row).eq('id', id));
      dbErr(await sb.from('teacher_assignments').delete().eq('class_id', id).not('subject_code', 'in', '(' + v.subjects.join(',') + ')'));
    } else dbErr(await sb.from('classes').insert(Object.assign({ id: v.id }, row)), { 23505: 'A class with this name already exists.' });
    await loadCore();
  },
  async removeClass(id) { dbErr(await sb.from('classes').delete().eq('id', id), { 23503: 'Move or remove the students in this class first.' }); await loadCore(); },
  async saveSubject(code, name, isNew) {
    dbErr(isNew ? await sb.from('subjects').insert({ code, name }) : await sb.from('subjects').update({ name }).eq('code', code), { 23505: 'A subject with this name already exists.' });
    await loadCore();
  },
  async removeSubject(code) { dbErr(await sb.from('subjects').delete().eq('code', code)); await loadCore(); },
};

const demoStore = {
  async saveMyPhoto(photo) {
    S.user.photo = photo;
    ['admins', 'teachers', 'parents', 'principals'].forEach((k) => (DB[k] || []).forEach((x) => { if (x.id === S.user.id) x.photo = photo; }));
  },
  async saveStudent(id, v) {
    if (DB.students.some((x) => x.cid === v.cid && x.roll === v.roll && x.id !== id)) throw new Error('This roll number is already used in that class.');
    if (id) { const s = stu(id); s.name = v.name; s.cid = v.cid; s.roll = v.roll; if (v.photo !== undefined) s.photo = v.photo; }
    else DB.students.push({ id: 's' + uid(), name: v.name, roll: v.roll, cid: v.cid, active: true, ab: 0.05, skill: 0.6, photo: v.photo || '' });
  },
  async setStudentActive(id, on) { stu(id).active = on; },
  async removeStudent(id) { DB.students = DB.students.filter((s) => s.id !== id); DB.parents.forEach((p) => { p.kids = p.kids.filter((k) => k !== id); }); DB.leaves = DB.leaves.filter((l) => l.sid !== id); },
  async saveAccount(role, id, v) {
    const list = ROLE_LIST[role]();
    if (allUsers().some((x) => x.user === v.username && x.id !== id)) throw new Error('This username is already taken. Choose another.');
    let o = id ? list.find((x) => x.id === id) : null;
    if (!o) { o = { id: ({ parent: 'par', teacher: 't', principal: 'pr' }[role]) + uid(), active: true, pass: v.password }; if (role === 'teacher') o.assign = []; if (role === 'parent') o.kids = []; list.push(o); }
    o.name = v.name; o.phone = v.phone; o.user = v.username; if (role === 'parent') o.rel = v.rel; if (v.photo !== undefined) o.photo = v.photo;
    return { id: o.id };
  },
  async setKids(pid, kids) { DB.parents.find((p) => p.id === pid).kids = kids; },
  async setAssignments(tid, pairs) {
    DB.teachers.forEach((o) => { o.assign = o.assign.filter((a) => !pairs.some((x) => x[0] === a[0] && x[1] === a[1])); });
    DB.teachers.find((t) => t.id === tid).assign = pairs;
  },
  async setActive(role, id, on) { ROLE_LIST[role]().find((x) => x.id === id).active = on; },
  async resetPassword(role, id, pw) { ROLE_LIST[role]().find((x) => x.id === id).pass = pw; },
  async removeAccount(role, id) {
    if (role === 'parent') DB.parents = DB.parents.filter((x) => x.id !== id);
    else if (role === 'teacher') { DB.teachers = DB.teachers.filter((x) => x.id !== id); DB.tleaves = DB.tleaves.filter((l) => l.tid !== id); CLASSES.forEach((c) => { if (c.ct === id) c.ct = ''; }); }
    else DB.principals = DB.principals.filter((x) => x.id !== id);
  },
  async saveClass(id, v) {
    if (id) { const c = cls(id); c.name = v.name; c.level = v.level; c.room = v.room; c.ct = v.ct || ''; c.subjects = v.subjects.slice(); DB.teachers.forEach((t) => { t.assign = t.assign.filter((a) => a[0] !== id || v.subjects.indexOf(a[1]) > -1); }); }
    else CLASSES.push({ id: v.id, name: v.name, level: v.level, room: v.room, ct: v.ct || '', subjects: v.subjects.slice() });
  },
  async removeClass(id) {
    if (DB.students.some((s) => s.cid === id)) throw new Error('Move or remove the students in this class first.');
    const i = CLASSES.findIndex((c) => c.id === id); if (i > -1) CLASSES.splice(i, 1);
    DB.teachers.forEach((t) => { t.assign = t.assign.filter((a) => a[0] !== id); });
  },
  async saveSubject(code, name, isNew) { if (isNew && SUBJ[code]) throw new Error('A subject with this name already exists.'); SUBJ[code] = name; },
  async removeSubject(code) { delete SUBJ[code]; DB.teachers.forEach((t) => { t.assign = t.assign.filter((a) => a[1] !== code); }); },
};
export const store = DEMO ? demoStore : liveStore;
