import { useEffect, useRef, useState } from 'react';

/* shows a number counting up once when it appears or changes. Text without a leading number is shown as is. */
export function Num({ v }) {
  const m = typeof v === 'string' || typeof v === 'number' ? /^(\d+(?:\.\d+)?)(.*)$/.exec(String(v)) : null;
  const target = m ? parseFloat(m[1]) : null;
  const [n, setN] = useState(target);
  const last = useRef(null);
  useEffect(() => {
    if (target == null || target === last.current) return undefined;
    last.current = target;
    if (target < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return undefined; }
    const dec = (m[1].split('.')[1] || '').length, t0 = performance.now(); let raf;
    const step = (t) => { const k = Math.min(1, (t - t0) / 800); setN(+(target * (1 - Math.pow(1 - k, 3))).toFixed(dec)); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  if (!m) return v;
  return <>{(n == null ? target : n)}{m[2]}</>;
}
