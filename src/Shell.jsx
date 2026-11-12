import { Component, useEffect, useRef, useState } from 'react';
import { Badge, Button, Drawer, IconButton, Popover } from '@mui/material';
import { ARTS } from './core/arts';
import { DEMO } from './core/config';
import { DB, NAVS, S, TYPEC, TYPEL, cap, feed, isRead, tClasses, unread } from './core/data';
import { fs } from './core/dates';
import { go, toTop } from './core/actions';
import { render } from './core/store';
import { logout, saveReads } from './core/sync';
import { Crest } from './Login';
import { Av, Ico, SlotCtx, Tag } from './ui';
import { ProfileDialog } from './screens/admin/dialogs';
import { VIEWS } from './screens';
import { Empty } from './ui';

function artFor(role, title) {
  const t = (title || '').toLowerCase();
  if (/dashboard|overview|home/.test(t)) return role === 'principal' ? ARTS.build_s : ARTS.build;
  if (/announcement|notice/.test(t)) return ARTS.mega;
  if (/leave|event|timetable|date sheet/.test(t)) return ARTS.cal;
  return ARTS.leaf;
}

/* ---------- global search ---------- */
function findHits(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const out = [];
  NAVS[S.role].items.forEach((i) => { if (i[1].toLowerCase().includes(q)) out.push({ t: i[1], s: 'Page', v: i[0], ic: i[2] }); });
  const add = (arr, view, label, ic, tab) => (arr || []).forEach((o) => { if (out.length < 16 && o && o.name && o.name.toLowerCase().includes(q)) out.push({ t: o.name, s: label, v: view, ic, tab, q: o.name }); });
  if (S.role === 'admin') { add(DB.students, 'students', 'Student', 'cap'); add(DB.parents, 'parents', 'Parent', 'users'); add(DB.teachers, 'teachers', 'Teacher', 'book'); add(DB.principals, 'principals', 'Principal', 'award'); }
  else if (S.role === 'principal') { add(DB.teachers, 'users', 'Teacher', 'book', 'teachers'); add(DB.parents, 'users', 'Parent', 'users', 'parents'); add(DB.students, 'users', 'Student', 'cap', 'students'); }
  else if (S.role === 'teacher') { const cl = S.user && S.user.assign ? tClasses(S.user) : []; add((DB.students || []).filter((s) => cl.includes(s.cid)), 'att', 'Student', 'cap'); }
  return out;
}
function GlobalSearch() {
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), [hits, setHits] = useState([]);
  const ref = useRef(null), inp = useRef(null);
  const mobile = () => window.innerWidth < 900;
  const close = () => { setHits([]); };
  useEffect(() => {
    const key = (e) => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); if (mobile()) setOpen(true); inp.current && inp.current.focus(); }
    };
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) { setHits([]); if (mobile() && !inp.current.value) setOpen(false); } };
    document.addEventListener('keydown', key); document.addEventListener('click', click);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('click', click); };
  }, []);
  const pick = (x) => {
    setQ(''); close(); setOpen(false);
    S.view = x.v; S.f.uq = ''; S.f.psq = '';
    if (x.tab) S.f.utab = x.tab;
    if (x.q) { if (S.role === 'teacher') S.f.psq = x.q; else S.f.uq = x.q; }
    render(); toTop();
  };
  const onChange = (v) => { setQ(v); setHits(v.trim() ? findHits(v) : []); };
  return (
    <div className={'srch' + (open ? ' open' : '')} id="srch" ref={ref}>
      <button type="button" className="si" aria-label="Search" onClick={() => { if (mobile()) setOpen(!open); inp.current.focus(); }}><Ico n="search" s={19} /></button>
      <input id="gq" ref={inp} type="search" value={q} autoComplete="off" aria-label="Search"
        placeholder={S.role === 'parent' ? 'Search pages' : 'Search students, parents, pages'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (hits.length) pick(hits[0]); }
          if (e.key === 'Escape') { setQ(''); close(); setOpen(false); }
        }} />
      {q.trim() ? (
        <div className="gs" role="listbox">
          {hits.length ? hits.map((x, i) => <button type="button" role="option" key={i} onClick={() => pick(x)}><Ico n={x.ic || 'search'} s={18} /><span>{x.t}</span><small>{x.s}</small></button>) : <div className="none">No match found.</div>}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- notifications ---------- */
function Bell({ anchor, onClose }) {
  const f = feed().slice(0, 25);
  const mark = (id) => { S.reads[S.user.id][id] = true; saveReads(); render(); };
  return (
    <Popover open={!!anchor} anchorEl={anchor} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 'min(420px, calc(100vw - 20px))', maxHeight: '70vh', mt: 1 } } }}>
      <div className="pan" role="dialog" aria-label="Notifications">
        <div className="ph"><b>Notifications</b><Button size="small" variant="outlined" onClick={() => { feed().forEach((x) => { S.reads[S.user.id][x.id] = true; }); saveReads(); render(); }}>Mark all read</Button></div>
        {f.length ? f.map((x) => (
          <button type="button" key={x.id} className={'pi ' + (isRead(x.id) ? '' : 'u')} onClick={() => mark(x.id)}>
            <span className="row"><Tag c={TYPEC[x.type]}>{TYPEL[x.type] || 'Update'}</Tag><small>{fs(x.ts.slice(0, 10))}</small></span>
            <b>{x.title}</b><span className="mut">{x.text}</span>
          </button>
        )) : <div style={{ padding: 20 }} className="mut">Nothing new right now.</div>}
      </div>
    </Popover>
  );
}

/* ---------- the shell ---------- */
class ViewBoundary extends Component {
  constructor(p) { super(p); this.state = { bad: false }; }
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch(e) { console.error(e); }
  componentDidUpdate(prev) { if (prev.k !== this.props.k && this.state.bad) this.setState({ bad: false }); }
  render() { return this.state.bad ? <Empty t="This page could not be shown" s="Go back or reload the page. If it keeps happening, tell the school office." /> : this.props.children; }
}

export default function Shell({ dark, toggleDark }) {
  const nav = NAVS[S.role], items = nav.items, u = S.user, n = unread();
  const cur = items.find((i) => i[0] === S.view) || items[0];
  const [slot, setSlot] = useState(null), [bell, setBell] = useState(null), [more, setMore] = useState(false), [profile, setProfile] = useState(false);
  const View = VIEWS[S.role][cur[0]];
  const out = async () => { setBell(null); setMore(false); await logout(); };
  const openProfile = () => { setMore(false); setProfile(true); };
  return (
    <SlotCtx.Provider value={slot}>
      <div className="app">
        <aside className="side">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: ARTS.sidewave }} />
          <div className="logo"><div className="crest"><Crest light /></div><div><b>FG Campus</b><small>{cap(S.role)} portal</small></div></div>
          <nav aria-label="Main">
            {items.map((i) => <button type="button" key={i[0]} aria-current={i[0] === cur[0] ? 'page' : undefined} onClick={() => go(i[0])}><Ico n={i[2]} /><span>{i[1]}</span></button>)}
          </nav>
          <div className="me">
            <button type="button" className="mebtn" title="Change my photo" aria-label="My profile and photo" onClick={openProfile}>
              <Av o={u} /><div><b>{u.name}</b><small>{cap(S.role)}{DEMO ? ' (demo)' : ''}</small></div>
            </button>
            <button type="button" className="out" aria-label="Log out" onClick={out}><Ico n="out" s={19} /></button>
          </div>
        </aside>
        <div className={'mainc role-' + S.role + (cur === items[0] ? ' hero' : ' hero sub')}>
          <header className="top">
            <div className="ttl">{cur[1]}</div>
            <GlobalSearch />
            <IconButton className="iconbtn" aria-label="Switch light or dark mode" onClick={toggleDark}><Ico n="moon" s={20} /></IconButton>
            {S.role === 'admin' ? null : (
              <IconButton className="iconbtn" aria-label={`Notifications, ${n} unread`} onClick={(e) => setBell(e.currentTarget)}>
                <Ico n="bell" s={20} />{n ? <span className="badge">{n}</span> : null}
              </IconButton>
            )}
            <IconButton className="iconbtn toplo" aria-label="Log out" onClick={out}><Ico n="out" s={20} /></IconButton>
          </header>
          <div className="pghead" id="pghead" ref={setSlot} />
          <main className="view" id="view">
            <ViewBoundary k={S.role + cur[0]}><View /></ViewBoundary>
          </main>
          <div className="deco" aria-hidden="true">
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: ARTS.wave + artFor(S.role, cur[1]) }} />
          </div>
        </div>
        <nav className="tabs" aria-label="Main">
          {nav.bottom.map((k) => { const i = items.find((x) => x[0] === k); return <button type="button" key={k} aria-current={k === cur[0] ? 'page' : undefined} onClick={() => go(k)}><Ico n={i[2]} s={21} /><span>{i[1].split(' ')[0]}</span></button>; })}
          <button type="button" onClick={() => setMore(true)}><Ico n="more" s={21} /><span>More</span></button>
        </nav>
        {S.role !== 'admin' && <Bell anchor={bell} onClose={() => setBell(null)} />}
        <Drawer anchor="bottom" open={more} onClose={() => setMore(false)} PaperProps={{ sx: { borderRadius: '26px 26px 0 0', p: 2, display: 'grid', gap: .75, pb: 'calc(18px + env(safe-area-inset-bottom,0px))' } }}>
          <button type="button" className="sheetbtn" onClick={openProfile}><Av o={u} /><span>My profile photo</span></button>
          {items.map((i) => (
            <button type="button" className="sheetbtn" key={i[0]} onClick={() => { setMore(false); go(i[0]); }}>
              <Ico n={i[2]} /><span style={{ flex: 1 }}>{i[1]}</span>{i[0] === cur[0] ? <Tag c="gold">Open</Tag> : null}
            </button>
          ))}
        </Drawer>
        {profile && <ProfileDialog onClose={() => setProfile(false)} />}
      </div>
    </SlotCtx.Provider>
  );
}
