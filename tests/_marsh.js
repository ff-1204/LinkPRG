// 안개늪 테스트 도우미 (M18). 8장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js의 것을 쓴다.
import { dispatch, slotsNow } from '../src/core/game.js';
import { valueOf } from '../src/core/derived.js';
import { forged } from './_ash.js';

/** 8장(벼린 종)을 끝내고 안개늪 길이 열린 사람. 레벨 54, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const marshed = (seed = 'marsh', { at = 'floatgate', origin = 'hunter' } = {}) => {
  const s = forged(seed, { origin });
  s.level = 54; s.stats.str += 14; s.stats.con += 12;
  s.flags.sawMarsh = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 9장까지 끝낸 사람. */
export const rested = (seed = 'rested', opts = {}) => {
  const s = marshed(seed, opts);
  s.main.done.push({ chapter: 9, path: 'rest', day: 80 });
  s.main.chapter = 10; s.main.called = '종지기를 쉬게 한 이';
  s.opened.push('sunkenroad');
  return s;
};
/** 몸을 돌본다. */
export const tend = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; s.tired = 0; };
/** 싸움을 곧장 끝낸다(적의 생명력을 1로). 기척·사건은 맨 끝 선택지로 넘긴다. */
export const settle = (s) => {
  let n = 0;
  while ((s.battle || s.choice) && n++ < 60) {
    if (s.battle) { tend(s); s.battle.hp = 1; dispatch(s, { type: 'battle', choice: 'attack' }); }
    else dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
  }
};
/** 공방을 산 사람(견습은 아직 없다). */
export const owner = (seed = 'owner', opts = {}) => {
  const s = marshed(seed, opts);
  s.shop = { hand: null, hand2: null, shelf: [], today: [], left: {} };
  s.flags.sawShop = true;
  return s;
};
/** 공방에 견습 보리를 들인 사람. 삯 걱정이 없게 은화를 넉넉히 준다. */
export const master = (seed = 'master', opts = {}) => {
  const s = owner(seed, opts);
  s.silver = 50000;
  s.shop.hand = { id: 'bori', pts: 0, job: null, work: 0, idle: false, paidDay: s.day };
  return s;
};
/** "일"을 n번 한다: 늪 사당의 기도(싸움이 나지 않는 일). 서 있던 곳으로 돌아온다. */
export const work = (s, n = 1) => {
  const at = s.place;
  s.place = 'marshshrine';
  for (let i = 0; i < n; i++) { tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'act', id: 'pray' }); }
  s.place = at;
};
