// 처음 모루 테스트 도우미 (M22). 12장을 끝낸 사람을 만든다. 길 가기·싸움은 _white.js, 몸 돌보기는 _marsh.js, 용병은 _sunken.js의 것을 쓴다.
import { valueOf } from '../src/core/derived.js';
import { dispatch } from '../src/core/game.js';
import { ITEMS } from '../src/data/items.js';
import { ANVIL, PATH_KIND, REGION_HIDDENS } from '../src/data/anvil.js';
import { HIDDENS } from '../src/data/quests.js';
import { ponded } from './_pond.js';

/** 장마다 그쪽으로 푼 길의 이름표. kinds: 일곱 장을 푼 쪽('f' 힘 · 'h' 손 · 'w' 말)을 6장부터 차례로 적은 일곱 글자. */
const KIND = { f: 'force', h: 'hand', w: 'word' };
export const pathsOf = (kinds) => [...kinds].map((k, i) => { const ch = 6 + i; return { chapter: ch, path: Object.entries(PATH_KIND[ch]).find(([, v]) => v === KIND[k])[0], day: 60 + i * 10 }; });
/**
 * 12장까지 끝내고 처음 모루로 오르는 길이 열린 사람. 레벨 94, 그 구간 사람의 스탯. at: 서 있을 곳.
 * kinds: 일곱 장을 푼 쪽(기본은 힘 셋 · 손 둘 · 말 둘: 고루 푼 사람).
 */
export const anviled = (seed = 'anviled', { at = 'anvilcamp', origin = 'hunter', kinds = 'fffhhww', level = 94 } = {}) => {
  const s = ponded(seed, { origin });
  s.main.done = s.main.done.filter((d) => d.chapter < 6);
  s.main.done.push(...pathsOf(kinds));
  s.main.chapter = 13; s.main.called = '조각을 거둔 이';
  if (!s.opened.includes('anvilroad')) s.opened.push('anvilroad');
  s.level = level; s.stats.str += 15; s.stats.con += 12;
  s.flags.sawAnvil = true; s.flags.sawAnvilTop = true;
  s.place = at;
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 그 구간(첫쇠)의 장비 한 벌을 찬다. */
export const ironed = (s) => {
  const put = (slot, id) => { s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
  put('weapon', 'firstiron_sword'); put('head', 'firstiron_helm'); put('body', 'firstiron_armor'); put('hand', 'shadowhide_gloves' in ITEMS ? 'shadowhide_gloves' : 'firstiron_gloves'); put('feet', 'firstiron_boots');
  s.hp = valueOf(s, 'maxHp');
  return s;
};
/** 일곱 지역의 히든 퀘스트를 모두 푼 사람으로 만든다. */
export const allHidden = (s) => { for (const id of REGION_HIDDENS) s.hq[id] = { status: 'done', step: HIDDENS[id].steps.at(-1).id, count: 0, day: 1 }; return s; };
/** 싸움에서 한 번 움직인다. 몸은 돌보아 둔다(규칙만 보려고). keepHp가 아니면 생명력도 채운다. */
export const act = (s, choice, index, keepHp = false) => { if (!keepHp) s.hp = valueOf(s, 'maxHp'); s.tired = 0; s.full = 80; return dispatch(s, { type: 'battle', choice, ...(index != null ? { index } : {}) }); };
/** 모루 앞에서 망치를 든다. */
export const lift = (s) => { s.place = ANVIL.front; s.tired = 0; s.full = 80; return dispatch(s, { type: 'lifthammer' }); };
/** 종을 끝까지 짓는다: 큰 공격은 막고, 틈에는 두드린다. 누른 수를 돌려준다. */
export const buildBell = (s, max = 600) => {
  let n = 0;
  while (s.battle && n < max) { const big = s.battle.intent === 'charge'; act(s, big ? 'defend' : 'hammer'); n++; }
  return n;
};
