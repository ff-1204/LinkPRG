// 굶주림(Z38), 이름 부르기(Z39), 환생 때 숙련도 5%(Z32), 허겁지겁(Z40)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, bodyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { helloOf, callName, bondOf } from '../src/core/social.js';
import { rebirthCarry, skillTotal } from '../src/core/rebirth.js';
import { countOf, addItem } from '../src/core/inventory.js';

const make = (seed = 'b', name = '도리미', origin = 'bard') => createGame({ name, origin, rolled: rollDice('same'), seed });

test('포만감 0에서 배가 더 고파질 때마다 생명력이 2%씩 깎이고, 0이 되면 굶어 쓰러진다', () => {
  const s = make('starve');
  s.place = 'training'; s.full = 0; s.bag = [];
  const max = bodyView(s).maxHp;
  const before = s.hp;
  for (let i = 0; i < 10; i++) { s.tired = 0; s.flags.faint = false; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.ok(s.hp < before, '몸이 상했다');
  assert.ok(s.log.some((l) => l.text.includes('굶주림에 몸이 상한다')));
  assert.equal((before - s.hp) % Math.max(1, Math.round(max * 0.02)), 0, '한 번에 2%씩');
  // 생명력이 바닥나면 굶어 쓰러진다
  s.hp = 1; s.tired = 0;
  let fell = null;
  for (let i = 0; i < 20 && !fell; i++) { s.tired = 0; delete s.flags.faint; fell = dispatch(s, { type: 'act', id: 'strike' }).find((e) => e.type === 'fall'); }
  assert.ok(fell, '굶어 쓰러졌다');
  assert.equal(fell.info.starved, true);
  assert.ok(s.full >= 20, '깨면 묽은 죽 한 그릇');
  // 먹으면 깎이지 않는다
  const t = make('fed'); t.place = 'training'; t.full = 50;
  const hp = t.hp;
  for (let i = 0; i < 10; i++) dispatch(t, { type: 'act', id: 'strike' });
  assert.equal(t.hp, hp);
});

test('사람들은 낯익은 사이부터 제 말투로 내 이름을 부른다. 벗부터는 정다운 꼴', () => {
  const s = make('name');
  assert.equal(callName(s, 'instructor'), null, '남은 이름을 모른다');
  assert.ok(!helloOf(s, 'instructor').includes('도리미'));
  s.people.instructor = { pts: 10, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.equal(bondOf(s, 'instructor'), 1);
  assert.ok(helloOf(s, 'instructor').startsWith('도리미. '));
  s.people.instructor.pts = 70;
  assert.ok(helloOf(s, 'instructor').startsWith('도리미야, '), '벗은 정답게');
  s.people.agent = { pts: 10, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.ok(helloOf(s, 'agent').startsWith('도리미 님, '));
  // 받침이 있으면 "아"
  const t = make('name2', '서진');
  t.people.smith = { pts: 70, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.ok(helloOf(t, 'smith').startsWith('서진아, '));
  // 단골부터는 이야기 중에도 이따금 부른다
  t.people.granny = { pts: 30, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  t.place = 'store';
  let named = 0;
  for (let i = 0; i < 30; i++) {
    t.flags.spoke = { granny: t.day }; t.tick = i;
    dispatch(t, { type: 'talk', npc: 'granny' });
    if (t.log.at(-1).text.startsWith('서진,')) named++;
  }
  assert.ok(named > 0 && named < 30, `서른 번에 ${named}번`);
});

test('환생하면 숙련도마다 쌓은 경험치의 5%를 가지고 간다', () => {
  const s = make('skill');
  s.skills.strike = { grade: 10, xp: 50, uses: 900 };
  const total = skillTotal(s.skills.strike);
  const carry = rebirthCarry(s);
  assert.equal(carry.skills.strike, Math.floor(total * 0.05));
  const n = createGame({ name: '새', origin: 'bard', rolled: rollDice('same'), seed: 'n', carry });
  assert.equal(skillTotal(n.skills.strike), Math.floor(total * 0.05));
  assert.ok(n.skills.strike.grade >= 1);
});

test('배가 바닥나면 가방의 먹을 것을 허겁지겁 먹는다. 배를 가장 덜 채우는 것부터', () => {
  const s = make('gobble');
  s.place = 'training'; s.full = 1; s.bag = [];
  addItem(s, 'riceball', 2);
  for (let i = 0; i < 20 && countOf(s, 'riceball') === 2; i++) { s.tired = 0; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.equal(countOf(s, 'riceball'), 1, '하나를 먹었다');
  assert.ok(s.log.some((l) => l.text.includes('허겁지겁')));
  assert.ok(s.full > 5);
  assert.ok(!s.log.some((l) => l.text.includes('허기를 못 이기고')));
});
