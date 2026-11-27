// 암살자의 가면 (Z88)과 기도·경매 (Z87), 머리·몸통 대장간·손·발 의류점 (Z86)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { lotsToday, auctionDay } from '../src/core/auction.js';
import { personChance } from '../src/core/explore.js';
import { hasTitle } from '../src/core/titles.js';
import { MASK_LOT } from '../src/data/world.js';
import { RECIPES } from '../src/data/recipes.js';
import { ITEMS } from '../src/data/items.js';

const make = (seed = 'mk') => createGame({ name: '가', origin: 'bard', rolled: rollDice('same'), seed });

test('가면은 경매장에 오르지 않고 암시장에만 드물게 은화 3000에 나온다. 사면 칭호 암살자가 생긴다. 기척이 모험가일 확률 +30%p (Z106)', async () => {
  const { maskToday, blackView } = await import('../src/core/auction.js');
  const s = make();
  s.people.priest = { ...(s.people.priest || {}), pts: 70 };
  let day = 0, days = 0;
  for (let d = 1; d <= 400; d++) {
    s.day = d;
    assert.ok(!lotsToday(s).some((l) => l.fixed || l.item.id === MASK_LOT.id), '경매에는 오르지 않는다');
    if (maskToday(s)) { days += 1; if (!day) day = d; }
  }
  assert.ok(day && days > 400 * 0.03 && days < 400 * 0.14, `400일에 ${days}일`);
  s.day = day;
  const m = blackView(s).specials.find((x) => x.id === MASK_LOT.id);
  assert.deepEqual([m.name, m.price, MASK_LOT.price], ['암살자의 가면', 3000, 3000]);
  s.silver = 6000;
  s.place = 'forest';
  const before = personChance(s);
  assert.throws(() => dispatch(s, { type: 'auction', op: 'buy', key: m.key }), /할 수 없는/);
  s.place = 'temple';
  dispatch(s, { type: 'auction', op: 'buy', key: m.key });
  assert.equal(s.silver, 3000, '얹는 것 없이 3000');
  assert.equal(countOf(s, 'assassinmask'), 1);
  assert.ok(hasTitle(s, 'assassin'), '그 자리에서 칭호가 붙는다');
  assert.equal(maskToday(s), null);
  assert.throws(() => dispatch(s, { type: 'auction', op: 'buy', key: m.key }), /오늘은 나오지 않았습니다/);
  s.place = 'forest';
  assert.ok(Math.abs(personChance(s) - before - 0.30) < 1e-9);
  // 암시장이 열리기 전에는 살 수 없다
  const t = make('closed'); t.day = day; t.place = 'temple'; t.silver = 6000;
  let d2 = 1; t.day = d2; while (!maskToday(t)) { d2 += 1; t.day = d2; }
  assert.throws(() => dispatch(t, { type: 'auction', op: 'buy', key: `${d2}-mask` }), /할 수 없는/);
});

test('기도 숙련도가 높으면 내 경매에 더 높은 값이 붙는다', () => {
  const run = (grade) => {
    const s = make('pb'); s.place = 'temple'; s.bag = [];
    s.skills.pray = { grade, xp: 0, uses: 0 };
    addItem(s, 'ironsword', 1, { grade: 1, maker: s.name });
    dispatch(s, { type: 'auction', op: 'list', index: 0, start: 10, days: 3 });
    for (let d = 0; d < 3; d++) { s.day += 1; auctionDay(s, []); }
    return s.auction.history.at(-1).amount || 0;
  };
  assert.ok(run(40) > run(0));
});

test('머리·몸통은 대장간, 손·발은 의류점. 새 쇠 투구와 가죽 장갑', () => {
  for (const id of ['ironhelm', 'trainwear', 'leathervest', 'leatherarmor']) assert.equal(RECIPES[id].branch, 'smith', id);
  for (const id of ['leathergloves', 'sandals', 'leatherboots']) assert.equal(RECIPES[id].branch, 'sew', id);
  assert.equal(ITEMS.ironhelm.slot, 'head');
  assert.equal(ITEMS.leathergloves.slot, 'hand');
});

test('기도 한 번에 생명력이 1 돌아온다 (Z100). 가득 차 있으면 넘치지 않는다', () => {
  const s = make('heal'); s.place = 'temple';
  const max = s.hp;
  dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.hp, max, '가득 찬 생명력은 넘치지 않는다');
  s.hp = max - 5; s.tired = 0;
  dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.hp, max - 4);
  dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.hp, max - 3);
});
