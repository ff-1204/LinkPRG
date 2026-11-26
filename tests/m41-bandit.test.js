// 도적 (Z90): 지닌 은화와 찬 장비가 눈에 띌수록 자주, 세게 온다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, enemyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { wealthOf, wealthFeel, banditChance, banditUp, choiceView } from '../src/core/explore.js';
import { monsterDef } from '../src/data/monsters.js';
import { BANDIT } from '../src/data/wild.js';

const make = (seed = 'bd') => { const s = createGame({ name: '부', origin: 'bard', rolled: rollDice('same'), seed }); s.place = 'forest'; return s; };

test('눈에 띄는 정도: 지닌 은화 + 찬 장비. 500부터 1000마다 1%p, 많아야 25%. 보관함은 세지 않는다', () => {
  const s = make();
  s.silver = 0; for (const k of Object.keys(s.equip)) s.equip[k] = null;
  assert.equal(banditChance(s), 0);
  assert.equal(wealthFeel(s), '눈에 띄지 않는다');
  s.silver = 3000;
  assert.ok(Math.abs(banditChance(s) - 0.03) < 1e-9);
  assert.equal(wealthFeel(s), '주머니가 두둑해 보인다');
  s.silver = 100000;
  assert.equal(banditChance(s), BANDIT.cap);
  s.store['시작 마을'] = { silver: 999999, items: [] };
  s.silver = 0;
  assert.equal(wealthOf(s), 0, '맡긴 것은 모른다');
});

test('도적을 만나면 셋 가운데 고른다. 내주면 10%를 내고 지나간다', () => {
  const s = make('pay'); s.silver = 5000;
  s.choice = { kind: 'bandit', mon: 'boar', up: banditUp(s), name: '외눈' };
  assert.deepEqual(choiceView(s).options.map((o) => o.id), ['fight', 'pay', 'run']);
  dispatch(s, { type: 'choose', id: 'pay' });
  assert.equal(s.silver, 4500);
  assert.equal(s.battle, null);
});

test('도적은 지닌 만큼 세다. 이기면 은화와 장비, 지면 은화의 30%를 잃는다', () => {
  const s = make('win'); s.silver = 8000;
  s.choice = { kind: 'bandit', mon: 'boar', up: banditUp(s), name: '외눈' };
  dispatch(s, { type: 'choose', id: 'fight' });
  const e = enemyView(s);
  assert.equal(e.name, "도적 '외눈'");
  assert.equal(e.level, monsterDef('boar').level + 8);
  const silver = s.silver, bag = s.bag.length;
  s.battle.hp = 1; s.hp = 9999;
  for (let i = 0; i < 5 && s.battle; i++) dispatch(s, { type: 'battle', choice: 'attack' });
  assert.ok(s.silver > silver && s.bag.length > bag);
  assert.equal(s.buffs?.murder, undefined, '살인의 추억은 없다');

  const t = make('lose'); t.silver = 1000;
  t.choice = { kind: 'bandit', mon: 'boar', up: banditUp(t), name: '외눈' };
  dispatch(t, { type: 'choose', id: 'fight' });
  t.hp = 1;
  for (let i = 0; i < 20 && t.battle; i++) dispatch(t, { type: 'battle', choice: 'defend' });
  assert.ok(t.log.some((l) => l.text.includes('털어 갔다')));
  assert.ok(t.silver < 700);
});
