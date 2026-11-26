// 공용주방 (Z83, Z92, Z93): 요리 목록·재료 다듬기·상점·빵 받기·주방장, 음식은 가방에, 요리 레벨과 요리사
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { placeById, TOWNS } from '../src/data/places.js';
import { SHOPS } from '../src/data/shops.js';
import { foodBuff } from '../src/core/cook.js';
import { craftLvView, recipeList } from '../src/core/craft.js';
import { COOK_ORDER } from '../src/data/recipes.js';
import { skillEffect } from '../src/core/skills.js';

const make = (seed = 'kt') => { const s = createGame({ name: '밥', origin: 'bard', rolled: rollDice('same'), seed }); s.silver = 500; return s; };
const keep = (s) => { s.full = 30; s.tired = 0; s.hp = 999; };
const cookIt = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); while (s.craft) { keep(s); dispatch(s, { type: 'hammer' }); } };

test('시작 마을에 공용주방. 칸은 요리·재료 다듬기·상점·빵 받기, 주방장이 있다', () => {
  assert.ok(TOWNS['시작 마을'].order.includes('kitchen'));
  assert.deepEqual(placeById('kitchen').actions, ['cook', 'trim', 'shop', 'bread', 'talk']);
  assert.deepEqual(SHOPS.kitchen.sells.sort(), ['berry', 'boarmeat', 'herb', 'riceball', 'salt'].sort());
  const s = make();
  dispatch(s, { type: 'move', to: 'kitchen' });
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['요리', '구경하기 (재료 다듬기)', '상점', '빵 받기']);
  assert.ok(skillEffect('cooking'));
});

test('요리는 레벨별 목록. 한 번 누르면 한 번 젓는다. 주방 음식은 가방에 담기고, 먹을 때 힘이 붙는다', () => {
  const s = make('bag');
  dispatch(s, { type: 'move', to: 'kitchen' });
  const list = recipeList(s, COOK_ORDER);
  assert.equal(list.length, 6);
  assert.ok(list.find((r) => r.id === 'cook_eelsoup').locked, '장어 소금 국은 요리 레벨 2');
  addItem(s, 'crucian', 2); addItem(s, 'salt', 2);
  dispatch(s, { type: 'craft', recipe: 'cook_saltfish' });
  assert.equal(slotsNow(s)[0].label, '젓기 0 / 6');
  while (s.craft) { keep(s); dispatch(s, { type: 'hammer' }); }
  assert.equal(countOf(s, 'dish_saltfish'), 1);
  assert.equal(foodBuff(s), null, '담기만 했다');
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_saltfish') });
  assert.equal(foodBuff(s).name, '든든한 속');
});

test('요리 숙련도와 등급이 높을수록 음식의 힘이 오래 간다', () => {
  const a = make('ph'); const b = make('ph');
  b.skills.cooking = { grade: 18, xp: 0, uses: 0 };
  for (const s of [a, b]) { s.place = 'kitchen'; addItem(s, 'dish_saltfish', 1, { grade: s === b ? 2 : 0 }); dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_saltfish') }); }
  const t = (s) => foodBuff(s).until.day * 3 + foodBuff(s).until.phase;
  assert.equal(t(b) - t(a), 4, '숙련도 두 단계 + 희귀 등급 두 때');
});

test('요리 레벨이 오르면 새 요리가 열린다', () => {
  const s = make('lv');
  dispatch(s, { type: 'move', to: 'kitchen' });
  addItem(s, 'eel', 1); addItem(s, 'salt', 1); addItem(s, 'herb', 1);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'cook_eelsoup' }), /요리 레벨 2/);
  for (let i = 0; i < 12 && craftLvView(s, 'cook').lv < 2; i++) {
    addItem(s, 'crucian', 1); addItem(s, 'salt', 1); cookIt(s, 'cook_saltfish');
    if (s.choice) dispatch(s, { type: 'choose', id: 'later' });
  }
  assert.equal(craftLvView(s, 'cook').lv, 2);
  cookIt(s, 'cook_eelsoup');
  assert.equal(countOf(s, 'dish_eelsoup'), 1);
});

test('주방에서 요리를 셋 만들면 주방장이 일을 권한다. 받으면 요리사', () => {
  const s = make('chef');
  dispatch(s, { type: 'move', to: 'kitchen' });
  for (let i = 0; i < 3; i++) { addItem(s, 'crucian', 1); addItem(s, 'salt', 1); cookIt(s, 'cook_saltfish'); }
  assert.equal(s.choice?.job, 'chef');
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.work, 'chef');
});

test('빵은 공용주방에서, 주방장이 나눈다 (Z92)', () => {
  const s = make('bread');
  dispatch(s, { type: 'move', to: 'kitchen' });
  dispatch(s, { type: 'act', id: 'bread' });
  assert.equal(countOf(s, 'bread'), 1);
  assert.ok(s.log.some((l) => l.who === '주방장'));
  assert.ok(!placeById('temple').actions.includes('bread') && !placeById('temple').actions.includes('blessing'));
});
