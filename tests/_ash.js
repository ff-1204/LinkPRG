// 잿골 테스트 도우미 (M17). 7장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js의 것을 쓴다.
import { dispatch, enemyView } from '../src/core/game.js';
import { valueOf } from '../src/core/derived.js';
import { ITEMS } from '../src/data/items.js';
import { sold } from './_salt.js';

/** 7장(팔린 종)을 끝내고 잿골 길이 열린 사람. 레벨 44, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const ashed = (seed = 'ash', { at = 'kilngate', origin = 'hunter' } = {}) => {
  const s = sold(seed, { origin });
  s.level = 44; s.stats.str += 14; s.stats.con += 12;
  s.flags.sawAsh = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 8장까지 끝낸 사람. */
export const forged = (seed = 'forged', opts = {}) => {
  const s = ashed(seed, opts);
  s.main.done.push({ chapter: 8, path: 'beat', day: 60 });
  s.main.chapter = 9; s.main.called = '망치를 꺾은 이';
  s.opened.push('marshroad');
  return s;
};
/** 새 장비 하나(가방에 넣지 않는다). */
export const gear = (id, more = {}) => ({ id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur, ...more });
/** 몸만 돌본다(무기 내구도는 건드리지 않는다). */
export const mendBody = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; s.tired = 0; };
/** 싸움을 끝까지: 큰 공격은 막고 나머지는 친다. 무기 내구도는 그대로 닳게 둔다. */
export const duel = (s, { care = true } = {}) => { let n = 0; while (s.battle && n++ < 800) { if (care) mendBody(s); dispatch(s, { type: 'battle', choice: enemyView(s).next?.kind === 'charge' ? 'defend' : 'attack' }); } };
