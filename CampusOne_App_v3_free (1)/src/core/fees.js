import { DB, cls, stu, uid } from './data';
import { TODAY, MONN } from './dates';

export const feeAmt = (cid) => (DB.feeCfg[cid] && +DB.feeCfg[cid].amt) || 0;
export const feeRec = (sid, ym) => DB.fees[sid + '|' + ym] || null;
export const ymLabel = (ym) => MONN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);

// Months of the current school year (April to March), up to the current month.
export function feeMonths() {
  const y = +TODAY.slice(0, 4), m = +TODAY.slice(5, 7), sy = m >= 4 ? y : y - 1, o = [];
  for (let i = 0; i < 12; i++) { const mm = 4 + i, yy = sy + (mm > 12 ? 1 : 0), x = yy + '-' + ('0' + (mm > 12 ? mm - 12 : mm)).slice(-2); if (x > TODAY.slice(0, 7)) break; o.push(x); }
  return o;
}
// A per-student discount is stored as a fee record with the key "studentId|disc" (parents of that student can read it).
export const feeDisc = (sid) => { const r = DB.fees[sid + '|disc']; return r ? Math.min(100, Math.max(0, +r.pct || 0)) : 0; };
export const feeFor = (sid) => { const s = stu(sid), a = s ? feeAmt(s.cid) : 0; return Math.round(a * (100 - feeDisc(sid)) / 100); };
export const setDisc = (sid, pct) => { if (!pct) delete DB.fees[sid + '|disc']; else DB.fees[sid + '|disc'] = { pct: Math.min(100, Math.round(pct)), ts: TODAY }; };
export const dueMonths = (sid) => { const s = stu(sid); return s && feeAmt(s.cid) ? feeMonths().filter((m) => !feeRec(sid, m)) : []; };
export const dueAmount = (sid) => dueMonths(sid).length * feeFor(sid);
export function payFee(sid, ym, by) {
  const s = stu(sid); DB.fees[sid + '|' + ym] = { amt: feeFor(sid), date: TODAY, by: by || '', no: 'FG-' + uid().slice(-6).toUpperCase() };
}
export const unpayFee = (sid, ym) => { delete DB.fees[sid + '|' + ym]; };
export const className = (sid) => { const s = stu(sid); return s && cls(s.cid) ? cls(s.cid).name : ''; };
