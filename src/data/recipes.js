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
};
export const BRANCH_ORDER = ['smith', 'sew', 'jewel'];
/** 다음 레벨까지 드는 제작 경험: 지금 레벨 × 10. 하나 다 만들면 설계도 레벨 × (1 + 등급). */
export const CRAFT_LV = { per: 10, workXp: 1.5 };

export const RECIPES = {
  coppersword: {
    id: 'coppersword', name: '구리 검', makes: 'coppersword', skill: 'smithing', difficulty: 1, hits: 12, branch: 'smith', lv: 1,
    needs: [{ id: 'copperore', n: 4 }, { id: 'oakbranch', n: 1 }],
    say: '무르지만 다루기 쉽다. 처음 두드려 보기에 좋다.',
  },
  ironsword: {
    id: 'ironsword', name: '철검', makes: 'ironsword', skill: 'smithing', difficulty: 4, hits: 12, branch: 'smith', lv: 3,
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
  id: 'leathervest', name: '가죽 조끼', makes: 'leathervest', skill: 'leather', difficulty: 3, hits: 12, sew: true, branch: 'sew', lv: 3,
  needs: [{ id: 'boarhide', n: 3 }],
  say: '가죽 두 겹을 꿰맨 조끼.',
};
RECIPES.leatherarmor = {
  id: 'leatherarmor', name: '가죽 갑옷', makes: 'leatherarmor', skill: 'leather', difficulty: 5, hits: 16, sew: true, branch: 'sew', lv: 4,
  needs: [{ id: 'boarhide', n: 5 }, { id: 'ironore', n: 2 }],
  say: '겹 사이에 쇠 징을 박는다. 땀이 많다.',
};
const sew = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: 'leather', difficulty, hits, sew: true, branch: 'sew', lv, needs, say });
RECIPES.sandals = sew('sandals', '짚신', 1, 0, 6, [{ id: 'herb', n: 3 }], '풀을 꼬아 삼는다. 금방 닳지만 금방 삼는다.');
RECIPES.trainwear = sew('trainwear', '훈련복', 1, 1, 8, [{ id: 'sailcloth', n: 1 }], '질긴 돛천을 잘라 꿰맨 옷.');
export const SEW_ORDER = ['sandals', 'trainwear', 'leatherboots', 'leathervest', 'leatherarmor'];

/** 세공 (Z80): 예술협회에서 반지를 다듬는다. 조각 숙련도가 오른다. 식지 않는다. */
const jewel = (id, name, lv, difficulty, hits, needs, say) => ({ id, name, makes: id, skill: 'sculpting', difficulty, hits, sew: true, jewel: true, branch: 'jewel', lv, needs, say });
RECIPES.copperring = jewel('copperring', '구리 반지', 1, 1, 8, [{ id: 'copperore', n: 2 }], '구리를 녹여 둥글게 감았다.');
RECIPES.prayerbeads = jewel('prayerbeads', '기도 구슬', 1, 1, 8, [{ id: 'oakbranch', n: 2 }, { id: 'copperore', n: 1 }], '참나무 구슬을 꿰었다. 사제가 쓴다.');
RECIPES.fangring = jewel('fangring', '송곳니 반지', 2, 2, 10, [{ id: 'wolffang', n: 2 }, { id: 'copperore', n: 1 }], '늑대 송곳니를 구리에 물렸다.');
RECIPES.ironring = jewel('ironring', '철 반지', 3, 3, 12, [{ id: 'ironore', n: 3 }, { id: 'wolffang', n: 1 }], '두꺼운 쇠고리에 송곳니 하나를 박았다.');
export const JEWEL_ORDER = ['copperring', 'prayerbeads', 'fangring', 'ironring'];
export const JEWEL_LINES = ['줄로 쓸었다. 쇳가루가 반짝인다.', '끌로 홈을 팠다. 손끝에 힘이 들어간다.', '고리를 불에 달궈 둥글게 다듬었다.', '가죽에 문질러 광을 냈다.'];
export const ORDER_OF = { smith: RECIPE_ORDER, sew: SEW_ORDER, jewel: JEWEL_ORDER };
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
