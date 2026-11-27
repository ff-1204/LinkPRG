// 요리 (N3). 재료를 셋까지 넣어 조합을 찾는다.

import { next } from './rng.js?v=3174526';
import { pushLine, ding } from './log.js?v=3174526';
import { countOf, takeById, addItem } from './inventory.js?v=3174526';
import { craftLvOf, addCraftXp, grantMakeXp } from './craft.js?v=3174526';
import { CRAFT_LV } from '../data/recipes.js?v=3174526';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=3174526';
import { itemDef } from '../data/items.js?v=3174526';
import { placeById } from '../data/places.js?v=3174526';
import { jobXp } from './jobs.js?v=3174526';
import { COOK_MAX, COOK_DIFFICULTY, INGREDIENTS, DISHES, DISH_ORDER, MUSH, COOK_LINES } from '../data/cooking.js?v=3174526';
import { iGa, eulReul, eunNeun } from './ko.js?v=3174526';
import { foodBuff, xpBoost } from './buffs.js?v=3174526';

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

/** 음식의 힘이 가는 때: 요리 숙련도 단계(초급·중급…)마다 한 때 더 (Z83). */
export function dishPhases(state, d, grade = 0) {
  return d.buff.phases + Math.floor((state.skills.cooking?.grade || 0) / 9) + (grade || 0); // 등급마다 한 때 더 (Z93)
}
/** 음식의 힘을 붙인다. 먹을 때(모닥불에서 바로, 또는 가방의 그릇을 먹을 때). */
export function applyDish(state, events, dishId, grade = 0) {
  const d = DISHES[dishId];
  const had = foodBuff(state);
  if (!state.buffs) state.buffs = {};
  state.buffs.food = { name: d.buff.name, text: d.buff.text, attack: d.buff.attack || 0, defense: d.buff.defense || 0, hp: d.buff.hp || 0, xp: d.buff.xp || 0, rate: d.buff.rate || 0, until: phasesLater(state, dishPhases(state, d, grade)) };
  events.push({ type: 'buff' });
  return had;
}
/** 요리 레벨 (Z83): 맞는 요리를 하나 끝낼 때마다 요리의 레벨만큼. 요리사면 1.5배. 레벨이 오르면 주방장이 새 요리를 귀띔한다. */
function gainCookXp(state, events, d) {
  const promoted = addCraftXp(state, events, 'cook', Math.round((d.lv || 1) * (state.work === 'chef' ? CRAFT_LV.workXp : 1)), d, (c) => {
    const opened = DISH_ORDER.filter((id) => DISHES[id].lv === c.lv);
    for (const id of opened) if (!state.cookHints.includes(id)) state.cookHints.push(id);
    ding(state, events, { level: 2, title: `요리 레벨 ${c.lv}이 되었습니다`, body: opened.length ? '주방장에게서 새 요리 이야기를 들었다. 요리 창의 "들은 말"에 적혔다.' : '' });
  });
  grantMakeXp(state, events, d, 0, promoted);
}

/** 넣은 재료로 굽는다. 맞으면 레시피가 도감에 적히고, 아니면 "먹을 수는 있는 것". 재료는 돌아오지 않는다.
 * 모닥불에서는 그 자리에서 먹고, 공용주방에서는 그릇에 담아 가방에 넣는다 (Z83). */
export function cook(state, events, ids) {
  const here = placeById(state.place);
  if (!here.fire && !here.kitchen) throw new Error('모닥불이나 공용주방에서 합니다');
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > COOK_MAX) throw new Error(`재료는 하나에서 ${COOK_MAX}개까지 넣습니다`);
  for (const id of ids) if (!INGREDIENTS.includes(id)) throw new Error('넣을 수 없는 것입니다');
  for (const id of new Set(ids)) { const n = ids.filter((x) => x === id).length; if (countOf(state, id) < n) throw new Error(`${iGa(itemDef(id).name)} 모자랍니다`); }
  for (const id of ids) takeById(state, id, 1);
  const key = keyOf(ids);
  const found = DISH_ORDER.find((d) => keyOf(DISHES[d].needs) === key);
  const tooHard = found && (DISHES[found].lv || 1) > craftLvOf(state, 'cook').lv; // 맞는 조합이어도 요리 레벨이 모자라면 망친다
  const dishId = tooHard ? null : found;
  const count = (state.counters.act.cook = (state.counters.act.cook || 0) + 1);
  const repeated = state.lastAction === 'cook';
  state.lastAction = 'cook';
  pushLine(state, events, { k: 'me', text: `${ids.map((x) => itemDef(x).name).join(', ')}. ${COOK_LINES[Math.floor(next(state) * COOK_LINES.length)].replace('모닥불', here.kitchen ? '솥' : '모닥불')}` });
  const skill = state.skills.cooking || (state.skills.cooking = emptySkill());
  const up = useSkill(skill, COOK_DIFFICULTY, jobXp(state, 'cooking', repeated) * (state.work === 'chef' ? 1.5 : 1));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.cooking} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (!dishId) {
    if (tooHard) pushLine(state, events, { k: 'room', text: `맞는 재료 같은데 손이 따라가지 못했다. 요리 레벨 ${DISHES[found].lv}은 되어야 할 것 같다.` });
    else if (!state.cookFails.includes(key)) state.cookFails.push(key);
    state.full = Math.min(100, state.full + MUSH.full);
    pushLine(state, events, { k: 'room', text: `무엇인지 모를 것이 되었다. ${MUSH.name}. 먹었다. 포만감 +${MUSH.full}.` });
    events.push({ type: 'cook', dish: null });
    return count;
  }
  const d = DISHES[dishId];
  const first = !state.dex.dishes[dishId];
  state.dex.dishes[dishId] = true;
  gainCookXp(state, events, d);
  if (here.kitchen) {
    addItem(state, `dish_${dishId}`, 1, { maker: state.name });
    state.counters.dishes = (state.counters.dishes || 0) + 1; // 주방장이 일을 권하는 셈 (Z83)
    pushLine(state, events, { k: 'room', text: `${eulReul(d.name)} 그릇에 담아 가방에 넣었다.` });
    events.push({ type: 'bag' });
  } else {
    state.full = Math.min(100, state.full + d.full);
    const had = applyDish(state, events, dishId);
    pushLine(state, events, { k: 'room', text: `${eulReul(d.name)} 먹었다. 포만감 +${d.full}. '${d.buff.name}': ${d.buff.text}.${had ? ` 먼저 붙어 있던 ${eunNeun(`'${had.name}'`)} 사라졌다.` : ''}` });
  }
  if (first) ding(state, events, { level: 2, kind: 'dish', title: `새 레시피를 찾았습니다: ${d.name}`, big: d.name, body: `재료: ${d.needs.map((x) => itemDef(x).name).join(', ')}. 도감에 적혔습니다.` });
  events.push({ type: 'cook', dish: dishId });
  return count;
}

function phasesLater(state, n) {
  let day = state.day, phase = state.phase + n;
  while (phase > 2) { phase -= 3; day += 1; }
  return { day, phase };
}
