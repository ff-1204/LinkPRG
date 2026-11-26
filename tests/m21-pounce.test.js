// 먼저 덮치기(Z36)와 기척이 모험가일 때(Z37)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { caughtChance, caughtFeel, personChance, choiceView, HURT_FEE } from '../src/core/explore.js';
import { rumorsView } from '../src/core/world.js';
import { fameOf } from '../src/core/social.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const make = (seed = 'pc', origin = 'bard') => {
  const s = createGame({ name: '도리미', origin, rolled: rollDice('same'), seed });
  s.place = 'forest';
  return s;
};

test('들킬 확률: 25%에서 적 레벨·민첩·은신·지켜보기·덫놓이로 오르내린다. 5%~70%', () => {
  const s = make();
  s.level = 3; s.stats.agi = 12;
  // 멧돼지 레벨 5: 25 + 2×5 − 2 = 33%
  assert.equal(Math.round(caughtChance(s, 'boar', false) * 100), 33);
  assert.equal(Math.round(caughtChance(s, 'boar', true) * 100), 23, '지켜보면 10% 덜');
  s.hidden.stealth = { value: 2, half: true };
  assert.equal(Math.round(caughtChance(s, 'boar', true) * 100), 17);
  s.level = 30;
  assert.equal(caughtChance(s, 'boar', true), 0.05, '가장 낮게 5%');
  s.level = 1; s.stats.agi = 1; s.hidden = {};
  assert.ok(caughtChance(s, 'boar', false) <= 0.70);
  const t = make('trap', 'trapper'); t.level = 3; t.stats.agi = 12;
  assert.equal(Math.round(caughtChance(t, 'boar', false) * 100), 23, '덫놓이는 10% 덜');
  assert.deepEqual([0.1, 0.2, 0.5].map((p) => caughtFeel(p).text), ['자신 있다', '들킬지도 모른다', '들킬 것 같다']);
});

test('기척 창에 느낌이 보이고, 덮치다 들키면 적이 먼저 움직인다', () => {
  let caught = 0, clean = 0;
  for (let k = 0; k < 60; k++) {
    const s = make(`pk${k}`);
    s.level = 1; s.stats.agi = 6; s.hp = 999;
    s.choice = { kind: 'sense', mon: 'boar', watched: false };
    const v = choiceView(s);
    assert.ok(v.feel && v.feel.text);
    assert.ok(v.options.find((o) => o.id === 'pounce').sub.includes('들키면'));
    dispatch(s, { type: 'choose', id: 'pounce' });
    if (s.log.some((l) => l.text.includes('들켰다'))) { caught++; assert.ok(!s.log.some((l) => l.text.includes('먼저 덮쳤다'))); }
    else { clean++; assert.ok(s.log.some((l) => l.text.includes('먼저 덮쳤다'))); }
  }
  assert.ok(caught > 0 && clean > 0, `들킴 ${caught}, 덮침 ${clean}`);
});

test('기척이 모험가일 확률은 그곳 유저 수 × 1%, 많아야 15%', () => {
  const s = make();
  assert.ok(personChance(s) > 0 && personChance(s) <= 0.15);
  s.place = 'plaza'; s.phase = 1;
  assert.ok(personChance(s) <= 0.15);
});

test('지켜보면 사람인 줄 알고 그냥 지나간다. 지켜보지 않고 덮치면 사람을 친다', () => {
  const s = make('pw');
  s.choice = { kind: 'sense', mon: 'boar', watched: false, person: '은여우' };
  dispatch(s, { type: 'choose', id: 'watch' });
  const v = choiceView(s);
  assert.equal(v.side, '사람이었다');
  assert.deepEqual(v.options.map((o) => o.id), ['greet', 'leave']);
  dispatch(s, { type: 'choose', id: 'greet' });
  assert.equal(s.choice, null);
  assert.equal(s.battle, null, '싸움이 나지 않는다');

  // 치료비를 낸다
  const p = make('pay'); p.level = 4; p.silver = 100;
  p.choice = { kind: 'sense', mon: 'boar', watched: false, person: '은여우' };
  dispatch(p, { type: 'choose', id: 'pounce' });
  assert.equal(p.choice.kind, 'hurt');
  assert.equal(p.battle, null);
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: p })).state;
  assert.equal(back.choice.kind, 'hurt', '저장해도 남는다');
  dispatch(p, { type: 'choose', id: 'pay' });
  assert.equal(p.silver, 100 - 4 * HURT_FEE);
  assert.equal(p.choice, null);

  // 모자라면 가진 만큼 내고 명성이 깎인다
  const q = make('poor'); q.level = 4; q.silver = 7; q.fame['시작 마을'] = 30;
  q.choice = { kind: 'hurt', mon: 'boar', person: '은여우' };
  dispatch(q, { type: 'choose', id: 'pay' });
  assert.equal(q.silver, 0);
  assert.equal(fameOf(q, '시작 마을'), 25);

  // 달아나면 명성 −20, 소문에 내 이름이 오른다
  const r = make('run'); r.fame['시작 마을'] = 50; r.silver = 100;
  r.choice = { kind: 'hurt', mon: 'boar', person: '은여우' };
  dispatch(r, { type: 'choose', id: 'run' });
  assert.equal(r.silver, 100);
  assert.equal(fameOf(r, '시작 마을'), 30);
  assert.ok(rumorsView(r).some((x) => x.id === 'hitrun' && x.text.includes("'도리미'")));
});
