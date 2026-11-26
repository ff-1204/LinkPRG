// 행동 숙련도. 쓴 만큼 오르고, 쉬운 대상일수록 덜 오른다. (F03-01)

export const RANKS = ['초급', '중급', '고급', '달인', '대가'];
export const LEVELS_PER_RANK = 9;
export const MAX_GRADE = RANKS.length * LEVELS_PER_RANK - 1; // 0부터 44까지

/** 숙련도 이름. 행동 id → 보이는 이름. */
export const SKILL_NAMES = {
  strike: '치기', guard: '막기', smash: '강타', evade: '회피', focus: '집중', pray: '기도', haul: '나르기', stamina: '지구력', mining: '채광', fishing: '낚시', gathering: '채집',
  smithing: '대장', sculpting: '조각', cooking: '요리', appraise: '감정', lockpick: '자물쇠',
};

/** 숙련도가 주는 것 (Z62). 수치는 숨기고 효과만 적는다. 숙련도가 오를수록 커진다. */
export const SKILL_EFFECTS = {
  strike: '공격력이 오른다',
  guard: '막기가 더 잘 되고, 되받아치는 한 방이 세진다',
  smash: '강타가 더 잘 들어가고 더 아프다',
  evade: '더 잘 피하고, 피한 뒤 치는 한 방이 세진다',
  focus: '모아 친 한 방이 세진다',
  pray: '최대 마나가 오른다',
  haul: '더 많이 들 수 있다',
  stamina: '최대 생명력이 오른다',
  mining: '허탕이 줄어든다',
  fishing: '허탕이 줄어든다',
  gathering: '허탕이 줄어든다',
  smithing: '만든 것의 등급이 오르기 쉽고, 강화가 잘 된다',
  sculpting: '작품이 더 잘 나온다',
  lockpick: '자물쇠를 더 잘 연다',
  appraise: '물건을 더 비싸게 판다. 솜씨가 깊어지면 낯선 물건도 알아본다',
};
export const skillEffect = (id) => SKILL_EFFECTS[id] || '';

export function emptySkill() {
  return { grade: 0, xp: 0, uses: 0 };
}

/** 등급 번호(0~44)를 "초급 7" 같은 글로. */
export function gradeLabel(grade) {
  const g = Math.max(0, Math.min(MAX_GRADE, grade));
  return `${RANKS[Math.floor(g / LEVELS_PER_RANK)]} ${(g % LEVELS_PER_RANK) + 1}`;
}

export function rankOf(grade) {
  return Math.floor(Math.max(0, Math.min(MAX_GRADE, grade)) / LEVELS_PER_RANK);
}

/** 다음 등급까지 필요한 경험치. */
export function xpNeeded(grade) {
  return 120 + 40 * grade;
}

/**
 * 한 번 했을 때 오르는 경험치.
 * difficulty는 대상이 요구하는 등급 번호다. 내 등급이 그보다 높을수록 덜 오른다.
 */
export function xpGain(grade, difficulty, multiplier = 1) {
  const over = Math.max(0, grade - difficulty);
  // 반올림하지 않는다. 인내의 +1% 같은 작은 덤이 지워지지 않게 소수로 쌓는다.
  return Math.max(1, (10 * multiplier) / (1 + over * 0.35));
}

/**
 * 숙련도를 한 번 쓴다. skill을 고치고, 일어난 일을 돌려준다.
 * @returns {{gained:number, leveled:boolean, rankUp:boolean, grade:number}}
 */
export function useSkill(skill, difficulty, multiplier = 1) {
  skill.uses += 1;
  if (skill.grade >= MAX_GRADE) return { gained: 0, leveled: false, rankUp: false, grade: skill.grade };
  const gained = xpGain(skill.grade, difficulty, multiplier);
  skill.xp += gained;
  let leveled = false;
  let rankUp = false;
  while (skill.grade < MAX_GRADE && skill.xp >= xpNeeded(skill.grade)) {
    skill.xp -= xpNeeded(skill.grade);
    const before = rankOf(skill.grade);
    skill.grade += 1;
    leveled = true;
    if (rankOf(skill.grade) > before) rankUp = true;
  }
  return { gained, leveled, rankUp, grade: skill.grade };
}

/** 다음 등급까지 얼마나 찼는지 0~1. */
export function progress(skill) {
  if (skill.grade >= MAX_GRADE) return 1;
  return Math.min(1, skill.xp / xpNeeded(skill.grade));
}
