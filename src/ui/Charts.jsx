export function BarRows({ items }) {
  return (
    <div className="bars">
      {items.map((i, k) => (
        <div className="br" key={k}>
          <span className="bl" title={i.label}>{i.label}</span>
          <div className="bt"><div className={'bf ' + (i.cls || '')} style={{ width: Math.max(0, Math.min(100, i.val || 0)) + '%' }} /></div>
          <span className="bn">{i.note != null ? i.note : (i.val == null ? '-' : Math.round(i.val) + '%')}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ p, label, sub }) {
  const r = 42, c = 2 * Math.PI * r, v = p == null ? 0 : p;
  return (
    <div className="dn">
      <svg viewBox="0 0 100 100" width="112" height="112" role="img" aria-label={label + ': ' + (p == null ? 'not marked yet' : Math.round(p) + ' percent')}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ln)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ok)" strokeWidth="10" strokeLinecap="round" strokeDasharray={(c * v / 100).toFixed(1) + ' ' + c.toFixed(1)} transform="rotate(-90 50 50)" />
        <text x="50" y="56" textAnchor="middle" fontSize={p == null ? 14 : 20} fontWeight="700" fill="var(--ink)">{p == null ? 'None' : Math.round(p) + '%'}</text>
      </svg>
      <div><b>{label}</b><div className="mut">{sub}</div></div>
    </div>
  );
}

export function LineChart({ labels, series, min = 0 }) {
  const W = 560, H = 230, L = 34, B = 30, T = 10, Rt = 14, iw = W - L - Rt, ih = H - T - B, n = labels.length;
  const x = (i) => L + (n === 1 ? iw / 2 : iw * i / (n - 1));
  const y = (v) => T + ih * (1 - (v - min) / (100 - min));
  const grid = [];
  for (let k = 0; k <= 4; k++) {
    const v = min + (100 - min) * k / 4;
    grid.push(
      <g key={'g' + k}>
        <line x1={L} x2={W - Rt} y1={y(v).toFixed(1)} y2={y(v).toFixed(1)} stroke="var(--ln)" />
        <text x={L - 6} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="var(--mut)">{Math.round(v)}</text>
      </g>,
    );
  }
  return (
    <>
      <svg className="lc" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={'Line chart of ' + series.map((s) => s.name).join(', ')}>
        {grid}
        {labels.map((lb, i) => <text key={'l' + i} x={x(i).toFixed(1)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mut)">{lb}</text>)}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(Math.max(min, v))])).filter(Boolean);
          return (
            <g key={si}>
              {pts.length > 1 && <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" points={pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')} />}
              {pts.map((p, i) => <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="4" fill={s.color} />)}
            </g>
          );
        })}
      </svg>
      <div className="lg">{series.map((s, i) => <span key={i}><i style={{ background: s.color }} />{s.name}</span>)}</div>
    </>
  );
}
export const COLORS = ['#2F6FED', '#D9A21B', '#1F8A55', '#C0392B'];
