// 쓰러짐과 부활 (E29~E32, R2-4).
// 돈 10%와 가방 속 재료 절반을 두고 온다. 유품은 그 자리에 하루 남는다.
// 레벨, 숙련도, 찬 장비는 잃지 않는다. 하루 동안 쇠약.

import { pushLine } from './log.js';
import { itemDef } from '../data/items.js';
import { addItem } from './inventory.js';
import { derived } from './derived.js';

export const TEMPLE = 'temple';

/** (day, phase)가 until을 지났는지. */
export function passed(state, until) {
  return state.day > until.day || (state.day === until.day && state.phase >= until.phase);
}

export function isWeak(state) {
  return !!state.weak && !passed(state, state.weak);
}

/** 쓰러졌다. 상태를 고치고, 화면이 창을 띄울 수 있게 일을 남긴다. */
export function fall(state, events, cause = '') {
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
  state.weak = { ...until };
  const maxHp = derived(state).find((d) => d.id === 'maxHp').value;
  state.hp = Math.max(1, Math.ceil(maxHp * 0.3));

  pushLine(state, events, { k: 'sys', text: '쓰러졌다.', tone: 'dark' });
  pushLine(state, events, { k: 'npc', who: '신전지기', text: '눈을 떴군. 쓰러진 걸 지나던 사람이 업어 왔네.' });
  if (lostOld) pushLine(state, events, { k: 'sys', text: '먼저 두고 온 것은 이제 찾을 수 없다.', tone: 'warn' });
  state.journal.push({
    day: state.day, phase: state.phase, place: TEMPLE,
    text: cause ? `욕심을 냈다. ${cause} 눈을 뜨니 신전이었다.` : '욕심을 냈다. 눈을 뜨니 신전이었다.',
    note: first ? '처음 쓰러진 날' : null,
  });
  const info = {
    silver, items: items.map((x) => ({ name: itemDef(x.id).name, n: x.n })),
    relicPlace: fresh ? where : null, lostOld, keptOld: !fresh && old ? old.place : null, nearDeath: state.counters.nearDeath, half: !!state.flags.halfDrop,
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

/** 때가 바뀔 때 부른다. 하루가 지난 유품은 사라지고 쇠약은 풀린다. */
export function tickFall(state, events) {
  if (state.relic && passed(state, state.relic.until)) {
    state.relic = null;
    pushLine(state, events, { k: 'sys', text: '두고 온 것은 이제 그 자리에 없을 것이다.' });
  }
  if (state.weak && passed(state, state.weak)) {
    state.weak = null;
    pushLine(state, events, { k: 'sys', text: '몸이 제자리로 돌아왔다. 쇠약이 풀렸다.' });
  }
}
