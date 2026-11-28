// 먹을 것을 두고 주린 배로 드린 기도: 칭호 "절제하는 자"가 사제를 연다 (Z131, Z133), 자동 먹기 설정 (Z131)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { priestOpen, FAST_PRAY_LINE } from '../src/core/statplan.js';
import { jobChoices } from '../src/core/jobs.js';
import { gainXp, xpToNext } from '../src/core/level.js';
import { countOf, addItem } from '../src/core/inventory.js';
import { hasTitle } from '../src/core/titles.js';
import { rebirthCarry } from '../src/core/rebirth.js';

const make = (seed) => { const s = createGame({ name: '기도', origin: 'farmer', rolled: rollDice(seed), seed }); s.place = 'temple'; s.bag = []; return s; };
const said = (ev) => ev.some((e) => e.type === 'line' && e.line.text === FAST_PRAY_LINE);
const pray = (s, opts) => dispatch(s, { type: 'act', id: 'pray' }, opts);

test('먹을 것을 지닌 채 포만도 0으로 기도하면 칭호 "절제하는 자"를 얻고 사제가 열린다', () => {
  const s = make('fp');
  s.full = 0;
  pray(s, { autoEat: false });
  assert.equal(priestOpen(s), false, '빈 가방으로 굶는 것만으로는 열리지 않는다');
  addItem(s, 'bread', 1);
  s.full = 30;
  pray(s, { autoEat: false });
  assert.equal(priestOpen(s), false, '배가 차 있으면 열리지 않는다');
  s.full = 0;
  assert.ok(said(pray(s, { autoEat: false })));
  assert.ok(hasTitle(s, 'abstainer'));
  assert.equal(priestOpen(s), true);
  s.full = 0;
  assert.ok(!said(pray(s, { autoEat: false })), '두 번째는 말이 없다');
});

test('자동 먹기를 켜 둔 채라도, 기도를 마친 그때 포만도 0이면 먹기 전에 먼저 본다', () => {
  const s = make('on');
  addItem(s, 'bread', 1);
  s.full = 0;
  pray(s);
  assert.ok(hasTitle(s, 'abstainer'));
  assert.equal(countOf(s, 'bread'), 0, '그 뒤 저절로 먹었다');
});

test('칭호는 환생해도 남아 사제가 열려 있고, 기도할 때 숙련도가 더 오른다', () => {
  const s = make('keep');
  addItem(s, 'bread', 1); s.full = 0; pray(s, { autoEat: false });
  const n = createGame({ name: '새', origin: 'farmer', rolled: rollDice('keep2'), seed: 'keep2', carry: rebirthCarry(s) });
  assert.equal(priestOpen(n), true);
  const a = make('xp'); const b = make('xp');
  b.titles.push({ id: 'abstainer', day: 1 });
  a.full = 80; b.full = 80;
  pray(a); pray(b);
  assert.ok(Math.abs(b.skills.pray.xp / a.skills.pray.xp - 1.05) < 1e-9);
});

test('칭호로 연 사제 카드: 행운을 찾기 전에는 "행운"이라는 말이 없고 "종이 울렸다"', () => {
  const s = make('card');
  while (s.level < 5) gainXp(s, xpToNext(s.level));
  s.titles.push({ id: 'abstainer', day: 1 });
  const card = jobChoices(s).find((j) => j.id === 'priest');
  assert.equal(card.lock, '');
  assert.equal(card.rang, true);
  assert.equal(card.perk, '고르면: 버프 "신의 은총"');
  assert.ok(!JSON.stringify(card).includes('행운'));
});

test('자동 먹기를 끄면 포만도가 0이어도 가방의 먹을 것을 먹지 않는다. 켜면(처음 값) 먹는다', () => {
  const run = (seed, opts) => {
    const s = make(seed); s.place = 'training'; s.full = 1; addItem(s, 'riceball', 2);
    for (let i = 0; i < 20 && countOf(s, 'riceball') === 2; i++) { s.tired = 0; dispatch(s, { type: 'act', id: 'strike' }, opts); }
    return countOf(s, 'riceball');
  };
  assert.equal(run('off', { autoEat: false }), 2, '꺼 두면 먹지 않는다');
  assert.equal(run('on'), 1, '처음 값은 켬');
});
