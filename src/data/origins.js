// 출신 여섯 (T1~T3). 바꿀 수 없다. 출신마다 숫자 하나와 대화 하나.

export const START_POINTS = 5;
export const BASE_STATS = { str: 10, agi: 9, con: 10, wis: 7 };
export const STAT_NAMES = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
export const STAT_USES = { str: '공격력, 무게', agi: '선공, 회피, 기척', con: '생명력, 방어력', wis: '마나, 스킬 위력' };

export const ORIGINS = [
  {
    id: 'smithboy', name: '대장간 심부름꾼',
    number: '힘 +1. 대장 숙련도 초급 2로 시작.', talk: '대장장이들이 먼저 말을 건다.',
    story: '대장간에서 풀무질과 심부름으로 자랐다. 쇠 냄새가 익숙하고, 망치 소리에 박자를 맞출 줄 안다. 직업은 아직 없다.',
    stats: { str: 1 }, skills: { smithing: 1 },
  },
  {
    id: 'farmer', name: '농부의 자식',
    number: '체력 +2. 포만감이 천천히 줄어든다.', talk: '마을 사람들이 편하게 대한다.',
    story: '밭에서 자랐다. 해 뜨면 일어나고 배고프면 먹는 것밖에 모른다. 그게 얼마나 큰 재주인지는 아직 모른다.',
    stats: { con: 2 }, flags: { slowHunger: true },
  },
  {
    id: 'hunter', name: '사냥꾼의 조수',
    number: '민첩 +2. 기척을 더 잘 알아챈다.', talk: '숲의 짐승 약점 하나를 안다.',
    story: '사냥꾼 뒤를 따라 숲을 다녔다. 발소리를 죽이는 법과, 바람이 어느 쪽에서 부는지 읽는 법을 배웠다.',
    stats: { agi: 2 }, flags: { keenSense: true, knowsBoar: true },
  },
  {
    id: 'bard', name: '떠돌이 악사',
    number: '설득 판정 +10%. 소문을 하나 더 듣는다.', talk: '주점에서 공짜 술을 얻는다.',
    story: '류트 하나 메고 마을을 떠돌았다. 노래는 그저 그렇지만 사람 마음을 여는 말은 안다.',
    stats: {}, flags: { persuade10: true, extraRumor: true },
  },
  {
    id: 'fallen', name: '몰락한 집안',
    number: '지혜 +2. 은화 100으로 시작.', talk: '옛 이름을 아는 사람이 있다. 좋게든 나쁘게든.',
    story: '한때는 이름만 대면 문이 열리던 집안이었다. 지금 남은 것은 글 읽는 버릇과 은화 한 줌뿐이다.',
    stats: { wis: 2 }, silver: 100, flags: { oldName: true },
  },
  {
    id: 'orphan', name: '신전 고아',
    number: "신전 평판 '낯익음'으로 시작.", talk: '쓰러졌을 때 두고 오는 돈이 절반.',
    story: '신전 마루에서 자랐다. 종소리에 일어나고 종소리에 잠들었다. 그 소리가 어디서 나는지는 한 번도 묻지 않았다.',
    stats: {}, flags: { templeKnown: true, halfDrop: true },
  },
];

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
