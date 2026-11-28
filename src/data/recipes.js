// 설계도 (N1). 검 한 자루에 망치질 열두 번. 재료는 시작할 때 들어가고, 그만두면 잃는다.

/** 등급 확률의 처음 값 (N1-2): 일반 52, 고급 30, 희귀 14, 영웅 3.5, 전설 0.5. */
export const GRADE_BASE = [52, 30, 14, 3.5, 0.5];

/** 확률을 움직이는 것 넷 (N1-3). 값은 "밀기"에 더해진다. 밀기가 클수록 높은 등급 쪽으로 쏠린다. */
export const PUSH = {
  perSkillGrade: 0.03, // 제작 숙련도 한 단계마다
  perCraft: 0.02, // 손재주 1마다
  perQuality: 0.25, // 재료 품질(평균 등급) 1마다
  warm: 0.45, // 식히지 않고 다 쳤을 때
};

/**
 * 제작 레벨 (Z79): 갈래마다(대장·재봉·세공) 만든 것으로 오르는 레벨. 설계도마다 lv에 열린다.
 * branch: 'smith' 대장간, 'sew' 의류점, 'jewel' 예술협회.
 */
export const BRANCHES = {
  smith: { id: 'smith', name: '대장', act: 'craft', work: 'smith', where: '대장간' },
  sew: { id: 'sew', name: '재봉', act: 'sew', work: 'tailor', where: '의류점' },
  jewel: { id: 'jewel', name: '세공', act: 'jewel', work: null, where: '예술협회' },
  cook: { id: 'cook', name: '요리', act: 'cook', work: 'chef', where: '공용주방' }, // 요리 레벨 (Z83): 설계도 대신 요리 조합
};
export const BRANCH_ORDER = ['smith', 'sew', 'jewel', 'cook'];
/** 다음 레벨까지 드는 제작 경험: 지금 레벨 × 10. 하나 다 만들면 설계도 레벨 × (1 + 등급). */
export const CRAFT_LV = { per: 10, workXp: 1.5 };

export const RECIPES = {
  coppersword: {
    id: 'coppersword', name: '구리 검', makes: 'coppersword', skill: 'smithing', difficulty: 1, hits: 12, branch: 'smith', lv: 1,
    needs: [{ id: 'copperore', n: 4 }, { id: 'oakbranch', n: 1 }],
    say: '무르지만 다루기 쉽다. 처음 두드려 보기에 좋다.',
  },
  ironsword: {
    id: 'ironsword', name: '철검', makes: 'ironsword', skill: 'smithing', difficulty: 4, hits: 12, branch: 'smith', lv: 3, promo: true, // 대장 1단계의 승급작 (LV-F1)
    needs: [{ id: 'ironore', n: 6 }, { id: 'oakbranch', n: 1 }],
    say: '쇠를 두드려 편 검. 식기 전에 쳐야 날이 선다.',
  },
};

RECIPES.chisel = {
  id: 'chisel', name: '조각칼', makes: 'chisel', skill: 'smithing', difficulty: 1, hits: 8, branch: 'smith', lv: 1,
  needs: [{ id: 'ironore', n: 2 }, { id: 'oakbranch', n: 1 }],
  say: '나무를 깎는 작은 칼. 등급이 높으면 오래 쓴다.',
};

// 지금 있는 장비를 모두 만들 수 있게 (Z79)
const smith = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: 'smithing', difficulty, hits, branch: 'smith', lv, needs, say });
RECIPES.woodsword = smith('woodsword', '낡은 목검', 1, 0, 8, [{ id: 'oakbranch', n: 3 }], '참나무를 깎아 쇠테를 둘렀다. 허수아비 치기에 좋다.');
RECIPES.ashwand = smith('ashwand', '물푸레 지팡이', 2, 2, 10, [{ id: 'oakbranch', n: 3 }, { id: 'copperore', n: 2 }], '끝에 구리 고리를 박은 지팡이. 마법사가 쓴다.');
RECIPES.thinknife = smith('thinknife', '얇은 칼', 2, 3, 10, [{ id: 'ironore', n: 3 }, { id: 'oakbranch', n: 1 }], '소매에 들어가는 칼. 도적이 쓴다.');
RECIPES.shortbow = smith('shortbow', '짧은 활', 3, 3, 10, [{ id: 'oakbranch', n: 3 }, { id: 'batwing', n: 2 }], '박쥐 날개 힘줄로 시위를 맸다. 궁수가 쓴다.');
RECIPES.oldshield = smith('oldshield', '낡은 방패', 4, 4, 12, [{ id: 'oakbranch', n: 4 }, { id: 'ironore', n: 2 }], '나무판에 쇠테를 둘렀다. 전사가 쓴다.');

export const RECIPE_ORDER = ['woodsword', 'coppersword', 'chisel', 'ashwand', 'thinknife', 'ironsword', 'shortbow', 'oldshield'];

/** 가죽 (Z71). 멧돼지 가죽을 그대로 꿰맨다. 한 번 누르면 한 땀. 가죽은 식지 않는다. */
RECIPES.leatherboots = {
  id: 'leatherboots', name: '가죽 장화', makes: 'leatherboots', skill: 'leather', difficulty: 2, hits: 10, sew: true, branch: 'sew', lv: 2,
  needs: [{ id: 'boarhide', n: 2 }],
  say: '발목까지 감싸는 장화. 처음 꿰매 보기에 좋다.',
};
RECIPES.leathervest = {
  id: 'leathervest', name: '가죽 조끼', makes: 'leathervest', skill: 'smithing', difficulty: 3, hits: 12, branch: 'smith', lv: 3,
  needs: [{ id: 'boarhide', n: 3 }],
  say: '가죽 두 겹 사이에 쇠테를 대고 두드려 붙인다.',
};
RECIPES.leatherarmor = {
  id: 'leatherarmor', name: '가죽 갑옷', makes: 'leatherarmor', skill: 'smithing', difficulty: 5, hits: 16, branch: 'smith', lv: 4,
  needs: [{ id: 'boarhide', n: 5 }, { id: 'ironore', n: 2 }],
  say: '겹 사이에 쇠 징을 박는다. 망치질이 많다.',
};
const sew = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: 'leather', difficulty, hits, sew: true, branch: 'sew', lv, needs, say });
RECIPES.sandals = sew('sandals', '짚신', 1, 0, 6, [{ id: 'herb', n: 3 }], '풀을 꼬아 삼는다. 금방 닳지만 금방 삼는다.');
RECIPES.leathergloves = sew('leathergloves', '가죽 장갑', 1, 1, 8, [{ id: 'boarhide', n: 1 }], '손바닥에 가죽을 덧대 꿰맨다.');
export const SEW_ORDER = ['sandals', 'leathergloves', 'leatherboots', 'beargloves', 'bearboots'];

// 머리·몸통은 대장간에서 (Z86)
RECIPES.trainwear = smith('trainwear', '훈련복', 1, 1, 8, [{ id: 'sailcloth', n: 1 }], '돛천에 쇠단추를 박아 두드려 여민다.');
RECIPES.ironhelm = smith('ironhelm', '쇠 투구', 2, 3, 12, [{ id: 'ironore', n: 4 }], '쇠판을 둥글게 두드려 편다.');
RECIPE_ORDER.splice(0, RECIPE_ORDER.length, 'woodsword', 'coppersword', 'chisel', 'trainwear', 'ashwand', 'thinknife', 'ironhelm', 'ironsword', 'shortbow', 'leathervest', 'oldshield', 'leatherarmor',
  'steelhelm', 'steelwand', 'steelknife', 'longbow', 'steelsword', 'steelshield', 'steelarmor');

/** 세공 (Z80): 예술협회에서 반지를 다듬는다. 조각 숙련도가 오른다. 식지 않는다. */
const jewel = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: 'sculpting', difficulty, hits, sew: true, jewel: true, branch: 'jewel', lv, needs, say });
RECIPES.copperring = jewel('copperring', '구리 반지', 1, 1, 8, [{ id: 'copperore', n: 2 }], '구리를 녹여 둥글게 감았다.');
RECIPES.prayerbeads = jewel('prayerbeads', '기도 구슬', 1, 1, 8, [{ id: 'oakbranch', n: 2 }, { id: 'copperore', n: 1 }], '참나무 구슬을 꿰었다. 사제가 쓴다.');
RECIPES.fangring = jewel('fangring', '송곳니 반지', 2, 2, 10, [{ id: 'wolffang', n: 2 }, { id: 'copperore', n: 1 }], '늑대 송곳니를 구리에 물렸다.');
RECIPES.ironring = jewel('ironring', '철 반지', 3, 3, 12, [{ id: 'ironore', n: 3 }, { id: 'wolffang', n: 1 }], '두꺼운 쇠고리에 송곳니 하나를 박았다.');
export const JEWEL_ORDER = ['copperring', 'prayerbeads', 'fangring', 'ironring', 'steelring'];
export const JEWEL_LINES = ['줄로 쓸었다. 쇳가루가 반짝인다.', '끌로 홈을 팠다. 손끝에 힘이 들어간다.', '고리를 불에 달궈 둥글게 다듬었다.', '가죽에 문질러 광을 냈다.'];
/**
 * 요리 (Z93): 만들기·바느질처럼 레벨별 요리 목록에서 골라, 한 번 누르면 한 번 젓는다. 식지 않는다.
 * 공용주방에서는 그릇에 담아 가방에, 강가 모닥불에서는 다 되면 그 자리에서 먹는다. 등급이 높을수록 음식의 힘이 오래 간다.
 */
const cookR = (id, lv, hits, needs, say) => ({ id: `cook_${id}`, name: DISHES_NAME[id], makes: `dish_${id}`, dish: id, skill: 'cooking', difficulty: lv, hits, sew: true, cook: true, branch: 'cook', lv, needs, say });
const DISHES_NAME = { bearstew: '곰 고기 전골', saltfish: '소금 붕어 구이', berryrice: '산열매 주먹밥', boarstew: '멧돼지 약초 찜', herbfish: '약초 붕어 탕', eelsoup: '장어 소금 국', boarskewer: '멧돼지 산열매 꼬치' };
RECIPES.cook_saltfish = cookR('saltfish', 1, 6, [{ id: 'crucian', n: 1 }, { id: 'salt', n: 1 }], '민물고기는 소금만 쳐서 굽는 게 제일이다.');
RECIPES.cook_berryrice = cookR('berryrice', 1, 6, [{ id: 'riceball', n: 1 }, { id: 'berry', n: 1 }], '주먹밥에 산열매를 박는다.');
RECIPES.cook_boarstew = cookR('boarstew', 1, 8, [{ id: 'boarmeat', n: 1 }, { id: 'herb', n: 1 }, { id: 'salt', n: 1 }], '누린내는 약초로 잡는다.');
RECIPES.cook_herbfish = cookR('herbfish', 1, 8, [{ id: 'crucian', n: 1 }, { id: 'herb', n: 1 }], '생선 넣은 약초 물. 아픈 사람에게 먹인다.');
RECIPES.cook_eelsoup = cookR('eelsoup', 2, 10, [{ id: 'eel', n: 1 }, { id: 'salt', n: 1 }, { id: 'herb', n: 1 }], '나루 장어를 소금과 약초만 넣고 끓인다.');
RECIPES.cook_boarskewer = cookR('boarskewer', 3, 10, [{ id: 'boarmeat', n: 1 }, { id: 'berry', n: 1 }, { id: 'salt', n: 1 }], '멧돼지 고기에 산열매를 끼우고 소금을 쳐서 굽는다.');
RECIPES.cook_bearstew = cookR('bearstew', 6, 12, [{ id: 'bearmeat', n: 1 }, { id: 'herb', n: 2 }, { id: 'salt', n: 1 }], '곰 고기에 약초를 넉넉히 넣고 오래 끓인다.');
export const COOK_ORDER = ['cook_saltfish', 'cook_berryrice', 'cook_boarstew', 'cook_herbfish', 'cook_eelsoup', 'cook_boarskewer', 'cook_bearstew'];
export const COOK_STIR = ['솥을 저었다. 김이 오른다.', '불을 조금 줄였다. 냄새가 번진다.', '간을 보았다. 조금 더 끓인다.', '뒤집었다. 지글거린다.'];
export const ORDER_OF = { smith: RECIPE_ORDER, sew: SEW_ORDER, jewel: JEWEL_ORDER, cook: COOK_ORDER };
export const STITCH_LINES = ['바늘을 찔렀다. 실이 팽팽하다.', '송곳으로 구멍을 내고 실을 당겼다.', '한 땀 떴다. 가죽이 질기다.', '바늘 끝이 손가락을 스쳤다.'];

/** 망치질 줄. 몇 번째인지에 따라 다르다. */
export const HAMMER_LINES = [
  '망치를 내리쳤다. 불똥이 튄다.',
  '망치를 내리쳤다. 쇠가 조금 펴진다.',
  '망치를 내리쳤다. 팔이 울린다.',
  '망치를 내리쳤다. 쇳소리가 맑다.',
];
export const HAMMER_MARKS = {
  4: '쇳덩이가 길쭉해졌다. 날이 될 쪽이 보인다.',
  9: '검의 꼴이 잡혔다. 이제 날을 세울 차례다.',
};

export function recipeById(id) {
  const r = RECIPES[id];
  if (!r) throw new Error('모르는 설계도: ' + id);
  return r;
}

// 승급작 (LV-F11): 그 단계에서 이것을 지어 보이면 다음 단계가 열린다. 갈래마다 단계에 하나
for (const id of ['leatherboots', 'ironring', 'cook_boarskewer']) if (RECIPES[id]) RECIPES[id].promo = true;

// 2단계: 강철과 곰 가죽 (LV-F2). 제작 레벨 5~8. 승급작은 강철 갑옷·곰 가죽 장화·강철 반지·곰 고기 전골
const jewel2 = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: RECIPES.copperring.skill, difficulty, hits, jewel: true, sew: RECIPES.copperring.sew, branch: 'jewel', lv, needs, say });
RECIPES.steelhelm = smith('steelhelm', '강철 투구', 5, 5, 14, [{ id: 'steel', n: 4 }], '강철판을 둥글게 펴고 이마에 띠를 두른다.');
RECIPES.steelwand = smith('steelwand', '강철 고리 지팡이', 5, 5, 12, [{ id: 'oakbranch', n: 3 }, { id: 'steel', n: 2 }], '물푸레 자루 끝에 강철 고리 셋을 건다. 마법사가 쓴다.');
RECIPES.steelknife = smith('steelknife', '강철 단검', 6, 6, 12, [{ id: 'steel', n: 3 }, { id: 'oakbranch', n: 1 }], '손바닥만 한 날을 얇게 벼린다. 도적이 쓴다.');
RECIPES.longbow = smith('longbow', '긴 활', 6, 6, 12, [{ id: 'oakbranch', n: 4 }, { id: 'batwing', n: 3 }, { id: 'steel', n: 1 }], '긴 나무에 매의 힘줄을 건다. 궁수가 쓴다.');
RECIPES.steelsword = smith('steelsword', '강철 검', 7, 7, 16, [{ id: 'steel', n: 6 }, { id: 'oakbranch', n: 1 }], '접고 두드리기를 거듭한다. 식히면 처음부터다.');
RECIPES.steelshield = smith('steelshield', '강철 방패', 7, 7, 14, [{ id: 'oakbranch', n: 4 }, { id: 'steel', n: 3 }], '나무판에 강철판을 덧댄다. 전사가 쓴다.');
RECIPES.steelarmor = { ...smith('steelarmor', '강철 갑옷', 8, 8, 20, [{ id: 'bearhide', n: 4 }, { id: 'steel', n: 6 }], '곰 가죽 위에 강철 비늘을 한 장씩 엮는다. 망치질이 가장 많다.'), promo: true };
RECIPES.beargloves = sew('beargloves', '곰 가죽 장갑', 5, 5, 10, [{ id: 'bearhide', n: 1 }], '두꺼운 가죽을 손 모양으로 꿰맨다.');
RECIPES.bearboots = { ...sew('bearboots', '곰 가죽 장화', 6, 6, 14, [{ id: 'bearhide', n: 3 }], '밑창을 세 겹으로 댄다. 바늘이 잘 들어가지 않는다.'), promo: true };
RECIPES.steelring = { ...jewel2('steelring', '강철 반지', 6, 6, 12, [{ id: 'steel', n: 3 }, { id: 'wolffang', n: 2 }], '강철을 가늘게 뽑아 세 번 감는다.'), promo: true };
RECIPES.cook_bearstew.promo = true;


// 3~10단계의 설계도 (LV-F3~F10). 그 단계가 열리기 전에는 목록에 나오지 않는다
import { tierRecipes } from './tiers.js?v=0cf2820';
{
  const more = tierRecipes();
  for (const [branch, list] of Object.entries(more)) for (const r of list) { RECIPES[r.id] = r; ORDER_OF[branch].push(r.id); }
  // 작은 종 (BM-E, BM-G5): 종 조각 하나로 세공한다. 종 조각을 처음 손에 넣기 전에는 목록에 없다(needDex). 장비가 아니라 등급이 없다(plain)
  RECIPES.smallbell = { id: 'smallbell', name: '작은 종', makes: 'smallbell', difficulty: 33, hits: 21, lv: 33, needs: [{ id: 'bellshard', n: 1 }], say: '깨진 모를 줄로 쓸고, 속을 파서 작은 추를 단다. 조각 하나에 종 하나다.', skill: 'sculpting', branch: 'jewel', sew: true, jewel: true, plain: true, needDex: 'bellshard' };
  ORDER_OF.jewel.push('smallbell');
}
