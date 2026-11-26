// 상점에서 여러 개를 골라 한꺼번에 판다 (Z85)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { sellPrice } from '../src/core/trade.js';

const make = () => { const s = createGame({ name: '판', origin: 'bard', rolled: rollDice('same'), seed: 'sm' }); s.bag = []; s.place = 'forge'; return s; };

test('고른 칸을 묶음째 한꺼번에 판다. 값은 하나씩 판 것과 같다', () => {
  const s = make();
  addItem(s, 'ironore', 5); addItem(s, 'copperore', 3); addItem(s, 'ironsword', 1, { grade: 1 }); addItem(s, 'oakbranch', 2);
  const want = sellPrice(s.bag[0], s) * 5 + sellPrice(s.bag[2], s) + sellPrice(s.bag[3], s) * 2;
  const silver = s.silver;
  dispatch(s, { type: 'sellMany', picks: [{ index: 0, n: 5 }, { index: 2, n: 1 }, { index: 3, n: 2 }] });
  assert.equal(s.silver, silver + want);
  assert.equal(countOf(s, 'ironore'), 0);
  assert.equal(countOf(s, 'ironsword'), 0);
  assert.equal(countOf(s, 'oakbranch'), 0);
  assert.equal(countOf(s, 'copperore'), 3, '고르지 않은 것은 남는다');
  assert.ok(s.log.at(-1).text.includes('한꺼번에 팔았다'));
});

test('하나라도 못 파는 것이 섞이면 아무것도 팔지 않는다. 상점이 없으면 못 판다', () => {
  const s = make();
  addItem(s, 'ironore', 2); addItem(s, 'bread', 1);
  const silver = s.silver;
  assert.throws(() => dispatch(s, { type: 'sellMany', picks: [{ index: 0 }, { index: 1 }] }), /팔 수 없습니다/);
  assert.equal(s.silver, silver);
  assert.equal(countOf(s, 'ironore'), 2);
  assert.throws(() => dispatch(s, { type: 'sellMany', picks: [{ index: 0 }, { index: 0 }] }), /가방에 없는/);
  s.place = 'training';
  assert.throws(() => dispatch(s, { type: 'sellMany', picks: [{ index: 0 }] }), /사 줄 사람/);
});
