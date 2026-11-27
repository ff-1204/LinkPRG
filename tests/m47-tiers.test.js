// 3~10단계의 자료 (LV-C3~C10, LV-F3~F10, LV-H1): 숫자가 시안과 맞는지, 아직 닿지 않는 것이 새어 나오지 않는지
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { ITEMS } from '../src/data/items.js';
import { RECIPES, ORDER_OF } from '../src/data/recipes.js';
import { MONSTERS } from '../src/data/monsters.js';
import { DISHES, DISH_ORDER, INGREDIENTS } from '../src/data/cooking.js';
import { WILDS } from '../src/data/wild.js';
import { SHOPS } from '../src/data/shops.js';
import { BANDS, tierOfLv, foodRate, monsterXp } from '../src/data/bands.js';
import { TIERS } from '../src/data/tiers.js';
import { recipeList, promoOf } from '../src/core/craft.js';
import { xpToNext } from '../src/core/level.js';
import { derived } from '../src/core/derived.js';

const gearOf = (n) => Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && d.tier === n);

test('단계마다 무기 공격력과 방어구 합이 시안의 표와 같다 (LV-F3~F10)', () => {
  assert.deepEqual(TIERS.map((t) => t.n), [3, 4, 5, 6, 7, 8, 9, 10]);
  for (const t of TIERS) {
    const b = BANDS[t.n - 1], gear = gearOf(t.n);
    const best = (slot, key) => Math.max(0, ...gear.filter(([, d]) => d.slot === slot).map(([, d]) => d[key] || 0));
    assert.equal(best('weapon', 'attack'), b.weapon, `${t.n}단계 무기`);
    assert.equal(['off', 'head', 'body', 'hand', 'feet'].reduce((a, slot) => a + best(slot, 'defense'), 0), b.armor, `${t.n}단계 방어구 합`);
    assert.equal(gear.length, 11, `${t.n}단계 장비 열한 가지`); // 열 가지에 그 단계의 기도 구슬 (M24-3)
    for (const [id, d] of gear) {
      assert.ok(RECIPES[id], `${id}의 설계도`);
      assert.equal(tierOfLv(RECIPES[id].lv), t.n, `${id}의 제작 레벨`);
      assert.equal(RECIPES[id].name, d.name);
      for (const n of RECIPES[id].needs) assert.ok(ITEMS[n.id], `${id}의 재료 ${n.id}`);
      assert.ok(d.price > 0 && d.dur > 0 && d.desc);
    }
    for (const k of ['metal', 'hide', 'meat']) assert.equal(ITEMS[t[k][0]].tier, t.n);
  }
  // 윗단계 장비는 아랫단계보다 늘 세다
  for (let n = 3; n <= 10; n++) assert.ok(BANDS[n - 1].weapon > BANDS[n - 2].weapon && BANDS[n - 1].armor > BANDS[n - 2].armor);
});

test('승급작: 시안이 이름 붙인 것이 그 단계의 승급작이고, 마지막 단계에는 없다 (LV-F)', () => {
  assert.equal(promoOf('smith', 3), '서릿쇠 검');
  assert.equal(promoOf('smith', 4), '저울꾼의 방패');
  assert.equal(promoOf('smith', 5), '잿쇠 갑옷');
  assert.equal(promoOf('sew', 6), '안개실 옷');
  assert.equal(promoOf('smith', 7), '근위병의 창');
  assert.equal(promoOf('jewel', 8), '구름은 반지');
  assert.equal(promoOf('smith', 9), '별쇠 검');
  for (let n = 3; n <= 9; n++) for (const b of ['smith', 'sew', 'jewel', 'cook']) assert.ok(promoOf(b, n), `${n}단계 ${b}`);
  for (const b of ['smith', 'sew', 'jewel', 'cook']) assert.equal(promoOf(b, 10), null);
});

test('21~100의 보통 몬스터 서른하나: 레벨이 제 구간에 들고, 숫자는 구간 자료에서 나온다 (LV-C, LV-I2, LV-I4)', () => {
  const mons = Object.entries(MONSTERS).filter(([, m]) => m.band && !m.boss); // 우두머리는 지역을 낼 때 따로 넣는다 (M15: 잠든 종의 파수꾼)
  assert.equal(mons.length, 31);
  for (let n = 3; n <= 10; n++) assert.equal(mons.filter(([, m]) => m.band === n).length, n === 10 ? 3 : 4, `${n}구간`);
  for (const [id, m] of mons) {
    const b = BANDS[m.band - 1];
    assert.ok(m.level >= b.from && m.level <= b.to, id);
    assert.ok(Math.abs(m.hp / b.mon.hp - 1) <= 0.25 && Math.abs(m.attack / b.mon.attack - 1) <= 0.25, `${id}의 숫자는 구간 가운데 값의 위아래`);
    assert.equal(m.xp, monsterXp(m.level, xpToNext));
    assert.ok(m.intro && m.name && ['땅', '바람', '물', '불', '어둠', '빛'].includes(m.element), id);
    assert.equal(m.moves.length, 2);
    for (const mv of m.moves) assert.ok(mv.tell && mv.say && mv.name, id);
    assert.ok(m.moves.some((mv) => mv.kind === 'charge'), `${id}에는 막아야 하는 큰 공격이 있다`);
    for (const d of m.drops) assert.equal(ITEMS[d.id].tier, m.band, `${id}는 제 구간의 재료를 떨군다`);
  }
  // 구간 안에서 재료 셋이 모두 나온다
  for (const t of TIERS) {
    const drops = new Set(mons.filter(([, m]) => m.band === t.n).flatMap(([, m]) => m.drops.map((d) => d.id)));
    for (const k of ['metal', 'hide', 'meat']) assert.ok(drops.has(t[k][0]), `${t.n}구간에서 ${t[k][1]}`);
  }
});

test('21부터의 요리는 비율로 붙는다 (LV-H1)', () => {
  for (const t of TIERS) {
    const d = DISHES[t.dish[0]];
    assert.equal(d.buff.rate, foodRate(t.n));
    assert.equal(tierOfLv(d.lv), t.n);
    assert.ok(DISH_ORDER.includes(t.dish[0]) && INGREDIENTS.includes(t.meat[0]));
    assert.equal(ITEMS[`dish_${t.dish[0]}`].eat.dish, t.dish[0]);
    assert.ok(d.hint && d.buff.name);
  }
  const s = createGame({ name: '맛', origin: 'farmer', rolled: rollDice('same'), seed: 'dish' });
  s.stats.str = 200;
  const atk = () => derived(s).find((x) => x.id === 'attack').value;
  const base = atk();
  const d = DISHES.anviltable;
  s.buffs.food = { name: d.buff.name, text: d.buff.text, attack: 0, defense: 0, hp: 0, xp: 0, rate: d.buff.rate, until: { day: 99, phase: 0 } };
  assert.equal(atk(), base + Math.round(base * 0.16));
});

test('아직 닿지 않는 것은 어디에도 나오지 않는다: 사냥터, 가게, 처음 하는 사람의 설계도 목록', () => {
  const placed = new Set(Object.values(WILDS).flatMap((w) => (w.monsters || []).map((m) => m.id)));
  // 처음 모루(10구간)까지 냈다 (M22). 구간은 열이 끝이다
  for (const [id, m] of Object.entries(MONSTERS)) if (m.band > 10) assert.ok(!placed.has(id), `${id}는 아직 사냥터에 없다`);
  for (const [shop, def] of Object.entries(SHOPS)) for (const id of def.sells) assert.ok((ITEMS[id].tier || 1) <= 10, `${shop}의 ${id}`);
  // 첫쇠와 그림자 가죽은 가게에 없다: 산에서 캔다 (CM-A6, CM-A7)
  for (const def of Object.values(SHOPS)) for (const id of def.sells) assert.ok((ITEMS[id].tier || 1) < 10, id);
  const s = createGame({ name: '처음', origin: 'farmer', rolled: rollDice('same'), seed: 'hide' });
  for (const b of ['smith', 'sew', 'jewel', 'cook']) for (const r of recipeList(s, ORDER_OF[b])) assert.equal(tierOfLv(r.lv), 1, `${r.id}`);
});

test('윗단계 성수는 지금 성수보다 센 가호를 건다 (LV-H2)', async () => {
  const { dispatch } = await import('../src/core/game.js');
  const { graceBuff } = await import('../src/core/buffs.js');
  const s = createGame({ name: '물', origin: 'farmer', rolled: rollDice('same'), seed: 'holy' });
  s.bag.push({ id: 'holywater', grade: 0, n: 1 }, { id: 'deepholy', grade: 0, n: 1 }, { id: 'starholy', grade: 0, n: 1 });
  const drink = (id) => dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === id) });
  drink('holywater');
  assert.equal(graceBuff(s).power, 0.05);
  drink('deepholy');
  assert.equal(graceBuff(s).power, 0.09);
  assert.equal(graceBuff(s).text, '공격력·방어력 +9%');
  drink('starholy');
  assert.equal(graceBuff(s).power, 0.11);
  assert.equal(graceBuff(s).name, '별빛 가호');
  // 센 가호가 붙어 있는 동안 싼 성수를 마셔도 때가 늘지 않는다
  const until = { ...graceBuff(s).until };
  s.phase = (s.phase + 1) % 3; if (s.phase === 0) s.day += 1;
  s.bag.push({ id: 'holywater', grade: 0, n: 1 });
  drink('holywater');
  assert.deepEqual(graceBuff(s).until, until);
  assert.equal(graceBuff(s).power, 0.11);
  assert.equal(ITEMS.deepholy.tier, 7);
  assert.equal(ITEMS.starholy.tier, 9);
});
