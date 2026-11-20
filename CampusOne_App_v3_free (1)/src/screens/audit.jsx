import { useEffect, useState } from 'react';
import { LIVE } from '../core/config';
import { sb } from '../core/sync';
import { Card, DT, Empty } from '../ui';

const LABEL = { att: 'Student attendance', tatt: 'Teacher attendance', res: 'Results', pub: 'Result publishing', fees: 'Fees', feeCfg: 'Fee settings', leaves: 'Student leave', tleaves: 'Teacher leave' };
/* Recent changes (F06): who changed marks, attendance and fees. Staff only; the database enforces that. */
export function AuditTab() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (!LIVE) return setRows([]);
    sb.from('audit_log').select('at,actor_name,collection,rid,action').order('at', { ascending: false }).limit(100).then((r) => setRows(r.error ? [] : r.data));
  }, []);
  if (rows == null) return <p className="mut">Loading...</p>;
  if (!rows.length) return <Empty t={LIVE ? 'No changes logged yet. Run update_v3_free_features.sql if this stays empty.' : 'Change history appears on the live site.'} />;
  return (
    <Card>
      <DT minWidth={420} cols={['When', 'Who', 'What', 'Record']} rows={rows.map((x) => [String(x.at).slice(0, 16).replace('T', ' '), x.actor_name, (LABEL[x.collection] || x.collection) + ' ' + x.action, x.rid])} />
    </Card>
  );
}
