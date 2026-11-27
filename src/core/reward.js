// 경험치를 주고, 레벨이 오르면 띠링을 울린다 (E10, E11). 싸움과 퀘스트가 같이 쓴다.

import { ding } from './log.js?v=ac59432';
import { gainXp, HP_PER_LEVEL, POINTS_PER_LEVEL } from './level.js?v=ac59432';
import { iGa } from './ko.js?v=ac59432';
import { jobDef } from '../data/jobs.js?v=ac59432';

export function grantXp(state, events, amount) {
  const before = state.level;
  const ups = gainXp(state, amount);
  for (let i = 0; i < ups; i++) {
    state.hp += HP_PER_LEVEL;
    if (jobDef(state.job)?.extraPoint) state.unspent += jobDef(state.job).extraPoint;
    ding(state, events, {
      level: 2, kind: 'levelup', title: `레벨 ${iGa(before + i + 1)} 되었습니다`, big: `레벨 ${before + i + 1}`,
      body: `최대 생명력 +${HP_PER_LEVEL}. 스탯 점수 ${POINTS_PER_LEVEL + (jobDef(state.job)?.extraPoint || 0)}을 나눠 주세요.`,
    });
  }
  return ups;
}
