import { useState } from 'react';
import { Button } from '@mui/material';
import { Ico } from './Ico';
import { LIVE } from '../core/config';
import { enablePush, isIOS, isStandalone, pushOn, pushSupported } from '../core/push';
import { toast } from '../core/store';

// Parents: one tap to get phone alerts for absences and new notices.
export function PushPrompt() {
  const [on, setOn] = useState(pushOn()), [busy, setBusy] = useState(false);
  if (!LIVE || on || (typeof Notification !== 'undefined' && Notification.permission === 'denied')) return null;
  const iosNeedsInstall = isIOS() && !isStandalone();
  if (!pushSupported() && !iosNeedsInstall) return null;
  const go = async () => { setBusy(true); const m = await enablePush(); setBusy(false); if (m) toast(m); else { setOn(true); toast('Alerts are on for this phone.'); } };
  return (
    <div className="pushbar">
      <span className="pb-ic"><Ico n="bell" s={20} /></span>
      <span className="pb-t"><b>Get alerts on this phone</b><small>{iosNeedsInstall ? 'On iPhone: tap Share, then Add to Home Screen, and open the app from there.' : 'We tell you when your child is marked absent or a new notice is posted.'}</small></span>
      {!iosNeedsInstall && <Button size="small" variant="contained" disabled={busy} onClick={go}>{busy ? '...' : 'Turn on'}</Button>}
    </div>
  );
}
