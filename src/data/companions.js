// 동료 (T20, T21, T25~T28, H1-1~H1-4). 파티는 나와 동료 둘까지.
// 동료는 방침대로 스스로 움직인다. 바라는 것을 세 번 거스르면 떠난다.

export const PARTY_MAX = 2;
/** 11장(모신 종)을 끝낸 사람은 동료를 셋까지 둔다 (LV-H5, GD-H6). 건너뛴 장도 끝낸 장이다. */
export const PARTY_MORE = 3;
export const PARTY_CHAPTER = 11;
export const partyMax = (state) => ([...(state.main?.done || []), ...(state.main?.past || [])].some((d) => d && d.chapter === PARTY_CHAPTER) ? PARTY_MORE : PARTY_MAX);
export const CROSS_LIMIT = 3;
export const MERC_FEE = 60; // 가온의 하루 삯. 용병마다 fee가 따로 있다 (Z94)
export const MERC_ORDER = ['gaon', 'windbow', 'stoneshield']; // 훈련소에서 교관이 소개하는 용병 (Z94)
export const ROLE_BONUS = 0.05; // 막는 사람·때리는 사람에 고치는 사람 또는 북돋는 이가 고루 있으면 모든 판정 +5% (T26, BM-C2)
export const GUARD_RATE = 0.7; // '나를 먼저'인 앞줄 동료가 대신 맞아 줄 확률

export const ROLES = { guard: '막는 사람', striker: '때리는 사람', healer: '고치는 사람', bard: '북돋는 이' }; // 북돋는 이는 구름다리부터 (GD-C3)
/** 고루 갖춘 일행 (T26, BM-C2): 막는 이와 때리는 이는 꼭, 셋째 자리는 고치는 이 또는 북돋는 이. */
export const CORE_ROLES = ['guard', 'striker'];
export const THIRD_ROLES = ['healer', 'bard'];
export const FULL_PARTY = '고루 갖춘 일행';
/** 나는 직업에 따라 센다: 사제는 고치는 사람, 전사는 막는 사람, 그 밖은 때리는 사람. */
export const myRole = (job) => (job === 'priest' ? 'healer' : job === 'warrior' ? 'guard' : 'striker');
/** 고루 갖췄으면 그 역할 셋(막는 이 · 때리는 이 · 셋째), 아니면 null. */
export function fullRoles(job, party) {
  const roles = new Set([myRole(job), ...(party || []).map((c) => COMPANIONS[c.id]?.role)]);
  const third = THIRD_ROLES.find((r) => roles.has(r));
  return CORE_ROLES.every((r) => roles.has(r)) && third ? [...CORE_ROLES, third] : null;
}
export const ROWS = { front: '앞줄', back: '뒷줄' };

/** 방침. 이름과 수는 역할마다 다르다 (H1-2). */
export const PLANS = {
  healer: [
    { id: 'half', name: '절반 아래면 치유', text: '내 생명력이 절반 아래일 때만 고친다. 아니면 조금 거든다' },
    { id: 'healonly', name: '치유만', text: '고칠 것이 있으면 늘 고친다. 치지 않는다' },
    { id: 'mefirst', name: '나를 먼저', text: '내 생명력이 조금만 줄어도 고친다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
  guard: [
    { id: 'mefirst', name: '나를 먼저', text: '내가 맞을 것을 대신 맞아 준다' },
    { id: 'together', name: '같이 친다', text: '막지 않고 함께 친다' },
    { id: 'hold', name: '뒤에서 기다린다', text: '싸움에 끼지 않는다. 맞지도 않는다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
  // 북 치는 이 (GD-C0): 싸우지도 맞지도 않는다. 방침은 하나뿐이다
  bard: [
    { id: 'drum', name: '북을 친다', text: '싸우지 않는다. 맞지도 않는다. 북을 치는 동안 일행의 공격력·방어력이 오른다' },
  ],
  striker: [
    { id: 'together', name: '같이 친다', text: '턴마다 친다' },
    { id: 'finish', name: '끝만 낸다', text: '적의 생명력이 삼분의 일 아래일 때만 친다' },
    { id: 'hold', name: '뒤에서 기다린다', text: '싸움에 끼지 않는다. 맞지도 않는다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
};

/**
 * 동료의 바탕. hates: 무엇을 거스르는 것으로 치는가
 *   greed(실리 쪽 선택을 했을 때) · hungry(굶은 채 하루를 넘겼을 때) · unpaid(삯을 못 냈을 때. 바로 떠난다) · flee(싸움에서 달아났을 때)
 */
export const COMPANIONS = {
  miru: {
    id: 'miru', name: '미루', what: '견습 사제', way: 'person', person: 'miru', role: 'healer', row: 'back',
    hp: 60, attack: 5, heal: 16, element: '빛',
    wants: '다친 사람을 두고 가지 않는 것', hates: 'greed', hateSay: '미루가 한참 말이 없다. "…그건 아니잖아요."',
    join: '"저, 저도 가도 돼요? 신전에서는 종소리가 어디서 나는지 아무도 안 알려 줘요."', leave: '"저는 여기까지만 갈게요." 미루가 고개를 숙이고 돌아섰다.',
  },
  gaon: {
    id: 'gaon', name: '가온', what: '용병', way: 'merc', fee: 60, role: 'striker', row: 'front',
    hp: 110, attack: 16, element: '땅',
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '',
    join: '"하루 은화 육십. 선불은 아니고, 날이 바뀔 때 받겠소."', leave: '"삯이 없으면 칼도 없소." 가온이 짐을 챙겨 떠났다.',
  },
  windbow: {
    id: 'windbow', name: '바람결', what: '활 쏘는 용병', way: 'merc', fee: 70, role: 'striker', row: 'back', back: true,
    hp: 80, attack: 13, element: '바람',
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '',
    join: '"하루 은화 일흔. 화살값은 내가 대지. 날이 바뀔 때 받겠어."', leave: '"삯 없는 활은 당기지 않아." 바람결이 활을 메고 떠났다.',
  },
  stoneshield: {
    id: 'stoneshield', name: '돌방패', what: '방패 든 용병', way: 'merc', fee: 80, role: 'guard', row: 'front',
    hp: 150, attack: 8, element: '땅',
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '',
    join: '"하루 은화 여든. 내 뒤에 서 있으면 된다."', leave: '"삯이 끊기면 방패도 내린다." 돌방패가 등을 돌렸다.',
  },
  stonerabbit: {
    id: 'stonerabbit', name: '돌토끼', what: '생명을 얻은 조각', way: 'work', role: 'guard', row: 'front',
    hp: 80, attack: 8, element: '땅',
    wants: '만든 이가 굶지 않는 것', hates: 'hungry', hateSay: '돌토끼가 내 빈 밥그릇을 한참 들여다본다.',
    join: '나무였던 것이 눈을 깜빡인다. 귀를 한 번 털고, 발치에 와서 앉는다.', leave: '돌토끼가 숲 쪽으로 뛰어갔다. 뒤돌아보지 않았다.',
  },
  woodboar: {
    id: 'woodboar', name: '나무 멧돼지', what: '생명을 얻은 조각', way: 'work', role: 'striker', row: 'front',
    hp: 100, attack: 14, element: '땅',
    wants: '싸움에서 등을 보이지 않는 것', hates: 'flee', hateSay: '나무 멧돼지가 콧김을 뿜으며 땅을 긁는다.',
    join: '나무 엄니가 번쩍 들린다. 콧김이 한 번 나온다.', leave: '나무 멧돼지가 등을 돌리고 숲으로 들어갔다.',
  },
  woodwolf: {
    id: 'woodwolf', name: '나무 늑대', what: '생명을 얻은 조각', way: 'work', role: 'striker', row: 'front',
    hp: 90, attack: 15, element: '바람',
    wants: '싸움에서 등을 보이지 않는 것', hates: 'flee', hateSay: '나무 늑대가 낮게 으르렁거린다.',
    join: '나무 귀가 쫑긋 선다. 길게 한 번 운다.', leave: '나무 늑대가 한 번 울고 숲으로 사라졌다.',
  },
};

// ── 구간 용병 (LV-H3, JD-C): 흰마루부터는 거점마다 그 구간의 용병 셋이 따로 있다. 숫자는 구간 자료(bands.js)에서 셈한다 ──
// 때리는 이는 그 구간 기준 사람(스탯 점수의 절반을 주 스탯에, 그 구간 무기)이 한 번에 넣는 피해의 55%를 넣는다. 뒷줄의 활은 그보다 조금 덜(45%), 막는 이는 25%.
// 막는 이는 내가 맞을 것을 35%의 확률로 통째로 대신 맞는다(평균 35%). 생명력은 그 구간 보통 몬스터의 생명력만큼(때리는 이는 그 70%, 뒷줄은 55%).
// 삯은 그 구간 하루 벌이의 12%를 십 단위로 맞춘 값이다 (LV-L1, JD-G6: 잠긴 도성 250).
import { bandByNo, bardRate } from './bands.js?v=9286de1';
import { TENT_PEOPLE, TENT_FEE, tentsHere } from './anvil.js?v=9286de1';

export const BAND_MERC = { strike: 0.55, back: 0.45, guard: 0.25, guardRate: 0.35, hp: { striker: 0.7, back: 0.55, guard: 1 }, fee: 0.12 };
/** 시안이 삯을 따로 적은 구간 (LV-L의 표, BM-H6): 별못 690. 셈으로는 680이 나온다(하루 벌이 5,700이 반올림한 값이라). */
export const BAND_FEE = { 9: 690, 10: TENT_FEE };
/** 지금 용병 셋(가온·바람결·돌방패)이 따라오는 끝 구간: 소리재까지 (JD-C3). */
export const OLD_MERC_BAND = 2;
/** 그 구간 기준 사람의 공격력: 처음 10 + 스탯 점수의 절반 + 그 구간 무기 (LV-I의 기준). */
export const refAttack = (n) => { const b = bandByNo(n), L = n * 10 - 5; return 10 + Math.round(3 * (L - 1) * 0.5) + b.weapon; };
const round100 = (x) => Math.round(x / 100) * 100;
/** 그 구간 용병의 숫자. kind: striker(앞줄 창) · back(뒷줄 활) · guard(방패). */
export function bandMercStats(n, kind) {
  const b = bandByNo(n), def = b.mon.defense;
  const share = kind === 'guard' ? BAND_MERC.guard : kind === 'back' ? BAND_MERC.back : BAND_MERC.strike;
  return { hp: round100(b.mon.hp * BAND_MERC.hp[kind]), attack: def + Math.round((refAttack(n) - def) * share), fee: BAND_FEE[n] ?? Math.round((b.day * BAND_MERC.fee) / 10) * 10 };
}

// [구간, 구하는 곳, 소개하는 이, [id, 이름, 속성, 구할 때 하는 말, 떠날 때 글] × 셋(창잡이 · 활잡이 · 방패잡이)]. 잠긴 도성의 이름은 시안(JD-C1)의 것이고 나머지 이름과 말은 처음 값이다
const BAND_MERC_ROWS = [
  [3, 'hunterhut', '늙은 사냥꾼이', [
    ['solgae', '솔개', '바람', '"눈밭에서는 내 발자국만 밟아. 삯은 날이 바뀔 때."', '"삯 없이는 눈밭에 안 나가." 솔개가 창을 메고 움막으로 돌아갔다.'],
    ['saebyeok', '새벽', '바람', '"올빼미보다 먼저 쏘면 돼. 그게 내 일이야."', '"빈 시위는 안 당겨." 새벽이 활을 내렸다.'],
    ['bau', '바우', '땅', '"내 뒤에 서. 바람도 내가 먼저 맞는다."', '"삯이 끊기면 등도 돌린다." 바우가 방패를 썰매에 실었다.'],
  ]],
  [4, 'barracks', '막사 대장이', [
    ['mireu', '미르', '땅', '"삯은 날마다. 떼인 적이 있어서 그래. 댁 탓은 아니고."', '"또 떼였군." 미르가 웃지도 않고 돌아섰다.'],
    ['narae', '나래', '바람', '"화살값은 삯에 들어 있어. 물은 댁이 대."', '"삯 없는 화살은 안 날아." 나래가 화살통을 닫았다.'],
    ['duru', '두루', '땅', '"저울에 달면 내가 제일 무거워. 그래서 앞에 서."', '"장부에 적어 두겠소. 밀린 삯 하루." 두루가 막사로 돌아갔다.'],
  ]],
  [5, 'scaleshop', '비늘 가게 주인이', [
    ['dalgu', '달구', '불', '"마당에서는 졌어. 들판에서는 안 져. 삯만 줘."', '"삯도 못 받으면 풀무나 밀지." 달구가 창을 끌고 갔다.'],
    ['ara', '아라', '불', '"불똥보다 빨리 쏴. 봐 두라고."', '"빈손으로는 시위가 안 당겨져." 아라가 골목으로 들어갔다.'],
    ['musoe', '무쇠', '땅', '"비늘 방패야. 쇠는 여기서 못 버텨. 나는 버텨."', '"삯이 식었군." 무쇠가 방패를 등에 졌다.'],
  ]],
  [6, 'floatinn', '주막 주인이', [
    ['saeam', '새암', '물', '"끝까지 갈게요. 삯을 주는 날까지는요."', '"여기까지만 할게요. 다들 그러잖아요." 새암이 장대를 내려놓았다.'],
    ['dodam', '도담', '바람', '"불빛은 안 쏴요. 불빛 뒤에 있는 걸 쏴요."', '"삯이 없으면 저도 하다 말아요." 도담이 주막으로 돌아갔다.'],
    ['hanul', '한울', '땅', '"늪에서는 내가 먼저 디뎌요. 꺼지면 나만 꺼지게."', '"삯 없이는 못 디뎌요." 한울이 널 위에 주저앉았다.'],
  ]],
  [7, 'guardpost', '막사의 늙은 근위병이', [
    ['parang', '파랑', '물', '"증조부가 지키던 거리요. 삯을 받고라도 내려가겠소."', '"삯 없는 창은 맹세도 아니오." 파랑이 창을 닦던 자리로 돌아갔다.'],
    ['irang', '이랑', '바람', '"물속에서는 화살이 느려요. 그래서 가까이서 쏴요."', '"삯이 끊기면 줄도 끊어요." 이랑이 활을 풀었다.'],
    ['neoul', '너울', '물', '"둘째는 내가 붙잡겠소. 댁은 첫째만 보시오."', '"삯 없이는 방패가 무겁소." 너울이 방패를 벽에 기댔다.'],
  ]],
  // 구름다리 (GD-C0): 서리와 바위의 이름은 시안의 것이다. 활잡이의 이름과 셋의 말은 처음 값이다
  [8, 'goathut', '염소치기 어른이', [
    ['seori', '서리', '바람', '"벼랑에서는 내가 바깥쪽을 걷겠소. 삯은 날이 바뀔 때."', '"삯 없이 벼랑에 설 까닭이 없소." 서리가 창을 거두었다.'],
    ['suri', '수리', '바람', '"바람을 읽고 쏴요. 맞바람 부는 날은 반만 믿으세요."', '"빈 시위는 바람만 가르죠." 수리가 활을 등에 멨다.'],
    ['bawi', '바위', '땅', '"옆바람이 불어도 나는 안 밀려. 내 뒤에 붙어."', '"삯이 끊기면 나도 내려가." 바위가 방패를 염소 우리에 기댔다.'],
  ]],
  // 별못 (BM-C0): 이름과 말은 처음 값이다(시안 C의 그림은 구름다리의 이름을 예로 썼다)
  [9, 'silkhouse', '비단 집 주인이', [
    ['hanmoe', '한뫼', '땅', '"같은 데를 두 번 안 찔러요. 읽히니까. 삯은 날이 바뀔 때 주세요."', '"삯이 없으면 저도 못 봐 드려요." 한뫼가 창을 비단 집 처마에 세웠다.'],
    ['nari', '나리', '바람', '"물에 비친 건 안 쏴요. 비친 걸 보고 있는 놈을 쏴요."', '"빈 시위는 아무도 안 봐 줘요." 나리가 활을 풀었다.'],
    ['doran', '도란', '땅', '"댁이 섞는 동안 제가 맞을게요. 저는 읽혀도 돼요. 방패는 수가 하나뿐이라."', '"삯이 끊기면 방패도 쉬어요." 도란이 방패를 못가에 눕혔다.'],
  ]],
];
const KINDS = [['striker', '창잡이', 'striker', 'front', false], ['back', '활잡이', 'striker', 'back', true], ['guard', '방패잡이', 'guard', 'front', false]];
/** 구간마다의 용병 차례와 구하는 곳. */
export const BAND_MERCS = {};
for (const [n, place, by, rows] of BAND_MERC_ROWS) {
  BAND_MERCS[n] = { band: n, place, by, order: rows.map((r) => r[0]) };
  rows.forEach(([id, name, element, join, leave], i) => {
    const [kind, title, role, row, back] = KINDS[i];
    const st = bandMercStats(n, kind);
    COMPANIONS[id] = {
      id, name, title, what: title, way: 'merc', band: n, home: place, fee: st.fee, role, row, ...(back ? { back: true } : {}), hp: st.hp, attack: st.attack, element,
      ...(kind === 'guard' ? { guardRate: BAND_MERC.guardRate } : {}),
      text: kind === 'guard' ? `내가 맞을 것의 ${Math.round(BAND_MERC.guardRate * 100)}%를 대신 맞는다.${n === 7 ? ' 짝의 둘째를 붙잡는다.' : ''}` : `내 공격력의 ${Math.round((kind === 'back' ? BAND_MERC.back : BAND_MERC.strike) * 100)}%만큼 턴마다 함께 친다.`,
      wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '', join, leave,
    };
  });
}
// ── 버프 용병: 북 치는 이 (LV-H4, GD-C). 구름다리부터의 거점에 있다. 싸우지도 맞지도 않고, 곁에 있는 동안 일행 모두의 공격력·방어력이 오른다 ──
// [구간, id, 이름, 앞에 붙는 말, 속성, 구할 때 하는 말, 떠날 때 글]. 이름은 시안(GD-F)의 것이고 말은 처음 값이다
const BARD_ROWS = [
  [8, 'drummaru', '마루', '북 치는', '바람', '"저는 안 싸워요. 북만 쳐요. 그런데 제가 치면 다들 좀 더 세게 쳐요. 삯은 같아요."', '"삯 없이는 북채가 안 올라가요." 마루가 북을 등에 지고 움막으로 돌아갔다.'],
  // 별못: 이름과 말은 처음 값이다
  [9, 'drumsodam', '소담', '북 치는', '물', '"박자를 자꾸 바꿔서 쳐요. 같은 박자는 읽히니까요. 그래도 따라올 수 있게 칠게요."', '"삯 없이는 북이 안 울어요." 소담이 북을 안고 비단 집으로 들어갔다.'],
];
/** 북소리 (GD-C2): 이름표와 "걸린 효과"에 보이는 이름. */
export const DRUM = { id: 'drum', name: '북소리' };
for (const [n, id, name, title, element, join, leave] of BARD_ROWS) {
  const rate = bardRate(n);
  COMPANIONS[id] = {
    id, name, title, what: '북 치는 이', way: 'merc', band: n, home: BAND_MERCS[n].place, fee: bandMercStats(n, 'striker').fee, role: 'bard', row: 'back', back: true, hp: bandMercStats(n, 'back').hp, attack: 0, element,
    drum: rate, text: `싸우지 않는다. 북을 치는 동안 일행 모두의 공격력·방어력 +${Math.round(rate * 100)}%. 맞지도 않는다.`,
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '', join, leave,
  };
  BAND_MERCS[n].bard = id;
}
// ── 처음 모루의 일곱 천막 (CM-C, CM-H6): 지나온 지역의 사람이 그 지역의 용병을 대신한다. 맡는 자리는 지역마다 같고, 누가 와 있는지는 내가 푼 길에 달렸다 ──
// 숫자는 구간 용병과 같은 셈이다. 고치는 이는 턴마다 그 구간 보통 몬스터 공격력의 30%만큼 고치고, 북돋는 이는 북 치는 이와 같은 몫(+14%)을 북돋는다. 삯은 모두 1,100
const TENT_ROLE = { guard: ['방패를 든', 'guard', 'front', false, 'guard'], striker: ['창을 든', 'striker', 'front', false, 'striker'], back: ['활을 든', 'striker', 'back', true, 'back'], healer: ['상처를 싸매는', 'healer', 'back', true, 'back'], bard: ['곁에서 보는', 'bard', 'back', true, 'back'] };
export const TENT_HEAL = 0.3;
BAND_MERCS[10] = { band: 10, place: 'seventents', by: '천막의 사람들이', order: TENT_PEOPLE.map((t) => t.id), tents: true };
for (const t of TENT_PEOPLE) {
  const [what, role, row, back, kind] = TENT_ROLE[t.role];
  const st = bandMercStats(10, kind), rate = bardRate(10);
  COMPANIONS[t.id] = {
    id: t.id, name: t.short, what: `${what} ${t.region} 사람`, way: 'merc', band: 10, home: 'seventents', fee: st.fee, role, row, ...(back ? { back: true } : {}), hp: st.hp, element: t.element,
    attack: role === 'bard' ? 0 : role === 'healer' ? bandMercStats(10, 'guard').attack : st.attack,
    ...(role === 'guard' ? { guardRate: BAND_MERC.guardRate } : {}),
    ...(role === 'healer' ? { heal: Math.round(bandByNo(10).mon.attack * TENT_HEAL) } : {}),
    ...(role === 'bard' ? { drum: rate, watch: true } : {}),
    text: role === 'guard' ? `내가 맞을 것의 ${Math.round(BAND_MERC.guardRate * 100)}%를 대신 맞는다.` : role === 'healer' ? '내가 다치면 턴마다 싸매 준다.' : role === 'bard' ? `싸우지 않는다. 곁에서 보는 동안 일행 모두의 공격력·방어력 +${Math.round(rate * 100)}%. 맞지도 않는다.` : `내 공격력의 ${Math.round((kind === 'back' ? BAND_MERC.back : BAND_MERC.strike) * 100)}%만큼 턴마다 함께 친다.`,
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '', join: t.join, leave: t.leave,
  };
}
/** 그 구간의 북 치는 이(없으면 null). */
export const bardOfBand = (n) => BAND_MERCS[n]?.bard || null;
/** 그 용병이 따라오는 끝 구간: 지금 용병 셋은 소리재(2)까지, 구간 용병은 제 구간까지. */
export const mercBand = (d) => d.band || OLD_MERC_BAND;
/** 그곳(용병 칸이 있는 곳)에서 구하는 용병들. */
export const mercsAt = (place, state = null) => { const g = Object.values(BAND_MERCS).find((x) => x.place === place?.id); if (g?.tents) return state ? tentsHere(state) : g.order; return g ? (g.bard ? [g.bard, ...g.order] : g.order) : MERC_ORDER; }; // 북 치는 이가 맨 위다 (GD-C0)
