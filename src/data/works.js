// 조각 (N2, X1). 작품 하나에 칼질 마흔 번. 본 것만 깎는다.
// 등급은 그림으로 미리 알 수 없다. 마지막 칼질에서 갈린다 (X1-3).

export const CUTS = 40;
export const WORK_GRADES = ['졸작', '평작', '수작', '걸작', '대작'];
/** 등급 확률의 처음 값 (N2-5). */
export const WORK_BASE = [20, 45, 25, 9, 1];
export const WORK_PUSH = { perSkillGrade: 0.04, perArt: 0.03 };
/** 깎을 거리: 참나무 가지 넷. */
export const WORK_NEEDS = [{ id: 'oakbranch', n: 4 }];
export const SCULPT_DIFFICULTY = 2;

/** 그림이 바뀌는 칼질 (X1): 10, 22, 34, 40번째. */
export const CUT_MARKS = {
  10: '나무토막의 모서리가 둥글어졌다.',
  22: '머리와 몸통이 갈라져 보인다.',
  34: '귀와 다리가 드러났다. 이제 다듬을 차례다.',
};
export const CUT_LINES = ['칼을 밀었다. 대팻밥이 말려 떨어진다.', '칼을 밀었다. 나뭇결이 드러난다.', '칼을 밀었다. 손끝에 결이 느껴진다.', '칼을 밀었다. 숨을 참았다.'];

/**
 * 주제. seen: 무엇을 겪어야 깎을 수 있는가 — mon(마주친 괴물), animal(본 짐승), person(사이가 단골 이상인 사람)
 * art: 그림이 있으면 그 이름 앞머리. 없으면 글로만 보인다.
 * alive: 생명을 불어넣으면 되는 동료
 */
export const SUBJECTS = {
  rabbit: { name: '토끼', seen: { animal: 'rabbit' }, art: 'rabbit', alive: 'stonerabbit' },
  boar: { name: '멧돼지', seen: { mon: 'boar' }, alive: 'woodboar' },
  wolf: { name: '늑대', seen: { mon: 'wolf' }, alive: 'woodwolf' },
  crab: { name: '게', seen: { mon: 'crab' }, alive: null },
  granny: { name: '잡화점 할머니', seen: { person: 'granny' }, alive: null },
  instructor: { name: '교관', seen: { person: 'instructor' }, alive: null },
};
export const SUBJECT_ORDER = ['rabbit', 'boar', 'wolf', 'crab', 'granny', 'instructor'];

/** 감상하면 붙는 버프: 등급이 높을수록 크다. 하루 간다 (N2-2). */
export const ADMIRE = [
  null,
  { name: '잔잔한 마음', text: '숙련도 오름 +3%', xp: 0.03 },
  { name: '맑은 눈', text: '숙련도 오름 +6%', xp: 0.06 },
  { name: '벅찬 가슴', text: '숙련도 오름 +10%, 최대 생명력 +10', xp: 0.10, hp: 10 },
  { name: '떨리는 손', text: '숙련도 오름 +15%, 최대 생명력 +20', xp: 0.15, hp: 20 },
];

/** 값: 등급마다. 팔 때는 여느 물건처럼 40%. */
export const WORK_PRICE = [4, 15, 45, 150, 600];
/** 세웠을 때 다음 날 오르는 마을 명성 (X3-3). */
export const WORK_FAME = [0, 1, 3, 8, 20];
/** 생명을 불어넣을 때 잃는 예술 (작품 몇 개만큼의 쌓임). */
export const ALIVE_COST = 5;
