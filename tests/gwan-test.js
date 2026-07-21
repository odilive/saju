// 관성 과다 감점 검증 — 사용자(신약 을목, 용신 수) 기준
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

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 경오 신사 을미 정해, 남성

// 문제의 기존 1위: 1991-12-26 진시 (신미 경자 경오 경진 — 천간 4금)
const Bmetal = M.buildChart(1991, 12, 26, 8, true, 'F');
console.log('금 과다 후보:', gz(Bmetal.ys, Bmetal.yb), gz(Bmetal.ms, Bmetal.mb), gz(Bmetal.ds, Bmetal.db), gz(Bmetal.hs, Bmetal.hb));
console.log('  금 세력:', Math.round(M.elemRatio(Bmetal, 3) * 100) + '%', '/ 수 세력:', Math.round(M.elemRatio(Bmetal, 4) * 100) + '%');
const r = M.scorePair(A, Bmetal, null, 4);
console.log('  새 점수:', r.s, '점 (기존 96점)');
for (const it of r.R) console.log('   ', (it.p >= 0 ? '+' : '') + it.p, it.t);
ok('금 과다 후보 점수 하락 (96 미만)', r.s < 96, r.s);
ok('관성 과다 감점 근거 표시', r.R.some(x => x.t.includes('관성') && x.p < 0));
ok('희신(금) 보너스 제거됨', !r.R.some(x => x.t.includes('희신')));

// 신강한 사람에게는 관성 과다 감점이 적용되지 않아야 함 (관성이 오히려 용신일 수 있음)
{
  const Astrong = { ds: 0, db: 2, ys: 0, yb: 11, ms: 2, mb: 2, hs: 9, hb: 0, g: 'M' }; // 갑목 인월 신강
  Astrong.ec = [4, 1, 0, 0, 3];
  const rs = M.scorePair(Astrong, Bmetal, null, 3); // 용신 금
  ok('신강 + 용신 금 → 관성 감점 없음', !rs.R.some(x => x.t.includes('직접 극함')), rs.R.map(x => x.t).join(' / '));
}

// 새 순위 확인
const { keep } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
const seen = new Set(); const top = [];
for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 5) break; } }
console.log('\n새 상위 5:');
for (let i = 0; i < top.length; i++) {
  const c = M.candidateChart(top[i], 'F', true);
  const rr = M.scorePair(A, c, null, 4);
  const metal = Math.round(M.elemRatio(c, 3) * 100), water = Math.round(M.elemRatio(c, 4) * 100);
  console.log(`#${i + 1}`, `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`,
    M.hourLabel(c.hb, true), [gz(c.ys, c.yb), gz(c.ms, c.mb), gz(c.ds, c.db), gz(c.hs, c.hb)].join(' '),
    rr.s + '점', '(수 ' + water + '% / 금 ' + metal + '%)');
  if (i === 0) for (const it of rr.R) console.log('   ', (it.p >= 0 ? '+' : '') + it.p, it.t);
}
// 상위 5는 전부 "신약 을목 기준 금 50% 이상"이 아니어야 함
const topOk = top.every(k => { const c = M.candidateChart(k, 'F', true); return M.elemRatio(c, 3) < 0.5; });
ok('새 상위 5에 금 50%+ 후보 없음', topOk);
// 검색-표시 점수 일치 (myAn 전달 경로와 지연 계산 경로 동일성)
const c0 = M.candidateChart(top[0], 'F', true);
ok('검색-재계산 점수 일치', M.scorePair(A, c0, null, 4).s === top[0].s, M.scorePair(A, c0, null, 4).s + ' vs ' + top[0].s);

console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
