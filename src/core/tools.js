// Printing (any page as A4 / PDF) and CSV helpers (CSV opens directly in Excel).
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#10204a;margin:0;padding:22px}
.hd{display:flex;align-items:center;gap:12px;border-bottom:3px solid #1B3A8C;padding-bottom:10px;margin-bottom:16px}
.hd b{font-size:20px;display:block}.hd small{color:#5b6b92}.hd .rt{margin-left:auto;text-align:right}
h2{margin:0 0 8px;font-size:17px}h3{margin:16px 0 6px;font-size:14px}
table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #c9d2ea;padding:6px 9px;text-align:left;font-size:12.5px}
th{background:#eef2ff}.r{text-align:right}.c{text-align:center}
.box{border:1px solid #c9d2ea;border-radius:10px;padding:12px;margin:10px 0}
.kv{display:grid;grid-template-columns:150px 1fr;gap:6px 10px;font-size:13.5px}.kv span{color:#5b6b92}
.stamp{display:inline-block;border:3px solid #17936A;color:#17936A;font-weight:800;font-size:22px;padding:2px 14px;transform:rotate(-7deg);border-radius:8px}
.sig{display:flex;justify-content:space-between;margin-top:48px;font-size:12px}.sig span{border-top:1px solid #10204a;padding-top:4px;min-width:150px;text-align:center}
.id{width:300px;border:2px solid #1B3A8C;border-radius:14px;overflow:hidden;font-size:12.5px}
.id .top{background:#1B3A8C;color:#fff;padding:9px 12px;text-align:center}.id .top b{font-size:14px;display:block}
.id .bd{padding:14px;text-align:center}.id img,.id .ph{width:92px;height:110px;object-fit:cover;border:2px solid #1B3A8C;border-radius:8px;margin:0 auto 8px;display:block}
.id .ph{display:grid;place-items:center;font-size:34px;font-weight:800;color:#1B3A8C;background:#eef2ff}
.id .nm{font-size:16px;font-weight:800}.id .ft{background:#F3C13A;padding:6px;text-align:center;font-weight:700}
.note{color:#5b6b92;font-size:12px;margin-top:10px}.pb{page-break-after:always}
@page{size:A4;margin:12mm}`;

export const letterhead = (right) => `<div class="hd"><div><b>F.G Public School and College</b><small>Sakesar</small></div><div class="rt"><b>${esc(right)}</b></div></div>`;

export function printDoc(title, body, css) {
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  const d = f.contentWindow.document; d.open();
  d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + CSS + (css || '') + '</style></head><body>' + body + '</body></html>');
  d.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { /* ignore */ } setTimeout(() => f.remove(), 60000); }, 350);
}

export function downloadCSV(name, rows) {
  const csv = rows.map((r) => r.map((v) => { const x = v == null ? '' : String(v); return /[",\r\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

export function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  const t = String(text).replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',' || ch === ';') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x.trim() !== '')) rows.push(row); row = []; }
    else cur += ch;
  }
  row.push(cur); if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows.map((r) => r.map((x) => x.trim()));
}
