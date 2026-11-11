import { useState } from 'react';
import { Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { ARTS } from './core/arts';
import { LIVE, DEMO } from './core/config';
import { DB, S, cap } from './core/data';
import { render } from './core/store';
import { demoLogin, login } from './core/sync';
import { makeTheme } from './theme';
import { Err } from './ui';

const lightTheme = makeTheme('light');

const LIC = {
  admin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  principal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  teacher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/></svg>',
  parent: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 2.2 5 5"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c0-4.7 3.8-8 8.5-8s8.5 3.3 8.5 8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeoff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>',
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>',
};
const I = ({ k }) => <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: LIC[k] }} />;

export const Crest = ({ light }) => (
  <svg className="crestsvg" viewBox="0 0 100 112" aria-hidden="true">
    <path d="M50 2 92 16v38c0 28-18 46-42 56C26 100 8 82 8 54V16z" fill={light ? '#FFFFFF' : '#0B1F4D'} fillOpacity={light ? '.92' : '1'} />
    <path d="M50 9 85 21v33c0 23-15 39-35 48-20-9-35-25-35-48V21z" fill="#F7B500" />
    <path d="M50 15 79 25v29c0 19-12 33-29 41-17-8-29-22-29-41V25z" fill="none" stroke="#0B1F4D" strokeWidth={light ? 2 : 1.6} />
    <path d="m50 20 2.6 5.3 5.8.8-4.2 4.1 1 5.8L50 33.2l-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z" fill="#0B1F4D" />
    <text x="50" y={light ? 72 : 68} textAnchor="middle" fontFamily="Merriweather,serif" fontWeight="900" fontSize={light ? 32 : 31} fill="#0B1F4D">FG</text>
    {!light && <>
      <rect x="22" y="76" width="56" height="13" rx="3" fill="#0B1F4D" />
      <text x="50" y="85.6" textAnchor="middle" fontFamily="Nunito Sans,sans-serif" fontWeight="700" fontSize="7" letterSpacing="1.4" fill="#F7B500">SAKESAR</text>
    </>}
  </svg>
);

const Brand = () => (
  <>
    <div className="logo"><Crest /><div><b>F.G Public School<br />and College</b><small>Sakesar</small></div></div>
    <div className="ltag"><span className="star">★</span><span>Learn • Manage • Excel</span></div>
  </>
);

const Bg = () => (
  <div className="lbg" aria-hidden="true">
    <svg className="sw" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="rgba(247,181,0,.4)" strokeWidth="1.5"><circle cx="150" cy="970" r="450" /><circle cx="70" cy="1050" r="450" /><circle cx="1350" cy="30" r="450" /></svg>
    <div className="lart" dangerouslySetInnerHTML={{ __html: ARTS.lart }} />
    <div className="lhero" style={{ order: 2 }}>
      <h1>One place for the<br /><span>whole campus.</span></h1>
      <p>Attendance, homework, results, timetable and notices for students, parents, teachers and principals, all in one secure portal.</p>
      <div className="fts"><span>Attendance</span><span>Homework</span><span>Results</span><span>Notices</span></div>
    </div>
  </div>
);

const DEMO_HINTS = {
  admin: [['admin', 'admin123', 'School Admin. Adds and removes students, parents, teachers and principals.']],
  principal: [['principal', 'prin123', 'Dr. Farhan Ahmed, Principal']],
  teacher: [['imran', 'teach123', 'Imran Qureshi, class teacher of 9-A'], ['sana', 'teach123', 'Sana Javed, class teacher of 10-A']],
  parent: [['parent1', 'parent123', 'Mr. Tariq Khan. Children: Ayesha (Class 9-A) and Hamna (FSc Part 1)']],
};

const Shell = ({ children }) => (
  <ThemeProvider theme={lightTheme}>
    <div className="login"><Bg /><div className="lbox">{children}</div></div>
  </ThemeProvider>
);

export default function Login() {
  const r = S.lrole, roles = ['admin', 'principal', 'teacher', 'parent'];
  const [u, setU] = useState(''), [p, setP] = useState(''), [show, setShow] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [du, setDu] = useState('');

  if (S.booting) return <Shell><Brand /><p className="mut" role="status">Loading your account…</p></Shell>;

  const tabs = (
    <div className="rtabs" role="group" aria-label="Choose login type">
      {roles.map((x) => (
        <button key={x} type="button" aria-pressed={r === x} onClick={() => { S.lrole = x; setErr(''); render(); }}><I k={x} /><span>{cap(x)}</span></button>
      ))}
    </div>
  );
  const run = async (fn) => { setBusy(true); setErr(''); const m = await fn(); setBusy(false); if (m) setErr(m); };

  // Live site with the demo sign-in switched on: choose a person, no password
  if (LIVE && S.demoUsers && !S.pwMode) {
    const found = S.demoUsers.filter((x) => x.role === r);
    const list = found.length ? found : r === 'admin' ? [{ role: 'admin', username: 'admin', name: 'School Admin' }] : [];
    const who = du && list.some((x) => x.username === du) ? du : (list[0] ? list[0].username : '');
    return (
      <Shell>
        <Brand />{tabs}
        {list.length ? (
          <>
            <label className="flab" htmlFor="du"><I k="user" />Username</label>
            <TextField select id="du" value={who} onChange={(e) => setDu(e.target.value)} SelectProps={{ native: true }} InputLabelProps={{ shrink: false }} label="">
              {list.map((x) => <option key={x.username} value={x.username}>{x.name} ({x.username})</option>)}
            </TextField>
            <label className="flab" htmlFor="dp"><I k="lock" />Password</label>
            <TextField id="dp" type="password" value="demo-password" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: false }} label="" />
          </>
        ) : <p className="mut" style={{ margin: '12px 0' }}>No {r} accounts yet. The Admin adds them first.</p>}
        <Err>{err}</Err>
        {list.length > 0 && (
          <Button fullWidth variant="contained" color="secondary" className="gobtn" disabled={busy} sx={{ mt: 1.5, height: 54, fontSize: 17, fontWeight: 800 }} onClick={() => run(() => demoLogin(r, who))}>
            <I k="go" />Sign in as {cap(r)}
          </Button>
        )}
        <p className="mut" style={{ marginTop: 14, fontSize: 12.5 }}>Demo mode: pick a name and press Sign in. The password is filled in for you.</p>
        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => { S.pwMode = true; render(); }}>Sign in with a password instead</Button>
      </Shell>
    );
  }

  const hints = DEMO ? DEMO_HINTS[r] : null;
  const submit = () => run(() => login(r, u, p));
  return (
    <Shell>
      <Brand />{tabs}
      <label className="flab" htmlFor="lu"><I k="user" />Username</label>
      <TextField id="lu" value={u} placeholder="Enter your username" onChange={(e) => setU(e.target.value)} autoComplete="username"
        inputProps={{ autoCapitalize: 'none', spellCheck: 'false' }} InputLabelProps={{ shrink: false }} label="" onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <label className="flab" htmlFor="lp"><I k="lock" />Password</label>
      <TextField id="lp" type={show ? 'text' : 'password'} value={p} placeholder="Enter your password" onChange={(e) => setP(e.target.value)} autoComplete="current-password"
        InputLabelProps={{ shrink: false }} label="" onKeyDown={(e) => e.key === 'Enter' && submit()}
        InputProps={{ endAdornment: <InputAdornment position="end"><IconButton className="eye" aria-label="Show or hide password" onClick={() => setShow(!show)}><I k={show ? 'eye' : 'eyeoff'} /></IconButton></InputAdornment> }} />
      <Err>{err}</Err>
      <Button fullWidth variant="contained" color="secondary" className="gobtn" disabled={busy} sx={{ mt: 1.5, height: 54, fontSize: 17, fontWeight: 800 }} onClick={submit}>
        <I k="go" />Sign in as {cap(r)}
      </Button>
      {LIVE && S.demoUsers && <Button size="small" variant="outlined" sx={{ mt: 1.25 }} onClick={() => { S.pwMode = false; render(); }}>Back to demo sign in</Button>}
      {DEMO ? (
        <>
          <div className="demo"><b>Demo {r} login</b>
            {hints.map((d) => (
              <div className="row sp" style={{ marginTop: 8 }} key={d[0]}>
                <span>{d[2]}<br />User <code>{d[0]}</code> Password <code>{d[1]}</code></span>
                <Button size="small" variant="outlined" onClick={() => { setU(d[0]); setP(d[1]); }}>Fill in</Button>
              </div>
            ))}
            {r === 'teacher' && <div className="mut" style={{ marginTop: 8 }}>Other teachers: nadeem, rubina, khalid, ayesha. Same password.</div>}
          </div>
          <p className="mut" style={{ marginTop: 14, fontSize: 12.5 }}>Demo with sample data for Class 9-A, Class 10-A and FSc Part 1. Nothing is saved or sent.</p>
        </>
      ) : <p className="linfo"><I k="info" /><span>Use the username and password given to you by the school office.</span></p>}
    </Shell>
  );
}
