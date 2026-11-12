// Shared data, lookups and calculations. Written as plain functions over the mutable
// DB / S objects so the same logic runs for the demo data and for the live database.
// UI components re-render through `render()` (see store.js).
import { DEMO } from './config';
import {
  TODAY, HIST, ALLD, addDays, isSchool, dow, nowHM,
} from './dates';

export function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261109);
const rint = (a, b) => a + Math.floor(R() * (b - a + 1));
const pad2 = (n) => ('0' + n).slice(-2);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const money = (n) => 'PKR ' + n.toLocaleString('en-US');

/* ---------- master data ---------- */
export const CLASSES = !DEMO ? [] : [
  { id: '9A', name: 'Class 9-A', level: 'school', ct: 't1', subjects: ['math', 'eng', 'urdu', 'phy', 'bio'], room: 'Room 12' },
  { id: '10A', name: 'Class 10-A', level: 'school', ct: 't2', subjects: ['math', 'eng', 'urdu', 'chem', 'isl'], room: 'Room 14' },
  { id: 'FSC1', name: 'FSc Part 1', level: 'college', ct: 't3', subjects: ['phy', 'chem', 'math', 'eng', 'comp'], room: 'Block B' },
];
export const SUBJ = !DEMO ? {} : { math: 'Mathematics', eng: 'English', urdu: 'Urdu', phy: 'Physics', chem: 'Chemistry', bio: 'Biology', isl: 'Islamiat', comp: 'Computer Science' };
export const cls = (id) => CLASSES.find((c) => c.id === id);
export const DB = {};
DB.teachers = !DEMO ? [] : [
  { id: 't1', name: 'Imran Qureshi', phone: '0300-5551201', user: 'imran', pass: 'teach123', active: true, assign: [['9A', 'math'], ['10A', 'math']] },
  { id: 't2', name: 'Sana Javed', phone: '0301-5551202', user: 'sana', pass: 'teach123', active: true, assign: [['9A', 'eng'], ['10A', 'eng'], ['FSC1', 'eng']] },
  { id: 't3', name: 'Nadeem Abbasi', phone: '0302-5551203', user: 'nadeem', pass: 'teach123', active: true, assign: [['9A', 'phy'], ['FSC1', 'phy']] },
  { id: 't4', name: 'Rubina Aslam', phone: '0303-5551204', user: 'rubina', pass: 'teach123', active: true, assign: [['9A', 'urdu'], ['10A', 'urdu'], ['10A', 'isl']] },
  { id: 't5', name: 'Khalid Mehmood', phone: '0304-5551205', user: 'khalid', pass: 'teach123', active: true, assign: [['10A', 'chem'], ['FSC1', 'chem'], ['FSC1', 'math']] },
  { id: 't6', name: 'Ayesha Siddiqui', phone: '0305-5551206', user: 'ayesha', pass: 'teach123', active: true, assign: [['9A', 'bio'], ['FSC1', 'comp']] },
];
DB.principals = !DEMO ? [] : [{ id: 'p0', name: 'Dr. Farhan Ahmed', phone: '0300-5550000', user: 'principal', pass: 'prin123', active: true }];
DB.admins = !DEMO ? [] : [{ id: 'ad1', name: 'School Admin', phone: '0300-5550001', user: 'admin', pass: 'admin123', active: true }];
const NAMES = {
  '9A': ['Ahmed Raza', 'Ayesha Khan', 'Bilal Hussain', 'Fatima Zahra', 'Hamza Ali', 'Iqra Noor', 'Kamran Shah', 'Maryam Tariq', 'Naveed Iqbal', 'Rabia Aslam', 'Saad Mehmood', 'Zainab Malik'],
  '10A': ['Usman Ghani', 'Hira Batool', 'Faizan Ahmed', 'Sidra Parveen', 'Talha Mirza', 'Mehwish Anwar', 'Zeeshan Haider', 'Anum Fatima', 'Daniyal Butt', 'Laiba Sohail', 'Shahzaib Khan', 'Nimra Yousaf'],
  FSC1: ['Awais Qadir', 'Khadija Rehman', 'Hassan Javed', 'Hamna Khan', 'Rizwan Ullah', 'Aleena Chaudhry', 'Junaid Akhtar', 'Hafsa Tahir', 'Moiz Siddiqui', 'Eman Fatima', 'Taimoor Khalid', 'Ramsha Nadeem'],
};
DB.students = []; DB.parents = [];
if (DEMO) {
  let sn = 0;
  CLASSES.forEach((c) => NAMES[c.id].forEach((nm, i) => { sn++; DB.students.push({ id: 's' + sn, name: nm, roll: i + 1, cid: c.id, active: true, ab: 0.02 + R() * 0.08, skill: 0.45 + R() * 0.5 }); }));
  const FATH = ['Naseer', 'Aslam', 'Javed', 'Riaz', 'Shabbir', 'Mushtaq', 'Anwar', 'Farooq', 'Ghulam', 'Iftikhar', 'Zahid', 'Munir'];
  DB.parents.push({ id: 'par1', name: 'Tariq Khan', phone: '0300-5550123', rel: 'Father', user: 'parent1', pass: 'parent123', kids: ['s2', 's28'], active: true });
  let pn = 1;
  DB.students.forEach((s) => {
    if (s.id === 's2' || s.id === 's28') return;
    pn++;
    DB.parents.push({ id: 'par' + pn, name: FATH[pn % FATH.length] + ' ' + s.name.split(' ').pop(), phone: '03' + rint(10, 45) + '-' + rint(1000000, 9999999), rel: 'Father', user: 'parent' + pn, pass: 'parent123', kids: [s.id], active: true });
  });
}

/* ---------- lookups ---------- */
export const stu = (id) => DB.students.find((s) => s.id === id);
export const tch = (id) => DB.teachers.find((t) => t.id === id) || { id, name: 'Former teacher', phone: '', user: '', active: false, assign: [] };
export const ttCell = (cid, i, p) => {
  const c = cls(cid); if (!c) return null;
  const t = DB.tt && DB.tt[cid], v = t && t.days && t.days[i] && t.days[i][p - 1];
  return v && c.subjects.indexOf(v) > -1 ? v : c.subjects[(p - 1 + i) % 5];
};
export const subjAt = (cid, d, p) => (isSchool(d) ? ttCell(cid, dow(d), p) : null);
export const teacherFor = (cid, sub) => DB.teachers.find((t) => t.assign.some((a) => a[0] === cid && a[1] === sub)) || { id: '', name: 'Unassigned' };
export const kidsOf = (p) => DB.students.filter((s) => p.kids.includes(s.id) && s.active);
export const tClasses = (t) => t.assign.map((a) => a[0]).filter((v, i, a) => a.indexOf(v) === i);
export const parentsOf = (sid) => DB.parents.filter((p) => p.kids.includes(sid));
export const byName = (id) => (id === 'p0' ? 'Principal' : (DB.admins && DB.admins.some((x) => x.id === id) ? 'School Admin' : (DB.principals && DB.principals.some((x) => x.id === id) ? 'Principal' : (tch(id) ? tch(id).name : 'School office'))));
export const subName = (s) => SUBJ[s] || s;
export const ttDays = (cid) => [0, 1, 2, 3, 4].map((i) => [1, 2, 3, 4, 5].map((p) => ttCell(cid, i, p)));

/* ---------- attendance seed ---------- */
DB.att = {};
if (DEMO) {
  HIST.concat([TODAY]).forEach((d) => CLASSES.forEach((c) => {
    const st = DB.students.filter((s) => s.cid === c.id);
    const dayAbs = {}, part = {};
    st.forEach((s) => { if (R() < s.ab) dayAbs[s.id] = true; else if (R() < 0.04) part[s.id] = rint(1, 5); });
    if (d === TODAY) { dayAbs.s9 = true; }
    for (let p = 1; p <= 5; p++) {
      if (d === TODAY) { const t = teacherFor(c.id, subjAt(c.id, d, p)); if (t.id === 't1' || t.id === 't6') continue; }
      const rec = {}; st.forEach((s) => { rec[s.id] = (dayAbs[s.id] || part[s.id] === p) ? 'A' : 'P'; });
      DB.att[d + '|' + c.id + '|' + p] = rec;
    }
  }));
}

/* ---------- leaves ---------- */
DB.leaves = !DEMO ? [] : [
  { id: 'l1', sid: 's2', type: 'full', from: '2026-11-03', to: '2026-11-03', lectures: [], reason: 'Fever and sore throat, doctor advised rest.', attach: 'medical-note.jpg', status: 'approved', remark: 'Get well soon.', ts: '2026-11-02T19:10' },
  { id: 'l2', sid: 's2', type: 'half2', from: '2026-11-10', to: '2026-11-10', lectures: [], reason: 'Dentist appointment in the afternoon.', attach: '', status: 'pending', remark: '', ts: '2026-11-08T21:05' },
  { id: 'l3', sid: 's5', type: 'multi', from: '2026-11-04', to: '2026-11-05', lectures: [], reason: 'Family wedding out of city.', attach: '', status: 'approved', remark: 'Approved. Please collect the notes.', ts: '2026-11-02T10:00' },
  { id: 'l4', sid: 's9', type: 'full', from: TODAY, to: TODAY, lectures: [], reason: 'Stomach pain since last night.', attach: '', status: 'pending', remark: '', ts: '2026-11-09T07:20' },
  { id: 'l5', sid: 's28', type: 'full', from: '2026-11-06', to: '2026-11-06', lectures: [], reason: 'Family function.', attach: '', status: 'declined', remark: 'Please apply in advance. Exams are close.', ts: '2026-11-05T18:00' },
  { id: 'l6', sid: 's14', type: 'lectures', from: '2026-11-10', to: '2026-11-10', lectures: [4, 5], reason: 'Eye check-up at the hospital.', attach: '', status: 'pending', remark: '', ts: '2026-11-09T06:45' },
];
DB.tleaves = !DEMO ? [] : [
  { id: 'tl1', tid: 't6', type: 'Medical', from: TODAY, to: TODAY, reason: 'Fever.', status: 'approved', remark: 'Rest well.', ts: '2026-11-08T22:00' },
  { id: 'tl2', tid: 't3', type: 'Casual', from: '2026-11-12', to: '2026-11-13', reason: 'Family event in Lahore.', status: 'pending', remark: '', ts: '2026-11-08T17:30' },
  { id: 'tl3', tid: 't2', type: 'Casual', from: '2026-10-22', to: '2026-10-22', reason: 'Personal work.', status: 'approved', remark: 'Approved.', ts: '2026-10-20T11:00' },
];
export const coversL = (l, d, p) => {
  if (d < l.from || d > l.to) return false;
  if (l.type === 'full' || l.type === 'multi') return true;
  if (l.type === 'half1') return p <= 3;
  if (l.type === 'half2') return p >= 4;
  return l.lectures.includes(p);
};
export const effStatus = (sid, d, p) => {
  if (DB.leaves.some((l) => l.sid === sid && l.status === 'approved' && coversL(l, d, p))) return 'L';
  const s = stu(sid); const r = DB.att[d + '|' + s.cid + '|' + p];
  return r && r[sid] ? r[sid] : null;
};

/* ---------- teacher attendance seed ---------- */
DB.tatt = {};
DB.tt = {};
if (DEMO) {
  HIST.concat([TODAY]).forEach((d) => DB.teachers.forEach((t) => {
    if (d === TODAY && (t.id === 't1' || t.id === 't6')) return;
    if (d !== TODAY && R() < 0.04) return;
    DB.tatt[t.id + '|' + d] = { in: R() < 0.75 ? '07:' + pad2(rint(40, 59)) : '08:' + pad2(rint(0, 14)), out: d === TODAY ? '' : '14:' + pad2(rint(0, 40)) };
  }));
}
export const tLeaveCovers = (tid, d) => DB.tleaves.some((l) => l.tid === tid && l.status === 'approved' && d >= l.from && d <= l.to);
export const tStatus = (tid, d) => {
  if (!isSchool(d)) return null;
  if (tLeaveCovers(tid, d)) return 'L';
  if (DB.tatt[tid + '|' + d]) return 'P';
  return d < TODAY ? 'A' : null;
};

/* ---------- exams and results ---------- */
export const EXAMS = [{ id: 'e1', name: 'Monthly Test (September)' }, { id: 'e2', name: 'First Term (October)' }, { id: 'e3', name: 'Monthly Test (November)' }];
DB.res = {}; DB.pub = {};
if (DEMO) {
  ['e1', 'e2'].forEach((e) => CLASSES.forEach((c) => c.subjects.forEach((sb) => {
    const o = {};
    DB.students.filter((s) => s.cid === c.id).forEach((s) => { o[s.id] = Math.max(18, Math.min(99, Math.round(s.skill * 100 + rint(-9, 9) + (e === 'e2' ? rint(-3, 6) : 0)))); });
    DB.res[e + '|' + c.id + '|' + sb] = o; DB.pub[e + '|' + c.id + '|' + sb] = true;
  })));
}
export const gradeOf = (p) => (p == null ? '-' : p >= 80 ? 'A1' : p >= 70 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 40 ? 'D' : p >= 33 ? 'E' : 'F');
export const gcls = (p) => (p == null ? '' : p >= 60 ? 'ok' : p >= 40 ? 'warn' : 'bad');
export const isPub = (e, c, s) => !!DB.pub[e + '|' + c + '|' + s];
export function stuResult(e, s) {
  const c = cls(s.cid);
  const rows = c.subjects.map((sb) => { const pb = isPub(e, s.cid, sb); const m = (DB.res[e + '|' + s.cid + '|' + sb] || {})[s.id]; return { sub: sb, pub: pb, m: (pb && m !== '' && m != null) ? +m : null }; });
  const got = rows.filter((r) => r.m !== null); const tot = got.reduce((a, r) => a + r.m, 0);
  return { rows, tot, n: got.length, pct: got.length ? tot / got.length : null, complete: got.length === rows.length, pass: got.length > 0 && got.every((r) => r.m >= 33) };
}
export function ranks(e, cid) {
  const list = DB.students.filter((s) => s.cid === cid && s.active).map((s) => ({ id: s.id, r: stuResult(e, s) })).filter((x) => x.r.complete).sort((a, b) => b.r.tot - a.r.tot);
  const o = {}; list.forEach((x, i) => { o[x.id] = i + 1; }); return { map: o, count: list.length };
}
export const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);
export const latestExam = () => { for (const e of ['e3', 'e2', 'e1']) { if (Object.keys(DB.pub).some((k) => k.indexOf(e + '|') === 0 && DB.pub[k])) return e; } return 'e1'; };
export const classAvg = (e, cid) => { const v = DB.students.filter((s) => s.cid === cid && s.active).map((s) => stuResult(e, s)).filter((r) => r.n); return v.length ? v.reduce((a, r) => a + r.pct, 0) / v.length : null; };
export const classPass = (e, cid) => { const v = DB.students.filter((s) => s.cid === cid && s.active).map((s) => stuResult(e, s)).filter((r) => r.n); return v.length ? v.filter((r) => r.pass).length / v.length * 100 : null; };
export function subjAvg(e, sb, cids) {
  let t = 0, n = 0;
  cids.forEach((cid) => {
    if (!cls(cid).subjects.includes(sb) || !isPub(e, cid, sb)) return;
    const o = DB.res[e + '|' + cid + '|' + sb] || {};
    DB.students.filter((s) => s.cid === cid && s.active).forEach((s) => { if (o[s.id] !== '' && o[s.id] != null) { t += +o[s.id]; n++; } });
  });
  return n ? t / n : null;
}

/* ---------- attendance maths ---------- */
export function agg(sids, dates, sub) {
  const o = { P: 0, A: 0, L: 0 };
  sids.forEach((sid) => { const s = stu(sid); dates.forEach((d) => { for (let p = 1; p <= 5; p++) { if (sub && subjAt(s.cid, d, p) !== sub) continue; const x = effStatus(sid, d, p); if (x) o[x]++; } }); });
  o.pct = (o.P + o.A) ? o.P / (o.P + o.A) * 100 : null; return o;
}
export function dayStatus(sid, d) {
  if (!isSchool(d)) return null;
  const a = []; for (let p = 1; p <= 5; p++) { const x = effStatus(sid, d, p); if (x) a.push(x); }
  if (!a.length) return null; if (a.every((x) => x === 'P')) return 'P'; if (a.every((x) => x === 'A')) return 'A'; if (a.every((x) => x === 'L')) return 'L'; return 'M';
}
export function lectures(sid, d) {
  const s = stu(sid); if (!isSchool(d)) return [];
  const o = []; for (let p = 1; p <= 5; p++) { const sb = subjAt(s.cid, d, p); o.push({ p, sub: sb, t: teacherFor(s.cid, sb), st: effStatus(sid, d, p) }); } return o;
}

/* ---------- homework, date sheets, notices ---------- */
DB.hw = !DEMO ? [] : [
  { id: 'h1', cid: '9A', sub: 'math', tid: 't1', title: 'Exercise 5.2, Q1 to Q8', desc: 'Solve in your notebook and show all steps.', due: '2026-11-11', file: '', ts: '2026-11-09T08:05' },
  { id: 'h2', cid: '9A', sub: 'eng', tid: 't2', title: 'Essay: My Role Model', desc: 'Write about 250 words with an introduction and a conclusion.', due: '2026-11-12', file: '', ts: '2026-11-07T10:20' },
  { id: 'h3', cid: '9A', sub: 'phy', tid: 't3', title: 'Numericals on motion', desc: 'Chapter 2, numericals 1 to 6.', due: '2026-11-10', file: '', ts: '2026-11-06T11:00' },
  { id: 'h4', cid: '9A', sub: 'bio', tid: 't6', title: 'Label the cell diagram', desc: 'Draw and label a plant cell and an animal cell.', due: '2026-11-13', file: 'cell-diagram.pdf', ts: '2026-11-07T09:30' },
  { id: 'h5', cid: '9A', sub: 'math', tid: 't1', title: 'Exercise 4.3 revision', desc: 'Complete all questions.', due: '2026-11-05', file: '', ts: '2026-11-02T09:00' },
  { id: 'h6', cid: 'FSC1', sub: 'phy', tid: 't3', title: 'Lab report: Vernier calipers', desc: 'Write the observation table and result.', due: '2026-11-12', file: '', ts: '2026-11-06T12:00' },
  { id: 'h7', cid: 'FSC1', sub: 'comp', tid: 't6', title: 'C program: factorial', desc: 'Write and run a program for factorial using a loop.', due: '2026-11-11', file: '', ts: '2026-11-07T12:30' },
  { id: 'h8', cid: 'FSC1', sub: 'math', tid: 't5', title: 'Exercise 3.1, differentiation', desc: 'Questions 1 to 10.', due: '2026-11-10', file: '', ts: '2026-11-06T10:10' },
  { id: 'h9', cid: '10A', sub: 'chem', tid: 't5', title: 'Balance 15 equations', desc: 'Worksheet given in class.', due: '2026-11-10', file: '', ts: '2026-11-06T10:40' },
];
DB.hwSub = DEMO ? { h5: {} } : {};
if (DEMO) DB.students.filter((s) => s.cid === '9A').forEach((s) => { if (s.id !== 's5') DB.hwSub.h5[s.id] = true; });
DB.datesheet = [];
if (DEMO) CLASSES.forEach((c) => c.subjects.forEach((sb, i) => DB.datesheet.push({ id: 'd' + uid(), cid: c.id, exam: 'Monthly Test (November)', sub: sb, date: addDays('2026-11-16', i), time: '9:00 am', room: c.room, by: teacherFor(c.id, sb).id })));
DB.anns = !DEMO ? [] : [
  { id: 'a1', kind: 'announcement', type: 'ptm', title: 'Parent-Teacher Meeting', body: 'The PTM will be held on Saturday 14 November from 9:00 am to 12:00 pm. Parents are requested to meet the class teacher and collect the First Term result.', aud: { kind: 'all', cids: [], sids: [] }, by: 'p0', ts: '2026-11-07T10:00', publish: '2026-11-07' },
  { id: 'a2', kind: 'announcement', type: 'event', title: 'Annual Sports Day', body: 'Sports Day will be held on 25 November at the main ground. Participants should report in sports uniform at 8:00 am.', aud: { kind: 'all', cids: [], sids: [] }, by: 'p0', ts: '2026-11-06T12:00', publish: '2026-11-06' },
  { id: 'a3', kind: 'announcement', type: 'urgent', title: 'Registration forms for Class 9-A', body: 'Board registration forms must be returned to the class teacher by Wednesday 11 November.', aud: { kind: 'classes', cids: ['9A'], sids: [] }, by: 'p0', ts: '2026-11-08T09:00', publish: '2026-11-08' },
  { id: 'a4', kind: 'announcement', type: 'notice', title: 'Staff meeting', body: 'Staff meeting on Wednesday at 4:00 pm in the library. Attendance is compulsory.', aud: { kind: 'teachers', cids: [], sids: [] }, by: 'p0', ts: '2026-11-05T11:00', publish: '2026-11-05' },
  { id: 'a5', kind: 'announcement', type: 'test', title: 'Maths test tomorrow', body: 'Class test on chapters 3 and 4 tomorrow in the first lecture. Please revise the formulas.', aud: { kind: 'classes', cids: ['9A'], sids: [] }, by: 't1', ts: '2026-11-09T08:10', publish: TODAY },
  { id: 'n1', kind: 'notice', type: 'notice', title: 'Fee last date', body: 'November fee can be paid without fine until 15 November. After that a late fine applies.', aud: { kind: 'all', cids: [], sids: [] }, by: 'p0', ts: '2026-11-04T09:00', publish: '2026-11-04' },
  { id: 'n2', kind: 'notice', type: 'notice', title: 'Winter uniform', body: 'Winter uniform is compulsory from 16 November.', aud: { kind: 'all', cids: [], sids: [] }, by: 'p0', ts: '2026-11-03T09:00', publish: '2026-11-03' },
  { id: 'n3', kind: 'notice', type: 'event', title: 'Winter break', body: 'The winter break begins on 21 December. Classes resume on 4 January.', aud: { kind: 'all', cids: [], sids: [] }, by: 'p0', ts: '2026-11-09T09:00', publish: '2026-11-20' },
];
DB.events = !DEMO ? [] : [
  { id: 'ev1', ts: '2026-11-09T07:20', title: 'New leave request', text: 'Naveed Iqbal (9-A) requested leave for today.', type: 'leave', to: { role: 'teacher', id: 't1' } },
  { id: 'ev2', ts: '2026-11-08T21:05', title: 'New leave request', text: 'Ayesha Khan (9-A) requested a half day leave for 10 Nov.', type: 'leave', to: { role: 'teacher', id: 't1' } },
  { id: 'ev3', ts: '2026-11-09T06:45', title: 'New leave request', text: 'Eye check-up leave requested for Class 10-A student.', type: 'leave', to: { role: 'teacher', id: 't2' } },
  { id: 'ev4', ts: '2026-11-08T17:30', title: 'Teacher leave request', text: 'Nadeem Abbasi requested leave for 12 and 13 Nov.', type: 'leave', to: { role: 'principal' } },
  { id: 'ev5', ts: '2026-11-02T19:40', title: 'Leave approved', text: 'Ayesha Khan: leave on 3 Nov was approved. Get well soon.', type: 'leave', to: { role: 'parent', id: 'par1' } },
  { id: 'ev6', ts: '2026-11-05T20:00', title: 'Leave declined', text: 'Hamna Khan: leave on 6 Nov was declined. Please apply in advance.', type: 'leave', to: { role: 'parent', id: 'par1' } },
  { id: 'ev7', ts: '2026-11-09T08:05', title: 'New homework', text: 'Mathematics: Exercise 5.2, Q1 to Q8 (due 11 Nov).', type: 'homework', to: { role: 'parent', cids: ['9A'] } },
];
DB.feeCfg = !DEMO ? {} : { '9A': { amt: 1200 }, '10A': { amt: 1200 }, FSC1: { amt: 2000 } };
DB.fees = {};
if (DEMO) {
  const yms = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  DB.students.forEach((s, i) => yms.forEach((m, j) => {
    if (m === '2026-11' && i % 3 !== 0) return;
    if (m === '2026-10' && i % 7 === 0) return;
    if (s.id === 's2' && j > 5) return;
    DB.fees[s.id + '|' + m] = { amt: DB.feeCfg[s.cid].amt, date: m + '-0' + (3 + (i % 5)), by: 'ad1', no: 'FG-' + (100000 + i * 10 + j) };
  }));
}

/* ---------- session state ---------- */
export const S = {
  booting: false, me: null, user: null, role: null, view: null, child: null,
  f: {}, lrole: 'principal', reads: {}, work: {}, workKey: '', demoUsers: null, pwMode: false,
};
export const F = (k, d) => (S.f[k] === undefined ? d : S.f[k]);

export function annVisible(a) {
  const u = S.user, r = S.role;
  if (r === 'principal' || r === 'admin') return true;
  if (a.publish > TODAY) return false;
  const au = a.aud;
  if (r === 'teacher') { if (a.by === u.id) return true; if (au.kind === 'all' || au.kind === 'teachers') return true; if (au.kind === 'classes') return tClasses(u).some((c) => au.cids.includes(c)); return false; }
  if (r === 'parent') { if (au.kind === 'all' || au.kind === 'parents') return true; if (au.kind === 'classes') return kidsOf(u).some((k) => au.cids.includes(k.cid) && (!au.sids || !au.sids.length || au.sids.includes(k.id))); return false; }
  return false;
}
export function evVisible(e) {
  const t = e.to; if (t.role !== S.role) return false; if (t.id && t.id !== S.user.id) return false;
  if (t.cids && S.role === 'parent') return kidsOf(S.user).some((k) => t.cids.includes(k.cid));
  return true;
}
export function feed() {
  const o = [];
  DB.anns.forEach((a) => { if (S.role === 'principal' || S.role === 'admin' || a.by === S.user.id) return; if (annVisible(a)) o.push({ id: 'a' + a.id, ts: a.ts, title: a.title, text: a.body, type: a.type, by: a.by }); });
  DB.events.forEach((e) => { if (evVisible(e)) o.push({ id: 'e' + e.id, ts: e.ts, title: e.title, text: e.text, type: e.type || 'event', by: '' }); });
  return o.sort((a, b) => (a.ts < b.ts ? 1 : -1));
}
export const isRead = (id) => !!(S.reads[S.user.id] || {})[id];
export const unread = () => feed().filter((x) => !isRead(x.id)).length;
export function ev(to, title, text, type) { DB.events.unshift({ id: 'ev' + uid(), ts: TODAY + 'T' + nowHM(), title, text, type: type || 'event', to }); }
export const audLabel = (a) => (a.kind === 'all' ? 'Everyone' : a.kind === 'teachers' ? 'Teachers only' : a.kind === 'parents' ? 'Parents only' : a.cids.map((c) => (cls(c) || { name: 'Removed class' }).name).join(', ') + ((a.sids && a.sids.length) ? ' (selected students)' : ''));
export const TYPEL = { holiday: 'Holiday', notice: 'Notice', ptm: 'PTM', event: 'Event', urgent: 'Urgent', test: 'Test', reminder: 'Reminder', leave: 'Leave', homework: 'Homework' };
export const TYPEC = { holiday: 'warn', notice: 'info', ptm: 'gold', event: 'ok', urgent: 'bad', test: 'warn', reminder: 'info', leave: 'warn', homework: 'ok' };

/* ---------- leave text ---------- */
import { fd as _fd } from './dates';
export const leaveLabel = (l) => (l.type === 'full' ? 'Full day' : l.type === 'half1' ? 'Half day, first half' : l.type === 'half2' ? 'Half day, second half' : l.type === 'lectures' ? 'Lectures ' + l.lectures.join(', ') : 'Multiple days');
export const leaveDates = (l) => (l.from === l.to ? _fd(l.from) : _fd(l.from) + ' to ' + _fd(l.to));

/* ---------- teacher helpers ---------- */
export const classTeacherOf = (t) => CLASSES.filter((c) => c.ct === t.id);
export function myLectures(t, d) {
  const o = [];
  t.assign.forEach((a) => { for (let p = 1; p <= 5; p++) if (subjAt(a[0], d, p) === a[1]) o.push({ p, cid: a[0], sub: a[1] }); });
  return o.sort((a, b) => a.p - b.p);
}
export const lecMarked = (l) => !!DB.att[TODAY + '|' + l.cid + '|' + l.p];
export const myPendingLeaves = (t) => DB.leaves.filter((l) => l.status === 'pending' && classTeacherOf(t).some((c) => c.id === stu(l.sid).cid));
export function markWork(cid, d, p) {
  const key = d + '|' + cid + '|' + p;
  if (S.workKey !== key) { S.workKey = key; S.work = {}; DB.students.filter((s) => s.cid === cid && s.active).forEach((s) => { const e = effStatus(s.id, d, p); if (e) S.work[s.id] = e; }); }
  DB.students.filter((s) => s.cid === cid && s.active).forEach((s) => { if (DB.leaves.some((l) => l.sid === s.id && l.status === 'approved' && coversL(l, d, p))) S.work[s.id] = 'L'; });
  return key;
}

/* ---------- roles ---------- */
export const NAVS = {
  admin: { items: [['dash', 'Dashboard', 'dash'], ['students', 'Students', 'cap'], ['parents', 'Parents', 'users'], ['teachers', 'Teachers', 'book'], ['principals', 'Principals', 'award'], ['classes', 'Classes and subjects', 'cal'], ['tt', 'Timetable', 'clock'], ['ds', 'Date sheet', 'file'], ['ann', 'Announcements', 'mega'], ['notice', 'Notices', 'bell'], ['evt', 'Events and holidays', 'star'], ['fees', 'Fees', 'cash'], ['rep', 'Reports', 'chart']], bottom: ['dash', 'students', 'fees', 'ann'] },
  principal: { items: [['dash', 'Dashboard', 'dash'], ['att', 'Attendance', 'check'], ['ann', 'Announcements', 'mega'], ['notice', 'Notices', 'file'], ['users', 'Users', 'users'], ['res', 'Results', 'award'], ['leave', 'Teacher leaves', 'cal'], ['fees', 'Fees', 'cash'], ['rep', 'Reports', 'chart']], bottom: ['dash', 'att', 'ann', 'res'] },
  teacher: { items: [['home', 'Dashboard', 'dash'], ['att', 'Attendance', 'check'], ['hw', 'Homework', 'book'], ['res', 'Results', 'award'], ['leave', 'Leave requests', 'cal'], ['tt', 'Timetable', 'clock'], ['notify', 'Notify and date sheet', 'paper'], ['parents', 'Parents', 'users'], ['me', 'My attendance', 'user']], bottom: ['home', 'att', 'hw', 'leave'] },
  parent: { items: [['home', 'Dashboard', 'dash'], ['att', 'Attendance', 'check'], ['hw', 'Homework', 'book'], ['leave', 'Leave', 'cal'], ['res', 'Results', 'award'], ['notices', 'Notices', 'file'], ['tt', 'Timetable', 'clock'], ['sheet', 'Date sheet', 'file'], ['fees', 'Fees', 'cash']], bottom: ['home', 'att', 'hw', 'leave'] },
};
export const ROLE_LIST = { teacher: () => DB.teachers, parent: () => DB.parents, principal: () => DB.principals };
export const allUsers = () => DB.teachers.concat(DB.parents, DB.principals, DB.admins || []);
export const slug = (s, sep, max) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, sep).replace(new RegExp('^' + (sep === '.' ? '\\.' : sep) + '+|' + (sep === '.' ? '\\.' : sep) + '+$', 'g'), '').slice(0, max);
export function suggestUser(name) {
  let base = slug(name, '.', 24) || 'user'; if (base.length < 3) base += '.user'; let u = base, i = 2;
  while (allUsers().some((x) => x.user === u)) u = base + (i++);
  return u;
}
export function genPass() {
  const L = 'abcdefghjkmnpqrstuvwxyz', D = '23456789', r = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  let o = ''; for (let i = 0; i < 6; i++) o += L[r(L.length)]; for (let i = 0; i < 4; i++) o += D[r(D.length)]; return o;
}
export function cleanClass(cid) {
  if (DB.tt) delete DB.tt[cid];
  DB.datesheet = DB.datesheet.filter((d) => d.cid !== cid);
  DB.hw = DB.hw.filter((w) => { if (w.cid !== cid) return true; delete DB.hwSub[w.id]; return false; });
  ['att', 'res', 'pub'].forEach((k) => Object.keys(DB[k]).forEach((key) => { if (key.split('|')[1] === cid) delete DB[k][key]; }));
  DB.events = DB.events.filter((e) => !(e.to && e.to.cids && e.to.cids.length === 1 && e.to.cids[0] === cid));
  DB.anns.forEach((a) => { if (a.aud && a.aud.kind === 'classes') a.aud.cids = a.aud.cids.filter((x) => x !== cid); });
  DB.anns = DB.anns.filter((a) => !(a.aud && a.aud.kind === 'classes' && !a.aud.cids.length));
}
