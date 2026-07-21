// 억부 축 단조성 전수 검증: 관계를 고정한 채 오행만 바꿔 방향성이 예외 없이 지켜지는지
// 성질 1: 임의 천간 자리를 기신(무토) → 용신(임수)으로 바꾸면 점수는 절대 내려가지 않는다 (수 비중 ≤45% 구간)
// 성질 2: 임의 천간 자리를 기신(무토) → 희신(갑목)으로 바꾸면 점수는 절대 내려가지 않는다 (목 비중 ≤40% 구간)
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 신약 을목, 용신 수
let seed = 12345;
const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };

let n1 = 0, v1 = 0, n2 = 0, v2 = 0;
const viol = [];
for (let i = 0; i < 2000; i++) {
  const idx = rnd(60);
  const base = {
    ds: idx % 10, db: idx % 12,
    ys: rnd(10), ms: rnd(10), hs: rnd(10),
    yb: rnd(12), mb: rnd(12), hb: rnd(12), g: 'F',
  };
  const slot = ['ys', 'ms', 'hs'][rnd(3)];
  // A 중심 용신 기여만 합산 (상호 보완·배우자성은 B의 자체 균형에 좌우되는 독립 항목이라 제외)
  const coreYong = r => r.R.filter(x => /용신\(|희신\(|기신\(|과다|투출/.test(x.t) && !/상호 보완|상대에게 부담|배우자성/.test(x.t))
    .reduce((s, x) => s + x.p, 0);
  // 성질 1: 무(4) vs 임(8)
  const bLow = Object.assign({}, base); bLow[slot] = 4;
  const bHigh = Object.assign({}, base); bHigh[slot] = 8;
  if (M.elemRatio(bHigh, 4) <= 0.45) {
    n1++;
    const sl = coreYong(M.scorePair(A, bLow, null, 4)), sh = coreYong(M.scorePair(A, bHigh, null, 4));
    if (sh < sl) { v1++; if (viol.length < 5) viol.push('P1 ' + JSON.stringify(base) + ' ' + slot + ': ' + sl + '→' + sh); }
  }
  // 성질 2: 무(4) vs 갑(0)
  const bWood = Object.assign({}, base); bWood[slot] = 0;
  if (M.elemRatio(bWood, 0) <= 0.40) {
    n2++;
    const sl = coreYong(M.scorePair(A, bLow, null, 4)), sw = coreYong(M.scorePair(A, bWood, null, 4));
    if (sw < sl) { v2++; if (viol.length < 5) viol.push('P2 ' + JSON.stringify(base) + ' ' + slot + ': ' + sl + '→' + sw); }
  }
}
console.log('=== 억부축(A 중심) 단조성 전수 검증 — 관계 고정, 오행만 치환 ===');
console.log('성질1 (기신 토→용신 수 치환 시 점수 불감소):', (n1 - v1) + '/' + n1, '통과, 위반', v1);
console.log('성질2 (기신 토→희신 목 치환 시 점수 불감소):', (n2 - v2) + '/' + n2, '통과, 위반', v2);
if (viol.length) viol.forEach(v => console.log('  위반:', v));
process.exit(v1 + v2 === 0 ? 0 : 1);
