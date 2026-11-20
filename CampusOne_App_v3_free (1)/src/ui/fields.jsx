import { useId, useState } from 'react';
import { Autocomplete, Checkbox, CircularProgress, FormControlLabel, InputAdornment, Radio, RadioGroup, Switch, TextField } from '@mui/material';
import { Ico } from './Ico';
import { IconBtn } from './buttons';

/* Global form-control system.
   Every control is a label ABOVE a 1px bordered box. Sizes: sm 32, md 40 (default), lg 48. Mobile min height 44 (lg 48).
   Props shared by all: label, required, helper, error (string or true), success, disabled, size, loading, id. */

const SIZES = { sm: 'sm', small: 'sm', md: 'md', medium: 'md', lg: 'lg', large: 'lg' };
export const fsize = (s) => SIZES[s] || 'md';

/* Label above, helper / error / success text below. */
export function Field({ id, label, required, helper, error, success, size, disabled, loading, className, children, inline }) {
  const msgId = id + '-msg';
  const text = typeof error === 'string' && error ? error : success && typeof success === 'string' ? success : helper;
  const cls = 'fld fs-' + fsize(size) + (error ? ' is-err' : '') + (success && !error ? ' is-ok' : '') + (disabled ? ' is-dis' : '') + (loading ? ' is-load' : '') + (inline ? ' fld-inline' : '') + (className ? ' ' + className : '');
  return (
    <div className={cls}>
      {label ? <label className="flabel" htmlFor={id}>{label}{required ? <span className="req" aria-hidden="true"> *</span> : null}</label> : null}
      {children(msgId)}
      {text ? <div id={msgId} className={'fhelp' + (error ? ' bad' : success ? ' ok' : '')} role={error ? 'alert' : undefined}>{text}</div> : null}
    </div>
  );
}

const endIcon = (loading, success, error) => (loading
  ? <CircularProgress size={16} thickness={5} aria-label="Loading" />
  : error ? <Ico n="warn" s={16} />
    : success ? <Ico n="check" s={16} /> : null);

/* Text, email, password, number, textarea. Replaces raw MUI TextField everywhere. */
export function TF({ label, value, onChange, required, helper, error, success, size, loading, id, type = 'text', disabled, className, inputProps, InputProps, multiline, noToggle, ...p }) {
  const auto = useId();
  const fid = id || 'f' + auto.replace(/:/g, '');
  const [show, setShow] = useState(false);
  const isPw = type === 'password' && !noToggle;
  const tail = endIcon(loading, success && !error, error);
  const end = isPw ? (
    <InputAdornment position="end"><IconBtn size="sm" icon={show ? 'eyeoff' : 'eye'} label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} /></InputAdornment>
  ) : tail ? <InputAdornment position="end"><span className={'fend ' + (error ? 'bad' : success ? 'ok' : '')}>{tail}</span></InputAdornment> : undefined;
  const num = type === 'number';
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} loading={loading} className={className}>
      {(msgId) => (
        <TextField id={fid} type={isPw && show ? 'text' : type} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} disabled={disabled} multiline={multiline}
          error={!!error} aria-busy={loading || undefined}
          inputProps={{ 'aria-required': required || undefined, 'aria-invalid': error ? true : undefined, 'aria-describedby': (helper || error || success) ? msgId : undefined, inputMode: num ? 'decimal' : undefined, ...inputProps }}
          InputProps={{ endAdornment: end, ...InputProps }} {...p} />
      )}
    </Field>
  );
}

/* Search box: icon on the left, clear button on the right. */
export function SearchF({ label, value, onChange, placeholder = 'Search', size, id, className, ...p }) {
  const auto = useId();
  const fid = id || 'q' + auto.replace(/:/g, '');
  return (
    <Field id={fid} label={label} size={size} className={className}>
      {() => (
        <TextField id={fid} type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          inputProps={{ 'aria-label': label || placeholder, autoComplete: 'off' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Ico n="search" s={16} /></InputAdornment>,
            endAdornment: value ? <InputAdornment position="end"><IconBtn size="sm" icon="x" label="Clear search" onClick={() => onChange('')} /></InputAdornment> : undefined,
          }} {...p} />
      )}
    </Field>
  );
}

/* Native dropdown (opens inside the viewport on every device). list = [[value, label], ...] */
export function Sel({ label, value, onChange, list, required, helper, error, success, size, id, disabled, loading, className, inputProps, ...p }) {
  const auto = useId();
  const fid = id || 's' + auto.replace(/:/g, '');
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} loading={loading} className={className}>
      {(msgId) => (
        <TextField select id={fid} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} error={!!error}
          SelectProps={{ native: true, inputProps: { 'aria-required': required || undefined, 'aria-invalid': error ? true : undefined, 'aria-describedby': (helper || error || success) ? msgId : undefined, ...inputProps } }} {...p}>
          {list.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </TextField>
      )}
    </Field>
  );
}

export function DateF({ label, value, onChange, min, max, required, helper, error, success, size, id, disabled, className, inputProps, ...p }) {
  const auto = useId();
  const fid = id || 'd' + auto.replace(/:/g, '');
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} className={className}>
      {(msgId) => (
        <TextField id={fid} type="date" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} error={!!error}
          inputProps={{ min, max, 'aria-required': required || undefined, 'aria-invalid': error ? true : undefined, 'aria-describedby': (helper || error) ? msgId : undefined, ...inputProps }} {...p} />
      )}
    </Field>
  );
}

export function TimeF({ label, value, onChange, min, max, step, required, helper, error, success, size, id, disabled, className, inputProps, ...p }) {
  const auto = useId();
  const fid = id || 't' + auto.replace(/:/g, '');
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} className={className}>
      {(msgId) => (
        <TextField id={fid} type="time" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} error={!!error}
          inputProps={{ min, max, step, 'aria-required': required || undefined, 'aria-invalid': error ? true : undefined, 'aria-describedby': (helper || error) ? msgId : undefined, ...inputProps }} {...p} />
      )}
    </Field>
  );
}

/* Searchable dropdown. options = [[value, label], ...]; value is the selected value ('' for none). */
export function Combo({ label, value, onChange, options, required, helper, error, success, size, id, disabled, loading, placeholder = 'Type to search', className }) {
  const auto = useId();
  const fid = id || 'c' + auto.replace(/:/g, '');
  const opts = options.map(([v, l]) => ({ v: String(v), l }));
  const cur = opts.find((o) => o.v === String(value)) || null;
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} loading={loading} className={className}>
      {(msgId) => (
        <Autocomplete id={fid} options={opts} value={cur} disabled={disabled} loading={loading} autoHighlight openOnFocus
          getOptionLabel={(o) => o.l} isOptionEqualToValue={(a, b) => a.v === b.v} onChange={(e, o) => onChange(o ? o.v : '')}
          slotProps={{ paper: { className: 'fld-menu' }, popper: { disablePortal: false } }}
          renderInput={(params) => <TextField {...params} placeholder={placeholder} error={!!error} inputProps={{ ...params.inputProps, 'aria-required': required || undefined, 'aria-describedby': (helper || error) ? msgId : undefined }} />} />
      )}
    </Field>
  );
}

/* Multi-select with chips. value = array of values. */
export function MultiSelect({ label, value, onChange, options, required, helper, error, success, size, id, disabled, placeholder = 'Select', className }) {
  const auto = useId();
  const fid = id || 'm' + auto.replace(/:/g, '');
  const opts = options.map(([v, l]) => ({ v: String(v), l }));
  const cur = opts.filter((o) => value.map(String).includes(o.v));
  return (
    <Field id={fid} label={label} required={required} helper={helper} error={error} success={success} size={size} disabled={disabled} className={className}>
      {(msgId) => (
        <Autocomplete multiple disableCloseOnSelect id={fid} options={opts} value={cur} disabled={disabled} limitTags={3}
          getOptionLabel={(o) => o.l} isOptionEqualToValue={(a, b) => a.v === b.v} onChange={(e, o) => onChange(o.map((x) => x.v))}
          slotProps={{ paper: { className: 'fld-menu' } }}
          renderInput={(params) => <TextField {...params} placeholder={cur.length ? '' : placeholder} error={!!error} inputProps={{ ...params.inputProps, 'aria-describedby': (helper || error) ? msgId : undefined }} />} />
      )}
    </Field>
  );
}

/* Single checkbox, switch and radio group. */
export function CheckField({ label, checked, onChange, helper, disabled, id }) {
  const auto = useId();
  const fid = id || 'k' + auto.replace(/:/g, '');
  return (
    <div className="fld fld-opt">
      <FormControlLabel className="fopt" disabled={disabled} label={label} control={<Checkbox id={fid} checked={!!checked} onChange={(e) => onChange(e.target.checked)} />} />
      {helper ? <div className="fhelp">{helper}</div> : null}
    </div>
  );
}
export function SwitchField({ label, checked, onChange, helper, disabled, id }) {
  const auto = useId();
  const fid = id || 'w' + auto.replace(/:/g, '');
  return (
    <div className="fld fld-opt">
      <FormControlLabel className="fopt fsw" disabled={disabled} label={label} control={<Switch id={fid} checked={!!checked} onChange={(e) => onChange(e.target.checked)} />} />
      {helper ? <div className="fhelp">{helper}</div> : null}
    </div>
  );
}
export function RadioField({ label, value, onChange, options, row, name, required, helper, error, disabled }) {
  const auto = useId();
  const nm = name || 'r' + auto.replace(/:/g, '');
  return (
    <div className={'fld' + (error ? ' is-err' : '')} role="group" aria-labelledby={nm + '-l'}>
      {label ? <div className="flabel" id={nm + '-l'}>{label}{required ? <span className="req" aria-hidden="true"> *</span> : null}</div> : null}
      <RadioGroup row={row} name={nm} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <FormControlLabel key={v} className="fopt" value={v} disabled={disabled} control={<Radio />} label={l} />)}
      </RadioGroup>
      {(typeof error === 'string' && error) || helper ? <div className={'fhelp' + (error ? ' bad' : '')}>{typeof error === 'string' && error ? error : helper}</div> : null}
    </div>
  );
}

/* File upload: dashed drop box with a visible label, chosen file name and hint. */
export function FileBox({ label, onChange, accept, id, required, helper, error, disabled }) {
  const auto = useId();
  const fid = id || 'u' + auto.replace(/:/g, '');
  const [name, setName] = useState('');
  return (
    <Field id={fid} label={label} required={required} helper={helper || (accept ? 'Accepted: ' + accept : '')} error={error} disabled={disabled}>
      {(msgId) => (
        <label className={'uploadbox' + (name ? ' has' : '')} htmlFor={fid}>
          <Ico n="upload" s={18} />
          <span className="un">{name || 'Choose a file'}</span>
          <input className="vh" type="file" id={fid} accept={accept} disabled={disabled} aria-describedby={msgId}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; setName(f ? f.name : ''); onChange(f); }} />
        </label>
      )}
    </Field>
  );
}
