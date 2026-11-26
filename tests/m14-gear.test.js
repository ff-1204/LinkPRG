// 수리, 강화, 옵션, 이름난 개체 (Z17~Z20)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, enemyView } from '../src/core/game.js';
import { addItem, itemPower, countOf } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { gearName, repairCost, enhanceView, rollOptions, optionLines, PLUS_ODDS, PLUS_MAX } from '../src/core/gear.js';
import { eliteChance, ELITE } from '../src/core/battle.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const fresh = (seed = 'gear') => createGame({ name: '쇠', origin: 'smithboy', spent: {}, seed });

test('수리: 대장간에서 닳은 만큼 값을 내고 고친다. 다른 곳에서는 못 한다', () => {
  const s = fresh(); s.silver = 100;
  const sword = addItem(s, 'ironsword'); sword.dur = 0;
  const index = s.bag.indexOf(sword);
  assert.throws(() => dispatch(s, { type: 'repair', index }), /대장간에서만/);
  dispatch(s, { type: 'move', to: 'forge' });
  const cost = repairCost(s, sword);
  assert.ok(cost > 0);
  dispatch(s, { type: 'repair', index });
  assert.equal(sword.dur, 80);
  assert.equal(s.silver, 100 - cost);
  assert.throws(() => dispatch(s, { type: 'repair', index }), /고칠 데가 없습니다/);
  // 찬 것도 고친다
  dispatch(s, { type: 'equip', index: s.bag.indexOf(sword) });
  s.equip.weapon.dur = 10;
  dispatch(s, { type: 'repair', slot: 'weapon' });
  assert.equal(s.equip.weapon.dur, 80);
});

test('강화: 한 번에 한 번. 높을수록 어렵고, 실패하면 내구도가 깎인다. +1마다 공격이 10% 오른다', () => {
  assert.equal(PLUS_ODDS.length, PLUS_MAX);
  assert.ok(PLUS_ODDS.every((p, i) => i === 0 || p < PLUS_ODDS[i - 1]));
  const s = fresh('plus'); s.place = 'forge'; s.silver = 100000;
  const sword = addItem(s, 'ironsword');
  addItem(s, 'ironore', 9999);
  const base = itemPower(sword).attack;
  let ok = 0, fail = 0, presses = 0;
  while ((sword.plus || 0) < 5 && presses < 500) {
    const before = sword.plus || 0;
    if (sword.dur <= 20) dispatch(s, { type: 'repair', index: s.bag.indexOf(sword) });
    dispatch(s, { type: 'enhance', index: s.bag.indexOf(sword) });
    s.tired = 0; s.full = 80; s.phase = 0;
    presses++;
    if ((sword.plus || 0) > before) ok++; else fail++;
  }
  assert.equal(sword.plus, 5);
  assert.ok(fail > 0, '실패도 있었다');
  assert.equal(s.counters.act.enhance, presses, '누른 만큼만 했다');
  assert.equal(itemPower(sword).attack, Math.round(14 * 1.5));
  assert.ok(itemPower(sword).attack > base);
  assert.equal(gearName(sword), '+5 철검');
  assert.ok(s.dings.some((d) => d.title.includes('+5')));
  // 재료가 없으면 못 한다
  const t = fresh('poor'); t.place = 'forge'; addItem(t, 'ironsword');
  assert.equal(enhanceView(t, t.bag.at(-1)).can, false);
  assert.throws(() => dispatch(t, { type: 'enhance', index: t.bag.length - 1 }), /모자랍니다/);
});

test('옵션: 고급 이상에 붙는다. 등급이 높을수록 많다. 이름과 힘에 드러난다', () => {
  const s = fresh('opt');
  const counts = [0, 1, 1, 2, 3];
  for (let g = 0; g <= 4; g++) {
    const item = rollOptions(s, addItem(s, 'ironsword', 1, { grade: g }), `t${g}`);
    assert.equal((item.opt || []).length, counts[g], `등급 ${g}`);
    assert.equal(optionLines(item).length, counts[g]);
  }
  const sharp = { id: 'ironsword', grade: 1, n: 1, dur: 80, opt: [{ id: 'sharp', v: 2 }] };
  assert.equal(itemPower(sharp).attack, Math.round(14 * 1.3) + 2);
  assert.equal(gearName(sharp), '날카로운 철검');
  // 굳센 옵션은 최대 생명력에 더해진다
  const hp = valueOf(s, 'maxHp');
  s.equip.body = { id: 'trainwear', grade: 1, n: 1, dur: 40, opt: [{ id: 'vital', v: 10 }] };
  assert.equal(valueOf(s, 'maxHp'), hp + 10);
  // 저장했다 읽어도 남는다
  s.bag.push({ ...sharp, plus: 3 });
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.equal(gearName(back.bag.at(-1)), '+3 날카로운 철검');
});

test('이름난 개체: 많이 잡은 사냥감일수록 자주 나온다. 훨씬 세고, 잡으면 장비를 떨어뜨린다', () => {
  const s = fresh('elite');
  assert.equal(eliteChance(s, 'rat'), 0, '처음 보는 사냥감에서는 나오지 않는다');
  s.dex.mon.rat = { seen: 100, won: 30, lost: 0 };
  assert.equal(eliteChance(s, 'rat'), 30 * ELITE.per);
  s.dex.mon.rat.won = 1000;
  assert.equal(eliteChance(s, 'rat'), ELITE.cap);
  assert.equal(eliteChance(s, 'gatekeeper'), 0, '우두머리는 이름난 개체가 되지 않는다');
  // 이름난 들쥐와 싸워 이긴다
  s.place = 'forest'; s.stats.str = 80; s.hp = 9999;
  s.battle = { mon: 'rat', hp: 1, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0, elite: true };
  const v = enemyView(s);
  assert.ok(v.elite && v.name.startsWith('이름난 '));
  const gear = s.bag.filter((x) => x.dur != null).length;
  const ev = dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.battle, null);
  assert.equal(s.bag.filter((x) => x.dur != null).length, gear + 1, '장비 하나가 떨어졌다');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.title.includes('이름난')));
  assert.equal(s.counters.elites, 1);
  assert.ok(countOf);
});
