// 제작 레벨 (Z79)과 예술협회 (Z80)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { recipeList, craftLvView } from '../src/core/craft.js';
import { RECIPES, ORDER_OF } from '../src/data/recipes.js';
import { ITEMS } from '../src/data/items.js';
import { placeById, TOWNS } from '../src/data/places.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const make = (seed = 'cl') => createGame({ name: '레', origin: 'bard', rolled: rollDice('same'), seed });
const keep = (s) => { s.full = 100; s.tired = 0; s.hp = 999; };

test('지금 있는 장비는 모두 설계도가 있다. 갈래마다 레벨 1에 열리는 것이 있다', () => {
  const gear = Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear').map(([id]) => id);
  const made = new Set(Object.values(RECIPES).map((r) => r.makes));
  for (const id of gear) assert.ok(made.has(id), `${id}의 설계도`);
  for (const b of ['smith', 'sew', 'jewel']) assert.ok(ORDER_OF[b].some((id) => RECIPES[id].lv === 1), b);
});

test('처음엔 레벨 1. 철검은 잠겨 있다. 만들수록 레벨이 오르고 새 설계도가 열린다', () => {
  const s = make();
  dispatch(s, { type: 'move', to: 'forge' });
  assert.equal(craftLvView(s, 'smith').lv, 1);
  const iron = recipeList(s).find((r) => r.id === 'ironsword');
  assert.ok(iron.locked && !iron.can);
  addItem(s, 'ironore', 6); addItem(s, 'oakbranch', 30);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'ironsword' }), /대장 레벨 3/);
  let dinged = false;
  for (let k = 0; k < 20 && craftLvView(s, 'smith').lv < 3; k++) {
    addItem(s, 'oakbranch', 3);
    dispatch(s, { type: 'craft', recipe: 'woodsword' });
    let ev = [];
    while (s.craft) { keep(s); ev = dispatch(s, { type: 'hammer' }); }
    if (ev.some((e) => e.type === 'ding' && e.ding.title.startsWith('대장 레벨'))) dinged = true;
    if (s.choice) dispatch(s, { type: 'choose', id: 'later' });
  }
  assert.ok(craftLvView(s, 'smith').lv >= 3);
  assert.ok(dinged, '레벨이 오르면 띠링');
  assert.ok(!recipeList(s).find((r) => r.id === 'ironsword').locked);
});

test('예술협회: 조각·세공·경매장. 광장에는 없다. 세공으로 반지를 만든다', () => {
  assert.deepEqual(placeById('artguild').actions, ['sculpt', 'jewel', 'auction', 'shop', 'sort', 'talk']);
  assert.ok(placeById('artguild').auction && !placeById('plaza').auction);
  assert.ok(!placeById('plaza').actions.includes('sculpt'));
  assert.ok(TOWNS['시작 마을'].order.includes('artguild'));
  const s = make('jw');
  dispatch(s, { type: 'move', to: 'artguild' });
  assert.deepEqual(slotsNow(s).map((x) => x.label).slice(0, 3), ['조각', '세공', '경매장']);
  addItem(s, 'copperore', 2);
  dispatch(s, { type: 'craft', recipe: 'copperring' });
  assert.equal(slotsNow(s)[0].label, '다듬기 0 / 8');
  while (s.craft) { keep(s); dispatch(s, { type: 'hammer' }); }
  assert.equal(countOf(s, 'copperring'), 1);
  assert.ok(s.skills.sculpting.uses > 0, '조각 숙련도가 오른다');
  assert.ok(craftLvView(s, 'jewel').xp > 0);
  dispatch(s, { type: 'move', to: 'forge' });
  addItem(s, 'copperore', 2);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'copperring' }), /예술협회/);
});

test('설계도에 드는 재료는 그 일터의 상점에서 다 판다 (Z81)', async () => {
  const { SHOPS } = await import('../src/data/shops.js');
  const where = { smith: 'forge', sew: 'tailor', jewel: 'artguild' };
  for (const [b, place] of Object.entries(where)) {
    for (const id of ORDER_OF[b]) for (const n of RECIPES[id].needs) assert.ok(SHOPS[place].sells.includes(n.id), `${place}에서 ${n.id}`);
  }
  assert.ok(SHOPS.artguild.sells.includes('oakbranch') && SHOPS.artguild.sells.includes('chisel'), '조각 재료와 조각칼');
});

test('지난 저장은 이미 만든 만큼 처음 레벨을 쳐 준다', () => {
  const s = make('old');
  s.made = 2; s.counters.sewn = 1;
  const old = JSON.parse(JSON.stringify(s)); delete old.craftLv;
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.craftLv.smith.lv, 3, '하나라도 만들었으면 철검을 계속 만든다');
  assert.equal(up.craftLv.sew.lv, 2);
  assert.equal(up.craftLv.jewel.lv, 1);
});
