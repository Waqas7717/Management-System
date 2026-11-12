import { IC } from '../core/arts';
import { LU } from '../core/lucide';

// Lucide icons (see core/lucide.js) win over the older in-house set so every button uses one style.
export const Ico = ({ n, s = 22 }) => (
  <svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: LU[n] || IC[n] || '' }} />
);
