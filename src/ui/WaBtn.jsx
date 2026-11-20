import { openWA } from '../core/share';
import { Button, IconBtn } from './buttons';

/* WhatsApp action: green icon button (compact) or icon plus short label. */
export function WaBtn({ phone = '', text, label = 'Share on WhatsApp', short, size = 'sm', variant = 'text' }) {
  if (!short) return <IconBtn size={size} icon="wa" label={label} className="wa-btn" onClick={() => openWA(phone, text)} />;
  return <Button size={size} variant={variant} icon="wa" className="wa-btn" onClick={() => openWA(phone, text)}>{short}</Button>;
}
