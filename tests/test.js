// index.html의 <script> 부분을 추출해 핵심 로직을 검증한다
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const module_ = { exports: {} };
new Function('module', src)(module_);
const M = module_.exports;

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, '| got:', JSON.stringify(got), '| want:', JSON.stringify(want)); }
}
function close(name, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (ok) { pass++; console.log('PASS', name, '(', got.toFixed ? got.toFixed(4) : got, ')'); }
  else { fail++; console.log('FAIL', name, '| got:', got, '| want ~', want); }
}
const gz = (p) => M.ST[p.s ?? p.ds] + M.BR[p.b ?? p.db];

// 1) 일주 검증 — 알려진 기준일
// 1949-10-01 = 갑자일 (역사적으로 유명한 기준일)
eq('일주 1949-10-01 = 갑자', (() => { const d = M.dayPillar(M.jdnOf(1949, 10, 1)); return M.ST[d.ds] + M.BR[d.db]; })(), '갑자');
// 1900-01-01 = 갑술일
eq('일주 1900-01-01 = 갑술', (() => { const d = M.dayPillar(M.jdnOf(1900, 1, 1)); return M.ST[d.ds] + M.BR[d.db]; })(), '갑술');
// 60일 주기 일관성
eq('일주 1949-11-30 = 갑자(60일 후)', (() => { const d = M.dayPillar(M.jdnOf(1949, 10, 1) + 60); return M.ST[d.ds] + M.BR[d.db]; })(), '갑자');

// 2) 달력 왕복 변환
eq('jdn 왕복 2000-02-29', M.fromJdn(M.jdnOf(2000, 2, 29)), { d: 29, m: 2, y: 2000 });
eq('jdn 왕복 1987-01-01', M.fromJdn(M.jdnOf(1987, 1, 1)), { d: 1, m: 1, y: 1987 });

// 3) 태양 황경 근사 — 2000-01-01 12UT 황경 ~280.37°
close('태양황경 2000-01-01 12UT ≈ 280.37', M.sunLongitude(2451545.0), 280.37, 0.05);

// 4) 입춘 시각 — 2025년 입춘은 KST 2월 3일 밤 (2/3 22:00~24:00 사이)
{
  const jd = M.ipchunJd(2025);           // UT
  const kst = jd + 9 / 24;
  const j = Math.floor(kst + 0.5);       // KST 기준 JDN
  const g = M.fromJdn(j);
  const frac = (kst + 0.5 - j) * 24;     // KST 시각(시)
  console.log('  입춘 2025 KST =', g.y + '-' + g.m + '-' + g.d, frac.toFixed(2) + '시');
  eq('입춘 2025 = 2월 3일(KST)', { y: g.y, m: g.m, d: g.d }, { y: 2025, m: 2, d: 3 });
  close('입춘 2025 시각 ≈ 23시 근방', frac, 23.1, 1.5);
}

// 5) 년주 경계 — 1984-02-03(입춘 전) = 계해년, 1984-02-05(입춘 후) = 갑자년
{
  const before = M.buildChart(1984, 2, 3, 12, true, 'M');
  const after = M.buildChart(1984, 2, 5, 12, true, 'M');
  eq('1984-02-03 년주 = 계해', M.ST[before.ys] + M.BR[before.yb], '계해');
  eq('1984-02-05 년주 = 갑자', M.ST[after.ys] + M.BR[after.yb], '갑자');
  // 갑자년 입춘 직후는 병인월 (갑기년 → 병인월 시작)
  eq('1984-02-05 월주 = 병인', M.ST[after.ms] + M.BR[after.mb], '병인');
}

// 6) 월주 — 2024-02-05 (갑진년 입춘 직후) = 병인월
{
  const c = M.buildChart(2024, 2, 5, 12, true, 'M');
  eq('2024-02-05 년주 = 갑진', M.ST[c.ys] + M.BR[c.yb], '갑진');
  eq('2024-02-05 월주 = 병인', M.ST[c.ms] + M.BR[c.mb], '병인');
}
// 1월생은 전년 사주 — 2000-01-10 = 기묘년 정축월 (기묘년: 소한~입춘 사이는 축월, 갑기년 → …정축월)
{
  const c = M.buildChart(2000, 1, 10, 12, true, 'M');
  eq('2000-01-10 년주 = 기묘(전년)', M.ST[c.ys] + M.BR[c.yb], '기묘');
  eq('2000-01-10 월주 = 정축', M.ST[c.ms] + M.BR[c.mb], '정축');
}

// 7) 시주 규칙 — 갑일 자시 = 갑자시, 을일 자시 = 병자시, 병일 오시 = 갑오시
eq('갑일 자시 시간 = 갑', M.ST[M.hourStemOf(0, 0)], '갑');
eq('을일 자시 시간 = 병', M.ST[M.hourStemOf(1, 0)], '병');
eq('병일 오시 시간 = 갑', M.ST[M.hourStemOf(2, 6)], '갑');

// 8) 시지 경계 (30분 보정) — 23:40은 자시+다음날, 01:20은 자시, 01:40은 축시
eq('23:40 → 자시/익일', M.hourBranchOf(23 + 40 / 60, true), { hb: 0, nextDay: true });
eq('01:20 → 자시', M.hourBranchOf(1 + 20 / 60, true), { hb: 0, nextDay: false });
eq('01:40 → 축시', M.hourBranchOf(1 + 40 / 60, true), { hb: 1, nextDay: false });

// 9) 궁합 점수 스모크 테스트 — 대칭 관계 및 대표 케이스
{
  // 갑자일주 남 vs 기축일주 여: 갑기합 + 자축합 → 높은 점수
  const A = M.buildChart(1990, 3, 15, 10, true, 'M');
  console.log('  A(1990-03-15 10:00) =', M.ST[A.ys] + M.BR[A.yb], M.ST[A.ms] + M.BR[A.mb], M.ST[A.ds] + M.BR[A.db], M.ST[A.hs] + M.BR[A.hb]);
  const B = M.buildChart(1992, 7, 20, 14, true, 'F');
  const s1 = M.scorePair(A, B);
  console.log('  scorePair 예시 =', s1.s, '점 /', s1.R.length, '개 근거');
  if (s1.s >= 0 && s1.s <= 100) { pass++; console.log('PASS 점수 범위 0~100'); } else { fail++; console.log('FAIL 점수 범위', s1.s); }
}

// 10) 일간합 판정: 갑(0)-기(5) 합
{
  const mk = (ds, db, g) => ({ ds, db, ys: 0, yb: 0, ms: 2, mb: 2, hs: null, hb: null, g, ec: [1, 1, 1, 1, 1] });
  const r = M.scorePair(mk(0, 0, 'M'), mk(5, 1, 'F')); // 갑자 vs 기축: 천간합+자축육합
  const hasHap = r.R.some(x => x.t.includes('천간합'));
  const hasYukhap = r.R.some(x => x.t.includes('육합'));
  eq('갑-기 천간합 감지', hasHap, true);
  eq('자-축 육합 감지', hasYukhap, true);
  const r2 = M.scorePair(mk(0, 0, 'M'), mk(6, 6, 'F')); // 갑자 vs 경오: 천간충 + 자오충
  eq('갑-경 천간충 감지', r2.R.some(x => x.t.includes('천간충')), true);
  eq('자-오 충 감지', r2.R.some(x => x.t.includes('충') && x.t.includes('일지')), true);
  if (r.s > r2.s) { pass++; console.log('PASS 합 커플(' + r.s + ') > 충 커플(' + r2.s + ')'); }
  else { fail++; console.log('FAIL 합/충 점수 역전', r.s, r2.s); }
}

console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
