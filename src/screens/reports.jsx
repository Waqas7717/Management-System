import { Button } from '@mui/material';
import { CLASSES, DB, EXAMS, F, agg, cls, classAvg, classPass, dayStatus, gradeOf, stuResult, latestExam } from '../core/data';
import { ALLD, TODAY, monthLabel, monthOptions, CM } from '../core/dates';
import { printDoc, letterhead, esc, downloadCSV } from '../core/tools';
import { Card, DT, Empty, FSel, PageHead, Seg, Tag, Who } from '../ui';

const LOW = 75;

function attRows(cf, m) {
  const dates = ALLD.filter((d) => d.slice(0, 7) === m && d <= TODAY);
  const stus = DB.students.filter((s) => s.active && (cf === 'all' || s.cid === cf));
  const rows = stus.map((s) => {
    let P = 0, A = 0, L = 0;
    dates.forEach((d) => { const x = dayStatus(s.id, d); if (x === 'P') P++; else if (x === 'A' || x === 'M') A++; else if (x === 'L') L++; });
    const pct = agg([s.id], dates).pct;
    return { s, P, A, L, pct };
  });
  return { dates, rows };
}
function resRows(cf, ex) {
  const rows = DB.students.filter((s) => s.active && (cf === 'all' || s.cid === cf)).map((s) => ({ s, r: stuResult(ex, s) })).filter((x) => x.r.n > 0);
  rows.sort((a, b) => b.r.pct - a.r.pct);
  return rows;
}
const pctTxt = (v) => (v == null ? '-' : v.toFixed(1) + '%');
const exName = (ex) => (EXAMS.find((e) => e.id === ex) || { name: ex }).name;

function printAtt(cf, m) {
  const { dates, rows } = attRows(cf, m);
  printDoc('Attendance report', letterhead('Attendance report, ' + monthLabel(m)) + `<p>${cf === 'all' ? 'All classes' : esc(cls(cf).name)}. School days counted: ${dates.length}. Students below ${LOW}% are marked.</p>
  <table><tr><th>Roll</th><th>Student</th><th>Class</th><th class="r">Present</th><th class="r">Absent</th><th class="r">Leave</th><th class="r">Attendance</th></tr>
  ${rows.map((x) => `<tr><td>${esc(x.s.roll)}</td><td>${esc(x.s.name)}</td><td>${esc(cls(x.s.cid).name)}</td><td class="r">${x.P}</td><td class="r">${x.A}</td><td class="r">${x.L}</td><td class="r">${pctTxt(x.pct)}${x.pct != null && x.pct < LOW ? ' *' : ''}</td></tr>`).join('')}</table>`);
}
function printRes(cf, ex) {
  const rows = resRows(cf, ex);
  printDoc('Result report', letterhead('Result report') + `<p>${esc(exName(ex))}. ${cf === 'all' ? 'All classes' : esc(cls(cf).name)}.</p>
  <table><tr><th class="c">Pos.</th><th>Student</th><th>Class</th><th class="r">Marks</th><th class="r">Percentage</th><th class="c">Grade</th><th class="c">Result</th></tr>
  ${rows.map((x, i) => `<tr><td class="c">${i + 1}</td><td>${esc(x.s.name)}</td><td>${esc(cls(x.s.cid).name)}</td><td class="r">${x.r.tot} / ${x.r.n * 100}</td><td class="r">${pctTxt(x.r.pct)}</td><td class="c">${gradeOf(x.r.pct)}</td><td class="c">${x.r.pass ? 'Pass' : 'Fail'}</td></tr>`).join('')}</table>`);
}

function AttTab({ cf, m }) {
  const { dates, rows } = attRows(cf, m);
  const low = rows.filter((x) => x.pct != null && x.pct < LOW).sort((a, b) => a.pct - b.pct);
  const csv = () => downloadCSV('attendance-' + m + '.csv', [['Roll', 'Student', 'Class', 'Present days', 'Absent days', 'Leave days', 'Attendance %']].concat(rows.map((x) => [x.s.roll, x.s.name, cls(x.s.cid).name, x.P, x.A, x.L, x.pct == null ? '' : x.pct.toFixed(1)])));
  if (!dates.length) return <Empty t="No school days in this month yet" />;
  const avgOf = (c) => { const l = rows.filter((x) => x.s.cid === c.id && x.pct != null); return l.length ? l.reduce((a, x) => a + x.pct, 0) / l.length : null; };
  return (
    <>
      <div className="row" style={{ margin: '4px 0 12px' }}>
        <Button variant="contained" onClick={() => printAtt(cf, m)}>Print or save PDF</Button>
        <Button variant="outlined" onClick={csv}>Download for Excel</Button>
      </div>
      <div className="two st">
        <Card title="Class summary">
          <DT minWidth={300} cols={['Class', { h: 'Students', n: 1 }, { h: 'Average', n: 1 }]} rows={CLASSES.filter((c) => cf === 'all' || c.id === cf).map((c) => [c.name, rows.filter((x) => x.s.cid === c.id).length, pctTxt(avgOf(c))])} />
          <p className="mut">{dates.length} school days counted in {monthLabel(m)}.</p>
        </Card>
        <Card title={'Low attendance (below ' + LOW + '%)'}>
          {low.length ? <DT minWidth={300} cols={['Student', 'Class', { h: 'Attendance', n: 1 }]} rows={low.slice(0, 12).map((x) => [<Who o={x.s}>{x.s.name}</Who>, cls(x.s.cid).name, <Tag c="bad">{pctTxt(x.pct)}</Tag>])} /> : <Empty t="No one is below the limit" />}
        </Card>
      </div>
      <Card title="All students">
        <DT minWidth={560} cols={['Roll', 'Student', 'Class', { h: 'Present', n: 1 }, { h: 'Absent', n: 1 }, { h: 'Leave', n: 1 }, { h: 'Attendance', n: 1 }]}
          rows={rows.map((x) => [x.s.roll, <Who o={x.s}>{x.s.name}</Who>, cls(x.s.cid).name, x.P, x.A, x.L, x.pct == null ? '-' : <Tag c={x.pct < LOW ? 'bad' : x.pct < 90 ? 'warn' : 'ok'}>{pctTxt(x.pct)}</Tag>])} />
      </Card>
    </>
  );
}

function ResTab({ cf, ex }) {
  const rows = resRows(cf, ex);
  const csv = () => downloadCSV('results-' + ex + '.csv', [['Position', 'Roll', 'Student', 'Class', 'Total', 'Out of', 'Percentage', 'Grade', 'Result']].concat(rows.map((x, i) => [i + 1, x.s.roll, x.s.name, cls(x.s.cid).name, x.r.tot, x.r.n * 100, x.r.pct.toFixed(1), gradeOf(x.r.pct), x.r.pass ? 'Pass' : 'Fail'])));
  if (!rows.length) return <Empty t="No published results for this exam" />;
  const weak = rows.slice().reverse().filter((x) => !x.r.pass || x.r.pct < 50).slice(0, 8);
  const lineRow = (x, i, tagc) => [i + 1, <Who o={x.s}>{x.s.name}</Who>, cls(x.s.cid).name, <Tag c={tagc}>{pctTxt(x.r.pct)}</Tag>];
  return (
    <>
      <div className="row" style={{ margin: '4px 0 12px' }}>
        <Button variant="contained" onClick={() => printRes(cf, ex)}>Print or save PDF</Button>
        <Button variant="outlined" onClick={csv}>Download for Excel</Button>
      </div>
      <div className="two st">
        <Card title="Top 5 students"><DT minWidth={300} cols={['#', 'Student', 'Class', { h: 'Percent', n: 1 }]} rows={rows.slice(0, 5).map((x, i) => lineRow(x, i, 'ok'))} /></Card>
        <Card title="Need support (below 50% or failed)">
          {weak.length ? <DT minWidth={300} cols={['#', 'Student', 'Class', { h: 'Percent', n: 1 }]} rows={weak.map((x, i) => lineRow(x, i, 'bad'))} /> : <Empty t="No weak students" />}
        </Card>
      </div>
      <Card title="Class results">
        <DT minWidth={360} cols={['Class', { h: 'Average', n: 1 }, { h: 'Pass rate', n: 1 }]} rows={CLASSES.filter((c) => cf === 'all' || c.id === cf).map((c) => [c.name, pctTxt(classAvg(ex, c.id)), pctTxt(classPass(ex, c.id))])} />
      </Card>
    </>
  );
}

export function Reports() {
  const tab = F('rtab', 'att'), cf = F('rcls', 'all'), m = F('rmon', CM()), ex = F('rexm', latestExam());
  return (
    <>
      <PageHead title="Reports" sub="Monthly attendance and exam result reports. Print them or download for Excel." />
      <Seg k="rtab" def="att" list={[['att', 'Attendance'], ['res', 'Results']]} />
      <div className="g2" style={{ margin: '14px 0' }}>
        <FSel k="rcls" def="all" list={[['all', 'All classes'], ...CLASSES.map((c) => [c.id, c.name])]} label="Class" />
        {tab === 'att' ? <FSel k="rmon" def={m} list={monthOptions()} label="Month" /> : <FSel k="rexm" def={ex} list={EXAMS.map((e) => [e.id, e.name])} label="Exam" />}
      </div>
      {tab === 'att' ? <AttTab cf={cf} m={m} /> : <ResTab cf={cf} ex={ex} />}
    </>
  );
}
