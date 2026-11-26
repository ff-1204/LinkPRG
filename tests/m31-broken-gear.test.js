// 내구도 0인 장비 (Z69): 차고 있어도 효과 없이 스탯으로만 셈한다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { derived } from '../src/core/derived.js';
import { makeItem } from '../src/core/inventory.js';
import { goPlaces } from '../src/core/quests.js';

const make = () => createGame({ name: '부', origin: 'bard', rolled: rollDice('same'), seed: 'bk' });
const val = (s, id) => derived(s).find((d) => d.id === id).value;

test('무기와 방어구가 부서지면 공격·방어가 스탯만큼으로 돌아간다', () => {
  const s = make();
  s.equip.weapon = makeItem('ironsword');
  s.equip.off = makeItem('oldshield');
  const atk = val(s, 'attack'), def = val(s, 'defense');
  s.equip.weapon.dur = 0; s.equip.off.dur = 0;
  const bare = make(); bare.equip.weapon = null; bare.equip.off = null;
  assert.ok(val(s, 'attack') < atk && val(s, 'defense') < def);
  assert.equal(val(s, 'attack'), val(bare, 'attack'));
});

test('의뢰의 바로가기는 들판만 가리킨다 (Z67)', () => {
  const go = goPlaces({ kind: 'hunt', mon: 'wolf' }, make());
  assert.ok(go.length >= 1 && go.every((g) => g.id && g.name));
  assert.deepEqual(goPlaces({ where: '아무 데' }, make()), []);
});
