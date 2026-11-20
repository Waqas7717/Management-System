// WhatsApp sharing: opens WhatsApp with a ready message. No paid API, nothing is sent automatically.
export const waNumber = (p) => {
  let d = String(p || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.indexOf('00') === 0) d = d.slice(2);
  if (d.indexOf('92') === 0 && d.length >= 12) return d;
  if (d.charAt(0) === '0') return '92' + d.slice(1);
  if (d.length === 10) return '92' + d;
  return d;
};
// phone may be empty: WhatsApp then lets the user pick the contact.
export const openWA = (phone, text) => {
  const n = waNumber(phone);
  window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
};
