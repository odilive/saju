// 개인 '인물의 그릇' 평가(personalCharacterNote) — 원국 단독, 상대 무관, 점수 미반영
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (n, c, i) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, '|', JSON.stringify(i)); } };

// ── 극단적 편중(종격) + 무근이 함께 나타나는 케이스 (전부 토, 갑목 완전 고립)
{
  const c = { ds: 0, db: 1, ys: 4, yb: 1, ms: 4, mb: 10, hs: 4, hb: 10 }; // 갑목, 축술만
  const notes = M.personalCharacterNote(c);
  ok('종격(극단) 감지', notes.some(x => x.kind === 'extreme'), notes);
  ok('무근 감지(종세는 항상 무근 동반)', notes.some(x => x.kind === 'norooted'), notes);
}
// ── 무근만 단독(경계급 약함이나 종격 아님)
{
  const c = { ds: 1, db: 9, ys: 0, yb: 0, ms: 6, mb: 8, hs: 8, hb: 8 };
  const an = M.analyzeChart(c);
  ok('종격 아님(중간 약함)', an.jong === null, an);
  ok('무근 상태', an.rooted === false);
  const notes = M.personalCharacterNote(c);
  ok('무근만 단독 감지', notes.length === 1 && notes[0].kind === 'norooted', notes);
}
// ── 용신 자체 충족도 낮음만 단독(뿌리는 있으나 용신 오행이 원국에 거의 없음)
{
  const c = { ds: 1, db: 7, ys: 6, yb: 8, ms: 2, mb: 6, hs: 6, hb: 8 }; // 을미일주, 수 전혀 없음
  const an = M.analyzeChart(c);
  ok('용신 = 수', an.eokbu === 4, an.eokbu);
  ok('용신 원국 내 비중 10% 미만', M.elemRatio(c, an.eokbu) < 0.10, M.elemRatio(c, an.eokbu));
  const notes = M.personalCharacterNote(c);
  ok('용신 자체충족 낮음만 단독 감지', notes.length === 1 && notes[0].kind === 'noyong', notes);
}
// ── 셋 다 문제없는 원국 → 빈 배열 (사용자 실사주)
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const notes = M.personalCharacterNote(A);
  ok('특이사항 없으면 빈 배열', notes.length === 0, notes);
}
// ── 모든 노트는 tone:'caution' (인물평가는 전부 리스크 탐지 항목)
{
  const c = { ds: 0, db: 1, ys: 4, yb: 1, ms: 4, mb: 10, hs: 4, hb: 10 };
  const notes = M.personalCharacterNote(c);
  ok('모든 인물평가 노트는 caution 톤', notes.every(x => x.tone === 'caution'), notes);
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
