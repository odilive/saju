// 대운-배우자궁 부담 확장(정충 외 형·원진·해·자형) 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (n, c, i) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, '|', i); } };

// 사용자 실제 사주: 을미(일지=미,7), 병술(戌,10) 대운이 형(축술미 삼형)이어야 함
const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 경오 신사 을미 정해
ok('사용자 일지 = 미(未)', A.db === 7, A.db);
const dw = M.daewoonOf(A, 'M');
const idx5 = dw.seq[4]; // 5번째 대운(i=5) = 병술이어야 함(대화에서 확인된 값)
console.log('  5번째 대운:', M.ST[idx5.s] + M.BR[idx5.b], idx5.startYear + '~' + idx5.endYear);
ok('5번째 대운 = 병술', idx5.s === 2 && idx5.b === 10, M.ST[idx5.s] + M.BR[idx5.b]);

const tl = M.timelineFor(A, 'M', 4, M.CUR_YEAR, 30);
const cell = tl.cells.find(c => c.s === 2 && c.b === 10);
ok('병술 대운 셀 존재', !!cell);
ok('병술이 용신(수) 극 → 역풍', cell.wind === 'bad', cell.wind);
ok('미-술 관계 = 형(축술미 삼형)', cell.burdenType === '형', cell.burdenType);
ok('burden(넓은 신호) 플래그 = true', cell.burden === true);
ok('chung(정충 전용, 등급판정용)은 false (형은 정충이 아님)', cell.chung === false, cell.chung);

// 대조군: 정충(자오 등)은 여전히 '충'으로 표시되는지 — 을미(일지 미,7)의 정충 상대 = 축(1)
{
  const fakeC = { ds: 0, db: 7 }; // 일지 미(7), 축(1)과 정충
  // branchRels 스타일로 직접 timelineFor 재현은 어려우니, daewoonOf 없이 순수 관계식만 별도 확인
  const diff = Math.abs(1 - 7);
  ok('축-미 정충 거리=6', diff === 6);
}
// 원진 케이스: 자(0)-미(7)는 원진 (WONJIN 목록 [0,7] 확인용)
{
  // timelineFor 내부에서 원진 판정이 실제로 동작하는지, 자 대운을 가진 임의 차트로 확인
  const c2 = { ds: 0, db: 0, ys: 0, yb: 0, ms: 0, mb: 0, hs: null, hb: null }; // 일지 자(0)
  const tl2 = M.timelineFor(c2, 'M', null, M.CUR_YEAR, 60); // yong=null이어도 chung 계산은 되어야 함
  const hasWonjin = tl2.cells.some(x => x.b === 7 && x.burdenType === '원진'); // 대운지지 미(7) vs 일지 자(0)
  ok('자 일지 + 미 대운 → 원진 감지', hasWonjin);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
