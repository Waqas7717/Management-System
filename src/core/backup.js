import { LIVE } from './config';
import { sb } from './sync';
import { toast } from './store';

// Admin only: downloads a full copy of the school data as one file (needs /api/backup deployed).
export async function downloadBackup() {
  if (!LIVE) { toast('Backups work on the live site, not in demo mode.'); return; }
  try {
    const ss = await sb.auth.getSession();
    const token = ss.data && ss.data.session ? ss.data.session.access_token : '';
    const r = await fetch('/api/backup?mode=download', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) { const j = await r.json().catch(() => null); throw new Error((j && j.error) || 'Backup failed.'); }
    const blob = await r.blob(), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'school-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Backup downloaded. Keep the file somewhere safe.');
  } catch (e) { toast(e.message || 'Backup failed.'); }
}
