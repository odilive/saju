// 축 간 균형 측정: 합충축 vs 용신축이 실제로 몇 대 몇인가
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
const gz = (s, b) => M.ST[s] + M.BR[b];

// R 항목을 축으로 분류
function axisOf(t) {
  if (/일지\(배우자궁\)/.test(t)) return 'ilji';
  if (/띠\(년지\)|월지/.test(t)) return 'ymji';
  if (/용신|희신|기신|관성|식상|재성|인성|비겁|오행 상보/.test(t)) return 'yong';
  return 'gan'; // 천간합/충, 상생, 정재/정관, 음양
}
function decompose(A, B, yong) {
  const r = M.scorePair(A, B, null, yong);
  const ax = { gan: 0, ilji: 0, ymji: 0, yong: 0 };
  for (const it of r.R) ax[axisOf(it.t)] += it.p;
  return { s: r.s, ax, rel: ax.gan + ax.ilji + ax.ymji };
}

// (1) 이론상 각 축의 최대 가점 (정규화 후)
const wOhaeng = 25; // 용신 적용 시
const maxPos = 17 + 15 + 11 + wOhaeng; // gan+ilji+ymji+yong
const factor = Math.min(1, 50 / maxPos);
console.log('=== (1) 배점 천장 (정규화 후, 용신 적용) ===');
const cap = { '일간관계(합충)': 17, '배우자궁(일지)': 15, '띠·월지': 11, '용신·오행': wOhaeng };
let relCap = 0, yongCap = 0;
for (const [k, v] of Object.entries(cap)) {
  const norm = (v * factor).toFixed(1);
  console.log('  ' + k + ': 최대 +' + norm + '점');
  if (k === '용신·오행') yongCap += v * factor; else relCap += v * factor;
}
console.log('  → 관계축 합계 최대 +' + relCap.toFixed(1) + ' vs 용신축 최대 +' + yongCap.toFixed(1)
  + '  (관계 ' + Math.round(relCap / (relCap + yongCap) * 100) + '% : 용신 ' + Math.round(yongCap / (relCap + yongCap) * 100) + '%)');

// (2) 정면 충돌: 천지덕합인데 용신 빈약 vs 합 없는데 용신 풍부
const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 을미, 신약, 용신 수
// 덕합·용신빈약: 경오일주 + 화/토로 채움 (수 최소)
const deok = { ds: 6, db: 6, ys: 2, yb: 5, ms: 4, mb: 10, hs: 3, hb: 6, g: 'F' };
// 합없음·용신풍부: 임유일주(을과 합 없음, 유미 무관계) + 수로 채움
const yongRich = { ds: 8, db: 9, ys: 8, yb: 0, ms: 9, mb: 11, hs: 8, hb: 0, g: 'F' };
console.log('\n=== (2) 축 정면 충돌 케이스 ===');
const d1 = decompose(A, deok, 4), d2 = decompose(A, yongRich, 4);
console.log('  덕합·용신빈약(' + gz(deok.ds, deok.db) + ', 수' + Math.round(M.elemRatio(deok, 4) * 100) + '%): 총 ' + d1.s + ' [관계 ' + d1.rel + ' / 용신 ' + d1.ax.yong + ']');
console.log('  합없음·용신풍부(' + gz(yongRich.ds, yongRich.db) + ', 수' + Math.round(M.elemRatio(yongRich, 4) * 100) + '%): 총 ' + d2.s + ' [관계 ' + d2.rel + ' / 용신 ' + d2.ax.yong + ']');
console.log('  → ' + (d1.s > d2.s ? '덕합이 ' + (d1.s - d2.s) + '점 앞섬' : '용신풍부가 ' + (d2.s - d1.s) + '점 앞섬'));

// (3) 실제 검색 상위30에서 각 축 평균 기여
const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
const seen = new Set(); const top = [];
for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 30) break; } }
const sum = { gan: 0, ilji: 0, ymji: 0, yong: 0 };
for (const k of top) {
  const c = M.candidateChart(k, 'F', true);
  const d = decompose(A, c, 4);
  for (const ax in sum) sum[ax] += d.ax[ax];
}
console.log('\n=== (3) 실제 상위 30 평균 축별 기여 ===');
const relAvg = (sum.gan + sum.ilji + sum.ymji) / 30, yongAvg = sum.yong / 30;
console.log('  일간관계 ' + (sum.gan / 30).toFixed(1) + ' · 배우자궁 ' + (sum.ilji / 30).toFixed(1)
  + ' · 띠월지 ' + (sum.ymji / 30).toFixed(1) + ' · 용신 ' + yongAvg.toFixed(1));
console.log('  → 관계축 평균 ' + relAvg.toFixed(1) + ' vs 용신축 평균 ' + yongAvg.toFixed(1)
  + '  (관계 ' + Math.round(relAvg / (relAvg + yongAvg) * 100) + '% : 용신 ' + Math.round(yongAvg / (relAvg + yongAvg) * 100) + '%)');
