// 신전 상점 (Z77): 물약·약초·성수. 성수를 마시면 신의 가호
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { countOf } from '../src/core/inventory.js';
import { SHOPS } from '../src/data/shops.js';
import { graceBuff } from '../src/core/buffs.js';

test('신전에서 물약·약초·성수를 판다. 성수를 마시면 신의 가호가 두 때', () => {
  assert.deepEqual(SHOPS.temple.sells, ['redpotion', 'herb', 'holywater']);
  const s = createGame({ name: '신', origin: 'bard', rolled: rollDice('same'), seed: 'ts' });
  dispatch(s, { type: 'move', to: 'temple' });
  assert.ok(slotsNow(s).some((x) => x.label === '상점'));
  s.silver = 500;
  dispatch(s, { type: 'buy', id: 'holywater' });
  assert.equal(countOf(s, 'holywater'), 1);
  assert.equal(graceBuff(s), null);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'holywater') });
  assert.ok(graceBuff(s));
  assert.equal(countOf(s, 'holywater'), 0);
});

test('성수 값은 레벨 × 6. 신전 축복(레벨 × 5)보다 늘 비싸고 깎아 주지 않는다', async () => {
  const { buyPrice } = await import('../src/core/trade.js');
  const s = createGame({ name: '신', origin: 'bard', rolled: rollDice('same'), seed: 'tp2' });
  s.place = 'temple';
  for (const lv of [1, 5, 13, 20, 40]) { s.level = lv; assert.equal(buyPrice(s, 'holywater').now, Math.max(6, lv * 6)); }
});

test('성수를 마시면 죽음의 그림자가 모두 걷힌다. 신전에는 축복받기가 없다 (Z92)', () => {
  const s = createGame({ name: '신', origin: 'bard', rolled: rollDice('same'), seed: 'sh' });
  dispatch(s, { type: 'move', to: 'temple' });
  assert.ok(!slotsNow(s).some((x) => x.action?.id === 'blessing'));
  s.shadow = 3; s.silver = 500;
  dispatch(s, { type: 'buy', id: 'holywater' });
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'holywater') });
  assert.equal(s.shadow, 0);
});
