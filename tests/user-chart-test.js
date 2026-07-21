// 사용자 실제 사주 검증: 양력 1990-05-30 22:30 → 경오 신사 을미 정해
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

const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 22:30, 30분 보정
const gz = (s, b) => M.ST[s] + M.BR[b];
console.log('계산된 사주:', gz(A.ys, A.yb) + '년', gz(A.ms, A.mb) + '월', gz(A.ds, A.db) + '일', gz(A.hs, A.hb) + '시');
ok('년주 = 경오', gz(A.ys, A.yb) === '경오', gz(A.ys, A.yb));
ok('월주 = 신사', gz(A.ms, A.mb) === '신사', gz(A.ms, A.mb));
ok('일주 = 을미', gz(A.ds, A.db) === '을미', gz(A.ds, A.db));
ok('시주 = 정해', gz(A.hs, A.hb) === '정해', gz(A.hs, A.hb));

// 신강약 · 용신 분석
const an = M.analyzeChart(A);
const pct = Math.round(an.r * 100);
console.log('\n신강약:', an.verdict, '(돕는 세력 ' + pct + '%)', '득령:', an.deukryeong);
console.log('세력 분포:', ['비겁', '식상', '재성', '관성', '인성'].map((n, i) => n + ' ' + Math.round(an.gs[i] / an.total * 100) + '%').join(' · '));
console.log('억부용신:', M.EL[an.eokbu], '—', an.eokbuWhy);
console.log('조후용신:', an.johu != null ? M.EL[an.johu] : '없음', '—', an.johuWhy);
ok('을목·사월 → 신약 판정', an.verdict === 'weak', an.verdict + ' r=' + an.r.toFixed(2));
ok('식상(화) 과다 → 억부용신 수(인성)', an.eokbu === 4, M.EL[an.eokbu]);
ok('여름생 → 조후용신 수', an.johu === 4);
ok('억부·조후 일치 (신뢰도 높음 케이스)', an.eokbu === an.johu);

// 새 배점: 점수 분포 확인 (용신 수 적용, 1988~1996년생)
const { keep, count } = M.searchCandidates(A, 1988, 1996, 'F', null, null, 4);
const seen = new Set(); const top = [];
for (const k of keep) { if (!seen.has(k.j)) { seen.add(k.j); top.push(k); if (top.length >= 30) break; } }
const scores = top.map(t => t.s);
console.log('\n상위 30 점수:', scores.join(', '));
const distinct = new Set(scores).size;
ok('상위 30에 서로 다른 점수 ≥ 5종 (100점 인플레 해소)', distinct >= 5, distinct + '종');
ok('만점 후보 3개 이하', scores.filter(s => s === 100).length <= 3, scores.filter(s => s === 100).length + '개');

// 상위 3개 상세
console.log('\n상위 3:');
for (let i = 0; i < 3; i++) {
  const c = M.candidateChart(top[i], 'F', true);
  const r = M.scorePair(A, c, null, 4);
  console.log(`#${i + 1}`, `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`,
    M.hourLabel(c.hb, true), [gz(c.ys, c.yb), gz(c.ms, c.mb), gz(c.ds, c.db), gz(c.hs, c.hb)].join(' '), r.s + '점');
  for (const it of r.R) console.log('   ', (it.p >= 0 ? '+' : '') + it.p, it.t);
}

console.log('\n결과: ' + pass + ' 통과, ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
