import { WaBtn } from '../ui/WaBtn';
import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { LIVE, SCHOOL_NAME } from '../core/config';
import { sb } from '../core/sync';
import { toast } from '../core/store';
import { openWA } from '../core/share';
import { Card, Empty, PageHead, Tag } from '../ui';
import { Button } from '../ui/buttons';

/* Public enquiry form (F17). Open the site with ?enquiry=1 and share that link. Anyone can send, only staff can read. */
export function EnquiryPage() {
  const [f, setF] = useState({ name: '', phone: '', class_wanted: '', note: '', site: '' }), [done, setDone] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const send = async () => {
    setErr('');
    if (f.site) return setDone(true); // hidden field filled by bots
    if (f.name.trim().length < 2) return setErr('Please enter the child or parent name.');
    if (f.phone.replace(/\D/g, '').length < 7) return setErr('Please enter a phone number we can call.');
    setBusy(true);
    try {
      if (LIVE) {
        const r = await sb.from('inquiries').insert({ name: f.name.trim().slice(0, 80), phone: f.phone.trim().slice(0, 20), class_wanted: f.class_wanted.trim().slice(0, 40), note: f.note.trim().slice(0, 400) });
        if (r.error) throw r.error;
      }
      setDone(true);
    } catch (e) { setErr('Could not send. Please try again or call the school.'); }
    setBusy(false);
  };
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '28px 16px' }}>
      <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>{SCHOOL_NAME}</h1>
      <p className="mut" style={{ margin: '0 0 18px' }}>Admission enquiry. Leave your details and the school will call you.</p>
      {done ? <Card><h3 style={{ margin: 0 }}>Thank you</h3><p className="mut">We received your enquiry and will contact you soon.</p></Card> : (
        <div className="stack" style={{ display: 'grid', gap: 12 }}>
          <TextField label="Name" value={f.name} onChange={set('name')} inputProps={{ maxLength: 80 }} fullWidth />
          <TextField label="Phone" value={f.phone} onChange={set('phone')} inputProps={{ maxLength: 20, inputMode: 'tel' }} fullWidth />
          <TextField label="Class wanted" value={f.class_wanted} onChange={set('class_wanted')} inputProps={{ maxLength: 40 }} fullWidth />
          <TextField label="Message (optional)" value={f.note} onChange={set('note')} inputProps={{ maxLength: 400 }} multiline minRows={2} fullWidth />
          <input value={f.site} onChange={set('site')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, height: 0, width: 0, opacity: 0 }} />
          {err ? <div className="err" role="alert">{err}</div> : null}
          <Button variant="primary" disabled={busy} onClick={send}>{busy ? 'Sending...' : 'Send enquiry'}</Button>
        </div>
      )}
    </div>
  );
}

/* Staff inbox for enquiries */
export function Enquiries() {
  const [rows, setRows] = useState(null);
  const load = async () => {
    if (!LIVE) return setRows([{ id: 1, at: new Date().toISOString(), name: 'Sample enquiry', phone: '03001234567', class_wanted: 'Class 5', note: 'Demo only', status: 'new' }]);
    const r = await sb.from('inquiries').select('*').order('at', { ascending: false }).limit(100);
    if (r.error) { toast('Enquiries are not set up yet. Run update_v3_free_features.sql.'); return setRows([]); }
    setRows(r.data);
  };
  useEffect(() => { load(); }, []);
  const mark = async (x, status) => {
    if (LIVE) { const r = await sb.from('inquiries').update({ status }).eq('id', x.id); if (r.error) return toast('Could not update.'); }
    setRows((l) => l.map((y) => (y.id === x.id ? { ...y, status } : y)));
  };
  const link = typeof window !== 'undefined' ? window.location.origin + '/?enquiry=1' : '';
  return (
    <>
      <PageHead title="Enquiries" sub="Admission enquiries from your public form.">
        <Button variant="secondary" onClick={() => { try { navigator.clipboard.writeText(link); toast('Form link copied'); } catch (e) { toast(link); } }}>Copy form link</Button>
      </PageHead>
      {rows == null ? <p className="mut">Loading...</p> : rows.length ? rows.map((x) => (
        <Card key={x.id}>
          <div className="row sp"><b>{x.name}</b><Tag c={x.status === 'new' ? 'info' : 'ok'}>{x.status}</Tag></div>
          <div className="meta">{x.phone}{x.class_wanted ? ', ' + x.class_wanted : ''}, {String(x.at).slice(0, 10)}</div>
          {x.note ? <p>{x.note}</p> : null}
          <div className="row">
            <WaBtn phone={x.phone} text={'Assalam-o-Alaikum ' + x.name + '. Thank you for your enquiry at ' + SCHOOL_NAME + '.'} label="WhatsApp" />
            {['contacted', 'admitted', 'closed'].filter((s) => s !== x.status).map((s) => <Button key={s} size="sm" variant="text" onClick={() => mark(x, s)}>Mark {s}</Button>)}
          </div>
        </Card>
      )) : <Empty t="No enquiries yet. Share the form link." />}
    </>
  );
}
