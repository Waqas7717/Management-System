import { createTheme } from '@mui/material/styles';

// Tokens come from the Figma file (navy #0B1F4D, blue #2447AE, gold #F7B500, Nunito Sans).
const tokens = {
  light: { pri: '#0B2160', ink: '#16213A', mut: '#5D6B85', ln: '#DCE3EF', chrome: '#FFFFFF', chromeln: '#DCE4F5', sf: '#FFFFFF', sf2: '#F4F7FC', ok: '#1F8A55', bad: '#C0392B', info: '#2447AE', secln: '#B9C6E6', bg: '#EEF2F8' },
  dark: { pri: '#7FA3F5', ink: '#E6ECF8', mut: '#93A2BE', ln: '#25334F', chrome: '#131E35', chromeln: '#25334F', sf: '#131E35', sf2: '#18253F', ok: '#4CC58A', bad: '#F07A6D', info: '#7FA3F5', secln: '#9DBBFF', bg: '#0B1322' },
};

export function makeTheme(mode) {
  const t = tokens[mode];
  const font = '"Nunito Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  return createTheme({
    palette: {
      mode,
      primary: { main: t.pri, contrastText: mode === 'dark' ? '#0B1322' : '#FFFFFF' },
      secondary: { main: mode === 'dark' ? '#F0BC45' : '#F7B500', contrastText: '#1b1400' },
      success: { main: t.ok, contrastText: mode === 'dark' ? '#0B1322' : '#FFFFFF' },
      error: { main: t.bad, contrastText: mode === 'dark' ? '#0B1322' : '#FFFFFF' },
      info: { main: t.info },
      background: { default: t.bg, paper: t.sf },
      text: { primary: t.ink, secondary: t.mut },
      divider: t.ln,
    },
    shape: { borderRadius: 14 },
    typography: { fontFamily: font, fontSize: 15, button: { textTransform: 'none', fontWeight: 700 } },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'transparent' } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 14, minHeight: 44, padding: '10px 18px', fontWeight: 700, fontSize: 15, gap: 8 },
          sizeSmall: { minHeight: 36, padding: '5px 12px', fontSize: 13.5, borderRadius: 12 },
          containedPrimary: { boxShadow: '0 6px 16px rgba(11,33,96,.22)' },
          containedSecondary: { background: 'linear-gradient(180deg,#FFC93C,#F7B500)', boxShadow: '0 4px 12px rgba(247,181,0,.4)' },
          outlined: { borderWidth: 1.5, borderRadius: 20, borderColor: t.secln, background: mode === 'dark' ? 'transparent' : 'rgba(255,255,255,.6)', '&:hover': { borderWidth: 1.5 } },
        },
      },
      MuiIconButton: { styleOverrides: { root: { color: 'inherit' } } },
      MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true, InputLabelProps: { shrink: true } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 14, background: t.chrome, '& fieldset': { borderColor: t.chromeln, borderWidth: 1.5 } },
          input: { padding: '12px 14px', fontSize: 15 },
          multiline: { padding: 0 },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 700, fontSize: 15 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 14, fontWeight: 700, fontSize: 12.5, height: 26 }, label: { paddingLeft: 10, paddingRight: 10 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 24, backgroundImage: 'none' } } },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800, fontSize: 18, paddingBottom: 8 } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '8px 24px 20px', gap: 4, flexWrap: 'wrap' } } },
      MuiPopover: { styleOverrides: { paper: { borderRadius: 24 } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiTableContainer: { styleOverrides: { root: { borderRadius: 18, border: '1px solid ' + (mode === 'dark' ? t.ln : '#fff'), background: mode === 'dark' ? t.sf : 'rgba(255,255,255,.94)', boxShadow: mode === 'dark' ? 'none' : '0 10px 32px rgba(30,60,140,.10)' } } },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: '9px 12px', borderBottom: '1px solid ' + t.ln, whiteSpace: 'nowrap', fontSize: 14 },
          head: { background: t.chrome, color: t.ink, fontWeight: 700, fontSize: 13, borderBottom: '2px solid ' + t.chromeln },
        },
      },
      MuiToggleButtonGroup: { styleOverrides: { root: { background: t.chrome, boxShadow: 'inset 0 0 0 1.5px ' + t.chromeln, borderRadius: 24, padding: 3, gap: 3, flexWrap: 'wrap' }, grouped: { border: 0, '&:not(:first-of-type)': { borderRadius: 20, marginLeft: 0, borderLeft: 0 }, '&:first-of-type': { borderRadius: 20 } } } },
      MuiToggleButton: {
        styleOverrides: {
          root: { borderRadius: 20, textTransform: 'none', fontWeight: 700, fontSize: 14, color: t.mut, padding: '6px 14px', minHeight: 38, border: 0, '&.Mui-selected': { background: t.pri, color: mode === 'dark' ? '#0B1322' : '#fff', '&:hover': { background: t.pri } } },
        },
      },
      MuiCheckbox: { defaultProps: { color: 'primary' } },
      MuiRadio: { defaultProps: { color: 'primary' } },
      MuiSnackbarContent: { styleOverrides: { root: { borderRadius: 12, fontWeight: 700, background: t.ink, color: t.bg } } },
    },
  });
}
