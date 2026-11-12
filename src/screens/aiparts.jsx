import { useState } from 'react';
import { Button } from '@mui/material';
import { CLASSES, DB, EXAMS, classAvg, classPass, dayStatus, latestExam, tStatus, cls, gradeOf } from '../core/data';
import { TODAY, addDays, schoolDays } from '../core/dates';
import { askAI } from '../core/ai';
import { toast } from '../core/store';
import { Ico, Modal, TF } from '../ui';
import { DCard, dayCounts } from '../ui/dash';

/* run an AI action with a busy flag. Shows the error as a toast and returns the text or null. */
export function useAI() {
  const [busy, setBusy] = useState(false);
  const run = async (action, body) => {
    setBusy(true); const r = await askAI(action, body); setBusy(false);
    if (!r.ok) { toast(r.error); return null; }
    return r.text;
  };
  return [busy, run];
}

/* "Show in Urdu / English" under a notice */
const cache = new Map();
export function Translate({ text }) {
  const [busy, run] = useAI(); const [out, setOut] = useState('');
  const to = /[؀-ۿ]/.test(text) ? 'en' : 'ur';
  const go = async () => {
    if (out) return setOut('');
    const k = to + '|' + text; if (cache.has(k)) return setOut(cache.get(k));
    const t = await run('translate', { text, to }); if (t) { cache.set(k, t); setOut(t); }
  };
  return (
    <div>
      <Button size="small" variant="text" disabled={busy} onClick={go}>{busy ? 'Translating...' : out ? 'Hide translation' : to === 'ur' ? 'اردو میں دیکھیں' : 'Show in English'}</Button>
      {out ? <p dir={to === 'ur' ? 'rtl' : 'ltr'} style={{ marginTop: 6, padding: 10, borderRadius: 12, background: 'var(--sf)', border: '1px solid var(--ln)', fontSize: to === 'ur' ? 17 : 14.5, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{out}</p> : null}
    </div>
  );
}

/* report card comments: one editable line per student */
export function CommentsDialog({ students, marks, exam, subject, onClose }) {
  const [busy, run] = useAI(); const [c, setC] = useState({});
  const rows = students.filter((s) => marks[s.id] !== '' && marks[s.id] != null && !isNaN(+marks[s.id]));
  const avg = rows.length ? Math.round(rows.reduce((a, s) => a + +marks[s.id], 0) / rows.length) : 0;
  const draft = async () => {
    const t = await run('comments', { subject, exam, avg, students: rows.map((s) => ({ name: s.name.split(' ')[0], marks: +marks[s.id] })) });
    if (!t) return;
    const o = {}; t.split(/\r?\n/).forEach((l) => { const m = /^\s*(\d+)\s*[|:.)-]\s*(.+)$/.exec(l); if (m && rows[+m[1] - 1]) o[rows[+m[1] - 1].id] = m[2].trim(); });
    setC(o); if (!Object.keys(o).length) toast('Could not read the AI answer. Try again.');
  };
  const copy = () => { const t = rows.map((s) => s.name + ' (' + marks[s.id] + '): ' + (c[s.id] || '')).join('\n'); if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copied.'), () => toast('Could not copy.')); };
  return (
    <Modal title="Report card comments" onClose={onClose} maxWidth="sm" cancelLabel="Close"
      actions={[{ label: 'Copy all', onClick: copy }]}>
      <p className="mut" style={{ marginBottom: 10 }}>{subject}, {exam}. AI drafts a short comment for each student. Edit them, then copy. Only first names and marks are sent.</p>
      <Button variant="contained" disabled={busy || !rows.length} onClick={draft}>{busy ? 'Writing...' : Object.keys(c).length ? 'Write again' : 'Draft comments with AI'}</Button>
      {!rows.length ? <p className="mut" style={{ marginTop: 10 }}>Enter marks first.</p> : null}
      {rows.map((s) => <div className="field" key={s.id}><TF label={s.name + ' (' + marks[s.id] + ', ' + gradeOf(+marks[s.id]) + ')'} value={c[s.id] || ''} onChange={(v) => setC((o) => ({ ...o, [s.id]: v }))} multiline minRows={2} /></div>)}
    </Modal>
  );
}

/* plain-language insights worked out in the app itself (no AI, no limits) */
export function insights() {
  const out = [], days = schoolDays(addDays(TODAY, -20), TODAY).filter((d) => d < TODAY || DB.students.some((s) => dayStatus(s.id, d))), last = days.slice(-5), prev = days.slice(-10, -5);
  CLASSES.forEach((c) => {
    const ids = DB.students.filter((s) => s.cid === c.id && s.active).map((s) => s.id), a = dayCounts(ids, last), b = dayCounts(ids, prev);
    if (a.pct != null && b.pct != null && b.pct - a.pct >= 4) out.push({ t: c.name + ' attendance dropped from ' + Math.round(b.pct) + '% to ' + Math.round(a.pct) + '% over the last 5 school days.', tone: 'r' });
    else if (a.pct != null && b.pct != null && a.pct - b.pct >= 4) out.push({ t: c.name + ' attendance improved from ' + Math.round(b.pct) + '% to ' + Math.round(a.pct) + '%.', tone: 'g' });
  });
  const streak = DB.students.filter((s) => s.active && days.length >= 3 && days.slice(-3).every((d) => dayStatus(s.id, d) === 'A'));
  if (streak.length) out.push({ t: streak.length + ' student' + (streak.length > 1 ? 's' : '') + ' absent 3 school days in a row: ' + streak.slice(0, 4).map((s) => s.name.split(' ')[0] + ' (' + cls(s.cid).name + ')').join(', ') + (streak.length > 4 ? ' and more.' : '.'), tone: 'r' });
  const ex = latestExam(), avgs = CLASSES.map((c) => ({ c, v: classAvg(ex, c.id) })).filter((x) => x.v != null).sort((a, b) => a.v - b.v);
  if (avgs.length > 1) out.push({ t: avgs[0].c.name + ' has the lowest average result (' + Math.round(avgs[0].v) + '%) in ' + EXAMS.find((e) => e.id === ex).name + '. ' + avgs[avgs.length - 1].c.name + ' is highest (' + Math.round(avgs[avgs.length - 1].v) + '%).', tone: 'b' });
  return out.slice(0, 5);
}
export function InsightsCard() {
  const list = insights();
  return (
    <DCard title="Insights" ico="chart" right={<span className="mut">Worked out from your data</span>}>
      {list.length ? list.map((x, i) => <div className="ins" key={i}><i className={'ins-d ' + x.tone} /><span>{x.t}</span></div>) : <p className="mut">Nothing unusual this week. Attendance and results look steady.</p>}
    </DCard>
  );
}

/* facts sent with a question: totals only, no student names */
function facts() {
  const ex = latestExam(), days = schoolDays(addDays(TODAY, -6), TODAY), L = [];
  L.push('Date today: ' + TODAY + '. Latest exam: ' + EXAMS.find((e) => e.id === ex).name + '.');
  CLASSES.forEach((c) => {
    const ids = DB.students.filter((s) => s.cid === c.id && s.active).map((s) => s.id), t = dayCounts(ids, [TODAY]), w = dayCounts(ids, days), av = classAvg(ex, c.id), ps = classPass(ex, c.id);
    L.push(c.name + ': ' + ids.length + ' students; present today ' + t.P + ', absent ' + t.A + ', leave ' + t.L + '; attendance last 7 days ' + (w.pct == null ? 'n/a' : Math.round(w.pct) + '%') + '; average result ' + (av == null ? 'n/a' : Math.round(av) + '%') + '; pass rate ' + (ps == null ? 'n/a' : Math.round(ps) + '%') + '.');
  });
  const tc = { in: 0, out: 0, leave: 0 };
  DB.teachers.forEach((t) => { const s = tStatus(t.id, TODAY); if (s === 'P') tc.in++; else if (s === 'L') tc.leave++; else tc.out++; });
  L.push('Teachers today: ' + tc.in + ' checked in, ' + tc.out + ' not in yet, ' + tc.leave + ' on leave. Total teachers ' + DB.teachers.length + '.');
  return L.join('\n');
}
const SAMPLES = ['Which class has the lowest results?', 'Which class has the best attendance this week?', 'How many teachers are not in yet?'];
export function AskCard() {
  const [busy, run] = useAI(); const [q, setQ] = useState(''), [a, setA] = useState('');
  const go = async (text) => { const s = (text || q).trim(); if (!s) return; setQ(s); setA(''); const t = await run('ask', { question: s, facts: facts() }); if (t) setA(t); };
  return (
    <DCard title="Ask about your school" ico="search" right={<span className="mut">AI</span>}>
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}><TF id="ask_q" label="Your question" value={q} onChange={setQ} onKeyDown={(e) => e.key === 'Enter' && go()} /></div>
        <Button variant="contained" disabled={busy} onClick={() => go()} sx={{ flex: 'none', height: 54 }}>{busy ? 'Thinking...' : 'Ask'}</Button>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 6 }}>{SAMPLES.map((s) => <button type="button" key={s} className="chipq" disabled={busy} onClick={() => go(s)}>{s}</button>)}</div>
      {a ? <p className="aians"><Ico n="star" s={16} />{a}</p> : null}
    </DCard>
  );
}
