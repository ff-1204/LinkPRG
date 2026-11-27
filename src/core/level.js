import { LEVEL_MAX } from '../data/bands.js?v=4f00195';
// 레벨과 경험치 (E10~E12, R2-1). 경험치는 전투와 의뢰에서 온다.

export const POINTS_PER_LEVEL = 3;
export const HP_PER_LEVEL = 10;
export const JOB_LEVEL = 5;

/** 다음 레벨까지 필요한 경험치: 20×레벨² + 60×레벨 + 20. */
export function xpToNext(level) {
  return 20 * level * level + 60 * level + 20;
}

/**
 * 경험치를 얻는다. 오른 레벨 수를 돌려준다.
 * 레벨이 오를 때마다 스탯 점수 3과 최대 생명력 10이 붙는다.
 */
export function gainXp(state, amount) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('경험치는 0 이상이어야 합니다');
  state.xp += Math.round(amount);
  let ups = 0;
  // 레벨은 100이 끝이다 (CM-E2): 그 뒤의 경험치는 버려지지 않고 쌓여, 다시 태어날 때 남는 몫에 든다
  while (state.level < LEVEL_MAX && state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level += 1;
    state.unspent += POINTS_PER_LEVEL;
    ups += 1;
  }
  return ups;
}
