// 몸을 쓰는 일 (Z61): 풀무질 체력, 치기 힘, 기도 지혜, 물건 살피기 민첩이 1% 확률로 1 오른다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, TOIL_STATS, TOIL_STAT_RATE } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { roll01 } from '../src/core/rng.js';

const make = (seed = 'ts') => createGame({ name: '단', origin: 'bard', rolled: rollDice('same'), seed });

test('일마다 맞는 능력치만, 굴림대로 오른다', () => {
  assert.equal(TOIL_STAT_RATE, 0.01);
  assert.deepEqual(Object.fromEntries(Object.entries(TOIL_STATS).map(([k, v]) => [k, v.stat])), { bellows: 'con', strike: 'str', pray: 'wis', sort: 'agi', spin: 'agi', trim: 'con' });
  const s = make();
  // 몇 번째에 오르는지 굴림으로 미리 센다: 그 수만큼만 오른다
  const n = 400;
  const want = Array.from({ length: n }, (_, i) => roll01(`${s.seed}|toilstat|strike|${i + 1}`) < TOIL_STAT_RATE).filter(Boolean).length;
  assert.ok(want > 0);
  dispatch(s, { type: 'move', to: 'training' });
  const before = { ...s.stats };
  s.counters.act.strike = 0;
  for (let i = 0; i < n; i++) {
    s.full = 100; s.tired = 0; s.hp = 999; // 배고픔·피로로 멈추지 않게
    dispatch(s, { type: 'act', id: 'strike' });
  }
  assert.equal(s.stats.str - before.str, want);
  assert.equal(s.stats.agi, before.agi);
  assert.equal(s.stats.con, before.con);
  assert.equal(s.stats.wis, before.wis);
  assert.equal(s.log.filter((l) => l.text === TOIL_STATS.strike.text).length > 0, true);
});

test('다른 일(둘러보기)로는 오르지 않는다', () => {
  const s = make('ts2');
  const before = { ...s.stats };
  for (let i = 0; i < 300; i++) { s.full = 100; s.tired = 0; dispatch(s, { type: 'act', id: 'look' }); }
  assert.deepEqual(s.stats, before);
});
