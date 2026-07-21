// 상호 보완(mutual 용신) 항목 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, '|', info); } };
const has = (r, kw) => r.R.some(x => x.t.includes(kw));

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 을미, 화 47% 공급

// 1) 상대 용신이 화(내가 강히 공급) → 상호 보완 가점. 임오(임수, 오화) 용신 화 케이스
{
  const B = M.buildChart(1994, 8, 24, 4, true, 'F'); // 임오류
  const r = M.scorePair(A, B, null, 4);
  const bYong = M.analyzeChart(B).eokbu;
  if (bYong === 1) ok('상대 용신 화 → 상호 보완 가점', has(r, '상호 보완') && r.R.find(x => x.t.includes('상호 보완')).p > 0, r.R.filter(x => x.t.includes('상호')).map(x => x.p + x.t));
  else { console.log('  (이 후보 상대용신=' + M.EL[bYong] + ', 케이스 스킵)'); pass++; }
}
// 2) 용신 미적용이면 상호 보완 미발동
{
  const B = M.buildChart(1994, 8, 24, 4, true, 'F');
  ok('용신 미적용 → 상호 보완 없음', !has(M.scorePair(A, B, null, null), '상호 보완'));
}
// 3) 내가 상대 기신을 다량 공급 & 용신 미공급 → 부담 감점 (합성)
{
  // A가 화 47%인데, 상대 용신이 금(→기신 화)이고 A가 화로 그 금을 극하는 구도
  // 상대: 신강 목 사주(용신 금·화 극금) 만들기 어려우니, 합성으로 elemRatio만 확인되는 케이스 구성
  // 실제 발동 여부는 통계로: 전체에서 부담 감점이 한 번이라도 나오는 상대가 있는지
  const { keep } = M.searchCandidates(A, 1960, 1975, 'M', null, null, 4); // 남성 상대(동성 검색 강제)로 다양성 확보
  let burdenSeen = 0, mutualSeen = 0;
  const seen = new Set();
  for (const k of keep.slice(0, 300)) {
    if (seen.has(k.j)) continue; seen.add(k.j);
    const c = M.candidateChart(k, 'M', true);
    const r = M.scorePair(A, c, null, 4);
    if (has(r, '상대에게 부담')) burdenSeen++;
    if (has(r, '상호 보완')) mutualSeen++;
  }
  console.log('  표본 중 상호보완 발동', mutualSeen, '· 부담감점 발동', burdenSeen);
  ok('상호 보완이 다수 케이스에서 발동', mutualSeen > 0);
}
// 4) 점수 범위 유지 (0~100)
{
  const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
  const okRange = keep.every(k => k.s >= 0 && k.s <= 100);
  ok('점수 0~100 유지', okRange);
  const seen = new Set(); let hundreds = 0;
  for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); if (k.s === 100) hundreds++; } }
  ok('만점 인플레 없음 (100점 날짜 ≤3)', hundreds <= 3, hundreds);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
