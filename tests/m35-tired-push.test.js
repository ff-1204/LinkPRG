// 피로 80 이상에서 일하면 숙련도가 1.5배 (Z75)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { jobXp, TIRED_PUSH } from '../src/core/jobs.js';
import { buffRows } from '../src/core/buffs.js';

const make = () => createGame({ name: '피', origin: 'bard', rolled: rollDice('same'), seed: 'tp' });

test('피로 80부터 1.5배, 79까지는 그대로, 싸우는 중은 빼고', () => {
  const s = make();
  s.tired = 79; const base = jobXp(s, 'strike');
  s.tired = 80; assert.equal(jobXp(s, 'strike'), base * TIRED_PUSH.xp);
  s.battle = { mon: 'rat' }; assert.equal(jobXp(s, 'strike'), base);
  s.battle = null;
  assert.ok(buffRows(s).some((r) => r.kind === '피로' && r.until === null), '상태창에 보인다');
  s.tired = 10;
  assert.ok(!buffRows(s).some((r) => r.kind === '피로'));
});

test('허수아비 치기: 지친 몸이 더 많이 오른다', () => {
  const gain = (tired) => {
    const s = make();
    dispatch(s, { type: 'move', to: 'training' });
    s.full = 100; s.tired = tired;
    dispatch(s, { type: 'act', id: 'strike' });
    return s.skills.strike.grade * 1e6 + s.skills.strike.xp;
  };
  assert.ok(gain(85) > gain(20));
});
