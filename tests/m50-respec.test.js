// 스탯 다시 찍기, 주 스탯 보너스, 사제의 행운 (Z116)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { gainXp, xpToNext } from '../src/core/level.js';
import { respecView, mainParts, mainMult, luckOf, guessLvPts, priestOpen } from '../src/core/statplan.js';
import { jobChoices } from '../src/core/jobs.js';
import { buffRows } from '../src/core/buffs.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { migrate } from '../src/core/migrate.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { valueOf } from '../src/core/derived.js';
import { PRIEST_LOCK } from '../src/data/statinfo.js';

const fresh = (seed = 'rs') => createGame({ name: '찍기', origin: 'hunter', rolled: rollDice(seed), seed });
const toLevel5 = (s) => { while (s.level < 5) gainXp(s, xpToNext(s.level)); };

test('레벨로 받은 점수는 찍은 자리가 남고, 직업을 고르면 한 번 다시 찍는다', () => {
  const s = fresh();
  const born = { ...s.stats };
  toLevel5(s);
  assert.equal(s.unspent, 12);
  for (let i = 0; i < 10; i++) dispatch(s, { type: 'spend', stat: 'str' });
  assert.deepEqual(s.lvPts, { str: 10, agi: 0, con: 0, wis: 0 });
  assert.equal(s.respec, null, '직업을 고르기 전에는 없다');
  dispatch(s, { type: 'career', op: 'choose', id: 'archer' });
  assert.equal(s.respec, 'open');
  const v = respecView(s);
  assert.equal(v.pool, 12, '찍은 10과 남은 2');
  assert.deepEqual(v.floor, born, '처음 값은 그대로다');
  assert.deepEqual(v.main, ['agi']);
  // 다 나누지 않으면 정하지 못한다
  assert.throws(() => dispatch(s, { type: 'respec', alloc: { agi: 11 } }), /모두 나눠야/);
  dispatch(s, { type: 'respec', alloc: { agi: 12 } });
  assert.equal(s.stats.agi, born.agi + 12);
  assert.equal(s.stats.str, born.str);
  assert.equal(s.unspent, 0);
  assert.equal(s.respec, 'done');
  assert.ok(s.hp <= valueOf(s, 'maxHp'));
  assert.throws(() => dispatch(s, { type: 'respec', keep: true }), /다시 찍을 수 없습니다/, '한 번뿐이다');
});

test('전에 찍은 대로 두어도 그 한 번을 쓴 것이다', () => {
  const s = fresh('keep');
  toLevel5(s);
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  const before = { ...s.stats };
  dispatch(s, { type: 'respec', keep: true });
  assert.deepEqual(s.stats, before);
  assert.equal(s.respec, 'done');
});

test('주 스탯 10마다 피해 +2%, 직업이 없으면 없다', () => {
  const s = fresh('main');
  assert.equal(mainMult(s), 1);
  s.job = 'warrior'; s.stats.str = 37;
  assert.deepEqual(mainParts(s), [{ key: 'str', value: 37, pct: 6, next: 3 }]);
  assert.ok(Math.abs(mainMult(s) - 1.06) < 1e-9);
  s.job = 'rogue'; s.stats.agi = 50;
  assert.equal(mainParts(s)[0].pct, 10);
  s.job = 'mage'; s.stats.wis = 9;
  assert.equal(mainParts(s)[0].pct, 0);
});

test('사제는 행운을 찾은 사람만 고르고, 고르면 행운 +10과 신의 은총을 받는다. 지혜와 행운 둘 다 보너스다', () => {
  const s = fresh('pri');
  toLevel5(s);
  assert.equal(priestOpen(s), false);
  const card = jobChoices(s).find((j) => j.id === 'priest');
  assert.equal(card.lock, PRIEST_LOCK);
  assert.ok(!JSON.stringify(card).includes('행운'), '찾기 전에는 행운이라는 말이 없다');
  assert.throws(() => dispatch(s, { type: 'career', op: 'choose', id: 'priest' }), /아직 고를 수 없는/);
  s.hidden.luck = { value: 2, half: true };
  const open = jobChoices(s).find((j) => j.id === 'priest');
  assert.equal(open.lock, '');
  assert.match(open.perk, /행운 \+10/);
  dispatch(s, { type: 'career', op: 'choose', id: 'priest' });
  assert.equal(luckOf(s), 12);
  assert.equal(s.hidden.luck.value, 2, '저장에는 찾은 행운만 남는다');
  assert.equal(hiddenSlots(s).find((x) => x.id === 'luck').value, 12);
  assert.ok(buffRows(s).some((b) => b.name === '신의 은총'));
  s.stats.wis = 20;
  // 사제의 지혜는 10마다 +1% (Z117). 마법사는 +2%
  assert.deepEqual(mainParts(s).map((p) => [p.key, p.pct]), [['wis', 2], ['luck', 12]]);
  assert.ok(Math.abs(mainMult(s) - 1.02 * 1.12) < 1e-9);
  // 다시 태어나면 사제의 +10은 직업과 함께 내려놓는다
  const n = createGame({ name: '다음', origin: 'hunter', rolled: rollDice('pri2'), seed: 'pri2', carry: rebirthCarry(s) });
  assert.equal(luckOf(n), n.hidden.luck?.value || 0);
});

test('신의 은총: 희귀한 일을 절반의 확률로 한 번 더 센다', async () => {
  const s = fresh('grace');
  s.job = 'priest'; s.hidden.luck = { value: 1, half: true };
  // 들판에서 탐색을 거듭해 희귀한 일을 겪은 수와 센 수를 본다
  s.place = 'forest';
  let rare = 0;
  for (let i = 0; i < 400 && rare < 40; i++) {
    const before = s.counters.rare;
    s.tired = 0; s.full = 100; s.hp = valueOf(s, 'maxHp');
    try { dispatch(s, { type: 'act', id: 'explore' }); } catch { /* 밤이거나 막히면 넘어간다 */ }
    if (s.battle) { s.battle = null; s.choice = null; }
    if (s.choice) s.choice = null;
    if (s.counters.rare > before) rare += 1, (s.counters.rare - before === 2 ? (s.flags._twice = (s.flags._twice || 0) + 1) : 0);
    if (s.place !== 'forest') s.place = 'forest';
  }
  assert.ok(rare > 0, '희귀한 일을 겪었다');
  assert.ok((s.flags._twice || 0) > 0, '한 번 더 센 적이 있다');
});

test('옛 저장: 찍은 자리는 짐작하고, 직업이 있으면 한 번 다시 찍게 한다', () => {
  const s = fresh('old');
  toLevel5(s);
  for (let i = 0; i < 12; i++) dispatch(s, { type: 'spend', stat: i < 8 ? 'str' : 'con' });
  s.job = 'warrior';
  const real = { ...s.lvPts };
  delete s.lvPts; delete s.respec;
  const guess = guessLvPts(s);
  assert.equal(Object.values(guess).reduce((a, b) => a + b, 0), 12, '합은 정확하다');
  void real;
  const m = migrate({ ...JSON.parse(JSON.stringify(s)), v: 21 });
  assert.equal(m.respec, 'open');
  assert.equal(respecView(m).pool, 12);
});
