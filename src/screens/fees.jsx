import { WaBtn } from '../ui/WaBtn';
import { useState } from 'react';
import { TextField } from '@mui/material';
import { CLASSES, DB, S, F, cls, stu, money, parentsOf } from '../core/data';
import { render, ask, toast } from '../core/store';
import { TODAY, fs } from '../core/dates';
import { feeAmt, feeRec, feeMonths, ymLabel, dueMonths, payFee, unpayFee, feeFor, feeDisc, setDisc, dueAmount } from '../core/fees';
import { openWA } from '../core/share';
import { SCHOOL_NAME } from '../core/config';
import { printDoc, letterhead, esc, downloadCSV } from '../core/tools';
import { KpiTile, DCard } from '../ui/dash';
import { PageHead, FSel, DT, Tag, Who, Empty, SearchF, TF, Modal } from '../ui';
import { Button, IconBtn } from '../ui/buttons';

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
          <TF key={c.id} label={c.name + ' (PKR per month)'} type="number" defaultValue={feeAmt(c.id) || ''} inputProps={{ min: 0 }}
            onBlur={(e) => { const v = Math.max(0, Math.round(+e.target.value || 0)); if (v !== feeAmt(c.id)) { DB.feeCfg[c.id] = { amt: v }; toast('Fee saved for ' + c.name); render(); } }} />
        ))}
      </div>
    </DCard>
  );
}

function DiscDialog({ s, onClose }) {
  const [v, setV] = useState(String(feeDisc(s.id) || ''));
  const save = () => { const n = Math.round(+v || 0); if (n < 0 || n > 100) return toast('Enter a discount from 0 to 100 percent.'); setDisc(s.id, n); toast(n ? 'Discount saved for ' + s.name : 'Discount removed'); render(); onClose(); };
  return (
    <Modal title={'Fee discount: ' + s.name} onClose={onClose} actions={[{ label: 'Save', onClick: save }]}>
      <p className="mut" style={{ marginBottom: 10 }}>For siblings, staff children or scholarships. The monthly fee for this student becomes {feeAmt(s.cid) ? money(Math.round(feeAmt(s.cid) * (100 - Math.min(100, Math.max(0, +v || 0))) / 100)) : 'the class fee'}. Past receipts stay unchanged.</p>
      <TF label="Discount (percent)" type="number" value={v} onChange={(e) => setV(e.target.value)} inputProps={{ min: 0, max: 100 }} />
    </Modal>
  );
}

export function StaffFees() {
  const months = feeMonths(), ym = F('fmon', months[months.length - 1]), cf = F('fcls', 'all'), sf = F('fst', 'all'), q = (F('fq', '') || '').toLowerCase();
  const list = DB.students.filter((s) => s.active && (cf === 'all' || s.cid === cf) && (!q || s.name.toLowerCase().indexOf(q) > -1));
  const rows = list.map((s) => ({ s, amt: feeFor(s.id), base: feeAmt(s.cid), disc: feeDisc(s.id), rec: feeRec(s.id, ym), dues: dueMonths(s.id).length, owe: dueAmount(s.id) }));
  const [dlg, setDlg] = useState(null);
  const set = rows.filter((x) => x.base > 0);
  const paid = set.filter((x) => x.rec), due = set.filter((x) => !x.rec);
  const shown = rows.filter((x) => sf === 'all' || (sf === 'paid' ? x.rec : sf === 'owe' ? x.owe > 0 : !x.rec && x.base > 0));
  const by = S.user.id;
  const remind = (x) => {
    const par = parentsOf(x.s.id)[0], labels = dueMonths(x.s.id).map(ymLabel), shownL = labels.length > 3 ? labels.slice(0, 3).join(', ') + ' and ' + (labels.length - 3) + ' more' : labels.join(', ');
    openWA(par ? par.phone : '', 'Assalam-o-Alaikum' + (par ? ' ' + par.name : '') + '. Fee reminder for ' + x.s.name + ' (' + cls(x.s.cid).name + '): ' + money(x.owe) + ' is due for ' + shownL + '. Please pay at the school office. Thank you. ' + SCHOOL_NAME);
  };
  const arrears = rows.filter((x) => x.owe > 0).reduce((a, x) => a + x.owe, 0);
  const mark = (x) => { payFee(x.s.id, ym, by); toast('Marked paid. Receipt is ready.'); render(); };
  const undo = (x) => ask('Undo the payment of ' + x.s.name + ' for ' + ymLabel(ym) + '?', 'Undo payment', () => { unpayFee(x.s.id, ym); render(); });
  const csv = () => downloadCSV('fees-' + ym + '.csv', [['Roll', 'Student', 'Class', 'Month', 'Fee', 'Status', 'Paid on', 'Receipt', 'Months due']].concat(shown.map((x) => [x.s.roll, x.s.name, cls(x.s.cid).name, ym, x.amt, x.amt ? (x.rec ? 'Paid' : 'Due') : 'Fee not set', x.rec ? x.rec.date : '', x.rec ? x.rec.no : '', x.dues])));
  return (
    <>
      <PageHead title="Fees" sub="Record monthly fees, see who owes, print receipts.">
        <Button variant="secondary" icon="download" onClick={csv}>Download for Excel</Button>
      </PageHead>
      <div className="g4" style={{ marginBottom: 14 }}>
        <KpiTile l={'Collected, ' + ymLabel(ym).split(' ')[0]} v={money(paid.reduce((a, x) => a + x.rec.amt, 0))} ico="cash" tone="g" s={paid.length + ' students paid'} />
        <KpiTile l="Pending" v={money(due.reduce((a, x) => a + x.amt, 0))} ico="warn" tone="o" s={due.length + ' students not paid'} />
        <KpiTile l="Total arrears" v={money(arrears)} ico="users" tone="r" s={DB.students.filter((s) => s.active && dueMonths(s.id).length).length + ' students with unpaid months'} />
      </div>
      <FeeSetup />
      <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, margin: '14px 0' }}>
        <FSel k="fmon" def={ym} list={months.map((m) => [m, ymLabel(m)])} label="Month" />
        <FSel k="fcls" def="all" list={[['all', 'All classes'], ...CLASSES.map((c) => [c.id, c.name])]} label="Class" />
        <FSel k="fst" def="all" list={[['all', 'All'], ['paid', 'Paid'], ['due', 'Not paid this month'], ['owe', 'Has arrears (any month)']]} label="Status" />
        <SearchF label="Search" value={F('fq', '')} placeholder="Type a name" onChange={(v) => { S.f.fq = v; render(); }} />
      </div>
      {shown.length ? (
        <DT minWidth={760} cols={['Roll', 'Student', 'Class', { h: 'Fee', n: 1 }, 'Status', { h: 'Months due', n: 1 }, { h: 'Total due', n: 1 }, '']} rows={shown.map((x) => [x.s.roll, <Who o={x.s}>{x.s.name}</Who>, cls(x.s.cid).name,
          x.base ? money(x.amt) + (x.disc ? ' (-' + x.disc + '%)' : '') : '-',
          !x.base ? <Tag>Fee not set</Tag> : x.rec ? <Tag c="ok">{'Paid ' + fs(x.rec.date)}</Tag> : <Tag c="warn">Not paid</Tag>, x.dues, x.owe ? money(x.owe) : '-',
          <div className="row acts">
            {x.rec && <IconBtn size="sm" icon="receipt" label="Receipt" onClick={() => printReceipt(x.s.id, ym)} />}
            {x.rec && <IconBtn size="sm" icon="undo-2" tone="danger" label="Undo payment" onClick={() => undo(x)} />}
            {!x.rec && x.base > 0 && <Button size="xs" variant="success" onClick={() => mark(x)}>Mark paid</Button>}
            {x.owe > 0 && <IconBtn size="sm" icon="wa" className="wa-btn" label="Remind on WhatsApp" onClick={() => remind(x)} />}
            {x.base > 0 && <IconBtn size="sm" icon="pencil" label="Set discount" onClick={() => setDlg(x.s)} />}
          </div>])} />
      ) : <Empty t="No students found" s="Set the monthly fee for each class above to start." />}
      {dlg && <DiscDialog s={dlg} onClose={() => setDlg(null)} />}
      <p className="mut" style={{ marginTop: 10 }}>Today is {fs(TODAY)}. School year runs April to March.</p>
    </>
  );
}

export function ParentFees({ k }) {
  const amt = feeFor(k.id), months = feeMonths().slice().reverse();
  if (!feeAmt(k.cid)) return <Empty t="Fee not set yet" s="The school office has not entered the monthly fee for this class." />;
  const dues = dueMonths(k.id);
  return (
    <>
      <div className="g4" style={{ marginBottom: 14 }}>
        <KpiTile l="Monthly fee" v={money(amt)} ico="cash" tone="b" s={feeDisc(k.id) ? feeDisc(k.id) + '% discount applied' : undefined} />
        <KpiTile l="Months unpaid" v={dues.length} ico={dues.length ? 'warn' : 'check'} tone={dues.length ? 'o' : 'g'} s={dues.length ? money(dues.length * amt) + ' due' : 'All paid'} />
      </div>
      <DT minWidth={420} cols={['Month', { h: 'Fee', n: 1 }, 'Status', '']} rows={months.map((m) => { const r = feeRec(k.id, m); return [ymLabel(m), money(amt), r ? <Tag c="ok">{'Paid ' + fs(r.date)}</Tag> : <Tag c="warn">Not paid</Tag>, r ? <Button size="small" variant="outlined" onClick={() => printReceipt(k.id, m)}>Receipt</Button> : null]; })} />
    </>
  );
}
