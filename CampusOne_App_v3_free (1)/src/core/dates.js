import { DEMO } from './config';

export const pad = (n) => ('0' + n).slice(-2);
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const PT = ['8:00', '8:45', '9:30', '10:30', '11:15'];

export const pd = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
export const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
export const dow = (s) => (pd(s).getDay() + 6) % 7;
export const isSchool = (s) => dow(s) < 5;
export const fd = (s) => DAYN[dow(s)] + ', ' + pd(s).getDate() + ' ' + MON[pd(s).getMonth()];
export const fs = (s) => pd(s).getDate() + ' ' + MON[pd(s).getMonth()];
export function range(a, b) { const o = []; let d = a; while (d <= b) { o.push(d); d = addDays(d, 1); } return o; }
export const schoolDays = (a, b) => range(a, b).filter(isSchool);
export const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const nextSchool = (d) => { let x = d; for (let i = 0; i < 8 && !isSchool(x); i++) x = addDays(x, 1); return x; };

// In demo mode the "today" date is fixed so the sample data always lines up.
export let TODAY = '2026-11-09';
export let HIST, ALLD;
if (DEMO) {
  HIST = schoolDays('2026-10-01', '2026-11-06');
  ALLD = HIST.concat([TODAY]);
} else {
  TODAY = iso(new Date());
  const st0 = addDays(TODAY, -34);
  HIST = schoolDays(st0, addDays(TODAY, -1));
  ALLD = schoolDays(st0, TODAY);
}
export const CM = () => TODAY.slice(0, 7);
export const monthList = () => { const o = {}; ALLD.forEach((d) => { o[d.slice(0, 7)] = 1; }); o[CM()] = 1; return Object.keys(o).sort(); };
export const monthLabel = (m) => MONN[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
export const monthOptions = () => monthList().map((m) => [m, monthLabel(m)]);
export function mkWeeks() {
  const o = [], mon = addDays(TODAY, -dow(TODAY));
  for (let i = 5; i >= 0; i--) { const s = addDays(mon, -7 * i), e = addDays(s, 4); o.push([fs(s), s, e < TODAY ? e : TODAY]); }
  return o;
}
export const WEEKS = DEMO
  ? [['Oct 1', '2026-10-01', '2026-10-02'], ['Oct 5', '2026-10-05', '2026-10-09'], ['Oct 12', '2026-10-12', '2026-10-16'], ['Oct 19', '2026-10-19', '2026-10-23'], ['Oct 26', '2026-10-26', '2026-10-30'], ['Nov 2', '2026-11-02', '2026-11-06']]
  : mkWeeks();
