// 공격 스킬 먼저, 2·3·4차 스킬, 스킬 장착 세 칸 (Z126, Z127)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { JOBS, JOB_ORDER, ADVANCED, TIER3, TIER4 } from '../src/data/jobs.js';
import { skillsNow, loadoutOf, jobName, promoteView, adv } from '../src/core/jobs.js';
import { gainXp, xpToNext } from '../src/core/level.js';
import { startBattle } from '../src/core/battle.js';
import { valueOf } from '../src/core/derived.js';

const make = (seed = 't') => createGame({ name: '전직', origin: 'farmer', rolled: rollDice(seed), seed });
const toLevel = (s, n) => { while (s.level < n) gainXp(s, xpToNext(s.level)); };
const atCraft = (s) => { s.place = 'craftrow'; };
const fight = (s, mon = 'boar') => { s.hp = valueOf(s, 'maxHp'); s.mp = valueOf(s, 'maxMp'); startBattle(s, [], mon); s.battle.hp = 99999; s.battle.intent = 'bite'; };

test('1차의 첫 스킬은 공격이고, 2·3·4차는 공격·직업·효과·궁극을 갖는다', () => {
  for (const id of JOB_ORDER) assert.equal(JOBS[id].skills[0].kind, 'atk', id);
  for (const [id, a] of Object.entries(ADVANCED)) {
    assert.deepEqual(a.skills.map((x) => x.kind), ['atk', 'job'], id);
    assert.equal(TIER3[id].skills[0].kind, 'atk'); assert.ok(TIER3[id].pas && TIER3[id].pasName);
    assert.deepEqual(TIER4[id].skills.map((x) => x.kind), ['atk', 'ult'], id);
    assert.ok(TIER4[id].skills[1].once, '궁극은 한 싸움에 한 번');
  }
});

test('2차 전직: 공격 스킬은 전직한 때(레벨 20), 직업 스킬은 레벨 30에 열린다. 3·4차는 50·80에 장인 거리에서', () => {
  const s = make('adv');
  toLevel(s, 20);
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  dispatch(s, { type: 'respec', keep: true });
  atCraft(s);
  dispatch(s, { type: 'advance', id: 'knight' });
  const open = () => skillsNow(s).filter((x) => x.open).map((x) => x.id);
  assert.ok(open().includes('shieldbash'));
  assert.ok(!open().includes('guardstance'));
  toLevel(s, 30);
  assert.ok(open().includes('guardstance'));
  assert.equal(promoteView(s).tier, 3);
  assert.throws(() => dispatch(s, { type: 'promote' }), /레벨 50/);
  toLevel(s, 50);
  const hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'promote' });
  assert.equal(jobName(s), '성문 기사');
  assert.equal(valueOf(s, 'maxHp'), hp + 80, '굳은 성문: 최대 생명력 +80');
  assert.ok(Math.abs(adv(s).guard - 0.2) < 1e-9);
  toLevel(s, 80);
  dispatch(s, { type: 'promote' });
  assert.equal(jobName(s), '수호 기사단장');
  assert.ok(open().includes('unbroken'));
  assert.throws(() => dispatch(s, { type: 'promote' }), /마지막 전직/);
});

test('스킬은 셋까지 장착하고, 싸움에서는 장착한 것만 쓰며, 싸우는 동안에는 바꿀 수 없다', () => {
  const s = make('load');
  toLevel(s, 20);
  dispatch(s, { type: 'career', op: 'choose', id: 'mage' });
  dispatch(s, { type: 'respec', keep: true });
  assert.deepEqual(loadoutOf(s), ['ember', 'frost', 'bolt'], '열린 차례로 셋');
  assert.throws(() => dispatch(s, { type: 'loadout', op: 'add', id: 'veil' }), /3개까지/);
  dispatch(s, { type: 'loadout', op: 'remove', id: 'frost' });
  dispatch(s, { type: 'loadout', op: 'add', id: 'veil' });
  assert.deepEqual(loadoutOf(s), ['ember', 'bolt', 'veil']);
  fight(s);
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'frost' }), /장착하지 않은/);
  assert.throws(() => dispatch(s, { type: 'loadout', op: 'remove', id: 'veil' }), /싸우는 중/);
  assert.equal(slotsNow(s)[1].sub, '3가지 가운데 고른다');
});

test('새로 열린 스킬은 빈 칸이 있으면 저절로 장착되고, 다 찼으면 알린다', () => {
  const s = make('auto');
  toLevel(s, 5);
  dispatch(s, { type: 'career', op: 'choose', id: 'rogue' });
  dispatch(s, { type: 'respec', keep: true });
  assert.deepEqual(loadoutOf(s), ['backstab']);
  toLevel(s, 20);
  const ev = dispatch(s, { type: 'move', to: 'training' });
  assert.deepEqual(loadoutOf(s), ['backstab', 'flurry', 'smoke']);
  assert.ok(ev.some((e) => e.type === 'line' && /다리 후리기.*장착할 수 있다/.test(e.line.text)));
});

test('궁극은 한 싸움에 한 번, 새 효과들이 듣는다', () => {
  const s = make('ult');
  toLevel(s, 80);
  dispatch(s, { type: 'career', op: 'choose', id: 'rogue' });
  dispatch(s, { type: 'respec', keep: true });
  atCraft(s);
  dispatch(s, { type: 'advance', id: 'shadow' });
  dispatch(s, { type: 'promote' }); dispatch(s, { type: 'promote' });
  dispatch(s, { type: 'loadout', op: 'remove', id: 'flurry' });
  dispatch(s, { type: 'loadout', op: 'add', id: 'twinshadow' });
  fight(s);
  dispatch(s, { type: 'battle', choice: 'skill', index: 'twinshadow' });
  assert.ok(s.battle.twin > 0);
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'twinshadow' }), /이미 썼습니다/);
  // 잠복: 두 턴 맞지 않는다
  const t = make('lurk');
  toLevel(t, 30);
  dispatch(t, { type: 'career', op: 'choose', id: 'rogue' });
  dispatch(t, { type: 'respec', keep: true });
  atCraft(t);
  dispatch(t, { type: 'advance', id: 'shadow' });
  dispatch(t, { type: 'loadout', op: 'remove', id: 'flurry' });
  dispatch(t, { type: 'loadout', op: 'add', id: 'lurk' });
  fight(t);
  const hp = t.hp;
  dispatch(t, { type: 'battle', choice: 'skill', index: 'lurk' });
  dispatch(t, { type: 'battle', choice: 'defend' });
  assert.equal(t.hp, hp, '잠복한 두 턴은 맞지 않는다');
});

test('직업 고르기 카드: 내 출신의 어울리는 직업에 "내 출신하고 맞음"과 인연 (Z128)', async () => {
  const { jobChoices } = await import('../src/core/jobs.js');
  const s = createGame({ name: '출신', origin: 'emberkeeper', rolled: rollDice('om'), seed: 'om' });
  const list = jobChoices(s);
  assert.deepEqual(list.filter((j) => j.origin).map((j) => j.id), ['mage']);
  assert.match(list.find((j) => j.id === 'mage').bond, /화염구와 얼음 창/);
  const plain = createGame({ name: '출신', origin: 'farmer', rolled: rollDice('om2'), seed: 'om2' });
  assert.equal(jobChoices(plain).some((j) => j.origin), false, '어느 직업과도 묶이지 않은 출신');
});
