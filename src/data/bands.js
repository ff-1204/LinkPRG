// 레벨 구간 열 개 (12차 시안 LV-A, LV-F, LV-H, LV-I, LV-L). 숫자는 계산한 처음 값이다.
// 구간을 낼 때마다 무작위 플레이(tools/balance.mjs)로 다시 맞춘다 (LV-I5).

/**
 * n: 구간 번호(재료 단계와 같다). from~to: 레벨. weapon/armor: 그 단계의 무기 공격력과 방어구 합 (LV-F).
 * kills: 레벨 하나에 드는 제 레벨 몬스터 수 (LV-I). mon: 구간 가운데 레벨의 보통 몬스터 (LV-I).
 * mon.hit: 그 구간 보통 몬스터의 보통 공격 배율 (M23-1). 모아 치기의 배율(1.9)은 구간과 상관없이 그대로다. 없으면 1.
 * perKill/day: 한 판 벌이와 하루 벌이 (LV-L). need: 제 레벨에 돌려면 갖출 것 (LV-A).
 */
export const BANDS = [
  { n: 1, from: 1, to: 10, name: '시작 마을', metal: '구리·철', hide: '멧돼지 가죽', weapon: 14, armor: 19, kills: 6, mon: { hp: 86, attack: 38, defense: 13 }, perKill: 8, day: 100, need: 'bare' },
  { n: 2, from: 11, to: 20, name: '나루·소리재', metal: '강철', hide: '곰 가죽', weapon: 24, armor: 32, kills: 8, mon: { hp: 187, attack: 64, defense: 23 }, perKill: 13, day: 170, need: 'bare' },
  { n: 3, from: 21, to: 30, name: '흰마루', metal: '서릿쇠', hide: '흰털 가죽', weapon: 36, armor: 47, kills: 10, mon: { hp: 325, attack: 94, defense: 34, hit: 1.12 }, perKill: 22, day: 280, need: 'bare' },
  { n: 4, from: 31, to: 40, name: '소금벌', metal: '소금강', hide: '전갈 껍질', weapon: 50, armor: 64, kills: 12, mon: { hp: 555, attack: 130, defense: 50, hit: 1.12 }, perKill: 36, day: 470, need: 'food' },
  { n: 5, from: 41, to: 50, name: '잿골', metal: '잿쇠', hide: '도마뱀 비늘', weapon: 66, armor: 83, kills: 15, mon: { hp: 816, attack: 166, defense: 64, hit: 1.12 }, perKill: 59, day: 770, need: 'food' },
  { n: 6, from: 51, to: 60, name: '안개늪', metal: '이끼쇠', hide: '안개실', weapon: 84, armor: 104, kills: 18, mon: { hp: 1207, attack: 210, defense: 84, hit: 1.05 }, perKill: 98, day: 1300, need: 'holy' },
  { n: 7, from: 61, to: 70, name: '잠긴 도성', metal: '옛 청동', hide: '비늘 가죽', weapon: 104, armor: 127, kills: 22, mon: { hp: 2016, attack: 250, defense: 103, hit: 1 }, perKill: 160, day: 2100, need: 'merc' },
  { n: 8, from: 71, to: 80, name: '구름다리', metal: '구름은', hide: '염소털', weapon: 126, armor: 152, kills: 26, mon: { hp: 2645, attack: 318, defense: 122, hit: 1.12 }, perKill: 270, day: 3500, need: 'merc2' },
  { n: 9, from: 81, to: 90, name: '별못', metal: '별쇠', hide: '나방 비단', weapon: 150, armor: 179, kills: 30, mon: { hp: 3700, attack: 394, defense: 158, hit: 1.13 }, perKill: 440, day: 5700, need: 'bard' },
  { n: 10, from: 91, to: 100, name: '처음 모루', metal: '첫쇠', hide: '그림자 가죽', weapon: 176, armor: 208, kills: 35, mon: { hp: 4685, attack: 466, defense: 186, hit: 1.08 }, perKill: 730, day: 9400, need: 'bard' },
];
export const BAND_MAX = BANDS.length;
export const LEVEL_MAX = 100;

export const bandByNo = (n) => BANDS[Math.min(BAND_MAX, Math.max(1, n)) - 1];
/** 그 레벨이 드는 구간. */
export const bandOfLevel = (level) => bandByNo(Math.ceil(Math.max(1, level) / 10));

/** 지금 지역 셋의 구간 (LV-B1). 새 지역은 곳(place)에 band를 적는다. */
const TOWN_BAND = { '시작 마을': 1, '서쪽 숲': 1, 광산: 1, '강가 낚시터': 1, '폐허 입구': 1, 나루: 2, 갈대밭: 2, 고갯길: 2, 소리재: 2 };
/** 그곳의 구간. 모르는 곳은 1. */
export const bandOfPlace = (place) => bandByNo(place?.band || TOWN_BAND[place?.town] || 1);

/** 우두머리 (LV-I3): 그 레벨 보통 몬스터의 생명력 4배, 공격력 1.25배. */
export const BOSS = { hp: 4, attack: 1.25, xp: 5 };
/** 그 레벨의 보통 몬스터 숫자: 구간 가운데 값을 레벨에 따라 위아래로 벌린다 (LV-I2). */
export function normalAt(level) {
  const b = bandOfLevel(level), f = 1 + (level - (b.n * 10 - 5)) * 0.04;
  return { hp: Math.round(b.mon.hp * f), attack: Math.round(b.mon.attack * f), defense: Math.round(b.mon.defense * f) };
}

// ── 제작 단계 (LV-F): 단계마다 제작 레벨 넷. 지금의 1~4가 1단계다 ──
export const TIER_SIZE = 4;
export const CRAFT_LV_MAX = BAND_MAX * TIER_SIZE;
/** 그 제작 레벨(또는 설계도 레벨)이 드는 단계. */
export const tierOfLv = (lv) => Math.min(BAND_MAX, Math.ceil(Math.max(1, lv) / TIER_SIZE));

// ── 비율로 붙는 버프 (LV-H) ──
/** 음식: 6% + 구간 번호 × 1%. 21(3구간)부터. 그 앞은 지금처럼 고정값이다. */
export const foodRate = (n) => (n < 3 ? 0 : 0.06 + 0.01 * n);
/** 성수: 5% + (구간 번호 − 4) × 1%. 41(5구간)부터. 그 앞의 성수는 지금 값(5%) 그대로다. */
export const holyRate = (n) => (n < 5 ? 0.05 : 0.05 + 0.01 * (n - 4));
/** 버프 용병(북 치는 이): 10% + (구간 번호 − 8) × 2%. 71(8구간)부터. */
export const bardRate = (n) => (n < 8 ? 0 : 0.10 + 0.02 * (n - 8));

// ── 은화 (LV-L) ──
/** 이자가 붙으려면 그날 해야 하는 일의 수 (LV-L9). */
export const INTEREST_WORK = 30;
/** 도적이 한 칸 세지는 은화 (LV-L10): 1~20은 지금 값 1,000, 그 뒤는 그 구간 닷새 벌이. */
export const banditStep = (n, base = 1000) => (n <= 2 ? base : bandByNo(n).day * 5);
/** 그 레벨 몬스터 한 마리의 경험치 (LV-I4): 그 레벨의 다음 레벨까지 ÷ 레벨당 마릿수. */
export const monsterXp = (level, xpToNext) => Math.round(xpToNext(level) / bandOfLevel(level).kills / 10) * 10;

// ── 만들기에도 경험치 (LV-M2): 그 단계 물건 하나가 그 구간 몬스터 한 마리의 40%. 등급마다 절반씩 더. 승급작은 열 마리치 ──
export const MAKE_XP = 0.4;
export const PROMO_KILLS = 10;
const midXp = (tier, xpToNext) => monsterXp(tier * 10 - 5, xpToNext);
/** 그 제작 레벨의 물건에 견줄 몬스터의 레벨: 제작 레벨 넷이 캐릭터 레벨 열에 걸친다 (1 → 1, 4 → 9, 5 → 11, 40 → 99). */
export const levelOfCraft = (lv) => Math.min(LEVEL_MAX, Math.round((Math.max(1, lv) - 1) * 2.5) + 1);
/**
 * 물건 하나의 경험치: 그 설계도 레벨에 견줄 몬스터 한 마리의 40%. 등급마다 절반씩 더.
 * 단계의 가운데 값으로 주면 가장 쉬운 설계도(짚신)가 들쥐 두 마리치가 되어, 쉬운 것만 거듭 짓는 길이 사냥보다 빨라진다.
 */
export const makeXp = (lv, grade, xpToNext) => Math.round(monsterXp(levelOfCraft(lv), xpToNext) * MAKE_XP * (1 + 0.5 * (grade || 0)));
export const promoXp = (tier, xpToNext) => midXp(tier, xpToNext) * PROMO_KILLS;

// ── 가 본 구간 (LV-G1): 안 가 본 구간의 물건은 경매장에도 전리품에도 나오지 않는다 ──
/** 지금까지 가 본 곳 가운데 가장 높은 구간. places: 곳 자료(PLACES). */
export function reachedBand(state, places) {
  let n = bandOfPlace(places[state.place]).n;
  for (const id of Object.keys(state.dex?.places || {})) if (places[id]) n = Math.max(n, bandOfPlace(places[id]).n);
  return n;
}
