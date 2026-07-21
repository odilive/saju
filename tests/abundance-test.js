const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;
const A = M.buildChart(1990, 5, 30, 22.5, true, 'M');

console.log('=== 수정 후: 1994-12-10 12시진별 용신점수 ===');
for (let hb = 0; hb < 12; hb++) {
  const rep = hb === 0 ? 0.75 : hb * 2 + 0.5;
  const ch = M.buildChart(1994, 12, 10, rep, true, 'F');
  const yr = M.elemAbundance(ch, 4);
  const r = M.scorePair(A, ch, null, 4);
  const item = r.R.find(x => x.t.includes('용신('));
  console.log('  시진', String(hb).padStart(2), M.ST[ch.hs]+M.BR[ch.hb],
    '| 수개수:', ch.ec[4], '| 혼합지표:', Math.round(yr*100)+'%',
    '| 용신점수:', item ? item.p : 0, '| 총점:', r.s);
}
console.log('\n=== 대조: 수를 여러 글자(4개) 가진 상대는 여전히 높은가? ===');
// 임의로 수 4글자 사주
const waterRich = M.buildChart(1992, 12, 1, 0.75, true, 'F'); // 겨울 자시 등 수 많을 가능성
console.log('  ', M.ST[waterRich.ys]+M.BR[waterRich.yb], M.ST[waterRich.ms]+M.BR[waterRich.mb], M.ST[waterRich.ds]+M.BR[waterRich.db], M.ST[waterRich.hs]+M.BR[waterRich.hb],
  '| 수개수:', waterRich.ec[4], '| 혼합지표:', Math.round(M.elemAbundance(waterRich,4)*100)+'%',
  '| 용신점수:', M.yongScore(M.elemAbundance(waterRich,4)));
console.log('\n곡선 확인: yongScore(수1글자월지 ~21%)=', M.yongScore(0.21), '/ (2글자 ~32%)=', M.yongScore(0.32), '/ (3글자 ~40%)=', M.yongScore(0.40), '/ (4글자 ~48%)=', M.yongScore(0.48), '/ (과다 ~70%)=', M.yongScore(0.70));

// --- 자동 판정 ---
let pass=0, fail=0;
const ok=(n,c,i)=>{ if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,'|',i);} };
const A2 = M.buildChart(1990,5,30,22.5,true,'M');
// 수 1글자(월지만)인 시진과 수 4글자 상대 비교
const c1 = M.buildChart(1994,12,10,3.75,true,'F'); // 축~인시대 근처(수 1글자)
ok('수 1글자 → elemCount=1', M.elemCount(c1,4)===1, M.elemCount(c1,4));
ok('수 1글자 → 용신점수 12 미만', M.yongScore(M.elemAbundance(c1,4))<12, M.yongScore(M.elemAbundance(c1,4)));
const rich = M.buildChart(1992,12,1,0.75,true,'F');
ok('수 여러 글자 상대는 elemCount 큼(≥3)', M.elemCount(rich,4)>=3, M.elemCount(rich,4));
ok('수 여러 글자 → 용신점수 높음(≥18)', M.yongScore(M.elemAbundance(rich,4))>=18, M.yongScore(M.elemAbundance(rich,4)));
ok('과다(전부 수)는 감점되어 20 미만', M.yongScore(M.elemAbundance({ds:8,db:0,ys:8,yb:0,ms:8,mb:0,hs:9,hb:11},4))<20);
console.log('\n결과: '+pass+' 통과, '+fail+' 실패');
process.exit(fail?1:0);
