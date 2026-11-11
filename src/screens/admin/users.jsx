import { Button, TextField } from '@mui/material';
import { CLASSES, DB, S, F, cls, parentsOf, stu, subName } from '../../core/data';
import { render } from '../../core/store';
import { Av, DT, Empty, FSel, Item, Tag, Who } from '../../ui';

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
    <div className="row">
      <Button size="small" variant="outlined" onClick={() => act.acEdit(role, o.id)}>Edit</Button>
      <Button size="small" variant="outlined" onClick={() => act.pwReset(role, o.id)}>Reset password</Button>
      <Button size="small" variant="contained" color={o.active ? 'error' : 'success'} onClick={() => act.acToggle(role, o.id)}>{o.active ? 'Deactivate' : 'Activate'}</Button>
      <Button size="small" variant="contained" color="error" onClick={() => act.acRemove(role, o.id)}>Remove</Button>
    </div>
  );
}

// tab: teachers | principals | parents | students. act is only passed when the viewer can edit (Admin).
export function UsersList({ tab, edit, act }) {
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
    const cols = ['Roll', 'Student', 'Class', 'Parent', 'Status'].concat(edit ? [''] : []);
    list = l.length ? <DT cols={cols} rows={l.map((s) => [s.roll, <Who o={s}>{s.name}</Who>, cls(s.cid) ? cls(s.cid).name : '', parentsOf(s.id).map((p) => p.name).join(', ') || 'None', <Status on={s.active} />]
      .concat(edit ? [<div className="row">
        <Button size="small" variant="outlined" onClick={() => act.sEdit(s.id)}>Edit</Button>
        <Button size="small" variant="contained" color={s.active ? 'error' : 'success'} onClick={() => act.sToggle(s.id)}>{s.active ? 'Deactivate' : 'Activate'}</Button>
        <Button size="small" variant="contained" color="error" onClick={() => act.sRemove(s.id)}>Remove</Button>
      </div>] : []))} /> : <Empty t="No students found" />;
  }
  return <><SearchBar tab={tab} /><div>{list}</div></>;
}
