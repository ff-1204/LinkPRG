// 경매장 하급·중급·상급 (Z66)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { lotsToday, lotPool } from '../src/core/auction.js';
import { itemDef } from '../src/data/items.js';
import { LOT_ASK, LOT_SKIP } from '../src/data/world.js';

const make = () => createGame({ name: '경', origin: 'bard', rolled: rollDice('same'), seed: 'au' });

test('하급 5·중급 3·상급 0~1, 칸마다 맞는 등급, 시작가는 제값의 60~100%', () => {
  const s = make();
  let high = 0, top = 0;
  const seen = new Set();
  for (let d = 1; d <= 90; d++) {
    s.day = d;
    const lots = lotsToday(s).filter((l) => !l.fixed); // 암살자의 가면(Z88)은 따로 센다
    const by = (t) => lots.filter((l) => l.tier === t);
    assert.equal(by('low').length, 5);
    assert.equal(by('mid').length, 3);
    assert.ok(by('high').length <= 1);
    for (const l of by('low')) assert.equal(l.item.grade, 0);
    for (const l of by('mid')) assert.equal(l.item.grade, 1);
    for (const l of by('high')) { assert.ok(l.item.grade >= 2); high++; if (l.item.grade === 3) top++; }
    for (const l of lots) {
      seen.add(l.item.id);
      const d0 = itemDef(l.item.id);
      assert.notEqual(d0.kind, 'quest');
      assert.ok(!d0.nosell && !LOT_SKIP.includes(l.item.id));
      assert.ok(l.ask >= Math.round(l.fair * LOT_ASK.from) - 1 && l.ask <= l.fair, `${l.name} ${l.ask}/${l.fair}`);
    }
    assert.equal(new Set(lots.map((l) => l.key)).size, lots.length);
  }
  assert.ok(high > 40 && high < 80, `상급이 나온 날 ${high}/90 (사흘에 두 번쯤)`);
  assert.ok(top > 0, '영웅 등급도 드물게 나온다');
  assert.ok(seen.size >= 20, `여러 가지가 나온다: ${seen.size}가지`);
});

test('중급부터는 값싼 장비가 없다', () => {
  for (const g of [1, 2, 3]) for (const id of lotPool(g)) if (itemDef(id).kind === 'gear') assert.ok(itemDef(id).price >= 20, id);
});
