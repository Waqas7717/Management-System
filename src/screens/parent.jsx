import { DCard, KpiTile, Ticker } from '../ui/dash';
import { Translate } from './aiparts';
import { useState } from 'react';
import { Button } from '@mui/material';
import { DEMO } from '../core/config';
import {
  CLASSES, DB, EXAMS, S, F, byName, cls, classAvg, agg, dayStatus, ev, feed, gcls, gradeOf, isPub, isRead, kidsOf, leaveDates, leaveLabel, lectures,
  money, ord, ranks, stuResult, subName, teacherFor, uid, unread,
} from '../core/data';
import { ALLD, CM, DAYN, PT, TODAY, addDays, dow, fd, fs, isSchool, monthLabel, monthOptions, nextSchool, nowHM, pad } from '../core/dates';
import { go, } from '../core/actions';
import { render, toast } from '../core/store';
import { saveReads } from '../core/sync';
import { COLORS, LineChart } from '../ui/Charts';
import { Card, CheckGroup, DT, DateF, Empty, FSel, FileBox, Item, Kpi, LeaveChip, PageHead, Sel, Seg, StChip, TF, Tag, TypeTag, Err } from '../ui';
import { TtGrid } from './common';

function curKid() {
  const kids = kidsOf(S.user);
  if (!kids.find((k) => k.id === S.child)) S.child = kids[0] ? kids[0].id : null;
  return kids.find((k) => k.id === S.child) || null;
}
function KidSwitch() {
  const kids = kidsOf(S.user);
  if (kids.length < 2) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <Seg label="Choose child" value={S.child} onChange={(id) => { S.child = id; S.f.aday = TODAY; render(); }} list={kids.map((k) => [k.id, k.name.split(' ')[0], cls(k.cid).name])} />
    </div>
  );
}
const NoKid = () => <><PageHead title="No child linked" /><Empty t="No child is linked to this account" s="Please contact the school office." /></>;

function FeeBox({ k }) {
  const amt = cls(k.cid).level === 'school' ? 1200 : 2000, due = !!DB.feeDue[k.id];
  return <div className="row sp"><div><div className="mut">November fee</div><b style={{ fontSize: 20 }}>{money(amt)}</b></div>{due ? <Tag c="warn">Due by 15 Nov</Tag> : <Tag c="ok">Paid</Tag>}</div>;
}
const LecTable = ({ lec }) => (
  <DT cols={['Lecture', 'Subject', 'Teacher', 'Status']} rows={lec.map((x) => [<>{x.p} <small>{PT[x.p - 1]}</small></>, subName(x.sub), x.t.name, <StChip st={x.st} />])} />
);

function Home() {
  const k = curKid(); if (!k) return <NoKid />;
  const c = cls(k.cid), lec = lectures(k.id, TODAY), marked = lec.filter((x) => x.st), pres = marked.filter((x) => x.st === 'P').length;
  const pend = DB.hw.filter((w) => w.cid === k.cid && !(DB.hwSub[w.id] || {})[k.id] && w.due >= TODAY).sort((a, b) => (a.due < b.due ? -1 : 1));
  const exam = DB.datesheet.filter((d) => d.cid === k.cid && d.date >= TODAY).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const f = feed().slice(0, 3);
  const newHw = DB.hw.filter((w) => w.cid === k.cid && w.ts.slice(0, 10) === TODAY).length;
  return (
    <>
      <PageHead title={'Welcome, ' + S.user.name} sub={fd(TODAY) + '. ' + k.name + ', ' + c.name + ', roll ' + k.roll} />
      <KidSwitch />
      <Ticker />
      <div className="g4" style={{ marginBottom: 16 }}>
        <KpiTile l="Attendance today" v={marked.length ? pres + ' of ' + marked.length : 'Not marked'} vs={22} s={marked.length ? 'lectures present' : 'Teachers are still marking'} ico="check" tone="g" to="att" />
        <KpiTile l="Homework pending" v={pend.length} s={newHw ? newHw + ' new today' : 'Nothing new today'} ico="book" tone="p" to="hw" />
        <KpiTile l="Next paper" v={exam ? subName(exam.sub) : 'None yet'} vs={19} s={exam ? fd(exam.date) + ', ' + exam.time : 'No date sheet'} ico="file" tone="o" to="sheet" />
        <KpiTile l="Unread notices" v={unread()} s="Tap the bell to read" ico="mega" tone="b" to="notices" />
      </div>
      <div className="two st">
        <div className="stack">
          <DCard title="Today’s lectures" ico="clock">{lec.length ? <LecTable lec={lec} /> : <Empty t="No classes today" />}</DCard>
          <DCard title="Homework to do" ico="book" right={<Button size="small" onClick={() => go('hw')}>View all</Button>}>
            {pend.length ? pend.slice(0, 4).map((w) => <Item key={w.id}><div className="row sp"><b>{w.title}</b><Tag c="info">{subName(w.sub)}</Tag></div><div className="meta">Due {fd(w.due)}</div></Item>) : <Empty t="All caught up" s="No pending homework." />}
          </DCard>
        </div>
        <div className="stack">
          <DCard title="Fee voucher" ico="file"><FeeBox k={k} /></DCard>
          <DCard title="Latest from school" ico="mega" right={<Button size="small" onClick={() => go('notices')}>View all</Button>}>
            {f.length ? f.map((x) => <Item key={x.id} unread={!isRead(x.id)}><div className="row"><TypeTag t={x.type} /><small>{fs(x.ts.slice(0, 10))}</small></div><h4>{x.title}</h4><p className="mut">{x.text}</p><Translate text={x.title + '. ' + x.text} /></Item>) : <Empty t="No notices yet" />}
          </DCard>
        </div>
      </div>
    </>
  );
}

function Att() {
  const k = curKid(); if (!k) return <NoKid />;
  const month = F('amonth', CM()), day = F('aday', TODAY);
  const first = month + '-01', dim = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
  const cells = DAYN.map((d) => <div className="h" key={'h' + d}>{d}</div>);
  for (let i = 0; i < dow(first); i++) cells.push(<div className="c off" key={'o' + i} />);
  for (let d = 1; d <= dim; d++) {
    const ds = month + '-' + pad(d);
    if (!isSchool(ds)) { cells.push(<div className="c off" key={ds}>{d}</div>); continue; }
    const st = dayStatus(k.id, ds);
    cells.push(<button type="button" key={ds} className={(st || '') + (ds === day ? ' sel' : '')} onClick={() => { S.f.aday = ds; render(); }}
      aria-label={fd(ds) + ': ' + (st === 'P' ? 'present' : st === 'A' ? 'absent' : st === 'L' ? 'leave' : st === 'M' ? 'partly present' : 'not marked')}>{d}</button>);
  }
  const a = agg([k.id], ALLD.filter((d) => d.indexOf(month) === 0)), all = agg([k.id], ALLD);
  const lec = lectures(k.id, day);
  const subs = cls(k.cid).subjects.map((sb) => ({ sb, a: agg([k.id], ALLD, sb) }));
  return (
    <>
      <PageHead title="Attendance" sub={k.name + ', ' + cls(k.cid).name} />
      <KidSwitch />
      <div className="g4" style={{ marginBottom: 14 }}>
        <Kpi l="Overall attendance" v={all.pct == null ? '-' : Math.round(all.pct) + '%'} s={DEMO ? 'Since 1 October' : 'Last 5 weeks'} />
        <Kpi l="Present lectures" v={all.P} /><Kpi l="Absent lectures" v={all.A} />
        <Kpi l="Leave lectures" v={all.L} s="Approved leave is not counted against you" />
      </div>
      <div className="two eq">
        <Card>
          <div className="row sp" style={{ marginBottom: 10 }}>
            <h3>{monthLabel(month)}</h3>
            <div style={{ width: 190 }}><FSel k="amonth" def={CM()} list={monthOptions()} label="Month" /></div>
          </div>
          <div className="cal">{cells}</div>
          <div className="legend"><Tag c="ok">Present</Tag><Tag c="bad">Absent</Tag><Tag c="warn">Leave</Tag><Tag c="info">Partly present</Tag></div>
          <p className="mut" style={{ marginTop: 8, fontSize: 13 }}>{a.pct == null ? 'No attendance marked this month.' : 'This month: ' + Math.round(a.pct) + '% (' + a.P + ' present, ' + a.A + ' absent, ' + a.L + ' leave)'}</p>
        </Card>
        <Card title={'Lectures on ' + fd(day)}>{lec.length ? <LecTable lec={lec} /> : <Empty t="No classes on this day" />}</Card>
      </div>
      <Card title="Subject-wise attendance" style={{ marginTop: 14 }}>
        <DT cols={['Subject', { h: 'Present', n: 1 }, { h: 'Absent', n: 1 }, { h: 'Leave', n: 1 }, { h: 'Attendance', n: 1 }]}
          rows={subs.map((x) => [subName(x.sb), x.a.P, x.a.A, x.a.L, <b>{x.a.pct == null ? '-' : Math.round(x.a.pct) + '%'}</b>])} />
      </Card>
    </>
  );
}

function Hw() {
  const k = curKid(); if (!k) return <NoKid />;
  const flt = F('hwf', 'all');
  let list = DB.hw.filter((w) => w.cid === k.cid).sort((a, b) => (a.due < b.due ? -1 : 1));
  const done = (w) => !!(DB.hwSub[w.id] || {})[k.id];
  if (flt === 'pending') list = list.filter((w) => !done(w));
  if (flt === 'done') list = list.filter(done);
  const toggle = (id) => {
    DB.hwSub[id] = DB.hwSub[id] || {};
    if (DB.hwSub[id][k.id]) delete DB.hwSub[id][k.id]; else DB.hwSub[id][k.id] = true;
    render(); toast(DB.hwSub[id][k.id] ? 'Marked as submitted.' : 'Marked as pending again.');
  };
  return (
    <>
      <PageHead title="Homework and assignments" sub={k.name + ', ' + cls(k.cid).name} />
      <KidSwitch />
      <Seg k="hwf" def="all" list={[['all', 'All'], ['pending', 'Pending'], ['done', 'Submitted']]} />
      <div style={{ marginTop: 14 }}>
        {list.length ? list.map((w) => {
          const dn = done(w), late = !dn && w.due < TODAY;
          return (
            <Item key={w.id}>
              <div className="row sp"><h4>{w.title}</h4>{dn ? <Tag c="ok">Submitted</Tag> : late ? <Tag c="bad">Overdue</Tag> : <Tag c="warn">Pending</Tag>}</div>
              <p className="mut">{w.desc}</p>
              <div className="meta"><Tag c="info">{subName(w.sub)}</Tag><span>Due {fd(w.due)}</span><span>{byName(w.tid)}</span>{w.file ? <span>Attachment: {w.file}</span> : null}</div>
              <div><Button size="small" variant={dn ? 'outlined' : 'contained'} onClick={() => toggle(w.id)}>{dn ? 'Undo submitted' : 'Mark as submitted'}</Button></div>
            </Item>
          );
        }) : <Empty t="Nothing here" s="No homework matches this filter." />}
      </div>
    </>
  );
}

function LeaveForm({ k }) {
  const [type, setType] = useState('full'), [from, setFrom] = useState(nextSchool(TODAY)), [to, setTo] = useState(addDays(nextSchool(TODAY), 1));
  const [lec, setLec] = useState([]), [reason, setReason] = useState(''), [file, setFile] = useState(null), [err, setErr] = useState('');
  const submit = () => {
    const f2 = type === 'multi' ? to : from;
    if (!from) return setErr('Choose the date of leave.');
    if (from < TODAY) return setErr('The leave date cannot be in the past.');
    if (!isSchool(from)) return setErr('The leave date must be a school day (Monday to Friday).');
    if (type === 'multi' && (!to || to <= from)) return setErr('The last date must be after the first date.');
    if (type === 'lectures' && !lec.length) return setErr('Select at least one lecture.');
    if (reason.trim().length < 10) return setErr('Please write the reason in at least 10 characters.');
    const ctT = DB.teachers.find((x) => x.id === cls(k.cid).ct && x.active);
    if (!ctT) return setErr('This class has no active class teacher right now, so the request cannot be sent. Please contact the school office.');
    DB.leaves.unshift({ id: 'l' + uid(), sid: k.id, type, from, to: f2, lectures: lec.map(Number), reason: reason.trim(), attach: file ? file.name : '', status: 'pending', remark: '', ts: TODAY + 'T' + nowHM() });
    ev({ role: 'teacher', id: ctT.id }, 'New leave request', k.name + ' (' + cls(k.cid).name + ') requested leave for ' + fd(from) + '.', 'leave');
    setErr(''); setReason(''); setLec([]); setFile(null); render(); toast('Leave request sent to ' + ctT.name + '.');
  };
  const ctOk = DB.teachers.some((x) => x.id === cls(k.cid).ct && x.active);
  return (
    <Card title={'Apply for leave for ' + k.name.split(' ')[0]}>
      <Sel id="lv_type" label="Type of leave" value={type} onChange={setType} list={[['full', 'Full day'], ['half1', 'Half day, first half (lectures 1 to 3)'], ['half2', 'Half day, second half (lectures 4 and 5)'], ['lectures', 'Specific lectures'], ['multi', 'Multiple days']]} />
      <div className="g2 field">
        <DateF id="lv_from" label="From date" value={from} onChange={setFrom} min={TODAY} />
        {type === 'multi' && <DateF id="lv_to" label="To date" value={to} onChange={setTo} min={TODAY} />}
      </div>
      {type === 'lectures' && <><label className="flabel">Lectures</label><CheckGroup cols checked={lec} onChange={setLec} items={[1, 2, 3, 4, 5].map((p) => ({ value: String(p), label: 'Lecture ' + p, small: PT[p - 1] }))} /></>}
      <div className="field"><TF id="lv_reason" label="Reason" value={reason} onChange={setReason} multiline minRows={3} placeholder="Please explain why your child needs leave" /></div>
      <FileBox id="lv_file" label="Attachment (optional, for example a medical note)" onChange={setFile} />
      <Err>{err}</Err>
      <Button fullWidth variant="contained" onClick={submit}>Send to class teacher</Button>
      <p className="mut" style={{ marginTop: 10, fontSize: 13 }}>
        {ctOk ? 'Your request goes to ' + byName(cls(k.cid).ct) + ', the class teacher.' : <b>This class has no active class teacher right now. Please contact the school office.</b>} Approved leave shows as “Leave” in attendance.
      </p>
    </Card>
  );
}
function Leave() {
  const k = curKid(); if (!k) return <NoKid />;
  const hist = DB.leaves.filter((l) => l.sid === k.id).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <>
      <PageHead title="Leave" sub="Apply for leave and track the decision." />
      <KidSwitch />
      <div className="two">
        <LeaveForm key={k.id} k={k} />
        <Card title="Leave history">
          {hist.length ? hist.map((l) => (
            <Item key={l.id}>
              <div className="row sp"><b>{leaveLabel(l)}</b><LeaveChip s={l.status} /></div>
              <div className="meta">{leaveDates(l)}</div><p>{l.reason}</p>
              {l.attach ? <div className="meta">Attachment: {l.attach}</div> : null}
              {l.remark ? <div className="meta"><b>Teacher’s remark:</b> {l.remark}</div> : null}
              {l.status === 'pending' ? <div><Button size="small" variant="outlined" onClick={() => { l.status = 'cancelled'; render(); toast('Leave request cancelled.'); }}>Cancel request</Button></div> : null}
            </Item>
          )) : <Empty t="No leave requests yet" />}
        </Card>
      </div>
    </>
  );
}

function Res() {
  const k = curKid(); if (!k) return <NoKid />;
  const avail = EXAMS.filter((e) => cls(k.cid).subjects.some((sb) => isPub(e.id, k.cid, sb)));
  if (!avail.length) return <><PageHead title="Results" /><KidSwitch /><Empty t="No results published yet" /></>;
  let ex = F('rexam', ''); if (!avail.find((e) => e.id === ex)) ex = avail[avail.length - 1].id;
  const r = stuResult(ex, k), rk = ranks(ex, k.cid), pos = rk.map[k.id];
  const trend = avail.map((e) => stuResult(e.id, k).pct), cavg = avail.map((e) => classAvg(e.id, k.cid));
  return (
    <>
      <PageHead title="Results" sub={k.name + ', ' + cls(k.cid).name} />
      <KidSwitch />
      <div style={{ maxWidth: 360 }}><FSel k="rexam" def={ex} list={avail.map((e) => [e.id, e.name])} label="Exam" /></div>
      <div className="g4" style={{ margin: '14px 0' }}>
        <Kpi l="Total" v={<>{r.tot} <small>/ {r.n * 100}</small></>} />
        <Kpi l="Percentage" v={r.pct == null ? '-' : r.pct.toFixed(1) + '%'} />
        <Kpi l="Grade" v={gradeOf(r.pct)} />
        <Kpi l="Class position" v={pos ? ord(pos) : '-'} s={pos ? 'out of ' + rk.count + ' students' : 'Shown when all subjects are published'} />
      </div>
      <div className="two eq">
        <Card title="Subject-wise marks">
          <DT cols={['Subject', { h: 'Marks /100', n: 1 }, 'Grade']} rows={r.rows.map((x) => [subName(x.sub), x.m === null ? 'Pending' : x.m, x.m === null ? '' : <Tag c={gcls(x.m)}>{gradeOf(x.m)}</Tag>])} />
        </Card>
        <Card title="Progress across exams">
          {avail.length > 1
            ? <LineChart labels={avail.map((e) => e.name.replace('Monthly Test ', 'Test ').replace('First Term ', 'Term '))} series={[{ name: k.name.split(' ')[0], color: COLORS[0], values: trend }, { name: 'Class average', color: COLORS[1], values: cavg }]} />
            : <Empty t="One exam so far" s="The chart appears after a second exam." />}
        </Card>
      </div>
    </>
  );
}

function Notices() {
  const flt = F('nf', 'all'); let f = feed(); if (flt !== 'all') f = f.filter((x) => x.type === flt);
  return (
    <>
      <PageHead title="Notices and notifications" sub="PTM, announcements, tests and updates from school." />
      <Seg k="nf" def="all" list={[['all', 'All'], ['ptm', 'PTM'], ['notice', 'Notices'], ['test', 'Tests'], ['event', 'Events'], ['urgent', 'Urgent'], ['homework', 'Homework'], ['leave', 'Leave']]} />
      <div style={{ marginTop: 14 }}>
        {f.length ? f.map((x) => (
          <Item key={x.id} unread={!isRead(x.id)}>
            <div className="row sp"><span className="row"><TypeTag t={x.type} /><small>{fd(x.ts.slice(0, 10))}</small></span>{isRead(x.id) ? null : <Tag c="gold">New</Tag>}</div>
            <h4>{x.title}</h4><p>{x.text}</p>
            <Translate text={x.title + '. ' + x.text} />
            {x.by ? <div className="meta">From {byName(x.by)}</div> : null}
            {isRead(x.id) ? null : <div><Button size="small" variant="outlined" onClick={() => { S.reads[S.user.id][x.id] = true; saveReads(); render(); }}>Mark as read</Button></div>}
          </Item>
        )) : <Empty t="Nothing here" s="No notices match this filter." />}
      </div>
    </>
  );
}

function Sheet() {
  const k = curKid(); if (!k) return <NoKid />;
  const list = DB.datesheet.filter((d) => d.cid === k.cid).sort((a, b) => (a.date < b.date ? -1 : 1));
  const groups = {}; list.forEach((d) => { (groups[d.exam] = groups[d.exam] || []).push(d); });
  return (
    <>
      <PageHead title="Date sheet" sub={k.name + ', ' + cls(k.cid).name} />
      <KidSwitch />
      {Object.keys(groups).length ? Object.keys(groups).map((g) => (
        <Card key={g} title={g}><DT cols={['Date', 'Subject', 'Time', 'Room']} rows={groups[g].map((d) => [fd(d.date), subName(d.sub), d.time, d.room])} /></Card>
      )) : <Empty t="No date sheet yet" s="Teachers will upload it before the papers." />}
    </>
  );
}

function Tt() {
  const k = curKid(); if (!k) return <NoKid />;
  const c = cls(k.cid);
  return (
    <>
      <PageHead title="Timetable" sub={c.name + (c.room ? ', ' + c.room : '') + '. Lectures start at ' + PT[0] + '.'} />
      <KidSwitch />
      <Card><TtGrid hl cell={(i, p) => { const sb = ttCellOf(k.cid, i, p), t = teacherFor(k.cid, sb); return <><b>{subName(sb)}</b><br /><small>{t.id ? t.name : ''}</small></>; }} /></Card>
    </>
  );
}
import { ttCell as ttCellOf } from '../core/data';

export const parentViews = { home: Home, att: Att, hw: Hw, leave: Leave, res: Res, notices: Notices, sheet: Sheet, tt: Tt };
