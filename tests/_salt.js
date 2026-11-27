// 소금벌 테스트 도우미 (M16). 6장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js의 것을 쓴다.
import { valueOf } from '../src/core/derived.js';
import { ended } from './_white.js';

/** 6장(얼린 종)을 끝내고 소금벌 길이 열린 사람. 레벨 34, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const salted = (seed = 'salt', { at = 'saltgate', origin = 'hunter' } = {}) => {
  const s = ended(seed, { origin });
  s.level = 34; s.stats.str += 16; s.stats.con += 12;
  s.main.done.push({ chapter: 6, path: 'beat', day: 20 });
  s.main.chapter = 7; s.main.called = '얼음을 깬 이';
  s.opened.push('saltflat');
  s.flags.sawWhite = true; s.flags.sawSalt = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 7장까지 끝낸 사람. */
export const sold = (seed = 'sold', opts = {}) => {
  const s = salted(seed, opts);
  s.main.done.push({ chapter: 7, path: 'raid', day: 40 });
  s.main.chapter = 8; s.main.called = '창고를 턴 이';
  s.opened.push('ashroad');
  return s;
};
export const give = (s, id, n = 1) => { const it = s.bag.find((x) => x.id === id); if (it) it.n += n; else s.bag.push({ id, grade: 0, n }); };
export const count = (s, id) => s.bag.filter((x) => x.id === id).reduce((a, x) => a + x.n, 0);
