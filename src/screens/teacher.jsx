import { CommentsDialog, useAI } from './aiparts';
import { alertAbsent, alertNotice } from '../core/push';
import { AttnRow, Attention, DCard, KpiTile, Ticker, dayCounts } from '../ui/dash';
import { BarRows } from '../ui/Charts';
import { useState } from 'react';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  CLASSES, DB, EXAMS, S, F, agg, audLabel, classTeacherOf, coversL, cls, effStatus, ev, feed, gcls, gradeOf, isPub, leaveDates, leaveLabel,
  lecMarked, markWork, latestExam, classAvg, myLectures, myPendingLeaves, parentsOf, stu, subName, subjAt, tClasses, tStatus, ttCell, uid,
} from '../core/data';
import { ALLD, CM, PT, TODAY, addDays, fd, fs, isSchool, monthOptions, nextSchool, nowHM, schoolDays } from '../core/dates';
import { go } from '../core/actions';
import { ask, render, toast } from '../core/store';
import { Card, CheckGroup, RadioField, DT, DateF, Empty, Err, FSel, FileBox, Item, Kpi, LeaveChip, Modal, PageHead, Sel, Seg, StChip, TF, Tag, TypeTag, Av, Who, FDate } from '../ui';
import { TtGrid } from './common';
import { Button, RowActions, FormActions } from '../ui/buttons';

const NoAsg = () => <Empty t="No classes assigned" s="The Admin can assign classes and subjects to you." />;
const asgList = () => S.user.assign.map((a, i) => [String(i), cls(a[0]).name + ', ' + subName(a[1])]);
const AsgSel = ({ k, i }) => <FSel k={k} def={i} list={asgList()} label="Class and subject" />;

function Home() {
  const t = S.user, lec = myLectures(t, TODAY), pl = myPendingLeaves(t).length, own = tStatus(t.id, TODAY), rec = DB.tatt[t.id + '|' + TODAY];
  const f = feed().filter((x) => x.type !== 'leave' && x.type !== 'homework').slice(0, 3);
  const myCl = tClasses(t).map((c) => cls(c)).filter(Boolean), wkDays = schoolDays(addDays(TODAY, -6), TODAY), lx = latestExam(), todo = lec.filter((l) => !lecMarked(l));
  return (
    <>
      <PageHead title={'Good morning, ' + t.name.split(' ')[0]} sub={fd(TODAY)} />
      <Ticker />
      <div className="g4" style={{ marginBottom: 16 }}>
        <KpiTile l="Classes and subjects" v={t.assign.length} s={tClasses(t).map((c) => cls(c).name).join(', ') || 'None'} ico="book" tone="p" to="att" />
        <KpiTile l="Lectures today" v={lec.length} s={lec.filter(lecMarked).length + ' attendance marked'} ico="clock" tone="b" to="tt" />
        <KpiTile l="Leave requests waiting" v={pl} s={classTeacherOf(t).length ? 'For your class' : 'You are not a class teacher'} ico="cal" tone="o" to="leave" />
        <KpiTile l="My attendance today" v={own === 'P' ? 'Checked in ' + rec.in : own === 'L' ? 'On leave' : 'Not in yet'} s={own === 'P' || own === 'L' ? '' : 'Use My attendance to check in'} ico="check" tone="g" to="me" />
      </div>
      <div className="two st" style={{ marginBottom: 16 }}>
        <DCard title="Today’s timetable" ico="clock">
          {lec.length ? <DT cols={['Lecture', 'Class', 'Subject', 'Attendance']} rows={lec.map((l) => [<>{l.p} <small>{PT[l.p - 1]}</small></>, cls(l.cid).name, subName(l.sub),
            lecMarked(l) ? <Tag c="ok">Marked</Tag> : <Button size="xs" variant="primary" onClick={() => { const i = t.assign.findIndex((a) => a[0] === l.cid && a[1] === l.sub); S.f.tasg = i < 0 ? 0 : i; S.f.tadate = TODAY; go('att'); }}>Mark now</Button>])} />
            : <Empty t="No lectures today" />}
        </DCard>
        <DCard title="My classes" ico="chart">
          {myCl.length ? (
            <>
              <p className="mut" style={{ marginBottom: 6 }}>Attendance, last 7 days</p>
              <BarRows items={myCl.map((c) => { const a = dayCounts(DB.students.filter((x) => x.cid === c.id && x.active).map((x) => x.id), wkDays); return { label: c.name, val: a.pct, cls: a.pct == null ? '' : a.pct >= 92 ? 'g' : a.pct >= 85 ? 'y' : 'r' }; })} />
              {lx ? <><p className="mut" style={{ margin: '10px 0 6px' }}>Average result, latest exam</p>
              <BarRows items={myCl.map((c) => { const v = classAvg(lx, c.id); return { label: c.name, val: v, cls: v == null ? '' : v >= 60 ? 'g' : v >= 45 ? 'y' : 'r' }; })} /></> : null}
            </>
          ) : <Empty t="No classes assigned" />}
        </DCard>
      </div>
      <div className="two st">
        <div className="stack">
          <DCard title="Quick actions" ico="plus">
            <div className="row">
              <Button variant="primary" onClick={() => go('att')}>Mark attendance</Button>
              <Button variant="outlined" onClick={() => go('hw')}>Add homework</Button>
              <Button variant="outlined" onClick={() => go('res')}>Upload results</Button>
              <Button variant="outlined" onClick={() => go('notify')}>Send notification</Button>
            </div>
          </DCard>
          <DCard title="From the school" ico="mega">
            {f.length ? f.map((x) => <Item key={x.id}><div className="row"><TypeTag t={x.type} /><small>{fs(x.ts.slice(0, 10))}</small></div><h4>{x.title}</h4><p className="mut">{x.text}</p></Item>) : <Empty t="No announcements" />}
          </DCard>
        </div>
        <Attention>
          {pl || todo.length || (isSchool(TODAY) && own !== 'P' && own !== 'L') ? (
            <>
              {pl ? <AttnRow n={pl} t="Leave requests waiting" sub="From students in your class" to="leave" label="Review" /> : null}
              {todo.length ? <AttnRow n={todo.length} t="Lectures without attendance" sub={todo.slice(0, 2).map((l) => cls(l.cid).name + ' ' + subName(l.sub)).join(', ')} to="att" label="Mark" /> : null}
              {isSchool(TODAY) && own !== 'P' && own !== 'L' ? <AttnRow t="You have not checked in today" sub="Check in to record your attendance" to="me" label="Check in" /> : null}
            </>
          ) : <p>All clear. Nothing is waiting for you right now.</p>}
        </Attention>
      </div>
    </>
  );
}

function Att() {
  const t = S.user; if (!t.assign.length) return <><PageHead title="Attendance" /><NoAsg /></>;
  const i = Math.min(+F('tasg', 0), t.assign.length - 1), cid = t.assign[i][0], sub = t.assign[i][1], d = F('tadate', TODAY);
  const sel = <div className="g2" style={{ marginBottom: 14 }}><AsgSel k="tasg" i={i} /><FDate k="tadate" def={TODAY} label="Date" max={TODAY} /></div>;
  const p = [1, 2, 3, 4, 5].find((x) => subjAt(cid, d, x) === sub);
  if (!isSchool(d) || !p) return <><PageHead title="Student attendance" sub="Mark present, absent or leave for each lecture." />{sel}<Empty t="No lecture on this date" s="Pick a school day (Monday to Friday)." /></>;
  const key = markWork(cid, d, p), st = DB.students.filter((s) => s.cid === cid && s.active);
  const locked = (s) => DB.leaves.some((l) => l.sid === s.id && l.status === 'approved' && coversL(l, d, p));
  const cn = { P: 0, A: 0, L: 0, U: 0 }; st.forEach((s) => cn[S.work[s.id] || 'U']++);
  const allP = () => { st.forEach((s) => { if (!locked(s)) S.work[s.id] = 'P'; }); render(); };
  const save = () => {
    if (st.some((s) => !S.work[s.id])) return toast('Mark every student before saving.');
    const old = DB.att[key] || {}, rec = {};
    st.forEach((s) => {
      rec[s.id] = S.work[s.id];
      if (d === TODAY && rec[s.id] === 'A' && old[s.id] !== 'A') parentsOf(s.id).forEach((pr) => ev({ role: 'parent', id: pr.id }, 'Absent in ' + subName(sub), s.name + ' was marked absent in ' + subName(sub) + ' (lecture ' + p + ') today.', 'event'));
    });
    if (d === TODAY) alertAbsent(st.filter((s) => rec[s.id] === 'A' && old[s.id] !== 'A').map((s) => s.id), subName(sub));
    DB.att[key] = rec; render(); toast('Attendance saved for ' + cls(cid).name + ', ' + subName(sub) + '.');
  };
  return (
    <>
      <PageHead title="Student attendance" sub={cls(cid).name + ', ' + subName(sub) + ', lecture ' + p + ' (' + PT[p - 1] + ')'}>
        <Button variant="outlined" onClick={allP}>Mark all present</Button>
        <Button variant="primary" onClick={save}>Save attendance</Button>
      </PageHead>
      {sel}
      <div className="row" style={{ marginBottom: 12 }}>
        <Tag c="ok">{'Present ' + cn.P}</Tag><Tag c="bad">{'Absent ' + cn.A}</Tag><Tag c="warn">{'Leave ' + cn.L}</Tag><Tag>{'Not marked ' + cn.U}</Tag>
        {DB.att[key] ? <Tag c="info">Saved earlier. You can edit it.</Tag> : null}
      </div>
      {st.length ? st.map((s) => (
        <div className="mark" key={s.id}>
          <span className="roll">{s.roll}</span>
          <span className="who"><Av o={s} /><b>{s.name}</b></span>
          {locked(s) ? <Tag c="warn">Approved leave</Tag> : (
            <div className="three" role="group" aria-label={'Attendance for ' + s.name}>
              {['P', 'A', 'L'].map((v) => <button type="button" key={v} className={v} aria-pressed={S.work[s.id] === v} onClick={() => { S.work[s.id] = S.work[s.id] === v ? undefined : v; render(); }}>{v === 'P' ? 'Present' : v === 'A' ? 'Absent' : 'Leave'}</button>)}
            </div>
          )}
        </div>
      )) : <Empty t="No students in this class" />}
    </>
  );
}

function HwForm() {
  const t = S.user;
  const [aiBusy, aiRun] = useAI();
  const [a, setA] = useState('0'), [title, setTitle] = useState(''), [desc, setDesc] = useState(''), [due, setDue] = useState(addDays(TODAY, 2)), [file, setFile] = useState(null), [fk, setFk] = useState(0);
  const add = () => {
    const as = t.assign[+a];
    if (title.trim().length < 3) return toast('Write a title for the homework.');
    if (!due || due < TODAY) return toast('Choose a due date from today onwards.');
    DB.hw.unshift({ id: 'h' + uid(), cid: as[0], sub: as[1], tid: t.id, title: title.trim(), desc: desc.trim() || 'See the teacher’s instructions in class.', due, file: file ? file.name : '', ts: TODAY + 'T' + nowHM() });
    ev({ role: 'parent', cids: [as[0]] }, 'New homework', subName(as[1]) + ': ' + title.trim() + ' (due ' + fs(due) + ').', 'homework');
    setTitle(''); setDesc(''); setFile(null); setFk(fk + 1); render(); toast('Homework posted. Parents can see it now.');
  };
  return (
    <Card title="Add homework">
      <Sel id="hw_a" label="Class and subject" required value={a} onChange={setA} list={asgList()} />
      <div className="field"><TF id="hw_t" label="Title" required value={title} onChange={setTitle} placeholder="For example, Exercise 5.2, Q1 to Q8" /></div>
      <div className="field"><TF id="hw_d" label="Details" required value={desc} onChange={setDesc} multiline minRows={3} placeholder="What should students do?" /></div>
      <div className="row" style={{ margin: '8px 0 12px' }}>
        <Button size="sm" variant="outlined" disabled={aiBusy} onClick={async () => {
          if (title.trim().length < 3) return toast('Write the topic in Title first, then tap Suggest with AI.');
          const as = t.assign[+a];
          const r = await aiRun('homework', { request: 'Write homework instructions for ' + cls(as[0]).name + ', subject ' + subName(as[1]) + ', topic: ' + title.trim() + '. Give 4 to 6 short numbered questions or tasks a student can do at home. ' + (desc.trim() ? 'Teacher notes: ' + desc.trim() : '') });
          if (r) setDesc(r);
        }}>{aiBusy ? 'Writing...' : 'Suggest with AI'}</Button>
        <small className="mut">Write the topic in Title, then let AI draft the details. Edit before posting.</small>
      </div>
      <div className="g2"><DateF id="hw_due" label="Due date" required value={due} onChange={setDue} min={TODAY} /><FileBox key={fk} id="hw_f" label="Attachment (optional)" onChange={setFile} /></div>
      <FormActions><Button fullWidth variant="primary" onClick={add}>Post homework</Button></FormActions>
    </Card>
  );
}
function HwEdit({ w, onClose }) {
  const [title, setTitle] = useState(w.title), [desc, setDesc] = useState(w.desc), [due, setDue] = useState(w.due), [err, setErr] = useState('');
  const save = () => {
    if (title.trim().length < 3) return setErr('Write a title.');
    if (!due) return setErr('Choose a due date.');
    w.title = title.trim(); w.desc = desc; w.due = due; onClose(); render(); toast('Homework updated.');
  };
  return (
    <Modal title="Edit homework" onClose={onClose} error={err} actions={[{ label: 'Save changes', onClick: save }]}>
      <TF label="Title" required value={title} onChange={setTitle} />
      <div className="field"><TF label="Details" required value={desc} onChange={setDesc} multiline minRows={3} /></div>
      <div className="field"><DateF label="Due date" required value={due} onChange={setDue} /></div>
    </Modal>
  );
}
function Hw() {
  const t = S.user; const [edit, setEdit] = useState(null);
  if (!t.assign.length) return <><PageHead title="Homework" /><NoAsg /></>;
  const mine = DB.hw.filter((w) => w.tid === t.id).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <>
      <PageHead title="Homework and assignments" sub="Parents see it as soon as you post." />
      <div className="two">
        <HwForm />
        <Card title="Posted by you">
          {mine.length ? mine.map((w) => {
            const n = Object.keys(DB.hwSub[w.id] || {}).length, tot = DB.students.filter((s) => s.cid === w.cid && s.active).length;
            return (
              <Item key={w.id}>
                <div className="row sp"><h4>{w.title}</h4><Tag c={n === tot ? 'ok' : 'info'}>{n + ' of ' + tot + ' submitted'}</Tag></div>
                <p className="mut">{w.desc}</p>
                <div className="meta"><Tag c="info">{cls(w.cid).name}</Tag><Tag>{subName(w.sub)}</Tag><span>Due {fd(w.due)}</span>{w.file ? <span>Attachment: {w.file}</span> : null}</div>
                <div className="row">
                  <RowActions onEdit={() => setEdit(w)} onDelete={() => ask('Delete this homework?', 'Delete', () => { DB.hw = DB.hw.filter((x) => x.id !== w.id); render(); toast('Homework deleted.'); })} />
                </div>
              </Item>
            );
          }) : <Empty t="No homework yet" s="Use the form to post your first one." />}
        </Card>
      </div>
      {edit && <HwEdit w={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function ResBody({ i, ex, cid, sub, rkey }) {
  const pb = isPub(ex, cid, sub), cur = DB.res[rkey] || {}, st = DB.students.filter((s) => s.cid === cid && s.active);
  const [marks, setMarks] = useState(() => { const o = {}; st.forEach((s) => { o[s.id] = cur[s.id] == null ? '' : String(cur[s.id]); }); return o; });
  const [cmt, setCmt] = useState(false);
  const set = (id, v) => setMarks((m) => Object.assign({}, m, { [id]: v }));
  const save = (pubNow) => {
    const o = {}; let miss = 0, bad = 0;
    st.forEach((s) => { const v = String(marks[s.id] == null ? '' : marks[s.id]).trim(); if (v === '') miss++; else if (isNaN(+v) || +v < 0 || +v > 100) bad++; o[s.id] = v === '' ? '' : +v; });
    if (bad) return toast('Marks must be between 0 and 100.');
    if (pubNow && miss) return toast('Enter marks for every student before publishing (' + miss + ' missing).');
    DB.res[rkey] = o;
    if (pubNow) { DB.pub[rkey] = true; ev({ role: 'parent', cids: [cid] }, 'Result published', subName(sub) + ' marks for ' + EXAMS.find((e) => e.id === ex).name + ' are now available.', 'event'); }
    render(); toast(pubNow ? 'Published. Parents can see these marks.' : 'Draft saved.');
  };
  const csv = (f) => {
    if (!f) return; const r = new FileReader();
    r.onload = () => {
      let n = 0; const next = Object.assign({}, marks);
      String(r.result).split(/\r?\n/).forEach((line) => {
        const p = line.split(','); if (p.length < 2) return;
        const roll = +p[0].trim(), m = p[1].trim(); const s = st.find((x) => x.roll === roll);
        if (s && m !== '' && !isNaN(+m)) { next[s.id] = String(Math.max(0, Math.min(100, +m))); n++; }
      });
      setMarks(next); toast(n ? n + ' marks loaded. Review them, then save or publish.' : 'No valid rows found. Use the format roll,marks.');
    };
    r.readAsText(f);
  };
  return (
    <>
      <PageHead title="Upload results" sub="Enter marks out of 100. Parents see them after you publish.">
        {pb ? <Button variant="outlined" onClick={() => { DB.pub[rkey] = false; render(); toast('Unpublished. You can edit the marks now.'); }}>Unpublish to edit</Button>
          : <><Button variant="outlined" onClick={() => save(false)}>Save draft</Button><Button variant="primary" onClick={() => save(true)}>Publish to parents</Button></>}
      </PageHead>
      <div className="g2" style={{ marginBottom: 14 }}><AsgSel k="tasg" i={i} /><FSel k="texam" def="e3" list={EXAMS.map((e) => [e.id, e.name])} label="Exam" /></div>
      <div className="row" style={{ marginBottom: 12 }}>
        {pb ? <Tag c="ok">Published</Tag> : <Tag c="warn">Draft, not visible to parents</Tag>}
        {pb ? null : <><Button size="sm" variant="secondary" icon="upload" component="label">Upload CSV<input hidden type="file" accept=".csv,.txt" onChange={(e) => { csv(e.target.files[0]); e.target.value = ''; }} /></Button><small>CSV format: roll,marks</small></>}
      </div>
      <div style={{ marginBottom: 12 }}><Button size="sm" variant="outlined" onClick={() => setCmt(true)}>Report card comments (AI)</Button></div>
      {cmt ? <CommentsDialog students={st} marks={marks} exam={EXAMS.find((e) => e.id === ex).name} subject={subName(sub)} onClose={() => setCmt(false)} /> : null}
      <DT cols={['Roll', 'Student', { h: 'Marks /100', n: 1 }, 'Grade']} rows={st.map((s) => {
        const v = marks[s.id], g = v === '' || v == null || isNaN(+v) ? null : Math.max(0, Math.min(100, +v));
        return [s.roll, <Who o={s}>{s.name}</Who>,
          <input type="number" inputMode="numeric" min="0" max="100" value={v} disabled={pb} aria-label={'Marks for ' + s.name} id={'mk_' + s.id} onChange={(e) => set(s.id, e.target.value)}
            className="cell-in" style={{ width: 90, textAlign: 'right' }} />,
          g == null ? '' : <Tag c={gcls(g)}>{gradeOf(g)}</Tag>];
      })} />
    </>
  );
}
function Res() {
  const t = S.user; if (!t.assign.length) return <><PageHead title="Results" /><NoAsg /></>;
  const i = Math.min(+F('tasg', 0), t.assign.length - 1), cid = t.assign[i][0], sub = t.assign[i][1], ex = F('texam', 'e3'), rkey = ex + '|' + cid + '|' + sub;
  return <ResBody key={rkey} i={i} ex={ex} cid={cid} sub={sub} rkey={rkey} />;
}

function LvItem({ l }) {
  const s = stu(l.sid); const [rm, setRm] = useState('');
  const decide = (v) => {
    l.status = v; l.remark = rm.trim() || (v === 'approved' ? 'Approved.' : 'Declined.');
    parentsOf(s.id).forEach((p) => ev({ role: 'parent', id: p.id }, 'Leave ' + v, s.name + ': leave for ' + fs(l.from) + ' was ' + v + '. ' + l.remark, 'leave'));
    render(); toast(v === 'approved' ? 'Leave approved. Attendance will show “Leave”.' : 'Leave declined. The parent was told.');
  };
  return (
    <Item>
      <div className="row sp"><h4>{s.name} <small>{cls(s.cid).name}, roll {s.roll}</small></h4><LeaveChip s={l.status} /></div>
      <div className="meta"><Tag c="info">{leaveLabel(l)}</Tag><span>{leaveDates(l)}</span>{l.attach ? <span>Attachment: {l.attach}</span> : null}</div>
      <p>{l.reason}</p>
      {l.status === 'pending' ? (
        <>
          <TF id={'rm_' + l.id} label="Remark for parent (optional)" value={rm} onChange={setRm} placeholder="For example, Approved. Get well soon." />
          <div className="row" style={{ marginTop: 10 }}>
            <Button size="sm" variant="success" onClick={() => decide('approved')}>Approve</Button>
            <Button size="sm" variant="danger" onClick={() => decide('declined')}>Decline</Button>
          </div>
        </>
      ) : (l.remark ? <div className="meta"><b>Your remark:</b> {l.remark}</div> : null)}
    </Item>
  );
}
function Leave() {
  const t = S.user, mine = classTeacherOf(t);
  if (!mine.length) return <><PageHead title="Leave requests" /><Empty t="You are not a class teacher" s="Leave requests from parents go to the class teacher of each class." /></>;
  const list = DB.leaves.filter((l) => mine.some((c) => c.id === stu(l.sid).cid)).sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || (a.ts < b.ts ? 1 : -1));
  return (
    <>
      <PageHead title="Leave requests" sub={'Approved leave appears in attendance as “Leave”. Class: ' + mine.map((c) => c.name).join(', ')} />
      {list.length ? list.map((l) => <LvItem key={l.id} l={l} />) : <Empty t="No leave requests" />}
    </>
  );
}

function SendForm({ cids }) {
  const t = S.user;
  const [cid, setCid] = useState(cids[0]), [aud, setAud] = useState('all'), [sids, setSids] = useState([]), [type, setType] = useState('test'), [title, setTitle] = useState(''), [body, setBody] = useState(''), [err, setErr] = useState('');
  const st = DB.students.filter((s) => s.cid === cid && s.active);
  const send = () => {
    if (title.trim().length < 3) return setErr('Write a short title.');
    if (body.trim().length < 5) return setErr('Write the message for parents.');
    if (aud === 'sel' && !sids.length) return setErr('Select at least one student.');
    const tgt = st.filter((s) => aud !== 'sel' || sids.includes(s.id)), noP = tgt.filter((s) => !parentsOf(s.id).length);
    if (tgt.length && noP.length === tgt.length) return setErr('No parent is linked to ' + (tgt.length > 1 ? 'these students' : 'this student') + ' yet, so nobody would receive it. Ask the Admin to link parents.');
    const ss = aud === 'sel' ? sids : [];
    DB.anns.unshift({ id: 'a' + uid(), kind: 'announcement', type, title: title.trim(), body: body.trim(), aud: { kind: 'classes', cids: [cid], sids: ss }, by: t.id, ts: TODAY + 'T' + nowHM(), publish: TODAY });
    alertNotice(DB.anns[0]);
    setErr(''); setTitle(''); setBody(''); setSids([]); render();
    toast((noP.length ? noP.length + ' of ' + tgt.length + ' student' + (tgt.length > 1 ? 's have' : ' has') + ' no parent linked yet. ' : '') + 'Notification sent to ' + (ss.length ? ss.length + ' selected student' + (ss.length > 1 ? 's' : '') + '’ parents' : 'parents of ' + cls(cid).name) + '.');
  };
  return (
    <Card title="New notification">
      <Sel id="f_ntc" label="Class" required value={cid} onChange={(v) => { setCid(v); setSids([]); }} list={cids.map((c) => [c, cls(c).name])} />
      <div className="fld" style={{ marginTop: 16 }}><RadioField label="Send to" row name="nt_aud" value={aud} onChange={setAud} options={[['all', 'Whole class'], ['sel', 'Selected students']]} /></div>
      {aud === 'sel' && <CheckGroup cols checked={sids} onChange={setSids} items={st.map((s) => ({ value: s.id, label: s.name }))} />}
      <div className="field"><Sel id="nt_type" label="Type" value={type} onChange={setType} list={[['test', 'Test'], ['reminder', 'Reminder'], ['notice', 'Notice']]} /></div>
      <div className="field"><TF id="nt_t" label="Title" required value={title} onChange={setTitle} placeholder="For example, Maths test tomorrow" /></div>
      <div className="field"><TF id="nt_b" label="Message" required value={body} onChange={setBody} multiline minRows={3} placeholder="Write the message for parents" /></div>
      <Err>{err}</Err>
      <FormActions><Button fullWidth variant="primary" onClick={send}>Send notification</Button></FormActions>
    </Card>
  );
}
function Notify() {
  const t = S.user, tab = F('ntab', 'send');
  const head = <><PageHead title="Notify and date sheet" sub="Send class notifications. The Admin posts the date sheet." /><Seg k="ntab" def="send" list={[['send', 'Send notification'], ['sheet', 'Date sheets']]} /><div style={{ marginTop: 14 }} /></>;
  if (!t.assign.length) return <>{head}<NoAsg /></>;
  if (tab === 'send') {
    const mine = DB.anns.filter((a) => a.by === t.id).sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return (
      <>{head}
        <div className="two">
          <SendForm cids={tClasses(t)} />
          <Card title="Sent by you">
            {mine.length ? mine.map((a) => <Item key={a.id}><div className="row"><TypeTag t={a.type} fallback="Notice" /><small>{fd(a.ts.slice(0, 10))}</small></div><h4>{a.title}</h4><p className="mut">{a.body}</p><div className="meta">To {audLabel(a.aud)}</div></Item>) : <Empty t="Nothing sent yet" />}
          </Card>
        </div>
      </>
    );
  }
  const mine = DB.datesheet.filter((d) => cls(d.cid) && t.assign.some((a) => a[0] === d.cid)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return (
    <>{head}
      <Card title="Date sheet for your classes">
        {mine.length ? <DT cols={['Class', 'Exam', 'Subject', 'Date', 'Time', 'Room']} rows={mine.map((d) => [cls(d.cid).name, d.exam || '', subName(d.sub), fd(d.date), d.time || '', d.room || ''])} /> : <Empty t="No papers yet" s="The Admin posts the date sheet." />}
      </Card>
    </>
  );
}

function Parents() {
  const t = S.user, cids = tClasses(t); if (!cids.length) return <><PageHead title="Parents" /><NoAsg /></>;
  const cid = cids.includes(F('tpc', cids[0])) ? F('tpc', cids[0]) : cids[0];
  return (
    <>
      <PageHead title="Parents" sub="Parents of the students in your classes. Only the Admin can add or remove them." />
      <div style={{ maxWidth: 320, marginBottom: 14 }}><FSel k="tpc" def={cid} list={cids.map((c) => [c, cls(c).name])} label="Class" /></div>
      {DB.students.filter((s) => s.cid === cid && s.active).map((s) => {
        const ps = parentsOf(s.id);
        return (
          <Item key={s.id}>
            <div className="row sp"><h4 className="who"><Av o={s} />{s.roll}. {s.name}</h4></div>
            {ps.length ? ps.map((p) => <div className="row sp" key={p.id}><span>{p.name} <small>{p.rel}, {p.phone}</small></span></div>) : <div className="meta">No parent linked yet. Ask the Admin to link a parent.</div>}
          </Item>
        );
      })}
    </>
  );
}

function LeaveApply() {
  const t = S.user;
  const [type, setType] = useState('Casual'), [from, setFrom] = useState(nextSchool(addDays(TODAY, 1))), [to, setTo] = useState(nextSchool(addDays(TODAY, 1))), [reason, setReason] = useState(''), [err, setErr] = useState('');
  const submit = () => {
    const to2 = type === 'Half day' ? from : to;
    if (!from) return setErr('Choose the first date.');
    if (from < TODAY) return setErr('The date cannot be in the past.');
    if (to2 < from) return setErr('The last date cannot be before the first date.');
    if (reason.trim().length < 5) return setErr('Write the reason for leave.');
    DB.tleaves.unshift({ id: 'tl' + uid(), tid: t.id, type, from, to: to2, reason: reason.trim(), status: 'pending', remark: '', ts: TODAY + 'T' + nowHM() });
    ev({ role: 'principal' }, 'Teacher leave request', t.name + ' requested leave for ' + fd(from) + '.', 'leave');
    setErr(''); setReason(''); render(); toast('Leave request sent to the principal.');
  };
  return (
    <Card title="Apply for leave">
      <Sel id="tl_type" label="Type" value={type} onChange={setType} list={['Casual', 'Medical', 'Official duty', 'Half day'].map((x) => [x, x])} />
      <div className="g2 field"><DateF id="tl_from" label="From" required value={from} onChange={setFrom} min={TODAY} /><DateF id="tl_to" label="To" required value={to} onChange={setTo} min={TODAY} /></div>
      <div className="field"><TF id="tl_reason" label="Reason" required value={reason} onChange={setReason} multiline minRows={3} placeholder="Reason for leave" /></div>
      <Err>{err}</Err>
      <FormActions><Button fullWidth variant="primary" onClick={submit}>Send to principal</Button></FormActions>
    </Card>
  );
}
function Me() {
  const t = S.user, own = tStatus(t.id, TODAY), rec = DB.tatt[t.id + '|' + TODAY], month = F('tmonth', CM());
  const days = ALLD.filter((d) => d.indexOf(month) === 0);
  const cn = { P: 0, A: 0, L: 0 }; days.forEach((d) => { const x = tStatus(t.id, d); if (x) cn[x]++; });
  const hist = DB.tleaves.filter((l) => l.tid === t.id).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <>
      <PageHead title="My attendance and leave" sub={fd(TODAY)} />
      <div className="two">
        <div className="stack">
          <Card title="Today">
            <div className="row sp">
              <div>{own === 'P' ? <><b>Checked in at {rec.in}</b><div className="mut">{rec.out ? 'Checked out at ' + rec.out : 'Not checked out yet'}</div></> : own === 'L' ? <b>On approved leave</b> : <b>Not checked in yet</b>}</div>
              <div className="row">
                {own === 'P' ? (rec.out ? <Tag c="ok">Day complete</Tag> : <Button variant="primary" onClick={() => { DB.tatt[t.id + '|' + TODAY].out = nowHM(); render(); toast('Checked out at ' + nowHM() + '.'); }}>Check out</Button>)
                  : own === 'L' ? null : <Button variant="success" onClick={() => { DB.tatt[t.id + '|' + TODAY] = { in: nowHM(), out: '' }; render(); toast('Checked in at ' + nowHM() + '.'); }}>Check in</Button>}
              </div>
            </div>
          </Card>
          <Card>
            <div className="row sp" style={{ marginBottom: 10 }}><h3>Monthly record</h3><div style={{ width: 190 }}><FSel k="tmonth" def={CM()} list={monthOptions()} label="Month" /></div></div>
            <div className="row" style={{ marginBottom: 10 }}><Tag c="ok">{'Present ' + cn.P}</Tag><Tag c="bad">{'Absent ' + cn.A}</Tag><Tag c="warn">{'Leave ' + cn.L}</Tag></div>
            <div style={{ maxHeight: 340, overflow: 'auto' }}>
              <DT cols={['Date', 'Status', 'In', 'Out']} rows={days.slice().reverse().map((d) => { const x = tStatus(t.id, d), r = DB.tatt[t.id + '|' + d] || {}; return [fd(d), <StChip st={x} />, r.in || '', r.out || '']; })} />
            </div>
          </Card>
        </div>
        <div className="stack">
          <LeaveApply />
          <Card title="My leave history">
            {hist.length ? hist.map((l) => <Item key={l.id}><div className="row sp"><b>{l.type}</b><LeaveChip s={l.status} /></div><div className="meta">{leaveDates(l)}</div><p>{l.reason}</p>{l.remark ? <div className="meta"><b>Principal’s remark:</b> {l.remark}</div> : null}</Item>) : <Empty t="No leave yet" />}
          </Card>
        </div>
      </div>
    </>
  );
}

function Tt() {
  const t = S.user; if (!t.assign.length) return <><PageHead title="Timetable" /><NoAsg /></>;
  const total = [0, 1, 2, 3, 4].reduce((n, i) => n + [1, 2, 3, 4, 5].filter((p) => t.assign.some((a) => ttCell(a[0], i, p) === a[1])).length, 0);
  return (
    <>
      <PageHead title="Timetable" sub={'Your lectures in the week: ' + total + '.'} />
      <Card><TtGrid hl cell={(i, p) => { const m = t.assign.filter((a) => ttCell(a[0], i, p) === a[1]); return m.length ? m.map((a, k) => <div key={k}><b>{cls(a[0]).name}</b><br /><small>{subName(a[1])}</small></div>) : <span className="mut">Free</span>; }} /></Card>
    </>
  );
}

export const teacherViews = { home: Home, att: Att, hw: Hw, res: Res, leave: Leave, tt: Tt, notify: Notify, parents: Parents, me: Me };
