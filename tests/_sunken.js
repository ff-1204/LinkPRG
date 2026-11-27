// 잠긴 도성 테스트 도우미 (M19). 9장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js, 몸 돌보기는 _marsh.js의 것을 쓴다.
import { dispatch, slotsNow } from '../src/core/game.js';
import { valueOf } from '../src/core/derived.js';
import { COMPANIONS, PLANS } from '../src/data/companions.js';
import { ITEMS } from '../src/data/items.js';
import { rested } from './_marsh.js';

/** 9장(잊힌 종)을 끝내고 잠긴 도성의 물길이 열린 사람. 레벨 64, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const sunk = (seed = 'sunk', { at = 'roofgate', origin = 'hunter' } = {}) => {
  const s = rested(seed, { origin });
  s.level = 64; s.stats.str += 14; s.stats.con += 12;
  s.flags.sawSunken = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 10장까지 끝낸 사람. */
export const quieted = (seed = 'quieted', opts = {}) => {
  const s = sunk(seed, opts);
  s.main.done.push({ chapter: 10, path: 'quiet', day: 100 });
  s.main.chapter = 11; s.main.called = '메아리를 잠재운 이';
  s.opened.push('cloudroad');
  return s;
};
/** 동료를 곁에 둔다(삯 걱정이 없게 은화도 넉넉히). */
export const withMercs = (s, ...ids) => {
  s.silver = Math.max(s.silver, 50000);
  for (const id of ids) { const d = COMPANIONS[id]; s.party.push({ id, hp: d.hp, row: d.row, plan: PLANS[d.role][0].id, crossed: 0, bond: 0, down: false, day: s.day, paidDay: s.day }); }
  return s;
};
/** 그 구간(옛 청동)의 장비 한 벌을 찬다. 비늘 가죽 장갑·장화까지. */
export const bronzed = (s) => {
  const put = (slot, id) => { s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
  put('weapon', 'oldbronze_sword'); put('head', 'oldbronze_helm'); put('body', 'oldbronze_armor'); put('hand', 'oldbronze_gloves'); put('feet', 'oldbronze_boots');
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 싸움의 한 턴: 큰 공격은 막고 나머지는 친다. 몸은 돌보지 않는다(숨과 생명력이 그대로 닳는다). */
export const turn = (s) => dispatch(s, { type: 'battle', choice: slotsNow(s) && s.battle && (s.battle.intent === 'charge') ? 'defend' : 'attack' });
/** 지금 싸움 하나를 끝까지(짝이 이어 덤비면 그 싸움은 남는다). 몸을 돌보며 싸운다. @returns 든 턴 */
export const oneFight = (s) => {
  const mark = s.battle;
  let n = 0;
  while (s.battle === mark && n++ < 400) { s.hp = valueOf(s, 'maxHp'); s.tired = 0; s.full = 80; turn(s); }
  return n;
};
