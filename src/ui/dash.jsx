import { Button } from '@mui/material';
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
  return (
    <section className="annbar" aria-label="Latest announcement">
      <span className="ab-ic"><Ico n="mega" s={22} /></span>
      <span className="ab-pill">Latest announcement</span>
      <span className="ab-title" title={p ? p.title : ''}>{p ? p.title : 'Nothing posted yet'}</span>
      {p ? <span className="ab-date"><Ico n="cal" s={16} />{fs(p.ts.slice(0, 10))}</span> : null}
      {to ? <Button className="ab-btn" variant="contained" size="small" endIcon={<Ico n="chev" s={16} />} onClick={() => go(to)}>View all</Button> : null}
    </section>
  );
}

/* ---------- shared dashboard pieces ---------- */
const TONES = { b: ['#2F6FDE', '#E3EDFD'], g: ['#17936A', '#E1F5EC'], p: ['#7C4DD6', '#EEE6FB'], o: ['#C98A00', '#FFF0CC'], r: ['#D64545', '#FBE4E1'] };
const open = (to) => { if (to && typeof to === 'object') { Object.assign(S.f, to.f || {}); go(to.view); } else go(to); };

/* summary tile: colored round icon, big number, label and an arrow that opens the page */
export function KpiTile({ l, v, s, ico, tone = 'b', to, vs }) {
  const c = TONES[tone] || TONES.b;
  const inner = (
    <>
      <span className="kt-ic" style={{ color: c[0], background: c[1] }}><Ico n={ico} s={24} /></span>
      <span className="kt-b"><b style={vs ? { fontSize: vs } : undefined}>{v}</b><span className="kt-l">{l}</span>{s != null && s !== '' ? <small>{s}</small> : null}</span>
      {to ? <span className="kt-go" style={{ color: c[0], background: c[1] }}><Ico n="chev" s={18} /></span> : null}
    </>
  );
  return to
    ? <button type="button" className="ktile go" aria-label={l + ', ' + v + '. Open'} onClick={() => open(to)}>{inner}</button>
    : <div className="ktile">{inner}</div>;
}

export const LinkBtn = ({ children, onClick }) => <button type="button" className="lnk" onClick={onClick}>{children}<Ico n="chev" s={16} /></button>;

/* card with an icon chip, a title and an optional link or note on the right */
export function DCard({ title, ico, right, children, className = '', style }) {
  return (
    <section className={'card dcard ' + className} style={style}>
      <header className="dc-h"><h3>{ico ? <span className="dc-ic"><Ico n={ico} s={18} /></span> : null}{title}</h3>{right ? <div className="dc-r">{right}</div> : null}</header>
      {children}
    </section>
  );
}

const Books = () => (
  <svg className="attn-art" viewBox="0 0 170 112" width="150" aria-hidden="true">
    <ellipse cx="85" cy="104" rx="70" ry="6" fill="#7a5a00" opacity=".12" />
    <rect x="20" y="72" width="132" height="28" rx="6" fill="#2F6FDE" />
    <rect x="20" y="72" width="16" height="28" rx="6" fill="#1D4FB8" />
    <rect x="40" y="78" width="108" height="16" rx="3" fill="#FBF4E2" />
    <path d="M46 83h70M46 88h54" stroke="#D9CDAA" strokeWidth="2" strokeLinecap="round" />
    <rect x="30" y="46" width="118" height="26" rx="6" fill="#F7B500" />
    <rect x="30" y="46" width="15" height="26" rx="6" fill="#D99A00" />
    <rect x="49" y="52" width="95" height="14" rx="3" fill="#FFF6DC" />
    <path d="M55 57h60M55 62h42" stroke="#E6D3A0" strokeWidth="2" strokeLinecap="round" />
    <rect x="38" y="22" width="104" height="24" rx="6" fill="#E9742B" />
    <rect x="38" y="22" width="14" height="24" rx="6" fill="#C95A18" />
    <rect x="56" y="28" width="82" height="12" rx="3" fill="#FFF0DF" />
    <path d="M62 33h50M62 37h34" stroke="#E8C9A8" strokeWidth="2" strokeLinecap="round" />
    <path d="M150 20l8-9M156 30l11-3M143 11l3-10" stroke="#F7B500" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* the yellow "Needs attention" card. children are AttnRow items or a calm message */
export function Attention({ children }) {
  return (
    <section className="card attn">
      <header className="dc-h"><h3><span className="dc-ic warn"><Ico n="warn" s={18} /></span>Needs attention</h3></header>
      <div className="attn-b">{children}</div>
      <Books />
    </section>
  );
}
export const AttnRow = ({ n, t, sub, to, label = 'Open' }) => (
  <div className="ar">
    {n != null ? <span className="ar-n">{n}</span> : null}
    <div className="ar-t"><b>{t}</b>{sub ? <small>{sub}</small> : null}</div>
    {to ? <Button size="small" variant="outlined" onClick={() => open(to)}>{label}</Button> : null}
  </div>
);

/* ---------- per-class summary cards ---------- */
export function ClassCards({ classes, range }) {
  if (!classes.length) return null;
  const ex = latestExam();
  return (
    <DCard title="Classes" ico="book" right={<span className="mut">{range.label}{range.today ? '' : ', student-days'}</span>} className="classes">
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
                <dt>Teacher</dt><dd>{ct ? ct.name : 'Not set'}</dd>
                <dt>All teachers</dt><dd>{teachers}</dd>
                <dt>Average result</dt><dd>{avg == null ? '-' : avg.toFixed(0) + '%'}</dd>
                <dt>Pass rate</dt><dd>{pass == null ? '-' : Math.round(pass) + '%'}</dd>
              </dl>
            </div>
          );
        })}
      </div>
    </DCard>
  );
}

/* ---------- staff check-in cards ---------- */
const hm = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'am' : 'pm'); };
export function StaffCheckin({ to, tab }) {
  const staff = DB.teachers.filter((t) => t.active).map((t) => {
    const st = tStatus(t.id, TODAY), rec = DB.tatt[t.id + '|' + TODAY];
    return { t, st, rec, key: st === 'P' ? 0 : st === 'L' ? 2 : 1 };
  }).sort((a, b) => a.key - b.key || (a.rec && b.rec ? (a.rec.in < b.rec.in ? -1 : 1) : 0));
  if (!staff.length) return null;
  const n = (k) => staff.filter((x) => x.key === k).length;
  return (
    <DCard title="Teacher check-in today" ico="users" className="staff"
      right={<span className="row" style={{ gap: 6 }}><Tag c="ok">{n(0) + ' in'}</Tag><Tag c="warn">{n(1) + ' not in yet'}</Tag><Tag c="info">{n(2) + ' on leave'}</Tag>{to ? <LinkBtn onClick={() => open({ view: to, f: tab ? { utab: tab } : {} })}>View all</LinkBtn> : null}</span>}>
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
    </DCard>
  );
}
