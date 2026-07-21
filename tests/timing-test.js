// 투출 감점 + 세운 배지 강화(양측 신호·대운 교차 검증) 테스트
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const module_ = { exports: {} };
new Function('module', src)(module_);
const M = module_.exports;

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, '|', info); }
};

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 신약 을목, 용신 수

// 1) 천간 투출 감점: 1991-12-26 자시 (신·경·경 3간 투출, 금 세력 28%)
{
  const B = M.buildChart(1991, 12, 26, 0.5, true, 'F');
  const r = M.scorePair(A, B, null, 4);
  const item = r.R.find(x => x.t.includes('투출'));
  ok('금 3간 투출 감점 존재', !!item && item.p < 0, r.R.map(x => x.t).join(' / '));
  console.log('  ', item ? item.p + ' ' + item.t : '', '→ 총점', r.s);
  // 투출 1개 이하 후보는 감점 없음 (임수 일간 후보)
  const B2 = M.buildChart(1994, 8, 24, 4, true, 'F'); // 갑술 임신 임오 임인 — 금 천간 0개
  const r2 = M.scorePair(A, B2, null, 4);
  ok('투출 2개 미만 → 감점 없음', !r2.R.some(x => x.t.includes('투출')));
}
// 2) 세운: 양쪽 모두 신호 필요 — 신호가 있는 쌍을 검색 상위권에서 찾아 검증
let Bpair = null;
{
  const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
  for (const k of keep.slice(0, 200)) {
    const c = M.candidateChart(k, 'F', true);
    if (M.marriageYearsAll(A, c).length > 0) { Bpair = c; break; }
  }
  ok('유리한 해가 있는 쌍 존재', !!Bpair);
  const all = M.marriageYearsAll(A, Bpair);
  const chk = all.every(m => {
    const ys = M.mod(m.Y - 4, 10), yb = M.mod(m.Y - 4, 12);
    const na = M.seunSignals(A, ys, yb), nb = M.seunSignals(Bpair, ys, yb);
    return na >= 0.5 && nb >= 0.5 && na + nb >= 2;
  });
  ok('반환된 해는 모두 양쪽 신호 있음 + 합산 2 이상', chk, JSON.stringify(all));
  console.log('  유리한 해:', all.map(m => m.Y + '(신호' + m.n + (m.headwind ? ',역풍' : '') + ')').join(' '));
  // 천간 투출 위주 가중 확인: 지지에만 배우자성이 있으면 0.5
  const half = M.seunSignals({ ds: 1, db: 1, g: 'M' }, 0, 4); // 을목 남(배우자성 토)·축 일지, 갑진년: 지지 진(토)만
  ok('지지만 배우자성 → 0.5점', half === 0.5, half);
  const full = M.seunSignals({ ds: 1, db: 1, g: 'M' }, 4, 2); // 무인년: 천간 무(토) 투출
  ok('천간 투출 배우자성 → 1점', full === 1, full);
}
// 3) 대운 교차 검증: 배우자궁 충 구간 제외, 역풍 표시
{
  const B = Bpair;
  const base = M.marriageYearsAll(A, B);
  ok('교차 검증 전 유리한 해 존재(전제)', base.length > 0);
  // 모든 해가 충 구간인 ctx → 전부 제외
  const allYears = new Set(); for (let y = M.CUR_YEAR; y < M.CUR_YEAR + 8; y++) allYears.add(y);
  const ctxChung = { winY0: M.CUR_YEAR, wa: new Array(30).fill('mid'), wb: new Array(30).fill('mid'), chA: allYears, chB: new Set() };
  ok('배우자궁 충 대운 구간 → 전부 제외', M.marriageYearsAll(A, B, ctxChung).length === 0);
  // 전 구간 역풍 ctx → headwind 플래그
  const ctxBad = { winY0: M.CUR_YEAR, wa: new Array(30).fill('bad'), wb: new Array(30).fill('mid'), chA: new Set(), chB: new Set() };
  const hw = M.marriageYearsAll(A, B, ctxBad);
  ok('역풍 구간 → headwind 표시', hw.length > 0 && hw.every(m => m.headwind));
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
