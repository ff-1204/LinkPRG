// 장비의 이름, 수리, 강화, 옵션 (Z17~Z19). 템은 두드리고 고치고 키운 만큼 세진다.

import { roll01 } from './rng.js?v=91cafab';
import { pushLine, ding } from './log.js?v=91cafab';
import { itemDef } from '../data/items.js?v=91cafab';
import { countOf, takeById } from './inventory.js?v=91cafab';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=91cafab';
import { placeById } from '../data/places.js?v=91cafab';
import { iGa, eulReul } from './ko.js?v=91cafab';
import { jobXp } from './jobs.js?v=91cafab';
import { HEAT, hotAtForge } from './heat.js?v=91cafab';

export const PLUS_MAX = 10;
/** +0에서 +1로 갈 때부터의 성공 확률. 높을수록 어렵다. */
export const PLUS_ODDS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
export const PLUS_POWER = 0.1; // 강화 하나에 공격·방어 +10%
export const PLUS_DROP_AT = 7; // 여기부터는 실패하면 강화가 하나 내려간다

/** 옵션. 값은 등급(고급·희귀·영웅·전설) 순서다. */
export const AFFIXES = {
  sharp: { name: '날카로운', attack: [2, 3, 5, 8], on: 'weapon', text: (v) => `공격 +${v}` },
  keen: { name: '예리한', crit: [0.02, 0.03, 0.05, 0.08], on: 'weapon', text: (v) => `급소 확률 +${Math.round(v * 100)}%` },
  hard: { name: '단단한', defense: [1, 2, 3, 5], on: 'armor', text: (v) => `방어 +${v}` },
  wise: { name: '맑은', mp: [5, 8, 12, 20], on: 'armor', text: (v) => `최대 마나 +${v}` },
  vital: { name: '굳센', hp: [10, 15, 25, 40], on: 'any', text: (v) => `최대 생명력 +${v}` },
  lasting: { name: '질긴', dur: [0.2, 0.3, 0.5, 0.8], on: 'any', text: (v) => `내구도 +${Math.round(v * 100)}%` },
};
const OPT_COUNT = [0, 1, 1, 2, 3]; // 등급마다 붙는 옵션 수

const isGear = (item) => !!item && itemDef(item.id).kind === 'gear';
const kindOf = (def) => (def.attack ? 'weapon' : 'armor');

/** 화면에 보이는 이름: "+3 날카로운 철검". */
export function gearName(item) {
  const def = itemDef(item.id);
  if (def.kind !== 'gear') return def.name;
  const opts = (item.opt || []).map((o) => AFFIXES[o.id]?.name).filter(Boolean);
  return `${item.plus ? `+${item.plus} ` : ''}${opts.length ? opts.join(' ') + ' ' : ''}${def.name}`;
}

/** 옵션 글 목록. */
export function optionLines(item) {
  return (item.opt || []).filter((o) => AFFIXES[o.id]).map((o) => `${AFFIXES[o.id].name}: ${AFFIXES[o.id].text(o.v)}`);
}

/** 옵션이 주는 것의 합. */
export function optionSum(item) {
  const out = { attack: 0, defense: 0, hp: 0, mp: 0, crit: 0 };
  for (const o of item?.opt || []) {
    const a = AFFIXES[o.id];
    if (!a) continue;
    for (const k of Object.keys(out)) if (a[k]) out[k] += o.v;
  }
  return out;
}

export function maxDur(item) {
  return Math.max(item.max ?? itemDef(item.id).dur ?? 0, item.dur ?? 0);
}

/**
 * 새로 생긴 장비에 옵션을 붙인다. 고급 이상에만 붙는다. 가게에서 산 것(일반)에는 없다.
 * 주사위는 씨앗과 salt로만 정해져 다른 난수의 흐름을 건드리지 않는다.
 */
export function rollOptions(state, item, salt) {
  const def = itemDef(item.id);
  if (def.kind !== 'gear' || def.tool || item.opt) return item;
  const n = OPT_COUNT[item.grade] || 0;
  if (!n) return item;
  const pool = Object.keys(AFFIXES).filter((id) => AFFIXES[id].on === 'any' || AFFIXES[id].on === kindOf(def));
  item.opt = [];
  for (let i = 0; i < n && pool.length; i++) {
    const id = pool.splice(Math.floor(roll01(`${state.seed}|opt|${salt}|${i}`) * pool.length), 1)[0];
    const a = AFFIXES[id];
    const key = ['attack', 'defense', 'hp', 'mp', 'crit', 'dur'].find((k) => a[k]);
    const v = a[key][item.grade - 1];
    item.opt.push({ id, v });
    if (key === 'dur' && item.dur != null) { item.dur = Math.round(item.dur * (1 + v)); item.max = item.dur; }
  }
  return item;
}

/** 가방 자리나 찬 칸으로 장비를 찾는다. */
function pick(state, loc) {
  const item = loc.slot ? state.equip[loc.slot] : state.bag[loc.index];
  if (!isGear(item)) throw new Error('장비가 아닙니다');
  return item;
}
/** 손·발에 걸치는 것은 의류점에서, 나머지(머리·몸통·무기·방패·반지)는 대장간에서 손본다 (Z74, Z86). */
export const CLOTH_SLOTS = ['hand', 'feet']; // 손·발은 의류점, 머리·몸통은 대장간 (Z86)
export const isCloth = (item) => CLOTH_SLOTS.includes(itemDef(item.id).slot);
/** 이곳에서 이 장비를 손볼 수 있는가. 못 하면 어디서 하는지 알려 준다. */
export function mendHere(state, item) {
  const acts = placeById(state.place).actions;
  if (isCloth(item)) return acts.includes('sew') ? { ok: true, at: '의류점' } : { ok: false, at: '의류점' };
  return acts.includes('craft') ? { ok: true, at: '대장간' } : { ok: false, at: '대장간' };
}
function atForge(state, item) {
  const m = mendHere(state, item);
  if (!m.ok) throw new Error(`${m.at}에서만 손볼 수 있습니다`);
}

/** 고치는 값: 닳은 만큼. 대장장이는 제 손으로 하니 절반. */
export function repairCost(state, item) {
  const max = maxDur(item);
  if (!max || item.dur >= max) return 0;
  const base = (itemDef(item.id).price || 10) * (1 - item.dur / max) * 0.5;
  return Math.max(1, Math.ceil(base * (state.work === (isCloth(item) ? 'tailor' : 'smith') ? 0.5 : 1) * (state.flags.cheapRepair ? 0.5 : 1) * (hotAtForge(state, item) ? HEAT.repair : 1))); // 편자공의 조수는 절반. 달궈진 쇠는 큰 대장간에서 절반 (AG-B3)
}

export function repair(state, events, loc) {
  const item = pick(state, loc);
  atForge(state, item);
  const cost = repairCost(state, item);
  if (!cost) throw new Error('고칠 데가 없습니다');
  if (state.silver < cost) throw new Error(`은화가 모자랍니다 (${state.silver} / ${cost})`);
  state.silver -= cost;
  item.dur = maxDur(item);
  pushLine(state, events, { k: 'me', text: `${eulReul(gearName(item))} 고쳤다. 은화 −${cost}. 내구도 ${item.dur} / ${item.dur}.` });
  events.push({ type: 'gear' }); events.push({ type: 'bag' });
}

/** 강화 한 번에 드는 것과 될 확률. */
export function enhanceView(state, item) {
  const plus = item.plus || 0;
  if (plus >= PLUS_MAX) return { plus, max: true };
  const def = itemDef(item.id);
  const ore = def.attack ? 'ironore' : 'boarhide';
  const need = { id: ore, name: itemDef(ore).name, n: plus + 1, have: countOf(state, ore) };
  const silver = 5 * (plus + 1);
  const hot = hotAtForge(state, item); // 달궈진 쇠 (AG-B3): 큰 대장간에서 그 무기의 강화 +10%p
  const chance = Math.min(1, PLUS_ODDS[plus] + (state.skills[isCloth(item) ? 'leather' : 'smithing']?.grade || 0) * 0.005 + (state.hidden.craft?.value || 0) * 0.01 + (hot ? HEAT.plus : 0));
  return { plus, max: false, need, silver, chance, hot, can: need.have >= need.n && state.silver >= silver && item.dur > 0, dropOnFail: plus >= PLUS_DROP_AT };
}

/**
 * 강화한다. 한 번 누르면 한 번. 되면 +1, 안 되면 내구도가 깎이고 높은 강화에서는 하나 내려간다.
 * 주사위는 씨앗과 지금까지 강화한 횟수로 정해진다.
 */
export function enhance(state, events, loc) {
  const item = pick(state, loc);
  atForge(state, item);
  if (itemDef(item.id).tool) throw new Error('도구는 강화할 수 없습니다');
  const v = enhanceView(state, item);
  if (v.max) throw new Error('더는 강화할 수 없습니다');
  if (item.dur <= 0) throw new Error('부서진 것은 먼저 고쳐야 합니다');
  if (v.need.have < v.need.n) throw new Error(`${iGa(v.need.name)} 모자랍니다 (${v.need.have} / ${v.need.n})`);
  if (state.silver < v.silver) throw new Error(`은화가 모자랍니다 (${state.silver} / ${v.silver})`);
  takeById(state, v.need.id, v.need.n);
  state.silver -= v.silver;
  const tries = (state.counters.act.enhance = (state.counters.act.enhance || 0) + 1);
  const sk = isCloth(item) ? 'leather' : 'smithing'; // 옷·신 강화는 가죽 숙련도가 오른다
  const skill = state.skills[sk] || (state.skills[sk] = emptySkill());
  const up = useSkill(skill, 2 + v.plus * 2, jobXp(state, sk));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[sk]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  const roll = roll01(`${state.seed}|plus|${tries}`);
  if (roll < v.chance) {
    item.plus = v.plus + 1;
    pushLine(state, events, { k: 'me', text: `${isCloth(item) ? '실밥이 단단히 여며졌다' : '쇠가 맑게 울렸다'}. ${gearName(item)}.` });
    if ([5, 7, 10].includes(item.plus)) ding(state, events, { level: item.plus === 10 ? 4 : item.plus === 7 ? 3 : 2, kind: item.plus === 10 ? 'masterwork' : undefined, title: `${eulReul(itemDef(item.id).name)} +${item.plus}까지 강화했습니다`, big: gearName(item), body: `공격과 방어가 ${item.plus * 10}% 오른 물건입니다.` });
    events.push({ type: 'enhance', ok: true, plus: item.plus });
  } else {
    const max = maxDur(item);
    item.dur = Math.max(0, item.dur - Math.ceil(max * 0.2));
    if (v.dropOnFail) item.plus = v.plus - 1;
    pushLine(state, events, { k: 'me', text: `${isCloth(item) ? '실이 툭 끊어졌다' : '쇠가 탁하게 울렸다'}. 강화에 실패했다. 내구도 −${Math.ceil(max * 0.2)}.${v.dropOnFail ? ` 강화가 +${item.plus}로 내려갔다.` : ''}` });
    events.push({ type: 'enhance', ok: false, plus: item.plus || 0 });
  }
  events.push({ type: 'gear' }); events.push({ type: 'bag' });
}
