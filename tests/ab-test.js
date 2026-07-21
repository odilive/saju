// A(희신 재정의)·B(과다 오행 감점) 검증 — 사용자(신약 을목, 용신 수) 기준
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
const gz = (s, b) => M.ST[s] + M.BR[b];
const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 신약 을목, 용신 수

// A-1) 목(비겁)이 적정한 상대 → 희신 '비겁' 가점
{
  const B = { ds: 2, db: 3, ys: 8, yb: 0, ms: 0, mb: 3, hs: 8, hb: 0, g: 'F' }; // 목: 월지묘30+월간갑10+일지묘?
  // 목 세력: ms 갑10 + mb 묘30 + db 묘15 = 55/102 = 54% → 과다라 40% 초과. 조정: 목 적정 케이스
  const B2 = { ds: 8, db: 3, ys: 0, yb: 0, ms: 2, mb: 0, hs: 9, hb: 11, g: 'F' }; // 목: 년간갑7+일지묘15=22/102=22%
  const r = M.scorePair(A, B2, null, 4);
  const huiItem = r.R.find(x => x.t.includes('희신'));
  ok('희신이 비겁(목)으로 대체됨', huiItem && huiItem.t.includes('목') && huiItem.t.includes('비겁'), huiItem && huiItem.t);
  ok('금 희신 문구 사라짐', !r.R.some(x => x.t.includes('희신(금')));
}
// B-1) 화(식상) 과다 상대 → 감점 (오미합 우려 케이스)
{
  const Bfire = { ds: 2, db: 6, ys: 2, yb: 5, ms: 3, mb: 6, hs: 2, hb: 5, g: 'F' };
  // 화: 병12+병7+병10 + 오30+사15+사10 = 84/102 = 82%
  const r = M.scorePair(A, Bfire, null, 4);
  const item = r.R.find(x => x.t.includes('식상') && x.p < 0);
  ok('식상(화) 과다 감점', !!item, r.R.map(x => x.t).join(' / '));
  console.log('  화 과다 후보 근거:', item ? item.p + ' ' + item.t : '없음');
}
// B-2) 토(재성) 과다 상대 → 기신 감점 1회만 (이중 감점 없음)
{
  const Bearth = { ds: 4, db: 10, ys: 4, yb: 1, ms: 5, mb: 7, hs: 4, hb: 4, g: 'F' };
  const r = M.scorePair(A, Bearth, null, 4);
  const negEarth = r.R.filter(x => x.p < 0 && (x.t.includes('기신') || x.t.includes('재성')));
  ok('토 과다 → 기신 감점 1회만', negEarth.length === 1 && negEarth[0].t.includes('기신'), negEarth.map(x => x.t));
}
// B-3) 신강한 사람 + 인성 과다 상대 → '더욱 강하게' 감점
{
  const Astrong = { ds: 0, db: 2, ys: 0, yb: 11, ms: 2, mb: 2, hs: 9, hb: 0, g: 'M', ec: [4, 1, 0, 0, 3] }; // 갑목 신강
  const Bwater = { ds: 8, db: 0, ys: 8, yb: 0, ms: 8, mb: 0, hs: 9, hb: 11, g: 'F' }; // 수(갑목의 인성) 100%
  const r = M.scorePair(Astrong, Bwater, null, 3); // 용신 금
  ok('신강+인성 과다 → 가중 감점', r.R.some(x => x.t.includes('인성') && x.p < 0), r.R.map(x => x.t).join(' / '));
}
// 통합: 새 상위 5 및 재현성
{
  const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
  const seen = new Set(); const top = [];
  for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 5) break; } }
  console.log('\n새 상위 5:');
  for (let i = 0; i < top.length; i++) {
    const c = M.candidateChart(top[i], 'F', true);
    const rr = M.scorePair(A, c, null, 4);
    console.log(`#${i + 1}`, `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`, M.hourLabel(c.hb, true),
      [gz(c.ys, c.yb), gz(c.ms, c.mb), gz(c.ds, c.db), gz(c.hs, c.hb)].join(' '), rr.s + '점',
      '(수 ' + Math.round(M.elemRatio(c, 4) * 100) + '% / 목 ' + Math.round(M.elemRatio(c, 0) * 100) + '% / 화 ' + Math.round(M.elemRatio(c, 1) * 100) + '%)');
  }
  const c0 = M.candidateChart(top[0], 'F', true);
  ok('검색-재계산 점수 일치', M.scorePair(A, c0, null, 4).s === top[0].s);
  // 상위 5에 화 45%+ 후보 없어야 함
  ok('상위 5에 화 45%+ 후보 없음', top.every(k => M.elemRatio(M.candidateChart(k, 'F', true), 1) < 0.45));
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
