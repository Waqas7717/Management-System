import { useState } from 'react';
import { Button } from '@mui/material';
import { DB, EXAMS, agg, cls, classAvg, dayStatus, gradeOf, isPub, ord, parentsOf, ranks, stu, stuResult, subName, tch, latestExam } from '../core/data';
import { ALLD, CM, TODAY, fd, monthLabel, monthOptions } from '../core/dates';
import { printDoc, letterhead, esc } from '../core/tools';
import { Modal, Sel } from '../ui';

const pctTxt = (v) => (v == null ? '-' : v.toFixed(1) + '%');
const exName = (ex) => (EXAMS.find((e) => e.id === ex) || { name: ex }).name;
const stHead = (s) => `<div class="box"><div class="kv"><span>Student</span><b>${esc(s.name)}</b><span>Class and roll no.</span><b>${esc(cls(s.cid).name)}, roll ${esc(s.roll)}</b></div></div>`;

export const examsFor = (s) => EXAMS.filter((e) => cls(s.cid).subjects.some((sb) => isPub(e.id, s.cid, sb)));

export function printReportCard(sid, ex) {
  const s = stu(sid), r = stuResult(ex, s), rk = ranks(ex, s.cid), pos = rk.map[sid], c = cls(s.cid), ct = c.ct ? tch(c.ct) : null;
  const att = agg([sid], ALLD).pct;
  printDoc('Report card ' + s.name, letterhead('Report card') + `<h2>${esc(exName(ex))}</h2>${stHead(s)}
  <table><tr><th>Subject</th><th class="r">Marks (out of 100)</th><th class="c">Grade</th></tr>
  ${r.rows.map((x) => `<tr><td>${esc(subName(x.sub))}</td><td class="r">${x.m === null ? 'Pending' : x.m}</td><td class="c">${x.m === null ? '-' : gradeOf(x.m)}</td></tr>`).join('')}
  <tr><th>Total</th><th class="r">${r.tot} / ${r.n * 100}</th><th class="c">${gradeOf(r.pct)}</th></tr></table>
  <div class="box"><div class="kv"><span>Percentage</span><b>${pctTxt(r.pct)}</b><span>Result</span><b>${r.n === 0 ? '-' : r.pass ? 'Pass' : 'Fail'}</b>
  <span>Class position</span><b>${pos ? ord(pos) + ' of ' + rk.count : 'Shown when all subjects are published'}</b>
  <span>Class average</span><b>${pctTxt(classAvg(ex, s.cid))}</b><span>Attendance (recent)</span><b>${pctTxt(att)}</b></div></div>
  <div class="sig"><span>${ct ? 'Class teacher: ' + esc(ct.name) : 'Class teacher'}</span><span>Parent signature</span><span>Principal</span></div>
  <p class="note">Printed on ${esc(TODAY)}. Grades: A1 80+, A 70+, B 60+, C 50+, D 40+, E 33+, F below 33.</p>`);
}

export function printIdCard(sid) {
  const s = stu(sid), par = parentsOf(sid)[0];
  const photo = s.photo ? `<img src="${esc(s.photo)}" alt="">` : `<div class="ph">${esc(s.name.split(' ').map((w) => w[0]).slice(0, 2).join(''))}</div>`;
  printDoc('ID card ' + s.name, `<div class="id"><div class="top"><b>F.G Public School and College</b>Sakesar</div><div class="bd">${photo}
  <div class="nm">${esc(s.name)}</div><div>${esc(cls(s.cid).name)}, roll ${esc(s.roll)}</div>${par ? `<div>Parent: ${esc(par.name)}</div><div>${esc(par.phone || '')}</div>` : ''}</div>
  <div class="ft">STUDENT ID CARD</div></div><p class="note">Cut along the border and laminate.</p>`);
}

export function printStudentAtt(sid, m) {
  const s = stu(sid), dates = ALLD.filter((d) => d.slice(0, 7) === m && d <= TODAY);
  let P = 0, A = 0, L = 0;
  const rows = dates.map((d) => { const x = dayStatus(sid, d); if (x === 'P') P++; else if (x === 'A' || x === 'M') A++; else if (x === 'L') L++; return `<tr><td>${esc(fd(d))}</td><td>${x === 'P' ? 'Present' : x === 'A' ? 'Absent' : x === 'L' ? 'Leave' : x === 'M' ? 'Partly absent' : '-'}</td></tr>`; });
  printDoc('Attendance ' + s.name, letterhead('Attendance report, ' + monthLabel(m)) + stHead(s) + `<table><tr><th>Date</th><th>Status</th></tr>${rows.join('')}</table>
  <div class="box"><div class="kv"><span>Present days</span><b>${P}</b><span>Absent days</span><b>${A}</b><span>Leave days</span><b>${L}</b><span>Attendance</span><b>${pctTxt(agg([sid], dates).pct)}</b></div></div>`);
}

export function printDateSheet(cid, exam) {
  const list = DB.datesheet.filter((d) => d.cid === cid && (!exam || d.exam === exam)).sort((a, b) => (a.date < b.date ? -1 : 1));
  printDoc('Date sheet', letterhead('Date sheet') + `<h2>${esc(cls(cid).name)}${exam ? ', ' + esc(exam) : ''}</h2>
  <table><tr><th>Date</th><th>Subject</th><th>Time</th><th>Room</th></tr>${list.map((d) => `<tr><td>${esc(fd(d.date))}</td><td>${esc(subName(d.sub))}</td><td>${esc(d.time)}</td><td>${esc(d.room)}</td></tr>`).join('')}</table>`);
}

/* staff: pick what to print for one student */
export function PrintDialog({ sid, onClose }) {
  const s = stu(sid), av = examsFor(s);
  const [what, setWhat] = useState('card'), [ex, setEx] = useState(av.length ? av[av.length - 1].id : latestExam()), [m, setM] = useState(CM());
  const go = () => { if (what === 'card') printReportCard(sid, ex); else if (what === 'id') printIdCard(sid); else printStudentAtt(sid, m); };
  return (
    <Modal title={'Print for ' + s.name} onClose={onClose} actions={[{ label: 'Print or save PDF', onClick: go, disabled: what === 'card' && !av.length }]}>
      <div style={{ display: 'grid', gap: 14 }}>
        <Sel label="What to print" value={what} onChange={setWhat} list={[['card', 'Report card'], ['id', 'Student ID card'], ['att', 'Monthly attendance report']]} />
        {what === 'card' ? (av.length ? <Sel label="Exam" value={ex} onChange={setEx} list={av.map((e) => [e.id, e.name])} /> : <p className="mut">No published results for this student yet.</p>) : null}
        {what === 'att' ? <Sel label="Month" value={m} onChange={setM} list={monthOptions()} /> : null}
        <p className="mut">A print window opens. Choose "Save as PDF" as the printer to get a PDF file.</p>
      </div>
    </Modal>
  );
}
export { Button };
