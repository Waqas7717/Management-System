import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Avatar, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Ico } from './Ico';
import { Num } from './Num';
import { F, S, TYPEC, TYPEL } from '../core/data';
import { render } from '../core/store';
import { readPhoto } from '../core/photo';

export { Ico };

/* ---------- state helpers ---------- */
export const useF = (k, d) => [F(k, d), (v) => { S.f[k] = v; render(); }];

/* ---------- chips and small bits ---------- */
const TAGC = {
  ok: ['--okbg', '--ok'], bad: ['--badbg', '--bad'], warn: ['--warnbg', '--warn'], info: ['--infobg', '--info'],
  gold: ['--gold', '--goldink'], '': ['--sf2', '--mut'],
};
export const Tag = ({ c = '', children }) => {
  const [bg, fg] = TAGC[c] || TAGC[''];
  return <Chip label={children} size="small" sx={{ bgcolor: `var(${bg})`, color: `var(${fg})`, whiteSpace: 'nowrap' }} />;
};
export const StChip = ({ st }) => (st === 'P' ? <Tag c="ok">Present</Tag> : st === 'A' ? <Tag c="bad">Absent</Tag> : st === 'L' ? <Tag c="warn">Leave</Tag> : <Tag>Not marked</Tag>);
export const LeaveChip = ({ s }) => (s === 'approved' ? <Tag c="ok">Approved</Tag> : s === 'declined' ? <Tag c="bad">Declined</Tag> : s === 'cancelled' ? <Tag>Cancelled</Tag> : <Tag c="warn">Pending</Tag>);
export const TypeTag = ({ t, fallback = 'Update' }) => <Tag c={TYPEC[t]}>{TYPEL[t] || fallback}</Tag>;
export const Pill = ({ st }) => <span className={'pill ' + (st || '')}>{st || '-'}</span>;
export const Empty = ({ t, s }) => <div className="empty"><span className="em-ic" aria-hidden="true"><Ico n="file" s={26} /></span><b>{t}</b>{s}</div>;
export const Err = ({ children }) => <div className="err" role="alert">{children}</div>;
const CARD_IC = [[/attend|present|today|marked/, 'check'], [/result|mark|performance|exam|grade|progress|trend/, 'chart'], [/leave|date sheet|calendar|timetable/, 'cal'], [/homework|add|subject/, 'book'], [/notif|notice|announce|sent|posted/, 'mega'], [/student|parent|teacher|user/, 'users'], [/lecture|clock/, 'clock']];
export const Card = ({ title, children, style }) => {
  if (!title) return <div className="card" style={style}>{children}</div>;
  const t = typeof title === 'string' ? title.toLowerCase() : '';
  const hit = CARD_IC.find((x) => x[0].test(t));
  return (
    <section className="card dcard" style={style}>
      <header className="dc-h"><h3><span className="dc-ic"><Ico n={hit ? hit[1] : 'file'} s={18} /></span>{title}</h3></header>
      {children}
    </section>
  );
};
export const Item = ({ children, unread, style }) => <div className={'item' + (unread ? ' unread' : '')} style={style}>{children}</div>;

const KCOL = { b: ['#2F6FDE', '#E6EEFD'], g: ['#17936A', '#E3F6EE'], o: ['#D6760F', '#FFF3D6'], p: ['#8A4FD3', '#F0E8FB'], r: ['#D64545', '#FBE4E1'] };
function kpiIcon(l) {
  l = l.toLowerCase();
  const m = [[/student/, 'cap', 'b'], [/parent/, 'users', 'g'], [/teacher|class teacher/, 'book', 'o'], [/principal/, 'award', 'p'], [/class|subject/, 'cal', 'p'], [/absent|not in|missing/, 'warn', 'r'], [/leave/, 'cal', 'o'], [/attend|present|marked/, 'check', 'g'], [/homework|pending/, 'book', 'o'], [/paper|exam|date/, 'file', 'b'], [/notice|unread/, 'bell', 'o'], [/total|percent|grade|position|result|average|pass/, 'award', 'p'], [/lecture/, 'clock', 'b']];
  for (const x of m) if (x[0].test(l)) return [x[1], KCOL[x[2]]];
  return ['chart', KCOL.b];
}
export function Kpi({ l, v, s, vs }) {
  const [n, c] = kpiIcon(l);
  return (
    <div className="ktile" style={{ '--tc': c[0], '--tb': c[1] }}>
      <span className="kt-ic" style={{ color: c[0], background: c[1] }} aria-hidden="true"><Ico n={n} s={24} /></span>
      <span className="kt-b"><b className={typeof v === 'string' && v.length > 6 ? 'txt' : undefined}><Num v={v} /></b><span className="kt-l">{l}</span>{s != null && s !== '' ? <small>{s}</small> : null}</span>
    </div>
  );
}

/* ---------- page header (pinned outside the scrolling area on desktop) ---------- */
export const SlotCtx = createContext(null);
export function PageHead({ title, sub, children }) {
  const slot = useContext(SlotCtx);
  const el = (
    <div className="head">
      <div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
      {children ? <div className="row">{children}</div> : null}
    </div>
  );
  return slot ? createPortal(el, slot) : el;
}

/* ---------- avatar ---------- */
export function Av({ o, lg }) {
  const n = ((o && o.name) || '').trim();
  const ini = n.split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();
  return <Avatar className={'av' + (lg ? ' lg' : '')} src={o && o.photo ? o.photo : undefined} alt="" sx={{ width: lg ? 52 : 32, height: lg ? 52 : 32, fontSize: lg ? 20 : 12, fontWeight: 700, bgcolor: 'var(--infobg)', color: 'var(--info)' }}>{ini}</Avatar>;
}
export const Who = ({ o, children }) => <span className="who"><Av o={o} />{children}</span>;

/* ---------- form fields ---------- */
export const Sel = ({ label, value, onChange, list, ...p }) => (
  <TextField select label={label} value={value} onChange={(e) => onChange(e.target.value)} SelectProps={{ native: true }} {...p}>
    {list.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </TextField>
);
export const FSel = ({ k, list, def, label, ...p }) => <Sel label={label} value={String(F(k, def))} onChange={(v) => { S.f[k] = v; render(); }} list={list} id={'f_' + k} {...p} />;
export const TF = ({ label, value, onChange, ...p }) => <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} {...p} />;
export const DateF = ({ label, value, onChange, min, max, ...p }) => (
  <TextField type="date" label={label} value={value} onChange={(e) => onChange(e.target.value)} inputProps={{ min, max }} {...p} />
);
export const FDate = ({ k, def, label, max }) => <DateF id={'f_' + k} label={label} value={F(k, def)} max={max} onChange={(v) => { S.f[k] = v; render(); }} />;

export function Seg({ k, list, def, label, value, onChange }) {
  const val = value !== undefined ? value : F(k, def);
  const set = onChange || ((v) => { S.f[k] = v; render(); });
  return (
    <ToggleButtonGroup exclusive value={String(val)} onChange={(e, v) => { if (v != null) set(v); }} aria-label={label || 'Choose'}>
      {list.map(([v, l, sub]) => <ToggleButton key={v} value={String(v)}>{l}{sub ? <small style={{ marginLeft: 6, opacity: .8, color: 'inherit' }}>{sub}</small> : null}</ToggleButton>)}
    </ToggleButtonGroup>
  );
}
export function CheckGroup({ items, checked, onChange, cols, type = 'checkbox' }) {
  const toggle = (v) => onChange(checked.includes(v) ? checked.filter((x) => x !== v) : checked.concat(v));
  return (
    <div className={'chks' + (cols ? ' cols' : '')}>
      {items.map((it) => (
        <FormControlLabel key={it.value} className="chk" control={<Checkbox size="small" checked={checked.includes(it.value)} onChange={() => toggle(it.value)} />}
          label={<span>{it.label}{it.small ? <small> {it.small}</small> : null}</span>} />
      ))}
    </div>
  );
}
export const FileBox = ({ label, onChange, accept, id }) => (
  <div className="field">
    <label className="flabel" htmlFor={id}>{label}</label>
    <input className="uploadbox" type="file" id={id} accept={accept} onChange={(e) => onChange(e.target.files && e.target.files[0])} />
  </div>
);

/* ---------- data table ---------- */
export function DT({ cols, rows, minWidth = 480, className }) {
  const cs = cols.map((c) => (typeof c === 'string' ? { h: c } : c));
  return (
    <TableContainer className={'tw' + (className ? ' ' + className : '')}>
      <Table size="small" sx={{ minWidth }}>
        <TableHead><TableRow>{cs.map((c, i) => <TableCell key={i} align={c.n ? 'right' : 'left'} title={c.title}>{c.h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>{r.map((x, j) => <TableCell key={j} align={cs[j] && cs[j].n ? 'right' : 'left'}>{x}</TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ---------- dialogs ---------- */
export function Modal({ open = true, title, onClose, children, actions = [], error, cancelLabel = 'Cancel', maxWidth = 'xs' }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth} scroll="paper" aria-label={title}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        {children}
        {error ? <div className="err" role="alert">{error}</div> : null}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>{cancelLabel}</Button>
        {actions.map((a, i) => (
          <Button key={i} variant="contained" color={a.color || 'primary'} onClick={a.onClick} disabled={a.disabled}>{a.label}</Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}

/* A picture chooser that shrinks the photo to under 2 KB. value: undefined = unchanged, '' = removed */
export function PhotoField({ person, value, onChange, onError }) {
  const shown = value !== undefined ? { name: person ? person.name : '', photo: value } : person;
  return (
    <div className="field">
      <label className="flabel">Photo (optional)</label>
      <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
        {shown && shown.photo ? <Av o={shown} lg /> : <span className="av lg" aria-hidden="true">+</span>}
        <input className="uploadbox" style={{ flex: 1, minWidth: 0 }} type="file" accept="image/*" aria-label="Choose photo"
          onChange={async (e) => {
            const f = e.target.files && e.target.files[0]; if (!f) return;
            try { onChange(await readPhoto(f)); onError(''); } catch (x) { e.target.value = ''; onError(x.message || 'Could not use this image.'); }
          }} />
        <Button size="small" variant="outlined" onClick={() => onChange('')}>Remove</Button>
      </div>
    </div>
  );
}

export const useBusy = () => { const [b, setB] = useState(false); return [b, setB]; };
