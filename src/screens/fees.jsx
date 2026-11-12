import { Button, TextField } from '@mui/material';
import { CLASSES, DB, S, F, cls, stu, money, parentsOf } from '../core/data';
import { render, ask, toast } from '../core/store';
import { TODAY, fs } from '../core/dates';
import { feeAmt, feeRec, feeMonths, ymLabel, dueMonths, payFee, unpayFee } from '../core/fees';
import { printDoc, letterhead, esc, downloadCSV } from '../core/tools';
import { KpiTile, DCard } from '../ui/dash';
import { PageHead, FSel, DT, Tag, Who, Empty } from '../ui';

export function printReceipt(sid, ym) {
  const s = stu(sid), r = feeRec(sid, ym); if (!s || !r) return;
  const par = parentsOf(sid)[0];
  printDoc('Fee receipt ' + r.no, letterhead('Fee receipt') + `
    <h2>Receipt No. ${esc(r.no)}</h2>
    <div class="box"><div class="kv">
      <span>Student</span><b>${esc(s.name)}</b>
      <span>Class and roll no.</span><b>${esc(cls(s.cid).name)}, roll ${esc(s.roll)}</b>
      ${par ? `<span>Parent</span><b>${esc(par.name)}</b>` : ''}
      <span>Fee for</span><b>${esc(ymLabel(ym))}</b>
      <span>Amount received</span><b>${esc(money(r.amt))}</b>
      <span>Date</span><b>${esc(r.date)}</b>
    </div></div>
    <p><span class="stamp">PAID</span></p>
    <div class="sig"><span>Parent signature</span><span>Accounts office</span></div>
    <p class="note">This receipt is computer generated.</p>`);
}

function FeeSetup() {
  return (
    <DCard title="Monthly fee per class" ico="cash">
      <div className="g3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', display: 'grid', gap: 12 }}>
        {CLASSES.map((c) => (
          <TextField key={c.id} label={c.name + ' (PKR per month)'} type="number" size="small" defaultValue={feeAmt(c.id) || ''} inputProps={{ min: 0 }}
            onBlur={(e) => { const v = Math.max(0, Math.round(+e.target.value || 0)); if (v !== feeAmt(c.id)) { DB.feeCfg[c.id] = { amt: v }; toast('Fee saved for ' + c.name); render(); } }} />
        ))}
      </div>
    </DCard>
  );
}

export function StaffFees() {
  const months = feeMonths(), ym = F('fmon', months[months.length - 1]), cf = F('fcls', 'all'), sf = F('fst', 'all'), q = (F('fq', '') || '').toLowerCase();
  const list = DB.students.filter((s) => s.active && (cf === 'all' || s.cid === cf) && (!q || s.name.toLowerCase().indexOf(q) > -1));
  const rows = list.map((s) => ({ s, amt: feeAmt(s.cid), rec: feeRec(s.id, ym), dues: dueMonths(s.id).length }));
  const set = rows.filter((x) => x.amt > 0);
  const paid = set.filter((x) => x.rec), due = set.filter((x) => !x.rec);
  const shown = rows.filter((x) => sf === 'all' || (sf === 'paid' ? x.rec : !x.rec && x.amt > 0));
  const by = S.user.id;
  const mark = (x) => { payFee(x.s.id, ym, by); toast('Marked paid. Receipt is ready.'); render(); };
  const undo = (x) => ask('Undo the payment of ' + x.s.name + ' for ' + ymLabel(ym) + '?', 'Undo payment', () => { unpayFee(x.s.id, ym); render(); });
  const csv = () => downloadCSV('fees-' + ym + '.csv', [['Roll', 'Student', 'Class', 'Month', 'Fee', 'Status', 'Paid on', 'Receipt', 'Months due']].concat(shown.map((x) => [x.s.roll, x.s.name, cls(x.s.cid).name, ym, x.amt, x.amt ? (x.rec ? 'Paid' : 'Due') : 'Fee not set', x.rec ? x.rec.date : '', x.rec ? x.rec.no : '', x.dues])));
  return (
    <>
      <PageHead title="Fees" sub="Record monthly fees, see who owes, print receipts.">
        <Button variant="outlined" onClick={csv}>Download for Excel</Button>
      </PageHead>
      <div className="g4" style={{ marginBottom: 14 }}>
        <KpiTile l={'Collected, ' + ymLabel(ym).split(' ')[0]} v={money(paid.reduce((a, x) => a + x.rec.amt, 0))} vs={22} ico="cash" tone="g" s={paid.length + ' students paid'} />
        <KpiTile l="Pending" v={money(due.reduce((a, x) => a + x.amt, 0))} vs={22} ico="warn" tone="o" s={due.length + ' students not paid'} />
        <KpiTile l="Students with dues" v={DB.students.filter((s) => s.active && dueMonths(s.id).length).length} ico="users" tone="r" s="Any unpaid month this year" />
      </div>
      <FeeSetup />
      <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, margin: '14px 0' }}>
        <FSel k="fmon" def={ym} list={months.map((m) => [m, ymLabel(m)])} label="Month" />
        <FSel k="fcls" def="all" list={[['all', 'All classes'], ...CLASSES.map((c) => [c.id, c.name])]} label="Class" />
        <FSel k="fst" def="all" list={[['all', 'All'], ['paid', 'Paid'], ['due', 'Not paid']]} label="Status" />
        <TextField label="Search" type="search" size="small" value={F('fq', '')} onChange={(e) => { S.f.fq = e.target.value; render(); }} />
      </div>
      {shown.length ? (
        <DT minWidth={620} cols={['Roll', 'Student', 'Class', { h: 'Fee', n: 1 }, 'Status', { h: 'Months due', n: 1 }, '']} rows={shown.map((x) => [x.s.roll, <Who o={x.s}>{x.s.name}</Who>, cls(x.s.cid).name, x.amt ? money(x.amt) : '-',
          !x.amt ? <Tag>Fee not set</Tag> : x.rec ? <Tag c="ok">{'Paid ' + fs(x.rec.date)}</Tag> : <Tag c="warn">Not paid</Tag>, x.dues,
          x.rec ? <div className="row"><Button size="small" variant="outlined" onClick={() => printReceipt(x.s.id, ym)}>Receipt</Button><Button size="small" color="error" onClick={() => undo(x)}>Undo</Button></div>
            : x.amt ? <Button size="small" variant="contained" onClick={() => mark(x)}>Mark paid</Button> : null])} />
      ) : <Empty t="No students found" s="Set the monthly fee for each class above to start." />}
      <p className="mut" style={{ marginTop: 10 }}>Today is {fs(TODAY)}. School year runs April to March.</p>
    </>
  );
}

export function ParentFees({ k }) {
  const amt = feeAmt(k.cid), months = feeMonths().slice().reverse();
  if (!amt) return <Empty t="Fee not set yet" s="The school office has not entered the monthly fee for this class." />;
  const dues = dueMonths(k.id);
  return (
    <>
      <div className="g4" style={{ marginBottom: 14 }}>
        <KpiTile l="Monthly fee" v={money(amt)} vs={22} ico="cash" tone="b" />
        <KpiTile l="Months unpaid" v={dues.length} ico={dues.length ? 'warn' : 'check'} tone={dues.length ? 'o' : 'g'} s={dues.length ? money(dues.length * amt) + ' due' : 'All paid'} />
      </div>
      <DT minWidth={420} cols={['Month', { h: 'Fee', n: 1 }, 'Status', '']} rows={months.map((m) => { const r = feeRec(k.id, m); return [ymLabel(m), money(amt), r ? <Tag c="ok">{'Paid ' + fs(r.date)}</Tag> : <Tag c="warn">Not paid</Tag>, r ? <Button size="small" variant="outlined" onClick={() => printReceipt(k.id, m)}>Receipt</Button> : null]; })} />
    </>
  );
}
