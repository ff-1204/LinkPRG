// 일마다 히든 스탯 (Z119)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { HIDDEN, hiddenById, valueOf as hiddenValue, checkHidden, hiddenSlots } from '../src/core/hidden.js';
import { sellPrice } from '../src/core/trade.js';
import { makeItem, countOf } from '../src/core/inventory.js';
import { spare } from '../src/core/craft.js';

const fresh = (seed = 'wh') => createGame({ name: '일', origin: 'hunter', rolled: rollDice(seed), seed });

const WORKS = { seen: 'look', drill: 'strike', blaze: 'bellows', finger: 'spin', gaze: 'sort', thrift: 'trim', calm: 'pray' };

test('일 일곱마다 히든 스탯이 하나씩, 100·200·350·550·800번에 오른다', () => {
  for (const [id, act] of Object.entries(WORKS)) {
    const def = hiddenById(id);
    assert.ok(def, id);
    const s = fresh(id);
    for (const [n, v] of [[99, 0], [100, 1], [199, 1], [200, 2], [350, 3], [550, 4], [800, 5]]) {
      s.counters.act[act] = n;
      assert.equal(hiddenValue(def, s), v, `${id} ${n}번`);
    }
  }
  assert.equal(HIDDEN.filter((h) => !h.after).length, 20);
});

test('찾기 전에는 이름도 효과도 없고, 찾으면 이름과 효과가 보인다', () => {
  const s = fresh('slot');
  s.counters.act.sort = 100;
  checkHidden(s);
  const slots = hiddenSlots(s);
  assert.equal(slots.find((x) => x.id === 'gaze').name, '안목');
  assert.equal(slots.find((x) => x.id === 'seen').name, undefined);
});

test('치기 100번이면 단련이 생긴다. 구경하기는 세지 않는다', () => {
  const s = fresh('drill');
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 100; i++) { if (s.phase === 2) { s.phase = 0; s.day += 1; } s.tired = 0; s.full = 100; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.equal(s.hidden.drill?.value, 1);
});

test('안목은 파는 값을, 알뜰은 재료 하나를 아낀다', () => {
  const s = fresh('gaze');
  const item = makeItem('boarhide', { n: 10 });
  const before = sellPrice(item, s);
  s.hidden.gaze = { value: 100, half: true };
  assert.ok(sellPrice(item, s) >= before * 2 - 1, '100이면 두 배쯤');
  s.hidden.thrift = { value: 45, half: true }; // 90%
  let saved = 0;
  for (let i = 0; i < 50; i++) { const n = countOf(s, 'herb'); spare(s, [], 'herb'); if (countOf(s, 'herb') > n) saved += 1; }
  assert.ok(saved > 30, `알뜰 90%면 대부분 아낀다 (${saved}/50)`);
});

test('기도 중의 행운 (Z122): 행운을 찾은 사람만, 1% 확률로 행운 +1', async () => {
  const { PRAY_LUCK_RATE } = await import('../src/core/game.js');
  assert.equal(PRAY_LUCK_RATE, 0.01);
  const pray = (s, n) => { s.place = 'temple'; for (let i = 0; i < n; i++) { if (s.phase === 2) { s.phase = 0; s.day += 1; } s.tired = 0; s.full = 100; dispatch(s, { type: 'act', id: 'pray' }); } };
  const none = fresh('pl0');
  pray(none, 400);
  assert.equal(none.hidden.luck?.value || 0, 0, '행운을 찾기 전에는 오르지 않는다');
  const s = fresh('pl1');
  s.counters.rare = 10; s.hidden.luck = { value: 1, half: true };
  pray(s, 400);
  assert.ok(s.hidden.luck.value >= 2, `400번 기도하면 한 번쯤은 오른다 (${s.hidden.luck.value})`);
});
