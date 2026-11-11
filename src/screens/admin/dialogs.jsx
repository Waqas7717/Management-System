import { useState } from 'react';
import { Button } from '@mui/material';
import {
  CLASSES, DB, S, SUBJ, cap, cls, genPass, slug, subName, suggestUser, teacherFor, ROLE_LIST, stu, ev, uid,
} from '../../core/data';
import { TODAY, addDays, fd } from '../../core/dates';
import { render, toast } from '../../core/store';
import { store } from '../../core/stores';
import { CheckGroup, DateF, Modal, PhotoField, Sel, TF } from '../../ui';

const roleLabel = { teacher: 'teacher', parent: 'parent', principal: 'principal' };

export function ProfileDialog({ onClose }) {
  const [photo, setPhoto] = useState(undefined), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => {
    if (photo === undefined) return setErr('Choose a photo first.');
    setBusy(true);
    try { await store.saveMyPhoto(photo); } catch (e) { setBusy(false); return setErr(e.message || 'Could not save the photo.'); }
    onClose(); render(); toast('Photo updated.');
  };
  return (
    <Modal title="My profile" onClose={onClose} error={err} actions={[{ label: 'Save photo', onClick: save, disabled: busy }]}>
      <p className="mut" style={{ marginBottom: 10 }}><b>{S.user.name}</b> ({cap(S.role)})</p>
      <PhotoField person={S.user} value={photo} onChange={setPhoto} onError={setErr} />
      <p className="mut" style={{ fontSize: 13, marginTop: 8 }}>Your photo is shrunk automatically to under 2 KB.</p>
    </Modal>
  );
}

export function CredsDialog({ info, onClose }) {
  return (
    <Modal title={info.title || 'Login created'} onClose={onClose} cancelLabel="Done">
      <p className="mut" style={{ marginBottom: 10 }}>Give these login details to {info.name}. The password is shown only now, so note it down.</p>
      <div className="item"><div>Username <code>{info.u}</code></div><div>Password <code>{info.pw}</code></div></div>
    </Modal>
  );
}

export function AccountDialog({ role, id, onClose, onCreds }) {
  const o = id ? ROLE_LIST[role]().find((x) => x.id === id) : null;
  const [name, setName] = useState(o ? o.name : ''), [phone, setPhone] = useState(o ? o.phone : ''), [rel, setRel] = useState(o ? o.rel : 'Father');
  const [photo, setPhoto] = useState(undefined), [user, setUser] = useState(o ? o.user : ''), [pw, setPw] = useState(() => genPass());
  const [kids, setKids] = useState(o && o.kids ? o.kids.slice() : []);
  const [asg, setAsg] = useState(() => (role === 'teacher' && o ? o.assign.map((a) => a[0] + '|' + a[1]) : []));
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const pairs = []; CLASSES.forEach((c) => c.subjects.forEach((sb) => pairs.push([c.id, sb])));
  const sts = DB.students.filter((s) => s.active);

  const save = async () => {
    const n = name.trim(), ph = phone.trim();
    let u = user.toLowerCase().replace(/\s+/g, '');
    if (n.length < 3) return setErr('Enter the full name.');
    if (role === 'parent') { if (!/^[0-9+\- ]{10,15}$/.test(ph)) return setErr('Enter a valid phone number, for example 0300-1234567.'); }
    else if (ph.length < 7) return setErr('Enter a phone number.');
    if (role === 'parent' && !kids.length) return setErr('Link at least one student.');
    if (!u) u = suggestUser(n);
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) return setErr('Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore.');
    const password = id ? '' : pw.trim();
    if (!id && password.length < 8) return setErr('Password must be at least 8 characters.');
    setBusy(true);
    let r;
    try { r = await store.saveAccount(role, id, { name: n, phone: ph, username: u, password, rel, photo }); }
    catch (e) { setBusy(false); return setErr(e.message || 'Something went wrong.'); }
    try {
      if (role === 'parent') await store.setKids(r.id, kids);
      if (role === 'teacher') await store.setAssignments(r.id, asg.map((s) => s.split('|')));
    } catch (e) {
      onClose(); render(); if (!id) onCreds({ name: n, u, pw: password });
      return toast('Saved, but the links did not save: ' + e.message + ' Open Edit to try again.');
    }
    onClose(); render();
    if (r && r.photoFailed) toast('Saved, but the photo could not be saved. Open Edit to try again.');
    if (id) toast(cap(roleLabel[role]) + ' updated.'); else onCreds({ name: n, u, pw: password });
  };

  return (
    <Modal title={(o ? 'Edit ' : 'Add ') + roleLabel[role]} onClose={onClose} error={err} actions={[{ label: o ? 'Save changes' : 'Add ' + roleLabel[role], onClick: save, disabled: busy }]}>
      <TF id="ma_n" label="Full name" value={name} onChange={setName} autoComplete="off" />
      <div className="g2 field">
        <TF id="ma_p" label="Phone" value={phone} onChange={setPhone} placeholder="0300-1234567" autoComplete="off" />
        {role === 'parent' ? <Sel id="ma_r" label="Relation" value={rel} onChange={setRel} list={[['Father', 'Father'], ['Mother', 'Mother'], ['Guardian', 'Guardian']]} /> : <div />}
      </div>
      <PhotoField person={o} value={photo} onChange={setPhoto} onError={setErr} />
      <div className="g2 field">
        <TF id="ma_u" label="Username" value={user} onChange={setUser} placeholder="Made from the name" autoComplete="off" inputProps={{ autoCapitalize: 'none', spellCheck: 'false' }} />
        {o ? <div /> : <TF id="ma_pw" label="Password" value={pw} onChange={setPw} autoComplete="off" inputProps={{ spellCheck: 'false' }} />}
      </div>
      {role === 'teacher' && (
        <>
          <label className="flabel">Classes and subjects</label>
          {pairs.length ? <CheckGroup checked={asg} onChange={setAsg} items={pairs.map((pr) => {
            const t = teacherFor(pr[0], pr[1]), mine = o && t.id === o.id;
            return { value: pr[0] + '|' + pr[1], label: cls(pr[0]).name + ', ' + subName(pr[1]), small: t.id && !mine ? '(now ' + t.name.split(' ')[0] + ')' : '' };
          })} /> : <p className="mut">Add classes first, then come back to assign them.</p>}
        </>
      )}
      {role === 'parent' && (
        <>
          <label className="flabel">Linked students</label>
          {sts.length ? <CheckGroup cols checked={kids} onChange={setKids} items={sts.map((s) => ({ value: s.id, label: s.name, small: cls(s.cid) ? cls(s.cid).name : '' }))} /> : <p className="mut">Add students first, then come back to link them.</p>}
        </>
      )}
    </Modal>
  );
}

export function PwDialog({ role, id, onClose, onCreds }) {
  const o = ROLE_LIST[role]().find((x) => x.id === id);
  const [pw, setPw] = useState(() => genPass()), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  if (!o) return null;
  const save = async () => {
    if (pw.trim().length < 8) return setErr('Password must be at least 8 characters.');
    setBusy(true);
    try { await store.resetPassword(role, o.id, pw.trim()); } catch (e) { setBusy(false); return setErr(e.message || 'Something went wrong.'); }
    onClose(); onCreds({ name: o.name, u: o.user, pw: pw.trim(), title: 'Password changed' });
  };
  return (
    <Modal title={'Reset password for ' + o.name} onClose={onClose} error={err} actions={[{ label: 'Set password', onClick: save, disabled: busy }]}>
      <TF id="rp_pw" label="New password" value={pw} onChange={setPw} autoComplete="off" inputProps={{ spellCheck: 'false' }} />
      <p className="mut" style={{ marginTop: 8 }}>Give them the new password. It works straight away.</p>
    </Modal>
  );
}

export function StudentDialog({ id, onClose }) {
  const s = id ? stu(id) : null;
  const [name, setName] = useState(s ? s.name : ''), [cid, setCid] = useState(s ? s.cid : CLASSES[0].id), [roll, setRoll] = useState(s ? String(s.roll) : '');
  const [photo, setPhoto] = useState(undefined), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => {
    const n = name.trim(), r = +roll;
    if (n.length < 3) return setErr('Enter the student’s name.');
    if (!r || r < 1) return setErr('Enter a roll number.');
    if (DB.students.some((x) => x.cid === cid && x.roll === r && x.id !== id)) return setErr('This roll number is already used in that class.');
    setBusy(true);
    try { await store.saveStudent(id, { name: n, cid, roll: r, photo }); } catch (e) { setBusy(false); return setErr(e.message || 'Something went wrong.'); }
    onClose(); render(); toast(id ? 'Student updated.' : 'Student added to ' + cls(cid).name + '.');
  };
  return (
    <Modal title={s ? 'Edit student' : 'Add student'} onClose={onClose} error={err} actions={[{ label: s ? 'Save changes' : 'Add student', onClick: save, disabled: busy }]}>
      <TF id="ms_n" label="Full name" value={name} onChange={setName} autoComplete="off" />
      <div className="g2 field">
        <Sel id="ms_c" label="Class" value={cid} onChange={setCid} list={CLASSES.map((c) => [c.id, c.name])} />
        <TF id="ms_r" label="Roll number" type="number" value={roll} onChange={setRoll} inputProps={{ min: 1 }} />
      </div>
      <PhotoField person={s} value={photo} onChange={setPhoto} onError={setErr} />
    </Modal>
  );
}

export function ClassDialog({ id, onClose }) {
  const c = id ? cls(id) : null, codes = Object.keys(SUBJ), cur = c ? c.subjects : [];
  const [name, setName] = useState(c ? c.name : ''), [level, setLevel] = useState(c ? c.level : 'school'), [room, setRoom] = useState(c ? c.room : ''), [ct, setCt] = useState(c ? c.ct : '');
  const [subs, setSubs] = useState(() => [0, 1, 2, 3, 4].map((i) => cur[i] || codes[i]));
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => {
    const n = name.trim();
    if (n.length < 2) return setErr('Enter the class name.');
    if (new Set(subs).size < 5) return setErr('Choose 5 different subjects.');
    let cid = id;
    if (!cid) { const base = slug(n, '_', 16) || 'class'; cid = base; let i = 2; while (cls(cid)) cid = base + (i++); }
    setBusy(true);
    try { await store.saveClass(id, { id: cid, name: n, level, room: room.trim(), ct, subjects: subs }); } catch (e) { setBusy(false); return setErr(e.message || 'Something went wrong.'); }
    onClose(); render(); toast(id ? 'Class updated.' : 'Class added.');
  };
  return (
    <Modal title={c ? 'Edit class' : 'Add class'} onClose={onClose} error={err} actions={[{ label: c ? 'Save changes' : 'Add class', onClick: save, disabled: busy }]}>
      <TF id="mc_n" label="Class name" value={name} onChange={setName} placeholder="For example, Class 9-A" autoComplete="off" />
      <div className="g2 field">
        <Sel id="mc_l" label="Level" value={level} onChange={setLevel} list={[['school', 'School'], ['college', 'College']]} />
        <TF id="mc_r" label="Room" value={room} onChange={setRoom} autoComplete="off" />
      </div>
      <div className="field"><Sel id="mc_t" label="Class teacher" value={ct} onChange={setCt} list={[['', 'Not set']].concat(DB.teachers.filter((t) => t.active).map((t) => [t.id, t.name]))} /></div>
      <label className="flabel" style={{ marginTop: 12 }}>The 5 subjects, one for each daily lecture</label>
      <div className="g2">
        {subs.map((v, i) => <Sel key={i} id={'mc_s' + i} label={'Lecture ' + (i + 1)} value={v} onChange={(x) => setSubs(subs.map((y, j) => (j === i ? x : y)))} list={codes.map((k) => [k, SUBJ[k]])} />)}
      </div>
    </Modal>
  );
}

export function SubjectDialog({ code, onClose }) {
  const [name, setName] = useState(code ? SUBJ[code] : ''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => {
    const n = name.trim();
    if (n.length < 2) return setErr('Enter the subject name.');
    let c = code;
    if (!c) { const base = slug(n, '_', 16) || 'subject'; c = base; let i = 2; while (SUBJ[c]) c = base + (i++); }
    setBusy(true);
    try { await store.saveSubject(c, n, !code); } catch (e) { setBusy(false); return setErr(e.message || 'Something went wrong.'); }
    onClose(); render(); toast(code ? 'Subject renamed.' : 'Subject added.');
  };
  return (
    <Modal title={code ? 'Rename subject' : 'Add subject'} onClose={onClose} error={err} actions={[{ label: code ? 'Save' : 'Add subject', onClick: save, disabled: busy }]}>
      <TF id="sj_n" label="Subject name" value={name} onChange={setName} placeholder="For example, Pak Studies" autoComplete="off" />
    </Modal>
  );
}

export function DsDialog({ onClose }) {
  const first = CLASSES[0], start = cls(S.f.dsf) ? S.f.dsf : first.id;
  const [cid, setCid] = useState(start), [exam, setExam] = useState('Monthly Test'), [sb, setSb] = useState(cls(start).subjects[0]);
  const [date, setDate] = useState(addDays(TODAY, 7)), [time, setTime] = useState('9:00 am'), [room, setRoom] = useState(cls(start).room || ''), [err, setErr] = useState('');
  const c = cls(cid);
  const pick = (v) => { setCid(v); const k = cls(v); if (k) { setSb(k.subjects[0]); setRoom(k.room || ''); } };
  const save = () => {
    if (!cls(cid) || !sb) return setErr('Choose a class and subject.');
    if (exam.trim().length < 2) return setErr('Write the exam name.');
    if (!date) return setErr('Choose the date of the paper.');
    const dt = new Date(date + 'T00:00:00'); if (dt.getDay() === 0 || dt.getDay() === 6) return setErr('The paper date must be a weekday.');
    if (!time.trim()) return setErr('Enter the time.');
    DB.datesheet.push({ id: 'd' + uid(), cid, exam: exam.trim(), sub: sb, date, time: time.trim(), room: room.trim(), by: S.user.id });
    ev({ role: 'parent', cids: [cid] }, 'Date sheet updated', subName(sb) + ' paper on ' + fd(date) + ', ' + time.trim() + '.', 'event');
    onClose(); render(); toast('Paper added to the date sheet.');
  };
  return (
    <Modal title="Add exam paper" onClose={onClose} error={err} actions={[{ label: 'Add paper', onClick: save }]}>
      <Sel id="dsa_c" label="Class" value={cid} onChange={pick} list={CLASSES.map((x) => [x.id, x.name])} />
      <div className="field"><TF id="dsa_e" label="Exam" value={exam} onChange={setExam} placeholder="For example, First Term" /></div>
      <div className="field"><Sel id="dsa_s" label="Subject" value={sb} onChange={setSb} list={c.subjects.map((k) => [k, subName(k)])} /></div>
      <div className="g2 field"><DateF id="dsa_d" label="Date" value={date} onChange={setDate} min={TODAY} /><TF id="dsa_t" label="Time" value={time} onChange={setTime} /></div>
      <div className="field"><TF id="dsa_r" label="Room" value={room} onChange={setRoom} /></div>
    </Modal>
  );
}

export function EvDialog({ onClose }) {
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [type, setType] = useState('holiday'), [date, setDate] = useState(''), [to, setTo] = useState('both'), [err, setErr] = useState('');
  const save = () => {
    if (title.trim().length < 3) return setErr('Write a title.');
    if (body.trim().length < 5) return setErr('Write the details.');
    const grp = 'g' + uid(), roles = to === 'both' ? ['parent', 'teacher'] : [to], text = (date ? fd(date) + '. ' : '') + body.trim();
    roles.forEach((r) => DB.events.unshift({ id: 'ev' + uid(), ts: TODAY + 'T' + new Date().toTimeString().slice(0, 5), title: title.trim(), text, type, to: { role: r }, adm: 1, grp, date: date || '' }));
    onClose(); render(); toast('Posted to ' + roles.map((r) => (r === 'parent' ? 'parents' : 'teachers')).join(' and ') + '.');
  };
  return (
    <Modal title="New event or holiday" onClose={onClose} error={err} actions={[{ label: 'Post', onClick: save }]}>
      <TF id="ev_t" label="Title" value={title} onChange={setTitle} placeholder="For example, Winter holiday" />
      <div className="field"><TF id="ev_b" label="Details" value={body} onChange={setBody} multiline minRows={3} placeholder="What should parents and teachers know?" /></div>
      <div className="g2 field">
        <Sel id="ev_type" label="Type" value={type} onChange={setType} list={[['holiday', 'Holiday'], ['event', 'Event'], ['ptm', 'PTM'], ['urgent', 'Urgent']]} />
        <DateF id="ev_d" label="Date (optional)" value={date} onChange={setDate} min={TODAY} />
      </div>
      <div className="field"><Sel id="ev_a" label="Send to" value={to} onChange={setTo} list={[['both', 'Parents and teachers'], ['parent', 'Parents only'], ['teacher', 'Teachers only']]} /></div>
    </Modal>
  );
}
