// 1:1 궁합 코어 계산 검증 (핸들러 로직 재현)
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (n, c, i) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, '|', i); } };

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 을미 남
const [py, pm, pd] = [1994, 8, 24];
const yong = 4, W = null;

// 시간 아는 경우
{
  const B = M.buildChart(py, pm, pd, 14, true, 'F');
  const s = M.scorePair(A, B, W, yong);
  ok('시간 알 때 점수 0~100', s.s >= 0 && s.s <= 100, s.s);
  ok('근거 배열 존재', s.R.length > 0);
  console.log('  1994-08-24 14:00 →', s.s + '점,', s.R.length + '개 근거');
}
// 시간 모르는 경우: 12시진 평균 + 범위, 평균이 범위 안
{
  let sum = 0, mn = Infinity, mx = -Infinity; const hs = [];
  for (let hb = 0; hb < 12; hb++) { const rep = hb === 0 ? 0.75 : hb * 2 + 0.5; const sp = M.scorePair(A, M.buildChart(py, pm, pd, rep, true, 'F'), W, yong); hs.push(sp); sum += sp.s; if (sp.s < mn) mn = sp.s; if (sp.s > mx) mx = sp.s; }
  const avg = Math.round(sum / 12);
  ok('시간 모를 때 평균 범위 안', mn <= avg && avg <= mx, mn + '/' + avg + '/' + mx);
  let bd = Infinity, R = null; for (const sp of hs) { const dd = Math.abs(sp.s - avg); if (dd < bd) { bd = dd; R = sp.R; } }
  ok('근거(평균 근접 시진) 선택됨', R && R.length > 0);
  console.log('  1994-08-24 시간모름 → 평균', avg + '점, 시진범위', mn + '~' + mx);
}
// 상대 분석 (신강약/용신/스타일) 동작
{
  const B = M.buildChart(py, pm, pd, null, true, 'F');
  const an = M.analyzeChart(B);
  ok('상대 신강약 판정', ['strong', 'weak', 'border'].includes(an.verdict), an.verdict);
  ok('상대 스타일 문자열', typeof M.styleOf(B) === 'string' && M.styleOf(B).length > 5);
  console.log('  상대:', an.verdict, '억부용신', M.EL[an.eokbu], '| 스타일', M.styleOf(B));
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
