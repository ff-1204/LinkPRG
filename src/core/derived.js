// 계산된 값과 그 셈 (R2-1, R2-2, G2-2). 누르면 셈이 풀려 보인다.

import { equipPower, usable } from './inventory.js?v=3cfb5a9';
import { itemDef } from '../data/items.js?v=3cfb5a9';
import { buffOf, foodBuff, restBuff, graceBuff, murderBuff, drumBuff } from './buffs.js?v=3cfb5a9';
import { ADVANCED } from '../data/jobs.js?v=3cfb5a9';
import { coldAttackCut } from './cold.js?v=3cfb5a9';

/** 숙련 보너스: 등급 두 칸마다 1. */
export function skillBonus(skill) {
  return skill ? Math.floor(skill.grade / 2) : 0;
}

export const HUNGRY_BELOW = 20;

export function isHungry(state) {
  return (state.full ?? 100) < HUNGRY_BELOW;
}

export const TIRED_AT = 70; // 이만큼 쌓이면 지친다
export const TIRED_MAX = 100; // 여기서 곯아떨어진다
export function isTired(state) {
  return (state.tired || 0) >= TIRED_AT;
}

/** 직업 무기 (SB-G1): 활·단검은 민첩, 지팡이·기도 구슬은 지혜로 친다. 그 직업이 제 직업 무기를 들었을 때만이다. */
export const JOB_WEAPON_STAT = { archer: 'agi', rogue: 'agi', mage: 'wis', priest: 'wis' };
export const STAT_NAMES = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
/** 기본 공격에 쓰는 스탯. 직업 무기를 들지 않았으면 힘이다. */
export function attackStat(state) {
  const stat = JOB_WEAPON_STAT[state.job];
  if (!stat || !state.equip) return 'str';
  return Object.values(state.equip).some((it) => usable(it) && itemDef(it.id).job === state.job) ? stat : 'str';
}

/** 굶주림과 그림자의 벌. 근성이 있으면 조금 덜하다. */
function gritCut(state) {
  return Math.max(0, 1 - (state.hidden?.grit?.value || 0) * 0.05);
}
function penaltyRate(state) {
  return 0.10 * gritCut(state);
}

/**
 * 기본 스탯 하나가 어디서 왔는지 (Z103): 기본(주사위·출신·레벨업 점수) + 장비 + 추가(일로 오른 것, 다시 일어선 몸).
 * 지금은 스탯을 올려 주는 장비가 없어 장비 몫은 늘 0이다. 0인 몫은 글에서 뺀다.
 * @returns {{total:number, base:number, gear:number, extra:number, text:string}}
 */
export function statParts(state, key) {
  const total = state.stats[key] || 0;
  const gear = 0;
  const extra = Math.min(total, (state.toilGained?.[key] || 0) + (state.toughGained?.[key] || 0));
  const base = total - gear - extra;
  const text = [`기본 ${base}`, gear ? `장비 ${gear}` : '', extra ? `추가 ${extra}` : ''].filter(Boolean).join(' + ');
  return { total, base, gear, extra, text };
}

/**
 * @returns {{id:string,name:string,value:number,parts:Array<{label:string,value:number}>}[]}
 */
export function derived(state) {
  const s = state.stats;
  const strikeBonus = skillBonus(state.skills.strike);
  const main = attackStat(state);
  const levelHp = (state.level - 1) * 10;
  const gear = state.equip ? equipPower(state) : { attack: 0, defense: 0 };
  const list = [
    { id: 'attack', name: '공격력', parts: [{ label: `${STAT_NAMES[main]} ${s[main]}`, value: s[main] }, { label: `무기 ${gear.attack}`, value: gear.attack }, { label: `치기 숙련 ${strikeBonus}`, value: strikeBonus }] },
    { id: 'defense', name: '방어력', parts: [{ label: `체력 ${s.con}의 절반`, value: Math.floor(s.con / 2) }, { label: `방어구 ${gear.defense}`, value: gear.defense }] },
    { id: 'maxHp', name: '최대 생명력', parts: [{ label: '기본 50', value: 50 }, { label: `체력 ${s.con} × 5`, value: s.con * 5 }, { label: `레벨업 ${levelHp}`, value: levelHp }] },
    { id: 'maxMp', name: '최대 마나', parts: [{ label: `지혜 ${s.wis} × 3`, value: s.wis * 3 }] },
    { id: 'carry', name: '무게 한도', parts: [{ label: '기본 30', value: 30 }, { label: `힘 ${s.str} × 2.5`, value: Math.floor(s.str * 2.5) }] },
  ];
  // 음식과 감상의 힘 (N2-2, N3-5)
  const food = state.buffs ? foodBuff(state) : null;
  const seen = state.buffs ? buffOf(state) : null;
  const addTo = (id, label, value) => { if (value) list.find((d) => d.id === id).parts.push({ label, value }); };
  if (food) { addTo('attack', `${food.name} ${food.attack}`, food.attack); addTo('defense', `${food.name} ${food.defense}`, food.defense); addTo('maxHp', `${food.name} ${food.hp}`, food.hp); }
  if (seen) addTo('maxHp', `${seen.name} ${seen.hp}`, seen.hp);
  if (gear.hp) addTo('maxHp', `장비 옵션 ${gear.hp}`, gear.hp);
  if (gear.mp) addTo('maxMp', `장비 옵션 ${gear.mp}`, gear.mp);
  // 곳마다 하는 일로 쌓은 숙련 (Z23): 기도는 마나, 나르기는 무게 한도, 지구력은 생명력
  addTo('maxMp', `기도 숙련 ${skillBonus(state.skills.pray)}`, skillBonus(state.skills.pray));
  addTo('carry', `나르기 숙련 ${skillBonus(state.skills.haul)}`, skillBonus(state.skills.haul));
  addTo('maxHp', `지구력 숙련 ${skillBonus(state.skills.stamina) * 2}`, skillBonus(state.skills.stamina) * 2);
  if (state.flags?.carry5) addTo('carry', '짐꾼 5', 5);
  const adv2 = ADVANCED[state.job2];
  if (adv2?.hp) addTo('maxHp', `${adv2.name} ${adv2.hp}`, adv2.hp);
  // 잘 잔 몸 (Z41): 뜨끈한 아랫목은 생명력과 힘을 조금 북돋는다
  const slept = state.buffs ? restBuff(state) : null;
  // 신의 가호 (Z43): 공격력·방어력 +5%
  const grace = state.buffs ? graceBuff(state) : null;
  // 살인의 추억 (Z72): 공격력·방어력 −5%
  const murder = state.buffs ? murderBuff(state) : null;
  if (murder) {
    for (const d of list) {
      if (d.id !== 'attack' && d.id !== 'defense') continue;
      const sum = d.parts.reduce((a, p) => a + p.value, 0);
      addTo(d.id, `${murder.name} ${Math.round(sum * murder.power)}`, Math.round(sum * murder.power));
    }
  }
  // 비율로 붙는 음식 (LV-H1): 21부터의 요리는 공격력·방어력에 비율로 붙는다
  if (food?.rate) {
    for (const d of list) {
      if (d.id !== 'attack' && d.id !== 'defense') continue;
      const sum = d.parts.reduce((a, p) => a + p.value, 0);
      addTo(d.id, `${food.name} ${Math.round(sum * food.rate)}`, Math.round(sum * food.rate));
    }
  }
  if (grace) {
    for (const d of list) {
      if (d.id !== 'attack' && d.id !== 'defense') continue;
      const sum = d.parts.reduce((a, p) => a + p.value, 0);
      addTo(d.id, `${grace.name} ${Math.round(sum * grace.power)}`, Math.round(sum * grace.power));
    }
  }
  // 북소리 (LV-H4, GD-C2): 북 치는 이가 곁에 있는 동안 공격력·방어력이 비율로 오른다. 음식·성수와 겹친다
  const drum = state.party ? drumBuff(state) : null;
  if (drum) {
    for (const d of list) {
      if (d.id !== 'attack' && d.id !== 'defense') continue;
      const sum = d.parts.reduce((a, p) => a + p.value, 0);
      addTo(d.id, `${drum.name} ${Math.round(sum * drum.rate)}`, Math.round(sum * drum.rate));
    }
  }
  if (slept?.hp || slept?.power) {
    for (const d of list) {
      const sum = d.parts.reduce((a, p) => a + p.value, 0);
      if (d.id === 'maxHp' && slept.hp) addTo('maxHp', `${slept.name} ${Math.round(sum * slept.hp)}`, Math.round(sum * slept.hp));
      if ((d.id === 'attack' || d.id === 'defense') && slept.power) addTo(d.id, `${slept.name} ${Math.round(sum * slept.power)}`, Math.round(sum * slept.power));
    }
  }
  const rate = penaltyRate(state);
  for (const d of list) {
    const sum = d.parts.reduce((a, p) => a + p.value, 0);
    if (d.id === 'attack' || d.id === 'defense') {
      if (isHungry(state)) d.parts.push({ label: `굶주림 ${Math.round(sum * rate)}`, value: -Math.round(sum * rate) });
      if (state.shadow > 0) { const cut = Math.round(sum * state.shadow * 0.05 * gritCut(state)); d.parts.push({ label: `죽음의 그림자 ${state.shadow}겹 ${cut}`, value: -cut }); }
      if (isTired(state)) d.parts.push({ label: `피로 ${Math.round(sum * 0.1)}`, value: -Math.round(sum * 0.1) });
      // 언 몸 (WM-B3): 흰마루에서 체온이 30까지 내려가면 공격력 −10%
      if (d.id === 'attack' && state.place && coldAttackCut(state)) d.parts.push({ label: `언 몸 ${Math.round(sum * coldAttackCut(state))}`, value: -Math.round(sum * coldAttackCut(state)) });
    }
    d.value = d.parts.reduce((a, p) => a + p.value, 0);
  }
  return list;
}

export function valueOf(state, id) {
  return derived(state).find((d) => d.id === id).value;
}

/** "힘 12 + 치기 숙련 3" 같은 셈 글. 0인 줄은 뺀다. */
export function formula(d) {
  const parts = d.parts.filter((p) => p.value !== 0);
  return parts.map((p, i) => (i === 0 ? p.label : `${p.value < 0 ? '−' : '+'} ${p.label}`)).join(' ');
}
