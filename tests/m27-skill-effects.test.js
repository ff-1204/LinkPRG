// 숙련도 효과 (Z62): 효과는 글로만(수치 없이), 감정은 파는 값과 알아보기
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, identify, APPRAISE_KNOW } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { SKILL_EFFECTS, SKILL_NAMES } from '../src/core/skills.js';
import { sellPrice } from '../src/core/trade.js';
import { addItem, countOf } from '../src/core/inventory.js';

const make = (seed = 'se') => createGame({ name: '감', origin: 'bard', rolled: rollDice('same'), seed });

test('효과 글에는 숫자가 없다', () => {
  for (const [id, text] of Object.entries(SKILL_EFFECTS)) {
    assert.ok(SKILL_NAMES[id], `${id}는 숙련도 이름이 있다`);
    assert.doesNotMatch(text, /\d/, `${id} 효과에 숫자가 없다`);
  }
});

test('감정 등급마다 파는 값이 1%씩 오르고 상한이 없다', () => {
  const s = make();
  const item = { id: 'pearl', n: 1 };
  const base = sellPrice(item, s);
  s.skills.appraise = { grade: 20, xp: 0, uses: 0 };
  const at20 = sellPrice(item, s);
  assert.ok(at20 >= Math.floor(base * 1.2) && at20 <= Math.ceil((base + 1) * 1.2), `${base} → ${at20}`);
  s.skills.appraise.grade = 44;
  const at44 = sellPrice(item, s);
  assert.ok(at44 > at20 && at44 >= Math.floor(base * 1.44), `상한 없이 계속 오른다: ${at44}`);
});

test('감정 중급 1이 되면 이름 모를 조각칼을 알아보고, 그 뒤에 주운 것은 한눈에 알아본다', () => {
  const s = make('id');
  addItem(s, 'oddknife');
  s.skills.appraise = { grade: APPRAISE_KNOW - 1, xp: 0, uses: 0 };
  identify(s, []);
  assert.equal(countOf(s, 'oddknife'), 1, '중급 1 전에는 그대로');
  s.skills.appraise.grade = APPRAISE_KNOW;
  const ev = [];
  identify(s, ev);
  assert.equal(countOf(s, 'oddknife'), 0);
  assert.equal(countOf(s, 'carverknife'), 1);
  assert.ok(s.log.some((l) => /깎는 이의 칼/.test(l.text)));
  addItem(s, 'oddknife');
  dispatch(s, { type: 'act', id: 'look' });
  assert.equal(countOf(s, 'carverknife'), 2);
  assert.ok(s.log.some((l) => l.text === '한눈에 알아보았다. 깎는 이의 칼이다.'));
});
