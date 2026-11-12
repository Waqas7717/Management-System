import { useState } from 'react';

import { CLASSES, DB, cls } from '../core/data';
import { store } from '../core/stores';
import { toast, render } from '../core/store';
import { downloadCSV, parseCSV } from '../core/tools';
import { Modal } from '../ui';
import { Button } from '../ui/buttons';

export const exportStudents = () => downloadCSV('students.csv', [['Roll', 'Name', 'Class', 'Parent', 'Parent phone', 'Status']].concat(
  DB.students.map((s) => { const p = DB.parents.find((x) => x.kids.includes(s.id)); return [s.roll, s.name, cls(s.cid) ? cls(s.cid).name : '', p ? p.name : '', p ? p.phone : '', s.active ? 'Active' : 'Inactive']; })));

const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const findClass = (v) => CLASSES.find((c) => norm(c.name) === norm(v) || norm(c.id) === norm(v) || norm(c.name).replace('class', '') === norm(v));
const col = (head, names) => head.findIndex((h) => names.indexOf(norm(h)) > -1);

function readRows(text) {
  const t = parseCSV(text);
  if (t.length < 2) return { rows: [], errs: ['The file has no student rows.'] };
  const h = t[0], ni = col(h, ['name', 'studentname', 'student', 'fullname']), ci = col(h, ['class', 'classname', 'section']), ri = col(h, ['roll', 'rollno', 'rollnumber']);
  if (ni < 0 || ci < 0) return { rows: [], errs: ['The first row must have the column names: Name, Class (and optionally Roll).'] };
  const rows = [], errs = [], used = {};
  DB.students.forEach((s) => { used[s.cid + '|' + s.roll] = 1; });
  const next = {};
  t.slice(1).forEach((r, i) => {
    const name = r[ni], c = findClass(r[ci]);
    if (!name) return;
    if (!c) { errs.push('Row ' + (i + 2) + ': class "' + r[ci] + '" not found. ' + name + ' skipped.'); return; }
    let roll = ri > -1 ? parseInt(r[ri], 10) : NaN;
    if (!roll) { next[c.id] = next[c.id] || DB.students.filter((s) => s.cid === c.id).reduce((a, s) => Math.max(a, s.roll), 0); do { next[c.id]++; } while (used[c.id + '|' + next[c.id]]); roll = next[c.id]; }
    if (used[c.id + '|' + roll]) { errs.push('Row ' + (i + 2) + ': roll ' + roll + ' is already used in ' + c.name + '. ' + name + ' skipped.'); return; }
    used[c.id + '|' + roll] = 1; rows.push({ name, cid: c.id, roll });
  });
  return { rows, errs };
}

export function ImportStudentsDialog({ onClose }) {
  const [res, setRes] = useState(null), [busy, setBusy] = useState(false);
  const pick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRes(readRows(String(rd.result))); rd.readAsText(f); };
  const run = async () => {
    setBusy(true);
    try { await store.addStudents(res.rows); render(); toast(res.rows.length + ' students added.'); onClose(); }
    catch (e) { toast(e.message || 'Could not import.'); setBusy(false); }
  };
  const tpl = () => downloadCSV('students-template.csv', [['Name', 'Class', 'Roll'], ['Example Student', CLASSES.length ? CLASSES[0].name : 'Class 9-A', 1]]);
  return (
    <Modal title="Add students from Excel" onClose={onClose} maxWidth="sm" actions={[{ label: busy ? 'Adding...' : 'Add ' + (res ? res.rows.length : 0) + ' students', onClick: run, disabled: busy || !res || !res.rows.length }]}>
      <p className="mut" style={{ marginBottom: 10 }}>In Excel, make columns <b>Name</b>, <b>Class</b> and <b>Roll</b> (roll is optional). Save the file as <b>CSV</b>, then choose it here. Parent accounts are added separately under Parents.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <Button variant="secondary" icon="download" onClick={tpl}>Download sample file</Button>
        <Button variant="primary" icon="upload" component="label">Choose CSV file<input type="file" accept=".csv,text/csv" hidden onChange={pick} /></Button>
      </div>
      {res ? (
        <>
          <p><b>{res.rows.length}</b> students ready to add{res.errs.length ? ', ' + res.errs.length + ' rows skipped.' : '.'}</p>
          {res.errs.slice(0, 8).map((x, i) => <div className="err" key={i} style={{ marginTop: 6 }}>{x}</div>)}
        </>
      ) : null}
    </Modal>
  );
}
