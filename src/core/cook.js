// 요리 (N3). 재료를 셋까지 넣어 조합을 찾는다.

import { next } from './rng.js?v=2de0e46';
import { pushLine, ding } from './log.js?v=2de0e46';
import { countOf, takeById } from './inventory.js?v=2de0e46';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=2de0e46';
import { itemDef } from '../data/items.js?v=2de0e46';
import { placeById } from '../data/places.js?v=2de0e46';
import { jobXp } from './jobs.js?v=2de0e46';
import { COOK_MAX, COOK_DIFFICULTY, INGREDIENTS, DISHES, DISH_ORDER, MUSH, COOK_LINES } from '../data/cooking.js?v=2de0e46';
import { iGa, eulReul, eunNeun } from './ko.js?v=2de0e46';
import { foodBuff, xpBoost } from './buffs.js?v=2de0e46';

export { foodBuff };

const keyOf = (ids) => [...ids].sort().join('+');

/** 요리 창이 그릴 것: 넣을 수 있는 재료, 찾은 레시피, 못 찾은 것의 귀띔, 실패 기록 (N3-3, N3-4). */
export function cookMenu(state) {
  return {
    max: COOK_MAX,
    ingredients: INGREDIENTS.map((id) => ({ id, name: itemDef(id).name, have: countOf(state, id) })).filter((x) => x.have > 0),
    known: DISH_ORDER.filter((id) => state.dex.dishes[id]).map((id) => ({ id, name: DISHES[id].name, needs: DISHES[id].needs.map((x) => itemDef(x).name), text: `포만감 +${DISHES[id].full}. ${DISHES[id].buff.name}: ${DISHES[id].buff.text}` })),
    // 귀띔은 사람들 말에서 들은 것만 보인다
    hints: DISH_ORDER.filter((id) => !state.dex.dishes[id] && state.cookHints.includes(id)).map((id) => DISHES[id].hint),
    unknown: DISH_ORDER.filter((id) => !state.dex.dishes[id]).length > 0,
    fails: state.cookFails.map((k) => k.split('+').map((x) => itemDef(x).name).join(', ')),
  };
}

/** 넣은 재료로 굽는다. 맞으면 레시피가 도감에 적히고, 아니면 "먹을 수는 있는 것". 재료는 돌아오지 않는다. */
export function cook(state, events, ids) {
  if (!placeById(state.place).fire) throw new Error('모닥불이 있는 곳에서 합니다');
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > COOK_MAX) throw new Error(`재료는 하나에서 ${COOK_MAX}개까지 넣습니다`);
  for (const id of ids) if (!INGREDIENTS.includes(id)) throw new Error('넣을 수 없는 것입니다');
  for (const id of new Set(ids)) { const n = ids.filter((x) => x === id).length; if (countOf(state, id) < n) throw new Error(`${iGa(itemDef(id).name)} 모자랍니다`); }
  for (const id of ids) takeById(state, id, 1);
  const key = keyOf(ids);
  const dishId = DISH_ORDER.find((d) => keyOf(DISHES[d].needs) === key);
  const count = (state.counters.act.cook = (state.counters.act.cook || 0) + 1);
  const repeated = state.lastAction === 'cook';
  state.lastAction = 'cook';
  pushLine(state, events, { k: 'me', text: `${ids.map((x) => itemDef(x).name).join(', ')}. ${COOK_LINES[Math.floor(next(state) * COOK_LINES.length)]}` });
  const skill = state.skills.cooking || (state.skills.cooking = emptySkill());
  const up = useSkill(skill, COOK_DIFFICULTY, jobXp(state, 'cooking', repeated) * xpBoost(state));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.cooking} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (!dishId) {
    if (!state.cookFails.includes(key)) state.cookFails.push(key);
    state.full = Math.min(100, state.full + MUSH.full);
    pushLine(state, events, { k: 'room', text: `무엇인지 모를 것이 되었다. ${MUSH.name}. 먹었다. 포만감 +${MUSH.full}.` });
    events.push({ type: 'cook', dish: null });
    return count;
  }
  const d = DISHES[dishId];
  const first = !state.dex.dishes[dishId];
  state.dex.dishes[dishId] = true;
  state.full = Math.min(100, state.full + d.full);
  const had = foodBuff(state);
  state.buffs.food = { name: d.buff.name, text: d.buff.text, attack: d.buff.attack || 0, defense: d.buff.defense || 0, hp: d.buff.hp || 0, xp: d.buff.xp || 0, until: phasesLater(state, d.buff.phases) };
  pushLine(state, events, { k: 'room', text: `${eulReul(d.name)} 먹었다. 포만감 +${d.full}. '${d.buff.name}': ${d.buff.text}.${had ? ` 먼저 붙어 있던 ${eunNeun(`'${had.name}'`)} 사라졌다.` : ''}` });
  if (first) ding(state, events, { level: 2, kind: 'dish', title: `새 레시피를 찾았습니다: ${d.name}`, big: d.name, body: `재료: ${d.needs.map((x) => itemDef(x).name).join(', ')}. 도감에 적혔습니다.` });
  events.push({ type: 'cook', dish: dishId });
  events.push({ type: 'buff' });
  return count;
}

function phasesLater(state, n) {
  let day = state.day, phase = state.phase + n;
  while (phase > 2) { phase -= 3; day += 1; }
  return { day, phase };
}
