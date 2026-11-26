// 테스트 도우미: 한 때(아침·낮·밤)를 넘긴다. 낮에는 잠깐 쉬기를 거듭하고, 밤에는 잔다.
import { dispatch } from '../src/core/game.js';

export function passPhase(s) {
  const events = [];
  if (s.phase === 2) return dispatch(s, { type: 'act', id: 'rest' });
  const was = s.phase;
  let guard = 0;
  while (s.phase === was && guard++ < 50) events.push(...dispatch(s, { type: 'act', id: 'rest' }));
  return events;
}

/** 이야기를 듣는다. 그 사람이 곁에서 일하는 나를 보고 먼저 말을 걸어온 뒤라고 친다. */
export function talkTo(s, npc, options) {
  if (!s.flags.spoke) s.flags.spoke = {};
  s.flags.spoke[npc] = s.day;
  return dispatch(s, { type: 'talk', npc }, options);
}
