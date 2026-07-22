// 개인 배우자운(원국 단독, 상대 무관) 검증 — 무재/무관, 재성혼잡/관살혼잡, 일지 자체 형충
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (n, c, i) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, '|', JSON.stringify(i)); } };

// ── spouseElemOf: 남명 을목(SE=0) → 토(2, 재성) / 여명 을목 → 금(3, 관성)
ok('남명 배우자성 = 재성(토)', M.spouseElemOf({ ds: 1, g: 'M' }) === 2);
ok('여명 배우자성 = 관성(금)', M.spouseElemOf({ ds: 1, g: 'F' }) === 3);

// ── 무재(無財): 을목 남명, 원국 어디에도 토(재성)가 없음
{
  // 을(1) 일간, 년간 갑(0,목) 월간 정(3,화) 시간 신(7,금) / 년지 인(2,목) 월지 사(5,화) 일지 유(9,금) 시지 술(10,토!!) → 실수 방지, 토 전혀 없게 재구성
  const c = { ds: 1, g: 'M', ys: 0, ms: 3, hs: 7, yb: 2, mb: 5, db: 9, hb: 8 }; // 목화금+목화금신(申,금) — 토 없음
  const notes = M.personalMarriageNote(c);
  ok('무재 감지', notes.some(x => x.kind === 'nospouse'), notes);
}
// ── 재성 충실: 을목 남명, 토(재성) 하나 있음 → 무재 아님
{
  const c = { ds: 1, g: 'M', ys: 0, ms: 4, hs: 7, yb: 2, mb: 5, db: 9, hb: 8 }; // ms=무(4,토) 하나
  const notes = M.personalMarriageNote(c);
  ok('재성 하나 있으면 무재 아님', !notes.some(x => x.kind === 'nospouse'), notes);
}
// ── 재성혼잡(남명): 정재+편재 동시 천간 투출 — 갑(0,양목) 일간, 재성=토(2). 무(4,양토)=편재, 기(5,음토)=정재
{
  const c = { ds: 0, g: 'M', ys: 4, ms: 5, hs: 2, yb: 0, mb: 1, db: 3, hb: 4 };
  const notes = M.personalMarriageNote(c);
  ok('재성 혼잡 감지(정+편 동시 투출)', notes.some(x => x.kind === 'honjap'), notes);
}
// ── 혼잡 아님: 편재만 있음(무만 투출, 기는 없음)
{
  const c = { ds: 0, g: 'M', ys: 4, ms: 6, hs: 2, yb: 0, mb: 1, db: 3, hb: 4 };
  const notes = M.personalMarriageNote(c);
  ok('편재만 있으면 혼잡 아님', !notes.some(x => x.kind === 'honjap'), notes);
}
// ── 일지 자체 충: db=자(0) vs mb=오(6) diff=6
{
  const clash = M.iljiSelfClash(0, 3, 6, null);
  ok('일지-월지 diff6 → 충', clash && clash.type === '충', clash);
}
// ── 일지 자체 형: db=인(2) vs mb=사(5) → HYUNG pset에 [2,5] 포함(인사신 삼형), diff=3이라 충은 아님
{
  const clash = M.iljiSelfClash(2, 0, 5, null);
  ok('일지-월지 인사 → 형', clash && clash.type === '형', clash);
}
// ── 충이 형보다 우선 표시
{
  // db=자(0): mb=오(6)=충, yb 자체는 무관 값으로 형 유발 없게
  const clash = M.iljiSelfClash(0, 2, 6, null);
  ok('충과 형 동시 가능성 있어도 충 우선', clash.type === '충', clash);
}
// ── 형충 없음 → null
{
  const clash = M.iljiSelfClash(0, 2, 4, 8); // 자(0) vs 인(2)/진(4)/신(8) — 형충 없음
  ok('형충 관계 없으면 null', clash === null, clash);
}
// ── hb 없이(시간 모름)도 년지·월지만으로 판정
{
  const clash = M.iljiSelfClash(0, 3, 6, null);
  ok('시간 모름(hb=null)이어도 년지·월지로 판정', clash !== null, clash);
}
// ── 아무 특이사항 없는 원국 → 빈 배열
{
  // 갑목 남명(ds=0), 재성(토,2)은 ys=무(4)만 있어 편재 단독(혼잡 아님) → 무재 아님
  // db=인(2) vs yb자(0)/mb유(9)/hb해(11): diff 2/7/9로 형충 없음(형 pset엔 [2,5][2,8]만 있어 무관)
  const c2 = { ds: 0, g: 'M', ys: 4, ms: 6, hs: 8, yb: 0, mb: 9, db: 2, hb: 11 };
  const notes = M.personalMarriageNote(c2);
  ok('특이사항 없으면 빈 배열', notes.length === 0, notes);
}

// ── 필터 통합: searchCandidates에서 noIljiSelfClash 켜면 결과 감소 + 생존 후보는 실제로 형충 없음
{
  const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');
  const F0 = { ds: null, db: null, minEl: [0, 0, 0, 0, 0] };
  const F1 = { ds: null, db: null, minEl: [0, 0, 0, 0, 0], noIljiSelfClash: true };
  const r0 = M.searchCandidates(A, 1988, 1996, 'F', F0, null, 4);
  const r1 = M.searchCandidates(A, 1988, 1996, 'F', F1, null, 4);
  ok('일지자체형충 배제 시 후보 감소', r1.count < r0.count, r0.count + ' → ' + r1.count);
  const seen = new Set(); let checked = 0, violated = 0;
  for (const k of r1.keep) {
    if (seen.has(k.j)) continue; seen.add(k.j);
    const c = M.candidateChart(k, 'F', true);
    if (M.iljiSelfClash(c.db, c.yb, c.mb, null)) violated++;
    checked++;
    if (checked >= 100) break;
  }
  ok('배제 활성 시 생존 후보 중 형충 없음(샘플 검사)', violated === 0, { checked, violated });
}

console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
