// 구름다리 테스트 도우미 (M20). 10장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js, 몸 돌보기는 _marsh.js, 용병은 _sunken.js의 것을 쓴다.
import { valueOf } from '../src/core/derived.js';
import { idle } from '../src/core/game.js';
import { ITEMS } from '../src/data/items.js';
import { quieted } from './_sunken.js';

/** 10장(늘 울리던 종)을 끝내고 구름다리의 산길이 열린 사람. 레벨 74, 그 구간 사람의 스탯. at: 서 있을 곳. */
export const climbed = (seed = 'climbed', { at = 'bridgegate', origin = 'hunter' } = {}) => {
  const s = quieted(seed, { origin });
  s.level = 74; s.stats.str += 15; s.stats.con += 12;
  s.flags.sawCloud = true;
  s.sunken.boxes = { sunkenstreet: 1 }; // 상자를 하나 열어 본 사람(잠긴 도성의 히든이 끼어들지 않게)
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 11장까지 끝낸 사람. */
export const heard = (seed = 'heard', opts = {}) => {
  const s = climbed(seed, opts);
  s.main.done.push({ chapter: 11, path: 'beat', day: 110 });
  s.main.chapter = 12; s.main.called = '가면을 벗긴 이';
  s.opened.push('pondroad');
  return s;
};
/** 그 구간(구름은)의 장비 한 벌을 찬다. */
export const silvered = (s) => {
  const put = (slot, id) => { s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
  put('weapon', 'cloudsilver_sword'); put('head', 'cloudsilver_helm'); put('body', 'cloudsilver_armor'); put('hand', 'cloudsilver_gloves'); put('feet', 'cloudsilver_boots');
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 그날 그때를 그 바람이 부는 때로 옮긴다(날을 앞으로 넘겨 가며 찾는다). */
export const blow = (s, id, windAt) => {
  for (let d = s.day; d < s.day + 400; d++) for (let p = 0; p < 3; p++) if (windAt(s, d, p) === id) { s.day = d; s.phase = p; s.tick = 0; return s; }
  throw new Error('그 바람이 부는 때를 찾지 못했다');
};
/** 깨어서 한 때를 넘긴다(밤에도 자지 않는다). */
export const turnPhase = (s) => { const was = s.phase; let g = 0; while (s.phase === was && g++ < 80) { s.tired = 0; s.full = 80; idle(s, 10); } };
