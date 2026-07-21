// 조건 검색 검증: 계묘일주 + 나와 충 없음 + 수(水) 3개 이상
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const module_ = { exports: {} };
new Function('module', src)(module_);
const M = module_.exports;

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, info || ''); }
};

const A = M.buildChart(1990, 3, 15, 10, true, 'M'); // 기묘일주 남성
console.log('내 사주: 일간', M.ST[A.ds], '/ 일지', M.BR[A.db], '/ 년지', M.BR[A.yb]);

// 계=9, 묘=3, 수=인덱스4
const F = {
  ds: 9, db: 3,
  minEl: [0, 0, 0, 0, 3],
  noIljiChung: true, noIljiWonjin: true, noIljiHyungHae: true,
  noYearChung: true, noGanChung: false,
};
const { keep, count } = M.searchCandidates(A, 1988, 1998, 'F', F, null);
console.log('조건에 맞는 후보:', count.toLocaleString(), '개');

ok('조건 검색 결과 존재', keep.length > 0, '결과 0개');

// 모든 결과가 조건을 만족하는지 전수 확인
let all = true, detail = '';
for (const k of keep) {
  const c = M.candidateChart(k, 'F', true);
  if (c.ds !== 9 || c.db !== 3) { all = false; detail = '일주 불일치 ' + M.ST[c.ds] + M.BR[c.db]; break; }
  if (c.ec[4] < 3) { all = false; detail = '수 개수 ' + c.ec[4]; break; }
  if (Math.abs(A.db - c.db) === 6) { all = false; detail = '일지 충'; break; }
  if (Math.abs(A.yb - c.yb) === 6) { all = false; detail = '년지 충'; break; }
}
ok('전 결과가 계묘일주', all, detail);

// 상위 3개 출력
console.log('\n상위 3개:');
for (let i = 0; i < Math.min(3, keep.length); i++) {
  const c = M.candidateChart(keep[i], 'F', true);
  const r = M.scorePair(A, c);
  console.log(`#${i + 1}`, `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`,
    M.hourLabel(c.hb, true),
    [M.pillarStr(c.ys, c.yb), M.pillarStr(c.ms, c.mb), M.pillarStr(c.ds, c.db), M.pillarStr(c.hs, c.hb)].join(' '),
    '수x' + c.ec[4], r.s + '점');
}

// 가중치 검증 (용신 적용): 용신·오행 축 0% → 용신 근거 제거, 가중치 반영
{
  const B = M.candidateChart(keep[0], 'F', true);
  const base = M.scorePair(A, B, { gan: 1, ilji: 1, ymji: 1, ohaeng: 1 }, 4);
  const noOh = M.scorePair(A, B, { gan: 1, ilji: 1, ymji: 1, ohaeng: 0 }, 4);
  const hiOh = M.scorePair(A, B, { gan: 1, ilji: 1, ymji: 1, ohaeng: 1.5 }, 4);
  ok('용신 가중치 0% → 용신 근거 제거', !noOh.R.some(x => x.t.includes('용신')));
  const hadOh = base.R.some(x => x.t.includes('용신'));
  ok('가중치 반영(0% ≤ 기본 ≤ 150%)', !hadOh || (noOh.s <= base.s && base.s <= hiOh.s),
    noOh.s + '/' + base.s + '/' + hiOh.s);
  // 용신 미적용 시 오행 축이 완전히 빠지고 관계만 남는지
  const relOnly = M.scorePair(A, B, null, null);
  ok('용신 미적용 → 오행/용신 근거 전무', !relOnly.R.some(x => /용신|희신|기신|오행 상보/.test(x.t)));
}

// 존재하지 않는 일주 조합(음양 불일치)은 결과 0
{
  const F2 = { ds: 9, db: 2, minEl: [0, 0, 0, 0, 0] }; // 계인 — 존재하지 않음
  const r = M.searchCandidates(A, 1990, 1992, 'F', F2, null);
  ok('불가능 일주(계인) → 0건', r.count === 0, r.count);
}

console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
