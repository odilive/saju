// 신강약·용신·대운·세운 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const module_ = { exports: {} };
new Function('module', src)(module_);
const M = module_.exports;

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, '|', info === undefined ? '' : JSON.stringify(info)); }
};

// ── 1) 신강약: 극단 케이스
// 갑목 일간 + 인월(득령) + 비겁·인성 우세 → 신강, 비겁 주도 → 억부용신 관성(금)
{
  const c = { ds: 0, db: 0, ys: 0, yb: 0, ms: 2, mb: 2, hs: null, hb: null };
  const an = M.analyzeChart(c);
  ok('신강 판정 (갑목 인월 비겁우세)', an.verdict === 'strong', an);
  ok('득령 감지', an.deukryeong === true);
  ok('비겁 주도 신강 → 억부용신 금(관성)', an.eokbu === 3, M.EL[an.eokbu]);
}
// 갑목 일간 + 온통 토(재성) → 신약, 재성 과다 → 억부용신 목(비겁)
{
  const c = { ds: 0, db: 7, ys: 4, yb: 1, ms: 4, mb: 10, hs: null, hb: null }; // 술월(토)
  const an = M.analyzeChart(c);
  ok('신약 판정 (재성 과다)', an.verdict === 'weak', an.r);
  ok('재성 과다 신약 → 억부용신 목(비겁)', an.eokbu === 0, M.EL[an.eokbu]);
  ok('실령 감지', an.deukryeong === false);
}
// ── 2) 조후: 겨울생 → 화, 여름생 → 수, 봄생 → 없음
{
  const mk = mb => M.analyzeChart({ ds: 0, db: 0, ys: 0, yb: 0, ms: 2, mb, hs: null, hb: null });
  ok('갑 자월(겨울) 조후 = 화', mk(0).johu === 1);
  ok('갑 오월(여름) 조후 = 수', mk(6).johu === 4);
  ok('갑 묘월(봄) 조후 = 금(궁통보감)', mk(3).johu === 3);
}
// ── 3) 용신 세력 곡선
ok('yongScore(0) = 0', M.yongScore(0) === 0);
ok('yongScore(0.35) = 20 (적정)', M.yongScore(0.35) === 20);
ok('yongScore(0.5) = 17 (감소 시작)', M.yongScore(0.5) === 17, M.yongScore(0.5));
ok('yongScore(0.8) = 8 (과다)', M.yongScore(0.8) === 8);
{
  let mono = true, prev = -1;
  for (let r = 0; r <= 0.3; r += 0.01) { const v = M.yongScore(r); if (v < prev) mono = false; prev = v; }
  ok('0~0.3 구간 단조 증가', mono);
}
// ── 4) elemRatio: 전체 합 = 1, 극단 사주
{
  const A = M.buildChart(1990, 3, 15, 10, true, 'M');
  let sum = 0; for (let e = 0; e < 5; e++) sum += M.elemRatio(A, e);
  ok('elemRatio 합계 = 1', Math.abs(sum - 1) < 1e-9, sum);
  const allWater = { ds: 8, db: 0, ys: 8, yb: 0, ms: 8, mb: 0, hs: 9, hb: 11 };
  ok('전부 수(水) 사주 → 수 비중 100%', M.elemRatio(allWater, 4) === 1);
  const b3 = { ys: 8, ms: 2, ds: 0, hs: 2, yb: 2, mb: 0, db: 2, hb: 2 }; // 수 = 월지30+년간7 = 37/102
  const r = M.elemRatio(b3, 4);
  ok('월지 수 사주 → 수 비중 ≈ 36%', Math.abs(r - 37 / 102) < 1e-9, r);
  ok('그 비중의 용신 점수 = 20 (적정)', M.yongScore(r) === 20);
}
// ── 5) 대운: 방향·대운수·첫 대운
{
  const male = M.buildChart(1990, 3, 4, 12, true, 'M');   // 경오년(양간) 남 → 순행
  const dwM = M.daewoonOf(male, 'M');
  ok('양간년 남성 → 순행', dwM.forward === true);
  ok('경칩 직전 출생 순행 → 대운수 1', dwM.su === 1, dwM.su);
  ok('무인월 → 첫 대운 기묘', dwM.seq[0].s === 5 && dwM.seq[0].b === 3,
    M.ST[dwM.seq[0].s] + M.BR[dwM.seq[0].b]);
  const dwF = M.daewoonOf(male, 'F'); // 양간년 여 → 역행
  ok('양간년 여성 → 역행', dwF.forward === false);
  ok('입춘에서 약 28일 지남 역행 → 대운수 9', dwF.su === 9, dwF.su);
  ok('역행 첫 대운 정축', dwF.seq[0].s === 3 && dwF.seq[0].b === 1,
    M.ST[dwF.seq[0].s] + M.BR[dwF.seq[0].b]);
  ok('대운수 범위 1~10', dwM.seq.every((s, i) => s.startYear === 1990 + dwM.su + i * 10));
}
// ── 6) 타임라인: 창 안 채움 + 순풍/역풍 태그
{
  const A = M.buildChart(1990, 3, 15, 10, true, 'M');
  const tl = M.timelineFor(A, 'M', 4, M.CUR_YEAR, 30); // 용신 수
  ok('타임라인 셀 존재', tl.cells.length > 0);
  ok('셀이 창 범위 내', tl.cells.every(c => c.from >= M.CUR_YEAR && c.to <= M.CUR_YEAR + 29));
  let cover = 0; tl.cells.forEach(c => cover += c.to - c.from + 1);
  ok('30년 창 연속 채움', cover === 30, cover);
  const wa = M.windByYear(tl.cells, M.CUR_YEAR, 30);
  ok('풍향 태그 3종 이내', wa.every(w => ['good', 'bad', 'mid'].includes(w)));
  // 수(4)가 용신일 때: 수/금 지지 대운 = 순풍, 토 지지 = 역풍
  const goodOk = tl.cells.every(c => c.pre || (c.wind === 'good') === ([4, 3].includes([4,2,0,0,2,1,1,2,3,3,2,4][c.b])));
  ok('순풍 = 수·금 지지 대운', goodOk);
}
// ── 7) 세운: 유리한 해 구조 검증
{
  const A = M.buildChart(1990, 3, 15, 10, true, 'M');
  const B = M.buildChart(1993, 8, 20, 14, true, 'F');
  const ys = M.marriageYears(A, B);
  ok('성사 유리 해 ≤ 3개', ys.length <= 3);
  ok('해 범위·신호 개수 유효', ys.every(m => m.Y >= M.CUR_YEAR && m.Y < M.CUR_YEAR + 8 && m.n >= 2), ys);
}
// ── 8) 용신 반영 점수: 근거 문자열 + 검색 통합
{
  const A = M.buildChart(1990, 3, 15, 10, true, 'M');
  const B = M.buildChart(1992, 12, 1, 2, true, 'F');
  const withY = M.scorePair(A, B, null, 4);
  const noY = M.scorePair(A, B, null, null);
  ok('용신 지정 시 용신 근거 표시', withY.R.some(x => x.t.includes('용신')), withY.R.map(x => x.t));
  ok('용신 미지정 시 용신 근거 없음', !noY.R.some(x => x.t.includes('용신')));
  const { keep, count } = M.searchCandidates(A, 1990, 1992, 'F', null, null, 4);
  ok('용신 검색 실행', count > 0 && keep.length > 0);
  const c0 = M.candidateChart(keep[0], 'F', true);
  ok('검색-재계산 점수 일치(용신)', M.scorePair(A, c0, null, 4).s === keep[0].s,
    M.scorePair(A, c0, null, 4).s + ' vs ' + keep[0].s);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
