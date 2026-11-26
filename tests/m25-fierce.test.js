// 사나움 (Z60): 세계의 날마다 괴물이 0.05%씩 세지고, 경험치·떨굼도 같이 오른다. 끝이 없다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, enemyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { startBattle, foeDef, fierceOf } from '../src/core/battle.js';
import { monsterDef, MONSTERS } from '../src/data/monsters.js';

const make = (day) => { const s = createGame({ name: '사', origin: 'bard', rolled: rollDice('same'), seed: 'fc' }); s.day = day; return s; };

test('1일째는 그대로, 하루 0.05%씩, 끝이 없다', () => {
  assert.equal(fierceOf(1), 1);
  assert.equal(fierceOf(101), 1.05);
  assert.equal(fierceOf(1001), 1.5);
  assert.equal(fierceOf(10001), 6);
});

test('싸움이 시작된 날의 세기로 생명·공격·경험치·떨굼이 오르고, 방어와 수준은 그대로', () => {
  const s = make(1001);
  startBattle(s, [], 'wolf');
  const base = monsterDef('wolf');
  const m = foeDef(s.battle);
  assert.equal(s.battle.hp, Math.round(base.hp * 1.5));
  assert.equal(m.hp, Math.round(base.hp * 1.5));
  assert.equal(m.attack, Math.round(base.attack * 1.5));
  assert.equal(m.xp, Math.round(base.xp * 1.5));
  assert.equal(m.defense, base.defense);
  assert.equal(m.level, base.level);
  base.drops.forEach((d, i) => assert.equal(m.drops[i].p, Math.min(1, d.p * 1.5)));
  assert.equal(enemyView(s).fierce, 50);
  s.day = 5000; // 싸우는 사이 날이 가도 그 싸움은 시작한 날의 값
  assert.equal(foeDef(s.battle).hp, Math.round(base.hp * 1.5));
});

test('우두머리도 세지고, 1일째 싸움에는 사나움이 붙지 않는다', () => {
  const boss = Object.keys(MONSTERS).find((id) => MONSTERS[id].boss);
  const s = make(201);
  startBattle(s, [], boss);
  assert.equal(s.battle.hp, Math.round(monsterDef(boss).hp * 1.1));
  const t = make(1);
  startBattle(t, [], 'rat');
  assert.equal(t.battle.fierce, undefined);
  assert.equal(enemyView(t).fierce, 0);
});
