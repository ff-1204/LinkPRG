// 가방과 장비 (G1, E14~E18, R2-4). 칸 수 제한은 없고 무게만 센다.

import { ITEMS, itemDef, EQUIP_SLOTS, GRADE_MULT, gradeName } from '../data/items.js';
import { jobDef } from '../data/jobs.js';

/** 물건 하나(또는 한 묶음)를 만든다. 장비는 묶이지 않는다. */
export function makeItem(id, { grade, maker, n = 1 } = {}) {
  const def = itemDef(id);
  const item = { id, grade: grade ?? def.grade ?? 0, n };
  if (def.kind === 'gear') { item.n = 1; item.dur = def.dur; }
  if (maker || def.maker) item.maker = maker || def.maker;
  return item;
}

const stacks = (a, b) => ITEMS[a.id].kind !== 'gear' && a.id === b.id && a.grade === b.grade;

/** 가방에 넣는다. 같은 것은 묶인다. 넣은 뒤의 그 물건을 돌려준다. */
export function addItem(state, id, n = 1, opts = {}) {
  if (!Number.isInteger(n) || n < 1) throw new Error('개수는 1 이상이어야 합니다');
  const def = itemDef(id);
  if (def.kind === 'gear') {
    let last = null;
    for (let i = 0; i < n; i++) { last = makeItem(id, opts); state.bag.push(last); }
    return last;
  }
  const fresh = makeItem(id, { ...opts, n });
  const found = state.bag.find((x) => stacks(x, fresh));
  if (found) { found.n += n; return found; }
  state.bag.push(fresh);
  return fresh;
}

/** 가방에서 n개를 뺀다. */
export function removeAt(state, index, n = 1) {
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (!Number.isInteger(n) || n < 1) throw new Error('개수는 1 이상이어야 합니다');
  if (n > item.n) throw new Error('그만큼 가지고 있지 않습니다');
  item.n -= n;
  if (item.n === 0) state.bag.splice(index, 1);
  return item;
}

/** 가방에 그 물건이 몇 개 있는지. */
export function countOf(state, id) {
  return state.bag.filter((x) => x.id === id).reduce((a, x) => a + x.n, 0);
}

/** 가방에서 그 물건을 n개 뺀다(어느 묶음이든). 모자라면 던진다. */
export function takeById(state, id, n = 1) {
  if (countOf(state, id) < n) throw new Error(`${itemDef(id).name}: 모자랍니다`);
  let left = n;
  for (let i = state.bag.length - 1; i >= 0 && left > 0; i--) {
    if (state.bag[i].id !== id) continue;
    const take = Math.min(left, state.bag[i].n);
    removeAt(state, i, take);
    left -= take;
  }
}

export function itemWeight(item) {
  return itemDef(item.id).weight * item.n;
}

/** 등급이 반영된 공격·방어. */
export function itemPower(item) {
  const def = itemDef(item.id);
  const mult = (GRADE_MULT[item.grade] || 1) * (1 + (item.plus || 0) * 0.1); // 강화 하나에 +10%
  let attack = def.attack ? Math.round(def.attack * mult) : 0;
  let defense = def.defense ? Math.round(def.defense * mult) : 0;
  for (const o of item.opt || []) { if (o.id === 'sharp') attack += o.v; if (o.id === 'hard') defense += o.v; }
  return { attack, defense };
}

export function bagWeight(state) {
  return state.bag.reduce((a, x) => a + itemWeight(x), 0);
}

export function equipWeight(state) {
  return Object.values(state.equip).reduce((a, x) => a + (x ? itemWeight(x) : 0), 0);
}

/** 들고 있는 것 모두의 무게 (가방 + 찬 것). */
export function totalWeight(state) {
  return bagWeight(state) + equipWeight(state);
}

/** 이 물건이 들어갈 칸. 장신구는 빈 칸 먼저. */
export function slotFor(state, item) {
  const slot = itemDef(item.id).slot;
  if (!slot) return null;
  if (slot !== 'ring') return slot;
  return state.equip.ring1 ? (state.equip.ring2 ? 'ring1' : 'ring2') : 'ring1';
}

/** 내구도가 0이면 못 쓴다 (R2-4). */
export function usable(item) {
  return !!item && !(item.dur === 0);
}

/** 찬 장비의 공격·방어 합. 내구도 0인 것은 세지 않는다. */
export function equipPower(state) {
  let attack = 0;
  let defense = 0;
  let hp = 0, mp = 0, crit = 0;
  for (const item of Object.values(state.equip)) {
    if (!usable(item)) continue;
    const p = itemPower(item);
    attack += p.attack;
    defense += p.defense;
    for (const o of item.opt || []) { if (o.id === 'vital') hp += o.v; if (o.id === 'wise') mp += o.v; if (o.id === 'keen') crit += o.v; }
  }
  return { attack, defense, hp, mp, crit };
}

/** 가방의 물건을 찬다. 그 칸에 있던 것은 가방으로 돌아온다. */
export function equip(state, index) {
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  const slot = slotFor(state, item);
  if (itemDef(item.id).tool) throw new Error('도구는 차지 않습니다. 가방에 두면 됩니다');
  if (!slot) throw new Error('찰 수 없는 물건입니다');
  if (itemDef(item.id).job && itemDef(item.id).job !== state.job) throw new Error(`${jobDef(itemDef(item.id).job)?.name || itemDef(item.id).job}만 쓸 수 있습니다`);
  state.bag.splice(index, 1);
  const old = state.equip[slot];
  state.equip[slot] = item;
  if (old) state.bag.push(old);
  return { slot, old };
}

export function unequip(state, slot) {
  const item = state.equip[slot];
  if (!item) throw new Error('그 칸은 비어 있습니다');
  state.equip[slot] = null;
  state.bag.push(item);
  return item;
}

/** 바꿔 끼기 전에 무엇이 달라지는지 (G1-2). */
export function previewEquip(state, index) {
  const item = state.bag[index];
  if (!item) return null;
  const slot = slotFor(state, item);
  if (!slot) return null;
  const old = state.equip[slot];
  const a = old ? itemPower(old) : { attack: 0, defense: 0 };
  const b = itemPower(item);
  return {
    slot, slotName: EQUIP_SLOTS.find((s) => s.id === slot).name,
    old: old ? { name: itemDef(old.id).name, grade: gradeName(old.grade), dur: old.dur, max: itemDef(old.id).dur, weight: itemWeight(old) } : null,
    next: { name: itemDef(item.id).name, grade: gradeName(item.grade), dur: item.dur, max: itemDef(item.id).dur, weight: itemWeight(item) },
    attack: [a.attack, b.attack], defense: [a.defense, b.defense],
  };
}

/** 버린다. 퀘스트 물건은 버릴 수 없다 (G1-7). */
export function discard(state, index, n = 1) {
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (itemDef(item.id).kind === 'quest') throw new Error('퀘스트 물건은 버릴 수 없습니다');
  return removeAt(state, index, n);
}

/** 가방을 갈래와 늘어놓는 법에 맞춰 보여 준다 (G1-4, G1-5). 원래 자리(index)를 같이 돌려준다. */
export function bagView(state, tab = 'all', sort = 'new') {
  let list = state.bag.map((item, index) => ({ item, index, def: itemDef(item.id) }));
  if (tab !== 'all') list = list.filter((x) => x.def.kind === tab);
  const by = {
    new: (a, b) => b.index - a.index,
    grade: (a, b) => b.item.grade - a.item.grade || b.index - a.index,
    weight: (a, b) => itemWeight(b.item) - itemWeight(a.item) || b.index - a.index,
    name: (a, b) => a.def.name.localeCompare(b.def.name, 'ko'),
  }[sort];
  if (!by) throw new Error('모르는 늘어놓기: ' + sort);
  return list.sort(by);
}

export function tabCounts(state) {
  const out = { all: state.bag.length, gear: 0, material: 0, eat: 0, quest: 0, etc: 0 };
  for (const item of state.bag) out[itemDef(item.id).kind] += 1;
  return out;
}

/** 그림 이름. 등급이 있는 무기는 등급마다 다르다 (X2-2). */
export function iconOf(item) {
  const def = itemDef(item.id);
  return def.gradeIcon ? `${def.gradeIcon}-${item.grade + 1}` : def.icon;
}
