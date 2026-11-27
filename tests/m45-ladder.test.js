// M13 사다리를 놓는다 (LV-F11, LV-H1, LV-H2, LV-L9, LV-L10): 제작 단계와 승급작, 비율 버프, 일한 날의 이자, 도적 칸
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { addCraftXp, craftLvOf, craftLvView, craftTierOf, craftCapped, promoOf } from '../src/core/craft.js';
import { RECIPES, CRAFT_LV } from '../src/data/recipes.js';
import { DISHES } from '../src/data/cooking.js';
import { BANDS, bandOfLevel, bandOfPlace, tierOfLv, foodRate, holyRate, bardRate, banditStep, monsterXp, CRAFT_LV_MAX, INTEREST_WORK } from '../src/data/bands.js';
import { PLACES, PHASE_TICKS } from '../src/data/places.js';
import { xpToNext } from '../src/core/level.js';
import { derived } from '../src/core/derived.js';
import { giveGrace, graceBuff } from '../src/core/buffs.js';
import { banditPer, banditUp } from '../src/core/explore.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';
import { rebirthCarry } from '../src/core/rebirth.js';

const make = (seed = 'ladder') => createGame({ name: '사다리', origin: 'smithboy', rolled: rollDice('same'), seed });
const val = (s, id) => derived(s).find((d) => d.id === id).value;
const none = () => {};

test('구간 열 개: 레벨·곳·제작 레벨이 제 구간에 든다', () => {
  assert.equal(BANDS.length, 10);
  assert.deepEqual([1, 10, 11, 20, 21, 95, 100].map((l) => bandOfLevel(l).n), [1, 1, 2, 2, 3, 10, 10]);
  assert.equal(bandOfPlace(PLACES.plaza).n, 1);
  assert.equal(bandOfPlace(PLACES.pass).n, 2, '고갯길은 11~20');
  assert.equal(bandOfPlace({ band: 6 }).name, '안개늪');
  assert.deepEqual([1, 4, 5, 8, 9, 40, 99].map(tierOfLv), [1, 1, 2, 2, 3, 10, 10]);
  assert.equal(CRAFT_LV_MAX, 40);
  // 버프의 크기 (LV-H)
  assert.deepEqual([2, 3, 10].map((n) => Math.round(foodRate(n) * 100)), [0, 9, 16]);
  assert.deepEqual([1, 5, 10].map((n) => Math.round(holyRate(n) * 100)), [5, 6, 11]);
  assert.deepEqual([7, 8, 10].map((n) => Math.round(bardRate(n) * 100)), [0, 10, 14]);
  // 한 마리의 경험치: 뒤로 갈수록 레벨 하나에 드는 마릿수가 는다 (LV-I4)
  assert.ok(Math.abs(xpToNext(5) / monsterXp(5, xpToNext) - 6) < 0.5);
  assert.ok(Math.abs(xpToNext(95) / monsterXp(95, xpToNext) - 35) < 0.5);
});

test('제작 레벨은 4에서 멈추고, 승급작을 지으면 다음 단계가 열린다. 그동안 쌓은 경험은 버려지지 않는다 (LV-F11)', () => {
  const s = make();
  assert.equal(craftTierOf(s, 'smith'), 1);
  // 레벨 4까지: 10 + 20 + 30
  addCraftXp(s, [], 'smith', 60, RECIPES.coppersword, none);
  assert.deepEqual(craftLvOf(s, 'smith'), { lv: 4, xp: 0 });
  assert.equal(craftCapped(s, 'smith'), true);
  addCraftXp(s, [], 'smith', 100, RECIPES.coppersword, none);
  assert.deepEqual(craftLvOf(s, 'smith'), { lv: 4, xp: 100 }, '멈춰 있어도 경험은 쌓인다');
  const v = craftLvView(s, 'smith');
  assert.equal(v.capped, true);
  assert.equal(v.promo, '철검');
  assert.equal(promoOf('smith', 1), '철검');
  assert.equal(promoOf('sew', 1), '가죽 장화');
  assert.equal(promoOf('jewel', 1), '철 반지');
  assert.equal(promoOf('cook', 1), DISHES.boarskewer.name);
  assert.equal(promoOf('smith', 2), '강철 갑옷');
  assert.equal(promoOf('smith', 3), '서릿쇠 검');
  assert.equal(promoOf('smith', 10), null, '마지막 단계에는 승급작이 없다');
  // 승급작을 짓는다
  const ev = [];
  let ups = 0;
  addCraftXp(s, ev, 'smith', 3, RECIPES.ironsword, () => { ups++; });
  assert.equal(craftTierOf(s, 'smith'), 2);
  assert.ok(ev.some((e) => e.type === 'ding' && /2단계가 열렸습니다/.test(e.ding.title)));
  assert.deepEqual(craftLvOf(s, 'smith'), { lv: 6, xp: 103 - 40 - 50 }, '쌓여 있던 경험으로 한꺼번에 오른다');
  assert.equal(ups, 2);
  assert.equal(craftLvView(s, 'smith').promo, null);
  // 다른 갈래는 그대로다
  assert.equal(craftTierOf(s, 'sew'), 1);
  // 승급작을 또 지어도 단계가 더 오르지 않는다
  addCraftXp(s, [], 'smith', 1, RECIPES.ironsword, none);
  assert.equal(craftTierOf(s, 'smith'), 2);
  // 8에서 다시 멈춘다
  addCraftXp(s, [], 'smith', 10000, RECIPES.coppersword, none);
  assert.equal(craftLvOf(s, 'smith').lv, 8);
  assert.equal(craftCapped(s, 'smith'), true);
});

test('실제로 철검을 다 두드리면 대장 2단계가 열린다', () => {
  const s = make('real');
  s.place = 'forge';
  s.craftLv.smith = { lv: 4, xp: 39 };
  s.bag.push({ id: 'ironore', grade: 0, n: 20 }, { id: 'oakbranch', grade: 0, n: 5 });
  dispatch(s, { type: 'craft', recipe: 'ironsword' });
  for (let i = 0; i < 40 && s.craft; i++) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null);
  assert.equal(s.craftTier.smith, 2);
  assert.equal(s.craftLv.smith.lv, 5);
});

test('옛 저장(12판)은 지금 제작 레벨이 든 단계에서 시작한다. 환생에도 단계가 남는다', () => {
  const old = JSON.parse(JSON.stringify(make('old')));
  delete old.craftTier; old.v = 12;
  old.craftLv = { smith: { lv: 6, xp: 3 }, sew: { lv: 4, xp: 0 }, jewel: { lv: 1, xp: 0 } };
  const up = parseSave(JSON.stringify({ v: 12, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual(up.craftTier, { smith: 2, sew: 1, jewel: 1 });
  const n = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'n', carry: rebirthCarry(up) });
  assert.equal(n.craftTier.smith, 2);
  assert.equal(n.craftLv.smith.lv, 6);
  const bad = JSON.parse(JSON.stringify(up)); bad.craftTier.smith = 11;
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })), /제작 단계/);
});

test('비율로 붙는 음식과 윗단계 성수: 공격력·방어력에 비율로 붙고 서로 겹친다 (LV-H1, LV-H2)', () => {
  const s = make('buff');
  s.stats.str = 100; s.stats.con = 100;
  const atk = val(s, 'attack'), def = val(s, 'defense');
  s.buffs.food = { name: '서리 전골', text: '', attack: 0, defense: 0, hp: 0, xp: 0, rate: foodRate(3), until: { day: 99, phase: 0 } };
  assert.equal(val(s, 'attack'), atk + Math.round(atk * 0.09));
  assert.equal(val(s, 'defense'), def + Math.round(def * 0.09));
  const g = giveGrace(s, holyRate(6));
  assert.equal(g.text, '공격력·방어력 +7%');
  assert.ok(val(s, 'attack') > atk + Math.round(atk * 0.09), '성수가 음식 위에 겹친다');
  // 지금 성수(5%)를 마셔도 더 센 가호를 덮지 않는다
  giveGrace(s);
  assert.equal(graceBuff(s).power, holyRate(6));
  // 지금 요리(고정값)는 그대로다
  const t = make('flat');
  const a0 = val(t, 'attack');
  t.buffs.food = { name: '뜨거운 피', text: '', attack: 4, defense: 0, hp: 0, xp: 0, until: { day: 99, phase: 0 } };
  assert.equal(val(t, 'attack'), a0 + 4);
});

test('이자는 일을 서른 번 이상 한 날에만 붙는다. 쉬거나 잠만 잔 날에는 붙지 않는다 (LV-L9)', () => {
  const endOfDay = (work) => {
    const s = make(`bank${work}`);
    s.place = 'tavern'; s.silver = 1000;
    dispatch(s, { type: 'deposit', silver: 500 });
    dispatch(s, { type: 'move', to: 'plaza' });
    dispatch(s, { type: 'move', to: 'training' });
    s.phase = 2; s.tick = PHASE_TICKS - 1; s.tired = 0; s.full = 80;
    s.flags.dayWork = work;
    const day = s.day;
    dispatch(s, { type: 'act', id: 'strike' }); // 이 한 번으로 날이 넘어간다. 날을 넘긴 일은 새 날의 첫 일로 센다
    assert.equal(s.day, day + 1, '날이 바뀌었다');
    assert.equal(s.flags.dayWork, 1, '새 날은 다시 센다');
    return s.store['시작 마을'].silver;
  };
  assert.equal(INTEREST_WORK, 30);
  assert.equal(endOfDay(29), 500, '스물아홉 번으로는 붙지 않는다');
  assert.equal(endOfDay(30), 505, '서른 번을 한 날에는 1%');
  // 쉬기는 일로 치지 않는다
  const r = make('rest');
  dispatch(r, { type: 'move', to: 'training' });
  dispatch(r, { type: 'act', id: 'strike' });
  assert.equal(r.flags.dayWork, 1);
  r.store['시작 마을'] = { items: [], silver: 500 };
  r.phase = 2; // 잠은 밤에 잔다
  const day = r.day;
  dispatch(r, { type: 'act', id: 'rest' });
  assert.equal(r.day, day + 1, '자고 나니 날이 바뀌었다');
  assert.equal(r.flags.dayWork, 0, '잠은 일이 아니다');
  assert.equal(r.store['시작 마을'].silver, 500, '한 번 일하고 잔 날에는 이자가 없다');
});

test('도적이 한 칸 세지는 은화: 1~20은 지금처럼 1,000, 그 뒤는 그 구간 닷새 벌이 (LV-L10)', () => {
  assert.equal(banditStep(1), 1000);
  assert.equal(banditStep(2), 1000);
  assert.equal(banditStep(3), BANDS[2].day * 5);
  assert.equal(banditStep(10), 47000);
  const s = make('bandit');
  s.place = 'forest'; s.silver = 5000;
  assert.equal(banditPer(s), 1000);
  const up = banditUp(s);
  assert.ok(up >= 5, '지금 지역은 그대로다');
  assert.equal(CRAFT_LV.per, 10);
});

test('균형 계산 도구: 지금 구간은 직업 다섯의 값을 내고, 자료가 없는 구간은 없다고 적는다 (LV-I5)', async () => {
  const { measure, JOBS, TARGET, monstersOf, gearOf } = await import('../tools/balance.mjs');
  assert.deepEqual(Object.keys(JOBS), ['warrior', 'archer', 'mage', 'priest', 'rogue']);
  assert.equal(Object.keys(TARGET).length, 10);
  assert.ok(monstersOf(BANDS[0]).includes('boar'));
  assert.ok(!monstersOf(BANDS[0]).includes('gatekeeper'), '우두머리는 보통 몬스터가 아니다');
  assert.equal(gearOf(1, 'str').weapon, 'ironsword');
  const rows = measure(2, { runs: 6 });
  assert.equal(rows.length, 5);
  for (const r of rows) { assert.ok(r.loss >= 0 && r.loss <= 100); assert.ok(r.turns > 0); }
  assert.ok(measure(3, { runs: 2 }).every((r) => !r.missing && r.turns > 0), '21부터의 구간도 몬스터와 장비 자료로 잰다');
});
