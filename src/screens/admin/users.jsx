import { useState } from 'react';
import { TextField } from '@mui/material';
import { PrintDialog } from '../printables';
import { CLASSES, DB, S, F, cls, parentsOf, stu, subName } from '../../core/data';
import { render } from '../../core/store';
import { Av, DT, Empty, FSel, Item, Tag, Who } from '../../ui';
import { Button, RowActions } from '../../ui/buttons';

function SearchBar({ tab }) {
  return (
    <div className="g2" style={{ margin: '14px 0' }}>
      <TextField id="uq" type="search" label="Search" value={F('uq', '')} placeholder="Type a name" onChange={(e) => { S.f.uq = e.target.value; render(); }} />
      {tab === 'students' && <FSel k="ucls" def="all" list={[['all', 'All classes'], ...CLASSES.map((c) => [c.id, c.name])]} label="Class" />}
    </div>
  );
}
const Status = ({ on }) => (on ? <Tag c="ok">Active</Tag> : <Tag>Inactive</Tag>);

function Acts({ role, o, act }) {
  return (
    <RowActions onEdit={() => act.acEdit(role, o.id)} onDelete={() => act.acRemove(role, o.id)} deleteLabel="Remove"
      more={[{ label: 'Reset password', icon: 'key-round', onClick: () => act.pwReset(role, o.id) },
        { label: o.active ? 'Deactivate' : 'Activate', icon: o.active ? 'user-x' : 'user-check', onClick: () => act.acToggle(role, o.id) }]} />
  );
}

// tab: teachers | principals | parents | students. act is only passed when the viewer can edit (Admin).
export function UsersList({ tab, edit, act }) {
  const [pr, setPr] = useState(null);
  const q = (F('uq', '') || '').toLowerCase();
  let list;
  if (tab === 'teachers') {
    const l = DB.teachers.filter((t) => !q || t.name.toLowerCase().indexOf(q) > -1);
    list = l.length ? l.map((t) => (
      <Item key={t.id}>
        <div className="row sp"><h4 className="who"><Av o={t} />{t.name}</h4><Status on={t.active} /></div>
        <div className="meta"><span>{t.phone}</span><span>User {t.user}</span></div>
        <div className="meta">{t.assign.length ? t.assign.map((a, i) => <Tag key={i} c="info">{cls(a[0]).name + ' ' + subName(a[1])}</Tag>) : 'No classes assigned'}</div>
        {edit && <Acts role="teacher" o={t} act={act} />}
      </Item>
    )) : <Empty t="No teachers found" />;
  } else if (tab === 'principals') {
    const l = DB.principals.filter((t) => !q || t.name.toLowerCase().indexOf(q) > -1);
    list = l.length ? l.map((t) => (
      <Item key={t.id}>
        <div className="row sp"><h4 className="who"><Av o={t} />{t.name}</h4><Status on={t.active} /></div>
        <div className="meta"><span>{t.phone}</span><span>User {t.user}</span></div>
        {edit && <Acts role="principal" o={t} act={act} />}
      </Item>
    )) : <Empty t="No principals found" />;
  } else if (tab === 'parents') {
    const l = DB.parents.filter((p) => !q || p.name.toLowerCase().indexOf(q) > -1 || p.kids.some((k) => stu(k) && stu(k).name.toLowerCase().indexOf(q) > -1));
    list = l.length ? l.map((p) => (
      <Item key={p.id}>
        <div className="row sp"><h4 className="who"><Av o={p} /><span>{p.name} <small>{p.rel}</small></span></h4><Status on={p.active} /></div>
        <div className="meta"><span>{p.phone}</span><span>User {p.user}</span></div>
        <div className="meta">{p.kids.filter((k) => stu(k)).map((k) => <Tag key={k} c="info">{stu(k).name + ' (' + cls(stu(k).cid).name + ')'}</Tag>)}{p.kids.filter((k) => stu(k)).length ? null : 'No student linked'}</div>
        {edit && <Acts role="parent" o={p} act={act} />}
      </Item>
    )) : <Empty t="No parents found" />;
  } else {
    const cf = F('ucls', 'all'), l = DB.students.filter((s) => (cf === 'all' || s.cid === cf) && (!q || s.name.toLowerCase().indexOf(q) > -1));
    const cols = ['Roll', 'Student', 'Class', 'Parent', 'Status', ''];
    list = l.length ? <DT cols={cols} rows={l.map((s) => [s.roll, <Who o={s}>{s.name}</Who>, cls(s.cid) ? cls(s.cid).name : '', parentsOf(s.id).map((p) => p.name).join(', ') || 'None', <Status on={s.active} />]
      .concat([<RowActions onEdit={edit ? () => act.sEdit(s.id) : undefined} onDelete={edit ? () => act.sRemove(s.id) : undefined} deleteLabel="Remove"
        more={[{ label: 'Print', icon: 'printer', onClick: () => setPr(s.id) },
          edit ? { label: s.active ? 'Deactivate' : 'Activate', icon: s.active ? 'user-x' : 'user-check', onClick: () => act.sToggle(s.id) } : null]} />]))} /> : <Empty t="No students found" />;
  }
  return <><SearchBar tab={tab} /><div>{list}</div>{pr && <PrintDialog sid={pr} onClose={() => setPr(null)} />}</>;
}
