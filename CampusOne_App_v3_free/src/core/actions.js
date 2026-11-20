import { S } from './data';
import { render } from './store';

export const toTop = () => {
  window.scrollTo(0, 0);
  const v = document.getElementById('view'); if (v) v.scrollTop = 0;
};
const stack = () => (S.nav || (S.nav = []));
export const go = (v) => {
  if (v !== S.view) { const st = stack(); st.push(S.view); if (st.length > 40) st.shift(); try { window.history.pushState({ fg: 1 }, ''); } catch (e) { /* ignore */ } }
  S.view = v; S.f.uq = ''; render(); toTop();
};
export const canBack = () => stack().length > 0;
export const goBack = () => {
  if (!stack().length) return;
  try { window.history.back(); } catch (e) { S.view = stack().pop(); render(); toTop(); }
};
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (!S.user || !stack().length) return;
    S.view = stack().pop(); S.f.uq = ''; render(); toTop();
  });
}
export const setF = (k, v) => { S.f[k] = v; render(); };
