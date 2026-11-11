import { S } from './data';
import { render } from './store';

export const toTop = () => {
  window.scrollTo(0, 0);
  const v = document.getElementById('view'); if (v) v.scrollTop = 0;
};
export const go = (v) => { S.view = v; S.f.uq = ''; render(); toTop(); };
export const setF = (k, v) => { S.f[k] = v; render(); };
