// 고전 정답표 전수 검증: 60일주 × 천지덕합/쌍충
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
const gz = (s, b) => M.ST[s] + M.BR[b];

const YUK = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };

// 1990-01-01부터 60일 안에 모든 일주가 등장
const baseJ = M.jdnOf(1990, 1, 1);
const dateFor = {};
for (let k = 0; k < 60; k++) {
  const idx = M.mod(baseJ + k + 49, 60);
  dateFor[idx] = M.fromJdn(baseJ + k);
}

let top1 = 0, top3 = 0, total = 0;
const fails = [];
let ssangchungOK = 0, ssangchungN = 0;

for (let idx = 0; idx < 60; idx++) {
  const ds = idx % 10, db = idx % 12;
  const g = dateFor[idx];
  const A = M.buildChart(g.y, g.m, g.d, 12, true, 'M');
  const expDs = M.mod(ds + 5, 10), expDb = YUK[db];
  const expKey = expDs + '-' + expDb;

  const { keep } = M.searchCandidates(A, 1988, 1992, 'F', null, null, null); // 용신 미적용 — 관계축 격리
  const best = {};
  for (const k of keep) {
    const dp = M.dayPillar(k.j);
    const key = dp.ds + '-' + dp.db;
    if (!(key in best) || k.s > best[key]) best[key] = k.s;
  }
  const ranked = Object.entries(best).sort((a, b) => b[1] - a[1]);
  const pos = ranked.findIndex(([k]) => k === expKey);
  total++;
  if (pos === 0) top1++;
  if (pos >= 0 && pos < 3) top3++;
  else fails.push(gz(ds, db) + '→기대 ' + gz(expDs, expDb) + ' 실제 ' + (pos < 0 ? '결과 밖' : (pos + 1) + '위')
    + ' (1위: ' + (() => { const [k] = ranked[0]; const [s2, b2] = k.split('-').map(Number); return gz(s2, b2); })() + ')');

  // 쌍충 상대(천간충+지지충)는 결과에서 사실상 부재해야 함
  const chungS = ds <= 3 ? ds + 6 : (ds >= 6 && ds <= 9 ? ds - 6 : null);
  if (chungS != null) {
    ssangchungN++;
    const badKey = chungS + '-' + M.mod(db + 6, 12);
    const badBest = best[badKey];
    // 결과에 없거나, 있어도 일주 랭킹 하위 30%면 통과
    if (badBest === undefined) ssangchungOK++;
    else {
      const badPos = ranked.findIndex(([k]) => k === badKey);
      if (badPos / ranked.length >= 0.7) ssangchungOK++;
    }
  }
}

console.log('=== 고전 정답표 전수 검증 (60일주) ===');
console.log('천지덕합 상대가 일주 랭킹 1위:', top1 + '/' + total, '(' + Math.round(top1 / total * 100) + '%)');
console.log('천지덕합 상대가 상위 3위 이내:', top3 + '/' + total, '(' + Math.round(top3 / total * 100) + '%)');
console.log('쌍충 상대가 부재/하위 30%:', ssangchungOK + '/' + ssangchungN, '(' + Math.round(ssangchungOK / ssangchungN * 100) + '%)');
if (fails.length) { console.log('\ntop3 실패 케이스:'); fails.forEach(f => console.log('  ', f)); }
process.exit(top3 / total >= 0.9 && ssangchungOK / ssangchungN >= 0.9 ? 0 : 1);
