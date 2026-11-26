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

test('가면은 드물게 은화 5000에 나온다. 그 값을 부르면 낙찰되고 칭호 암살자가 생긴다. 기척이 모험가일 확률 +30%p', () => {
  const s = make();
  let day = 0;
  for (let d = 1; d <= 400 && !day; d++) { s.day = d; if (lotsToday(s).some((l) => l.fixed)) day = d; }
  assert.ok(day, '400일 안에 한 번은 나온다');
  const lot = lotsToday(s).find((l) => l.fixed);
  assert.equal(lot.ask, MASK_LOT.price);
  s.place = 'artguild'; s.silver = 6000;
  s.place = 'forest';
  const before = personChance(s);
  s.place = 'artguild';
  dispatch(s, { type: 'auction', op: 'bid', key: lot.key, amount: lot.ask });
  s.day += 1; auctionDay(s, []);
  assert.equal(countOf(s, 'assassinmask'), 1);
  assert.ok(hasTitle(s, 'assassin'));
  s.place = 'forest';
  assert.ok(Math.abs(personChance(s) - before - 0.30) < 1e-9);
});

test('기도 숙련도가 높으면 내 경매에 더 높은 값이 붙는다', () => {
  const run = (grade) => {
    const s = make('pb'); s.place = 'artguild'; s.bag = [];
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
