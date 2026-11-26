// 잘못 덮친 모험가를 마저 친다 (Z72): 그 들판의 가장 센 짐승만큼. 이기면 빼앗고, 지면 죽는다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, enemyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { choiceView, duelMon } from '../src/core/explore.js';
import { fameOf } from '../src/core/social.js';
import { monsterDef } from '../src/data/monsters.js';
import { DUEL } from '../src/data/wild.js';
import { derived } from '../src/core/derived.js';
import { murderBuff, MURDER } from '../src/core/buffs.js';

const make = (seed = 'du') => {
  const s = createGame({ name: '도리미', origin: 'bard', rolled: rollDice('same'), seed });
  s.place = 'forest';
  s.choice = { kind: 'hurt', mon: 'rat', person: '은여우' };
  return s;
};

test('공격한다가 있고, 상대는 그 들판에서 가장 센 짐승만큼이다', () => {
  const s = make();
  const v = choiceView(s);
  assert.deepEqual(v.options.map((o) => o.id), ['pay', 'run', 'fight']);
  assert.equal(v.options[2].label, '공격한다');
  assert.equal(duelMon(s, 'rat'), 'boar');
  dispatch(s, { type: 'choose', id: 'fight' });
  const e = enemyView(s);
  assert.equal(e.name, "모험가 '은여우'");
  assert.equal(e.level, monsterDef('boar').level);
  assert.equal(e.maxHp, Math.round(monsterDef('boar').hp * DUEL.hp));
  assert.ok(['베기', '내려치기', '숨 고르기'].includes(e.next.name));
});

test('이기면 은화와 장비를 빼앗는다. 소문은 없고 살인의 추억이 이틀 붙는다. 사냥 수에는 들지 않는다', () => {
  const s = make('dw');
  s.fame['시작 마을'] = 50;
  s.silver = 0; // 치료비가 모자라도 공격할 수 있다
  assert.ok(!choiceView(s).options.find((o) => o.id === 'fight').disabled);
  dispatch(s, { type: 'choose', id: 'fight' });
  const silver = s.silver;
  const bag = s.bag.length;
  s.battle.hp = 1; s.hp = 9999;
  for (let i = 0; i < 5 && s.battle; i++) dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.battle, null);
  assert.ok(s.silver >= silver + monsterDef('boar').level * DUEL.silver[0], '은화를 빼앗는다');
  assert.ok(s.bag.length > bag, '장비가 들어온다');
  assert.equal(fameOf(s, '시작 마을'), 50, '본 사람이 없어 명성은 그대로');
  assert.equal(s.flags.hitRun, undefined);
  assert.ok(murderBuff(s));
  const atk = derived(s).find((d) => d.id === 'attack');
  assert.ok(atk.parts.some((p) => p.label.startsWith(MURDER.name) && p.value < 0), '공격력이 깎인다');
  s.day += MURDER.days;
  assert.equal(murderBuff(s), null, '이틀 뒤 같은 때에 풀린다');
  assert.ok(!(s.dex.mon.boar?.won), '멧돼지를 잡은 것으로 세지 않는다');
});

test('지면 죽는다(쓰러진다)', () => {
  const s = make('dl');
  dispatch(s, { type: 'choose', id: 'fight' });
  s.hp = 1;
  let fell = false;
  for (let i = 0; i < 20 && s.battle; i++) {
    const ev = dispatch(s, { type: 'battle', choice: 'defend' });
    if (ev.some((e) => e.type === 'fall')) fell = true;
  }
  assert.ok(fell);
});
