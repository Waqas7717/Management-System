import { useState } from 'react';
import { Button, TextField } from '@mui/material';
import { DEMO } from '../core/config';
import {
  CLASSES, DB, EXAMS, S, F, SUBJ, agg, cls, classAvg, classPass, effStatus, ev, gcls, gradeOf, isPub, latestExam, leaveDates, ord, ranks, stuResult, subName, subjAt,
  subjAvg, tStatus, tch,
} from '../core/data';
import { ALLD, CM, WEEKS, TODAY, fd, fs, isSchool, monthOptions, schoolDays } from '../core/dates';
import { render, toast } from '../core/store';
import { BarRows, COLORS, LineChart, Split } from '../ui/Charts';
import { Av, Card, DT, DateF, Empty, FDate, FSel, Item, Kpi, LeaveChip, PageHead, Pill, Seg, StChip, TF, Tag, Who } from '../ui';
import { AnnScreen } from './common';
import { UsersList } from './admin/users';
import { AiHub, InsightsCard } from './aiparts';
import { AttnRow, Attention, ClassCards, DCard, KpiTile, RangeChips, StaffCheckin, Ticker, dayCounts, rangeInfo } from '../ui/dash';

const dc = () => (CLASSES.length ? CLASSES[0].id : 'all');
const lvOpts = [['all', 'All'], ['school', 'Schools'], ['college', 'College']];
const col = (i) => COLORS[i % COLORS.length];

function Dash() {
  const lv = F('dlevel', 'all'), cl = CLASSES.filter((c) => lv === 'all' || c.level === lv), cids = cl.map((c) => c.id);
  const rng = rangeInfo();
  const studs = DB.students.filter((s) => s.active && cids.includes(s.cid)), tod = dayCounts(studs.map((s) => s.id), rng.dates);
  const ts = { P: 0, A: 0, L: 0, N: 0 }; DB.teachers.filter((t) => t.active).forEach((t) => { ts[tStatus(t.id, TODAY) || 'N']++; });
  const tp = (ts.P + ts.A) ? ts.P / (ts.P + ts.A) * 100 : null;
  const pend = DB.tleaves.filter((l) => l.status === 'pending').length + DB.leaves.filter((l) => l.status === 'pending').length;
  const ex = latestExam(), exn = EXAMS.find((e) => e.id === ex).name;
  const avgs = cl.map((c) => ({ c, a: classAvg(ex, c.id), p: classPass(ex, c.id) })).filter((x) => x.a != null).sort((a, b) => b.a - a.a);
  const subs = Object.keys(SUBJ).map((sb) => ({ sb, a: subjAvg(ex, sb, cids) })).filter((x) => x.a != null).sort((a, b) => b.a - a.a);
  const attc = cl.map((c) => ({ c, a: agg(DB.students.filter((s) => s.cid === c.id && s.active).map((s) => s.id), ALLD) }));
  const wk = cl.map((c, i) => ({ name: c.name, color: col(i), values: WEEKS.map((w) => agg(DB.students.filter((s) => s.cid === c.id && s.active).map((s) => s.id), schoolDays(w[1], w[2])).pct) }));
  const exs = EXAMS.filter((e) => cl.some((c) => classAvg(e.id, c.id) != null));
  const tr = cl.map((c, i) => ({ name: c.name, color: col(i), values: exs.map((e) => classAvg(e.id, c.id)) }));
  const nAct = DB.teachers.filter((t) => t.active).length;
  const lowest = avgs.length > 1 ? avgs[avgs.length - 1] : null;
  const unmarked = cl.filter((c) => { const a = dayCounts(DB.students.filter((x) => x.cid === c.id && x.active).map((x) => x.id), isSchool(TODAY) ? [TODAY] : []); return !(a.P + a.A + a.L); });
  return (
    <>
      <PageHead title="Principal’s dashboard" sub={fd(TODAY) + '. FG Public School and College' + (DEMO ? ' (demo)' : '')}>
        <Seg k="dlevel" def="all" list={lvOpts} label="Level" />
        <RangeChips />
      </PageHead>
      <Ticker />
      <div className="g4" style={{ marginBottom: 16 }}>
        <KpiTile l="Total students" v={studs.length} s={cl.length + (cl.length > 1 ? ' classes' : ' class')} ico="cap" tone="b" to={{ view: 'users', f: { utab: 'students' } }} />
        <KpiTile l="Teachers" v={nAct} s={ts.L + ' on leave today'} ico="book" tone="p" to={{ view: 'users', f: { utab: 'teachers' } }} />
        <KpiTile l={rng.today ? 'Student attendance today' : 'Student attendance, ' + rng.label.toLowerCase()} v={tod.pct == null ? '-' : Math.round(tod.pct) + '%'} s={tod.P + tod.A + tod.L ? tod.P + ' present, ' + tod.A + ' absent, ' + tod.L + ' leave' : 'Not marked yet'} ico="check" tone="g" to={{ view: 'att', f: { patab: 'students' } }} />
        <KpiTile l="Teacher attendance today" v={tp == null ? '-' : Math.round(tp) + '%'} s={ts.P + ' in, ' + ts.N + ' not in yet, ' + ts.L + ' leave'} ico="clock" tone="o" to={{ view: 'att', f: { patab: 'teachers' } }} />
        <KpiTile l="Pending leave requests" v={pend} s="Students and teachers" ico="cal" tone="r" to="leave" />
      </div>
      <AiHub />
      <div className="two st wide" style={{ marginBottom: 16 }}>
        <ClassCards classes={cl} range={rng} />
        <DCard title={rng.today ? 'Students today' : 'Students, ' + rng.label.toLowerCase()} ico="check">
          <Split items={[{ label: 'Present', value: tod.P, color: '#1F8A55' }, { label: 'Absent', value: tod.A, color: '#C0392B' }, { label: 'Leave', value: tod.L, color: '#F7B500' }]}
            centerTop={tod.pct == null ? 'None' : Math.round(tod.pct) + '%'} centerBottom={tod.pct == null ? 'not marked' : 'present'} />
        </DCard>
      </div>
      <div className="two st" style={{ marginBottom: 16 }}>
        <StaffCheckin to="users" tab="teachers" />
        <Attention>
          {pend || ts.N || lowest || unmarked.length ? (
            <>
              {pend ? <AttnRow n={pend} t="Leave requests waiting" sub="Students and teachers" to="leave" label="Review" /> : null}
              {isSchool(TODAY) && ts.N ? <AttnRow n={ts.N} t="Teachers not in yet" sub="Check-in is still open today" to={{ view: 'att', f: { patab: 'teachers' } }} /> : null}
              {isSchool(TODAY) && unmarked.length ? <AttnRow n={unmarked.length} t="Classes with attendance not marked" sub={unmarked.map((c) => c.name).join(', ')} to="att" /> : null}
              {lowest ? <AttnRow t={'Needs support: ' + lowest.c.name} sub={'Average ' + lowest.a.toFixed(1) + '%, pass rate ' + Math.round(lowest.p) + '%'} to="res" label="Results" /> : null}
            </>
          ) : <p>All clear. Nothing is waiting for you right now.</p>}
        </Attention>
      </div>
      <div style={{ marginBottom: 16 }}><InsightsCard /></div>
      <div className="two eq" style={{ marginTop: 14 }}>
        <Card title="Class-wise results">
          <p className="mut" style={{ marginBottom: 10 }}>{exn}, average percentage</p>
          {avgs.length ? <BarRows items={avgs.map((x) => ({ label: x.c.name, val: x.a, cls: x.a >= 60 ? 'g' : x.a >= 45 ? 'y' : 'r' }))} /> : <Empty t="No results yet" />}
          <p className="mut" style={{ margin: '14px 0 10px' }}>Pass rate (all subjects 33 or above)</p>
          {avgs.length ? <BarRows items={avgs.map((x) => ({ label: x.c.name, val: x.p, cls: 'g' }))} /> : null}
        </Card>
        <Card title="Class-wise attendance">
          <p className="mut" style={{ marginBottom: 10 }}>{DEMO ? 'Since 1 October' : 'Last 5 weeks'}. Approved leave is not counted against attendance.</p>
          <BarRows items={attc.map((x) => ({ label: x.c.name, val: x.a.pct, cls: x.a.pct >= 92 ? 'g' : x.a.pct >= 85 ? 'y' : 'r' }))} />
        </Card>
      </div>
      <div className="two eq" style={{ marginTop: 14 }}>
        <Card title="Subject-wise performance">
          {subs.length ? <BarRows items={subs.map((x) => ({ label: subName(x.sb), val: x.a, cls: x.a >= 65 ? 'g' : x.a >= 50 ? 'y' : 'r' }))} /> : <Empty t="No data" />}
        </Card>
        <Card title="Top and low performing classes">
          {avgs.length ? (
            <div className="stack">
              <Item><div className="row sp"><b>Top: {avgs[0].c.name}</b><Tag c="ok">{avgs[0].a.toFixed(1) + '%'}</Tag></div><div className="meta">Pass rate {Math.round(avgs[0].p)}%</div></Item>
              {avgs.length > 1 && <Item><div className="row sp"><b>Needs support: {avgs[avgs.length - 1].c.name}</b><Tag c="warn">{avgs[avgs.length - 1].a.toFixed(1) + '%'}</Tag></div><div className="meta">Pass rate {Math.round(avgs[avgs.length - 1].p)}%</div></Item>}
            </div>
          ) : <Empty t="No data" />}
        </Card>
      </div>
      <div className="two eq" style={{ marginTop: 14 }}>
        <Card title="Result trend by exam">
          {exs.length > 1 ? <LineChart labels={exs.map((e) => e.name.replace('Monthly Test ', 'Test ').replace('First Term ', 'Term '))} series={tr} min={30} /> : <Empty t="One exam so far" />}
        </Card>
        <Card title="Weekly attendance trend"><LineChart labels={WEEKS.map((w) => w[0])} series={wk} min={70} /></Card>
      </div>
    </>
  );
}

function AttTable() {
  const cid = F('pcls', dc()), mode = F('pmode', 'daily'), d = F('pdate', TODAY), m = F('pmonth', CM()), q = (F('psq', '') || '').toLowerCase();
  const dates = mode === 'daily' ? [d] : ALLD.filter((x) => x.indexOf(m) === 0);
  if (cid === 'all') {
    return <DT cols={['Class', { h: 'Students', n: 1 }, { h: 'Present', n: 1 }, { h: 'Absent', n: 1 }, { h: 'Leave', n: 1 }, { h: 'Attendance', n: 1 }]}
      rows={CLASSES.map((c) => { const ids = DB.students.filter((s) => s.cid === c.id && s.active).map((s) => s.id), a = agg(ids, dates); return [c.name, ids.length, a.P, a.A, a.L, <b>{a.pct == null ? 'Not marked' : Math.round(a.pct) + '%'}</b>]; })} />;
  }
  const st = DB.students.filter((s) => s.cid === cid && s.active && (!q || s.name.toLowerCase().indexOf(q) > -1));
  if (!st.length) return <Empty t="No students found" s="Try a different class or search." />;
  if (mode === 'daily') {
    if (!isSchool(d)) return <Empty t="No school on this day" s="Pick a weekday." />;
    return <DT minWidth={560} cols={['Roll', 'Student', ...[1, 2, 3, 4, 5].map((p) => ({ h: <>L{p}<br /><small>{subName(subjAt(cid, d, p)).slice(0, 5)}</small></>, title: subName(subjAt(cid, d, p)) })), { h: 'Day', n: 1 }]}
      rows={st.map((s) => { const a = agg([s.id], [d]); return [s.roll, <Who o={s}>{s.name}</Who>, ...[1, 2, 3, 4, 5].map((p) => <Pill st={effStatus(s.id, d, p)} />), <b>{a.pct == null ? (a.L ? 'Leave' : '-') : Math.round(a.pct) + '%'}</b>]; })} />;
  }
  return <DT cols={['Roll', 'Student', { h: 'Present', n: 1 }, { h: 'Absent', n: 1 }, { h: 'Leave', n: 1 }, { h: 'Attendance', n: 1 }]}
    rows={st.map((s) => { const a = agg([s.id], dates); return [s.roll, <Who o={s}>{s.name}</Who>, a.P, a.A, a.L, <b>{a.pct == null ? '-' : Math.round(a.pct) + '%'}</b>]; })} />;
}
function Att() {
  const tab = F('patab', 'students'), mode = F('pmode', 'daily'), d = F('pdate', TODAY), m = F('pmonth', CM());
  const monthSel = <FSel k="pmonth" def={CM()} list={monthOptions()} label="Month" />;
  const modeSeg = <Seg k="pmode" def="daily" list={[['daily', 'Daily'], ['monthly', 'Monthly']]} />;
  let body;
  if (tab === 'teachers') {
    const dates = ALLD.filter((x) => x.indexOf(m) === 0), act = DB.teachers.filter((t) => t.active);
    body = (
      <>
        <div className="g2" style={{ margin: '14px 0' }}><div>{modeSeg}</div><div>{mode === 'daily' ? <FDate k="pdate" def={TODAY} label="Date" max={TODAY} /> : monthSel}</div></div>
        {mode === 'daily'
          ? <DT cols={['Teacher', 'Status', 'Check in', 'Check out']} rows={act.map((t) => { const x = tStatus(t.id, d), r = DB.tatt[t.id + '|' + d] || {}; return [<Who o={t}>{t.name}</Who>, x ? <StChip st={x} /> : <Tag>{isSchool(d) ? 'Not in yet' : 'Holiday'}</Tag>, <>{r.in || ''}{r.in && r.in > '08:10' ? <> <Tag c="warn">Late</Tag></> : null}</>, r.out || '']; })} />
          : <DT cols={['Teacher', { h: 'Present', n: 1 }, { h: 'Absent', n: 1 }, { h: 'Leave', n: 1 }, { h: 'Late', n: 1 }, { h: 'Attendance', n: 1 }]}
            rows={act.map((t) => { const c = { P: 0, A: 0, L: 0 }, late = dates.filter((x) => { const r = DB.tatt[t.id + '|' + x]; return r && r.in > '08:10'; }).length; dates.forEach((x) => { const s = tStatus(t.id, x); if (s) c[s]++; }); return [<Who o={t}>{t.name}</Who>, c.P, c.A, c.L, late, <b>{(c.P + c.A) ? Math.round(c.P / (c.P + c.A) * 100) + '%' : '-'}</b>]; })} />}
      </>
    );
  } else {
    body = (
      <>
        <div className="g3" style={{ margin: '14px 0' }}>
          <FSel k="pcls" def={dc()} list={[['all', 'All classes'], ...CLASSES.map((c) => [c.id, c.name])]} label="Class" />
          <div>{mode === 'daily' ? <FDate k="pdate" def={TODAY} label="Date" max={TODAY} /> : monthSel}</div>
          <TextField id="psq" type="search" label="Search student" value={F('psq', '')} placeholder="Type a name" onChange={(e) => { S.f.psq = e.target.value; render(); }} />
        </div>
        <div style={{ marginBottom: 12 }}>{modeSeg}</div>
        <AttTable />
      </>
    );
  }
  return <><PageHead title="Attendance" sub="Students of every class and all teachers." /><Seg k="patab" def="students" list={[['students', 'Students'], ['teachers', 'Teachers']]} />{body}</>;
}

function Users() {
  const tab = F('utab', 'teachers');
  return (
    <>
      <PageHead title="Users" sub="Teachers, parents and students. Only the Admin can add or remove accounts." />
      <Seg k="utab" def="teachers" list={[['teachers', 'Teachers'], ['parents', 'Parents'], ['students', 'Students']]} />
      <UsersList tab={tab} edit={false} />
    </>
  );
}

function Res() {
  if (!CLASSES.length) return <><PageHead title="Results" /><Empty t="No classes yet" s="The Admin adds classes first." /></>;
  const ex = F('pex', latestExam()), cid = F('prc', dc()), c = cls(cid) || CLASSES[0], sts = DB.students.filter((s) => s.cid === cid && s.active), rk = ranks(ex, cid);
  const rows = sts.map((s) => ({ s, r: stuResult(ex, s) }));
  const pubs = c.subjects.filter((sb) => isPub(ex, cid, sb)).length;
  return (
    <>
      <PageHead title="Results" sub="Marks of every student, class by class." />
      <div className="g2" style={{ marginBottom: 14 }}><FSel k="pex" def={ex} list={EXAMS.map((e) => [e.id, e.name])} label="Exam" /><FSel k="prc" def={cid} list={CLASSES.map((x) => [x.id, x.name])} label="Class" /></div>
      <div className="row" style={{ marginBottom: 12 }}>
        <Tag c={pubs === c.subjects.length ? 'ok' : 'warn'}>{pubs + ' of ' + c.subjects.length + ' subjects published'}</Tag>
        {classAvg(ex, cid) != null ? <Tag c="info">{'Class average ' + classAvg(ex, cid).toFixed(1) + '%'}</Tag> : null}
        {classPass(ex, cid) != null ? <Tag c="ok">{'Pass rate ' + Math.round(classPass(ex, cid)) + '%'}</Tag> : null}
      </div>
      {pubs ? <DT minWidth={640} cols={['Roll', 'Student', ...c.subjects.map((sb) => ({ h: subName(sb).slice(0, 7), n: 1 })), { h: 'Total', n: 1 }, { h: '%', n: 1 }, 'Grade', { h: 'Position', n: 1 }]}
        rows={rows.map((x) => [x.s.roll, x.s.name, ...x.r.rows.map((y) => (y.m === null ? '-' : y.m)), x.r.tot, x.r.pct == null ? '-' : x.r.pct.toFixed(1), x.r.pct == null ? '' : <Tag c={gcls(x.r.pct)}>{gradeOf(x.r.pct)}</Tag>, rk.map[x.s.id] ? ord(rk.map[x.s.id]) : '-'])} />
        : <Empty t="No results published" s="Teachers publish marks subject by subject." />}
    </>
  );
}

function TLeave({ l }) {
  const [rm, setRm] = useState('');
  const decide = (v) => {
    l.status = v; l.remark = rm.trim() || (v === 'approved' ? 'Approved.' : 'Declined.');
    ev({ role: 'teacher', id: l.tid }, 'Leave ' + v, 'Your leave for ' + fs(l.from) + ' was ' + v + '. ' + l.remark, 'leave');
    render(); toast('Leave ' + v + '.');
  };
  return (
    <Item>
      <div className="row sp"><h4>{tch(l.tid).name}</h4><LeaveChip s={l.status} /></div>
      <div className="meta"><Tag c="info">{l.type}</Tag><span>{leaveDates(l)}</span></div><p>{l.reason}</p>
      {l.status === 'pending' ? (
        <>
          <TF id={'rm_' + l.id} label="Remark (optional)" value={rm} onChange={setRm} placeholder="For example, Approved. Please arrange a substitute." />
          <div className="row" style={{ marginTop: 10 }}>
            <Button size="small" variant="contained" color="success" onClick={() => decide('approved')}>Approve</Button>
            <Button size="small" variant="contained" color="error" onClick={() => decide('declined')}>Decline</Button>
          </div>
        </>
      ) : (l.remark ? <div className="meta"><b>Remark:</b> {l.remark}</div> : null)}
    </Item>
  );
}
function Leave() {
  const list = DB.tleaves.slice().sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || (a.ts < b.ts ? 1 : -1));
  return (
    <>
      <PageHead title="Teacher leave requests" sub="Approve or decline leave applied by teachers." />
      {list.length ? list.map((l) => <TLeave key={l.id} l={l} />) : <Empty t="No requests" />}
    </>
  );
}

export const principalViews = { dash: Dash, att: Att, ann: () => <AnnScreen kind="announcement" />, notice: () => <AnnScreen kind="notice" />, users: Users, res: Res, leave: Leave };
