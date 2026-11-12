import { createTheme } from '@mui/material/styles';

// Tokens come from the Figma file (navy #0B1F4D, blue #2447AE, gold #F7B500, Inter).
const tokens = {
  light: { pri: '#0B2160', ink: '#16213A', mut: '#5D6B85', ln: '#DCE3EF', chrome: '#FFFFFF', chromeln: '#DCE4F5', sf: '#FFFFFF', sf2: '#F4F7FC', ok: '#1F8A55', bad: '#C0392B', info: '#2447AE', secln: '#B9C6E6', bg: '#EEF2F8' },
  dark: { pri: '#7FA3F5', ink: '#E6ECF8', mut: '#93A2BE', ln: '#25334F', chrome: '#131E35', chromeln: '#25334F', sf: '#131E35', sf2: '#18253F', ok: '#4CC58A', bad: '#F07A6D', info: '#7FA3F5', secln: '#9DBBFF', bg: '#0B1322' },
};

export function makeTheme(mode) {
  const t = tokens[mode];
  const font = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
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
    shape: { borderRadius: 10 },
    breakpoints: { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1440 } },
    typography: {
      fontFamily: font, fontSize: 14, fontWeightLight: 400, fontWeightRegular: 400, fontWeightMedium: 500, fontWeightBold: 700,
      h1: { fontSize: '1.75rem', fontWeight: 700 }, h2: { fontSize: '1.375rem', fontWeight: 700 }, h3: { fontSize: '1.125rem', fontWeight: 600 },
      h4: { fontSize: '1rem', fontWeight: 600 }, h5: { fontSize: '1rem', fontWeight: 600 }, h6: { fontSize: '1rem', fontWeight: 600 },
      subtitle1: { fontSize: '1rem', fontWeight: 500 }, subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
      body1: { fontSize: '0.875rem', lineHeight: 1.5 }, body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem' }, overline: { fontSize: '0.75rem', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'transparent' } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, minHeight: 40, padding: '0 16px', fontWeight: 600, fontSize: 14, gap: 8 },
          sizeSmall: { minHeight: 32, padding: '0 12px', fontSize: 13, borderRadius: 10 },
          containedPrimary: { boxShadow: '0 6px 16px rgba(11,33,96,.22)' },
          containedSecondary: { background: 'linear-gradient(180deg,#FFC93C,#F7B500)', boxShadow: '0 4px 12px rgba(247,181,0,.4)' },
          outlined: { borderWidth: 1.5, borderRadius: 10, borderColor: t.secln, background: mode === 'dark' ? 'transparent' : 'rgba(255,255,255,.6)', '&:hover': { borderWidth: 1.5 } },
        },
      },
      MuiIconButton: { styleOverrides: { root: { color: 'inherit' } } },
      MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true, InputLabelProps: { shrink: true } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10, background: t.chrome, minHeight: 40, fontSize: 14, '& fieldset': { borderColor: t.chromeln, borderWidth: 1.5 } },
          input: { padding: '8px 12px', fontSize: 14, height: 24, boxSizing: 'content-box' },
          inputMultiline: { height: 'auto' },
          multiline: { padding: 0 },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 600, fontSize: 14 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 600, fontSize: 12, height: 28 }, label: { paddingLeft: 10, paddingRight: 10 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 12, backgroundImage: 'none' } } },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, fontSize: 18, paddingBottom: 8 } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '8px 24px 20px', gap: 8, flexWrap: 'wrap' } } },
      MuiPopover: { styleOverrides: { paper: { borderRadius: 12 } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiTableContainer: { styleOverrides: { root: { borderRadius: 12, border: '1px solid ' + (mode === 'dark' ? t.ln : '#fff'), background: mode === 'dark' ? t.sf : 'rgba(255,255,255,.94)', boxShadow: mode === 'dark' ? 'none' : '0 10px 32px rgba(30,60,140,.10)' } } },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: '8px 12px', borderBottom: '1px solid ' + t.ln, whiteSpace: 'nowrap', fontSize: 14 },
          head: { background: t.chrome, color: t.ink, fontWeight: 600, fontSize: 13, borderBottom: '2px solid ' + t.chromeln },
        },
      },
      MuiToggleButtonGroup: { styleOverrides: { root: { background: t.chrome, boxShadow: 'inset 0 0 0 1.5px ' + t.chromeln, borderRadius: 12, padding: 4, gap: 4, flexWrap: 'wrap' }, grouped: { border: 0, '&:not(:first-of-type)': { borderRadius: 10, marginLeft: 0, borderLeft: 0 }, '&:first-of-type': { borderRadius: 10 } } } },
      MuiToggleButton: {
        styleOverrides: {
          root: { borderRadius: 10, textTransform: 'none', fontWeight: 600, fontSize: 14, color: t.mut, padding: '6px 16px', minHeight: 40, border: 0, '&.Mui-selected': { background: t.pri, color: mode === 'dark' ? '#0B1322' : '#fff', '&:hover': { background: t.pri } } },
        },
      },
      MuiCheckbox: { defaultProps: { color: 'primary' } },
      MuiRadio: { defaultProps: { color: 'primary' } },
      MuiSnackbarContent: { styleOverrides: { root: { borderRadius: 10, fontWeight: 600, background: t.ink, color: t.bg } } },
    },
  });
}
