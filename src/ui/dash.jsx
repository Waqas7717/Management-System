import { ButtonBase } from '@mui/material';
import { DB, S, TYPEC, TYPEL, annVisible, cls, dayStatus, feed, tClasses, tStatus, latestExam, classAvg, classPass } from '../core/data';
import { TODAY, addDays, fs, isSchool, pd, schoolDays } from '../core/dates';
import { go } from '../core/actions';
import { Av, Ico, Seg, Tag } from './index';

/* ---------- date range chips (Today, 7, 30, 90 days) ---------- */
export const RANGES = [['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['90', '90 days']];
export const RangeChips = ({ k = 'drange' }) => <Seg k={k} def="1" list={RANGES} label="Date range" />;
export function rangeInfo(k = 'drange') {
  const n = +(S.f[k] || '1');
  const dates = n === 1 ? (isSchool(TODAY) ? [TODAY] : []) : schoolDays(addDays(TODAY, -(n - 1)), TODAY);
  const label = n === 1 ? 'Today' : 'Last ' + n + ' days';
  return { n, dates, label, today: n === 1 };
}

/* student-days in a range: a day with any lecture attended counts as present */
export function dayCounts(sids, dates) {
  const o = { P: 0, A: 0, L: 0 };
  sids.forEach((sid) => dates.forEach((d) => {
    const x = dayStatus(sid, d);
    if (x === 'P' || x === 'M') o.P++; else if (x === 'A') o.A++; else if (x === 'L') o.L++;
  }));
  o.pct = (o.P + o.A) ? o.P / (o.P + o.A) * 100 : null;
  return o;
}

/* ---------- announcement ticker ---------- */
function latestPost() {
  const own = S.role === 'admin' || S.role === 'principal';
  const list = own
    ? DB.anns.filter(annVisible).map((a) => ({ ts: a.ts, title: a.title, type: a.type, text: a.body }))
      .concat(S.role === 'admin' ? DB.events.filter((e) => e.adm).map((e) => ({ ts: e.ts, title: e.title, type: e.type, text: e.text })) : [])
    : feed().filter((x) => x.type !== 'leave' && x.type !== 'homework');
  return list.sort((a, b) => (a.ts < b.ts ? 1 : -1))[0] || null;
}
const TARGET = { admin: 'ann', principal: 'ann', parent: 'notices' };
export function Ticker() {
  const p = latestPost();
  const to = TARGET[S.role];
  const body = (
    <>
      <span className="tk-ic"><Ico n="mega" s={18} /></span>
      <b className="tk-l">Announcements</b>
      {p ? (
        <span className="tk-t"><Tag c={TYPEC[p.type]}>{TYPEL[p.type] || 'Update'}</Tag> <span className="tk-m">{p.title}</span><span className="tk-d"> {fs(p.ts.slice(0, 10))}</span></span>
      ) : <span className="tk-t mut">Nothing posted yet</span>}
      {to ? <span className="tk-go">View all</span> : null}
    </>
  );
  return to
    ? <ButtonBase className="ticker" onClick={() => go(to)} aria-label="Open announcements">{body}</ButtonBase>
    : <div className="ticker">{body}</div>;
}

/* ---------- per-class summary cards ---------- */
export function ClassCards({ classes, range }) {
  if (!classes.length) return null;
  const ex = latestExam();
  return (
    <>
      <div className="sec-h"><h3>Classes</h3><span className="mut">{range.label}{range.today ? '' : ', counted in student-days'}</span></div>
      <div className="ccards">
        {classes.map((c, i) => {
          const studs = DB.students.filter((s) => s.cid === c.id && s.active), ids = studs.map((s) => s.id);
          const a = dayCounts(ids, range.dates), tot = a.P + a.A + a.L;
          const teachers = DB.teachers.filter((t) => t.active && tClasses(t).includes(c.id)).length;
          const avg = classAvg(ex, c.id), pass = classPass(ex, c.id), ct = DB.teachers.find((t) => t.id === c.ct);
          const pct = a.pct == null ? null : Math.round(a.pct);
          return (
            <div className={'ccard cc' + (i % 4)} key={c.id}>
              <div className="cc-top"><h4>{c.name}</h4><Tag c="info">{c.level === 'college' ? 'College' : 'School'}</Tag></div>
              <div className="cc-big"><b>{studs.length}</b><span>students</span></div>
              {tot ? (
                <>
                  <div className="cc-bar" aria-hidden="true">
                    <i className="g" style={{ width: a.P / tot * 100 + '%' }} /><i className="r" style={{ width: a.A / tot * 100 + '%' }} /><i className="y" style={{ width: a.L / tot * 100 + '%' }} />
                  </div>
                  <div className="cc-pal">
                    <span className="bd g">P</span><b>{a.P}</b>
                    <span className="bd r">A</span><b>{a.A}</b>
                    <span className="bd y">L</span><b>{a.L}</b>
                    <span className="cc-pct">{pct == null ? '' : pct + '%'}</span>
                  </div>
                </>
              ) : <div className="cc-none mut">{range.today && !isSchool(TODAY) ? 'No school today' : 'Attendance not marked yet'}</div>}
              <dl className="cc-dl">
                <dt>Class teacher</dt><dd>{ct ? ct.name : 'Not set'}</dd>
                <dt>Teachers</dt><dd>{teachers}</dd>
                <dt>Average result</dt><dd>{avg == null ? '-' : avg.toFixed(0) + '%'}</dd>
                <dt>Pass rate</dt><dd>{pass == null ? '-' : Math.round(pass) + '%'}</dd>
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- staff check-in cards ---------- */
const hm = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'am' : 'pm'); };
export function StaffCheckin() {
  const staff = DB.teachers.filter((t) => t.active).map((t) => {
    const st = tStatus(t.id, TODAY), rec = DB.tatt[t.id + '|' + TODAY];
    return { t, st, rec, key: st === 'P' ? 0 : st === 'L' ? 2 : 1 };
  }).sort((a, b) => a.key - b.key || (a.rec && b.rec ? (a.rec.in < b.rec.in ? -1 : 1) : 0));
  if (!staff.length) return null;
  const n = (k) => staff.filter((x) => x.key === k).length;
  return (
    <>
      <div className="sec-h"><h3>Teacher check-in today</h3>
        <span className="row" style={{ gap: 6 }}><Tag c="ok">{n(0) + ' in'}</Tag><Tag c="warn">{n(1) + ' not in yet'}</Tag><Tag c="info">{n(2) + ' on leave'}</Tag></span></div>
      {!isSchool(TODAY) ? <p className="mut">No school today.</p> : (
        <div className="scards">
          {staff.map(({ t, st, rec, key }) => (
            <div className={'scard s' + key} key={t.id}>
              <Av o={t} lg />
              <div className="sc-b">
                <b>{t.name}</b>
                <small>Teacher{t.assign.length ? ', ' + tClasses(t).map((c) => (cls(c) || { name: '' }).name).filter(Boolean).join(', ') : ''}</small>
                {key === 0 ? <span className="sc-s ok">In at {hm(rec && rec.in)}</span> : key === 2 ? <span className="sc-s info">On leave</span> : <span className="sc-s warn">Not in yet</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
