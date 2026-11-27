// 흰마루 테스트 도우미 (M15). 1부의 끝을 본 사람을 만들고, 길을 가고, 싸운다.
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow, enemyView } from '../src/core/game.js';
import { valueOf } from '../src/core/derived.js';

/** 1부의 끝(잇는다)을 본 사람. 레벨 24, 그 구간 사람의 스탯. night: 끝을 본 밤이 지났는가(지났으면 흰마루 길이 열려 있다). */
export const ended = (seed = 'white', { night = true, origin = 'hunter' } = {}) => {
  const s = createGame({ name: '서진', origin, spent: { str: 3, con: 2 }, seed });
  s.level = 24; s.stats.str += 34; s.stats.con += 28; s.stats.agi += 14; s.jobAsked = true; s.job = 'warrior';
  s.main.done.push({ chapter: 1, path: 'fight', day: 1 }, { chapter: 2, path: 'tell', day: 2 }, { chapter: 3, path: 'both', day: 3 }, { chapter: 4, path: 'archive', day: 4 }, { chapter: 5, path: 'mend', day: 5 });
  s.main.chapter = 6; s.main.called = '종을 이은 이';
  s.opened.push('ruins', 'dock', 'bigmarket');
  s.ending = 'mend'; s.endDay = s.day; s.dingsAtEnd = 0; s.flags.keeperAlive = true; s.flags.lode = 'both';
  s.hp = valueOf(s, 'maxHp');
  if (night) { s.opened.push('icegate'); s.flags.sawWhite = false; }
  return s;
};
export const heal = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; s.tired = 0; if (s.equip.weapon) s.equip.weapon.dur = 60; };
export const fight = (s) => { let n = 0; while (s.battle && n++ < 600) { heal(s); dispatch(s, { type: 'battle', choice: enemyView(s).next?.kind === 'charge' ? 'defend' : 'attack' }); } };
export const travel = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'travel', to }); } fight(s); assert.equal(s.place, to); };
export const walk = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
