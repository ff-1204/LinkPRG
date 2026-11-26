// 출신 여섯 (T1~T3). 바꿀 수 없다. 출신마다 숫자 하나와 대화 하나.

export const START_POINTS = 5;
export const BASE_STATS = { str: 10, agi: 9, con: 10, wis: 7 };
export const STAT_NAMES = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
export const STAT_USES = { str: '공격력, 무게', agi: '선공, 회피, 기척', con: '생명력, 방어력', wis: '마나, 스킬 위력' };

/**
 * 뿌리 여섯 (Z25). 같은 뿌리의 출신은 사람들이 대하는 말과 퀘스트에서 열리는 대답, 일지의 첫 글을 함께 쓴다.
 * flags: 그 뿌리의 출신이면 누구나 갖는 것.
 */
export const ROOTS = {
  smithboy: { name: '쇠의 사람', talk: '대장장이들이 먼저 말을 건다.', flags: {} },
  farmer: { name: '땅의 사람', talk: '마을 사람들이 편하게 대한다.', flags: {} },
  hunter: { name: '숲의 사람', talk: '숲의 짐승 약점 하나를 안다.', flags: { knowsBoar: true } },
  bard: { name: '길의 사람', talk: '주점에서 공짜 술을 얻는다.', flags: {} },
  fallen: { name: '이름 있는 사람', talk: '옛 이름을 아는 사람이 있다. 좋게든 나쁘게든.', flags: { oldName: true } },
  orphan: { name: '신전의 사람', talk: "신전 평판 '낯익음'으로 시작.", flags: { templeKnown: true } },
};

/** 출신의 등급. 장비의 등급과 이름이 같다. weight: 한 가지가 뽑힐 몫(높을수록 흔하다). */
export const ORIGIN_GRADES = [
  { name: '일반', weight: 10 }, { name: '고급', weight: 6 }, { name: '희귀', weight: 3 }, { name: '영웅', weight: 1.5 }, { name: '전설', weight: 0.5 },
];

// [id, 뿌리, 등급, 이름, 스탯, 덤(글), 지난날, 그 밖(skills·silver·items·flags)]
const RAW = [
  // 쇠의 사람
  ['smithboy', 'smithboy', 0, '대장간 심부름꾼', { str: 1 }, '대장 숙련도 초급 2로 시작', '대장간에서 풀무질과 심부름으로 자랐다. 쇠 냄새가 익숙하고, 망치 소리에 박자를 맞출 줄 안다. 직업은 아직 없다.', { skills: { smithing: 1 } }],
  ['charcoal', 'smithboy', 0, '숯쟁이', { con: 2 }, '피로가 더디게 쌓인다', '산속 가마 옆에서 사흘씩 불을 지켰다. 졸음을 참는 법은 누구에게 배운 것이 아니다.', { flags: { slowTire: true } }],
  ['minerkid', 'smithboy', 1, '광부의 자식', { str: 2 }, '채광 숙련도 초급 2로 시작', '갱도 어귀에서 아버지의 등불을 기다리며 자랐다. 돌을 보면 어디를 쳐야 갈라지는지가 먼저 보인다.', { skills: { mining: 1 } }],
  ['farrier', 'smithboy', 1, '편자공의 조수', { str: 1, con: 1 }, '장비를 고치는 값이 절반', '말굽에 편자를 대며 자랐다. 닳은 쇠를 버리지 않고 다시 쓰는 법을 안다.', { flags: { cheapRepair: true } }],
  ['tinker', 'smithboy', 2, '떠돌이 땜장이', { str: 2, wis: 1 }, '대장 숙련도 초급 4, 은화 50으로 시작', '솥과 냄비를 지고 마을마다 돌았다. 남의 집 부엌에서 쇠를 고치며 손도 말도 늘었다.', { skills: { smithing: 3 }, silver: 50 }],
  // 땅의 사람
  ['farmer', 'farmer', 0, '농부의 자식', { con: 2 }, '포만감이 천천히 줄어든다', '밭에서 자랐다. 해 뜨면 일어나고 배고프면 먹는 것밖에 모른다. 그게 얼마나 큰 재주인지는 아직 모른다.', { flags: { slowHunger: true } }],
  ['miller', 'farmer', 0, '방앗간 일꾼', { str: 1, con: 1 }, '주먹밥 다섯 개로 시작', '물레방아 도는 소리 속에서 자루를 날랐다. 떠나는 날 주인이 밥을 싸 주었다.', { items: [['riceball', 5]] }],
  ['woodcutter', 'farmer', 1, '나무꾼', { str: 2 }, '참나무 가지 여섯 개, 채집 숙련도 초급 2로 시작', '도끼 한 자루로 겨울 땔감을 댔다. 어느 나무가 곧고 어느 나무가 속이 비었는지 두드려 보면 안다.', { skills: { gathering: 1 }, items: [['oakbranch', 6]] }],
  ['shepherd', 'farmer', 1, '양치기', { agi: 1, con: 1 }, '짐승이 덜 덤빈다', '언덕에서 양 떼와 여름을 났다. 늑대가 오기 전의 바람을 안다.', { flags: { calmBeasts: true } }],
  ['herbkid', 'farmer', 2, '약초꾼의 아이', { wis: 2, con: 1 }, '채집 숙련도 초급 4, 먹고 마시는 것의 효과가 크다', '할머니의 바구니를 들고 산을 탔다. 쓴 풀과 독한 풀을 혀로 가려낸다.', { skills: { gathering: 3 }, flags: { foodPlus: true } }],
  // 숲의 사람
  ['hunter', 'hunter', 0, '사냥꾼의 조수', { agi: 2 }, '기척을 더 잘 알아챈다', '사냥꾼 뒤를 따라 숲을 다녔다. 발소리를 죽이는 법과, 바람이 어느 쪽에서 부는지 읽는 법을 배웠다.', { flags: { keenSense: true } }],
  ['fowler', 'hunter', 0, '새잡이', { agi: 1 }, '기척을 더 잘 알아채고 도망이 쉽다', '갈대밭에 엎드려 새를 기다렸다. 숨을 참는 것과, 틀렸을 때 재빨리 물러나는 것을 배웠다.', { flags: { keenSense: true, fleeEasy: true } }],
  ['tanner', 'hunter', 1, '무두장이', { con: 1, agi: 1 }, '가죽을 팔 때 값을 더 받는다', '가죽을 벗기고 무두질하며 자랐다. 좋은 가죽과 상한 가죽을 손끝으로 안다.', { flags: { hideSeller: true } }],
  ['trapper', 'hunter', 2, '덫놓이', { agi: 2, wis: 1 }, '먼저 덮칠 때 더 아프게 친다', '짐승이 다니는 길에 덫을 놓았다. 기다리는 쪽이 이긴다는 것을 일찍 알았다.', { flags: { pounceBonus: true } }],
  ['warden', 'hunter', 3, '숲지기의 아이', { agi: 3, con: 1 }, '기척을 더 잘 알아채고, 길에서 습격당하지 않는다', '숲지기의 오두막에서 태어났다. 짐승들은 이 아이의 냄새를 숲의 것으로 안다.', { flags: { keenSense: true, noAmbush: true } }],
  // 길의 사람
  ['bard', 'bard', 0, '떠돌이 악사', {}, '설득 판정 +10%, 소문을 하나 더 듣는다', '류트 하나 메고 마을을 떠돌았다. 노래는 그저 그렇지만 사람 마음을 여는 말은 안다.', { flags: { persuade10: true, extraRumor: true } }],
  ['porter', 'bard', 0, '짐꾼', { str: 1, con: 1 }, '무게 한도 +5', '남의 짐을 지고 고개를 넘었다. 무거운 것을 오래 드는 요령은 허리가 안다.', { flags: { carry5: true } }],
  ['ferrykid', 'bard', 1, '뱃사공의 아이', { con: 1, agi: 1 }, '낚시 숙련도 초급 2로 시작', '나룻배 위에서 걸음마를 뗐다. 손님을 기다리는 동안에는 늘 낚싯줄을 드리웠다.', { skills: { fishing: 1 } }],
  ['quack', 'bard', 1, '약장수의 조수', { wis: 2 }, '속임 판정 +10%, 붉은 물약 둘로 시작', '장터에서 만병통치약을 팔았다. 약이 듣는지는 몰라도 말이 듣는다는 것은 안다.', { items: [['redpotion', 2]], flags: { trick10: true } }],
  ['tumbler', 'bard', 2, '곡예단 막내', { agi: 3 }, '피하기가 10% 더 잘된다', '천막 아래에서 줄을 탔다. 떨어지는 법부터 배웠고, 그다음에 떨어지지 않는 법을 배웠다.', { flags: { dodge10: true } }],
  // 이름 있는 사람
  ['shopkid', 'fallen', 0, '가게 집 막내', { wis: 1 }, '은화 40으로 시작, 사는 값이 조금 싸다', '저울 옆에서 자랐다. 값을 깎는 말과 깎이지 않는 말을 귀로 익혔다.', { silver: 40, flags: { cheapBuy: true } }],
  ['debtor', 'fallen', 0, '빚에 쫓기는 이', { agi: 1, wis: 1 }, '도망이 쉽다. 은화 없이 시작', '집안의 빚을 물려받았다. 문 두드리는 소리만 들어도 뒷문이 어디인지부터 본다.', { flags: { fleeEasy: true } }],
  ['fallen', 'fallen', 1, '몰락한 집안', { wis: 2 }, '은화 100으로 시작', '한때는 이름만 대면 문이 열리던 집안이었다. 지금 남은 것은 글 읽는 버릇과 은화 한 줌뿐이다.', { silver: 100 }],
  ['clerk', 'fallen', 2, '서기 견습', { wis: 3 }, '감정 숙련도 초급 4로 시작', '남의 장부를 베끼며 자랐다. 숫자가 맞지 않는 곳은 읽기 전에 눈에 걸린다.', { skills: { appraise: 3 } }],
  ['squire', 'fallen', 3, '기사의 종자', { str: 2, con: 2 }, '낡은 방패를 들고, 막기 숙련도 초급 3으로 시작', '기사의 갑옷을 닦고 방패를 들어 주었다. 기사는 떠났고 방패만 남았다.', { skills: { guard: 2 }, items: [['oldshield', 1]], flags: { anyShield: true } }],
  // 신전의 사람
  ['orphan', 'orphan', 0, '신전 고아', {}, '쓰러졌을 때 두고 오는 돈이 절반', '신전 마루에서 자랐다. 종소리에 일어나고 종소리에 잠들었다. 그 소리가 어디서 나는지는 한 번도 묻지 않았다.', { flags: { halfDrop: true } }],
  ['gravekeeper', 'orphan', 0, '묘지기', { con: 2 }, '쇠약이 빨리 풀린다', '신전 뒤뜰의 무덤을 돌보았다. 쓰러진 이들 곁에서 일어나는 법을 배웠다.', { flags: { weakFast: true } }],
  ['pilgrim', 'orphan', 1, '순례자', { con: 1, wis: 1 }, '신전의 빵을 하루에 둘 받는다', '신전에서 신전으로 걸었다. 어느 문을 두드리면 빵이 나오는지 안다.', { flags: { bread2: true } }],
  ['scribe', 'orphan', 2, '필경 견습', { wis: 3 }, '서고에서 감정 숙련도가 두 배로 오른다', '신전의 책을 베껴 썼다. 뜻을 모르는 글자도 틀리지 않고 옮길 수 있다.', { flags: { fastSearch: true } }],
  ['ringerkid', 'orphan', 4, '종지기의 아이', { str: 1, agi: 1, con: 1, wis: 2 }, '모든 숙련도가 5% 빨리 오른다', '종루 아래에서 자랐다. 종이 사라진 날에도 이 아이만은 소리를 들었다고 한다.', { flags: { allSkill5: true } }],
];

const STAT_KO = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
export const ORIGINS = RAW.map(([id, root, grade, name, stats, perk, story, more = {}]) => {
  const statText = Object.entries(stats).map(([k, v]) => `${STAT_KO[k]} +${v}`).join(', ');
  return {
    id, root, grade, name, stats, perk, story,
    number: `${statText ? statText + '. ' : ''}${perk}.`,
    talk: ROOTS[root].talk,
    skills: more.skills || {}, silver: more.silver || 0, items: more.items || [],
    flags: { ...ROOTS[root].flags, ...(more.flags || {}) },
  };
});

/** 뿌리의 이름. */
export const rootOf = (originId) => { const o = ORIGINS.find((x) => x.id === originId); return o ? o.root : null; };

/**
 * 패 다섯 장을 깐다 (Z25). 같은 글(seedText)이면 늘 같은 패가 나온다. 서로 다른 다섯 가지이고, 등급이 높을수록 드물다.
 * 돌려주는 것은 출신 id 다섯 개.
 */
export function dealOrigins(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const next = () => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; h = (h + 0x9e3779b9) >>> 0; return h / 4294967296; };
  const pool = ORIGINS.map((o) => ({ id: o.id, w: ORIGIN_GRADES[o.grade].weight }));
  const out = [];
  while (out.length < 5) {
    let r = next() * pool.reduce((a, x) => a + x.w, 0);
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r < 0) break; }
    out.push(pool.splice(i, 1)[0].id);
  }
  return out;
}

export function originById(id) {
  return ORIGINS.find((o) => o.id === id) || null;
}

/** 출신과 나눈 점수로 시작 스탯을 만든다. 점수가 맞지 않으면 까닭을 던진다. */
/** 주사위 (Z22): 네 스탯의 합은 늘 같다. 어떻게 나뉘느냐만 굴릴 때마다 달라진다. */
export const DICE_TOTAL = Object.values(BASE_STATS).reduce((a, b) => a + b, 0) + START_POINTS; // 41
export const DICE_MIN = 4; // 한 스탯의 가장 낮은 값
export const DICE_FREE_AT = 100; // 이만큼 굴린 사람은 눈을 손으로 옮길 수 있다

/**
 * 주사위를 한 번 굴린다. 같은 글(seedText)이면 늘 같은 눈이 나온다.
 * 넷을 모두 가장 낮은 값에서 시작해, 남은 점수를 하나씩 아무 스탯에나 던져 넣는다.
 */
export function rollDice(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const keys = Object.keys(BASE_STATS);
  const out = Object.fromEntries(keys.map((k) => [k, DICE_MIN]));
  for (let left = DICE_TOTAL - DICE_MIN * keys.length; left > 0; left--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    out[keys[h % keys.length]] += 1;
  }
  return out;
}

export function buildStats(originId, spent, rolled = null) {
  const origin = originById(originId);
  if (!origin) throw new Error('모르는 출신: ' + originId);
  if (rolled) {
    const keys = Object.keys(BASE_STATS);
    if (!keys.every((k) => Number.isInteger(rolled[k]) && rolled[k] >= DICE_MIN) || keys.reduce((a, k) => a + rolled[k], 0) !== DICE_TOTAL) throw new Error('주사위 눈이 맞지 않습니다');
    return { stats: Object.fromEntries(keys.map((k) => [k, rolled[k] + (origin.stats[k] || 0)])), unspent: 0 };
  }
  const total = Object.values(spent || {}).reduce((a, b) => a + b, 0);
  if (total > START_POINTS) throw new Error(`시작 점수는 ${START_POINTS}까지입니다 (받은 값: ${total})`);
  const stats = {};
  for (const key of Object.keys(BASE_STATS)) {
    const add = (spent && spent[key]) || 0;
    if (!Number.isInteger(add) || add < 0) throw new Error('점수는 0 이상의 정수여야 합니다');
    stats[key] = BASE_STATS[key] + (origin.stats[key] || 0) + add;
  }
  return { stats, unspent: START_POINTS - total };
}
