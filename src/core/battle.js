// 전투 (E5~E9, R2-2). 한 턴에 행동 하나. 적의 다음 행동은 늘 미리 보인다.
// 방어하면 피해가 절반이고, 돌진류는 막고 되받아친다.

import { bandOfPlace } from '../data/bands.js?v=f30e95b';
import { placeById } from '../data/places.js?v=f30e95b';
import { next, chance } from './rng.js?v=f30e95b';
import { pushLine, ding } from './log.js?v=f30e95b';
import { monsterDef, STATUS } from '../data/monsters.js?v=f30e95b';
import { itemDef, ITEMS, gradeName } from '../data/items.js?v=f30e95b';
import { roll01 } from './rng.js?v=f30e95b';
import { guildPerk } from './guild.js?v=f30e95b';
import { rollOptions, gearName } from './gear.js?v=f30e95b';
import { derived, skillBonus, attackStat } from './derived.js?v=f30e95b';
import { addItem, removeAt, usable, totalWeight, equip, slotFor, equipPower } from './inventory.js?v=f30e95b';
import { grantXp } from './reward.js?v=f30e95b';
import { useSkill, emptySkill, gradeLabel, SKILL_NAMES } from './skills.js?v=f30e95b';
import { fall } from './fall.js?v=f30e95b';
import { iGa, eulReul, ro } from './ko.js?v=f30e95b';
import { branchOf } from './evolve.js?v=f30e95b';
import { skillsNow, jobXp, adv } from './jobs.js?v=f30e95b';
import { guardFor, hitCompanion, companionsAct, afterBattle, roleBonus, cross } from './party.js?v=f30e95b';
import { jobDef } from '../data/jobs.js?v=f30e95b';
import { BEATS, WEAK_MULT, RESIST_MULT } from '../data/dungeon.js?v=f30e95b';
import { HUNGRY, DUEL, DUEL_MOVES, BANDIT, BANDIT_MOVES } from '../data/wild.js?v=f30e95b';
import { addFame } from './social.js?v=f30e95b';
import { giveMurder, MURDER, giveGrace, GRACE } from './buffs.js?v=f30e95b';
import { applyDish } from './cook.js?v=f30e95b';
import { DISHES } from '../data/cooking.js?v=f30e95b';
import { warmUp } from './cold.js?v=f30e95b';
import { loseWater } from './thirst.js?v=f30e95b';
import { wear } from './heat.js?v=f30e95b';
import { normalAt } from '../data/bands.js?v=f30e95b';
import { arenaIntent, neverRests, ARENA_FOE } from '../data/arena.js?v=f30e95b';

/** 사나움 (Z60): 세계의 날마다 괴물의 생명·공격과 경험치·떨굼 확률이 조금씩 오른다. 끝이 없다. 우두머리·던전도 같다. */
import { curseOf, curseMult, curseHit, liftCurse, healCut } from './marsh.js?v=f30e95b';
import { SUNKEN, SUNKEN_LINES, pairComes, holder, giftBoost, useAir } from './sunken.js?v=f30e95b';
import { COMPANIONS } from '../data/companions.js?v=f30e95b';
import { drumBuff } from './buffs.js?v=f30e95b';
import { CLOUD, CLOUD_LINES, windIs, pushedLine } from './cloud.js?v=f30e95b';
import { POND, READ_LINES, mirrored, isRead, readKey, readStep, readReset } from './pond.js?v=f30e95b';
import { ANVIL, ANVIL_LINES, forged, temperMult, hammerInBattle, cooled, keptEdge, bellIntent, shellBroke, bellRound, leftBell, building, bellBuilt } from './anvil.js?v=f30e95b';
import { monsterXp } from '../data/bands.js?v=f30e95b';
import { xpToNext } from './level.js?v=f30e95b';
import { addSkillXp } from './skills.js?v=f30e95b';
export const FIERCE_PER = 0.0005;
export const fierceOf = (day) => 1 + FIERCE_PER * Math.max(0, (day || 1) - 1);

/** 지금 국면이 반영된 괴물 (T22). */
export const ELITE = { hp: 2.5, attack: 1.3, defense: 2, level: 2, xp: 3, per: 0.005, cap: 0.25 };

function mdef(b) {
  let m = monsterDef(b.mon);
  if (m.phases && b.phase) m = { ...m, ...m.phases[b.phase - 1] };
  // 못의 거울상 (BM-B3): 공격력이 내 공격력의 90%, 방어력이 내 방어구 합, 경험치가 내 레벨의 몬스터 한 마리 반. 이 한 마리만 나를 비춘다
  if (b.mirror) m = { ...m, attack: b.mirror.attack, defense: b.mirror.defense, xp: b.mirror.xp };
  // 지어지지 않은 종 (CM-D3): 싸움에서 깨는 것은 식은 껍질이다. 종의 생명력(보통 몬스터의 4배, LV-I3) 가운데 껍질의 몫만큼만 깨면 속이 드러난다
  if (m.build) m = { ...m, hp: Math.max(1, Math.round(m.hp * ANVIL.shell)) };
  // 이름난 개체: 많이 잡은 사냥감 가운데 드물게 나온다. 훨씬 세고, 잡으면 장비를 떨어뜨린다
  if (b.elite) m = { ...m, name: `이름난 ${m.name}`, hp: Math.round(m.hp * ELITE.hp), attack: Math.round(m.attack * ELITE.attack), defense: m.defense + ELITE.defense, level: m.level + ELITE.level, xp: m.xp * ELITE.xp };
  if (b.hungry) m = { ...m, name: `굶주린 ${m.name}`, hp: Math.round(m.hp * HUNGRY.hp), attack: Math.round(m.attack * HUNGRY.attack), xp: m.xp * HUNGRY.xp }; // 먹잇감 냄새를 맡고 온 놈 (Z64)
  // 모험가 (Z72): 그 들판에서 가장 센 짐승만큼 세다. 사람의 기술을 쓰고, 떨굼 대신 가진 것을 빼앗긴다
  if (b.person) m = { ...m, name: `모험가 '${b.person}'`, element: null, hp: Math.round(m.hp * DUEL.hp), attack: Math.round(m.attack * DUEL.attack), xp: m.xp * DUEL.xp, moves: DUEL_MOVES, drops: [], phases: null };
  // 도적 (Z90): 그 들판의 가장 센 짐승에서, 눈에 띄는 정도 1000마다 레벨 +1
  if (b.bandit) { const u = b.bandit.up || 0; m = { ...m, name: `도적 '${b.bandit.name}'`, element: null, level: m.level + u, hp: Math.round(m.hp * 1.2 * (1 + BANDIT.hp * u)), attack: Math.round(m.attack * (1 + BANDIT.attack * u)), defense: m.defense + Math.floor(u / 2), xp: Math.round(m.xp * BANDIT.xp * (1 + 0.1 * u)), moves: BANDIT_MOVES, drops: [], phases: null }; }
  // 겨루기 상대 (AG-C2): "모험가와 싸우기"의 틀(수 셋) 그대로, 세기는 그 사람의 레벨에 맞춘다(곱하는 숫자는 마당의 것, M23-4). 떨구는 것도 경험치도 없다
  if (b.arena) { const n = normalAt(b.arena.level); m = { ...m, name: `겨루기 상대 '${b.arena.name}'`, element: null, level: b.arena.level, hp: Math.round(n.hp * ARENA_FOE.hp), attack: Math.round(n.attack * ARENA_FOE.attack), defense: n.defense, agi: Math.round(10 + b.arena.level * 0.6), xp: 0, moves: neverRests(b.arena) ? DUEL_MOVES.filter((x) => x.kind !== 'wait') : DUEL_MOVES, drops: [], phases: null }; }
  // 임금의 하사품 (JD-D): 연 상자마다 메아리가 5%씩 세다. 어디에도 내보내지 않는다
  if (b.gift) m = { ...m, hp: Math.round(m.hp * b.gift), attack: Math.round(m.attack * b.gift) };
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
  const here = bandOfPlace(placeById(state.place)).n; // 그곳 구간의 장비까지만 떨어진다 (LV-G1)
  const pool = Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && !d.tool && !d.job && (d.attack || d.defense) && d.price && (d.tier || 1) <= here).map(([id]) => id);
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
/** 못의 거울상이 비추는 것 (BM-B3): 지금의 내 공격력과 방어구 합. 좋은 장비를 찰수록 세다. */
export const mirrorOf = (state) => ({ attack: Math.max(1, Math.round(val(state, 'attack') * POND.mirrorAttack)), defense: equipPower(state).defense });
/** 싸움에서 오른 숙련도를 적어 둔다: 한 번도 읽히지 않고 이기면 그 20%가 더 오른다 (BM-B3). 읽히는 곳에서만 적는다. */
function tally(state, b, id, up) {
  if (!b || !mirrored(state) || !up?.gained) return;
  b.gain = b.gain || {};
  b.gain[id] = (b.gain[id] || 0) + up.gained;
}
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
  if (building(state.battle)) return 1; // 지어지지 않은 종은 쫓아오지 않는다: 망치를 내려놓으면 내려온다 (CM-D5)
  const over = totalWeight(state) > val(state, 'carry') ? 0.2 : 0;
  return clamp(0.5 + (state.stats.agi - m.agi) * 0.03 - over + roleBonus(state) + (adv(state).flee || 0) + (state.flags.fleeEasy ? 0.1 : 0) + (windIs(state, 'tail') ? CLOUD.flee : 0), 0.05, 0.95); // 뒷바람이 등을 민다 (GD-B3)
}

function critChance(a, b) {
  return clamp(0.05 + (a - b) * 0.01, 0, 0.5);
}

/** 피해 = (공격력×배율 − 방어력) ±10%, 최소 1. */
function damage(state, attack, power, defense) {
  const base = attack * power - defense;
  return Math.max(1, Math.round(base * (0.9 + next(state) * 0.2)));
}

export function startBattle(state, events, monId, { ambush = false, pounce = false, caught = false, hungry = false, person = null, bandit = null, arena = null, second = false, half = false, solo = false, bell = null } = {}) {
  const m = monsterDef(monId);
  const seenN = (state.counters.fights = (state.counters.fights || 0) + 1);
  const elite = !hungry && !person && !bandit && !arena && !second && roll01(`${state.seed}|elite|${monId}|${seenN}`) < eliteChance(state, monId);
  // stun·weak·burn: 내 스킬이 적에게 건 것. ward: 내 몸을 감싼 것. streak: 같은 공격을 이어 한 횟수.
  state.battle = { mon: monId, hp: 0, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  // 지어지지 않은 종 (CM-D2): 종(bell)을 100까지 채워야 끝난다. bellx는 절반 단위로 센 값, open은 깨진 껍질이 다시 굳기까지의 턴
  if (m.build) { state.battle.bell = bell || 0; state.battle.bellx = (bell || 0) * 2; state.battle.open = 0; }
  // 벼리는 곳 (CM-B3): 싸움을 시작할 때 든 무기의 내구도를 적어 둔다(벼림 열둘로 이기면 닳지 않는다)
  if (forged(state) && state.equip.weapon) { state.battle.wid = state.equip.weapon.id; state.battle.wdur = state.equip.weapon.dur; }
  if (elite) state.battle.elite = true;
  if (hungry) state.battle.hungry = true;
  if (person) state.battle.person = person;
  if (bandit) state.battle.bandit = bandit;
  if (arena) state.battle.arena = arena;
  if (second) state.battle.second = true; // 짝의 둘째 (JD-B3): 이 싸움 뒤에는 더 오지 않는다
  if (solo) state.battle.solo = true; // 혼자 자리를 지키는 근위병: 짝이 없다
  if (m.gifted && giftBoost(state) > 1) state.battle.gift = giftBoost(state);
  if (monId === POND.mirror) state.battle.mirror = { ...mirrorOf(state), xp: Math.round(monsterXp(state.level, xpToNext) * POND.mirrorXp) };
  const f = arena ? 1 : fierceOf(state.day); // 겨루기 상대는 사람이다. 들짐승처럼 사나워지지 않는다
  if (f !== 1) state.battle.fierce = f;
  state.battle.hp = mdef(state.battle).hp;
  if (half) state.battle.hp = Math.ceil(state.battle.hp * SUNKEN.secondHp); // 막는 이가 붙잡은 둘째는 생명력 절반으로 덤빈다
  state.status = [];
  state.choice = null;
  state.lastAction = null;
  if (arena) pushLine(state, events, { k: 'room', who: '겨루기', text: `'${arena.name}'${arena.name.charCodeAt(arena.name.length - 1) >= 0xac00 && (arena.name.charCodeAt(arena.name.length - 1) - 0xac00) % 28 ? '이' : '가'} 마당 한가운데로 걸어 나온다. 둘레가 조용해진다.` });
  else if (person) pushLine(state, events, { k: 'user', who: `모험가 '${person}'`, text: '그래, 그렇게 나오시겠다? 좋아요. 끝을 봅시다.' });
  else if (bandit) pushLine(state, events, { k: 'npc', who: `도적 '${bandit.name}'`, text: '장비도 반짝이는군. 오늘 운이 좋다.' });
  else if (!second) pushLine(state, events, { k: 'room', who: '전투', text: hungry ? `${iGa(`굶주린 ${m.name}`)} 이빨을 드러낸다. 입가가 붉다.` : m.intro });
  if (elite) pushLine(state, events, { k: 'sys', text: `여느 놈이 아니다. 몸집이 크고 눈빛이 다르다. 이름난 ${m.name}다.`, tone: 'warn' });
  events.push({ type: 'battle', phase: 'start', mon: monId });
  if (pounce) {
    const first = state.battle;
    pushLine(state, events, { k: 'me', text: '덤불에서 뛰쳐나가 먼저 덮쳤다.' });
    hitEnemy(state, events, 1.2 + (state.hidden.stealth?.value || 0) * 0.02 + (state.flags.pounceBonus ? 0.3 : 0));
    if (state.battle !== first) return; // 한 번에 쓰러졌다(짝이 이어 덤볐으면 그 싸움은 이미 차려졌다)
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
  // 겨루기 상대는 버릇대로 움직인다 (AG-C5). 버릇이 걸리지 않는 수는 지금처럼 고른다
  const habit = b.arena ? arenaIntent(b.arena, b.turn, b.hp < m.hp / 2) : null;
  // 지어지지 않은 종은 다섯 턴마다 큰 공격을 한다. 그 사이는 틈이다 (CM-D5)
  const move = (habit && m.moves.find((x) => x.id === habit)) || (m.build ? m.moves.find((x) => x.id === bellIntent(b)) : weighted(state, m.moves));
  if (b.arena) { if (move.id === 'breath' && b.hp < m.hp / 2) b.arena.rested = true; b.arena.last = move.id; }
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
  let attack = Math.round(val(state, 'attack') * temperMult(state, b)) + (opt.plus || 0); // plus: 되받아치기·빈틈·모으기에 실리는 것. 벼림 하나마다 공격력 +4% (CM-B3)
  // 힘이 아닌 것으로 치는 스킬: 공격력에서 힘을 빼고 그 스탯을 넣는다. 지혜는 무기에 기대지 않는다.
  const stat = opt.stat === 'best' ? ['str', 'agi', 'wis'].reduce((a, k) => (state.stats[k] > state.stats[a] ? k : a), 'str') : opt.stat;
  // 직업 무기를 든 사람은 기본 공격이 이미 제 스탯이다 (SB-G1). 스킬은 그 자리에 제 스탯을 넣는다
  const base = attackStat(state);
  if ((stat === 'agi' || stat === 'str') && stat !== base) attack = attack - state.stats[base] + state.stats[stat];
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
  // 맞바람 (GD-B3): 활로 넣는 피해가 30% 깎인다
  const bowCut = windIs(state, 'head') && usable(state.equip.weapon) && itemDef(state.equip.weapon.id).job === 'archer';
  if (bowCut) dmg = Math.max(1, Math.round(dmg * (1 - CLOUD.bowCut)));
  if (isRead(state, b)) dmg = Math.max(1, Math.round(dmg * (1 - POND.cut))); // 읽혔다 (BM-B3): 내 공격의 피해 −25%
  b.hp = Math.max(0, b.hp - dmg);
  if (verb !== false) pushLine(state, events, { k: 'me', text: `${verb === '' ? '' : `${verb || '내리쳤다.'} `}${crit ? '급소에 맞았다. ' : ''}${em > 1 ? '약점을 찔렀다. ' : em < 1 ? '잘 듣지 않는다. ' : ''}${bowCut ? '맞바람에 화살이 밀린다. ' : ''}${dmg} 피해.` });
  // 뒷바람 (GD-B1, GD-B3): 내 공격이 20%로 한 번 더 들어간다. 절반의 피해다
  if (b.hp > 0 && windIs(state, 'tail') && chance(state, CLOUD.again)) {
    const more = Math.max(1, Math.round(dmg * CLOUD.againDmg));
    b.hp = Math.max(0, b.hp - more);
    pushLine(state, events, { k: 'sys', text: `${CLOUD_LINES.again} ${more} 피해.`, tone: 'mint' });
  }

  const weapon = state.equip.weapon;
  if (usable(weapon)) {
    // 잿골의 들판에서는 쇠가 두 배로 닳는다 (AG-B3)
    if (wear(state, events, weapon, 'weapon')) pushLine(state, events, { k: 'sys', text: `${iGa(itemDef(weapon.id).name)} 못 쓰게 되었다. 대장간에서 고쳐야 한다.` });
  }
  const skill = state.skills.strike || (state.skills.strike = emptySkill());
  const up = useSkill(skill, m.level * 2, jobXp(state, 'strike', (b.streak || 0) > 0));
  tally(state, b, 'strike', up);
  b.streak = (b.streak || 0) + 1;
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.strike} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (b.hp <= 0) win(state, events);
  return dmg;
}

function hurt(state, events, dmg) {
  state.hp = Math.max(0, state.hp - dmg);
  const armor = state.equip.body;
  if (usable(armor)) wear(state, events, armor, 'body');
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
  return odds(0.5 + (state.stats.agi - m.agi) * 0.03 + (state.skills.evade?.grade || 0) * 0.01 + (state.flags.dodge10 ? 0.1 : 0) - (windIs(state, 'head') ? CLOUD.dodgeCut : 0)); // 맞바람에는 몸이 덜 빠진다 (GD-B3)
}

/** 태세로 한 턴을 버텼다. 그 숙련도가 오른다. 센 적일수록 많이 오른다. */
function stanceUp(state, events, id, m) {
  const skill = state.skills[id] || (state.skills[id] = emptySkill());
  state.counters.act[id] = (state.counters.act[id] || 0) + 1;
  const up = useSkill(skill, m.level * 2, jobXp(state, id, false));
  tally(state, state.battle, id, up);
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
  tally(state, state.battle, 'guard', up);
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
  if (state.battle !== b) return; // 쓰러뜨렸다(짝이 이어 덤볐어도 이 턴은 여기까지다)
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
  // 맞바람 (GD-B3): 적의 큰 공격이 한 턴 늦게 온다. 늦은 것은 다음 턴에 그대로 온다
  if (move.kind === 'charge') {
    if (b.late === 'due') b.late = null;
    else if (windIs(state, 'head')) { b.late = 'hold'; pushLine(state, events, { k: 'room', text: CLOUD_LINES.late }); return; }
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
  const shield = state.party.length && !b.arena ? guardFor(state) : null; // 겨루기는 일대일이다
  if (shield) { if (clashWon) b.clashHit = true; hitCompanion(state, events, shield, dmg); return; }
  if (curseOf(state) > 0) dmg = Math.max(1, Math.round(dmg * curseMult(state))); // 저주 한 겹마다 받는 피해 +5% (AN-B3)
  if (isRead(state, b)) dmg = Math.max(1, Math.round(dmg * (1 + POND.hurt))); // 읽혔다 (BM-B3): 내가 맞는 피해 +25%
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
  // 식는다 (CM-B3, CM-D5): 큰 공격을 막지 못하고 맞으면 벼림이 절반이 되고, 모루 위에서는 종이 다섯 줄어든다
  if (move.kind === 'charge' && !defended && !guard?.cut && !clashWon && state.hp > 0) cooled(state, events, b);
  // 옆바람 (GD-B2, GD-B3): 큰 공격을 막지 못하고 맞으면 밀려나 다음 턴을 잃는다. 다리를 다 고친 벼랑길에서는 밀려나지 않는다 (GD-E6)
  if (move.kind === 'charge' && !defended && !guard?.cut && !clashWon && state.hp > 0 && windIs(state, 'side')) {
    if (state.place === 'cliffroad' && state.flags.planksFixed) pushLine(state, events, { k: 'sys', text: CLOUD_LINES.held, tone: 'mint' });
    else { b.pushed = true; pushLine(state, events, { k: 'sys', text: pushedLine(state, m.name), tone: 'frost' }); }
  }
  if (move.steal && !defended && state.silver > 0) { const lost = Math.max(1, Math.floor(state.silver * move.steal)); state.silver -= lost; pushLine(state, events, { k: 'sys', tone: 'warn', text: `주머니가 가벼워졌다. 은화 −${lost}.` }); } // 도적의 주머니 털기 (Z90)
  if (state.hp <= 0) return;
  curseHit(state, events, b.mon); // 안개늪의 몬스터에게 맞으면 20%로 저주가 한 겹 앉는다 (AN-B3)
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

  bellRound(state, events, b, mdef(b).hp); // 깨진 껍질은 열 턴 뒤 다시 굳는다 (CM-D3)
  if (b.mirror) Object.assign(b.mirror, mirrorOf(state)); // 거울상은 지금의 나를 비춘다: 싸우다 바꿔 쥐면 저쪽도 바뀐다
  state.battle.turn += 1;
  // 맞바람에 늦은 큰 공격 (GD-B3): 새로 고르지 않고 그대로 다시 온다
  if (b.late === 'hold') { b.late = 'due'; const move = intentOf(state); pushLine(state, events, { k: 'intent', text: move.tell, next: move.name, hint: '큰 피해. 방어하면 막고 반격합니다.' }); return; }
  chooseIntent(state, events);
}

/** 겨루기가 끝났다 (AG-C2): 죽지 않는다. 져도 쓰러지지 않고, 잃는 것이 없다. 이긴 값과 진 값은 마당의 규칙(core/arena.js)이 매긴다. */
function arenaEnd(state, events, won) {
  const b = state.battle;
  state.battle = null;
  state.status = [];
  if (!won) state.hp = Math.max(state.hp, Math.ceil(val(state, 'maxHp') * 0.3));
  events.push({ type: 'battle', phase: won ? 'win' : 'lose', mon: null, arena: { foe: b.arena.foe, name: b.arena.name, level: b.arena.level, won } });
}

/** 종을 다 지었다 (CM-D2): 쓰러뜨린 것이 아니라 끝까지 지은 것이다. 싸움은 여기서 끝난다. */
function built(state, events) {
  const b = state.battle, m = mdef(b);
  keptEdge(state, events, b);
  const got = [`경험치 ${m.xp}`];
  for (const d of m.drops) { if (!chance(state, d.p)) continue; addItem(state, d.id, 1); got.push(`${itemDef(d.id).name} 1`); }
  state.dex.mon[b.mon] = { ...(state.dex.mon[b.mon] || { seen: 0, lost: 0 }), won: (state.dex.mon[b.mon]?.won || 0) + 1 };
  state.battle = null;
  state.status = [];
  state.calm = 2;
  afterBattle(state, events, true);
  bellBuilt(state, events);
  pushLine(state, events, { k: 'sys', text: `얻은 것: ${got.join(', ')}.` });
  grantXp(state, events, Math.round(m.xp * (1 + guildPerk(state, 'fight'))));
  events.push({ type: 'battle', phase: 'win', mon: b.mon, built: true });
}

function win(state, events) {
  const b = state.battle;
  if (b.arena) return arenaEnd(state, events, true);
  // 지어지지 않은 종은 생명력이 0이 되어도 쓰러지지 않는다 (CM-D2): 껍질이 깨질 뿐이다
  if (building(b) && b.bell < ANVIL.bell) return shellBroke(state, events, b);
  keptEdge(state, events, b); // 벼림 열둘로 이긴 싸움 (CM-B3)
  const pair = pairComes(state, b); // 잠긴 도성의 것들은 둘씩 다닌다 (JD-B3)
  // 한 번도 읽히지 않고 이긴 싸움은 숙련도가 20% 더 오른다 (BM-B3)
  if (mirrored(state) && !b.wasRead && b.gain) {
    pushLine(state, events, { k: 'sys', text: `${READ_LINES.clean} (숙련도 +${Math.round(POND.clean * 100)}%)`, tone: 'mint' });
    for (const [id, got] of Object.entries(b.gain)) {
      const up = addSkillXp(state.skills[id] || (state.skills[id] = emptySkill()), got * POND.clean);
      if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[id]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
    }
    events.push({ type: 'unread' });
  }
  const m = mdef(b);
  const before = state.level;
  pushLine(state, events, { k: 'room', text: `${iGa(m.name)} 쓰러졌다.` });
  const got = [`경험치 ${m.xp}`];
  for (const d of m.drops) {
    if (!chance(state, d.p)) continue;
    addItem(state, d.id, 1);
    got.push(`${itemDef(d.id).name} 1`);
  }
  if (b.person) got.push(...duelSpoils(state, events, m));
  if (b.bandit) got.push(...banditSpoils(state, events, m));
  pushLine(state, events, { k: 'sys', text: `얻은 것: ${got.join(', ')}.` });
  if (b.person) {
    // 보는 사람이 없으니 소문은 나지 않는다. 대신 이틀 동안 그 얼굴이 떠오른다 (Z72)
    giveMurder(state);
    pushLine(state, events, { k: 'sys', tone: 'warn', text: `본 사람은 없다. 소문은 나지 않을 것이다. ${MURDER.name}: ${MURDER.text}. ${MURDER.days}일 동안.` });
  }
  if (b.elite) {
    dropGear(state, events);
    ding(state, events, { level: 2, title: `${eulReul(m.name)} 쓰러뜨렸습니다`, body: '많이 잡아 본 사냥감 가운데 드물게 나오는 놈입니다. 장비를 떨어뜨립니다.' });
  }
  const maxHp = val(state, 'maxHp');
  if (state.hp <= maxHp * 0.1) state.counters.nearDeath += 1;
  if (m.level >= before + 5) state.counters.bigWins += 1;
  if (!b.person && !b.bandit) state.dex.mon[b.mon] = { ...(state.dex.mon[b.mon] || { seen: 0, lost: 0 }), won: (state.dex.mon[b.mon]?.won || 0) + 1, ...(b.elite ? { elite: true } : {}) }; // elite: 이름난 놈을 잡아 본 사냥감 (CM-E)
  state.battle = null;
  state.status = [];
  state.calm = 2;
  state.tension[state.place] = 0;
  afterBattle(state, events, true);
  grantXp(state, events, Math.round(m.xp * (1 + guildPerk(state, 'fight'))));
  events.push({ type: 'battle', phase: 'win', mon: b.person || b.bandit ? null : b.mon, person: b.person || null, elite: !!b.elite }); // 모험가는 사냥 의뢰에 세지 않는다 (Z72)
  // 하나를 쓰러뜨리면 짝이 곧바로 덤빈다 (JD-B1, JD-G1): 연달아 두 판. 사이에 쉬거나 먹을 수 없다. 막는 이가 있으면 둘째는 생명력 절반
  if (pair && state.hp > 0) {
    const g = holder(state);
    pushLine(state, events, { k: 'sys', text: SUNKEN_LINES.pair, tone: 'frost' });
    startBattle(state, events, b.mon, { second: true, half: !!g });
    if (g) { const d = COMPANIONS[g.id]; pushLine(state, events, { k: 'sys', text: `${iGa(d.name)} ${d.way === 'merc' ? '방패로 ' : ''}둘째를 막아섰다. 둘째는 생명력 절반으로 덤빈다.`, tone: 'mint' }); }
  }
}

/** 쓰러뜨린 모험가가 가진 것 (Z72): 장비 한두 점과 은화(상대 레벨 × 20~40). */
function duelSpoils(state, events, m) {
  const n = (state.counters.duels = (state.counters.duels || 0) + 1);
  const silver = Math.round(m.level * (DUEL.silver[0] + roll01(`${state.seed}|duelsilver|${n}`) * (DUEL.silver[1] - DUEL.silver[0])));
  state.silver += silver;
  const gears = DUEL.gear[0] + Math.floor(roll01(`${state.seed}|duelgear|${n}`) * (DUEL.gear[1] - DUEL.gear[0] + 1));
  pushLine(state, events, { k: 'room', text: '쓰러진 모험가의 짐을 풀었다.' });
  for (let i = 0; i < gears; i++) dropGear(state, events);
  ding(state, events, { level: 3, title: `${eulReul(m.name)} 쓰러뜨렸습니다`, body: `빼앗은 것: 은화 ${silver}, 장비 ${gears}점.` });
  return [`은화 ${silver}`, `장비 ${gears}점`];
}

/** 쓰러뜨린 도적이 모아 둔 것 (Z90): 은화(도적 레벨 × 40~80)와 장비 하나. 살인의 추억은 없다(먼저 덮친 쪽이 도적이다). */
function banditSpoils(state, events, m) {
  const n = (state.counters.bandits = (state.counters.bandits || 0) + 1);
  const silver = Math.round(m.level * (BANDIT.silver[0] + roll01(`${state.seed}|banditsilver|${n}`) * (BANDIT.silver[1] - BANDIT.silver[0])));
  state.silver += silver;
  pushLine(state, events, { k: 'room', text: '쓰러진 도적의 자루를 뒤졌다. 남에게서 빼앗은 것들이다.' });
  dropGear(state, events);
  ding(state, events, { level: 3, title: `${eulReul(m.name)} 쓰러뜨렸습니다`, body: `빼앗은 것: 은화 ${silver}, 장비 1점.` });
  return [`은화 ${silver}`, '장비 1점'];
}

/** 사람을 치고 달아난 소문 (Z72): 살아남은 모험가가 떠들고 다닌다. 그 근처 마을 명성이 깎인다. */
function duelRumor(state, events, did) {
  addFame(state, events, -DUEL.fame);
  state.flags.hitRun = { place: state.place, day: state.day };
  pushLine(state, events, { k: 'sys', tone: 'warn', text: `모험가를 ${did} 일이 퍼질 것이다. 이 근처 마을 명성 −${DUEL.fame}.` });
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
  leftBell(state, b); // 다시 오르면 채운 것의 절반에서 (CM-D5)
  if (b?.arena) return arenaEnd(state, events, false);
  const m = b ? mdef(b) : null;
  if (b?.bandit) {
    const took = Math.floor((state.silver || 0) * BANDIT.lose);
    if (took > 0) { state.silver -= took; pushLine(state, events, { k: 'sys', tone: 'warn', text: `도적이 쓰러진 몸에서 은화 ${took}을 털어 갔다.` }); }
  }
  if (b && !b.person && !b.bandit) state.dex.mon[b.mon] = { ...(state.dex.mon[b.mon] || { seen: 0, won: 0 }), lost: (state.dex.mon[b.mon]?.lost || 0) + 1 };
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
  if (!['attack', 'defend', 'flee', 'item', 'swap', 'skill', 'stance', 'hammer'].includes(choice)) throw new Error('모르는 전투 행동: ' + choice);
  // 망치질 (CM-B1): 처음 모루의 싸움에서만 된다. 한 턴을 쓴다
  if (choice === 'hammer' && !forged(state)) throw new Error('여기서는 벼릴 수 없습니다');
  // 태세 바꾸기 (BM-B2, BM-B3): 별못의 싸움에서만 된다. 한 턴을 쓴다. 다른 데서는 지금처럼 싸우는 중에 바꾸지 못한다
  if (choice === 'stance') {
    if (!mirrored(state)) throw new Error('싸우는 중에는 태세를 바꿀 수 없습니다');
    if (!STANCES[arg]) throw new Error('모르는 태세입니다');
    if (arg === stanceOf(state).id) throw new Error('이미 그 태세입니다');
  }
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
  // 옆바람에 밀려났으면 이 턴은 아무것도 하지 못한다 (GD-B3)
  const pushed = !!b.pushed;
  if (pushed) b.pushed = false;
  const stunned = hasStatus(state, 'stun') || pushed;
  // 거울 (BM-B3): 직전과 같은 행동이면 읽힘 +20, 다른 행동이면 −30. 읽히지 않는 곳에서는 null이다
  let rd = choice === 'stance' ? null : readStep(state, b, readKey(choice, arg));
  const stance = choice === 'defend' && !stunned ? stanceOf(state).id : null;
  const defended = stance === 'hold';

  if (choice === 'flee' && !stunned) {
    if (chance(state, fleeChance(state))) {
      if (b.arena) { pushLine(state, events, { k: 'me', text: '등을 돌려 마당 밖으로 물러났다. 물러난 쪽이 진 것이다.' }); return arenaEnd(state, events, false); }
      pushLine(state, events, { k: 'me', text: building(b) ? '망치를 내려놓고 물러났다. 지은 것이 모루 위에서 식어 간다.' : '등을 돌려 달아났다.' });
      if (b.person) duelRumor(state, events, '치고 달아난');
      leftBell(state, b);
      state.battle = null;
      state.status = [];
      state.calm = 2;
      afterBattle(state, events, false);
      if (!building(b)) cross(state, events, 'flee'); // 모루에서 내려오는 것은 달아난 것이 아니다
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
    if (b.arena) { pushLine(state, events, { k: 'me', text: `${sk.say} 그 틈에 마당 밖으로 물러났다. 물러난 쪽이 진 것이다.` }); return arenaEnd(state, events, false); }
    pushLine(state, events, { k: 'me', text: `${sk.say} 그 틈에 달아났다.` });
    leftBell(state, b);
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
      for (let i = 0; i < (sk.hits || 1) && state.battle === b; i++) hitEnemy(state, events, power, '', { stat: sk.stat, pierce: sk.pierce, crit: sk.crit, element: sk.element, plus });
    }
    if (state.battle !== b) return;
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
    if (stunned) { pushLine(state, events, { k: 'sys', text: pushed ? CLOUD_LINES.lost : '몸이 굳어 움직일 수 없다.' }); return; }
    if (sk) return cast();
    if (choice === 'attack') hitEnemy(state, events, 1, building(b) && b.hp > 0 ? ANVIL_LINES.crack : usable(state.equip.weapon) ? '내리쳤다.' : '맨주먹을 휘둘렀다.'); // 모루 위에서는 껍질을 친다 (CM-D1)
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
    else if (choice === 'hammer') {
      hammerInBattle(state, events, b);
      if (building(b) && b.bell >= ANVIL.bell) built(state, events); // 종이 다 지어졌다 (CM-D2)
    }
    else if (choice === 'stance') {
      state.stance = arg;
      pushLine(state, events, { k: 'me', text: READ_LINES.stance(STANCES[arg].name) });
      rd = readReset(state, b);
      events.push({ type: 'stance' });
    }
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
    if (state.battle !== b || !state.party.length || b.arena) return; // 겨루기는 일대일이다: 동료는 둘레에서 본다
    const strike = (attack, name) => {
      if (state.battle !== b) return; // 쓰러뜨린 뒤다(짝의 둘째는 다음 턴부터 친다)
      const dmg = damage(state, Math.round(attack * (adv(state).friend || 1) * (1 + (drumBuff(state)?.rate || 0))), 1, m.defense); // 북소리는 일행 모두의 공격력에 실린다 (GD-C0)
      b.hp = Math.max(0, b.hp - dmg);
      pushLine(state, events, { k: 'room', text: `${iGa(name)} 쳤다. ${dmg} 피해.` });
      if (b.hp <= 0) win(state, events);
    };
    companionsAct(state, events, strike, val(state, 'maxHp'), { hp: b.hp, maxHp: m.hp });
  };
  // 읽힘의 한 줄 (BM-B1, BM-B2): 내 차례 바로 뒤에 적힌다. 처음 읽혔을 때는 한 줄로 알린다 (BM-G2)
  let told = false;
  const readSay = () => {
    if (told || !rd || state.battle !== b) return;
    told = true;
    const name = mdef(b).name;
    if (rd.now > POND.at && rd.same >= 2) pushLine(state, events, { k: 'sys', text: READ_LINES.same(rd.same, name), tone: 'frost' });
    if (rd.now > POND.at && !state.flags.sawRead) { state.flags.sawRead = true; pushLine(state, events, { k: 'sys', text: READ_LINES.first, tone: 'warn' }); }
    if (rd.now <= POND.at && rd.was > POND.at) pushLine(state, events, { k: 'sys', text: READ_LINES.lost(name), tone: 'mint' });
    else if (choice === 'stance' && rd.was > 0) pushLine(state, events, { k: 'sys', text: READ_LINES.lost(name), tone: 'mint' });
  };
  // 태세는 턴이 시작될 때 잡는다. 적이 더 빨라도 "채비했다"가 먼저 적히고, 모은 것도 맞기 전에 쌓인다
  let prepared = false;
  if (stance) { mine(); prepared = true; readSay(); }
  // 짝 (JD-B3): 첫째가 쓰러진 그 턴은 거기서 끝난다. 둘째는 제 싸움의 첫 턴부터 움직인다
  const on = () => state.battle === b;
  if (state.stats.agi >= m.agi) {
    if (!prepared) mine();
    readSay();
    friends();
    if (on()) enemyAct(state, events, defended, guard, stance);
  } else {
    enemyAct(state, events, defended, guard, stance);
    if (state.hp > 0 && on()) { if (!prepared) mine(); readSay(); friends(); }
  }
  if (on() && b.clashHit) {
    b.clashHit = false;
    if (state.hp > 0) hitEnemy(state, events, 1, '꺾인 틈으로 내리쳤다.', { pierce: true, plus: skillBonus(state.skills.smash) });
  }
  if (state.hp <= 0) return lose(state, events);
  if (on()) endRound(state, events);
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
    const blown = windIs(state, 'head'); // 맞바람 (GD-B3): 던지는 물건의 피해가 30% 깎인다
    const dmg = Math.max(1, Math.round(t.dmg * em * (blown ? 1 - CLOUD.bowCut : 1)));
    if (em !== 1) { const seen = state.dex.mon[b.mon] || (state.dex.mon[b.mon] = { seen: 0, won: 0, lost: 0 }); seen.elems = seen.elems || {}; seen.elems[`${t.element}>${m.element}`] = em; }
    b.hp = Math.max(0, b.hp - dmg);
    pushLine(state, events, { k: 'me', text: `${eulReul(name)} 던졌다. ${blown ? '맞바람에 밀린다. ' : ''}${em > 1 ? '약점을 찔렀다. ' : em < 1 ? '잘 듣지 않는다. ' : ''}${t.element} 속성으로 ${dmg} 피해.` });
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
  const cut = healCut(state); // 깊은 저주(다섯 겹): 음식과 물약으로 차는 생명력이 절반 (AN-B3)
  if (def.eat?.hpPct) return Math.round(max * def.eat.hpPct / 100 * more * cut);
  if (def.eat?.hp) return Math.round(def.eat.hp * more * cut);
  if (def.eat?.full) return Math.round(def.eat.full * FOOD_HEAL * more * cut);
  return 0;
}

/** 먹거나 마신다. 전투 밖에서도 쓴다. */
export function eat(state, events, index) {
  const item = state.bag[index];
  const grade = item?.grade || 0;
  if (!item) throw new Error('가방에 없는 물건입니다');
  const def = itemDef(item.id);
  if (def.throw) throw new Error('싸움에서 쓰는 물건입니다');
  if (!def.eat) throw new Error('먹을 수 없는 물건입니다');
  if (def.eat.air) useAir(state, 0); // 물 위에서는 쓰지 못한다(없어지기 전에 막는다)
  removeAt(state, index, 1);
  const parts = [];
  const more = state.flags.foodPlus ? 1.2 : 1;
  if (def.eat.full) { const got = Math.round(def.eat.full * more); state.full = Math.min(100, state.full + got); parts.push(`포만감 +${got}`); }
  // 생명력: 물약은 최대 생명력의 비율, 약초·음식은 정해진 양 (Z54)
  if (def.eat.dish) { const had = applyDish(state, events, def.eat.dish, grade); const db = DISHES[def.eat.dish].buff; parts.push(`'${db.name}': ${db.text}${had ? ` (먼저 붙어 있던 '${had.name}'는 사라졌다)` : ''}`); } // 공용주방의 음식 (Z83)
  if (def.eat.warm) { const got = warmUp(state, def.eat.warm); if (got > 0) parts.push(`체온 +${got}`); } // 뜨거운 음식 (WM-B3). 흰마루 밖에서는 아무 말도 없다
  if (def.eat.salty) { const lost = loseWater(state, events, def.eat.salty); if (lost > 0) parts.push(`물 −${lost} 모금`); } // 짠 음식 (SB-B3). 소금벌 밖에서는 아무 말도 없다
  if (def.eat.shadow && (state.shadow || 0) > 0) { state.shadow = 0; state.shadowPray = 0; parts.push('죽음의 그림자가 모두 걷혔다'); events.push({ type: 'shadow', n: 0 }); } // 성수 (Z92)
  if (def.eat.shadow && liftCurse(state, events)) parts.push('저주가 모두 걷혔다'); // 성수 한 병에 모두 (AN-B3)
  if (def.eat.air) parts.push(`숨 +${useAir(state, def.eat.air)}`); // 공기 주머니 (JD-B3): 물 아래에서만. 싸우는 중에도 쓴다
  if (def.eat.grace) { const g = giveGrace(state, typeof def.eat.grace === 'number' ? def.eat.grace : undefined); parts.push(`${g.name}: ${g.text}, 두 때 동안`); } // 성수 (Z77)
  { const max = val(state, 'maxHp'); const heal = healOf(state, def, max); if (heal) { const before = state.hp; state.hp = Math.min(max, state.hp + heal); if (state.hp > before || !def.eat.full) parts.push(`생명력 +${state.hp - before}`); } }
  pushLine(state, events, { k: 'me', text: `${eulReul(def.name)} ${def.eat.air ? '물었다' : def.eat.full ? '먹었다' : def.kind === 'material' ? '씹어 상처에 붙였다' : '마셨다'}. ${parts.join(', ')}.` });
}
