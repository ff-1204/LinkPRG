// 별못 테스트 도우미 (M21). 11장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js, 몸 돌보기는 _marsh.js, 용병은 _sunken.js의 것을 쓴다.
import { valueOf } from '../src/core/derived.js';
import { dispatch } from '../src/core/game.js';
import { ITEMS } from '../src/data/items.js';
import { heard } from './_cloud.js';

/** 11장(모신 종)을 끝내고 별못으로 내려가는 길이 열린 사람. 레벨 84, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const ponded = (seed = 'ponded', { at = 'echogate', origin = 'hunter' } = {}) => {
  const s = heard(seed, { origin });
  s.level = 84; s.stats.str += 15; s.stats.con += 12;
  s.flags.sawPond = true; s.flags.metDaon = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 12장까지 끝낸 사람. */
export const answered = (seed = 'answered', opts = {}) => {
  const s = ponded(seed, opts);
  s.main.done.push({ chapter: 12, path: 'gather', day: 120 });
  s.main.chapter = 13; s.main.called = '조각을 거둔 이';
  s.opened.push('anvilroad');
  return s;
};
/** 그 구간(별쇠)의 장비 한 벌을 찬다. */
export const starred = (s) => {
  const put = (slot, id) => { s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
  put('weapon', 'starmetal_sword'); put('head', 'starmetal_helm'); put('body', 'starmetal_armor'); put('hand', 'starmetal_gloves'); put('feet', 'starmetal_boots');
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 싸움에서 한 번 움직인다. 몸은 돌보아 둔다(읽힘만 보려고). */
export const act = (s, choice, index) => { s.hp = valueOf(s, 'maxHp'); s.tired = 0; s.full = 80; return dispatch(s, { type: 'battle', choice, ...(index != null ? { index } : {}) }); };
