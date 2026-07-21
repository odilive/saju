// buildReco가 상세 조건(일간/일지 지정, 오행 최소 개수, 배제 조건)을 실제로 반영하는지 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (n, c, i) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, '|', i); } };

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');

// buildReco를 직접 호출할 수 없으니(클로저 내부), index.html의 renderResults 경로와 동일한 방식으로
// buildReco 로직을 재현해 검증한다 (buildReco는 export 안 됨 — 여기선 F 반영 여부를 동일 알고리즘으로 재확인)
function simulateBuildReco(res) {
  const j1 = M.jdnOf(res.y1, 1, 1), j2 = M.jdnOf(res.y2, 12, 31);
  const flat = [];
  for (let j = j1; j <= j2; j++) {
    const dp = M.dayPillar(j);
    if (!M.dayPassesFilters(res.A, dp, res.F)) continue; // index.html의 실제 함수를 그대로 호출
    const g = M.fromJdn(j);
    const c = M.buildChart(g.y, g.m, g.d, null, res.corrected, res.ptG);
    if (res.F && res.F.noYearChung && Math.abs(res.A.yb - c.yb) === 6) continue;
    let ecSum = [0, 0, 0, 0, 0], sum = 0;
    for (let hb = 0; hb < 12; hb++) {
      const rep = hb === 0 ? 0.75 : hb * 2 + 0.5;
      const ch = M.buildChart(g.y, g.m, g.d, rep, res.corrected, res.ptG);
      const s = M.scorePair(res.A, ch, res.W, res.yong).s;
      sum += s; for (let e = 0; e < 5; e++) ecSum[e] += ch.ec[e];
    }
    if (res.F && res.F.minEl && res.F.minEl.some(x => x > 0)) {
      let okE = true;
      for (let e = 0; e < 5; e++) if (res.F.minEl[e] > 0 && Math.round(ecSum[e] / 12) < res.F.minEl[e]) { okE = false; break; }
      if (!okE) continue;
    }
    flat.push({ j, c, avg: Math.round(sum / 12) });
  }
  return flat;
}

// 1) 일간 지정: 계(9)만 지정 → 결과 전부 일간 계
{
  const res = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1996, F: { ds: 9, db: null, minEl: [0, 0, 0, 0, 0] } };
  const flat = simulateBuildReco(res);
  ok('일간 지정 → 결과 존재', flat.length > 0, flat.length);
  ok('일간 지정 → 전부 계(癸) 일간', flat.every(x => x.c.ds === 9), [...new Set(flat.map(x => x.c.ds))]);
}
// 2) 일지 지정: 묘(3)만 지정
{
  const res = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1996, F: { ds: null, db: 3, minEl: [0, 0, 0, 0, 0] } };
  const flat = simulateBuildReco(res);
  ok('일지 지정 → 결과 존재', flat.length > 0, flat.length);
  ok('일지 지정 → 전부 묘(卯) 일지', flat.every(x => x.c.db === 3), [...new Set(flat.map(x => x.c.db))]);
}
// 3) 일간+일지 = 계묘일주 지정
{
  const res = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1996, F: { ds: 9, db: 3, minEl: [0, 0, 0, 0, 0] } };
  const flat = simulateBuildReco(res);
  ok('계묘일주 지정 → 전부 계묘', flat.length > 0 && flat.every(x => x.c.ds === 9 && x.c.db === 3), flat.length);
}
// 4) 오행 최소 개수: 수(水,4) 5개 이상 (매우 까다로운 조건 — 결과 줄어드는지, 통과분은 실제 수 개수 충족하는지)
{
  const F0 = { ds: null, db: null, minEl: [0, 0, 0, 0, 0] };
  const F5 = { ds: null, db: null, minEl: [0, 0, 0, 0, 5] };
  const res0 = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1992, F: F0 };
  const res5 = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1992, F: F5 };
  const flat0 = simulateBuildReco(res0), flat5 = simulateBuildReco(res5);
  ok('오행 최소개수 필터로 결과 감소', flat5.length < flat0.length, flat0.length + ' → ' + flat5.length);
  console.log('  수5개+ 통과 날짜 수:', flat5.length, '/ 무필터:', flat0.length);
}
// 5) 배제 조건: 내 일지(미,7)와 충인 일지(축,1) 제외
{
  const resBase = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1996, F: { ds: null, db: null, minEl: [0, 0, 0, 0, 0] } };
  const resEx = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1988, y2: 1996, F: { ds: null, db: null, minEl: [0, 0, 0, 0, 0], noIljiChung: true } };
  const flatBase = simulateBuildReco(resBase), flatEx = simulateBuildReco(resEx);
  ok('충 일지 배제 시 결과 감소', flatEx.length < flatBase.length, flatBase.length + ' → ' + flatEx.length);
  ok('배제 후 결과에 충 일지(축) 없음', !flatEx.some(x => x.c.db === 1), [...new Set(flatEx.map(x => x.c.db))]);
}
// 6) 존재하지 않는 일주 조합(음양 불일치)은 결과 0
{
  const res = { A, corrected: true, ptG: 'F', W: null, yong: 4, y1: 1990, y2: 1992, F: { ds: 9, db: 2, minEl: [0, 0, 0, 0, 0] } }; // 계인 — 존재 불가
  const flat = simulateBuildReco(res);
  ok('불가능 일주 지정 → 0건', flat.length === 0, flat.length);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
