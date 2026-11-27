// M15 고개 너머의 소리: 흰마루(레벨 21~30). 곳, 추위, 가게와 일터, 얼음 낚시, 얼음 종루, 6장 얼린 종, 서브와 히든.
// 기준: systems.md "13차: 흰마루 화면"(WM-), roadmap.md M15-1 ~ M15-7. 여정은 journey-white.test.js.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, townRooms, enemyView, BEYOND_LINE, WHITE_FIRST } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { valueOf } from '../src/core/derived.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { MONSTERS } from '../src/data/monsters.js';
import { WILDS } from '../src/data/wild.js';

import { ended, heal, fight, travel, walk } from './_white.js';
const texts = (s) => s.log.map((l) => l.text).join('\n');

test('M15-1 끝을 보기 전에는 흰마루가 지도·소문·고갯길 칸 어디에도 없다 (WM-F1)', () => {
  const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'nowhite' });
  s.opened.push('ruins', 'dock', 'bigmarket'); s.level = 20;
  const rows = mapView(s);
  for (const id of ['icegate', 'snowfield', 'icelake']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/언못|눈밭|언 호수|흰마루/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/언못|흰마루|고개 너머/));
  s.place = 'pass';
  assert.ok(!slotsNow(s).some((x) => x.label === '고개를 넘는다'));
  assert.throws(() => dispatch(s, { type: 'travel', to: 'icegate' }), /아직 길을 모릅니다/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'snowfield' }), /아직 길을 모릅니다/);
});

test('M15-1 끝을 본 밤에 고개 너머에서 소리가 들리고, 고개를 넘어 언못에 닿는다 (WM-A1, WM-D2, WM-F5)', () => {
  const s = ended('cross', { night: false });
  assert.ok(!mapView(s).some((r) => r.id === 'icegate'), '그 밤이 오기 전에는 아직 없다');
  while (s.phase !== 2) passPhase(s);
  assert.ok(texts(s).includes(BEYOND_LINE));
  assert.ok(s.opened.includes('icegate'));
  const rows = mapView(s);
  assert.equal(rows.find((r) => r.id === 'icegate').name, '언못');
  assert.ok(rows.find((r) => r.id === 'snowfield') && rows.find((r) => r.id === 'icelake'));
  travel(s, 'bigmarket'); travel(s, 'pass');
  const slot = slotsNow(s).find((x) => x.label === '고개를 넘는다');
  assert.deepEqual(slot.action, { type: 'travel', to: 'icegate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'icegate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 25, '반나절 길');
  assert.ok(texts(s).includes(WHITE_FIRST[0]) && texts(s).includes(WHITE_FIRST[1]));
  // 처음 한 번만
  travel(s, 'snowfield'); travel(s, 'icegate');
  assert.equal(s.log.filter((l) => l.text === WHITE_FIRST[0]).length, 1);
  assert.equal(s.dex.places.icegate, true);
});

test('M15-1 언못의 방 여섯과 사냥터 둘. 눈밭에서 서리 여우를 만난다 (WM-A2~A9)', () => {
  assert.deepEqual(TOWNS['언못'].order, ['icegate', 'icehole', 'frostforge', 'hearth', 'hunterhut', 'underbell']);
  for (const id of [...TOWNS['언못'].order, 'snowfield', 'icelake']) {
    const p = PLACES[id];
    assert.equal(p.band, 3, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  assert.deepEqual(WILDS.snowfield.monsters.map((m) => m.id), ['frostfox', 'snowowl']);
  assert.deepEqual(WILDS.icelake.monsters.map((m) => m.id), ['iceboar', 'iciclespider']);
  assert.deepEqual([21, 23, 25, 27], ['frostfox', 'snowowl', 'iceboar', 'iciclespider'].map((m) => MONSTERS[m].level));
  const s = ended('fox');
  travel(s, 'icegate');
  assert.deepEqual(townRooms(s).map((r) => r.name), ['언못 어귀', '얼음 낚시터', '서리 대장간', '화롯방 주막', '사냥꾼 움막', '종루 아래']);
  travel(s, 'snowfield');
  assert.deepEqual(slotsNow(s).filter((x) => !x.disabled || x.action?.id === 'torch').map((x) => x.label).slice(0, 2), ['탐색', '횃불']);
  const seen = new Set();
  let n = 0;
  while (!seen.has('frostfox') && n++ < 600) {
    if (s.battle) { seen.add(s.battle.mon); s.battle.hp = 1; heal(s); dispatch(s, { type: 'battle', choice: 'attack' }); }
    else if (s.choice) dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id });
    else if (s.place !== 'snowfield') { if (s.place === 'temple') dispatch(s, { type: 'move', to: 'plaza' }); travel(s, 'snowfield'); }
    else dispatch(s, { type: 'act', id: 'explore' });
    heal(s); s.warm = 100;
  }
  assert.ok(seen.has('frostfox'));
});

// ── M15-2 추위 (WM-B) ──
import { bodyView, SAVE_VERSION } from '../src/core/game.js';
import { coldView, coldTire, coolPerMove, COLD_LINES } from '../src/core/cold.js';
import { parseSave } from '../src/core/save.js';
import { addItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';

/** 눈밭에서 n번 움직인다(탐색, 싸움의 한 턴, 선택 하나가 저마다 한 번). 때는 phase에 묶어 둔다. */
const moveInField = (s, n, phase = 1) => {
  for (let i = 0; i < n; i++) {
    s.phase = phase; s.tick = 0; s.tired = 0; s.full = 80; s.hp = valueOf(s, 'maxHp');
    if (s.battle) dispatch(s, { type: 'battle', choice: 'defend' });
    else if (s.choice) dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'leave' : slotsNow(s).at(-1).action.id });
    else dispatch(s, { type: 'act', id: 'explore' });
    assert.equal(s.place, 'snowfield', '눈밭을 떠나지 않는다');
  }
};
const wear = (s, id) => { const d = ITEMS[id]; s.equip[d.slot === 'ring' ? 'ring1' : d.slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };

test('M15-2 준비 없이 낮에 40번 움직이면 체온 60, 식은 몸이 된다 (WM-B3)', () => {
  const s = ended('cold1');
  travel(s, 'icegate'); travel(s, 'snowfield'); fight(s);
  s.warm = 100; s.torch = 0;
  moveInField(s, 39);
  assert.equal(s.warm, 61);
  assert.equal(coldView(s).stage, 0);
  moveInField(s, 1);
  assert.equal(s.warm, 60);
  const v = coldView(s);
  assert.deepEqual([v.warm, v.stage, v.tag.name, v.tag.text], [60, 1, '식은 몸', '피로가 1.5배로 쌓인다']);
  assert.ok(s.log.some((l) => l.text === COLD_LINES.cool), '대화방에도 한 줄 (WM-B2)');
  assert.equal(coldTire(s), 1.5);
  assert.equal(bodyView(s).cold.tag.name, '식은 몸');
});

test('M15-2 횃불 하나와 털옷 둘이면 같은 40번에 체온 84. 밤에는 두 배로 식는다 (WM-B3)', () => {
  const s = ended('cold2');
  travel(s, 'icegate'); travel(s, 'snowfield'); fight(s);
  wear(s, 'frostiron_gloves'); wear(s, 'frostiron_boots');
  assert.equal(ITEMS.frostiron_gloves.name, '흰털 가죽 장갑');
  addItem(s, 'torch', 2);
  s.warm = 100; s.choice = null;
  assert.equal(slotsNow(s).find((x) => x.label === '횃불').sub, '가방에 2개');
  dispatch(s, { type: 'act', id: 'torch' });
  assert.equal(s.torch, 60);
  assert.equal(s.warm, 100, '켜는 것은 움직임이 아니다');
  assert.ok(s.log.some((l) => l.text === COLD_LINES.torchOn));
  assert.throws(() => dispatch(s, { type: 'act', id: 'torch' }), /이미 켜져/);
  moveInField(s, 40);
  assert.equal(s.warm, 84);
  if (!s.battle && !s.choice) assert.equal(slotsNow(s).find((x) => x.label === '횃불').sub, '켜짐 · 20번 남음');
  moveInField(s, 20);
  assert.equal(s.torch, 0);
  assert.ok(s.log.some((l) => l.text === COLD_LINES.torchOut));
  // 밤: 준비 없이 한 번에 2
  const n = ended('cold3');
  travel(n, 'icegate'); travel(n, 'snowfield'); fight(n);
  n.warm = 100; n.torch = 0;
  moveInField(n, 10, 2);
  assert.equal(n.warm, 80);
  assert.equal(coolPerMove(n), 2);
});

test('M15-2 언 몸은 피로 2배에 공격력 −10%, 0이면 쓰러진다. 마을에서는 풀린다 (WM-B3)', () => {
  const s = ended('cold4');
  travel(s, 'icegate'); travel(s, 'snowfield'); fight(s);
  s.warm = 100;
  const attack = valueOf(s, 'attack');
  s.warm = 30;
  assert.equal(coldView(s).tag.name, '언 몸');
  assert.equal(coldTire(s), 2);
  assert.equal(valueOf(s, 'attack'), attack - Math.round(attack * 0.1));
  // 마을 안에서는 한 번 움직일 때마다 +5
  travel(s, 'icegate');
  const at = s.warm;
  dispatch(s, { type: 'move', to: 'hunterhut' });
  assert.equal(s.warm, at + 5);
  dispatch(s, { type: 'move', to: 'frostforge' });
  assert.equal(s.warm, at + 10);
  // 못 위의 낚시터에서는 풀리지도 식지도 않는다
  dispatch(s, { type: 'move', to: 'icehole' });
  const onIce = s.warm;
  dispatch(s, { type: 'act', id: 'fish' });
  assert.equal(s.warm, onIce);
  // 0이면 쓰러진다
  const f = ended('cold5');
  travel(f, 'icegate'); travel(f, 'snowfield'); fight(f);
  f.warm = 1; f.choice = null; f.silver = 100;
  let ev = [];
  for (let i = 0; i < 5 && f.place === 'snowfield'; i++) { f.hp = valueOf(f, 'maxHp'); f.tired = 0; ev = dispatch(f, f.battle ? { type: 'battle', choice: 'defend' } : f.choice ? { type: 'choose', id: 'leave' } : { type: 'act', id: 'explore' }); }
  assert.ok(ev.some((e) => e.type === 'fall' && e.info.frozen));
  assert.equal(f.place, 'temple');
  assert.equal(f.shadow, 1, '지금의 쓰러짐과 같은 규칙');
});

test('M15-2 흰마루 밖에서는 체온 칸도 이름표도 없다. 눈밭 전골은 체온 +40 (WM-B1, WM-F2)', () => {
  const s = ended('cold6');
  assert.equal(bodyView(s).cold, null);
  assert.ok(!JSON.stringify(bodyView(s)).match(/체온|식은 몸|언 몸/));
  s.warm = 20; // 밖에서는 숫자가 남아 있어도 벌이 없다
  assert.equal(coldTire(s), 1);
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(s.warm, 100);
  travel(s, 'icegate');
  assert.equal(bodyView(s).cold.warm, 100);
  travel(s, 'snowfield'); fight(s);
  s.warm = 50; s.choice = null;
  addItem(s, 'dish_snowpot', 1);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  assert.equal(s.warm, 90);
  assert.ok(s.log.at(-1).text.includes('체온 +40'));
  // 밖에서 먹으면 체온 말이 없다
  const o = ended('cold7');
  addItem(o, 'dish_snowpot', 1);
  dispatch(o, { type: 'use', index: o.bag.findIndex((x) => x.id === 'dish_snowpot') });
  assert.ok(!o.log.at(-1).text.includes('체온'));
});

test('M15-2 13판 저장은 지금 판으로 올라온다: 체온은 가득, 횃불은 꺼진 채 (저장 판)', () => {
  const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'v13' });
  const old = JSON.parse(JSON.stringify(s));
  delete old.warm; delete old.torch; old.v = 13;
  const up = parseSave(JSON.stringify({ v: 13, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual([up.warm, up.torch], [100, 0]);
  // 끝을 본 옛 저장은 읽을 때 흰마루 길이 열린다 (그 밤은 이미 지났다)
  const e = JSON.parse(JSON.stringify(ended('v13e', { night: false })));
  delete e.warm; delete e.torch; e.v = 13; e.day = 40; e.endDay = 12;
  const up2 = parseSave(JSON.stringify({ v: 13, rev: 1, savedAt: 1, state: e })).state;
  assert.ok(up2.opened.includes('icegate'));
  assert.equal(up2.main.chapter, 6);
});

// ── M15-3 가게와 일터 (WM-A4~A6, WM-C) ──
import { recipeList, craftLvView } from '../src/core/craft.js';
import { ORDER_OF, RECIPES } from '../src/data/recipes.js';
import { shopView } from '../src/core/trade.js';
import { boardView } from '../src/core/quests.js';
import { restBuff } from '../src/core/buffs.js';
import { JOBS as BOARD } from '../src/data/quests.js';

const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 60) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null);
};

test('M15-3 서리 대장간: 강철 갑옷을 지은 사람이 서릿쇠 검까지 지어 대장 4단계가 열린다 (WM-A4, WM-C2)', () => {
  const s = ended('forge');
  travel(s, 'icegate'); walk(s, 'frostforge');
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['만들기', '상점', '고치기', '강화']);
  assert.ok(shopView(s).goods.some((g) => g.name === '서릿쇠 덩이'));
  // 대장 8(2단계의 끝)에서 멈춰 있다. 그동안 쌓은 경험이 있다
  s.craftLv.smith = { lv: 8, xp: 270 }; s.craftTier.smith = 2;
  assert.ok(!recipeList(s, ORDER_OF.smith).some((r) => r.id.startsWith('frostiron_')), '3단계 설계도는 아직 나오지 않는다 (WM-F3)');
  assert.equal(craftLvView(s, 'smith').promo, '강철 갑옷');
  make(s, 'steelarmor');
  assert.equal(s.craftTier.smith, 3);
  assert.equal(s.craftLv.smith.lv, 11, '멈춘 동안 쌓은 경험이 한꺼번에 오른다');
  const list = recipeList(s, ORDER_OF.smith).filter((r) => r.id.startsWith('frostiron_'));
  assert.deepEqual(list.filter((r) => r.promo).map((r) => r.name), ['서릿쇠 검'], '승급작 이름표');
  assert.ok(list.find((r) => r.name === '서릿쇠 갑옷').locked, '대장 12는 아직 잠겨 있다');
  make(s, 'frostiron_sword');
  assert.equal(s.craftTier.smith, 4, '대장 4단계가 열린다');
  assert.ok(s.bag.some((x) => x.id === 'frostiron_sword'));
  assert.ok(s.dings.some((d) => d.title.includes('대장 4단계')));
});

test('M15-3 화롯방 주막: 방 30, 화롯불 곁이 붙은 한 때 동안 식지 않는다 (WM-A5, WM-C1)', () => {
  const s = ended('hearth');
  travel(s, 'icegate'); walk(s, 'hearth');
  s.silver = 100; s.phase = 2; s.tick = 0; s.warm = 40;
  const labels = slotsNow(s).map((x) => x.label);
  assert.deepEqual(labels, ['방 빌리기 (은화 30)', '보관함', '요리', '소문 게시판']);
  assert.equal(slotsNow(s)[0].sub, '화롯불 곁: 한 때 동안 체온이 식지 않는다');
  dispatch(s, { type: 'act', id: 'room' });
  assert.equal(s.silver, 70);
  assert.equal(s.warm, 100, '자면 가득');
  assert.deepEqual([s.phase, restBuff(s).name, restBuff(s).until.phase], [0, '화롯불 곁', 1]);
  assert.ok(s.log.some((l) => l.text === '잘 잔 몸: 화롯불 곁. 한 때 동안 체온이 식지 않는다. 낮이 되기 전까지.'));
  assert.ok(s.log.some((l) => l.who === '주막 할멈' && l.text.includes('끝까지 해 봐야 종이 안 우니까')));
  // 그 한 때(아침) 동안은 들판에서도 식지 않는다. 낮이 되면 다시 식는다
  s.place = 'snowfield'; s.choice = null;
  moveInField(s, 10, 0);
  assert.equal(s.warm, 100);
  moveInField(s, 10, 1);
  assert.equal(s.warm, 90);
  // 다른 마을의 방 값은 그대로 10
  const t = ended('inn10'); t.place = 'tavern';
  assert.ok(slotsNow(t).some((x) => x.label === '방 빌리기 (은화 10)'));
});

test('M15-3 사냥꾼 움막: 게시판, 용병, 바느질, 가죽을 파는 상점 (WM-A6)', () => {
  const s = ended('hut');
  travel(s, 'icegate'); walk(s, 'hunterhut');
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['게시판', '용병', '바느질', '상점']);
  const cards = boardView(s);
  assert.ok(cards.length >= 3);
  for (const c of cards) assert.equal(BOARD[c.id].at, 'hut');
  assert.ok(shopView(s).goods.some((g) => g.name === '흰털 가죽'));
  // 가져오는 의뢰의 삯은 사서 채우는 값보다 적다 (거저 벌리지 않게)
  for (const j of Object.values(BOARD).filter((x) => x.at === 'hut' && x.kind === 'bring')) assert.ok(j.silver < ITEMS[j.item].price * j.n, j.name);
  s.silver = 200;
  dispatch(s, { type: 'party', op: 'hire' });
  assert.equal(s.party[0].id, 'solgae', '이 구간의 용병 셋 (JD-G3에서 바뀜)');
  // 바느질: 흰털 가죽 장갑 (재봉 3단계가 열린 사람)
  s.craftLv.sew = { lv: 9, xp: 0 }; s.craftTier.sew = 3;
  make(s, 'frostiron_gloves');
  assert.ok(s.bag.some((x) => x.id === 'frostiron_gloves'));
});

// ── M15-4 얼음 낚시터 (WM-A3, WM-B3, WM-F4) ──
test('M15-4 식은 몸일 때만 얼음 밑 은어가 잡히고, 잡기 전에는 도감에 이름이 없다', () => {
  const cast = (seed, warm, n) => {
    const s = ended(seed);
    travel(s, 'icegate'); walk(s, 'icehole');
    assert.deepEqual(slotsNow(s).map((x) => x.label), ['낚시']);
    s.warm = warm;
    for (let i = 0; i < n; i++) { s.tired = 0; s.full = 80; s.phase = 1; s.tick = 0; dispatch(s, { type: 'act', id: 'fish' }); assert.equal(s.warm, warm, '못 위에서는 체온이 그대로다'); }
    return s;
  };
  const warm = cast('fishwarm', 100, 200);
  assert.equal(warm.bag.filter((x) => x.id === 'silverfish').length, 0, '몸이 더우면 한 마리도 물지 않는다');
  assert.ok(warm.bag.some((x) => x.id === 'crucian'));
  assert.ok(!warm.dex.items.silverfish, '도감에 없다 (WM-F4)');
  assert.ok(!JSON.stringify(warm.log).includes('은어'));
  const cool = cast('fishcool', 55, 200);
  const got = cool.bag.find((x) => x.id === 'silverfish');
  assert.ok(got && got.n >= 10, `식은 몸으로 200번에 ${got?.n}마리`);
  assert.equal(cool.dex.items.silverfish, true);
  assert.equal(ITEMS.silverfish.name, '얼음 밑 은어');
  assert.ok(cool.skills.fishing.grade > 0);
});

// ── M15-5 얼음 종루와 잠든 종의 파수꾼 (WM-A10, LV-I3) ──
import { roomView, dungeonMap } from '../src/core/game.js';
import { DUNGEONS } from '../src/data/dungeon.js';
import { BANDS, normalAt, BOSS } from '../src/data/bands.js';

/** 종루를 맨 위까지 오른다. 방의 일(싸움, 함정, 문)을 넘으며. */
export const climb = (s, upTo = 't5-bell') => {
  walk(s, 'underbell');
  s.choice = null;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'icetower' });
  for (const id of ['t1-hall', 't1-stair', 't2-step', 't2-store', 't2-step', 't3-loft', 't4-door', 't4-ropes', 't5-bell']) {
    s.warm = 100; heal(s);
    dispatch(s, { type: 'room', to: id });
    if (id === upTo && id === 't5-bell') return;
    fight(s);
    if (s.choice?.kind === 'trap') { s.stats.agi += 60; dispatch(s, { type: 'choose', id: 'dodge' }); s.stats.agi -= 60; }
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon.room, id);
    if (id === upTo) return;
  }
};

test('M15-5 얼음 종루는 다섯 층이고, 지금 폐허와 같은 틀이다. 안에서는 몸이 식는다 (WM-A10)', () => {
  const d = DUNGEONS.icetower;
  assert.equal(d.floors.length, 5);
  assert.equal(d.from, 'underbell');
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.floor))].sort(), [0, 1, 2, 3, 4]);
  for (const [id, r] of Object.entries(d.rooms)) { assert.ok(r.text && r.name, id); for (const x of r.exits) assert.ok(d.rooms[x].exits.includes(id), `${id} ↔ ${x}`); }
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.kind))].sort(), ['boss', 'door', 'fight', 'hall', 'rest', 'trap', 'treasure']);
  const s = ended('tower');
  travel(s, 'icegate'); walk(s, 'underbell');
  assert.ok(slotsNow(s).some((x) => x.label === '종루로 올라간다'));
  s.choice = null;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'icetower' });
  assert.equal(roomView(s).dungeon, '얼음 종루');
  assert.equal(roomView(s).exits[0].dir, '동');
  s.warm = 100; s.phase = 1; s.tick = 0;
  dispatch(s, { type: 'room', to: 't1-hall' });
  assert.equal(s.warm, 99, '종루 안은 들판처럼 식는다');
  fight(s);
  dispatch(s, { type: 'room', to: 't1-stair' });
  assert.equal(roomView(s).exits.find((x) => x.id === 't2-step').dir, '위로');
  assert.equal(dungeonMap(s)[0].name, '1층');
});

test('M15-5 파수꾼은 보통 몬스터의 생명력 4배·공격력 1.25배다. 쓰러뜨리면 얼음이 깨진다 (LV-I3)', () => {
  const m = MONSTERS.bellwarden;
  assert.deepEqual([m.name, m.level, m.boss], ['잠든 종의 파수꾼', 30, true]);
  const f = 1 + (30 - 25) * 0.04, b = BANDS[2].mon;
  const normal = { hp: Math.round(b.hp * f), attack: Math.round(b.attack * f), defense: Math.round(b.defense * f) };
  assert.deepEqual(normalAt(30), normal);
  assert.equal(m.hp, normal.hp * 4);
  assert.equal(m.attack, Math.round(normal.attack * 1.25));
  assert.equal(m.defense, normal.defense);
  assert.deepEqual([BOSS.hp, BOSS.attack], [4, 1.25]);
  // 같은 레벨의 보통 몬스터(고드름 거미 27)와 견주어도 그 틀이다
  assert.ok(m.hp > MONSTERS.iciclespider.hp * 3.5 && m.attack > MONSTERS.iciclespider.attack * 1.2);
  const s = ended('warden');
  s.level = 30; s.stats.str += 30; s.stats.con += 20;
  travel(s, 'icegate');
  climb(s);
  assert.equal(s.battle.mon, 'bellwarden', '말이 통하지 않는다. 들어서면 바로 싸운다');
  assert.equal(enemyView(s).boss, true);
  assert.equal(s.flags.keeperAlive, true);
  fight(s);
  assert.equal(s.battle, null);
  assert.equal(s.dmem.icetower.keeper, 'beat');
  assert.equal(s.flags.keeperAlive, true, '폐허의 문지기와는 다른 이야기다');
  assert.ok(s.log.some((l) => l.text === DUNGEONS.icetower.bossDown));
  assert.equal(s.dungeon.room, 't5-bell');
});

// ── M15-6 6장 얼린 종 (WM-D, LV-D6) ──
import { mainView } from '../src/core/quests.js';
import { MAIN, HANSOL_FIRST, SALT_ROAD_SAY } from '../src/data/quests.js';
import { xpNeeded } from '../src/core/skills.js';
import { BONDS } from '../src/data/people.js';

test('M15-6 6장은 고개 너머의 소리를 들은 뒤에 보인다. 길 셋이 미리 보인다 (WM-D, WM-F1)', () => {
  const before = ended('ch6a', { night: false });
  assert.ok(mainView(before).name.startsWith('끝난 뒤'));
  assert.ok(!JSON.stringify(mainView(before)).match(/언못|얼린 종|종지기/));
  const s = ended('ch6a');
  const v = mainView(s);
  assert.equal(v.name, '얼린 종');
  assert.equal(v.text, '언못의 종은 삼십 년째 얼음 속에 있다. 종지기가 얼렸다. 종이 답할 때마다 닳는다는 것을 알고, 닳지 않게 재운 것이다. 그 뒤로 이 마을에서는 누구도 띠링을 듣지 못했고, 누구도 끝까지 하지 않는다.');
  assert.deepEqual(v.paths.map((p) => p.name), ['쓰러뜨리는 길', '끝까지 하는 길', '말하는 길']);
  assert.equal(new Set(MAIN[6].paths.map((p) => p.called)).size, 3, '부르는 이름은 길마다 다르다');
  // 옛 저장(13판)의 끝낸 사람에게도 열린다
  const old = JSON.parse(JSON.stringify(ended('ch6old', { night: false })));
  delete old.warm; delete old.torch; old.v = 13; old.day = 30; old.endDay = 9;
  const up = parseSave(JSON.stringify({ v: 13, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(mainView(up).name, '얼린 종');
});

test('M15-6 쓰러뜨리는 길: 파수꾼을 쓰러뜨리면 6장이 끝나고 소금벌 길이 열린다 (WM-D3)', () => {
  const s = ended('ch6beat');
  s.level = 30; s.stats.str += 30; s.stats.con += 20;
  travel(s, 'icegate');
  climb(s);
  const before = s.dings.length;
  fight(s);
  assert.equal(s.main.chapter, 7);
  assert.deepEqual([s.main.done[5].chapter, s.main.done[5].path], [6, 'beat']);
  assert.equal(s.main.called, '얼음을 깬 이');
  assert.ok(s.log.some((l) => l.text === '얼음이 금 가는 소리가 종루를 타고 내려갔다. 종이 한 번 울었다. 삼십 년 만이었다. 아래에서 누가 울기 시작했다.'));
  const d = s.dings.slice(before).find((x) => x.kind === 'main');
  assert.ok(d.title.includes("6장 '얼린 종'") && d.body.includes('소금벌로 내려가는 길이 열렸습니다'));
  assert.ok(s.opened.includes('saltflat'), '소금벌로 내려가는 길이 열린다');
  assert.ok(mapView(s).some((r) => r.name === '저울목'), '소금벌이 났다 (M16)');
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [7, '팔린 종']);
  assert.ok(SALT_ROAD_SAY && !v.text.includes(SALT_ROAD_SAY), '소금벌의 이야기는 이제 쓰였다');
  assert.equal(v.done.at(-1).pathName, '쓰러뜨리는 길');
});

test('M15-6 끝까지 하는 길: 얼음 구멍 낚시가 달인이 되면 종이 스스로 깬다 (WM-D4)', () => {
  const s = ended('ch6fish');
  travel(s, 'icegate'); walk(s, 'icehole');
  s.skills.fishing = { grade: 26, xp: xpNeeded(26) - 30, uses: 5000 };
  assert.deepEqual([mainView(s).paths[1].have, mainView(s).paths[1].need], [26, 27]);
  let n = 0;
  while (s.main.chapter === 6 && n++ < 200) { s.tired = 0; s.full = 80; s.phase = 1; s.tick = 0; dispatch(s, { type: 'act', id: 'fish' }); }
  assert.equal(s.skills.fishing.grade, 27);
  assert.deepEqual([s.main.chapter, s.main.done[5].path, s.main.called], [7, 'fish', '종을 깨운 낚시꾼']);
  assert.ok(s.log.some((l) => l.text === '띠링. 얼음 구멍 위에서 울린 소리가 종루까지 갔다가 돌아왔다. 종이 답한 것이다. 얼음 속에서, 깨우지도 않았는데.'));
  assert.equal(s.dmem.icetower, undefined, '종루에 오르지 않았다');
  // 강가에서 달인이 된 것으로는 끝나지 않는다. 얼음 구멍에 줄을 내려야 한다
  const r = ended('ch6river');
  r.skills.fishing = { grade: 27, xp: 0, uses: 9000 };
  travel(r, 'river');
  r.choice = null; fight(r);
  dispatch(r, { type: 'act', id: 'fish' });
  assert.equal(r.main.chapter, 6);
});

test('M15-6 말하는 길: 종지기와 가족 같은 사이가 되어 설득한다 (WM-D1, WM-D5)', () => {
  const s = ended('ch6talk');
  travel(s, 'icegate');
  assert.ok(!slotsNow(s).some((x) => x.label === '한솔을 설득한다'));
  walk(s, 'underbell');
  const said = s.log.slice(-HANSOL_FIRST.length).map((l) => [l.k, l.text]);
  assert.deepEqual(said, HANSOL_FIRST, '처음 만날 때의 글 (WM-D1)');
  assert.equal(s.log.at(-1).who, '종지기 한솔');
  assert.equal(s.log.at(-5).text, '종루가 통째로 얼음에 싸여 있다. 얼음 속에 종의 그림자가 비친다. 노인 하나가 문 앞의 눈을 쓴다.');
  walk(s, 'icegate'); walk(s, 'underbell');
  assert.equal(s.log.filter((l) => l.text === HANSOL_FIRST[0][1]).length, 1, '한 번만');
  const slot = () => slotsNow(s).find((x) => x.label === '한솔을 설득한다');
  assert.ok(slot().disabled);
  assert.throws(() => dispatch(s, { type: 'persuade' }), /가족 같은 사이/);
  s.people.hansol = { pts: BONDS[4].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.deepEqual([mainView(s).paths[2].have, mainView(s).paths[2].need], [4, 4]);
  assert.equal(s.main.chapter, 6, '사이가 됐다고 저절로 끝나지 않는다. 말을 해야 한다');
  assert.ok(!slot().disabled);
  dispatch(s, slot().action);
  assert.deepEqual([s.main.chapter, s.main.done[5].path, s.main.called], [7, 'talk', '종지기의 벗']);
  assert.ok(s.log.some((l) => l.text === '한솔이 빗자루를 세워 놓았다. "네 말이 맞아. 안 쓰면 닳지는 않지. 그런데 그건 종이 아니야." 그가 얼음에 손을 댔다.'));
  assert.ok(!slotsNow(s).some((x) => x.label === '한솔을 설득한다'));
  // 끝낸 뒤에 파수꾼을 쓰러뜨려도 장이 다시 끝나지 않는다
  s.level = 30; s.stats.str += 30; s.stats.con += 20;
  climb(s); fight(s);
  assert.equal(s.main.done.length, 6);
});

// ── M15-7 서브 둘과 히든 (WM-D6, WM-D7, LV-E3) ──
import { subView, questBook, hiddenView } from '../src/core/quests.js';
import { offersOf } from '../src/core/game.js';
import { HIDDENS, BELL_NIGHTS } from '../src/data/quests.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { hiddenSlots } from '../src/core/hidden.js';

test('M15-7 서브 "얼음 구멍의 임자": 가려 주거나, 큰 고기를 낚아 보인다 (WM-D6)', () => {
  const s = ended('sub1');
  travel(s, 'icegate'); walk(s, 'icehole');
  assert.deepEqual(offersOf(s, 'icefisher'), ['icehole']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'icehole' });
  const v = subView(s, 'icehole');
  assert.equal(v.name, '얼음 구멍의 임자');
  assert.deepEqual(v.step.choices.map((c) => c.id), ['judge', 'bigfish', 'none']);
  assert.ok(v.step.choices[0].chance > 0, '가려 주는 것은 판정이다');
  assert.ok(!v.step.choices[1].can);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'icehole', choice: 'bigfish' }), /얼음 밑 은어/);
  addItem(s, 'silverfish', 3);
  dispatch(s, { type: 'quest', op: 'choose', id: 'icehole', choice: 'bigfish' });
  assert.deepEqual([s.quests.icehole.done, s.quests.icehole.ending], [true, '같이 쓰게 했다']);
  assert.ok(!s.bag.some((x) => x.id === 'silverfish'));
});

test('M15-7 서브 "굶는 겨울": 얼음 멧돼지 고기 열을 날라 준다 (WM-D7)', () => {
  const s = ended('sub2');
  travel(s, 'icegate'); walk(s, 'hunterhut');
  assert.deepEqual(offersOf(s, 'oldhunter'), ['winter']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'winter' });
  addItem(s, 'icemeat', 9);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'winter', choice: 'give' }), /얼음 멧돼지 고기/);
  addItem(s, 'icemeat', 1);
  const silver = s.silver;
  dispatch(s, { type: 'quest', op: 'choose', id: 'winter', choice: 'give' });
  assert.deepEqual([s.quests.winter.done, s.quests.winter.ending], [true, '고기를 날라 주었다']);
  assert.equal(s.silver, silver, '삯은 없다');
  assert.ok(!s.bag.some((x) => x.id === 'icemeat'));
  assert.ok(s.people.oldhunter.pts >= 30);
});

/** 종루 아래에서 깨어 있는 채로 때를 넘긴다(둘러보기와 기도). until: 그때가 될 때까지. */
const keepWatch = (s, untilPhase) => {
  let n = 0;
  do { s.tired = 0; s.full = 80; s.hp = valueOf(s, 'maxHp'); dispatch(s, { type: 'act', id: n % 2 ? 'pray' : 'look' }); n++; } while (s.phase !== untilPhase && !s.choice && n < 400);
};

test('M15-7 히든 "삼십 년 만의 한 번": 종루 앞에서 밤을 서른 번 새운다. 조건은 어디에도 나오지 않는다 (LV-E3)', () => {
  const s = ended('hq30');
  travel(s, 'icegate'); walk(s, 'underbell');
  keepWatch(s, 2); // 해가 질 때까지 종루 아래에 있는다
  for (let night = 1; night < BELL_NIGHTS; night++) { keepWatch(s, 0); assert.equal(s.flags.bellNights, night); keepWatch(s, 2); }
  assert.equal(s.hq.bellnight, undefined);
  // 찾기 전에는 화면과 도움말 어디에도 조건이 없다
  const shown = JSON.stringify([questBook(s), mainView(s), hiddenView(s), hiddenSlots(s), slotsNow(s), bodyView(s), HELP, HELP_MORE, HELP.map((t) => helpBody(t, { white: true }))]);
  for (const word of ['삼십 년 만의 한 번', '밤을 서른', '서른 밤', '종루 앞에서 밤', '종루 아래에서 밤']) assert.ok(!shown.includes(word), `화면에 "${word}"가 나온다`);
  keepWatch(s, 0);
  assert.equal(s.flags.bellNights, BELL_NIGHTS);
  assert.deepEqual(s.choice, { kind: 'hq', id: 'bellnight' });
  assert.equal(s.hq.bellnight.status, 'offered');
  assert.ok(s.dings.at(-1).title.includes('삼십 년 만의 한 번'));
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(hiddenView(s).find((h) => h.id === 'bellnight').step.text, HIDDENS.bellnight.steps[0].text);
  const bond = s.people.hansol?.pts || 0;
  dispatch(s, { type: 'greet', npc: 'hansol' });
  assert.equal(s.hq.bellnight.status, 'done');
  assert.ok(s.people.hansol.pts >= bond + 40);
  assert.ok(s.log.some((l) => l.text === HIDDENS.bellnight.done));
});

test('M15-7 자거나, 자리를 떴다 오거나, 밤에 온 것은 밤을 새운 것이 아니다', () => {
  // 곯아떨어진 밤
  const a = ended('hqsleep');
  travel(a, 'icegate'); walk(a, 'underbell');
  keepWatch(a, 2);
  a.tired = 100;
  dispatch(a, { type: 'act', id: 'look' });
  assert.equal(a.phase, 0);
  assert.equal(a.flags.bellNights || 0, 0);
  // 밤중에 주막에 다녀왔다
  const b = ended('hqleave');
  travel(b, 'icegate'); walk(b, 'underbell');
  keepWatch(b, 2);
  walk(b, 'hearth'); walk(b, 'underbell');
  keepWatch(b, 0);
  assert.equal(b.flags.bellNights || 0, 0);
  // 밤이 된 뒤에 왔다
  const c = ended('hqlate');
  travel(c, 'icegate');
  while (c.phase !== 2) { c.tired = 0; c.full = 80; dispatch(c, { type: 'act', id: 'look' }); }
  walk(c, 'underbell');
  keepWatch(c, 0);
  assert.equal(c.flags.bellNights || 0, 0);
  // 종루에 올랐다 내려왔다
  const d = ended('hqtower');
  travel(d, 'icegate'); walk(d, 'underbell');
  keepWatch(d, 2);
  d.choice = null;
  dispatch(d, { type: 'dungeon', op: 'enter', id: 'icetower' });
  dispatch(d, { type: 'dungeon', op: 'leave' });
  keepWatch(d, 0);
  assert.equal(d.flags.bellNights || 0, 0);
});
