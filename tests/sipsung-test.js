// 십성 정/편 세분화 + 배우자성 공급 검증
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, '|', info); } };
const has = (r, kw) => r.R.some(x => x.t.includes(kw));

// 일간별 십성 판정 (지지/오행은 중립적으로 채워 십성만 격리)
const mk = (ds, g) => ({ ds, db: 1, ys: ds, yb: 1, ms: ds, mb: 1, hs: ds, hb: 1, g, ec: [1, 1, 1, 1, 1] });
// A = 갑(0, 양목) 남성 기준
const A = mk(0, 'M');

// 정인: 상대가 나를 생(수→목), 음양 다름 → 계수(9, 음). 갑(양)-계(음) 다름 → 정인
ok('정인 판정', has(M.scorePair(A, mk(9, 'F')), '정인'), M.scorePair(A, mk(9, 'F')).R.map(x => x.t));
// 편인: 임수(8, 양). 갑(양)-임(양) 같음 → 편인
ok('편인 판정', has(M.scorePair(A, mk(8, 'F')), '편인'));
// 식신: 내가 생(목→화), 음양 같음 → 병화(2, 양). 갑(양)-병(양) 같음 → 식신
ok('식신 판정', has(M.scorePair(A, mk(2, 'F')), '식신'));
// 상관: 정화(3, 음). 갑(양)-정(음) 다름 → 상관
ok('상관 판정', has(M.scorePair(A, mk(3, 'F')), '상관'));
// 정재(남): 내가 극(목→토), 음양 다름 → 기토(5, 음). 단 갑-기는 천간합! → 천간합이 우선
ok('갑기 천간합 우선', has(M.scorePair(A, mk(5, 'F')), '천간합'));
// 편재(남): 무토(4, 양). 갑(양)-무(양) 같음 → 편재
ok('편재 판정(남)', has(M.scorePair(A, mk(4, 'F')), '편재'));
// 정관(여A): 여성이 극당함. A=갑 여성, 상대 경금(6,양)이 갑을 극. 갑(양)-경(양) 같음 → 편관
{ const Af = mk(0, 'F'); ok('편관 판정(여)', has(M.scorePair(Af, mk(6, 'M')), '편관')); }
{ const Af = mk(0, 'F'); ok('정관 판정(여)', has(M.scorePair(Af, mk(7, 'M')), '정관')); } // 신금(7,음), 갑(양)-신(음) 다름 → 정관
// 비견: 갑-갑 같음 → 비견
ok('비견 판정', has(M.scorePair(A, mk(0, 'F')), '비견'));
// 겁재: 을목(1,음), 갑(양)-을(음) 다름 → 겁재
ok('겁재 판정', has(M.scorePair(A, mk(1, 'F')), '겁재'));

// 정 > 편 점수 (정인 > 편인)
const jIn = M.scorePair(A, mk(9, 'F')).R.find(x => x.t.includes('정인')).p;
const pIn = M.scorePair(A, mk(8, 'F')).R.find(x => x.t.includes('편인')).p;
ok('정인 > 편인 점수', jIn > pIn, jIn + ' vs ' + pIn);

// 배우자성 공급: 남 갑목 → 재성 토. 토 많은 상대는 배우자성 충실
{
  const rich = { ds: 6, db: 1, ys: 4, yb: 10, ms: 5, mb: 7, hs: 4, hb: 4, g: 'F', ec: [0, 0, 7, 1, 0] }; // 토 다수
  const poor = { ds: 6, db: 0, ys: 8, yb: 0, ms: 9, mb: 11, hs: 8, hb: 0, g: 'F', ec: [0, 0, 0, 1, 7] }; // 수 다수, 토 거의 없음
  ok('배우자성 충실 감지', has(M.scorePair(A, rich, null, null), '배우자성') && M.scorePair(A, rich).R.some(x => x.t.includes('배우자성') && x.p > 0));
  ok('배우자성 미약 감지', M.scorePair(A, poor).R.some(x => x.t.includes('배우자성') && x.p < 0), M.scorePair(A, poor).R.filter(x => x.t.includes('배우자성')).map(x => x.p + x.t));
}
console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
