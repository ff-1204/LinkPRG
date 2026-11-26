// 쓰러짐과 부활 (E29~E32, R2-4).
// 돈 10%와 가방 속 재료 절반을 두고 온다. 유품은 그 자리에 하루 남는다.
// 레벨, 숙련도, 찬 장비는 잃지 않는다. 죽음의 그림자가 한 겹 쌓인다 (Z31).

import { pushLine, ding } from './log.js?v=bde8e2e';
import { itemDef } from '../data/items.js?v=bde8e2e';
import { addItem } from './inventory.js?v=bde8e2e';
import { derived } from './derived.js?v=bde8e2e';
import { roll01 } from './rng.js?v=bde8e2e';

/** 쓰러지면 운이 정한다 (Z32): 넷에 하나 꼴이 아니라 다섯에 하나 꼴로 다시 태어난다. 나머지는 신전에서 눈을 뜬다. */
export const REBIRTH_FATE = 0.20;

export const TEMPLE = 'temple';

/** (day, phase)가 until을 지났는지. */
export function passed(state, until) {
  return state.day > until.day || (state.day === until.day && state.phase >= until.phase);
}

// ── 죽음의 그림자 (Z31) ──
export const SHADOW_MAX = 6; // 그 너머는 환생을 고르게 되는 선
export const SHADOW_RATE = 0.05; // 한 겹에 공격력·방어력 −5%
export const SHADOW_PRAY = 30; // 기도 이만큼에 한 겹이 걷힌다
export const BLESS_FEE = 5; // 축복 값: 겹 × 레벨 × 이만큼
export const BLESSERS = ['priest', 'shrinekeeper', 'highpriest'];

/** 한 겹을 걷는 데 드는 기도 수. 묘지기는 20번, 신앙이 있으면 조금 더 짧다. */
export function prayNeed(state) {
  const base = state.flags?.weakFast ? 20 : SHADOW_PRAY;
  return Math.max(10, base - (state.hidden?.faith?.value || 0) * 2);
}
export function blessFee(state) {
  return (state.shadow || 0) * state.level * BLESS_FEE;
}
export function shadowView(state) {
  const n = state.shadow || 0;
  return { n, max: SHADOW_MAX, cut: Math.round(n * SHADOW_RATE * 100), fee: blessFee(state), pray: state.shadowPray || 0, need: prayNeed(state) };
}

/** 곳마다 축복을 내리는 사람 (Z43). */
export const BLESS_AT = { temple: 'priest', shrine: 'shrinekeeper', grandtemple: 'highpriest' };
export const GRACE_FEE = 5; // 가호 값: 레벨 × 이만큼
export function graceFee(state) {
  return Math.max(GRACE_FEE, state.level * GRACE_FEE);
}
/** 축복받기 칸 (Z43): 그림자가 있으면 걷어 내고, 없으면 신의 가호를 받는다. */
export function blessingHere(state, events, giveGrace) {
  const npc = BLESS_AT[state.place];
  if (!npc) throw new Error('여기서는 축복을 받을 수 없습니다');
  if ((state.shadow || 0) > 0) return bless(state, events, npc);
  const fee = graceFee(state);
  if (state.silver < fee) throw new Error(`은화가 모자랍니다 (${fee} 필요)`);
  state.silver -= fee;
  const g = giveGrace(state);
  pushLine(state, events, { k: 'me', text: `은화 ${fee}을 바쳤다. 이마에 물 한 방울이 떨어졌다.` });
  pushLine(state, events, { k: 'sys', tone: 'mint', text: `${g.name}: ${g.text}. ${g.until.phase === 2 ? '밤이 되기 전까지' : g.until.phase === 0 ? '다음 날 아침까지' : '다음 날 낮까지'}.` });
}

/** 신전에서 돈을 바치고 축복을 받는다. 그림자가 모두 걷힌다. */
export function bless(state, events, npc) {
  if (!BLESSERS.includes(npc)) throw new Error('축복을 내릴 사람이 아닙니다');

  const n = state.shadow || 0;
  if (n <= 0) throw new Error('걷어 낼 그림자가 없습니다');
  const fee = blessFee(state);
  if (state.silver < fee) throw new Error(`은화가 모자랍니다 (${fee} 필요)`);
  state.silver -= fee;
  state.shadow = 0;
  state.shadowPray = 0;
  pushLine(state, events, { k: 'me', text: `은화 ${fee}을 바쳤다. 머리 위로 손이 얹혔다.` });
  pushLine(state, events, { k: 'sys', text: '죽음의 그림자가 모두 걷혔다.', tone: 'good' });
  events.push({ type: 'shadow', n: 0 });
}

/** 기도를 한 번 했다. 그림자가 있으면 한 겹을 향해 쌓인다. */
export function prayShadow(state, events) {
  if (!(state.shadow > 0)) return;
  state.shadowPray = (state.shadowPray || 0) + 1;
  if (state.shadowPray < prayNeed(state)) return;
  state.shadowPray = 0;
  state.shadow -= 1;
  pushLine(state, events, { k: 'sys', text: state.shadow ? `그림자 한 겹이 걷혔다. 남은 그림자 ${state.shadow}겹.` : '마지막 그림자가 걷혔다. 몸이 가볍다.', tone: 'good' });
  events.push({ type: 'shadow', n: state.shadow });
}

/** 쓰러졌다. 상태를 고치고, 화면이 창을 띄울 수 있게 일을 남긴다. */
export const TOUGH_RATE = 0.01; // 지금 스탯의 1%
export const TOUGH_DEALT = 0.3; // 적 생명력을 이만큼은 깎았어야 한다
const STAT_KO = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };

/**
 * 센 놈에게 덤볐다 쓰러지면 몸이 단단해진다 (Z30). 나보다 레벨이 같거나 높은 적의 생명력을 30% 넘게 깎았을 때, 하루 한 번.
 * 지금 스탯의 1%를 스탯마다 쌓아 두고, 1이 차면 그 스탯이 오른다.
 */
function toughen(state, events, fight) {
  if (!fight || fight.foeLevel < state.level || fight.dealt < TOUGH_DEALT || state.flags.toughDay === state.day) return null;
  state.flags.toughDay = state.day;
  if (!state.tough) state.tough = { str: 0, agi: 0, con: 0, wis: 0 };
  const gained = {}, raised = [];
  for (const k of Object.keys(STAT_KO)) {
    const g = Math.round(state.stats[k] * TOUGH_RATE * 100) / 100;
    gained[k] = g;
    state.tough[k] = Math.round(((state.tough[k] || 0) + g) * 100) / 100;
    if (!state.toughGained) state.toughGained = { str: 0, agi: 0, con: 0, wis: 0 };
    while (state.tough[k] >= 1) { state.tough[k] = Math.round((state.tough[k] - 1) * 100) / 100; state.stats[k] += 1; state.toughGained[k] = (state.toughGained[k] || 0) + 1; raised.push(k); }
  }
  return { gained, acc: { ...state.tough }, raised };
}

export function fall(state, events, cause = '', fight = null) {
  const tough = toughen(state, events, fight);
  const where = state.place;
  const first = state.falls === 0;
  state.falls += 1;

  const silver = Math.floor(state.silver * (state.flags.halfDrop ? 0.05 : 0.10));
  state.silver -= silver;
  const items = [];
  for (let i = state.bag.length - 1; i >= 0; i--) {
    const item = state.bag[i];
    if (itemDef(item.id).kind !== 'material') continue;
    const lose = Math.floor(item.n / 2);
    if (lose < 1) continue;
    items.push({ id: item.id, grade: item.grade, n: lose });
    item.n -= lose;
  }
  const until = { day: state.day + 1, phase: state.phase };
  const old = state.relic;
  const fresh = silver > 0 || items.length ? { place: where, until, silver, items } : null;
  // 새로 둘 것이 없으면 먼저 두고 온 것은 그대로 남는다. 있으면 먼저 것은 잃는다.
  const lostOld = !!(old && fresh);
  state.relic = fresh || old;

  state.battle = null;
  state.choice = null;
  state.status = [];
  state.lastAction = null;
  state.place = TEMPLE;
  const shadowFrom = state.shadow || 0;
  state.shadow = Math.min(SHADOW_MAX, shadowFrom + 1);
  const maxHp = derived(state).find((d) => d.id === 'maxHp').value;
  state.hp = Math.max(1, Math.ceil(maxHp * 0.3));

  pushLine(state, events, { k: 'sys', text: '쓰러졌다.', tone: 'dark' });
  pushLine(state, events, { k: 'npc', who: '신전지기', text: '눈을 떴군. 쓰러진 걸 지나던 사람이 업어 왔네.' });
  if (lostOld) pushLine(state, events, { k: 'sys', text: '먼저 두고 온 것은 이제 찾을 수 없다.', tone: 'warn' });
  if (tough) {
    pushLine(state, events, { k: 'me', text: '몸을 일으켰다. 버거운 놈에게 덤볐던 몸이 조금 단단해졌다.' });
    for (const k of tough.raised) ding(state, events, { level: 2, title: `다시 일어선 몸: ${STAT_KO[k]} +1`, body: '센 놈에게 덤볐다 쓰러진 날들이 쌓였습니다.' });
  }
  state.journal.push({
    day: state.day, phase: state.phase, place: TEMPLE,
    text: cause ? `욕심을 냈다. ${cause} 눈을 뜨니 신전이었다.` : '욕심을 냈다. 눈을 뜨니 신전이었다.',
    note: first ? '처음 쓰러진 날' : null,
  });
  // 운명: 신전에서 눈을 뜨는가, 다시 태어나는가. 다시 태어나야 하면 저장을 다시 불러와도 피할 수 없다
  const fate = roll01(`${state.seed}|fate|${state.falls}|${state.day}|${state.phase}|${state.tick}`) < REBIRTH_FATE ? 'rebirth' : 'temple';
  if (fate === 'rebirth') state.flags.mustRebirth = true;
  const info = {
    fate,
    silver, items: items.map((x) => ({ name: itemDef(x.id).name, n: x.n })),
    relicPlace: fresh ? where : null, lostOld, keptOld: !fresh && old ? old.place : null, nearDeath: state.counters.nearDeath, half: !!state.flags.halfDrop, tough,
    shadow: { from: shadowFrom, to: state.shadow, cut: Math.round(state.shadow * SHADOW_RATE * 100), max: SHADOW_MAX },
  };
  events.push({ type: 'fall', info });
  events.push({ type: 'move', to: TEMPLE });
  return info;
}

/** 유품을 찾는다. 쓰러진 그 자리에서만 된다. */
export function recoverRelic(state, events) {
  const relic = state.relic;
  if (!relic || relic.place !== state.place) throw new Error('여기에는 유품이 없습니다');
  state.silver += relic.silver;
  for (const x of relic.items) addItem(state, x.id, x.n, { grade: x.grade });
  state.relic = null;
  const parts = [];
  if (relic.silver) parts.push(`은화 ${relic.silver}`);
  for (const x of relic.items) parts.push(`${itemDef(x.id).name} ${x.n}`);
  pushLine(state, events, { k: 'me', text: `두고 갔던 것을 찾았다. ${parts.join(', ')}.` });
}

/** 때가 바뀔 때 부른다. 하루가 지난 유품은 사라진다. */
export function tickFall(state, events) {
  if (state.relic && passed(state, state.relic.until)) {
    state.relic = null;
    pushLine(state, events, { k: 'sys', text: '두고 온 것은 이제 그 자리에 없을 것이다.' });
  }
}
