import { useState } from 'react';
import { Button } from '@mui/material';
import { DEMO } from '../../core/config';
import {
  CLASSES, DB, S, F, SUBJ, TYPEL, TYPEC, ROLE_LIST, cap, cleanClass, cls, ev, parentsOf, stu, subName, teacherFor, ttCell, ttDays,
} from '../../core/data';
import { DAYN, PT, TODAY, dow, fd, fs, isSchool } from '../../core/dates';
import { go } from '../../core/actions';
import { ask, render, toast } from '../../core/store';
import { scheduleSync } from '../../core/sync';
import { store } from '../../core/stores';
import { Card, DT, Empty, FSel, Item, Kpi, PageHead, Tag, TypeTag } from '../../ui';
import { BarRows, Split } from '../../ui/Charts';
import { AskCard, InsightsCard } from '../aiparts';
import { AttnRow, Attention, ClassCards, DCard, KpiTile, RangeChips, StaffCheckin, Ticker, dayCounts, rangeInfo } from '../../ui/dash';
import { AnnScreen, TtGrid } from '../common';
import { UsersList } from './users';
import { AccountDialog, ClassDialog, CredsDialog, DsDialog, EvDialog, PwDialog, StudentDialog, SubjectDialog } from './dialogs';

/* ---------- students, parents, teachers, principals ---------- */
const META = {
  students: ['Students', 'student', 'Add, edit, deactivate or remove students.'],
  parents: ['Parents', 'parent', 'Add parents, give them a login and link them to their children.'],
  teachers: ['Teachers', 'teacher', 'Add teachers, give them a login and assign classes and subjects.'],
  principals: ['Principals', 'principal', 'Add principals and give them a login.'],
};
const ROLE_OF = { students: 'student', parents: 'parent', teachers: 'teacher', principals: 'principal' };

function Accounts({ tab }) {
  const [dlg, setDlg] = useState(null);
  const [ttl, one, sub] = META[tab];
  const fail = (e) => toast(e.message || 'Something went wrong.');
  const act = {
    acEdit: (role, id) => setDlg({ t: 'acc', role, id }),
    sEdit: (id) => setDlg({ t: 'stu', id }),
    pwReset: (role, id) => setDlg({ t: 'pw', role, id }),
    acToggle: async (role, id) => {
      const o = ROLE_LIST[role]().find((x) => x.id === id); if (!o) return;
      const on = !o.active, name = o.name;
      try { await store.setActive(role, o.id, on); } catch (e) { return fail(e); }
      render(); toast(name + (on ? ' activated.' : ' deactivated. They can no longer sign in.'));
    },
    acRemove: (role, id) => {
      const o = ROLE_LIST[role]().find((x) => x.id === id); if (!o) return;
      const extra = role === 'teacher' ? ' Their leave requests are deleted and their classes become unassigned.' : role === 'parent' ? ' Their children stay in the school records.' : '';
      ask('Remove ' + o.name + ' permanently? Their login stops working and this cannot be undone.' + extra, 'Remove', async () => {
        try { await store.removeAccount(role, o.id); } catch (e) { return fail(e); }
        render(); toast(o.name + ' removed.');
      });
    },
    sToggle: async (id) => {
      const s = stu(id); if (!s) return; const on = !s.active, name = s.name;
      try { await store.setStudentActive(s.id, on); } catch (e) { return fail(e); }
      render(); toast(name + (on ? ' activated.' : ' deactivated.'));
    },
    sRemove: (id) => {
      const s = stu(id); if (!s) return;
      ask('Remove ' + s.name + ' permanently? Their leave requests are deleted and they are unlinked from their parents. This cannot be undone. To keep the records, use Deactivate instead.', 'Remove', async () => {
        try { await store.removeStudent(s.id); } catch (e) { return fail(e); }
        render(); toast(s.name + ' removed.');
      });
    },
  };
  const add = () => {
    if (tab === 'students') { if (!CLASSES.length) return toast('Add a class first, then add students.'); setDlg({ t: 'stu', id: '' }); }
    else setDlg({ t: 'acc', role: ROLE_OF[tab], id: '' });
  };
  const close = () => setDlg(null);
  return (
    <>
      <PageHead title={ttl} sub={sub}><Button variant="contained" onClick={add}>Add {one}</Button></PageHead>
      <UsersList tab={tab} edit act={act} />
      {dlg && dlg.t === 'acc' && <AccountDialog role={dlg.role} id={dlg.id} onClose={close} onCreds={(info) => setDlg({ t: 'creds', info })} />}
      {dlg && dlg.t === 'stu' && <StudentDialog id={dlg.id} onClose={close} />}
      {dlg && dlg.t === 'pw' && <PwDialog role={dlg.role} id={dlg.id} onClose={close} onCreds={(info) => setDlg({ t: 'creds', info })} />}
      {dlg && dlg.t === 'creds' && <CredsDialog info={dlg.info} onClose={close} />}
    </>
  );
}

/* ---------- overview ---------- */
function Dash() {
  const act = DB.students.filter((s) => s.active), noPar = act.filter((s) => !parentsOf(s.id).length);
  const noCt = CLASSES.filter((c) => !DB.teachers.some((t) => t.id === c.ct && t.active));
  const gaps = []; CLASSES.forEach((c) => c.subjects.forEach((sb) => { const tf = teacherFor(c.id, sb); if (!tf.id) gaps.push(c.name + ', ' + subName(sb)); else if (!tf.active) gaps.push(c.name + ', ' + subName(sb) + ' (' + tf.name + ' is inactive)'); }));
  const steps = [['classes', '1. Add subjects and classes', CLASSES.length > 0], ['teachers', '2. Add teachers and give them classes', DB.teachers.length > 0], ['students', '3. Add students', DB.students.length > 0], ['parents', '4. Add parents and link them to students', DB.parents.length > 0]];
  const List = ({ arr, max }) => <ul className="mut" style={{ paddingLeft: 18 }}>{arr.slice(0, max).map((x, i) => <li key={i}>{x}</li>)}{arr.length > max ? <li>and {arr.length - max} more</li> : null}</ul>;
  const issues = noPar.length || noCt.length || gaps.length;
  const rng = rangeInfo();
  return (
    <>
      <PageHead title="Admin overview" sub={(DEMO ? 'Demo with sample data. ' : '') + 'FG Public School and College'}><RangeChips /></PageHead>
      <Ticker />
      <div className="g4" style={{ marginBottom: 16 }}>
        <KpiTile l="Students" v={act.length} s={CLASSES.length + (CLASSES.length === 1 ? ' class' : ' classes')} ico="cap" tone="b" to="students" />
        <KpiTile l="Parents" v={DB.parents.length} s="With a login" ico="users" tone="g" to="parents" />
        <KpiTile l="Teachers" v={DB.teachers.length} s={DB.teachers.filter((t) => t.active).length + ' active'} ico="book" tone="p" to="teachers" />
        <KpiTile l="Principals" v={DB.principals.length} s={DB.principals.filter((t) => t.active).length + ' active'} ico="award" tone="o" to="principals" />
      </div>
      {steps.some((x) => !x[2]) && (
        <DCard title="Get started" ico="star" style={{ marginBottom: 16 }}>
          <p className="mut" style={{ marginBottom: 10 }}>Set up your school in this order.</p>
          <div className="stack">{steps.map((x) => <div className="row sp" key={x[0]}><span>{x[2] ? <><Tag c="ok">Done</Tag> </> : null}{x[1]}</span><Button size="small" variant={x[2] ? 'outlined' : 'contained'} onClick={() => go(x[0])}>Open</Button></div>)}</div>
        </DCard>
      )}
      <div className="two st wide" style={{ marginBottom: 16 }}>
        <ClassCards classes={CLASSES} range={rng} />
        <DCard title="Students by class" ico="chart">
          {CLASSES.length ? <Split items={CLASSES.map((c) => ({ label: c.name, value: act.filter((s) => s.cid === c.id).length }))} centerTop={String(act.length)} centerBottom="students" /> : <Empty t="No classes yet" />}
        </DCard>
      </div>
      <div className="two st" style={{ marginBottom: 16 }}>
        <StaffCheckin to="teachers" />
        <Attention>
          {issues ? (
            <>
              {noPar.length ? <AttnRow n={noPar.length} t="Students with no parent linked" sub={noPar.slice(0, 3).map((s) => s.name).join(', ') + (noPar.length > 3 ? ' and more' : '')} to="parents" /> : null}
              {noCt.length ? <AttnRow n={noCt.length} t="Classes with no active class teacher" sub={noCt.map((c) => c.name).join(', ')} to="classes" /> : null}
              {gaps.length ? <AttnRow n={gaps.length} t="Subjects with no active teacher" sub={gaps.slice(0, 2).join('; ') + (gaps.length > 2 ? ' and more' : '')} to="teachers" /> : null}
            </>
          ) : <p>Everything is set up. No student, class or subject is missing a link.</p>}
        </Attention>
      </div>
      <div className="two st" style={{ marginBottom: 16 }}>
        <InsightsCard />
        <AskCard />
      </div>
      {CLASSES.length ? (
        <DCard title="Attendance by class" ico="check" right={<span>{rng.label}. Hover a bar for details.</span>}>
          <BarRows items={CLASSES.map((c) => { const a = dayCounts(act.filter((s) => s.cid === c.id).map((s) => s.id), rng.dates); return { label: c.name, val: a.pct, cls: a.pct == null ? '' : a.pct >= 92 ? 'g' : a.pct >= 85 ? 'y' : 'r' }; })} />
        </DCard>
      ) : null}
    </>
  );
}

/* ---------- classes and subjects ---------- */
function Classes() {
  const [dlg, setDlg] = useState(null);
  const codes = Object.keys(SUBJ).sort((a, b) => (SUBJ[a] < SUBJ[b] ? -1 : 1));
  const fail = (e) => toast(e.message || 'Something went wrong.');
  const editClass = (id) => { if (Object.keys(SUBJ).length < 5) return toast('Add at least 5 subjects first. A class needs 5.'); setDlg({ t: 'cls', id }); };
  const rmClass = (c) => ask('Remove ' + c.name + '? Its teacher assignments, timetable, homework, date sheet and attendance are removed too. This cannot be undone.', 'Remove', async () => {
    try { await store.removeClass(c.id); } catch (e) { return fail(e); }
    cleanClass(c.id); scheduleSync(); render(); toast(c.name + ' removed.');
  });
  const rmSub = (code) => {
    const used = CLASSES.filter((c) => c.subjects.includes(code));
    if (used.length) return toast('This subject is used by ' + used.map((c) => c.name).join(', ') + '. Change those classes first.');
    ask('Remove the subject ' + SUBJ[code] + '?', 'Remove', async () => { try { await store.removeSubject(code); } catch (e) { return fail(e); } render(); toast('Subject removed.'); });
  };
  return (
    <>
      <PageHead title="Classes and subjects" sub="Every class has 5 subjects, one for each daily lecture."><Button variant="contained" onClick={() => editClass('')}>Add class</Button></PageHead>
      {CLASSES.length ? CLASSES.map((c) => {
        const ct = DB.teachers.find((t) => t.id === c.ct);
        return (
          <Item key={c.id}>
            <div className="row sp"><h4>{c.name} <small>{c.level === 'college' ? 'College' : 'School'}{c.room ? ', ' + c.room : ''}</small></h4><Tag c="info">{DB.students.filter((s) => s.cid === c.id && s.active).length + ' students'}</Tag></div>
            <div className="meta"><span>Class teacher: {ct ? ct.name : 'Not set'}</span></div>
            <div className="meta">{c.subjects.map((sb) => { const t = teacherFor(c.id, sb); return <Tag key={sb} c={t.id ? 'info' : 'warn'}>{subName(sb) + ' (' + (t.id ? t.name.split(' ')[0] : 'no teacher') + ')'}</Tag>; })}</div>
            <div className="row"><Button size="small" variant="outlined" onClick={() => editClass(c.id)}>Edit</Button><Button size="small" variant="contained" color="error" onClick={() => rmClass(c)}>Remove</Button></div>
          </Item>
        );
      }) : <Empty t="No classes yet" s="Add your first class with the button above." />}
      <div className="row sp" style={{ margin: '24px 0 10px' }}><h3>Subjects</h3><Button size="small" variant="contained" onClick={() => setDlg({ t: 'sub', code: '' })}>Add subject</Button></div>
      {codes.length ? codes.map((code) => (
        <Item key={code}>
          <div className="row sp"><h4>{SUBJ[code]} <small>{code}</small></h4>
            <div className="row"><Button size="small" variant="outlined" onClick={() => setDlg({ t: 'sub', code })}>Rename</Button><Button size="small" variant="contained" color="error" onClick={() => rmSub(code)}>Remove</Button></div></div>
        </Item>
      )) : <Empty t="No subjects yet" s="Add subjects, then use them in classes." />}
      {dlg && dlg.t === 'cls' && <ClassDialog id={dlg.id} onClose={() => setDlg(null)} />}
      {dlg && dlg.t === 'sub' && <SubjectDialog code={dlg.code} onClose={() => setDlg(null)} />}
    </>
  );
}

/* ---------- timetable ---------- */
const ttNote = (cid, title) => {
  const c = cls(cid); if (!c) return;
  ev({ role: 'parent', cids: [cid] }, title, c.name + ' timetable was updated. See the Timetable page.', 'event');
  DB.teachers.filter((t) => t.assign.some((a) => a[0] === cid)).forEach((t) => ev({ role: 'teacher', id: t.id }, title, c.name + ' timetable was updated. See the Timetable page.', 'event'));
};
function TtEditor({ cid }) {
  const c = cls(cid), custom = !!(DB.tt && DB.tt[cid]);
  const [grid, setGrid] = useState(() => ttDays(cid));
  const set = (i, p, v) => setGrid(grid.map((r, a) => (a === i ? r.map((x, b) => (b === p - 1 ? v : x)) : r)));
  const doSave = () => { DB.tt[cid] = { days: grid }; ttNote(cid, 'Timetable updated'); render(); toast('Timetable saved for ' + c.name + '. Teachers and parents can see it now.'); };
  const save = () => {
    const days = grid.map((r, i) => r.map((v, k) => (c.subjects.includes(v) ? v : c.subjects[(k + i) % 5])));
    const clashes = [];
    [0, 1, 2, 3, 4].forEach((i) => [1, 2, 3, 4, 5].forEach((p) => {
      const t = teacherFor(cid, days[i][p - 1]); if (!t.id) return;
      CLASSES.forEach((o) => { if (o.id === cid || !(DB.tt && DB.tt[o.id])) return; const s2 = ttCell(o.id, i, p); if (teacherFor(o.id, s2).id === t.id) clashes.push(t.name + ' is also in ' + o.name + ' on ' + DAYN[i] + ', lecture ' + p); });
    }));
    const go2 = () => { DB.tt[cid] = { days }; ttNote(cid, 'Timetable updated'); render(); toast('Timetable saved for ' + c.name + '. Teachers and parents can see it now.'); };
    if (clashes.length) {
      const more = clashes.length > 3 ? ' and ' + (clashes.length - 3) + ' more' : '';
      return ask('Teacher clash: ' + clashes.slice(0, 3).join('; ') + more + '. Save anyway?', 'Save anyway', go2);
    }
    go2();
  };
  return (
    <Card>
      <div className="row sp" style={{ marginBottom: 10 }}><h3>{c.name}</h3>{custom ? <Tag c="ok">Custom timetable</Tag> : <Tag c="warn">Default order, not saved yet</Tag>}</div>
      <div className="tw">
        <table className="ttbl">
          <thead><tr><th>Lecture</th>{[0, 1, 2, 3, 4].map((i) => <th key={i} style={isSchool(TODAY) && dow(TODAY) === i ? { color: 'var(--gold)' } : undefined}>{DAYN[i]}</th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((p) => (
              <tr key={p}>
                <td>{p} <small>{PT[p - 1]}</small></td>
                {[0, 1, 2, 3, 4].map((i) => (
                  <td key={i}>
                    <select id={`tt_${i}_${p}`} aria-label={`${DAYN[i]} lecture ${p}`} value={grid[i][p - 1]} onChange={(e) => set(i, p, e.target.value)}
                      style={{ padding: '8px 10px', border: '1.5px solid var(--chromeln)', borderRadius: 10, background: 'var(--chrome)', color: 'var(--ink)', font: 'inherit', minWidth: 110 }}>
                      {c.subjects.map((sb) => <option key={sb} value={sb}>{subName(sb)}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="meta" style={{ marginTop: 10 }}>{c.subjects.map((sb) => { const t = teacherFor(c.id, sb); return <Tag key={sb} c={t.id ? 'info' : 'warn'}>{subName(sb) + ' (' + (t.id ? t.name : 'no teacher') + ')'}</Tag>; })}</div>
      <div className="row" style={{ marginTop: 14 }}>
        <Button variant="contained" onClick={save}>Save timetable</Button>
        {custom ? <Button variant="outlined" onClick={() => ask('Reset the timetable for ' + c.name + ' to the default order?', 'Reset', () => { delete DB.tt[cid]; ttNote(cid, 'Timetable updated'); render(); toast('Timetable reset.'); })}>Reset to default order</Button> : null}
      </div>
    </Card>
  );
}
function Tt() {
  const ttl = 'Timetable', sub = 'Set the weekly timetable for each class. Teachers and parents see it in their own portal.';
  if (!CLASSES.length) return <><PageHead title={ttl} sub={sub} /><Empty t="No classes yet" s="Add a class under Classes and subjects first." /></>;
  const cid = cls(F('ttc', '')) ? F('ttc', '') : CLASSES[0].id;
  const custom = !!(DB.tt && DB.tt[cid]);
  return (
    <>
      <PageHead title={ttl} sub={sub} />
      <div className="g2" style={{ margin: '14px 0' }}><FSel k="ttc" def={cid} list={CLASSES.map((x) => [x.id, x.name])} label="Class" /></div>
      <TtEditor key={cid + (custom ? 'c' : 'd')} cid={cid} />
    </>
  );
}

/* ---------- date sheet ---------- */
function Ds() {
  const [add, setAdd] = useState(false);
  const ttl = 'Date sheet', sub = 'Exam paper dates for each class. Parents see them in their Date sheet page.';
  if (!CLASSES.length) return <><PageHead title={ttl} sub={sub} /><Empty t="No classes yet" s="Add a class under Classes and subjects first." /></>;
  const f = F('dsf', 'all'), list = DB.datesheet.filter((d) => cls(d.cid) && (f === 'all' || d.cid === f)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return (
    <>
      <PageHead title={ttl} sub={sub}><Button variant="contained" onClick={() => setAdd(true)}>Add paper</Button></PageHead>
      <div className="g2" style={{ margin: '14px 0' }}><FSel k="dsf" def="all" list={[['all', 'All classes']].concat(CLASSES.map((x) => [x.id, x.name]))} label="Class" /></div>
      {list.length ? <DT cols={['Class', 'Exam', 'Subject', 'Date', 'Time', 'Room', '']} rows={list.map((d) => [cls(d.cid).name, d.exam || '', subName(d.sub), fd(d.date), d.time || '', d.room || '',
        <Button size="small" variant="contained" color="error" onClick={() => { DB.datesheet = DB.datesheet.filter((x) => x.id !== d.id); render(); toast('Paper removed.'); }}>Remove</Button>])} />
        : <Empty t="No papers yet" s="Use Add paper to build the date sheet." />}
      {add && <DsDialog onClose={() => setAdd(false)} />}
    </>
  );
}

/* ---------- events and holidays ---------- */
function Evt() {
  const [add, setAdd] = useState(false);
  const seen = {}, list = [];
  DB.events.filter((e) => e.adm).forEach((e) => { if (seen[e.grp]) return; seen[e.grp] = 1; list.push(e); });
  list.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const to = (g) => ['parent', 'teacher'].filter((r) => DB.events.some((x) => x.grp === g && x.to.role === r)).map((r) => (r === 'parent' ? 'Parents' : 'Teachers')).join(' and ');
  return (
    <>
      <PageHead title="Events and holidays" sub="Holidays, meetings and events. They appear in the notifications of parents and teachers."><Button variant="contained" onClick={() => setAdd(true)}>New event or holiday</Button></PageHead>
      {list.length ? list.map((e) => (
        <Item key={e.grp}>
          <div className="row sp"><span className="row"><TypeTag t={e.type} fallback="Event" />{e.date ? <Tag c="info">{fd(e.date)}</Tag> : null}</span><small>Posted {fs(e.ts.slice(0, 10))}</small></div>
          <h4>{e.title}</h4><p>{e.text}</p><div className="meta"><span>To {to(e.grp)}</span></div>
          <div className="row"><Button size="small" variant="contained" color="error" onClick={() => ask('Delete this post?', 'Delete', () => { DB.events = DB.events.filter((x) => x.grp !== e.grp); render(); toast('Deleted.'); })}>Delete</Button></div>
        </Item>
      )) : <Empty t="Nothing posted yet" s="Use the button above to post a holiday or an event." />}
      {add && <EvDialog onClose={() => setAdd(false)} />}
    </>
  );
}

export const adminViews = {
  dash: Dash, classes: Classes, tt: Tt, ds: Ds, evt: Evt,
  students: () => <Accounts tab="students" />, parents: () => <Accounts tab="parents" />,
  teachers: () => <Accounts tab="teachers" />, principals: () => <Accounts tab="principals" />,
  ann: () => <AnnScreen kind="announcement" />, notice: () => <AnnScreen kind="notice" />,
};
