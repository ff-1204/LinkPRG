// 전투 (E5~E9, R2-2). 한 턴에 행동 하나. 적의 다음 행동은 늘 미리 보인다.
// 방어하면 피해가 절반이고, 돌진류는 막고 되받아친다.

import { next, chance } from './rng.js?v=9c14cbd';
import { pushLine, ding } from './log.js?v=9c14cbd';
import { monsterDef, STATUS } from '../data/monsters.js?v=9c14cbd';
import { itemDef, ITEMS, gradeName } from '../data/items.js?v=9c14cbd';
import { roll01 } from './rng.js?v=9c14cbd';
import { guildPerk } from './guild.js?v=9c14cbd';
import { rollOptions, gearName } from './gear.js?v=9c14cbd';
import { derived, skillBonus } from './derived.js?v=9c14cbd';
import { addItem, removeAt, usable, totalWeight, equip, slotFor, equipPower } from './inventory.js?v=9c14cbd';
import { grantXp } from './reward.js?v=9c14cbd';
import { useSkill, emptySkill, gradeLabel, SKILL_NAMES } from './skills.js?v=9c14cbd';
import { fall } from './fall.js?v=9c14cbd';
import { iGa, eulReul, ro } from './ko.js?v=9c14cbd';
import { branchOf } from './evolve.js?v=9c14cbd';
import { skillsNow, jobXp, adv } from './jobs.js?v=9c14cbd';
import { guardFor, hitCompanion, companionsAct, afterBattle, roleBonus, cross } from './party.js?v=9c14cbd';
import { jobDef } from '../data/jobs.js?v=9c14cbd';
import { BEATS, WEAK_MULT, RESIST_MULT } from '../data/dungeon.js?v=9c14cbd';
import { HUNGRY } from '../data/wild.js?v=9c14cbd';

/** 사나움 (Z60): 세계의 날마다 괴물의 생명·공격과 경험치·떨굼 확률이 조금씩 오른다. 끝이 없다. 우두머리·던전도 같다. */
export const FIERCE_PER = 0.0005;
export const fierceOf = (day) => 1 + FIERCE_PER * Math.max(0, (day || 1) - 1);

/** 지금 국면이 반영된 괴물 (T22). */
export const ELITE = { hp: 2.5, attack: 1.3, defense: 2, level: 2, xp: 3, per: 0.005, cap: 0.25 };

function mdef(b) {
  let m = monsterDef(b.mon);
  if (m.phases && b.phase) m = { ...m, ...m.phases[b.phase - 1] };
  // 이름난 개체: 많이 잡은 사냥감 가운데 드물게 나온다. 훨씬 세고, 잡으면 장비를 떨어뜨린다
  if (b.elite) m = { ...m, name: `이름난 ${m.name}`, hp: Math.round(m.hp * ELITE.hp), attack: Math.round(m.attack * ELITE.attack), defense: m.defense + ELITE.defense, level: m.level + ELITE.level, xp: m.xp * ELITE.xp };
  if (b.hungry) m = { ...m, name: `굶주린 ${m.name}`, hp: Math.round(m.hp * HUNGRY.hp), attack: Math.round(m.attack * HUNGRY.attack), xp: m.xp * HUNGRY.xp }; // 먹잇감 냄새를 맡고 온 놈 (Z64)
  const f = b.fierce || 1; // 싸움이 시작된 날의 사나움
  if (f !== 1) m = { ...m, hp: Math.round(m.hp * f), attack: Math.round(m.attack * f), xp: Math.round(m.xp * f), drops: (m.drops || []).map((d) => ({ ...d, p: Math.min(1, d.p * f) })) };
  return m;
}
export const foeDef = mdef;

/** 이름난 개체가 나올 확률: 그 사냥감을 잡은 수만큼 오른다(한 마리에 0.5%p, 25%까지). */
export function eliteChance(state, monId) {
  const m = monsterDef(monId);
  if (m.boss || m.phases) return 0;
  return Math.min(ELITE.cap, (state.dex.mon[monId]?.won || 0) * ELITE.per);
}

const DROP_GRADES = [35, 35, 20, 8, 2];
/** 이름난 개체가 떨어뜨리는 장비 하나. 등급과 옵션이 붙는다. */
function dropGear(state, events) {
  const n = (state.counters.elites = (state.counters.elites || 0) + 1);
  const pool = Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && !d.tool && !d.job && (d.attack || d.defense) && d.price).map(([id]) => id);
  if (!pool.length) return;
  const id = pool[Math.floor(roll01(`${state.seed}|drop|${n}`) * pool.length)];
  let roll = roll01(`${state.seed}|dropgrade|${n}`) * 100;
  let grade = 0;
  for (let i = 0; i < DROP_GRADES.length; i++) { grade = i; roll -= DROP_GRADES[i]; if (roll < 0) break; }
  const item = rollOptions(state, addItem(state, id, 1, { grade }), `drop|${n}`);
  pushLine(state, events, { k: 'sys', text: `떨어진 것: ${gearName(item)} (${gradeName(grade)}).`, tone: 'mint' });
  events.push({ type: 'bag' });
}

/** 속성 상성 (T23): 약점 1.5배, 버티는 속성 절반. */
export function elementMult(attack, target) {
  if (!attack || !target) return 1;
  if (BEATS[attack] === target) return WEAK_MULT;
  if (BEATS[target] === attack || attack === target) return RESIST_MULT;
  return 1;
}

const val = (state, id) => derived(state).find((d) => d.id === id).value;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function weighted(state, list) {
  const total = list.reduce((a, x) => a + x.w, 0);
  let roll = next(state) * total;
  for (const x of list) { roll -= x.w; if (roll < 0) return x; }
  return list[list.length - 1];
}

export function hasStatus(state, id) {
  return state.status.some((s) => s.id === id);
}

/** 도망 성공 확률 (R2-2). 무게를 넘겼으면 어렵다 (G1-6). */
export function fleeChance(state) {
  const m = mdef(state.battle);
  const over = totalWeight(state) > val(state, 'carry') ? 0.2 : 0;
  return clamp(0.5 + (state.stats.agi - m.agi) * 0.03 - over + roleBonus(state) + (adv(state).flee || 0) + (state.flags.fleeEasy ? 0.1 : 0), 0.05, 0.95);
}

function critChance(a, b) {
  return clamp(0.05 + (a - b) * 0.01, 0, 0.5);
}

/** 피해 = (공격력×배율 − 방어력) ±10%, 최소 1. */
function damage(state, attack, power, defense) {
  const base = attack * power - defense;
  return Math.max(1, Math.round(base * (0.9 + next(state) * 0.2)));
}

export function startBattle(state, events, monId, { ambush = false, pounce = false, caught = false, hungry = false } = {}) {
  const m = monsterDef(monId);
  const seenN = (state.counters.fights = (state.counters.fights || 0) + 1);
  const elite = !hungry && roll01(`${state.seed}|elite|${monId}|${seenN}`) < eliteChance(state, monId);
  // stun·weak·burn: 내 스킬이 적에게 건 것. ward: 내 몸을 감싼 것. streak: 같은 공격을 이어 한 횟수.
  state.battle = { mon: monId, hp: 0, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  if (elite) state.battle.elite = true;
  if (hungry) state.battle.hungry = true;
  const f = fierceOf(state.day);
  if (f !== 1) state.battle.fierce = f;
  state.battle.hp = mdef(state.battle).hp;
  state.status = [];
  state.choice = null;
  state.lastAction = null;
  pushLine(state, events, { k: 'room', who: '전투', text: hungry ? `${iGa(`굶주린 ${m.name}`)} 이빨을 드러낸다. 입가가 붉다.` : m.intro });
  if (elite) pushLine(state, events, { k: 'sys', text: `여느 놈이 아니다. 몸집이 크고 눈빛이 다르다. 이름난 ${m.name}다.`, tone: 'warn' });
  events.push({ type: 'battle', phase: 'start', mon: monId });
  if (pounce) {
    pushLine(state, events, { k: 'me', text: '덤불에서 뛰쳐나가 먼저 덮쳤다.' });
    hitEnemy(state, events, 1.2 + (state.hidden.stealth?.value || 0) * 0.02 + (state.flags.pounceBonus ? 0.3 : 0));
    if (!state.battle) return;
  }
  chooseIntent(state, events);
  if (caught) {
    // 먼저 덮치려다 들켰다 (Z36): 공짜 공격 없이 적이 먼저 움직인다
    pushLine(state, events, { k: 'me', text: '덤불에서 뛰쳐나가려는 순간, 마른 가지가 부러졌다.' });
    pushLine(state, events, { k: 'sys', text: `들켰다. ${iGa(m.name)} 먼저 움직인다.`, tone: 'warn' });
    enemyAct(state, events, false);
    if (state.battle) endRound(state, events);
  } else if (ambush) {
    pushLine(state, events, { k: 'sys', text: '기척을 놓쳤다. 적이 먼저 움직인다.' });
    enemyAct(state, events, false);
    if (state.battle) endRound(state, events);
  }
}

function chooseIntent(state, events) {
  const b = state.battle;
  const m = mdef(b);
  const move = weighted(state, m.moves);
  b.intent = move.id;
  const hint = move.kind === 'charge' ? '큰 피해. 방어하면 막고 반격합니다.' : move.kind === 'wait' ? '틈입니다.' : '방어하면 절반만 받습니다.';
  pushLine(state, events, { k: 'intent', text: move.tell, next: move.name, hint });
}

/** 지금 예고된 적의 행동. 화면의 "다음 행동" 칸에 쓴다 (E7). */
export function intentOf(state) {
  const b = state.battle;
  if (!b) return null;
  return mdef(b).moves.find((x) => x.id === b.intent) || mdef(b).moves[0];
}

function hitEnemy(state, events, power = 1, verb = null, opt = {}) {
  const b = state.battle;
  const m = mdef(b);
  if (b.edge) { opt = { ...opt, plus: (opt.plus || 0) + b.edge.plus, sure: true }; b.edge = null; } // 피한 뒤의 빈틈
  let attack = val(state, 'attack') + (opt.plus || 0); // plus: 되받아치기·빈틈·모으기에 실리는 것
  // 힘이 아닌 것으로 치는 스킬: 공격력에서 힘을 빼고 그 스탯을 넣는다. 지혜는 무기에 기대지 않는다.
  const stat = opt.stat === 'best' ? ['str', 'agi', 'wis'].reduce((a, k) => (state.stats[k] > state.stats[a] ? k : a), 'str') : opt.stat;
  if (stat === 'agi') attack = attack - state.stats.str + state.stats.agi;
  if (stat === 'wis') attack = state.stats.wis;
  // 한길꾼: 같은 공격을 이어 할수록 쌓인다
  const streakRate = jobDef(state.job)?.streak || 0;
  if (streakRate) attack = Math.round(attack * (1 + Math.min(10, b.streak || 0) * streakRate));
  if (hasStatus(state, 'fear')) attack = Math.round(attack * 0.7);
  // 투지: 생명력이 30% 아래면 공격력이 오른다
  const fight = state.hidden.fight?.value || 0;
  if (fight && state.hp < val(state, 'maxHp') * 0.3) attack = Math.round(attack * (1 + fight * 0.02));
  const br = branchOf(state, 'strike');
  const a2 = adv(state);
  if (a2.rage && state.hp < val(state, 'maxHp') * 0.5) attack = Math.round(attack * a2.rage);
  if (a2.first && b.turn === 1) attack = Math.round(attack * a2.first);
  let dmg = damage(state, attack, power * (br?.dmg || 1) * (state.flags.knowsBoar && b.mon === 'boar' ? 1.15 : 1), opt.pierce ? 0 : m.defense); // 숲의 사람은 멧돼지 약점을 안다
  const crit = opt.sure ? true : chance(state, Math.max(0, critChance(state.stats.agi, m.agi) + (br?.crit || 0) + (opt.crit || 0) + (a2.crit || 0) + (equipPower(state).crit || 0)));
  if (crit) dmg = Math.round(dmg * 1.5);
  let em = elementMult(opt.element, m.element);
  if (em > 1 && a2.weak) em = a2.weak;
  if (em !== 1) {
    dmg = Math.max(1, Math.round(dmg * em));
    // 한 번 맞혀 보면 도감에 적힌다
    const seen = state.dex.mon[b.mon] || (state.dex.mon[b.mon] = { seen: 0, won: 0, lost: 0 });
    seen.elems = seen.elems || {};
    seen.elems[`${opt.element}>${m.element}`] = em;
  }
  b.hp = Math.max(0, b.hp - dmg);
  if (verb !== false) pushLine(state, events, { k: 'me', text: `${verb === '' ? '' : `${verb || '내리쳤다.'} `}${crit ? '급소에 맞았다. ' : ''}${em > 1 ? '약점을 찔렀다. ' : em < 1 ? '잘 듣지 않는다. ' : ''}${dmg} 피해.` });

  const weapon = state.equip.weapon;
  if (usable(weapon)) {
    weapon.dur -= 1;
    if (weapon.dur === 0) pushLine(state, events, { k: 'sys', text: `${iGa(itemDef(weapon.id).name)} 못 쓰게 되었다. 대장간에서 고쳐야 한다.` });
  }
  const skill = state.skills.strike || (state.skills.strike = emptySkill());
  const up = useSkill(skill, m.level * 2, jobXp(state, 'strike', (b.streak || 0) > 0));
  b.streak = (b.streak || 0) + 1;
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.strike} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (b.hp <= 0) win(state, events);
  return dmg;
}

function hurt(state, events, dmg) {
  state.hp = Math.max(0, state.hp - dmg);
  const armor = state.equip.body;
  if (usable(armor)) armor.dur -= 1;
}

// ── 지혜와 상태이상 내성 (Z52) ──
export const WIS_RESIST = ['bleed', 'poison', 'burn', 'stun']; // 공포는 담력이 맡는다
export const RESIST_PER = 0.02, RESIST_MAX = 0.6, SHORTEN_AT = 20;
/** 지혜가 덜 걸리게 하는 몫: 지혜 1마다 2%, 많아야 60%. */
export function wisResist(state) {
  return Math.min(RESIST_MAX, (state.stats.wis || 0) * RESIST_PER);
}
const RESISTED = {
  bleed: '상처가 깊지 않았다. 피가 곧 멎었다.',
  poison: '독이 퍼지기 전에 숨을 골랐다. 중독되지 않았다.',
  burn: '불길을 털어 냈다. 화상을 입지 않았다.',
  stun: '정신을 붙들었다. 기절하지 않았다.',
};

function applyStatus(state, events, st) {
  if (!st) return;
  // 담력: 공포에 덜 걸린다
  const nerve = st.id === 'fear' ? (state.hidden.nerve?.value || 0) * 0.05 : 0;
  const base = Math.max(0, st.chance - nerve);
  const wis = WIS_RESIST.includes(st.id);
  const p = wis ? base * (1 - wisResist(state)) : base;
  const r = next(state); // 굴림은 한 번 (지혜가 있어도 없어도 같은 수의 난수를 쓴다)
  if (r >= p) {
    if (wis && r < base) pushLine(state, events, { k: 'sys', tone: 'mint', text: RESISTED[st.id] });
    return;
  }
  // 지혜 20부터는 걸려도 1턴 짧다. 1턴짜리는 그대로
  const short = wis && (state.stats.wis || 0) >= SHORTEN_AT && st.turns > 1;
  const turns = short ? st.turns - 1 : st.turns;
  const had = state.status.find((s) => s.id === st.id);
  if (had) had.turns = Math.max(had.turns, turns);
  else state.status.push({ id: st.id, turns, fresh: true });
  const def = STATUS[st.id];
  pushLine(state, events, { k: 'sys', text: `상태이상 '${def.name}'. ${turns}턴 동안 ${def.say}.${short ? ' (지혜로 1턴 짧게)' : ''}`, tone: 'warn' });
}

/** 전투 태세. stat: 기대는 스탯, skill: 그렇게 싸울수록 오르는 숙련도. */
export const STANCES = {
  hold: { id: 'hold', name: '버티기', label: '방어', stat: 'con', skill: 'guard', text: '피해를 절반 넘게 줄인다. 큰 공격은 막고 되받아친다(공격력 + 방어력).' },
  clash: { id: 'clash', name: '맞받아치기', label: '맞받아치기', stat: 'str', skill: 'smash', text: '적의 공격에 마주 친다. 힘 겨루기에서 이기면 적의 공격이 꺾이고 내 일격이 방어를 무시한다. 지면 그대로 맞고 빗나간다.' },
  dodge: { id: 'dodge', name: '피하기', label: '피하기', stat: 'agi', skill: 'evade', text: '적의 공격을 피한다. 피하면 다음 공격이 반드시 급소에 들어가고 민첩의 절반이 실린다. 못 피하면 그대로 맞는다.' },
  focus: { id: 'focus', name: '모으기', label: '모으기', stat: 'wis', skill: 'focus', text: '치지 않고 마나를 모은다(그대로 맞는다). 다음 스킬이 2배, 두 번 모으면 3배가 되고 지혜의 절반이 실린다.' },
};
export const stanceOf = (state) => STANCES[state.stance] || STANCES.hold;
const odds = (x) => Math.max(0.1, Math.min(0.9, x));

/** 맞받아쳐 이길 확률: 내 공격력이 적보다 센 만큼, 강타 숙련만큼. */
export function clashChance(state) {
  const m = mdef(state.battle);
  return odds(0.5 + (val(state, 'attack') - m.attack) * 0.02 + (state.skills.smash?.grade || 0) * 0.01);
}
/** 피할 확률: 내 민첩이 적보다 높은 만큼, 회피 숙련만큼. */
export function dodgeChance(state) {
  const m = mdef(state.battle);
  return odds(0.5 + (state.stats.agi - m.agi) * 0.03 + (state.skills.evade?.grade || 0) * 0.01 + (state.flags.dodge10 ? 0.1 : 0));
}

/** 태세로 한 턴을 버텼다. 그 숙련도가 오른다. 센 적일수록 많이 오른다. */
function stanceUp(state, events, id, m) {
  const skill = state.skills[id] || (state.skills[id] = emptySkill());
  state.counters.act[id] = (state.counters.act[id] || 0) + 1;
  const up = useSkill(skill, m.level * 2, jobXp(state, id, false));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[id]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
}

/** 방어로 줄이는 몫: 절반에서 시작해 막기 숙련 한 단계마다 1%p, 80%까지. */
export function guardCut(state) {
  return Math.min(0.8, 0.5 + (state.skills.guard?.grade || 0) * 0.01);
}

/** 적의 공격을 막아 냈다. 막기 숙련도가 오른다. 센 적을 막을수록 많이 오른다. */
function guardUp(state, events, m) {
  const skill = state.skills.guard || (state.skills.guard = emptySkill());
  state.counters.act.guard = (state.counters.act.guard || 0) + 1;
  const up = useSkill(skill, m.level * 2, jobXp(state, 'guard', false));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.guard} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
}

function enemyAct(state, events, defended, guard = null, stance = null) {
  const b = state.battle;
  const m = mdef(b);
  const move = intentOf(state);
  const idle = b.stun > 0 || move.kind === 'wait';
  // 맞받아치기: 적이 치지 않으면 그냥 한 대 친다
  if (stance === 'clash' && idle) hitEnemy(state, events, 1, '빈틈에 내리쳤다.');
  if (stance === 'dodge' && idle) pushLine(state, events, { k: 'me', text: '피할 것이 오지 않았다.' });
  if (!state.battle) return;
  if (b.stun > 0) {
    b.stun -= 1;
    pushLine(state, events, { k: 'room', text: `${iGa(m.name)} 움직이지 못한다.` });
    return;
  }
  if (move.kind === 'wait') {
    pushLine(state, events, { k: 'room', text: move.say });
    applyStatus(state, events, move.status);
    return;
  }
  if ((defended || guard?.counter) && move.kind === 'charge') {
    pushLine(state, events, { k: 'me', text: `${eulReul(move.name)} 막고 되받아쳤다.` });
    if (defended) guardUp(state, events, m);
    // 버틴 몸으로 되받아친다: 공격력에 방어력과 막기 숙련이 실린다
    hitEnemy(state, events, 1, '되받아쳤다.', { plus: val(state, 'defense') + skillBonus(state.skills.guard) });
    return;
  }
  const foe = b.weak ? Math.round(m.attack * (1 - b.weak.cut)) : m.attack;
  let dmg = damage(state, foe, move.power, val(state, 'defense'));
  if (chance(state, critChance(m.agi, state.stats.agi))) dmg = Math.round(dmg * 1.5);
  // 피하기: 피하면 맞지 않고, 다음 공격에 빈틈이 생긴다
  if (stance === 'dodge') {
    stanceUp(state, events, 'evade', m);
    if (chance(state, dodgeChance(state))) {
      b.edge = { plus: Math.floor(state.stats.agi / 2) + skillBonus(state.skills.evade) };
      pushLine(state, events, { k: 'me', text: `${eulReul(move.name)} 흘려보냈다. 빈틈이 보인다.` });
      if (b.weak && --b.weak.turns <= 0) b.weak = null;
      if (b.ward && --b.ward.turns <= 0) { b.ward = null; pushLine(state, events, { k: 'sys', text: '몸을 감싸던 것이 걷혔다.' }); }
      return;
    }
    pushLine(state, events, { k: 'me', text: '피하려 했지만 늦었다.' });
  }
  // 맞받아치기: 이기면 적의 공격이 꺾이고 내 일격이 방어를 무시한다. 지면 그대로 맞는다
  let clashWon = false;
  if (stance === 'clash') {
    stanceUp(state, events, 'smash', m);
    clashWon = chance(state, clashChance(state));
    if (clashWon) { dmg = Math.max(1, Math.round(dmg / 2)); pushLine(state, events, { k: 'me', text: `${eulReul(move.name)} 마주 쳐서 꺾었다.` }); }
    else pushLine(state, events, { k: 'me', text: '마주 쳤지만 밀렸다.' });
  }
  if (stance === 'focus') stanceUp(state, events, 'focus', m);
  // '나를 먼저'인 앞줄 동료가 대신 맞아 준다 (T21)
  const shield = state.party.length ? guardFor(state) : null;
  if (shield) { if (clashWon) b.clashHit = true; hitCompanion(state, events, shield, dmg); return; }
  if (defended) { dmg = Math.max(1, Math.round(dmg * (1 - guardCut(state)))); guardUp(state, events, m); }
  if (guard?.cut) dmg = Math.max(1, Math.round(dmg * (1 - guard.cut)));
  if (b.ward) {
    dmg = Math.max(1, Math.round(dmg * (1 - b.ward.cut)));
    if (--b.ward.turns <= 0) { b.ward = null; pushLine(state, events, { k: 'sys', text: '몸을 감싸던 것이 걷혔다.' }); }
  }
  if (b.weak && --b.weak.turns <= 0) b.weak = null;
  if (clashWon) b.clashHit = true;
  hurt(state, events, dmg);
  pushLine(state, events, { k: 'room', text: `${move.say} ${defended || guard?.cut ? '막았지만 ' : ''}${dmg} 피해.` });
  if (state.hp <= 0) return;
  if (!defended && !guard?.cut) applyStatus(state, events, move.status);
}

function endRound(state, events) {
  for (const s of state.status) {
    const def = STATUS[s.id];
    if (def.per > 0) {
      state.hp = Math.max(0, state.hp - def.per); // 피가 나는 것은 갑옷을 닳게 하지 않는다
      pushLine(state, events, { k: 'sys', text: `${ro(def.name)} ${def.per} 피해.` });
    }
    // 이번 턴에 막 걸린 기절·공포는 다음 턴부터 센다. 그래야 적힌 턴 수만큼 간다.
    const fresh = s.fresh;
    delete s.fresh;
    if (fresh && def.per === 0) continue;
    s.turns -= 1;
  }
  state.status = state.status.filter((s) => s.turns > 0);
  if (state.hp <= 0) return lose(state, events);
  if (!state.battle) return;
  const b = state.battle;
  if (b.burn > 0) {
    const burn = 3 + Math.floor(state.stats.wis / 4);
    b.burn -= 1;
    b.hp = Math.max(0, b.hp - burn);
    pushLine(state, events, { k: 'room', text: `${iGa(mdef(b).name)} 불에 탄다. ${burn} 피해.` });
    if (b.hp <= 0) return win(state, events);
  }
  // 우두머리의 국면 (T22): 생명력이 문턱 아래로 내려가면 바뀐다
  const base = monsterDef(b.mon);
  if (base.phases) {
    while ((b.phase || 0) < base.phases.length && b.hp <= Math.round(base.hp * (b.fierce || 1)) * base.phases[b.phase || 0].at) {
      b.phase = (b.phase || 0) + 1;
      pushLine(state, events, { k: 'room', who: '국면이 바뀌었다', text: `${base.phases[b.phase - 1].say} (속성: ${base.phases[b.phase - 1].element})` });
      events.push({ type: 'battle', phase: 'shift', mon: b.mon });
    }
  }

  state.battle.turn += 1;
  chooseIntent(state, events);
}

function win(state, events) {
  const b = state.battle;
  const m = mdef(b);
  const before = state.level;
  pushLine(state, events, { k: 'room', text: `${iGa(m.name)} 쓰러졌다.` });
  const got = [`경험치 ${m.xp}`];
  for (const d of m.drops) {
    if (!chance(state, d.p)) continue;
    addItem(state, d.id, 1);
    got.push(`${itemDef(d.id).name} 1`);
  }
  pushLine(state, events, { k: 'sys', text: `얻은 것: ${got.join(', ')}.` });
  if (b.elite) {
    dropGear(state, events);
    ding(state, events, { level: 2, title: `${eulReul(m.name)} 쓰러뜨렸습니다`, body: '많이 잡아 본 사냥감 가운데 드물게 나오는 놈입니다. 장비를 떨어뜨립니다.' });
  }
  const maxHp = val(state, 'maxHp');
  if (state.hp <= maxHp * 0.1) state.counters.nearDeath += 1;
  if (m.level >= before + 5) state.counters.bigWins += 1;
  state.dex.mon[b.mon] = { ...(state.dex.mon[b.mon] || { seen: 0, lost: 0 }), won: (state.dex.mon[b.mon]?.won || 0) + 1 };
  state.battle = null;
  state.status = [];
  state.calm = 2;
  state.tension[state.place] = 0;
  afterBattle(state, events, true);
  grantXp(state, events, Math.round(m.xp * (1 + guildPerk(state, 'fight'))));
  events.push({ type: 'battle', phase: 'win', mon: b.mon, elite: !!b.elite });
}

/** 싸우다 곯아떨어졌다 (Z65): 적 앞에서 잠든 몸은 그대로 쓰러진다. */
export function dozeInBattle(state, events) {
  const m = state.battle ? mdef(state.battle) : null;
  pushLine(state, events, { k: 'sys', tone: 'warn', text: '싸우는 도중 눈꺼풀이 내려앉았다. 버티지 못하고 그 자리에서 잠들었다.' });
  if (m) pushLine(state, events, { k: 'room', text: `${iGa(m.name)} 잠든 몸을 덮쳤다.` });
  state.hp = 0;
  lose(state, events);
}

function lose(state, events) {
  const b = state.battle;
  const m = b ? mdef(b) : null;
  if (b) state.dex.mon[b.mon] = { ...(state.dex.mon[b.mon] || { seen: 0, won: 0 }), lost: (state.dex.mon[b.mon]?.lost || 0) + 1 };
  events.push({ type: 'battle', phase: 'lose', mon: b?.mon });
  afterBattle(state, events, false);
  // 다시 일어선 몸 (Z30): 나보다 레벨이 같거나 높은 적의 생명력을 30% 넘게 깎고 쓰러졌는가
  const dealt = b && m ? Math.max(0, 1 - b.hp / m.hp) : 0;
  fall(state, events, m ? `${m.name}에게 졌다.` : '', m ? { foeLevel: m.level, dealt } : null);
}

/**
 * 전투에서 한 번 움직인다.
 * @param {'attack'|'defend'|'flee'|'item'} choice
 * @param {number} [arg] 아이템을 쓸 때 가방의 자리
 */
export function battleAct(state, events, choice, arg) {
  const b = state.battle;
  if (!b) throw new Error('싸우고 있지 않습니다');
  const m = mdef(b);
  if (!['attack', 'defend', 'flee', 'item', 'swap', 'skill'].includes(choice)) throw new Error('모르는 전투 행동: ' + choice);
  const sk = choice === 'skill' ? skillsNow(state).find((x) => x.id === arg) : null;
  if (choice === 'skill') {
    if (!sk) throw new Error('쓸 수 없는 스킬입니다');
    if (!sk.open) throw new Error(`레벨 ${sk.at}에 열리는 스킬입니다`);
    if (state.mp < sk.mp) throw new Error(`마나가 모자랍니다 (${state.mp} / ${sk.mp})`);
  }
  if (choice === 'item' && !(state.bag[arg] && (itemDef(state.bag[arg].id).eat || itemDef(state.bag[arg].id).throw))) throw new Error('쓸 수 없는 물건입니다');
  if (choice === 'swap') {
    const slot = state.bag[arg] ? slotFor(state, state.bag[arg]) : null;
    if (slot !== 'weapon' && slot !== 'off') throw new Error('싸우는 중에는 무기와 보조만 바꿀 수 있습니다');
    const need = itemDef(state.bag[arg].id).job;
    if (need && need !== state.job && !(state.flags.anyShield && state.bag[arg].id === 'oldshield')) throw new Error(`${jobDef(need)?.name || need}만 쓸 수 있습니다`);
  }
  const stunned = hasStatus(state, 'stun');
  const stance = choice === 'defend' && !stunned ? stanceOf(state).id : null;
  const defended = stance === 'hold';

  if (choice === 'flee' && !stunned) {
    if (chance(state, fleeChance(state))) {
      pushLine(state, events, { k: 'me', text: '등을 돌려 달아났다.' });
      state.battle = null;
      state.status = [];
      state.calm = 2;
      afterBattle(state, events, false);
      cross(state, events, 'flee');
      events.push({ type: 'battle', phase: 'fled', mon: b.mon });
      return;
    }
    pushLine(state, events, { k: 'me', text: '달아나려 했지만 길이 막혔다.' });
  }

  // 스킬로 막는 것은 방어처럼 그 턴의 적 공격에 듣는다
  const guard = sk && !stunned && sk.guard ? { cut: Math.min(0.95, sk.guard + (adv(state).guard || 0)), counter: !!sk.counter } : null;
  if (guard) { state.mp -= sk.mp; pushLine(state, events, { k: 'me', text: `${sk.name}. ${sk.say}` }); }
  if (choice !== 'attack' && !(sk && sk.again)) b.streak = 0; // 다른 일을 하면 쌓인 것이 끊긴다

  if (sk && sk.flee && !stunned) {
    state.mp -= sk.mp;
    pushLine(state, events, { k: 'me', text: `${sk.say} 그 틈에 달아났다.` });
    state.battle = null;
    state.status = [];
    state.calm = 2;
    afterBattle(state, events, false);
    cross(state, events, 'flee');
    events.push({ type: 'battle', phase: 'fled', mon: b.mon });
    return;
  }

  const cast = () => {
    if (guard) return; // 막는 스킬은 턴 머리에 이미 썼다
    state.mp -= sk.mp;
    pushLine(state, events, { k: 'me', text: `${sk.name}. ${sk.say}` });
    const charge = sk.dmg || sk.heal ? b.focus || 0 : 0; // 모은 횟수(둘까지). 피해도 회복도 없는 스킬에는 쓰이지 않고 남는다
    const boost = 1 + charge;
    const plus = charge ? Math.floor(state.stats.wis / 2) + skillBonus(state.skills.focus) : 0;
    if (charge) { b.focus = 0; pushLine(state, events, { k: 'sys', text: `모아 둔 것이 터진다. 위력 ${boost}배.` }); }
    if (sk.dmg) {
      const power = (sk.first && b.turn === 1 ? sk.first : sk.dmg) * boost;
      for (let i = 0; i < (sk.hits || 1) && state.battle; i++) hitEnemy(state, events, power, '', { stat: sk.stat, pierce: sk.pierce, crit: sk.crit, element: sk.element, plus });
    }
    if (!state.battle) return;
    if (sk.heal) {
      const max = val(state, 'maxHp');
      const before = state.hp;
      state.hp = Math.min(max, state.hp + Math.round(state.stats.wis * sk.heal * boost * (1 + (state.hidden.faith?.value || 0) * 0.02) * (adv(state).heal || 1)));
      pushLine(state, events, { k: 'sys', text: `생명력 +${state.hp - before}.` });
    }
    if (sk.cleanse && state.status.length) { state.status = []; pushLine(state, events, { k: 'sys', text: '걸려 있던 것이 모두 씻겨 나갔다.' }); }
    if (sk.ward) b.ward = { ...sk.ward, turns: sk.ward.turns + (adv(state).ward || 0) };
    if (sk.stun) b.stun = Math.max(b.stun || 0, sk.stun);
    if (sk.weaken) b.weak = { ...sk.weaken };
    if (sk.burn) b.burn = Math.max(b.burn || 0, sk.burn);
  };

  const mine = () => {
    if (stunned) { pushLine(state, events, { k: 'sys', text: '몸이 굳어 움직일 수 없다.' }); return; }
    if (sk) return cast();
    if (choice === 'attack') hitEnemy(state, events, 1, usable(state.equip.weapon) ? '내리쳤다.' : '맨주먹을 휘둘렀다.');
    else if (choice === 'defend') {
      if (prepared) return; // 턴 머리에 이미 채비했다
      const id = stanceOf(state).id;
      if (id === 'hold') pushLine(state, events, { k: 'me', text: '자세를 낮추고 막을 채비를 했다.' });
      else if (id === 'clash') pushLine(state, events, { k: 'me', text: '물러서지 않고 마주 칠 채비를 했다.' });
      else if (id === 'dodge') pushLine(state, events, { k: 'me', text: '발끝에 힘을 빼고 움직임을 읽었다.' });
      else {
        const maxMp = val(state, 'maxMp');
        const before = state.mp;
        state.mp = Math.min(maxMp, state.mp + Math.max(1, Math.round(maxMp * 0.1)));
        b.focus = Math.min(2, (b.focus || 0) + 1);
        pushLine(state, events, { k: 'me', text: `숨을 고르고 힘을 모았다(${b.focus}번째).${state.mp > before ? ` 마나 +${state.mp - before}.` : ''}` });
      }
    }
    else if (choice === 'item') useInBattle(state, events, arg);
    else if (choice === 'swap') {
      const name = itemDef(state.bag[arg].id).name;
      equip(state, arg);
      pushLine(state, events, { k: 'me', text: `${eulReul(name)} 바꿔 쥐었다.` });
      events.push({ type: 'gear' });
    }
    else if (choice !== 'flee') throw new Error('모르는 전투 행동: ' + choice);
  };

  // 동료는 내 차례 바로 뒤에 방침대로 움직인다
  const friends = () => {
    if (!state.battle || !state.party.length) return;
    const strike = (attack, name) => {
      if (!state.battle) return;
      const dmg = damage(state, Math.round(attack * (adv(state).friend || 1)), 1, m.defense);
      b.hp = Math.max(0, b.hp - dmg);
      pushLine(state, events, { k: 'room', text: `${iGa(name)} 쳤다. ${dmg} 피해.` });
      if (b.hp <= 0) win(state, events);
    };
    companionsAct(state, events, strike, val(state, 'maxHp'), { hp: b.hp, maxHp: m.hp });
  };
  // 태세는 턴이 시작될 때 잡는다. 적이 더 빨라도 "채비했다"가 먼저 적히고, 모은 것도 맞기 전에 쌓인다
  let prepared = false;
  if (stance) { mine(); prepared = true; }
  if (state.stats.agi >= m.agi) {
    if (!prepared) mine();
    friends();
    if (state.battle) enemyAct(state, events, defended, guard, stance);
  } else {
    enemyAct(state, events, defended, guard, stance);
    if (state.hp > 0 && state.battle) { if (!prepared) mine(); friends(); }
  }
  if (state.battle && b.clashHit) {
    b.clashHit = false;
    if (state.hp > 0) hitEnemy(state, events, 1, '꺾인 틈으로 내리쳤다.', { pierce: true, plus: skillBonus(state.skills.smash) });
  }
  if (state.hp <= 0) return lose(state, events);
  if (state.battle) endRound(state, events);
}

function useInBattle(state, events, index) {
  const item = state.bag[index];
  const t = item && itemDef(item.id).throw;
  if (t) {
    const b = state.battle;
    const m = mdef(b);
    const name = itemDef(item.id).name;
    removeAt(state, index, 1);
    const em = elementMult(t.element, m.element);
    const dmg = Math.max(1, Math.round(t.dmg * em));
    if (em !== 1) { const seen = state.dex.mon[b.mon] || (state.dex.mon[b.mon] = { seen: 0, won: 0, lost: 0 }); seen.elems = seen.elems || {}; seen.elems[`${t.element}>${m.element}`] = em; }
    b.hp = Math.max(0, b.hp - dmg);
    pushLine(state, events, { k: 'me', text: `${eulReul(name)} 던졌다. ${em > 1 ? '약점을 찔렀다. ' : em < 1 ? '잘 듣지 않는다. ' : ''}${t.element} 속성으로 ${dmg} 피해.` });
    if (b.hp <= 0) win(state, events);
    return;
  }
  if (!item || !itemDef(item.id).eat) throw new Error('쓸 수 없는 물건입니다');
  eat(state, events, index);
}

export const FOOD_HEAL = 0.5; // 음식의 포만감 1마다 생명력 0.5 (정해진 양, Z54)

/** 먹거나 쓰면 차는 생명력. 물약은 최대 생명력의 비율(hpPct), 약초는 정해진 양(hp), 음식은 포만감의 절반만큼 정해진 양 */
export function healOf(state, def, max) {
  const more = state.flags?.foodPlus ? 1.2 : 1;
  if (def.eat?.hpPct) return Math.round(max * def.eat.hpPct / 100 * more);
  if (def.eat?.hp) return Math.round(def.eat.hp * more);
  if (def.eat?.full) return Math.round(def.eat.full * FOOD_HEAL * more);
  return 0;
}

/** 먹거나 마신다. 전투 밖에서도 쓴다. */
export function eat(state, events, index) {
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  const def = itemDef(item.id);
  if (def.throw) throw new Error('싸움에서 쓰는 물건입니다');
  if (!def.eat) throw new Error('먹을 수 없는 물건입니다');
  removeAt(state, index, 1);
  const parts = [];
  const more = state.flags.foodPlus ? 1.2 : 1;
  if (def.eat.full) { const got = Math.round(def.eat.full * more); state.full = Math.min(100, state.full + got); parts.push(`포만감 +${got}`); }
  // 생명력: 물약은 최대 생명력의 비율, 약초·음식은 정해진 양 (Z54)
  { const max = val(state, 'maxHp'); const heal = healOf(state, def, max); if (heal) { const before = state.hp; state.hp = Math.min(max, state.hp + heal); if (state.hp > before || !def.eat.full) parts.push(`생명력 +${state.hp - before}`); } }
  pushLine(state, events, { k: 'me', text: `${eulReul(def.name)} ${def.eat.full ? '먹었다' : def.kind === 'material' ? '씹어 상처에 붙였다' : '마셨다'}. ${parts.join(', ')}.` });
}
