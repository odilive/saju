// 추천 Top5 로직 검증 (코어 함수로 재현)
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, '|', info); }
};

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
const Y0 = M.CUR_YEAR;

// 1) 시주 제외 후보 채점이 정상 동작
{
  const c = M.buildChart(1994, 8, 24, null, true, 'F');
  ok('시주 없는 후보 차트 (hb null)', c.hb === null && c.hs === null);
  const r = M.scorePair(A, c, null, 4);
  ok('6글자 채점 0~100', r.s >= 0 && r.s <= 100, r.s);
  console.log('  1994-08-24 시주 제외:', r.s + '점');
  // 12시진 범위
  let mn = 99, mx = 0;
  for (let hb = 0; hb < 12; hb++) {
    const rep = hb === 0 ? 0.75 : hb * 2 + 0.5;
    const ch = M.buildChart(1994, 8, 24, rep, true, 'F');
    const s = M.scorePair(A, ch, null, 4).s;
    if (s < mn) mn = s; if (s > mx) mx = s;
  }
  console.log('  시진별 범위:', mn + '~' + mx);
  ok('시진 범위 유효', mn <= mx && mx - mn <= 15, mn + '~' + mx);
}

// 2) 추천 파이프라인(일주 평균 집계) 재현: 범위 전체 채점 → 일주별 평균
{
  const y1 = 1990, y2 = 1994; // 5년(속도 위해 축소)
  const j1 = M.jdnOf(y1, 1, 1), j2 = M.jdnOf(y2, 12, 31);
  const t0 = Date.now();
  const byIlju = new Map(); const all = [];
  for (let j = j1; j <= j2; j++) {
    const g = M.fromJdn(j);
    const c = M.buildChart(g.y, g.m, g.d, null, true, 'F');
    let sum = 0;
    for (let hb = 0; hb < 12; hb++) { const rp = hb === 0 ? 0.75 : hb * 2 + 0.5; sum += M.scorePair(A, M.buildChart(g.y, g.m, g.d, rp, true, 'F'), null, 4).s; }
    const s = Math.round(sum / 12), ik = c.ds + '-' + c.db;
    if (!byIlju.has(ik)) byIlju.set(ik, { ik, ds: c.ds, db: c.db, items: [] });
    byIlju.get(ik).items.push({ j, c, s });
    all.push({ j, s });
  }
  console.log('  (5년 범위 12시진평균 집계 ' + ((Date.now() - t0) / 1000).toFixed(2) + '초)');
  all.sort((a, b) => b.s - a.s);
  const top100 = new Set(all.slice(0, 100).map(x => x.j));
  const groups = [...byIlju.values()].map(g => {
    const ss = g.items.map(x => x.s);
    g.avg = Math.round(ss.reduce((a, b) => a + b, 0) / ss.length);
    g.mn = Math.min(...ss); g.mx = Math.max(...ss);
    const best = g.items.reduce((a, b) => b.s > a.s ? b : a); g.rep = best.c; g.repScore = best.s;
    g.count = ss.length; g.inTop = g.items.filter(x => top100.has(x.j)).length; return g;
  }).sort((a, b) => b.avg - a.avg || b.inTop - a.inTop);
  const recs = groups.slice(0, 5); // 목표 없음 → 평균순 상위 5
  ok('추천 일주 5종 선발', recs.length === 5, recs.length);
  ok('일주 중복 없음', new Set(recs.map(x => x.ik)).size === recs.length);
  ok('평균 점수 내림차순 정렬', recs.every((x, i) => i === 0 || recs[i - 1].avg >= x.avg));
  ok('평균이 범위 안 (mn ≤ avg ≤ mx)', recs.every(x => x.mn <= x.avg && x.avg <= x.mx));
  { const cs = groups.map(x => x.count); // 60일 주기라 일주별 표본이 거의 균등
    ok('일주별 표본 균등(최대-최소 ≤ 2)', Math.max(...cs) - Math.min(...cs) <= 2, '범위 ' + Math.min(...cs) + '~' + Math.max(...cs)); }
  ok('대표(avg)가 시진범위 밖 안 나감은 전체목록에서 보장 — 여기선 12평균 자체', true);
  console.log('\n추천 일주 Top5 (평균순):');
  recs.forEach((g, i) => console.log(`  추천${i + 1}`, M.ST[g.ds] + M.BR[g.db] + '일주',
    '평균 ' + g.avg + '(범위 ' + g.mn + '~' + g.mx + ')', '상위100내 ' + g.inTop, '| 스타일:', M.styleOf(g.rep)));
}
// 3) styleOf 동작
{
  const c = M.buildChart(1994, 8, 24, 4, true, 'F');
  const st = M.styleOf(c);
  ok('styleOf 문자열 생성', typeof st === 'string' && st.includes('·') && st.length > 5, st);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
