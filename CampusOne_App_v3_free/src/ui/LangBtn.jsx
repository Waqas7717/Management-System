import { useEffect, useState } from 'react';
import { getLang, setLang } from '../core/lang';

export function LangBtn({ className = 'langbtn', sheet }) {
  const [l, setL] = useState(getLang());
  useEffect(() => { const f = () => setL(getLang()); window.addEventListener('fgc-lang', f); return () => window.removeEventListener('fgc-lang', f); }, []);
  const ur = l === 'ur';
  return <button type="button" data-nolang="1" className={sheet ? 'sheetbtn' : className} onClick={() => setLang(ur ? 'en' : 'ur')} aria-label={ur ? 'Switch to English' : 'اردو میں دیکھیں'}>{sheet ? <span>{ur ? 'English' : 'اردو'}</span> : (ur ? 'English' : 'اردو')}</button>;
}
