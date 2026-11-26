// 의류점 (Z74): 바느질, 몸·발 손질, 실 잣기, 재봉사
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addItem } from '../src/core/inventory.js';
import { TOWNS, placeById } from '../src/data/places.js';
import { SHOPS } from '../src/data/shops.js';
import { PEOPLE } from '../src/data/people.js';
import { mendHere } from '../src/core/gear.js';

const make = (seed = 'tl') => {
  const s = createGame({ name: '재', origin: 'bard', rolled: rollDice('same'), seed });
  s.silver = 500;
  s.craftLv.sew.lv = 2;
  return s;
};
const keep = (s) => { s.full = 100; s.tired = 0; s.hp = 999; };

test('시작 마을 대장간 옆에 의류점. 칸은 바느질·실 잣기·상점, 대장간에는 바느질이 없다', () => {
  const order = TOWNS['시작 마을'].order;
  assert.equal(order[order.indexOf('forge') + 1], 'tailor');
  assert.deepEqual(placeById('tailor').actions, ['sew', 'spin', 'shop', 'talk']);
  assert.ok(!placeById('forge').actions.includes('sew'));
  assert.deepEqual(SHOPS.tailor.sells, ['trainwear', 'sandals', 'boarhide']);
  assert.equal(PEOPLE.tailor.place, 'tailor');
  const s = make();
  dispatch(s, { type: 'move', to: 'tailor' });
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['바느질', '구경하기 (실 잣기)', '상점']);
});

test('몸·발은 의류점에서, 무기는 대장간에서 손본다', () => {
  const s = make();
  const vest = addItem(s, 'trainwear'); vest.dur = 5;
  const sword = addItem(s, 'ironsword'); sword.dur = 5;
  dispatch(s, { type: 'move', to: 'forge' });
  assert.equal(mendHere(s, vest).ok, false);
  assert.throws(() => dispatch(s, { type: 'repair', index: s.bag.indexOf(vest) }), /의류점에서만/);
  dispatch(s, { type: 'repair', index: s.bag.indexOf(sword) });
  dispatch(s, { type: 'move', to: 'tailor' });
  assert.throws(() => dispatch(s, { type: 'repair', index: s.bag.indexOf(sword) }), /대장간에서만/);
  dispatch(s, { type: 'repair', index: s.bag.indexOf(vest) });
  assert.equal(vest.dur, 40);
});

test('실 잣기는 구경해서 배우고, 가죽 숙련도가 오른다', () => {
  const s = make('sp');
  dispatch(s, { type: 'move', to: 'tailor' });
  for (let i = 0; i < 20; i++) { keep(s); dispatch(s, { type: 'act', id: 'spin' }); }
  assert.ok(s.learned.includes('spin'), '스무 번 구경하면 가르쳐 준다');
  keep(s); dispatch(s, { type: 'act', id: 'spin' });
  assert.ok(s.skills.leather?.uses > 0);
});

test('가죽 옷을 세 벌 지으면 재봉사가 일을 권한다. 받으면 재봉사', () => {
  const s = make('jo');
  dispatch(s, { type: 'move', to: 'tailor' });
  addItem(s, 'boarhide', 6);
  for (let k = 0; k < 3; k++) {
    dispatch(s, { type: 'craft', recipe: 'leatherboots' });
    for (let i = 0; i < 10 && s.craft; i++) { keep(s); dispatch(s, { type: 'hammer' }); }
  }
  assert.equal(s.choice?.kind, 'offer');
  assert.equal(s.choice.job, 'tailor');
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.work, 'tailor');
  assert.equal(s.made, 0, '대장간 권유 셈에는 들지 않는다');
});
