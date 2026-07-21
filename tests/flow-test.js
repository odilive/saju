// 흐름 등급(flowGrade) 검증 — 원인 태그(충/동반) 구분 + 원진 동반 포함
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const module_ = { exports: {} };
new Function('module', src)(module_);
const M = module_.exports;

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, '|', JSON.stringify(info)); }
};
const Y0 = M.CUR_YEAR;
const mid = n => new Array(n).fill('mid');
const S = arr => new Set(arr);
const E = () => new Set();

// 1) 충 없음 + 용신 미적용 → 순탄
ok('용신 미적용·충 없음 → 순탄', M.flowGrade(mid(30), mid(30), E(), E(), E(), E(), Y0, false).g === 'good');
// 2) 부부궁 충이 3년 후 시작 → 주의(충)
{
  const f = M.flowGrade(mid(30), mid(30), S([Y0 + 3]), E(), E(), E(), Y0, false);
  ok('충 10년 내 시작 → 주의', f.g === 'warn');
  ok('원인 태그에 충 포함', f.causes.indexOf('충') >= 0, f.causes);
  ok('원인 태그에 동반 없음', f.causes.indexOf('동반') < 0, f.causes);
}
// 3) 충이 15년 후 시작 → 보통 (10년 이후)
ok('충 15년 후 → 보통', M.flowGrade(mid(30), mid(30), S([Y0 + 15]), E(), E(), E(), Y0, false).g === 'mid');
// 4) 동반 역풍 7년 → 주의(동반)
{
  const wa = mid(30), wb = mid(30);
  for (let i = 2; i < 9; i++) { wa[i] = 'bad'; wb[i] = 'bad'; }
  const f = M.flowGrade(wa, wb, E(), E(), E(), E(), Y0, true);
  ok('동반 역풍 7년 → 주의', f.g === 'warn');
  ok('동반 역풍 → 원인 태그 동반', f.causes.indexOf('동반') >= 0 && f.causes.indexOf('충') < 0, f.causes);
}
// 4b) 원진 동반 3년 → 주의(동반)
{
  const wjA = S([Y0 + 1, Y0 + 2, Y0 + 3]), wjB = S([Y0 + 1, Y0 + 2, Y0 + 3]);
  const f = M.flowGrade(mid(30), mid(30), E(), E(), wjA, wjB, Y0, false);
  ok('원진 동반 3년 → 주의', f.g === 'warn', f);
  ok('원진 동반 → 원인 태그 동반', f.causes.indexOf('동반') >= 0, f.causes);
}
// 4c) 원진이 겹치되 1년뿐 → 주의 아님(문턱 2년)
{
  const f = M.flowGrade(mid(30), mid(30), E(), E(), S([Y0 + 1]), S([Y0 + 1]), Y0, false);
  ok('원진 동반 1년뿐 → 주의 아님', f.g !== 'warn', f);
}
// 4d) 한쪽만 원진(겹치지 않음) → 주의 아님
{
  const f = M.flowGrade(mid(30), mid(30), E(), E(), S([Y0 + 1, Y0 + 2, Y0 + 3]), E(), Y0, false);
  ok('한쪽만 원진 → 주의 아님(동시성 필요)', f.g !== 'warn', f);
}
// 4e) 충 + 동반 동시 → 원인 태그 둘 다
{
  const wa = mid(30), wb = mid(30);
  for (let i = 2; i < 9; i++) { wa[i] = 'bad'; wb[i] = 'bad'; }
  const f = M.flowGrade(wa, wb, S([Y0 + 3]), E(), E(), E(), Y0, true);
  ok('충+동반 → 원인 태그 둘 다', f.causes.indexOf('충') >= 0 && f.causes.indexOf('동반') >= 0, f.causes);
}
// 5) 용신 적용 + 동반 순풍 10년 + 충 없음 → 순탄
{
  const wa = mid(30), wb = mid(30);
  for (let i = 0; i < 10; i++) { wa[i] = 'good'; wb[i] = 'good'; }
  ok('동반 순풍 10년 → 순탄', M.flowGrade(wa, wb, E(), E(), E(), E(), Y0, true).g === 'good');
}
// 6) 용신 적용 + 순풍 부족(4년) → 보통
{
  const wa = mid(30), wb = mid(30);
  for (let i = 0; i < 4; i++) { wa[i] = 'good'; wb[i] = 'good'; }
  ok('동반 순풍 4년 → 보통', M.flowGrade(wa, wb, E(), E(), E(), E(), Y0, true).g === 'mid');
}
// 7) 실사주 통합: 사용자 vs 후보들 — 등급 분포 + 원인 태그 변별력
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
  const seen = new Set(); const top = [];
  for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 20) break; } }
  const grades = { good: 0, mid: 0, warn: 0 };
  const causeCnt = { 충: 0, 동반: 0 };
  for (const k of top) {
    const c = M.candidateChart(k, 'F', true);
    const bYong = M.analyzeChart(c).eokbu;
    const tlA = M.timelineFor(A, 'M', 4, Y0, 30), tlB = M.timelineFor(c, 'F', bYong, Y0, 30);
    const wa = M.windByYear(tlA.cells, Y0, 30), wb = M.windByYear(tlB.cells, Y0, 30);
    const chA = new Set(), chB = new Set(), wjA = new Set(), wjB = new Set();
    tlA.cells.forEach(x => { if (x.chung) for (let y = x.from; y <= x.to; y++) chA.add(y); if (x.burdenType === '원진') for (let y = x.from; y <= x.to; y++) wjA.add(y); });
    tlB.cells.forEach(x => { if (x.chung) for (let y = x.from; y <= x.to; y++) chB.add(y); if (x.burdenType === '원진') for (let y = x.from; y <= x.to; y++) wjB.add(y); });
    const f = M.flowGrade(wa, wb, chA, chB, wjA, wjB, Y0, true);
    grades[f.g]++;
    f.causes.forEach(cz => causeCnt[cz]++);
  }
  console.log('  상위 20 등급 분포:', JSON.stringify(grades), '/ 원인:', JSON.stringify(causeCnt));
  ok('등급이 한 가지로 쏠리지 않음 (변별력)', Object.values(grades).filter(v => v > 0).length >= 2, grades);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
