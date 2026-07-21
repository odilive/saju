// 조후 축 검증: 궁통보감 조후용신표(120칸, 출처: 한문성명학 카페 조후용신표) 대조
const fs = require('fs');
const html = fs.readFileSync('d:/saju/index.html', 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const M = m.exports;

const S = { 갑: 0, 을: 1, 병: 2, 정: 3, 무: 4, 기: 5, 경: 6, 신: 7, 임: 8, 계: 9 };
const B = { 자: 0, 축: 1, 인: 2, 묘: 3, 진: 4, 사: 5, 오: 6, 미: 7, 신: 8, 유: 9, 술: 10, 해: 11 };
const SE = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 목화토금수
const ELN = ['목', '화', '토', '금', '수'];

// 궁통보감 조후용신표: TABLE[일간][월지] = [용신 천간들] (첫 글자가 주용신)
const RAW = {
  갑: { 인: '병계', 묘: '경병정', 진: '경정임', 사: '계정경', 오: '계정경', 미: '계정경', 신: '경정임', 유: '경정병', 술: '경계정', 해: '경정병', 자: '정경병', 축: '정경병' },
  을: { 인: '병계', 묘: '병계', 진: '계병무', 사: '계경신', 오: '계병', 미: '계병', 신: '병계기', 유: '계병정', 술: '계신', 해: '병무', 자: '병', 축: '병' },
  병: { 인: '임경', 묘: '임기', 진: '임갑', 사: '임경계', 오: '임경', 미: '임경', 신: '임무', 유: '임계', 술: '갑임계', 해: '갑무경임', 자: '임무기', 축: '임갑' },
  정: { 인: '갑경', 묘: '경갑', 진: '갑경', 사: '갑경', 오: '임경계', 미: '갑임경', 신: '갑경병무', 유: '갑경병무', 술: '갑경무', 해: '갑경', 자: '갑경', 축: '갑경' },
  무: { 인: '병갑계', 묘: '병갑계', 진: '갑병계', 사: '갑병계', 오: '임갑병', 미: '계갑병', 신: '병갑계', 유: '병계', 술: '갑병계', 해: '갑병', 자: '병갑', 축: '병갑' },
  기: { 인: '병계갑', 묘: '갑병계', 진: '병갑계', 사: '계병', 오: '계병', 미: '계병', 신: '병계', 유: '병계', 술: '갑병계', 해: '병갑무', 자: '병갑무', 축: '병갑무' },
  경: { 인: '무갑임병정', 묘: '정갑병경', 진: '갑정임계', 사: '임무병정', 오: '임계', 미: '정갑', 신: '정갑', 유: '정갑병', 술: '갑임', 해: '정병', 자: '정갑병', 축: '병정갑' },
  신: { 인: '기임경', 묘: '임갑', 진: '임갑', 사: '임갑계', 오: '임기계', 미: '임경갑', 신: '임갑무', 유: '임갑', 술: '임병', 해: '임병', 자: '병무임갑', 축: '병임무기' },
  임: { 인: '경병무', 묘: '무신경', 진: '갑경', 사: '임경신계', 오: '계경신', 미: '신갑계', 신: '무정', 유: '갑경', 술: '갑병', 해: '무병경', 자: '무병', 축: '병정갑' },
  계: { 인: '신병', 묘: '경신', 진: '병신갑', 사: '신경', 오: '경신임계', 미: '경신임계', 신: '정갑', 유: '신병', 술: '신갑임계', 해: '경신무정', 자: '병신', 축: '병정' },
};

const SUMMER = ['사', '오', '미'], WINTER = ['해', '자', '축'];
let sPrimary = 0, sInclude = 0, wPrimary = 0, wInclude = 0;
const sMiss = [], wMiss = [];
for (const [dg, months] of Object.entries(RAW)) {
  for (const [mo, cell] of Object.entries(months)) {
    const cellElems = [...cell].map(ch => SE[S[ch]]);
    void cellElems; void SUMMER; void WINTER; void sPrimary; void wPrimary; void sInclude; void wInclude; void sMiss; void wMiss;
  }
}
// 정밀화 후: 엔진의 조후 용신이 궁통보감 표의 주용신(각 칸 첫 글자)과 정확히 일치하는지 120칸 전수 검증
let match = 0, total = 0;
const mismatches = [];
for (const [dg, months] of Object.entries(RAW)) {
  for (const [mo, cell] of Object.entries(months)) {
    const expect = SE[S[[...cell][0]]];               // 표 주용신 오행
    const c = { ds: S[dg], db: 0, ys: 0, yb: 0, ms: 0, mb: B[mo], hs: null, hb: null };
    const got = M.analyzeChart(c).johu;
    total++;
    if (got === expect) match++;
    else mismatches.push(dg + '일간 ' + mo + '월: 표 ' + M.EL[expect] + ' vs 엔진 ' + M.EL[got]);
  }
}
console.log('=== 궁통보감 조후용신표 120칸 전수 대조 (정밀화 후) ===');
console.log('엔진 조후 용신 = 표 주용신:', match + '/' + total, '(' + Math.round(match / total * 100) + '%)');
if (mismatches.length) { console.log('불일치:'); mismatches.forEach(x => console.log('  ' + x)); }
console.log(match === total ? '\n결과: 120 통과, 0 실패' : '\n결과: ' + match + ' 통과, ' + (total - match) + ' 실패');
process.exit(match === total ? 0 : 1);
