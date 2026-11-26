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

export const RECIPES = {
  coppersword: {
    id: 'coppersword', name: '구리 검', makes: 'coppersword', skill: 'smithing', difficulty: 1, hits: 12,
    needs: [{ id: 'copperore', n: 4 }, { id: 'oakbranch', n: 1 }],
    say: '무르지만 다루기 쉽다. 처음 두드려 보기에 좋다.',
  },
  ironsword: {
    id: 'ironsword', name: '철검', makes: 'ironsword', skill: 'smithing', difficulty: 4, hits: 12,
    needs: [{ id: 'ironore', n: 6 }, { id: 'oakbranch', n: 1 }],
    say: '쇠를 두드려 편 검. 식기 전에 쳐야 날이 선다.',
  },
};

RECIPES.chisel = {
  id: 'chisel', name: '조각칼', makes: 'chisel', skill: 'smithing', difficulty: 1, hits: 8,
  needs: [{ id: 'ironore', n: 2 }, { id: 'oakbranch', n: 1 }],
  say: '나무를 깎는 작은 칼. 등급이 높으면 오래 쓴다.',
};

export const RECIPE_ORDER = ['coppersword', 'ironsword', 'chisel'];

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
