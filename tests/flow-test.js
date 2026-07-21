// 흐름 등급(flowGrade) 검증
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

// 1) 충 없음 + 용신 미적용 → 순탄
ok('용신 미적용·충 없음 → 순탄', M.flowGrade(mid(30), mid(30), S([]), S([]), Y0, false).g === 'good');
// 2) 부부궁 충이 3년 후 시작 → 주의
ok('충 10년 내 시작 → 주의', M.flowGrade(mid(30), mid(30), S([Y0 + 3]), S([]), Y0, false).g === 'warn');
// 3) 충이 15년 후 시작 → 보통 (10년 이후)
ok('충 15년 후 → 보통', M.flowGrade(mid(30), mid(30), S([Y0 + 15]), S([]), Y0, false).g === 'mid');
// 4) 동반 역풍 7년 → 주의
{
  const wa = mid(30), wb = mid(30);
  for (let i = 2; i < 9; i++) { wa[i] = 'bad'; wb[i] = 'bad'; }
  ok('동반 역풍 7년 → 주의', M.flowGrade(wa, wb, S([]), S([]), Y0, true).g === 'warn');
}
// 5) 용신 적용 + 동반 순풍 10년 + 충 없음 → 순탄
{
  const wa = mid(30), wb = mid(30);
  for (let i = 0; i < 10; i++) { wa[i] = 'good'; wb[i] = 'good'; }
  ok('동반 순풍 10년 → 순탄', M.flowGrade(wa, wb, S([]), S([]), Y0, true).g === 'good');
}
// 6) 용신 적용 + 순풍 부족(4년) → 보통
{
  const wa = mid(30), wb = mid(30);
  for (let i = 0; i < 4; i++) { wa[i] = 'good'; wb[i] = 'good'; }
  ok('동반 순풍 4년 → 보통', M.flowGrade(wa, wb, S([]), S([]), Y0, true).g === 'mid');
}
// 7) 실사주 통합: 사용자 vs 후보들 — 등급 분포 확인
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
  const seen = new Set(); const top = [];
  for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 20) break; } }
  const grades = { good: 0, mid: 0, warn: 0 };
  for (const k of top) {
    const c = M.candidateChart(k, 'F', true);
    const bYong = M.analyzeChart(c).eokbu;
    const tlA = M.timelineFor(A, 'M', 4, Y0, 30), tlB = M.timelineFor(c, 'F', bYong, Y0, 30);
    const wa = M.windByYear(tlA.cells, Y0, 30), wb = M.windByYear(tlB.cells, Y0, 30);
    const chA = new Set(), chB = new Set();
    tlA.cells.forEach(x => { if (x.chung) for (let y = x.from; y <= x.to; y++) chA.add(y); });
    tlB.cells.forEach(x => { if (x.chung) for (let y = x.from; y <= x.to; y++) chB.add(y); });
    grades[M.flowGrade(wa, wb, chA, chB, Y0, true).g]++;
  }
  console.log('  상위 20 등급 분포:', JSON.stringify(grades));
  ok('등급이 한 가지로 쏠리지 않음 (변별력)', Object.values(grades).filter(v => v > 0).length >= 2, grades);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
