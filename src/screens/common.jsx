import { useState } from 'react';
import { Button } from '@mui/material';
import { CLASSES, DB, S, audLabel, byName, uid } from '../core/data';
import { DAYN, PT, TODAY, dow, fd, fs, isSchool, nowHM } from '../core/dates';
import { ask, render, toast } from '../core/store';
import { useAI } from './useai';
import { Empty, Item, Modal, PageHead, Sel, TF, DateF, CheckGroup, Tag, TypeTag } from '../ui';

/* ---- weekly timetable grid (read-only views) ---- */
export function TtGrid({ cell, hl }) {
  const today = isSchool(TODAY) ? dow(TODAY) : -1;
  return (
    <div className="tw">
      <table className="ttbl">
        <thead><tr><th>Lecture</th>{[0, 1, 2, 3, 4].map((i) => <th key={i} style={today === i ? { color: 'var(--gold)' } : undefined}>{DAYN[i]}</th>)}</tr></thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((p) => (
            <tr key={p}>
              <td>{p} <small>{PT[p - 1]}</small></td>
              {[0, 1, 2, 3, 4].map((i) => <td key={i} style={hl && today === i ? { background: 'var(--infobg)' } : undefined}>{cell(i, p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- announcement / notice form ---- */
export function AnnDialog({ kind, ann, onClose }) {
  const au = ann ? ann.aud : { kind: 'all', cids: [] };
  const [title, setTitle] = useState(ann ? ann.title : ''), [body, setBody] = useState(ann ? ann.body : '');
  const [type, setType] = useState(ann ? ann.type : 'notice'), [pub, setPub] = useState(ann ? ann.publish : TODAY);
  const [ak, setAk] = useState(au.kind), [cids, setCids] = useState(au.cids.slice()), [err, setErr] = useState('');
  const [aiBusy, aiRun] = useAI(), [aiLang, setAiLang] = useState('en');
  const types = kind === 'notice' ? [['notice', 'Notice'], ['event', 'Event'], ['urgent', 'Urgent']] : [['notice', 'Notice'], ['ptm', 'PTM'], ['event', 'Event'], ['urgent', 'Urgent']];
  const save = () => {
    const t = title.trim(), b = body.trim();
    if (t.length < 3) return setErr('Write a title.');
    if (b.length < 5) return setErr('Write the message.');
    if (ak === 'classes' && !cids.length) return setErr('Select at least one class.');
    if (!pub) return setErr('Choose a publish date.');
    const aud = { kind: ak, cids: ak === 'classes' ? cids : [], sids: [] };
    if (ann) { ann.title = t; ann.body = b; ann.type = type; ann.aud = aud; ann.publish = pub; }
    else DB.anns.unshift({ id: 'a' + uid(), kind, type, title: t, body: b, aud, by: S.role === 'admin' ? S.user.id : 'p0', ts: TODAY + 'T' + nowHM(), publish: pub });
    onClose(); render();
    toast(pub > TODAY ? 'Saved. It will appear on ' + fs(pub) + '.' : 'Published. ' + audLabel(aud) + ' can see it now.');
  };
  return (
    <Modal title={ann ? 'Edit ' + ann.kind : 'New ' + (kind === 'notice' ? 'notice' : 'announcement')} onClose={onClose} error={err}
      actions={[{ label: ann ? 'Save changes' : 'Publish', onClick: save }]}>
      <TF label="Title" value={title} onChange={setTitle} />
      <div className="field"><TF label="Message" value={body} onChange={setBody} multiline minRows={3} /></div>
      <div className="row" style={{ marginTop: 8 }}>
        <Button size="small" variant="outlined" disabled={aiBusy} onClick={async () => { const t = await aiRun('notice', { text: (body.trim() || title.trim()), lang: aiLang }); if (t) setBody(t); }}>{aiBusy ? 'Writing...' : 'Write with AI'}</Button>
        <div style={{ width: 130 }}><Sel label="Language" value={aiLang} onChange={setAiLang} list={[['en', 'English'], ['ur', 'Urdu']]} /></div>
        <small className="mut">Type a rough note, then tap Write with AI. Check the result before publishing.</small>
      </div>
      <div className="g2 field">
        <Sel label="Type" value={type} onChange={setType} list={types} />
        <DateF label="Publish date" value={pub} onChange={setPub} min={TODAY} />
      </div>
      <div className="field"><Sel label="Send to" value={ak} onChange={setAk} list={[['all', 'Whole school and college'], ['teachers', 'Teachers only'], ['parents', 'Parents only'], ['classes', 'Selected classes']]} /></div>
      {ak === 'classes' && <><label className="flabel">Classes</label><CheckGroup items={CLASSES.map((c) => ({ value: c.id, label: c.name }))} checked={cids} onChange={setCids} /></>}
    </Modal>
  );
}

/* ---- announcements and notices (principal and admin) ---- */
export function AnnScreen({ kind }) {
  const [dlg, setDlg] = useState(null);
  const list = DB.anns.filter((a) => a.kind === kind).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const ttl = kind === 'notice' ? 'Notices' : 'Announcements';
  return (
    <>
      <PageHead title={ttl} sub={kind === 'notice' ? 'Official notices such as holidays, fee dates and rules.' : 'Messages for the whole school or for chosen classes.'}>
        <Button variant="contained" onClick={() => setDlg({ kind })}>New {kind === 'notice' ? 'notice' : 'announcement'}</Button>
      </PageHead>
      {list.length ? list.map((a) => (
        <Item key={a.id}>
          <div className="row sp"><span className="row"><TypeTag t={a.type} fallback="Notice" />{a.publish > TODAY ? <Tag c="info">{'Scheduled for ' + fs(a.publish)}</Tag> : null}</span><small>{fd(a.publish)}</small></div>
          <h4>{a.title}</h4><p>{a.body}</p>
          <div className="meta"><span>To {audLabel(a.aud)}</span><span>From {byName(a.by)}</span></div>
          <div className="row">
            {(S.role === 'admin' ? a.by === S.user.id : a.by === 'p0') && <Button size="small" variant="outlined" onClick={() => setDlg({ kind: a.kind, ann: a })}>Edit</Button>}
            <Button size="small" variant="contained" color="error" onClick={() => ask('Delete this item?', 'Delete', () => { DB.anns = DB.anns.filter((x) => x.id !== a.id); render(); toast('Deleted.'); })}>Delete</Button>
          </div>
        </Item>
      )) : <Empty t="Nothing here yet" s="Use the button above to create one." />}
      {dlg && <AnnDialog key={dlg.ann ? dlg.ann.id : 'new'} kind={dlg.kind} ann={dlg.ann} onClose={() => setDlg(null)} />}
    </>
  );
}
