// M16 값이 매겨진 띠링: 소금벌(레벨 31~40). 직업 무기, "일", 곳, 갈증, 시세판, 가게, 종 조각 창고, 7장 팔린 종, 스스로 고르는 환생, 서브와 히든.
// 기준: systems.md "14차: 소금벌 화면"(SB-), roadmap.md M16-1 ~ M16-10. 여정은 journey-salt.test.js.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, bodyView, SALT_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { parseSave } from '../src/core/save.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS } from '../src/data/wild.js';
import { THIRST, THIRST_LINES, WATER_MAX, seekWell } from '../src/core/thirst.js';
import { ended, heal, fight, travel, walk } from './_white.js';
import { salted, sold, give, count } from './_salt.js';
import { recipeList } from '../src/core/craft.js';
import { ORDER_OF, RECIPES } from '../src/data/recipes.js';
import { shopView, sellPrice, marketRate, marketHint, pricesView } from '../src/core/trade.js';
import { SHOPS, MARKET_SWING, MARKET_GOODS } from '../src/data/shops.js';
import { boardView } from '../src/core/quests.js';
import { JOBS as BOARD } from '../src/data/quests.js';
import { PEOPLE, CALLS, WEIGHERS } from '../src/data/people.js';
import { addItem } from '../src/core/inventory.js';
import { stallView, stallEvery } from '../src/core/stall.js';
import { worth } from '../src/core/trade.js';
import { offersOf, subView, hiddenView, questBook } from '../src/core/quests.js';
import { SUBS, SUB_ORDER, FAIR_SALES } from '../src/data/quests.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { talkTo } from './_time.js';
import { chosenRebirth } from '../src/core/game.js';
import { rebirthCarry, rebirthLoss, levelTotal, chaptersDone, xpKeepOf } from '../src/core/rebirth.js';
import { rollDice, dealOrigins } from '../src/data/origins.js';
import { roomView, dungeonMap, enemyView } from '../src/core/game.js';
import { DUNGEONS } from '../src/data/dungeon.js';
import { MONSTERS } from '../src/data/monsters.js';
import { BANDS, normalAt } from '../src/data/bands.js';
import { mainView } from '../src/core/quests.js';
import { MAIN, YUGYEOM_FIRST, ASH_ROAD_SAY, SHARD } from '../src/data/quests.js';
import { valueOf, derived, formula, attackStat } from '../src/core/derived.js';
import { startBattle } from '../src/core/battle.js';
import { ITEMS } from '../src/data/items.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const gear = (id) => ({ id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur });
const bare = (job, seed = 'jobw') => {
  const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed });
  for (const k of Object.keys(s.equip)) s.equip[k] = null;
  s.job = job; s.jobAsked = true; s.level = 25;
  Object.assign(s.stats, { str: 12, agi: 30, con: 20, wis: 48 });
  return s;
};

/** 모으다 덤비는 것(Z124)을 끈다: 친화 10이면 확률이 0 아래로 내려간다. 이 테스트는 모으기 자체를 본다 */
const calmGather = (s) => { s.hidden.kind = { value: 10, half: true }; return s; };

test('M16-1 직업 무기를 든 그 직업은 힘 대신 제 스탯으로 친다: 레벨 25 마법사의 서릿쇠 고리 지팡이는 80 (SB-G1, M23-2)', () => {
  const s = bare('mage');
  assert.equal(ITEMS.frostiron_wand.attack, 32, '지팡이는 검(36)의 0.9배다 (M23-2. 앞서는 0.3배인 11이었다)');
  assert.equal(valueOf(s, 'attack'), 12, '맨손은 힘');
  s.equip.weapon = gear('frostiron_wand');
  assert.equal(attackStat(s), 'wis');
  assert.equal(valueOf(s, 'attack'), 80);
  assert.match(formula(derived(s).find((d) => d.id === 'attack')), /^지혜 48 \+ 무기 32/);
  // 검을 들면 다시 힘
  s.equip.weapon = gear('frostiron_sword');
  assert.equal(valueOf(s, 'attack'), 12 + ITEMS.frostiron_sword.attack);
  // 부서진 지팡이는 든 것이 아니다
  s.equip.weapon = { ...gear('frostiron_wand'), dur: 0 };
  assert.equal(valueOf(s, 'attack'), 12);
});

test('M16-1 활·단검은 민첩, 기도 구슬은 지혜. 남의 직업 무기는 힘 그대로 (SB-G1)', () => {
  const a = bare('archer'); a.equip.weapon = gear('shortbow');
  assert.equal(valueOf(a, 'attack'), 30 + 8);
  const r = bare('rogue'); r.equip.weapon = gear('steelknife');
  assert.equal(valueOf(r, 'attack'), 30 + 12);
  const p = bare('priest'); p.equip.ring1 = gear('prayerbeads');
  assert.equal(valueOf(p, 'attack'), 48);
  p.equip.weapon = gear('steelsword');
  assert.equal(valueOf(p, 'attack'), 48 + 24, '구슬을 찬 사제는 든 무기도 지혜로 휘두른다');
  // 전사가 (어쩌다) 활을 들어도 힘이다. 무직도 힘이다
  const w = bare('warrior'); w.equip.weapon = gear('shortbow');
  assert.equal(valueOf(w, 'attack'), 12 + 8);
  const n = bare(null); n.equip.weapon = gear('ashwand');
  assert.equal(valueOf(n, 'attack'), 12 + 4);
  // 궁수가 든 지팡이는 제 직업 무기가 아니다
  const x = bare('archer'); x.equip.weapon = gear('ashwand');
  assert.equal(valueOf(x, 'attack'), 12 + 4);
});

test('M16-1 스킬은 지금처럼 제 스탯을 쓴다: 활을 든 궁수의 민첩 스킬에 민첩이 두 번 들어가지 않는다 (SB-G3)', () => {
  // 꿰뚫기: 민첩으로 1.6배, 방어 무시. 활을 든 궁수의 공격력은 민첩 30 + 활 8 = 38이라 61 언저리다(급소면 1.5배). 두 번 들어가면 109다
  for (const seed of ['sk1', 'sk2', 'sk3', 'sk4']) {
    const s = bare('archer', seed); s.equip.weapon = gear('shortbow'); s.level = 25; s.hp = valueOf(s, 'maxHp'); s.mp = 99;
    startBattle(s, [], 'passbear');
    const hp = s.battle.hp;
    dispatch(s, { type: 'battle', choice: 'skill', index: 'pierce' });
    const dmg = hp - (s.battle ? s.battle.hp : 0);
    assert.ok(dmg >= 45 && dmg <= 98, `피해 ${dmg}`);
  }
});

test('M16-2 "일"에서 둘러보기를 뺀다: 둘러보기 서른 번을 한 날에는 이자가 없고, 치기 서른 번을 한 날에는 붙는다 (SB-D6, LV-L9)', () => {
  const dayOf = (id) => {
    const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed: `work-${id}` });
    s.store['시작 마을'] = { items: [], silver: 500 };
    if (id === 'strike') dispatch(s, { type: 'move', to: 'training' });
    for (let i = 0; i < 30; i++) { s.tired = 0; s.full = 80; dispatch(s, { type: 'act', id }); }
    const work = s.flags.dayWork || 0;
    s.phase = 2; s.tired = 0;
    const day = s.day;
    dispatch(s, { type: 'act', id: 'rest' });
    assert.equal(s.day, day + 1);
    return { work, silver: s.store['시작 마을'].silver };
  };
  assert.deepEqual(dayOf('look'), { work: 0, silver: 500 });
  assert.deepEqual(dayOf('strike'), { work: 30, silver: 505 });
});

// ── M16-3 곳 ──
test('M16-3 6장을 끝내기 전에는 소금벌이 지도·소문·언못의 칸 어디에도 없다 (SB-I1)', () => {
  const s = ended('nosalt');
  const rows = mapView(s);
  for (const id of ['saltgate', 'saltfloor', 'drychannel']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/저울목|소금 바닥|마른 뱃길|소금벌/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/저울목|소금벌/));
  s.place = 'icegate';
  assert.ok(!slotsNow(s).some((x) => x.label === '소금벌로 내려간다'));
  for (const to of ['saltgate', 'saltfloor', 'drychannel']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
});

test('M16-3 6장을 끝내면 언못 어귀에서 소금벌로 내려가 저울목에 닿는다 (SB-A1, SB-F2)', () => {
  const s = salted('down', { at: 'icegate' }); delete s.flags.sawSalt;
  assert.equal(mapView(s).find((r) => r.id === 'saltgate').name, '저울목');
  assert.deepEqual(slotsNow(s).find((x) => x.label === '소금벌로 내려간다').action, { type: 'travel', to: 'saltgate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'saltgate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 25, '반나절 길');
  assert.ok(texts(s).includes(SALT_FIRST[0]) && texts(s).includes(SALT_FIRST[1]));
  travel(s, 'saltfloor'); travel(s, 'saltgate');
  assert.equal(s.log.filter((l) => l.text === SALT_FIRST[0]).length, 1, '처음 한 번만');
});

test('M16-3 저울목의 방 일곱과 사냥터 둘. 소금 바닥에서 소금 전갈을 만난다 (SB-A2~A10)', () => {
  assert.deepEqual(TOWNS['저울목'].order, ['saltgate', 'scaleyard', 'saltforge', 'wellinn', 'barracks', 'saltshrine', 'warehouse']);
  for (const id of [...TOWNS['저울목'].order, 'saltfloor', 'drychannel']) {
    const p = PLACES[id];
    assert.equal(p.band, 4, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  assert.deepEqual(WILDS.saltfloor.monsters.map((m) => m.id), ['saltscorpion', 'dryworm']);
  assert.deepEqual(WILDS.drychannel.monsters.map((m) => m.id), ['saltcrow', 'weigher']);
  // 시안의 단축 칸 (말 걸기는 방 목록에서)
  const labels = (id, more = {}) => { const s = salted(`slots-${id}`, { at: id }); Object.assign(s, more); return slotsNow(s).map((x) => x.label.replace(/ \(.*/, '')); };
  assert.deepEqual(labels('saltforge'), ['만들기', '상점', '고치기', '강화']);
  assert.deepEqual(labels('wellinn'), ['방 빌리기', '물 채우기', '보관함', '요리']);
  assert.deepEqual(labels('barracks'), ['게시판', '용병', '바느질']);
  assert.deepEqual(labels('saltfloor'), ['탐색', '캐기', '물 마시기']);
  assert.deepEqual(labels('drychannel', { phase: 2 }), ['탐색', '물 마시기', '야영']);
  const s = salted('scorp', { at: 'saltfloor' });
  let met = false;
  for (let i = 0; i < 80 && !met; i++) {
    heal(s); s.water = 10;
    dispatch(s, { type: 'act', id: 'explore' });
    if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
    if (s.battle) { met = ['saltscorpion', 'dryworm'].includes(s.battle.mon); fight(s); }
  }
  assert.ok(met);
});

// ── M16-4 갈증 ──
test('M16-4 물 칸은 소금벌에서만 보인다. 들판에서 열 번 움직일 때마다 한 모금이 준다 (SB-B1, SB-B3, SB-I2)', () => {
  const out = ended('nowater');
  assert.equal(bodyView(out).thirst, null);
  out.place = 'snowfield';
  assert.ok(!slotsNow(out).some((x) => /물/.test(x.label)));
  const s = calmGather(salted('sip', { at: 'saltgate' }));
  assert.deepEqual([bodyView(s).thirst.water, bodyView(s).thirst.max, bodyView(s).thirst.tag], [10, 10, null]);
  assert.equal(bodyView(s).cold, null, '체온은 흰마루에서만');
  // 마을 안에서는 줄지 않는다
  for (let i = 0; i < 12; i++) dispatch(s, { type: 'act', id: 'look' });
  assert.equal(s.water, 10);
  s.place = 'saltfloor'; s.flags.noAmbush = true;
  let moves = 0;
  const step = () => { heal(s); dispatch(s, { type: 'act', id: 'dig' }); moves++; };
  for (let i = 0; i < 9; i++) step();
  assert.equal(s.water, 10);
  step();
  assert.equal(s.water, 9, '열 번에 한 모금');
  while (s.water > 0) step();
  assert.equal(moves, 100, '열 모금이면 백 번');
  assert.ok(texts(s).includes(THIRST_LINES.out));
  assert.deepEqual(bodyView(s).thirst.tag, { id: 'dry', name: '마른 목', text: '움직일 때마다 생명력이 깎인다' });
});

test('M16-4 마른 목: 움직일 때마다 최대 생명력의 2%가 깎인다. 싸움의 한 턴도 한 번이다. 바닥나면 쓰러진다 (SB-B3)', () => {
  const s = salted('dry', { at: 'saltfloor' }); s.flags.noAmbush = true;
  s.water = 0;
  const max = valueOf(s, 'maxHp'), cut = Math.round(max * 0.02);
  s.hp = max; s.full = 80; s.tired = 0;
  dispatch(s, { type: 'act', id: 'dig' });
  assert.equal(s.hp, max - cut);
  assert.ok(texts(s).includes(`목이 탄다. 생명력 −${cut}.`));
  startBattle(s, [], 'saltscorpion');
  s.battle.hp = 99999;
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(texts(s).split('목이 탄다').length, 3, '싸움의 턴에도 깎인다');
  // 싸움 밖에서 바닥나면 쓰러진다
  const f = salted('parch', { at: 'saltfloor' }); f.flags.noAmbush = true;
  f.water = 0; f.hp = 3; f.full = 80; f.bag = [];
  const ev = dispatch(f, { type: 'act', id: 'dig' });
  assert.ok(ev.some((e) => e.type === 'fall'));
  assert.equal(f.falls, 1);
});

test('M16-4 물 주머니로 다섯 모금. 마신 주머니는 비고, 우물가 주막에서 은화 5에 가득 채운다 (SB-B3)', () => {
  const s = salted('pouch', { at: 'saltfloor' });
  give(s, 'waterpouch', 3);
  assert.throws(() => dispatch(s, { type: 'act', id: 'drink' }), /목이 마르지 않습니다/);
  s.water = 3;
  assert.equal(slotsNow(s).find((x) => x.label === '물 마시기').sub, '물 주머니 3개');
  dispatch(s, { type: 'act', id: 'drink' });
  assert.deepEqual([s.water, count(s, 'waterpouch'), count(s, 'emptypouch')], [8, 2, 1]);
  assert.ok(texts(s).includes(THIRST_LINES.sip));
  dispatch(s, { type: 'act', id: 'drink' });
  assert.equal(s.water, 10, '열 모금을 넘지 않는다');
  assert.ok(ITEMS.waterpouch.throw, '던지는 쓰임은 그대로다');
  // 물 주머니 셋: 10 + 5 × 3 = 25모금, 250번
  assert.equal((WATER_MAX + 3 * THIRST.pouch) * THIRST.per, 250);
  // 우물
  s.place = 'wellinn'; s.water = 2; s.silver = 100;
  const slot = slotsNow(s).find((x) => /^물 채우기/.test(x.label));
  assert.equal(slot.label, '물 채우기 (은화 5)');
  dispatch(s, slot.action);
  assert.deepEqual([s.water, s.silver, count(s, 'waterpouch'), count(s, 'emptypouch')], [10, 95, 3, 0]);
  assert.throws(() => dispatch(s, slot.action), /가득/);
  // 소금벌 밖에서는 마실 수 없다
  const o = ended('nodrink'); o.place = 'snowfield'; give(o, 'waterpouch', 1);
  assert.throws(() => dispatch(o, { type: 'act', id: 'drink' }), /할 수 없는 일/);
});

test('M16-4 사냥터마다 옛 우물 하나. 찾기 전에는 지도에 없고, 찾으면 값없이 채운다 (SB-B2, SB-I5)', () => {
  const s = salted('oldwell', { at: 'drychannel' }); s.flags.noAmbush = true;
  assert.equal(mapView(s).find((r) => r.id === 'drychannel').well, false);
  let n = 0;
  while (!s.wells.includes('drychannel') && n++ < 600) {
    heal(s); s.water = 10;
    if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.ok(s.wells.includes('drychannel'));
  assert.ok(s.log.some((l) => l.who === '발견' && l.text === '배 밑에 옛 우물이 있다. 지도에 적어 두었다.'));
  assert.equal(mapView(s).find((r) => r.id === 'drychannel').well, true);
  assert.equal(mapView(s).find((r) => r.id === 'saltfloor').well, false, '다른 사냥터의 우물은 따로 찾는다');
  s.water = 0; give(s, 'emptypouch', 2); const silver = s.silver;
  const slot = slotsNow(s).find((x) => x.label === '물 채우기');
  assert.equal(slot.sub, '옛 우물');
  dispatch(s, slot.action);
  assert.deepEqual([s.water, s.silver, count(s, 'emptypouch')], [10, silver, 0]);
  // 마흔 번째 탐색에는 반드시 찾는다
  const t = salted('well40', { at: 'saltfloor' });
  t.wellTries = { saltfloor: 39 };
  assert.equal(seekWell(t, []), true);
});

test('M16-4 짠 음식: 소금벌 구이를 먹으면 한 모금이 더 준다. 힘은 그대로 붙는다 (SB-B3)', () => {
  const s = salted('salty', { at: 'saltgate' });
  give(s, 'dish_saltgrill', 2);
  const a0 = valueOf(s, 'attack');
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_saltgrill') });
  assert.equal(s.water, 9);
  assert.equal(valueOf(s, 'attack'), a0 + Math.round(a0 * 0.10));
  const o = ended('saltyout'); give(o, 'dish_saltgrill', 1);
  dispatch(o, { type: 'use', index: o.bag.findIndex((x) => x.id === 'dish_saltgrill') });
  assert.ok(!texts(o).includes('모금'));
});

test('M16-4 14판 저장은 지금 판으로 올라온다: 물은 가득, 찾은 우물과 가게는 없이 (저장 판)', () => {
  assert.ok(SAVE_VERSION >= 15);
  const s = ended('v14');
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['water', 'dryStep', 'wells', 'wellTries', 'stall']) delete old[k];
  delete old.main.past; old.v = 14;
  const up = parseSave(JSON.stringify({ v: 14, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual([up.water, up.dryStep, up.wells, up.wellTries, up.stall, up.main.past], [10, 0, [], {}, null, []]);
});

// ── M16-5 시세판과 가게·일터 (SB-A3~A7, SB-C) ──
const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null);
};

test('M16-5 저울목의 값은 날마다 0.7~1.3배로 바뀐다. 사는 값도 파는 값도 같이 움직인다 (SB-C1, SB-C3)', () => {
  const s = salted('market', { at: 'scaleyard' });
  assert.deepEqual(MARKET_SWING, [0.7, 0.6]);
  const seen = new Set();
  for (let day = 1; day <= 60; day++) {
    s.day = day;
    for (const id of MARKET_GOODS) {
      const r = marketRate(s, id);
      assert.ok(r >= 0.7 && r <= 1.3, `${id} ${r}`);
      assert.ok(r === 1 || Math.abs(r - 1) >= 0.0999, '한 푼도 안 벌어진 날은 제값');
      seen.add(r > 1 ? 'up' : r < 1 ? 'down' : 'flat');
    }
    const g = shopView(s).goods.find((x) => x.id === 'scorpshell');
    assert.equal(g.base, Math.round(72 * marketRate(s, 'scorpshell')), '제값 72에 오늘 몫');
    // 파는 값: 제값의 40%에 오늘 몫. 같은 날 사서 되팔면 늘 밑진다
    assert.ok(sellPrice({ id: 'scorpshell', grade: 0, n: 1 }, s) < g.now);
  }
  assert.deepEqual([...seen].sort(), ['down', 'flat', 'up']);
  // 싼 날 사서 비싼 날 팔면 값이 다르다 (보관함에 두었다가)
  const days = Array.from({ length: 60 }, (_, i) => i + 1);
  const rate = (d) => marketRate(s, 'scorpshell', d);
  const lo = days.reduce((a, b) => (rate(b) < rate(a) ? b : a)), hi = days.reduce((a, b) => (rate(b) > rate(a) ? b : a));
  s.day = lo; const cheap = sellPrice({ id: 'scorpshell', grade: 0, n: 1 }, s);
  s.day = hi; const dear = sellPrice({ id: 'scorpshell', grade: 0, n: 1 }, s);
  assert.ok(dear > cheap);
  // 저울목의 가게 셋이 모두 그렇다. 다른 마을의 가게는 그대로다
  for (const id of ['scaleyard', 'saltforge', 'saltshrine']) assert.ok(SHOPS[id].market && SHOPS[id].daily, id);
  const o = salted('nomarket', { at: 'frostforge' });
  assert.equal(sellPrice({ id: 'scorpshell', grade: 0, n: 1 }, o), Math.floor(72 * 0.4));
});

test('M16-5 시세판은 오늘 값만, 세 묶음으로 보인다. 주막의 소문이 가끔 내일의 한 품목을 흘린다 (SB-C2)', () => {
  const s = salted('board', { at: 'scaleyard' });
  assert.ok(slotsNow(s).some((x) => x.label === '시세판' && x.open === 'prices'));
  const v = pricesView(s);
  assert.equal(v.day, s.day);
  assert.equal(v.up.length + v.down.length + v.flat.length, MARKET_GOODS.length);
  for (const r of v.up) assert.ok(r.now > r.base && r.pct >= 10);
  for (const r of v.down) assert.ok(r.now < r.base && r.pct <= -10);
  for (const r of v.flat) assert.equal(r.now, r.base);
  assert.ok(!JSON.stringify(v).includes('내일'));
  // 소문: 흘리는 날과 안 흘리는 날이 있고, 흘린 말은 내일 값과 맞는다
  let told = 0, quiet = 0;
  for (let day = 1; day <= 40; day++) {
    s.day = day;
    const h = marketHint(s);
    if (!h) { quiet++; continue; }
    told++;
    assert.equal(h.up, marketRate(s, h.id, day + 1) > 1);
    assert.match(h.text, /^내일은 .+값이 (뛴다|떨어진다)더라\.$/);
  }
  assert.ok(told > 5 && quiet > 5);
  // 방을 빌리면 우물 주인이 그 말을 한다(흘리는 날에만)
  const t = salted('innhint', { at: 'wellinn' });
  while (!marketHint({ ...t, day: t.day + 1 })) t.day += 1;
  t.phase = 2; t.tick = 0; t.silver = 100; // 밤에 자면 다음 날 아침에 깬다
  assert.deepEqual(slotsNow(t).map((x) => x.label), ['방 빌리기 (은화 50)', '물 채우기 (은화 5)', '보관함', '요리']);
  dispatch(t, { type: 'act', id: 'room' });
  assert.equal(t.silver, 50);
  assert.ok(t.log.some((l) => l.who === '우물 주인' && l.text.includes(marketHint(t).text)));
});

test('M16-5 소금 대장간: 서릿쇠 검을 지은 사람이 저울꾼의 방패까지 지어 대장 5단계가 열린다 (SB-A4, LV-F4)', () => {
  const s = salted('forge', { at: 'saltforge' });
  assert.ok(shopView(s).goods.some((g) => g.name === '소금강 덩이'));
  s.craftLv.smith = { lv: 12, xp: 0 }; s.craftTier.smith = 3;
  assert.ok(!recipeList(s, ORDER_OF.smith).some((r) => r.id.startsWith('saltsteel_')), '4단계 설계도는 아직 나오지 않는다');
  make(s, 'frostiron_sword');
  assert.equal(s.craftTier.smith, 4);
  const list = recipeList(s, ORDER_OF.smith).filter((r) => r.id.startsWith('saltsteel_'));
  assert.deepEqual(list.filter((r) => r.promo).map((r) => r.name), ['저울꾼의 방패'], '승급작 이름표');
  s.craftLv.smith = { lv: 16, xp: 0 }; s.job = 'warrior';
  make(s, 'saltsteel_shield');
  assert.equal(s.craftTier.smith, 5, '대장 5단계가 열린다');
  assert.ok(s.bag.some((x) => x.id === 'saltsteel_shield' && x.maker === s.name));
});

test('M16-5 용병 막사와 작은 사당: 게시판·용병·바느질, 기도·상점 (SB-A6, SB-A7)', () => {
  const s = salted('barracks', { at: 'barracks' });
  const ids = Object.entries(BOARD).filter(([, d]) => d.at === 'barracks').map(([id]) => id);
  assert.equal(ids.length, 6);
  assert.ok(boardView(s).length > 0 && boardView(s).every((c) => ids.includes(c.id)));
  // 가져오는 의뢰의 삯은 가장 싼 날 사서 채우는 값보다 적다
  for (const id of ids) { const d = BOARD[id]; if (d.kind === 'bring') assert.ok(d.silver < Math.round(ITEMS[d.item].price * 0.7) * d.n, id); }
  assert.ok(PLACES.barracks.merc);
  const p = salted('shrine', { at: 'saltshrine' });
  assert.deepEqual(slotsNow(p).map((x) => x.label), ['기도', '상점'], '다시 태어나기는 7장을 끝내기 전에는 없다 (SB-I4)');
  dispatch(p, { type: 'act', id: 'pray' });
  assert.ok(shopView(p).goods.some((g) => g.id === 'holywater'));
  // 저울목 사람 열둘. 저울꾼이 다섯이다
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '저울목');
  assert.equal(here.length, 12);
  assert.deepEqual(here.filter((x) => x.weigher).map((x) => x.id), WEIGHERS);
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
});

// ── M16-6 가게 (SB-D, LV-K1, LV-K6) ──
const mine = (s, id, more = {}) => { const it = { id, grade: 0, n: 1, maker: s.name, ...(ITEMS[id].dur ? { dur: ITEMS[id].dur, max: ITEMS[id].dur } : {}), ...more }; s.bag.push(it); return it; };
const owner = (s) => { s.place = 'scaleyard'; dispatch(s, { type: 'greet', npc: 'stallowner' }); };
const withStall = (seed) => { const s = salted(seed, { at: 'scaleyard' }); s.silver = 5000; owner(s); dispatch(s, { type: 'stall', op: 'buy' }); return s; };
const work = (s, n) => { s.place = 'saltshrine'; for (let i = 0; i < n; i++) { s.tired = 0; s.full = 80; dispatch(s, { type: 'act', id: 'pray' }); } };

test('M16-6 좌판을 사기 전에는 "가게" 칸이 어디에도 없다. 임자에게 값을 듣고 은화 3,800에 산다 (SB-I3, LV-L6)', () => {
  const s = salted('nostall', { at: 'scaleyard' });
  s.silver = 5000;
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['시세판', '상점', '경매장']);
  assert.equal(stallView(s), null);
  assert.throws(() => dispatch(s, { type: 'stall', op: 'buy' }), /먼저 물어봐야/);
  assert.throws(() => dispatch(s, { type: 'stall', op: 'put', index: 0 }), /가게가 없습니다/);
  assert.match(PLACES.scaleyard.room, /빈 좌판/);
  owner(s);
  assert.ok(PEOPLE.stallowner.hello[0].includes('삼천팔백'));
  const slot = slotsNow(s).find((x) => x.label === '좌판 사기 (은화 3,800)');
  assert.ok(slot && !slot.disabled);
  s.silver = 3799;
  assert.throws(() => dispatch(s, slot.action), /은화가 모자랍니다/);
  s.silver = 5000;
  dispatch(s, slot.action);
  assert.equal(s.silver, 1200);
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['시세판', '상점', '가게', '경매장']);
  const v = stallView(s);
  assert.deepEqual([v.regulars, v.every, v.items.length, v.slots, v.left], [0, 20, 0, 6, null]);
  assert.match(v.empty, /쉬거나 자는 동안에는 오지 않는다/);
  // 다른 곳에서는 살 수 없다
  const o = salted('nostall2', { at: 'saltgate' }); o.silver = 9999; o.people.stallowner = { pts: 0, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.throws(() => dispatch(o, { type: 'stall', op: 'buy' }), /저울 마당/);
});

test('M16-6 올릴 수 있는 것은 내가 만든 물건뿐. 여섯 칸. 값은 제값으로 붙는다 (SB-D1, SB-D4)', () => {
  const s = withStall('put');
  give(s, 'scorpshell', 2); // 주운 것
  s.bag.push({ id: 'frostiron_sword', grade: 0, n: 1, dur: 80, max: 80 }); // 산 것(만든 이가 없다)
  assert.throws(() => dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'scorpshell') }), /내가 만든 물건만/);
  assert.throws(() => dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'frostiron_sword') }), /내가 만든 물건만/);
  mine(s, 'frostiron_sword', { grade: 1 });
  mine(s, 'dish_snowpot', { n: 3 });
  assert.deepEqual(stallView(s).mine.map((x) => x.item.id), ['frostiron_sword', 'dish_snowpot'], '올릴 수 있는 것만 보인다');
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.maker && x.id === 'frostiron_sword') });
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  const v = stallView(s);
  assert.deepEqual(v.items.map((x) => [x.name, x.n, x.each]), [['고급 서릿쇠 검', 1, worth({ id: 'frostiron_sword', grade: 1 })], ['눈밭 전골', 3, ITEMS.dish_snowpot.price]]);
  assert.equal(v.left, 20);
  // 값은 날마다 바뀌는 시세를 타지 않는다
  s.day += 3;
  assert.equal(stallView(s).items[1].each, ITEMS.dish_snowpot.price);
  // 여섯 칸
  for (let i = 0; i < 4; i++) { mine(s, 'frostiron_helm'); dispatch(s, { type: 'stall', op: 'put', index: s.bag.length - 1 }); }
  mine(s, 'frostiron_helm');
  assert.throws(() => dispatch(s, { type: 'stall', op: 'put', index: s.bag.length - 1 }), /가득 찼습니다/);
  dispatch(s, { type: 'stall', op: 'take', index: 5 });
  assert.equal(stallView(s).items.length, 5);
  // 진열대는 저울 마당에서만 만진다
  s.place = 'saltgate';
  assert.throws(() => dispatch(s, { type: 'stall', op: 'take', index: 0 }), /저울 마당/);
});

test('M16-6 내가 스무 번 일하면 손님 하나. 쉬기·잠·둘러보기·길 가기·사고팔기로는 하나도 팔리지 않는다. 띠링은 울리지 않는다 (SB-D3, SB-D6)', () => {
  const s = withStall('custom');
  mine(s, 'frostiron_sword', { grade: 1 }); mine(s, 'frostiron_helm');
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'frostiron_helm') });
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'frostiron_sword') });
  const silver = s.silver, dings = s.dings.length;
  // 일이 아닌 것들
  s.place = 'saltgate';
  for (let i = 0; i < 40; i++) dispatch(s, { type: 'act', id: 'look' });
  dispatch(s, { type: 'move', to: 'scaleyard' }); dispatch(s, { type: 'buy', id: 'salt' }); dispatch(s, { type: 'sell', index: s.bag.findIndex((x) => x.id === 'salt') });
  dispatch(s, { type: 'move', to: 'saltgate' });
  s.phase = 2; dispatch(s, { type: 'act', id: 'rest' });
  s.flags.noAmbush = true; travel(s, 'saltfloor'); travel(s, 'saltgate'); // 길에서 싸우지 않았다면
  assert.equal(s.stall.items.length, 2, '하나도 팔리지 않았다');
  assert.equal(s.stall.work, 0);
  // 일: 기도 스무 번
  const before = s.silver;
  work(s, 19);
  assert.equal(s.stall.items.length, 2);
  assert.equal(stallView(s).left, 1);
  work(s, 1);
  // 등급이 높은 것이 먼저 팔린다. 은화는 바로 주머니로, 대화방에 한 줄
  const price = worth({ id: 'frostiron_sword', grade: 1 });
  assert.deepEqual(s.stall.items.map((x) => x.id), ['frostiron_helm']);
  assert.equal(s.silver, before + price);
  assert.ok(s.log.some((l) => l.who === '가게' && l.text === `손님이 고급 서릿쇠 검을 사 갔다. 은화 +${price}.`));
  assert.ok(!s.dings.slice(dings).some((d) => /가게|손님|팔/.test(d.title + (d.body || ''))), '팔려도 띠링은 울리지 않는다');
  assert.equal(s.stall.regulars, 1);
  assert.ok(silver > 0);
  // 날이 바뀌면 "어제 팔린 것"에 남는다
  assert.equal(stallView(s).sold.length, 0);
  s.phase = 2; s.place = 'saltgate'; dispatch(s, { type: 'act', id: 'rest' });
  assert.deepEqual(stallView(s).sold, [{ name: '고급 서릿쇠 검', silver: price }]);
  // 좌판이 비면 일을 세지 않는다
  work(s, 20);
  assert.equal(s.stall.items.length, 0);
  work(s, 30);
  assert.equal(s.stall.work, 0);
});

test('M16-6 판 수만큼 단골이 늘어 손님이 잦아진다: 스무 번에 하나에서 여덟 번에 하나까지 (SB-D5, LV-K6)', () => {
  const s = withStall('regular');
  assert.equal(stallEvery(s), 20);
  s.stall.regulars = 12; assert.equal(stallEvery(s), 20, '시안의 그림: 단골 12명에 스무 번');
  s.stall.regulars = 25; assert.equal(stallEvery(s), 19);
  s.stall.regulars = 300; assert.equal(stallEvery(s), 8);
  s.stall.regulars = 5000; assert.equal(stallEvery(s), 8, '여덟 번보다 잦아지지는 않는다');
  // 저울목에서 이름이 나면 한 번씩 더 줄어든다
  s.stall.regulars = 0; s.fame['저울목'] = 30;
  assert.equal(stallEvery(s), 18);
  // 묶음은 하나씩 팔린다
  mine(s, 'dish_snowpot', { n: 3 });
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  work(s, 18);
  assert.equal(s.stall.items[0].n, 2);
  // 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back.stall, s.stall);
});

// ── M16-7 종 조각 창고와 소금 기둥의 징수인 (SB-A11, LV-I3) ──
/** 창고를 맨 안쪽까지 간다. 방의 일(싸움, 함정, 문)을 넘으며. */
export const raid = (s, upTo = 'd5-pillar') => {
  walk(s, 'warehouse');
  s.choice = null;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'shardhouse' });
  for (const id of ['d1-sacks', 'd2-scale', 'd2-ledger', 'd2-scale', 'd3-guard', 'd4-lock', 'd4-shelf', 'd5-pillar']) {
    heal(s);
    dispatch(s, { type: 'room', to: id });
    if (id === upTo && id === 'd5-pillar') return;
    fight(s);
    if (s.choice?.kind === 'trap') { s.stats.agi += 60; dispatch(s, { type: 'choose', id: 'dodge' }); s.stats.agi -= 60; }
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon.room, id);
    if (id === upTo) return;
  }
};

test('M16-7 종 조각 창고는 다섯 칸이고, 지금 폐허와 같은 틀이다. 안에서는 목이 마르지 않는다 (SB-A11)', () => {
  const d = DUNGEONS.shardhouse;
  assert.deepEqual([d.name, d.from, d.floors.length], ['종 조각 창고', 'warehouse', 5]);
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.floor))].sort(), [0, 1, 2, 3, 4]);
  for (const [id, r] of Object.entries(d.rooms)) { assert.ok(r.text && r.name, id); for (const x of r.exits) assert.ok(d.rooms[x].exits.includes(id), `${id} ↔ ${x}`); }
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.kind))].sort(), ['boss', 'door', 'fight', 'hall', 'rest', 'trap', 'treasure']);
  const s = salted('depot', { at: 'saltgate' });
  walk(s, 'warehouse');
  assert.ok(slotsNow(s).some((x) => x.label === '창고로 숨어든다'));
  s.choice = null; s.water = 4;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'shardhouse' });
  assert.equal(roomView(s).dungeon, '종 조각 창고');
  dispatch(s, { type: 'room', to: 'd1-sacks' }); fight(s);
  for (let i = 0; i < 6; i++) { dispatch(s, { type: 'room', to: 'd1-plank' }); dispatch(s, { type: 'room', to: 'd1-sacks' }); }
  assert.equal(s.water, 4, '창고 안은 들판이 아니다');
  assert.ok(bodyView(s).thirst, '물 칸은 보인다(소금벌 안이다)');
  assert.equal(dungeonMap(s)[0].name, '첫째 칸');
});

test('M16-7 징수인은 보통 몬스터의 생명력 4배·공격력 1.25배다. 쓰러뜨리면 소금 기둥이 무너진다 (LV-I3)', () => {
  const m = MONSTERS.taxcollector;
  assert.deepEqual([m.name, m.level, m.boss, m.band], ['소금 기둥의 징수인', 40, true, 4]);
  const n = normalAt(40);
  assert.deepEqual(n, { hp: Math.round(BANDS[3].mon.hp * 1.2), attack: Math.round(BANDS[3].mon.attack * 1.2), defense: Math.round(BANDS[3].mon.defense * 1.2) });
  assert.deepEqual([m.hp, m.attack, m.defense], [n.hp * 4, Math.round(n.attack * 1.25), n.defense]);
  assert.ok(m.hp > MONSTERS.weigher.hp * 3.5 && m.attack > MONSTERS.weigher.attack * 1.2);
  const s = salted('collector', { at: 'saltgate' });
  s.level = 40; s.stats.str += 40; s.stats.con += 30;
  s.main.chapter = 99; // 장의 끝은 M16-8에서 본다
  raid(s);
  assert.equal(s.battle.mon, 'taxcollector', '말이 통하지 않는다. 들어서면 바로 싸운다');
  assert.equal(enemyView(s).boss, true);
  fight(s);
  assert.equal(s.battle, null);
  assert.equal(s.dmem.shardhouse.keeper, 'beat');
  assert.ok(s.log.some((l) => l.text === DUNGEONS.shardhouse.bossDown));
  assert.ok(s.bag.some((x) => x.id === 'saltsteel') && s.bag.some((x) => x.id === 'scorpshell'), '소금강과 전갈 껍질을 꼭 떨군다');
});

// ── M16-8 7장 팔린 종 (SB-F, LV-D7) ──
const friend = (s, id, pts = 30) => { s.people[id] = { pts, talked: 0, likes: [], dislikes: [], stats: [], met: true }; };

test('M16-8 7장의 퀘스트 창: 팔린 종과 푸는 길 셋. 유겸과 처음 만날 때 쥐어 본 조각의 띠링은 기록에 남지 않는다 (SB-F, SB-F1)', () => {
  const s = salted('ch7', { at: 'saltgate' });
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [7, '팔린 종']);
  assert.equal(v.text, '저울목의 종은 쪼개졌다. 상단이 조각을 하나씩 판다. 조각을 쥔 사람은 무엇을 하든 띠링을 듣는다. 값만 치르면. 장터에서는 누가 정말 해낸 사람인지 아무도 가리지 못한다.');
  assert.deepEqual(v.paths.map((p) => [p.name, p.have, p.need]), [['터는 길', 0, 1], ['사 모으는 길', 0, 7], ['돌려세우는 길', 0, 5]]);
  assert.ok(!v.text.includes('아직 쓰이지 않았다'), '소금벌의 이야기는 이제 쓰였다');
  assert.ok(!slotsNow(s).some((x) => /조각|저울꾼/.test(x.label)));
  const dings = s.dings.length;
  walk(s, 'warehouse');
  const said = s.log.slice(-4).map((l) => [l.k, l.who || '', l.text]);
  assert.deepEqual(said, YUGYEOM_FIRST.map(([k, text]) => [k, k === 'npc' ? '상단 대리인 유겸' : '', text]));
  assert.equal(s.dings.length, dings, '쥐어 본 조각의 띠링은 기록에 남지 않는다');
  // 처음 한 번만
  walk(s, 'saltgate'); walk(s, 'warehouse');
  assert.equal(s.log.filter((l) => l.text === '띠링! 조각을 쥐었습니다.').length, 1);
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['둘러보기', '조각 사기 (은화 4,000)', '저울꾼을 돌려세운다', '창고로 숨어든다']);
});

test('M16-8 터는 길: 징수인을 쓰러뜨리면 조각이 다시 붙는다. 잿골 길이 열린다 (SB-F3)', () => {
  const s = salted('raid', { at: 'saltgate' });
  s.level = 40; s.stats.str += 40; s.stats.con += 30;
  raid(s); fight(s);
  assert.equal(s.main.chapter, 8);
  assert.deepEqual(s.main.done.at(-1).path, 'raid');
  assert.equal(s.main.called, '창고를 턴 이');
  assert.ok(s.log.some((l) => l.text === MAIN[7].paths[0].done));
  assert.ok(s.opened.includes('ashroad'));
  assert.ok(s.dings.some((d) => d.title.includes("7장 '팔린 종'") && d.body.includes('잿골로 가는 길이 열렸습니다')));
  // 잿골이 났다 (M17): 길이 열리면 지도에 가마골이 나오고, "아직 쓰이지 않았다"는 덧말은 걷혔다
  void ASH_ROAD_SAY;
  assert.ok(mapView(s).some((r) => r.name === '가마골'));
  assert.ok(!mapView(salted('noash')).some((r) => r.name === '가마골'));
});

test('M16-8 사 모으는 길: 조각 일곱을 하나에 은화 4,000에 산다 (SB-F4, SB-J6)', () => {
  const s = salted('buy', { at: 'saltgate' });
  assert.deepEqual(SHARD, { price: 4000, n: 7 });
  s.silver = 28000 + 500;
  assert.throws(() => dispatch(s, { type: 'shard' }), /대리인이 팝니다/);
  walk(s, 'warehouse');
  for (let i = 1; i <= 6; i++) { dispatch(s, { type: 'shard' }); assert.equal(mainView(s).paths[1].have, i); }
  assert.equal(s.main.chapter, 7);
  assert.equal(s.silver, 4500);
  dispatch(s, { type: 'shard' });
  assert.deepEqual([s.main.chapter, s.silver, s.main.called], [8, 500, '일곱 조각을 산 이']);
  assert.ok(s.log.some((l) => l.text === MAIN[7].paths[1].done));
  assert.throws(() => dispatch(s, { type: 'shard' }), /살 수 없습니다/);
  const poor = salted('poor', { at: 'warehouse' }); poor.flags.metYugyeom = true; poor.silver = 3999;
  assert.ok(slotsNow(poor).find((x) => x.label.startsWith('조각 사기')).disabled);
  assert.throws(() => dispatch(poor, { type: 'shard' }), /은화가 모자랍니다/);
});

test("M16-8 돌려세우는 길: 저울꾼 다섯과 '단골' 사이가 되어 상단을 떠나게 한다 (SB-F5)", () => {
  const s = salted('turn', { at: 'saltgate' });
  walk(s, 'warehouse');
  for (const id of WEIGHERS.slice(0, 4)) friend(s, id);
  assert.deepEqual([mainView(s).paths[2].have, mainView(s).paths[2].need], [4, 5]);
  const slot = slotsNow(s).find((x) => x.label === '저울꾼을 돌려세운다');
  assert.ok(slot.disabled && slot.sub === '단골 4 / 5');
  assert.throws(() => dispatch(s, { type: 'turn' }), /다섯 모두와/);
  friend(s, WEIGHERS[4], 29);
  assert.throws(() => dispatch(s, { type: 'turn' }), /다섯 모두와/);
  friend(s, WEIGHERS[4], 30);
  dispatch(s, { type: 'turn' });
  assert.deepEqual([s.main.chapter, s.main.called], [8, '저울을 내려놓게 한 이']);
  assert.ok(s.log.some((l) => l.text === MAIN[7].paths[2].done));
  // 세 길의 부르는 이름이 서로 다르다
  assert.equal(new Set(MAIN[7].paths.map((p) => p.called)).size, 3);
  // 저울꾼과는 말을 걸고 선물을 해서 가까워진다(다른 사람들과 같은 규칙)
  const t = salted('bond', { at: 'saltgate' });
  dispatch(t, { type: 'greet', npc: 'w_garam' });
  assert.ok(t.people.w_garam.met);
});

// ── M16-9 스스로 고르는 환생 (SB-E, LV-M3) ──
const reborn = (s, carry, origin = 'farmer') => createGame({ name: '다음', origin, rolled: rollDice('next'), seed: 'next-life', carry });

test('M16-9 "다시 태어나기"는 7장을 끝낸 사람에게만 사당에 보인다 (SB-E1, SB-I4)', () => {
  const s = salted('noreborn', { at: 'saltshrine' });
  assert.ok(!slotsNow(s).some((x) => x.label === '다시 태어나기'));
  assert.throws(() => chosenRebirth(s), /할 수 없는 일/);
  const t = sold('reborn', { at: 'saltshrine' });
  const slot = slotsNow(t).find((x) => x.label === '다시 태어나기');
  assert.equal(slot.open, 'reborn');
  assert.ok(chosenRebirth(t).chosen);
  // 사당에서만. 다른 사당(나루)에는 칸이 없다
  t.place = 'saltgate';
  assert.throws(() => chosenRebirth(t), /할 수 없는 일/);
  assert.ok(!PLACES.shrine.actions.includes('reborn'));
});

test('M16-9 스스로 고르면 끝낸 장마다 +0.5%p와 출신 패 한 장 더. 운으로 태어나는 것은 그대로다 (SB-E2, SB-E4, LV-M3)', () => {
  const s = sold('bonus', { at: 'saltshrine' });
  s.xp = 0;
  const total = levelTotal(s);
  const fate = rebirthCarry(s), mine = chosenRebirth(s);
  // 운: 1%, 패 다섯, 끝낸 장은 처음부터
  assert.deepEqual([fate.xp, fate.cards, fate.chosen, fate.mainPast], [Math.floor(total * 0.01), 5, false, undefined]);
  // 스스로: 일곱 장 × 0.5%p = 4.5%, 패 여섯
  assert.equal(chaptersDone(s).length, 7);
  assert.ok(Math.abs(mine.xpRate - 0.045) < 1e-9);
  assert.deepEqual([mine.xp, mine.cards], [Math.floor(total * 0.045), 6]);
  assert.equal(dealOrigins('패', mine.cards).length, 6);
  assert.equal(new Set(dealOrigins('패', 6)).size, 6);
  assert.deepEqual(dealOrigins('패').length, 5);
  // 여섯 장을 끝낸 사람이면 시안의 숫자: 4%
  const six = salted('six'); assert.ok(Math.abs(xpKeepOf(six, true) - 0.04) < 1e-9);
  // 숙련도·제작 레벨·던전 지도·히든·칭호·도감·보관함은 둘 다 그대로 (Z98과 같다)
  for (const k of ['skills', 'craftLv', 'craftTier', 'maps', 'hidden', 'titles', 'dex', 'bank']) assert.deepEqual(mine[k], fate[k], k);
  // 새 삶
  const a = reborn(s, fate), b = reborn(s, mine);
  assert.ok(b.level > a.level, '덤만큼 레벨이 더 붙는다');
  assert.deepEqual([a.main.chapter, a.main.past, a.opened.includes('saltflat')], [1, [], false], '운으로 태어나면 끝낸 장은 처음부터');
  assert.equal(b.lives, 2);
  assert.deepEqual([b.silver <= 100, b.job, Object.keys(b.people).length < 12, b.guild], [true, null, true, null], '레벨·직업·사람들과의 사이·길드·가진 것은 내려놓는다');
});

test('M16-9 다시 태어난 삶에서 끝낸 장은 건너뛰고, 열린 길은 그대로 다닌다. 다른 길로 다시 풀 수 있다 (SB-E3)', () => {
  const s = sold('skip', { at: 'saltshrine' });
  const n = reborn(s, chosenRebirth(s));
  assert.equal(n.main.chapter, 8);
  assert.deepEqual(n.main.done, []);
  assert.deepEqual(n.main.past.map((d) => d.chapter), [1, 2, 3, 4, 5, 6, 7]);
  const v = mainView(n);
  assert.deepEqual(v.past.map((d) => [d.chapter, d.name, d.pathName]).at(-1), [7, '팔린 종', '터는 길']);
  assert.equal(v.done.length, 0);
  // 열린 길
  for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat']) assert.ok(n.opened.includes(id), id);
  assert.ok(mapView(n).some((r) => r.name === '저울목'));
  assert.equal(n.ending, 'mend', '고른 끝이 바꾼 규칙도 그대로다');
  n.flags.noAmbush = true;
  travel(n, 'pass');
  assert.ok(slotsNow(n).some((x) => x.label === '고개를 넘는다'));
  // 다른 길로 다시 푼다: 그 장이 처음부터 열린다
  assert.throws(() => dispatch(n, { type: 'redo', chapter: 8 }), /지난 삶에서 끝낸 장이 아닙니다/);
  dispatch(n, { type: 'redo', chapter: 7 });
  assert.equal(n.main.chapter, 7);
  assert.deepEqual(mainView(n).paths.map((p) => p.have), [0, 0, 0]);
  assert.ok(!n.main.past.some((d) => d.chapter === 7));
  // 다른 길(사 모으는 길)로 끝내면 다시 건너뛴 장들 뒤로 간다
  n.place = 'warehouse'; n.flags.metYugyeom = true; n.silver = 28000;
  for (let i = 0; i < 7; i++) dispatch(n, { type: 'shard' });
  assert.deepEqual([n.main.chapter, n.main.done.at(-1).path, n.main.called], [8, 'buy', '일곱 조각을 산 이']);
  // 앞의 장을 다시 풀고 끝내도 건너뛴 장은 건너뛴다
  const m = reborn(s, chosenRebirth(s));
  dispatch(m, { type: 'redo', chapter: 6 });
  assert.equal(m.main.chapter, 6);
  m.dmem.icetower = { seen: [], done: {}, nights: 0, keeper: 'beat' };
  m.place = 'saltgate'; dispatch(m, { type: 'act', id: 'look' });
  assert.equal(m.main.chapter, 8, '6장을 끝내면 지난 삶에서 끝낸 7장은 건너뛴다');
  // 5장을 다시 풀면 끝이 걷힌다
  const e = reborn(s, chosenRebirth(s));
  dispatch(e, { type: 'redo', chapter: 5 });
  assert.deepEqual([e.main.chapter, e.ending], [5, null]);
  // 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: n })).state;
  assert.deepEqual(back.main, n.main);
});

test('M16-9 다시 태어나도 가게는 남는다. 찾은 옛 우물도 지도에 남는다 (SB-E2, LV-K11)', () => {
  const s = sold('keepstall', { at: 'scaleyard' });
  s.silver = 5000; owner(s); dispatch(s, { type: 'stall', op: 'buy' });
  mine(s, 'frostiron_helm'); dispatch(s, { type: 'stall', op: 'put', index: s.bag.length - 1 });
  s.stall.regulars = 40; s.wells = ['drychannel'];
  assert.equal(rebirthLoss(s).stall, true);
  s.place = 'saltshrine';
  for (const carry of [chosenRebirth(s), rebirthCarry(s)]) {
    const n = reborn(s, carry);
    assert.deepEqual([n.stall.regulars, n.stall.items.map((x) => x.id)], [40, ['frostiron_helm']]);
    assert.deepEqual(n.wells, ['drychannel']);
    n.stall.items.length = 0;
    assert.equal(s.stall.items.length, 1, '지난 삶의 것을 같이 고치지 않는다');
  }
});

// ── M16-10 서브 둘과 히든 (SB-F6, SB-F7, LV-E4) ──
test('M16-10 서브 "가짜 띠링 감정": 감정 숙련도로 빈손을 가려낸다 (SB-F6)', () => {
  const s = salted('fake', { at: 'scaleyard' });
  owner(s);
  assert.ok(offersOf(s, 'stallowner').includes('fakeding'));
  dispatch(s, { type: 'quest', op: 'accept', id: 'fakeding' });
  const v = subView(s, 'fakeding');
  assert.equal(v.step.text, '장터 사람 다섯 가운데 누가 조각 없이 띠링을 들은 사람인지 가려낸다. 감정 숙련도가 쓰인다.');
  const eye = v.step.choices.find((c) => c.id === 'eye');
  assert.ok(!eye.can && eye.why.includes('감정 숙련도'));
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'fakeding', choice: 'eye' }));
  s.skills.appraise = { grade: 10, xp: 0, uses: 0 };
  const silver = s.silver;
  dispatch(s, { type: 'quest', op: 'choose', id: 'fakeding', choice: 'eye' });
  assert.deepEqual([s.quests.fakeding.done, s.quests.fakeding.ending, s.silver], [true, '빈손을 가려냈다', silver + 300]);
  assert.ok(texts(s).includes('소금 자루를 삼백 번 묶은 손이다'));
});

test('M16-10 서브 "떼인 삯": 대리인에게 받아 내거나 내 은화로 대신 치른다 (SB-F7)', () => {
  const s = salted('pay', { at: 'barracks' });
  dispatch(s, { type: 'greet', npc: 'captain' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'backpay' });
  assert.equal(subView(s, 'backpay').step.text, '막사의 칼잡이 넷이 석 달 치 삯을 못 받았다. 대리인에게 받아 내거나, 내 은화로 대신 치른다.');
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'backpay', choice: 'mine' }), /상단 창고 앞/);
  walk(s, 'warehouse');
  s.silver = 1199;
  assert.ok(!subView(s, 'backpay').step.choices.find((c) => c.id === 'mine').can);
  s.silver = 1500;
  dispatch(s, { type: 'quest', op: 'choose', id: 'backpay', choice: 'mine' });
  assert.deepEqual([s.quests.backpay.done, s.quests.backpay.ending, s.silver], [true, '대신 치렀다', 300]);
  // 말로 받아 내는 길도 있다
  assert.deepEqual(SUBS.backpay.steps[0].choices.map((c) => c.check?.kind || 'pay'), ['persuade', 'threat', 'pay']);
  assert.deepEqual(SUB_ORDER.slice(8, 10), ['fakeding', 'backpay']);
});

test('M16-10 히든 "값을 매기지 않는 사람": 한 번도 값을 깎지 않고 백 번 판다. 조건은 화면과 도움말 어디에도 없다 (LV-E4)', () => {
  assert.equal(FAIR_SALES, 100);
  const s = withStall('fair');
  s.counters.fairSold = 98;
  mine(s, 'dish_snowpot', { n: 4 });
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  work(s, 20);
  assert.equal(s.counters.fairSold, 99);
  walk(s, 'scaleyard');
  assert.equal(s.hq.noprice, undefined, '아흔아홉 번으로는 나타나지 않는다');
  // 제값보다 싼 날 장터 가게에 내다 팔면 처음부터 다시 센다
  const cut = JSON.parse(JSON.stringify(s));
  give(cut, 'scorpshell', 1);
  while (marketRate(cut, 'scorpshell') >= 1) cut.day += 1;
  dispatch(cut, { type: 'sell', index: cut.bag.findIndex((x) => x.id === 'scorpshell') });
  assert.equal(cut.counters.fairSold, 0);
  // 제값이거나 비싼 날 판 것은 깎은 것이 아니다
  give(s, 'scorpshell', 1);
  while (marketRate(s, 'scorpshell') < 1) s.day += 1;
  dispatch(s, { type: 'sell', index: s.bag.findIndex((x) => x.id === 'scorpshell') });
  assert.equal(s.counters.fairSold, 99);
  // 백 번째
  work(s, 20);
  assert.equal(s.counters.fairSold, 100);
  assert.equal(s.hq.noprice, undefined, '저울 마당에 들어서야 나타난다');
  dispatch(s, { type: 'move', to: 'scaleyard' });
  assert.equal(s.hq.noprice.status, 'offered');
  assert.equal(s.choice.kind, 'hq');
  assert.ok(s.dings.at(-1).title.includes('값을 매기지 않는 사람'));
  dispatch(s, { type: 'choose', id: 'accept' });
  dispatch(s, { type: 'greet', npc: 'w_nuri' });
  if (s.hq.noprice.status !== 'done') talkTo(s, 'w_nuri');
  assert.equal(s.hq.noprice.status, 'done');
  assert.ok(texts(s).includes('여긴 지우지 않겠소'));
  // 조건이 화면에 나오지 않는다: 도움말, 가게 창, 히든 목록, 시세판
  const fresh = withStall('nohint');
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, { white: true, salt: true, stall: true, reborn: true })), stallView(fresh), hiddenView(fresh), hiddenSlots(fresh), pricesView(fresh), questBook(fresh), mainView(fresh), slotsNow(fresh), bodyView(fresh)]);
  assert.ok(!/백 번 판|100번|깎지 않고|값을 매기지 않는|fairSold/.test(shown));
  // 가 보기 전에는 도움말에 물·가게·다시 태어나기 이야기가 없다 (SB-I)
  const before = JSON.stringify(HELP.map((t) => helpBody(t, { white: true })));
  assert.ok(!/소금벌|마른 목|시세판|진열대|다시 태어나기/.test(before));
  const after = JSON.stringify(HELP.map((t) => helpBody(t, { salt: true, stall: true, reborn: true })));
  assert.ok(/마른 목/.test(after) && /시세판/.test(after) && /진열대/.test(after) && /다시 태어나기/.test(after));
});
