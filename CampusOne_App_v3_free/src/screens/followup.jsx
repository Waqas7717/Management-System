import { DB, S, agg, cls, dayStatus, parentsOf, stuResult, latestExam } from '../core/data';
import { dueMonths } from '../core/fees';
import { TODAY, addDays, schoolDays } from '../core/dates';
import { SCHOOL_NAME } from '../core/config';
import { openWA } from '../core/share';
import { DCard } from '../ui/dash';
import { Tag, Who, Empty } from '../ui';
import { Button } from '../ui/buttons';

/* Attendance early warning: students absent 3 school days in a row, or under 75% over the last 20 school days.
   Computed in the browser from data that is already loaded, so it adds no database load. */
export function followUps(classIds) {
  const days = schoolDays(addDays(TODAY, -30), TODAY).filter((d) => d < TODAY || DB.students.some((s) => dayStatus(s.id, d))).slice(-20);
  const out = [];
  DB.students.filter((s) => s.active && (!classIds || classIds.includes(s.cid))).forEach((s) => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) { if (dayStatus(s.id, days[i]) === 'A') streak++; else break; }
    const a = agg([s.id], days), pct = a && a.pct != null ? Math.round(a.pct) : null;
    const marked = days.filter((d) => dayStatus(s.id, d)).length;
    const why = [];
    if (streak >= 3) why.push('absent ' + streak + ' days in a row');
    if (pct != null && pct < 75 && marked >= 5) why.push('attendance ' + pct + '% in the last ' + marked + ' school days');
    // risk signals (F13): low marks in the latest exam; fee arrears only for roles that may see fees
    const ex = latestExam(), r = ex ? stuResult(ex, s) : null;
    if (r && r.n >= 2 && r.pct != null && r.pct < 40) why.push('average marks ' + Math.round(r.pct) + '% in the latest exam');
    if ((S.role === 'admin' || S.role === 'principal') && dueMonths(s.id).length >= 2) why.push('fees pending for ' + dueMonths(s.id).length + ' months');
    if (why.length) out.push({ s, streak, pct: pct == null ? 100 : pct, why: why.join(', ') });
  });
  out.sort((a, b) => b.streak - a.streak || a.pct - b.pct);
  return out;
}

export function FollowUpCard({ classIds, max = 6 }) {
  const list = followUps(classIds), show = list.slice(0, max);
  const msg = (x, par) => 'Assalam-o-Alaikum' + (par ? ' ' + par.name : '') + '. ' + x.s.name + ' (' + cls(x.s.cid).name + ') has been ' + x.why + '. Please contact the school so we can help. ' + SCHOOL_NAME;
  return (
    <DCard title="Attendance follow-up" ico="warn" right={<span className="mut">{list.length ? list.length + ' to contact' : 'Nobody flagged'}</span>}>
      {show.length ? show.map((x) => {
        const par = parentsOf(x.s.id)[0];
        return (
          <div className="ar" key={x.s.id}>
            <div className="ar-t"><b><Who o={x.s}>{x.s.name}</Who></b><small>{cls(x.s.cid).name}: {x.why}</small></div>
            <Button size="sm" variant="outlined" onClick={() => openWA(par ? par.phone : '', msg(x, par))}>{par ? 'WhatsApp parent' : 'WhatsApp'}</Button>
          </div>
        );
      }) : <Empty t="No attendance concerns" s="Students absent 3 days in a row or under 75% show here." />}
      {list.length > max ? <p className="mut" style={{ marginTop: 8 }}>And {list.length - max} more.</p> : null}
    </DCard>
  );
}
export const FlagTag = ({ n }) => <Tag c="warn">{n}</Tag>;
