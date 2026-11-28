// 여정 (M5-8): 도현 1, 서진 7, 덕수 7단계.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, enemyView, canChooseJob } from '../src/core/game.js';
import { jobChoices, jobName, skillsNow } from '../src/core/jobs.js';
import { subView, offersOf } from '../src/core/quests.js';
import { standingName } from '../src/core/factions.js';
import { valueOf } from '../src/core/derived.js';

/** 레벨 5가 될 때까지 숲에서 싸운다. 예고를 읽고 막는다. 사람이 하듯 한 번에 하나씩. */
function toLevel5(s) {
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 40; i++) dispatch(s, { type: 'act', id: 'strike' });
  let n = 0;
  while (s.level < 5 && n++ < 6000) {
    s.full = 80;
    if (s.battle) { dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); continue; }
    if (s.choice) { dispatch(s, { type: 'choose', id: slotsNow(s)[0].action.id }); continue; }
    if (s.place === 'temple') { dispatch(s, { type: 'move', to: 'plaza' }); continue; }
    if (s.place !== 'forest') { if (s.hp < valueOf(s, 'maxHp') * 0.7) passPhase(s); else dispatch(s, { type: 'travel', to: 'forest' }); continue; }
    if (s.hp < valueOf(s, 'maxHp') * 0.4) { dispatch(s, { type: 'travel', to: 'plaza' }); continue; }
    if (s.unspent > 0) { dispatch(s, { type: 'spend', stat: s.unspent % 2 ? 'str' : 'con' }); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.equal(s.level >= 5, true, `레벨 ${s.level}`);
}

test('도현 1: 레벨 5가 되자 직업 고르기가 열리고, 전사를 고르자 단축 칸에 강타가 놓인다 (공격 스킬 먼저, Z126)', () => {
  const s = createGame({ name: '도현', origin: 'smithboy', spent: { str: 3, con: 2 }, seed: 'dohyun-1b' });
  assert.ok(!canChooseJob(s));
  toLevel5(s);
  while (s.battle) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' });
  assert.ok(canChooseJob(s), '레벨 5가 되면 고를 수 있다');
  const list = jobChoices(s);
  assert.equal(list.length, 5);
  assert.ok(list.find((j) => j.name === '전사').match, '치기를 가장 많이 했으니 전사가 맞는다');
  assert.equal(list.find((j) => j.name === '전사').first.name, '강타');
  if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  assert.equal(jobName(s), '전사');
  s.place = 'forest'; s.hp = valueOf(s, 'maxHp');
  s.battle = { mon: 'boar', hp: 60, turn: 1, intent: 'charge', stun: 0, weak: null, burn: 0, ward: null, streak: 0 }; s.status = [];
  assert.ok(slotsNow(s)[1].label.startsWith('강타'));
  const foeHp = s.battle.hp;
  dispatch(s, slotsNow(s)[1].action);
  assert.ok(!s.battle || s.battle.hp < foeHp, '강타로 멧돼지를 쳤다');
});

test('서진 7: 레벨 5가 되어 직업 고르기를 훑어보고 "아직 고르지 않는다"를 누른다', () => {
  const s = createGame({ name: '서진', origin: 'smithboy', spent: { str: 3, con: 2 }, seed: 'seojin-7' });
  toLevel5(s);
  while (s.battle) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' });
  if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
  assert.ok(s.unspent >= 0);
  assert.equal(jobChoices(s).length, 5);
  dispatch(s, { type: 'career', op: 'skip' });
  assert.equal(jobName(s), '무직');
  assert.ok(canChooseJob(s), '나중에 다시 열 수 있다');
  assert.deepEqual(skillsNow(s), []);
  assert.equal(s.main.chapter, 1, '직업을 고르지 않았으니 싸우는 길은 아직 끝나지 않았다');
});

test('덕수 7: 광산에서 조합장 편에 서자 광부 조합이 오르고 상단이 내린다. 고르기 전에 결과가 보인다', () => {
  const s = createGame({ name: '덕수', origin: 'farmer', spent: { con: 3, str: 2 }, seed: 'deoksu-7' });
  dispatch(s, { type: 'move', to: 'training' });
  s.level = 6; s.stats.str += 8; s.stats.con += 8; s.hp = valueOf(s, 'maxHp'); // 광산을 다닐 만큼 큰 뒤라고 친다
  let n = 0;
  while (s.place !== 'mine' && n++ < 30) { if (s.battle) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); else if (s.place === 'temple') dispatch(s, { type: 'move', to: 'plaza' }); else dispatch(s, { type: 'travel', to: 'mine' }); }
  while (s.battle) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' });
  assert.equal(s.place, 'mine');
  dispatch(s, { type: 'greet', npc: 'foreman' });
  assert.deepEqual(offersOf(s, 'foreman'), ['vein']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'vein' });
  const c = subView(s, 'vein').step.choices.find((x) => x.id === 'miners');
  assert.ok(c.fx.includes('광부 조합 오름') && c.fx.includes('상단 내림'), '고르기 전에 결과가 보인다');
  dispatch(s, { type: 'quest', op: 'choose', id: 'vein', choice: 'miners' });
  assert.equal(standingName(s, 'miners'), '단골');
  assert.equal(standingName(s, 'merchants'), '미움');
});
