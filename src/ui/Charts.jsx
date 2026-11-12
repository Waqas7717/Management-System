import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart as XLine } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

export const COLORS = ['#2F6FED', '#D9A21B', '#1F8A55', '#C0392B'];
const GOLD = '#F7B500';
const pct = (v) => (v == null ? '-' : Math.round(v * 10) / 10 + '%');
const short = (s, n = 13) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

/* axis, grid and tooltip text follow the app theme (light and dark) */
const axisSx = (th) => ({
  fontFamily: 'inherit',
  '& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-series text': { fill: th.palette.text.secondary + ' !important', fontFamily: 'inherit', fontSize: 12 },
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: th.palette.divider },
  '& .MuiChartsGrid-line': { stroke: th.palette.divider, strokeDasharray: '3 4' },
  '& .MuiBarLabel-root': { fill: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' },
});

/* horizontal bars, one per item. cls g / y / r picks green, gold or red. */
export function BarRows({ items }) {
  const th = useTheme();
  if (!items.length || items.every((i) => i.val == null)) return <p className="mut" style={{ margin: '6px 0' }}>Nothing marked yet.</p>;
  const col = { g: th.palette.success.main, y: GOLD, r: th.palette.error.main };
  const labels = items.map((i, k) => i.label + (items.findIndex((x) => x.label === i.label) < k ? ' ' + (k + 1) : ''));
  const colors = items.map((i) => col[i.cls] || COLORS[0]);
  return (
    <BarChart
      layout="horizontal"
      height={Math.max(130, items.length * 40 + 36)}
      margin={{ left: 96, right: 16, top: 6, bottom: 32 }}
      yAxis={[{ scaleType: 'band', data: labels, valueFormatter: (v) => short(v), colorMap: { type: 'ordinal', values: labels, colors }, categoryGapRatio: 0.35 }]}
      xAxis={[{ min: 0, max: 100, tickNumber: 5, valueFormatter: (v) => v + '%' }]}
      series={[{ data: items.map((i) => i.val || 0), valueFormatter: (v, ctx) => (items[ctx.dataIndex] && items[ctx.dataIndex].val == null ? 'Not marked' : pct(v)) }]}
      barLabel={(it) => (it.value >= 12 ? Math.round(it.value) + '%' : null)}
      grid={{ vertical: true }}
      slotProps={{ legend: { hidden: true } }}
      sx={axisSx(th)}
    />
  );
}

/* ring. pass parts to show a Present / Absent / Leave split on hover. */
export function Donut({ p, label, sub, parts }) {
  const th = useTheme();
  const hasParts = parts && parts.reduce((a, x) => a + x.value, 0) > 0;
  let data;
  if (hasParts) data = parts.map((x, i) => ({ id: i, label: x.label, value: x.value, color: x.color }));
  else if (p == null) data = [{ id: 0, label: 'Not marked yet', value: 1, color: th.palette.divider }];
  else data = [{ id: 0, label: 'Present', value: p, color: th.palette.success.main }, { id: 1, label: 'Absent or leave', value: Math.max(0, 100 - p), color: th.palette.divider }];
  return (
    <div className="dn">
      <div className="dn-ring" role="img" aria-label={label + ': ' + (p == null ? 'not marked yet' : Math.round(p) + ' percent')}>
        <PieChart
          width={116}
          height={116}
          margin={{ top: 2, bottom: 2, left: 2, right: 2 }}
          series={[{ data, innerRadius: 38, outerRadius: 56, paddingAngle: 2, cornerRadius: 4, highlightScope: { fade: 'global', highlight: 'item' }, faded: { additionalRadius: -3, color: th.palette.divider } }]}
          slotProps={{ legend: { hidden: true } }}
        />
        <span className="dn-c">{p == null ? 'None' : Math.round(p) + '%'}</span>
      </div>
      <div><b>{label}</b><div className="mut">{sub}</div></div>
    </div>
  );
}

/* pie or ring with a legend, for splits such as students per class */
export function Split({ items, centerTop, centerBottom }) {
  const th = useTheme();
  const total = items.reduce((a, x) => a + x.value, 0);
  const data = items.map((x, i) => ({ id: i, label: x.label, value: x.value, color: x.color || COLORS[i % COLORS.length] }));
  return (
    <div className="split">
      <div className="dn-ring big">
        <PieChart
          width={170}
          height={170}
          margin={{ top: 2, bottom: 2, left: 2, right: 2 }}
          series={[{ data, innerRadius: 54, outerRadius: 82, paddingAngle: 2, cornerRadius: 5, highlightScope: { fade: 'global', highlight: 'item' }, faded: { additionalRadius: -4, color: th.palette.divider }, valueFormatter: (v) => v.value + (total ? ' (' + Math.round(v.value / total * 100) + '%)' : '') }]}
          slotProps={{ legend: { hidden: true } }}
        />
        <span className="dn-c"><b>{centerTop}</b><small>{centerBottom}</small></span>
      </div>
      <div className="lg col">{data.map((d) => <span key={d.id}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></span>)}</div>
    </div>
  );
}

export function LineChart({ labels, series, min: minProp }) {
  const th = useTheme();
  const vals = series.flatMap((s) => s.values).filter((v) => v != null);
  const min = minProp != null ? minProp : Math.max(0, Math.floor((Math.min(...vals, 100) - 10) / 10) * 10);
  return (
    <>
      <XLine
        height={240}
        margin={{ left: 46, right: 36, top: 16, bottom: 36 }}
        xAxis={[{ scaleType: 'point', data: labels.map((l) => String(l).replace(/\((\w{3})\w*\)/, '($1)')) }]}
        yAxis={[{ min, max: 100, tickNumber: 5 }]}
        series={series.map((s) => ({ data: s.values.map((v) => (v == null ? null : Math.max(min, v))), label: s.name, color: s.color, curve: 'monotoneX', showMark: true, valueFormatter: pct }))}
        grid={{ horizontal: true }}
        slotProps={{ legend: { hidden: true } }}
        sx={{ ...axisSx(th), '& .MuiLineElement-root': { strokeWidth: 3 }, '& .MuiMarkElement-root': { strokeWidth: 2, fill: th.palette.background.paper } }}
      />
      <div className="lg">{series.map((s, i) => <span key={i}><i style={{ background: s.color }} />{s.name}</span>)}</div>
    </>
  );
}
