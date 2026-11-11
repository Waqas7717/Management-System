import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Alert, Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, Snackbar, ThemeProvider } from '@mui/material';
import { makeTheme } from './theme';
import { S } from './core/data';
import { bus, getVersion, subscribe } from './core/store';
import { init } from './core/sync';
import Login from './Login';
import Shell from './Shell';

const initialDark = () => {
  try { const v = localStorage.getItem('fg_theme'); if (v) return v === 'dark'; } catch (e) { /* ignore */ }
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export default function App() {
  useSyncExternalStore(subscribe, getVersion);
  const [dark, setDark] = useState(initialDark);
  const [snack, setSnack] = useState({ open: false, msg: '' });
  const [conf, setConf] = useState(null);
  const theme = useMemo(() => makeTheme(dark ? 'dark' : 'light'), [dark]);

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try { localStorage.setItem('fg_theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ } }, [dark]);
  useEffect(() => {
    bus.toast = (msg) => setSnack({ open: true, msg });
    bus.ask = (message, yes, fn) => setConf({ message, yes, fn });
    init();
    return () => { bus.toast = null; bus.ask = null; };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {S.user ? <Shell dark={dark} toggleDark={() => setDark((d) => !d)} /> : <Login />}
      <Snackbar open={snack.open} autoHideDuration={3200} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" variant="filled" icon={false} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ bgcolor: '#0B1F4D', color: '#fff', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
      <Dialog open={!!conf} onClose={() => setConf(null)} maxWidth="xs" fullWidth>
        <DialogContent><DialogContentText sx={{ color: 'text.primary' }}>{conf && conf.message}</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setConf(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => { const c = conf; setConf(null); if (c && c.fn) c.fn(); }}>{(conf && conf.yes) || 'Yes'}</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
