// 먹잇감 냄새 (Z64): 돕지 않고 지나친 짐승을 노리는 굶주린 포식자
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, mapView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { foeDef } from '../src/core/battle.js';
import { monsterDef } from '../src/data/monsters.js';
import { fadeScent } from '../src/core/explore.js';
import { HUNGRY, SCENT_TRIES } from '../src/data/wild.js';

const make = (seed, place) => {
  const s = createGame({ name: '냄', origin: 'bard', rolled: rollDice('same'), seed });
  s.place = place; s.dex.places[place] = true;
  return s;
};
const meet = (s, id, opt) => { s.choice = { kind: 'incident', id, place: s.place }; dispatch(s, { type: 'choose', id: opt }); };

test('여우를 지나치면 숲에 냄새가 남고, 탐색 세 번 안에 반드시 굶주린 숲 늑대가 온다', () => {
  for (let k = 0; k < 20; k++) {
    const s = make('sc' + k, 'forest');
    meet(s, 'fox', 'leave');
    assert.equal(s.scent.forest.mon, 'wolf');
    assert.equal(mapView(s).find((r) => r.id === 'forest').scent, true);
    let n = 0;
    while (!s.battle?.hungry && n < SCENT_TRIES) {
      s.full = 100; s.tired = 0; s.battle = null; s.choice = null; // 그 사이 다른 일(여느 싸움·사건)은 걷어 낸다
      dispatch(s, { type: 'act', id: 'explore' }); n++;
    }
    assert.ok(s.battle, `${k}: 세 번 안에 왔다`);
    assert.equal(s.battle.mon, 'wolf');
    assert.equal(s.battle.hungry, true);
    assert.equal(s.scent.forest, undefined, '한 번 싸우면 걷힌다');
    const m = foeDef(s.battle);
    const base = monsterDef('wolf');
    assert.equal(m.name, '굶주린 숲 늑대');
    assert.equal(m.hp, Math.round(base.hp * HUNGRY.hp));
    assert.equal(m.attack, Math.round(base.attack * HUNGRY.attack));
    assert.equal(m.xp, base.xp * HUNGRY.xp);
  }
});

test('도와주면 냄새가 없고, 둥지의 알을 가져가도 냄새가 남는다', () => {
  const s = make('help', 'forest');
  meet(s, 'fox', 'free');
  assert.equal(s.scent.forest, undefined);
  const r = make('egg', 'reeds');
  meet(r, 'nest', 'take');
  assert.equal(r.scent.reeds.mon, 'reedsnake');
  const v = make('net', 'river');
  meet(v, 'net', 'leave');
  assert.equal(v.scent.river.mon, 'reedsnake');
  const b = make('bat', 'mine');
  meet(b, 'batlings', 'leave');
  assert.equal(b.scent.mine.mon, 'spider');
});

test('냄새는 하루(세 때)가 지나면 걷힌다', () => {
  const s = make('fade', 'forest');
  meet(s, 'fox', 'leave');
  s.phase = (s.phase + 2) % 3; s.day += s.phase < 2 ? 1 : 0;
  fadeScent(s);
  assert.ok(s.scent.forest, '두 때 뒤에는 남아 있다');
  s.day += 1;
  fadeScent(s);
  assert.equal(s.scent.forest, undefined);
});
