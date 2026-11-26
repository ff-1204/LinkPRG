// 싸우다 잠들면 쓰러진다 (Z65)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { startBattle } from '../src/core/battle.js';
import { TIRED_MAX } from '../src/core/derived.js';

const make = (seed) => {
  const s = createGame({ name: '졸', origin: 'bard', rolled: rollDice('same'), seed });
  s.place = 'forest';
  return s;
};

test('피로가 끝까지 찬 채 싸우면 잠들어 쓰러진다', () => {
  const s = make('d1');
  startBattle(s, [], 'rat');
  s.tired = TIRED_MAX;
  const falls = s.falls;
  const ev = dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.battle, null);
  assert.equal(s.falls, falls + 1);
  assert.ok(ev.some((e) => e.type === 'fall'));
  assert.ok(s.log.some((l) => /그 자리에서 잠들었다/.test(l.text)));
});

test('싸우는 중 졸음이 오면 쓰러진다. 싸우지 않을 때의 졸음은 지금처럼 곯아떨어진다', () => {
  const s = make('d2');
  startBattle(s, [], 'rat');
  s.flags.doze = true; s.tired = 95;
  const falls = s.falls;
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.falls, falls + 1);
  const t = make('d3');
  t.place = 'plaza'; t.flags.doze = true; t.tired = 95;
  const tf = t.falls;
  dispatch(t, { type: 'act', id: 'look' });
  assert.equal(t.falls, tf, '싸우지 않을 때는 쓰러지지 않는다');
});

test('피로가 낮으면 싸움은 그대로 이어진다', () => {
  const s = make('d4');
  startBattle(s, [], 'passbear');
  s.tired = 50;
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.ok(s.battle);
});
