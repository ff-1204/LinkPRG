// 모으다 덤빈다 (Z124)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, GATHER_AMBUSH } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';

const fresh = (seed) => createGame({ name: '채집', origin: 'farmer', rolled: rollDice(seed), seed });
const dig = (s, n, phase = 0) => {
  let fights = 0;
  for (let i = 0; i < n; i++) {
    s.phase = phase; s.tick = 0; s.full = 90; s.tired = 0; s.hp = 999;
    dispatch(s, { type: 'act', id: 'gather' });
    if (s.battle) { fights += 1; s.battle = null; s.choice = null; }
  }
  return fights;
};

test('숲에서 모으면 낮은 확률로 덤빈다. 낮 3%, 밤은 위험도가 올라 5%', () => {
  assert.deepEqual(GATHER_AMBUSH, { 낮음: 0.03, 보통: 0.05, 높음: 0.08 });
  const day = fresh('ga-day'); day.place = 'forest';
  const night = fresh('ga-night'); night.place = 'forest';
  const a = dig(day, 1500, 0), b = dig(night, 1500, 2);
  assert.ok(a > 1500 * 0.015 && a < 1500 * 0.05, `낮 ${a}/1500`);
  assert.ok(b > a, `밤이 더 잦다 (${b} > ${a})`);
});

test('모은 것은 먼저 가방에 들어가고, 덤비면 그 들판의 괴물과 싸운다', () => {
  const s = fresh('ga-bag'); s.place = 'forest';
  for (let i = 0; i < 400 && !s.battle; i++) { s.phase = 0; s.tick = 0; s.full = 90; s.tired = 0; dispatch(s, { type: 'act', id: 'gather' }); }
  assert.ok(s.battle, '언젠가 덤빈다');
  assert.ok(s.log.some((l) => /손을 멈췄다\. 무언가 다가온다/.test(l.text)));
});

test('약한 괴물은 덤비지 않고, 친화가 높으면 덤비지 않는다', () => {
  const strong = fresh('ga-strong'); strong.place = 'forest'; strong.level = 40; strong.job = 'warrior'; strong.jobAsked = true;
  assert.equal(dig(strong, 600), 0);
  const kind = fresh('ga-kind'); kind.place = 'forest'; kind.hidden.kind = { value: 10, half: true };
  assert.equal(dig(kind, 600), 0);
});

test('위험한 들판일수록 잘 모인다: 보통은 허탕 −5%p·둘 +5%, 높음은 −10%p·+10% (Z125)', async () => {
  const { GATHER_RICH } = await import('../src/core/explore.js');
  assert.deepEqual(GATHER_RICH.보통, { miss: 0.05, double: 0.05 });
  assert.deepEqual(GATHER_RICH.높음, { miss: 0.10, double: 0.10 });
  const yieldOf = (phase) => {
    const s = createGame({ name: '채집', origin: 'farmer', rolled: rollDice('rich'), seed: `rich-${phase}` });
    s.place = 'forest'; s.hidden.kind = { value: 10, half: true }; s.bag = [];
    let got = 0;
    for (let i = 0; i < 1500; i++) { s.phase = phase; s.tick = 0; s.full = 90; s.tired = 0; const n = s.bag.reduce((a, x) => a + (x.n || 1), 0); dispatch(s, { type: 'act', id: 'gather' }); got += s.bag.reduce((a, x) => a + (x.n || 1), 0) - n; s.skills.gathering = { grade: 0, xp: 0, uses: 0 }; }
    return got;
  };
  const day = yieldOf(0), night = yieldOf(2); // 숲: 낮 낮음, 밤 보통
  assert.ok(night > day * 1.05, `밤(보통)이 낮(낮음)보다 더 모인다 (${night} > ${day})`);
});
