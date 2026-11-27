// 지금 붙어 있는 힘: 감상 버프 하나와 음식 버프 하나 (N2-2, N3-5). 때가 지나면 사라진다.
import { COMPANIONS, DRUM } from '../data/companions.js?v=f81b3db';

/**
 * 북소리 (LV-H4, GD-C2): 북 치는 이가 곁에 서 있는 동안 공격력·방어력이 비율로 오른다. 그날 못 쓰는 이(out)의 북은 울리지 않는다.
 * @returns {{id:string,name:string,rate:number,text:string,by:string}|null}
 */
export function drumBuff(state) {
  const c = (state.party || []).find((x) => COMPANIONS[x.id]?.drum && !x.down && x.out !== state.day);
  if (!c) return null;
  const rate = COMPANIONS[c.id].drum;
  return { ...DRUM, rate, text: `공격력·방어력 +${Math.round(rate * 100)}%`, by: COMPANIONS[c.id].name };
}

const live = (state, b) => !!b && !(state.day > b.until.day || (state.day === b.until.day && state.phase >= b.until.phase));

export function buffOf(state) {
  const b = state.buffs?.admire;
  return live(state, b) ? b : null;
}

export function foodBuff(state) {
  const b = state.buffs?.food;
  return live(state, b) ? b : null;
}

/** 잘 잔 몸 (Z41): 방을 빌려 자면 그 집에 따라 다른 힘이 붙는다. 깬 때부터 두 때. */
export const ROOM_BUFFS = {
  tavern: { id: 'fresh', name: '개운한 몸', text: '피로가 20% 더디게 쌓인다', tire: 0.8 },
  inn: { id: 'warm', name: '뜨끈한 아랫목', text: '최대 생명력 +10%, 공격력·방어력 +3%', hp: 0.10, power: 0.03 },
  innrow: { id: 'feather', name: '깃털 이불', text: '숙련도 오름 +5%', xp: 0.05 },
  hearth: { id: 'hearthside', name: '화롯불 곁', text: '한 때 동안 체온이 식지 않는다', nocold: true, phases: 1 }, // 흰마루의 화롯방 주막 (WM-C1)
};
/** 신의 가호 (Z43): 신전에서 축복을 받으면 두 때 동안. */
export const GRACE = { id: 'grace', name: '신의 가호', text: '공격력·방어력 +5%', power: 0.05 };
export function graceBuff(state) {
  const b = state.buffs?.grace;
  return live(state, b) ? b : null;
}
/** 지금부터 두 때 뒤까지. */
export function twoPhases(state) {
  const p = state.phase + 2;
  return p <= 2 ? { day: state.day, phase: p } : { day: state.day + 1, phase: p - 3 };
}
/** @param power 윗단계 성수의 힘 (LV-H2). 안 주면 지금 값 5%. 더 센 가호가 붙어 있으면 그대로 둔다(덮지도, 때를 늘리지도 않는다) */
export function giveGrace(state, power = GRACE.power) {
  if (!state.buffs) state.buffs = {};
  const had = graceBuff(state);
  if (had && had.power > power) return had; // 약한 성수로 센 가호의 때를 늘리지 못한다
  const name = power >= 0.11 ? '별빛 가호' : power >= 0.09 ? '깊은 가호' : GRACE.name;
  state.buffs.grace = { ...GRACE, name, power, text: `공격력·방어력 +${Math.round(power * 100)}%`, until: twoPhases(state) };
  return state.buffs.grace;
}

/** 살인의 추억 (Z72): 모험가를 쓰러뜨리면 이틀 동안 붙는 디버프. 보는 사람이 없어 소문은 나지 않는다. */
export const MURDER = { id: 'murder', name: '살인의 추억', text: '쓰러뜨린 얼굴이 자꾸 떠오른다. 공격력·방어력 −5%', power: -0.05, days: 2 };
export function murderBuff(state) {
  const b = state.buffs?.murder;
  return live(state, b) ? b : null;
}
export function giveMurder(state) {
  if (!state.buffs) state.buffs = {};
  state.buffs.murder = { ...MURDER, until: { day: state.day + MURDER.days, phase: state.phase } };
  return state.buffs.murder;
}

export function restBuff(state) {
  const b = state.buffs?.rest;
  return live(state, b) ? b : null;
}
/** 방을 빌려 자고 깼다. 그 집의 버프를 건다(겹치지 않고 새로 건다). */
export function giveRoomBuff(state, place) {
  const def = ROOM_BUFFS[place];
  if (!def) return null;
  const p = state.phase + (def.phases || 2); // 깬 때부터 두 때. 화롯불 곁은 한 때
  const until = p <= 2 ? { day: state.day, phase: p } : { day: state.day + 1, phase: p - 3 };
  if (!state.buffs) state.buffs = {};
  state.buffs.rest = { ...def, until };
  return state.buffs.rest;
}

/** 숙련도가 얼마나 더 오르는지(곱). */
export function xpBoost(state) {
  return 1 + (buffOf(state)?.xp || 0) + (foodBuff(state)?.xp || 0) + (restBuff(state)?.xp || 0);
}

/** 상태창의 "지금 걸린 것"에 보일 줄 (M6-3). */
export function buffRows(state) {
  const out = [];
  for (const [kind, b] of [['감상', buffOf(state)], ['음식', foodBuff(state)], ['잠', restBuff(state)], ['축복', graceBuff(state)], ['디버프', murderBuff(state)]]) {
    if (b) out.push({ kind, name: b.name, text: b.text, until: b.until });
  }
  const drum = drumBuff(state);
  if (drum) out.push({ kind: '용병', name: drum.name, text: drum.text, until: null });
  if ((state.tired || 0) >= 80) out.push({ kind: '피로', name: '버티는 손', text: '피로 80 이상에서 일하면 숙련도가 1.5배로 오른다', until: null });
  return out;
}
