// 훈련소 용병 셋 (Z94), 광장 전시 받침대 셋 (Z95)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow, statueOf } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { placeById } from '../src/data/places.js';
import { mercView, partyView } from '../src/core/party.js';
import { exhibitView } from '../src/core/sculpt.js';
import { fameOf } from '../src/core/social.js';
import { passPhase } from './_time.js';

const make = (seed = 'me') => { const s = createGame({ name: '밥', origin: 'bard', rolled: rollDice('same'), seed }); s.silver = 500; return s; };
const passDay = (s) => { for (let i = 0; i < 3; i++) { passPhase(s); s.full = 80; } };

test('훈련소 2번 칸이 용병. 주점에서는 구하지 않는다', () => {
  const s = make();
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(slotsNow(s)[1].label, '용병');
  assert.ok(placeById('training').merc && !placeById('tavern').merc && placeById('guild').merc);
  s.place = 'tavern';
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire' }), /훈련소/);
});

test('용병 셋은 삯이 다르다. 동료는 둘까지, 바람결은 뒷줄에 선다', () => {
  const s = make('three');
  s.place = 'training';
  assert.deepEqual(mercView(s).map((m) => [m.name, m.fee]), [['가온', 60], ['바람결', 70], ['돌방패', 80]]);
  dispatch(s, { type: 'party', op: 'hire', id: 'windbow' });
  assert.equal(s.silver, 430);
  dispatch(s, { type: 'party', op: 'hire', id: 'stoneshield' });
  assert.equal(s.silver, 350);
  assert.equal(partyView(s)[0].rowName, '뒷줄');
  assert.equal(partyView(s)[1].role, '막는 사람');
  assert.equal(mercView(s)[0].why, '동료는 2명까지');
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'gaon' }), /2명까지/);
  dispatch(s, { type: 'party', op: 'row', id: 'windbow', row: 'front' });
  dispatch(s, { type: 'party', op: 'row', id: 'windbow', row: 'back' });
  assert.equal(partyView(s)[0].rowName, '뒷줄');
});

test('광장 3번 칸이 전시. 받침대는 셋, 내리고 다시 세워도 명성은 작품마다 한 번', () => {
  const s = make('ex');
  for (let i = 1; i <= 4; i++) s.works.push({ no: i, subject: 'rabbit', grade: i === 4 ? 4 : 2, day: 1, where: 'bag', maker: '밥' });
  dispatch(s, { type: 'move', to: 'plaza' });
  assert.equal(slotsNow(s)[2].label, '전시');
  for (const no of [1, 2, 3]) dispatch(s, { type: 'work', op: 'place', no });
  assert.equal(exhibitView(s).empty, 0);
  assert.throws(() => dispatch(s, { type: 'work', op: 'place', no: 4 }), /빈 받침대/);
  passDay(s);
  const f = fameOf(s);
  assert.ok(f > 0, '세운 다음 날 셋 다 명성');
  assert.ok(exhibitView(s).shown.every((w) => w.famed));
  dispatch(s, { type: 'move', to: 'plaza' });
  dispatch(s, { type: 'work', op: 'unplace', no: 1 });
  assert.equal(s.works[0].where, 'bag');
  dispatch(s, { type: 'work', op: 'place', no: 4 });
  assert.equal(statueOf(s).grade, 4, '띠에는 가장 높은 등급');
  dispatch(s, { type: 'work', op: 'unplace', no: 2 });
  dispatch(s, { type: 'work', op: 'place', no: 1 });
  passDay(s);
  const g = fameOf(s);
  assert.ok(g > f, '새로 세운 대작만 오른다');
  dispatch(s, { type: 'move', to: 'plaza' });
  dispatch(s, { type: 'work', op: 'admire', no: 1 });
  assert.ok(s.buffs.admire);
});
