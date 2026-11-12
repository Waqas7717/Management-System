import { useState } from 'react';
import { askAI } from '../core/ai';
import { toast } from '../core/store';

/* run an AI action with a busy flag. Shows the error as a toast and returns the text or null. */
export function useAI() {
  const [busy, setBusy] = useState(false);
  const run = async (action, body) => {
    setBusy(true); const r = await askAI(action, body); setBusy(false);
    if (!r.ok) { toast(r.error); return null; }
    return r.text;
  };
  return [busy, run];
}
