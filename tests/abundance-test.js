// 오행 '많음' 판정 = 순수 자리 세력(elemRatio) + 월지 가중치 20
// 핵심: 월지 1글자만으로는 만점(20점)이 나지 않고, 여러 글자여야 높다. 과다는 감점.
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
const A = M.buildChart(1990, 5, 30, 22.5, true, 'M'); // 용신 수(水)

console.log('=== 1994-12-10 12시진별 용신점수 (월지 20 적용) ===');
for (let hb = 0; hb < 12; hb++) {
  const rep = hb === 0 ? 0.75 : hb * 2 + 0.5;
  const ch = M.buildChart(1994, 12, 10, rep, true, 'F');
  const yr = M.elemRatio(ch, 4);
  const r = M.scorePair(A, ch, null, 4);
  const item = r.R.find(x => x.t.includes('용신('));
  console.log('  시진', String(hb).padStart(2), M.ST[ch.hs]+M.BR[ch.hb],
    '| 수글자:', M.elemCount(ch, 4), '| 세력:', Math.round(yr*100)+'%',
    '| 용신점수:', item ? item.p : 0, '| 총점:', r.s);
}

console.log('\n곡선(순수 세력): yongScore  월지1글자(~22%)=', M.yongScore(0.22),
  '/ 2글자(~30%)=', M.yongScore(0.30), '/ 3글자(~40%)=', M.yongScore(0.40),
  '/ 과다(~70%)=', M.yongScore(0.70));

// --- 자동 판정 ---
let pass=0, fail=0;
const ok=(n,c,i)=>{ if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,'|',i);} };

// 수가 월지 1글자뿐인 사주 → 세력 ~22% → 만점 아님
const b1 = { ys: 0, ms: 2, ds: 0, hs: 2, yb: 2, mb: 0, db: 2, hb: 1 }; // 수 = 자(월지)뿐
ok('월지 1글자뿐 → elemCount=1', M.elemCount(b1,4)===1, M.elemCount(b1,4));
ok('월지 1글자뿐 → 세력 30% 미만', M.elemRatio(b1,4) < 0.30, M.elemRatio(b1,4));
ok('월지 1글자뿐 → 용신점수 만점 미만', M.yongScore(M.elemRatio(b1,4)) < 20, M.yongScore(M.elemRatio(b1,4)));

// 수가 월지+년간 2글자 → 세력 ~29% → 곡선상 만점 근처
const b2 = { ys: 8, ms: 2, ds: 0, hs: 2, yb: 2, mb: 0, db: 2, hb: 2 };
ok('2글자(월지+년간) → elemCount=2', M.elemCount(b2,4)===2, M.elemCount(b2,4));
ok('2글자 → 용신점수 20(만점)', M.yongScore(M.elemRatio(b2,4))===20, M.yongScore(M.elemRatio(b2,4)));

// 과다(전부 수)는 감점되어 20 미만
ok('과다(전부 수)는 20 미만', M.yongScore(M.elemRatio({ds:8,db:0,ys:8,yb:0,ms:8,mb:0,hs:9,hb:11},4))<20);

// 월지 가중치가 실제로 20인지(FULL_W 확인): 월지 1글자 세력 = 20/(총 present 가중)
ok('월지 1글자 세력 = 20/92', Math.abs(M.elemRatio(b1,4) - 20/92) < 1e-9, M.elemRatio(b1,4));

console.log('\n결과: '+pass+' 통과, '+fail+' 실패');
process.exit(fail?1:0);
