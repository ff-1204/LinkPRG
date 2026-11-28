// 스킬 진화 (N4-1, N4-2). 고른 갈래의 효과만 적용된다.

import { pushLine, ding } from './log.js?v=a5d0e2e';
import { EVOLVE, EVOLVE_AT, FORGET_ITEM } from '../data/evolve.js?v=a5d0e2e';
import { SKILL_NAMES } from './skills.js?v=a5d0e2e';
import { countOf, takeById } from './inventory.js?v=a5d0e2e';
import { itemDef } from '../data/items.js?v=a5d0e2e';
import { eulReul } from './ko.js?v=a5d0e2e';

/** 그 스킬에서 고른 갈래(없으면 null). */
export function branchOf(state, skillId) {
  const id = state.evolve?.[skillId];
  if (!id) return null;
  return (EVOLVE[skillId] || []).find((b) => b.id === id) || null;
}

/** 고를 수 있는데 아직 고르지 않은 스킬들. */
export function pendingEvolves(state) {
  return Object.keys(EVOLVE).filter((id) => (state.skills[id]?.grade || 0) >= EVOLVE_AT && !state.evolve?.[id]);
}

/** 진화 창이 그릴 것. */
export function evolveView(state, skillId) {
  const list = EVOLVE[skillId];
  if (!list) return null;
  return {
    skill: skillId, name: SKILL_NAMES[skillId], chosen: state.evolve?.[skillId] || null,
    can: (state.skills[skillId]?.grade || 0) >= EVOLVE_AT,
    branches: list.map((b) => ({ id: b.id, name: b.name, gain: b.gain, lose: b.lose })),
  };
}

export function chooseBranch(state, events, skillId, branchId) {
  const list = EVOLVE[skillId];
  if (!list) throw new Error('갈래가 없는 스킬입니다');
  if ((state.skills[skillId]?.grade || 0) < EVOLVE_AT) throw new Error('아직 고를 수 없습니다. 중급이 되어야 합니다');
  if (state.evolve[skillId]) throw new Error("이미 골랐습니다. 되돌리려면 '잊는 물'이 있어야 합니다");
  const b = list.find((x) => x.id === branchId);
  if (!b) throw new Error('모르는 갈래입니다');
  state.evolve[skillId] = b.id;
  ding(state, events, { level: 2, title: `${SKILL_NAMES[skillId]}에서 '${b.name}'의 길을 골랐습니다`, big: b.name, body: `얻는 것: ${b.gain}. 잃는 것: ${b.lose}.` });
}

/** 잊는 물을 마셔 갈래를 지운다. 다시 고를 수 있게 된다. */
export function forgetBranch(state, events, skillId) {
  if (!state.evolve[skillId]) throw new Error('고른 갈래가 없습니다');
  if (countOf(state, FORGET_ITEM) < 1) throw new Error(`${itemDef(FORGET_ITEM).name}이 없습니다`);
  takeById(state, FORGET_ITEM, 1);
  const was = branchOf(state, skillId);
  delete state.evolve[skillId];
  pushLine(state, events, { k: 'me', text: `${eulReul(itemDef(FORGET_ITEM).name)} 마셨다. 손이 '${was.name}'을 잊었다.` });
  events.push({ type: 'evolve', skill: skillId });
}
