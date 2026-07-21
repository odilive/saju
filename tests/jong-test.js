// 종격(從格) 경고 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
const EL = M.EL;

let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, '|', info); } };

// 1) 종세(從勢) — 을목 일간, 온통 금(관성)·화(식상)로 일간 무근
// 을(1) 일간, 월지 신(금), 온통 금/화, 목 뿌리 없음
{
  const c = { ds: 1, db: 8, ys: 6, yb: 8, ms: 6, mb: 8, hs: 3, hb: 5, g: 'M' }; // 경신 경신 을신 정사
  const an = M.analyzeChart(c);
  console.log('종세 후보:', '일간 을, 돕는세력', Math.round(an.r * 100) + '%, 득령', an.deukryeong, '/ jong:', an.jong ? an.jong.type + '→' + EL[an.jong.yong] : 'null');
  ok('극단 무근 신약 → 종격 경고 발생', !!an.jong && an.jong.type === 'weak', an.jong);
}
// 2) 전왕(專旺) — 갑목 일간, 온통 목/수, 극단 신강
{
  const c = { ds: 0, db: 2, ys: 0, yb: 3, ms: 8, mb: 11, hs: 8, hb: 0, g: 'M' }; // 갑인 임해 갑자... 목수 범벅
  const an = M.analyzeChart(c);
  console.log('전왕 후보:', '일간 갑, 돕는세력', Math.round(an.r * 100) + '%, 득령', an.deukryeong, '/ jong:', an.jong ? an.jong.type + '→' + EL[an.jong.yong] : 'null');
  ok('극단 신강 득령 → 전왕 경고 발생', !!an.jong && an.jong.type === 'strong', an.jong);
}
// 3) 일반 사주(사용자 을미)는 종격 경고 없어야 함
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const an = M.analyzeChart(A);
  ok('사용자 사주(신약이지만 무근 아님) → 종격 경고 없음', !an.jong, an.jong);
}
// 4) 중화 사주 → 경고 없음
{
  const c = { ds: 0, db: 2, ys: 6, yb: 8, ms: 2, mb: 6, hs: 8, hb: 0, g: 'M' };
  const an = M.analyzeChart(c);
  ok('균형 사주 → 종격 경고 없음', !an.jong, an.jong);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
