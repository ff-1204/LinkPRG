// 가죽 제작 (Z71): 멧돼지 가죽을 그대로 바느질한다. 한 번 누르면 한 땀, 땀 수만 센다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { recipeList, craftView, TANNER_XP } from '../src/core/craft.js';
import { SEW_ORDER, RECIPES } from '../src/data/recipes.js';
import { SKILL_NAMES, skillEffect } from '../src/core/skills.js';

const make = (origin = 'bard', seed = 'lt') => {
  const s = createGame({ name: '갖', origin, rolled: rollDice('same'), seed });
  s.craftLv.sew.lv = 4; // 가죽 옷은 재봉 레벨 2~4에 열린다 (Z79)
  dispatch(s, { type: 'move', to: 'tailor' });
  return s;
};
const keep = (s) => { s.full = 100; s.tired = 0; s.hp = 999; };

test('의류점은 손·발(짚신·가죽 장갑·가죽 장화), 몸통 가죽 옷은 대장간 (Z86)', () => {
  const list = recipeList(make(), SEW_ORDER);
  assert.deepEqual(list.map((r) => [r.id, r.hits, r.needs.map((n) => `${n.id}${n.n}`).join('+')]), [
    ['sandals', 6, 'herb3'], ['leathergloves', 8, 'boarhide1'], ['leatherboots', 10, 'boarhide2'],
  ]);
  for (const r of list) assert.deepEqual(r.best, r.worst, '가죽은 박자가 없어 확률이 하나다');
  for (const id of ['leathervest', 'leatherarmor', 'trainwear', 'ironhelm']) assert.equal(RECIPES[id].branch, 'smith', id);
});

test('한 땀씩 끝까지 뜨면 장비가 나온다. 다시 달구기는 없다', () => {
  const s = make();
  addItem(s, 'boarhide', 2);
  dispatch(s, { type: 'craft', recipe: 'leatherboots' });
  assert.equal(countOf(s, 'boarhide'), 0);
  assert.equal(slotsNow(s)[0].label, '한 땀 0 / 10');
  assert.equal(slotsNow(s).length, 2);
  for (let i = 0; i < 9; i++) { keep(s); dispatch(s, { type: 'hammer', late: true }); } // 늦어도 상관없다
  assert.equal(craftView(s).hits, 9);
  keep(s); dispatch(s, { type: 'hammer' });
  assert.equal(s.craft, null);
  assert.equal(countOf(s, 'leatherboots'), 1);
  assert.ok(s.skills.leather.uses > 0, '가죽 숙련도가 오른다');
});

test('무두장이는 가죽 숙련도가 조금 빨리 오른다', () => {
  assert.ok(TANNER_XP > 1);
  const a = make('tanner', 'ta'); const b = make('bard', 'ta');
  for (const s of [a, b]) {
    addItem(s, 'boarhide', 2);
    dispatch(s, { type: 'craft', recipe: 'leatherboots' });
    for (let i = 0; i < 10; i++) { keep(s); dispatch(s, { type: 'hammer' }); }
  }
  const xp = (s) => s.skills.leather.grade * 1e6 + s.skills.leather.xp;
  assert.ok(xp(a) > xp(b));
});

test('의류점 밖에서는 못 한다. 가죽 숙련도에 효과 글이 있다', () => {
  const s = createGame({ name: '갖', origin: 'bard', rolled: rollDice('same'), seed: 'lo' });
  addItem(s, 'boarhide', 2);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'leatherboots' }));
  assert.equal(SKILL_NAMES.leather, '가죽');
  assert.ok(skillEffect('leather'));
});
