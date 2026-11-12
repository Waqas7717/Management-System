import { useEffect, useRef, useState } from 'react';
import { Button as MuiButton, CircularProgress, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { Ico } from './Ico';

/* One place for every button in the app.
   Sizes (height / font / icon): xs 28/11/14, sm 32/12/16, md 40/14/18 (default), lg 48/14/20.
   Variants: primary, secondary (tonal), outlined, text, danger, success, ghost (+ accent for the login button).
   Old MUI props still work: variant="contained|outlined|text", color="error|success|secondary", size="small". */
export const BTN_SIZE = { xs: 14, sm: 16, md: 18, lg: 20 };
const SIZES = { xs: 'xs', small: 'sm', sm: 'sm', medium: 'md', md: 'md', large: 'lg', lg: 'lg' };

function resolve(variant, color) {
  if (['primary', 'secondary', 'outlined', 'text', 'danger', 'success', 'ghost', 'accent'].includes(variant) && !color) return variant;
  if (variant === 'contained' || !variant) {
    if (color === 'error') return 'danger';
    if (color === 'success') return 'success';
    if (color === 'secondary') return 'accent';
    return 'primary';
  }
  if (variant === 'outlined') return color === 'error' ? 'outlined-danger' : 'outlined';
  if (variant === 'text') return color === 'error' ? 'text-danger' : 'text';
  return 'primary';
}
const MUI = {
  primary: ['contained', 'primary'], secondary: ['contained', 'primary'], accent: ['contained', 'secondary'],
  danger: ['contained', 'error'], success: ['contained', 'success'],
  outlined: ['outlined', 'primary'], 'outlined-danger': ['outlined', 'error'],
  text: ['text', 'primary'], 'text-danger': ['text', 'error'], ghost: ['text', 'primary'],
};

function useGuard(onClick, lock) {
  const busy = useRef(false), last = useRef(0), alive = useRef(true), [wait, setWait] = useState(false);
  useEffect(() => () => { alive.current = false; }, []);
  const click = (e) => {
    if (!onClick) return undefined;
    if (busy.current) return undefined;
    const now = Date.now();
    if (lock && now - last.current < 500) return undefined;
    last.current = now;
    const r = onClick(e);
    if (r && typeof r.then === 'function') {
      busy.current = true; setWait(true);
      const done = () => { busy.current = false; if (alive.current) setWait(false); };
      r.then(done, done);
    }
    return undefined;
  };
  return [click, wait];
}

export function Button({ variant, color, size = 'md', icon, iconEnd, loading, fullWidth, block, onClick, disabled, className = '', children, startIcon, endIcon, ...rest }) {
  const sz = SIZES[size] || 'md';
  const v = resolve(variant, color);
  const [mv, mc] = MUI[v];
  const [click, wait] = useGuard(onClick, mv === 'contained');
  const busy = !!loading || wait;
  const ic = BTN_SIZE[sz];
  return (
    <MuiButton
      {...rest}
      variant={mv} color={mc} disabled={disabled || busy} onClick={rest.component === 'label' ? onClick : click}
      className={['bs-' + sz, 'bv-' + v, block ? 'bblock' : fullWidth ? 'bfm' : '', busy ? 'is-loading' : '', className].filter(Boolean).join(' ')}
      aria-busy={busy || undefined}
      startIcon={busy ? <CircularProgress size={ic} color="inherit" thickness={5} /> : startIcon || (icon ? <Ico n={icon} s={ic} /> : undefined)}
      endIcon={endIcon || (iconEnd ? <Ico n={iconEnd} s={ic} /> : undefined)}
    >{children}</MuiButton>
  );
}

/* Icon-only button. A label is required: it is the tooltip and the accessible name.
   size "sm" = 32px (table and card actions), "md" = 40px (toolbars). Touch screens get 44px. */
export function IconBtn({ icon, label, size = 'md', variant = 'ghost', tone, onClick, disabled, loading, className = '', wrapClass = '', ...rest }) {
  const [click, wait] = useGuard(onClick, false);
  const busy = !!loading || wait;
  const px = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <Tooltip title={label} describeChild arrow enterDelay={350} enterTouchDelay={600} disableInteractive placement="top">
      <span className={'ibwrap ib-' + size + (wrapClass ? ' ' + wrapClass : '')}>
        <IconButton {...rest} aria-label={label} disabled={disabled || busy} onClick={click}
          className={['ibtn', 'ib-' + size, 'ibv-' + variant, tone ? 'ibt-' + tone : '', busy ? 'is-loading' : '', className].filter(Boolean).join(' ')}>
          {busy ? <CircularProgress size={px} color="inherit" thickness={5} /> : <Ico n={icon} s={px} />}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/* Compact row actions: View, Edit, Delete in that order, then a three-dot menu for anything else.
   more = [{ label, icon, onClick, danger }] */
export function RowActions({ onView, onEdit, onDelete, more = [], viewLabel = 'View', editLabel = 'Edit', deleteLabel = 'Delete' }) {
  const [anchor, setAnchor] = useState(null);
  const items = more.filter(Boolean);
  return (
    <div className="row acts">
      {onView ? <IconBtn size="sm" icon="eye" label={viewLabel} onClick={onView} /> : null}
      {onEdit ? <IconBtn size="sm" icon="pencil" label={editLabel} onClick={onEdit} /> : null}
      {onDelete ? <IconBtn size="sm" icon="trash-2" label={deleteLabel} tone="danger" onClick={onDelete} /> : null}
      {items.length ? (
        <>
          <IconBtn size="sm" icon="more-vertical" label="More actions" onClick={(e) => setAnchor(e.currentTarget)} />
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { className: 'actmenu' } }}>
            {items.map((m, i) => (
              <MenuItem key={i} className={m.danger ? 'danger' : ''} onClick={() => { setAnchor(null); if (m.onClick) m.onClick(); }}>
                {m.icon ? <ListItemIcon><Ico n={m.icon} s={16} /></ListItemIcon> : null}
                <ListItemText primaryTypographyProps={{ fontSize: 14 }}>{m.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
    </div>
  );
}

/* Form action bar: right aligned on desktop, stacked full width on phones. */
export const FormActions = ({ children }) => <div className="form-actions">{children}</div>;
