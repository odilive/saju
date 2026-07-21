// 세운 고도화(1층 대운 배경 + 2층 방아쇠 3종) 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, '|', info); } };
const SE = [0,0,1,1,2,2,3,3,4,4], BE = [4,2,0,0,2,1,1,2,3,3,2,4];

// 2층: 배우자궁 충 방아쇠 (+0.5). 을목남(재성 토), 일지 축(1). 축을 충하는 지지=미(7). year 지지 미
{
  // year 간지: 천간 배우자성 아님, 지지 미(토=재성이기도)... 미는 토라 배우자성 지지(0.5)도 됨. 순수 충만 보려면 배우자성 아닌 충 지지 필요.
  // 을목 일지 축(1) 충 = 미(7). 미=토=재성. 겹치니 다른 예: 일지 자(0) 충=오(6). 오=화. 을목 재성=토라 오화는 배우자성 아님.
  const P = { ds: 1, db: 0, g: 'M' }; // 을목, 일지 자
  const nChung = M.seunSignals(P, 2, 6); // year 병오: 천간 병(화, 재성아님), 지지 오(자오충)
  ok('배우자궁 충 방아쇠 +0.5 반영', nChung >= 0.5, nChung);
}
// 2층: 일간 명암합 (+0.5). 갑목(0) 일간, 명암합 상대 천간 = 기(5)
{
  const P = { ds: 0, db: 2, g: 'M' }; // 갑목, 일지 인(합/충 회피)
  const y = 5; // 기토 = 갑기합(명암합) + 기토는 갑의 재성(배우자성 천간!) → 1(배우자성) + 0.5(명암합)
  const n = M.seunSignals(P, y, M.mod(y, 12)); // 대략
  ok('명암합+배우자성 동시 → 1.5 이상', n >= 1.5, n);
}
// 1층: 대운 배경 — 배우자성 대운이면 bg>0
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 을목남, 재성=토
  const bg = M.daewoonMarriageBg(A, 'M', M.CUR_YEAR, 30);
  ok('대운 배경 배열 길이 30', bg.length === 30);
  ok('대운 배경 값 0 이상', bg.every(v => v >= 0));
  const hasBg = bg.some(v => v > 0);
  console.log('  대운 배경 표본:', bg.slice(0, 10).map(v => v.toFixed(1)).join(' '));
  ok('배우자성/활성 대운 구간이 존재(하나 이상)', hasBg);
}
// 1층 증폭: 같은 세운도 결혼기 대운에서 n이 더 커지는가 (곱셈)
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const B = M.buildChart(1992, 7, 20, 14, true, 'F');
  const Y0 = M.CUR_YEAR;
  const noAmp = M.marriageYearsAll(A, B, null, Y0, Y0 + 29); // 증폭 없음
  const bgA = M.daewoonMarriageBg(A, 'M', Y0, 30), bgB = M.daewoonMarriageBg(B, 'F', Y0, 30);
  const amp = M.marriageYearsAll(A, B, { winY0: Y0, wa: new Array(30).fill('mid'), wb: new Array(30).fill('mid'), chA: new Set(), chB: new Set(), bgA, bgB }, Y0, Y0 + 29);
  // 같은 해의 n 비교: 증폭본 n >= 원본 n
  let allGe = true;
  for (const a of amp) { const o = noAmp.find(x => x.Y === a.Y); if (o && a.n < o.n - 1e-9) allGe = false; }
  ok('대운 증폭 시 n 불감소', allGe);
  const boosted = amp.some(a => { const o = noAmp.find(x => x.Y === a.Y); return o && a.n > o.n + 1e-6; });
  ok('일부 해는 실제로 증폭됨', boosted || amp.length === 0);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
