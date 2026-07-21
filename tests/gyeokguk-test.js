// 십성 조합(격국) 검증: 상관견관·군겁쟁재·식신제살·관인상생
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const mm = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(mm);
const M = mm.exports;
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, '|', info); } };
const has = (r, kw) => r.R.some(x => x.t.includes(kw));
const ec = [1, 1, 1, 1, 1];
const B = (ds) => ({ ds, db: 2, ys: ds, yb: 2, ms: ds, mb: 2, hs: ds, hb: 2, g: 'F', ec });
const Bm = (ds) => Object.assign(B(ds), { g: 'M' });

// 1) 상관견관: A 여 갑목, 상관(정화3) 투출, B 정관 신금(7)
{
  const A = { ds: 0, db: 2, ys: 0, yb: 2, ms: 3, mb: 2, hs: 0, hb: 2, g: 'F', ec };   // ms=정화(상관)
  const An = { ds: 0, db: 2, ys: 0, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'F', ec };  // 상관 없음
  const r = M.scorePair(A, Bm(7)), rn = M.scorePair(An, Bm(7));
  ok('상관견관 발동', has(r, '상관견관'), r.R.map(x => x.t));
  ok('상관견관으로 점수 하락', r.s < rn.s, r.s + ' vs ' + rn.s);
}
// 2) 상관견관 + 인성 완화: A 여 갑목, 상관(정3)+인성(계9), B 정관 신금(7)
{
  const A = { ds: 0, db: 2, ys: 9, yb: 2, ms: 3, mb: 2, hs: 0, hb: 2, g: 'F', ec };   // ys=계수(인성)
  const r = M.scorePair(A, Bm(7));
  const item = r.R.find(x => x.t.includes('상관견관'));
  ok('인성 있으면 상관견관 완화(-2)', item && item.p === -2, item && item.p);
}
// 3) 군겁쟁재: A 남 갑목, 겁재(을목1) 투출, B 정재=기토(5) (갑기합)
{
  const A = { ds: 0, db: 2, ys: 1, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'M', ec };   // ys=을목(겁재)
  const An = { ds: 0, db: 2, ys: 0, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'M', ec };
  const r = M.scorePair(A, B(5)), rn = M.scorePair(An, B(5));
  ok('군겁쟁재 발동', has(r, '군겁쟁재'), r.R.map(x => x.t));
  ok('군겁쟁재로 점수 하락', r.s < rn.s, r.s + ' vs ' + rn.s);
}
// 4) 식신제살: A 여 갑목, 식신(병화2) 투출, B 편관 경금(6)
{
  const A = { ds: 0, db: 2, ys: 2, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'F', ec };   // ys=병화(식신)
  const r = M.scorePair(A, Bm(6));
  ok('식신제살 발동', has(r, '식신제살'), r.R.map(x => x.t));
}
// 5) 관인상생: A 갑목(남), 인성(계수9) 투출, B 편관 경금(6)
{
  const A = { ds: 0, db: 2, ys: 9, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'M', ec };   // ys=계수(인성)
  const r = M.scorePair(A, B(6));
  ok('관인상생 발동(편관+인성)', has(r, '관인상생'), r.R.map(x => x.t));
}
// 6) 무관한 사주는 어떤 조합도 발동 안 함
{
  const A = { ds: 0, db: 2, ys: 0, yb: 2, ms: 0, mb: 2, hs: 0, hb: 2, g: 'M', ec };
  const r = M.scorePair(A, B(2)); // 병화 = 식신 상대
  ok('조합 미발동(무관)', !has(r, '상관견관') && !has(r, '군겁쟁재') && !has(r, '식신제살') && !has(r, '관인상생'));
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
