// 공용주방 (Z83): 요리·재료 다듬기·상점·주방장, 음식은 가방에, 요리 레벨과 요리사
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { placeById, TOWNS } from '../src/data/places.js';
import { SHOPS } from '../src/data/shops.js';
import { foodBuff, cookMenu } from '../src/core/cook.js';
import { craftLvView } from '../src/core/craft.js';
import { DISHES } from '../src/data/cooking.js';
import { skillEffect } from '../src/core/skills.js';

const make = (seed = 'kt') => { const s = createGame({ name: '밥', origin: 'bard', rolled: rollDice('same'), seed }); s.silver = 500; return s; };
const keep = (s) => { s.full = 30; s.tired = 0; s.hp = 999; };

test('시작 마을에 공용주방. 칸은 요리·재료 다듬기·상점, 주방장이 있다', () => {
  assert.ok(TOWNS['시작 마을'].order.includes('kitchen'));
  assert.deepEqual(placeById('kitchen').actions, ['cook', 'trim', 'shop', 'talk']);
  assert.deepEqual(SHOPS.kitchen.sells.sort(), ['berry', 'boarmeat', 'herb', 'riceball', 'salt'].sort());
  const s = make();
  dispatch(s, { type: 'move', to: 'kitchen' });
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['요리', '구경하기 (재료 다듬기)', '상점']);
  assert.ok(skillEffect('cooking'));
});

test('주방 음식은 가방에 담기고, 먹을 때 힘이 붙는다. 모닥불은 바로 먹는다', () => {
  const s = make('bag');
  dispatch(s, { type: 'move', to: 'kitchen' });
  addItem(s, 'crucian', 2); addItem(s, 'salt', 2);
  keep(s); dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] });
  assert.equal(countOf(s, 'dish_saltfish'), 1);
  assert.equal(foodBuff(s), null, '담기만 했다');
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_saltfish') });
  assert.equal(foodBuff(s).name, '든든한 속');
  s.place = 'river';
  keep(s); dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] });
  assert.equal(countOf(s, 'dish_saltfish'), 0, '모닥불에서는 담지 않고 먹는다');
});

test('요리 숙련도가 오를수록 음식의 힘이 오래 간다', () => {
  const a = make('ph'); const b = make('ph');
  b.skills.cooking = { grade: 18, xp: 0, uses: 0 };
  for (const s of [a, b]) { s.place = 'river'; addItem(s, 'crucian', 1); addItem(s, 'salt', 1); keep(s); dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] }); }
  const t = (s) => foodBuff(s).until.day * 3 + foodBuff(s).until.phase;
  assert.equal(t(b) - t(a), 2, '두 단계 높으면 두 때 더');
});

test('요리 레벨: 새 요리는 레벨이 모자라면 망친다. 레벨이 오르면 주방장이 귀띔한다', () => {
  const s = make('lv');
  dispatch(s, { type: 'move', to: 'kitchen' });
  addItem(s, 'eel', 1); addItem(s, 'salt', 1); addItem(s, 'herb', 1);
  keep(s); dispatch(s, { type: 'cook', ids: ['eel', 'salt', 'herb'] });
  assert.equal(countOf(s, 'dish_eelsoup'), 0);
  assert.ok(s.log.some((l) => l.text.includes('요리 레벨 2')));
  assert.ok(!cookMenu(s).hints.includes(DISHES.eelsoup.hint));
  for (let i = 0; i < 12 && craftLvView(s, 'cook').lv < 2; i++) {
    addItem(s, 'crucian', 1); addItem(s, 'salt', 1); keep(s); dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] });
    if (s.choice) dispatch(s, { type: 'choose', id: 'later' });
  }
  assert.equal(craftLvView(s, 'cook').lv, 2);
  assert.ok(cookMenu(s).hints.includes(DISHES.eelsoup.hint));
  addItem(s, 'eel', 1); addItem(s, 'salt', 1); addItem(s, 'herb', 1);
  keep(s); dispatch(s, { type: 'cook', ids: ['eel', 'salt', 'herb'] });
  assert.equal(countOf(s, 'dish_eelsoup'), 1);
});

test('주방에서 맞는 요리를 셋 만들면 주방장이 일을 권한다. 받으면 요리사', () => {
  const s = make('chef');
  dispatch(s, { type: 'move', to: 'kitchen' });
  for (let i = 0; i < 3; i++) { addItem(s, 'crucian', 1); addItem(s, 'salt', 1); keep(s); dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] }); }
  assert.equal(s.choice?.job, 'chef');
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.work, 'chef');
});
