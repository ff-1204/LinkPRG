// M2: 가방·장비, 레벨, 탐색과 인카운터, 전투, 쓰러짐, 지도, 옛 저장 올리기.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, bodyView, enemyView, modeOf, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf, totalWeight, previewEquip, bagView, tabCounts, equipPower, iconOf } from '../src/core/inventory.js';
import { xpToNext, gainXp } from '../src/core/level.js';
import { startBattle, fleeChance, intentOf } from '../src/core/battle.js';
import { battleChance, senseChance, choiceView } from '../src/core/explore.js';
import { fall, isWeak } from '../src/core/fall.js';
import { derived, valueOf, formula } from '../src/core/derived.js';
import { migrate } from '../src/core/migrate.js';
import { saveTo, loadFrom, parseSave } from '../src/core/save.js';
import { MONSTERS } from '../src/data/monsters.js';
import { WILDS, INCIDENTS } from '../src/data/wild.js';
import { ITEMS } from '../src/data/items.js';
import { PLACES } from '../src/data/places.js';

const fresh = (seed = 'm2', origin = 'smithboy', spent = {}) => createGame({ name: '태윤', origin, spent, seed });
const fakeStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };
const types = (events) => events.map((e) => e.type);

test('새 게임은 훈련복과 짚신을 차고 주먹밥을 들고 시작한다', () => {
  const s = fresh();
  assert.equal(s.v, SAVE_VERSION);
  assert.equal(s.equip.body.id, 'trainwear');
  assert.equal(s.equip.feet.id, 'sandals');
  assert.equal(s.equip.weapon, null);
  assert.equal(countOf(s, 'riceball'), 3);
  assert.equal(s.hp, valueOf(s, 'maxHp'));
  assert.equal(valueOf(s, 'defense'), 5 + 3);
});

test('훈련소에 처음 가면 교관이 목검을 준다. 두 번은 주지 않는다', () => {
  const s = fresh();
  const ev = dispatch(s, { type: 'move', to: 'training' });
  assert.equal(s.equip.weapon.id, 'woodsword');
  assert.ok(ev.some((e) => e.type === 'line' && e.line.who === '교관'));
  dispatch(s, { type: 'move', to: 'plaza' });
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(countOf(s, 'woodsword'), 0);
  assert.equal(formula(derived(s).find((d) => d.id === 'attack')), '힘 11 + 무기 6');
});

test('가방: 같은 재료는 묶이고 장비는 묶이지 않는다. 무게는 가방과 찬 것을 더한다 (G1)', () => {
  const s = fresh();
  s.bag = [];
  addItem(s, 'ironore', 3);
  addItem(s, 'ironore', 2);
  addItem(s, 'woodsword', 2);
  assert.equal(s.bag.length, 3);
  assert.equal(countOf(s, 'ironore'), 5);
  assert.equal(totalWeight(s), 5 + 6 + 3 + 1);
  assert.deepEqual(tabCounts(s), { all: 3, gear: 2, material: 1, eat: 0, quest: 0, etc: 0 });
  assert.equal(bagView(s, 'material')[0].item.id, 'ironore');
  assert.equal(bagView(s, 'all', 'weight')[0].item.id, 'ironore');
});

test('장비를 바꿔 끼기 전에 달라지는 것이 보이고, 끼면 있던 것은 가방으로 온다 (G1-2)', () => {
  const s = fresh();
  s.bag = [];
  addItem(s, 'woodsword', 1);
  const pv = previewEquip(s, 0);
  assert.deepEqual(pv.attack, [0, 6]);
  assert.equal(pv.old, null);
  const ev = dispatch(s, { type: 'equip', index: 0 });
  assert.ok(types(ev).includes('gear'));
  assert.equal(s.equip.weapon.id, 'woodsword');
  assert.equal(s.bag.length, 0);
  dispatch(s, { type: 'unequip', slot: 'weapon' });
  assert.equal(s.equip.weapon, null);
  assert.equal(s.bag[0].id, 'woodsword');
  assert.throws(() => dispatch(s, { type: 'unequip', slot: 'weapon' }), /비어/);
});

test('내구도가 0인 장비는 힘을 보태지 않는다 (R2-4)', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(equipPower(s).attack, 6);
  s.equip.weapon.dur = 0;
  assert.equal(equipPower(s).attack, 0);
});

test('모든 물건에 그림과 설명이 있고, 그림 파일이 있다 (X2)', async () => {
  const fs = await import('node:fs');
  for (const [id, def] of Object.entries(ITEMS)) {
    assert.ok(def.desc, id);
    const icon = iconOf({ id, grade: def.grade || 0 });
    assert.ok(fs.existsSync(new URL(`../art/pixel/out/${icon}.png`, import.meta.url)), `${id}: ${icon}`);
  }
  for (const p of Object.values(PLACES)) {
    for (const name of Object.values(p.strip)) assert.ok(fs.existsSync(new URL(`../art/pixel/out/${name}.png`, import.meta.url)), name);
  }
});

test('레벨: 필요 경험치는 20L²+60L+20, 오르면 점수 3 (R2-1)', () => {
  assert.equal(xpToNext(1), 100);
  assert.equal(xpToNext(5), 820);
  const s = fresh();
  const before = s.unspent;
  assert.equal(gainXp(s, 99), 0);
  assert.equal(gainXp(s, 1), 1);
  assert.equal(s.level, 2);
  assert.equal(s.unspent, before + 3);
  assert.equal(gainXp(s, xpToNext(2) + xpToNext(3)), 2);
  assert.equal(s.level, 4);
});

test('포만감은 움직일수록 줄고, 낮으면 벌이 붙고, 먹으면 찬다', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 100; i++) dispatch(s, { type: 'act', id: 'strike' });
  assert.equal(s.full, 80 - 21);
  const farmer = fresh('f', 'farmer');
  dispatch(farmer, { type: 'move', to: 'training' });
  for (let i = 0; i < 100; i++) dispatch(farmer, { type: 'act', id: 'strike' });
  assert.equal(farmer.full, 80 - 13);
  s.full = 10;
  assert.ok(bodyView(s).hungry);
  const i = s.bag.findIndex((x) => x.id === 'riceball');
  dispatch(s, { type: 'use', index: i });
  assert.equal(s.full, 40);
  assert.equal(countOf(s, 'riceball'), 2);
});

test('굶은 채 일하며 하루를 넘겨야 굶은 날이 쌓인다. 쉬기만 해서는 쌓이지 않는다', () => {
  const s = fresh();
  s.full = 0;
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.day, 2);
  assert.equal(s.counters.hungryDays, 0, '누워서 굶기만 한 날');
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 30; i++) dispatch(s, { type: 'act', id: 'strike' });
  dispatch(s, { type: 'move', to: 'plaza' });
  for (let i = 0; i < 3 && s.day === 2; i++) passPhase(s);
  assert.equal(s.day, 3);
  assert.equal(s.counters.hungryDays, 1, '굶은 채 일한 날');
});

test('지도: 마을 밖으로는 길을 나서야 하고 반나절이 걸린다 (N7)', () => {
  const s = fresh('map1');
  assert.throws(() => dispatch(s, { type: 'move', to: 'forest' }), /갈 수 없/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'training' }), /방 목록/);
  const rows = mapView(s);
  assert.deepEqual(rows.map((r) => r.id), ['plaza', 'dock', 'bigmarket', 'forest', 'river', 'mine', 'ruins', 'reeds', 'pass']);
  assert.ok(rows[1].locked, '나루는 메인 2장이 끝나야 길이 난다');
  assert.ok(rows[2].locked, '소리재는 메인 3장이 끝나야 길이 난다');
  rows.splice(1, 2);
  assert.ok(rows[4].locked, '폐허 입구는 메인 1장이 끝나야 길이 난다');
  assert.throws(() => dispatch(s, { type: 'travel', to: 'ruins' }), /길을 모릅니다/);
  assert.ok(rows[0].here);
  assert.equal(rows[1].danger, '낮음');
  assert.equal(rows[1].ambush, 5);
  assert.equal(rows[3].ambush, 15);
  s.phase = 2;
  assert.equal(mapView(s).find((r) => r.id === 'forest').danger, '보통');
  s.phase = 0;
  const tick = s.tick;
  dispatch(s, { type: 'travel', to: 'river' });
  if (!s.battle) assert.equal(s.place, 'river');
  assert.equal(s.tick, tick + 25);
  assert.equal(PLACES.river.wild, true);
});

test('가는 길 습격은 위험도만큼 난다 (R2-3)', () => {
  let hit = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const s = fresh('amb' + i);
    dispatch(s, { type: 'travel', to: 'mine' });
    if (s.battle) { hit++; assert.equal(s.place, 'mine'); }
  }
  assert.ok(Math.abs(hit / N - 0.15) < 0.03, `습격 ${hit / N}`);
});

test('탐색 만 번: 전투·발견·사건·만남·희귀가 정한 몫대로 나온다 (R2-3)', () => {
  const s = fresh('ratio');
  s.place = 'mine';
  const got = { battle: 0, find: 0, incident: 0, meet: 0, rare: 0 };
  const N = 10000;
  for (let i = 0; i < N; i++) {
    // 조용함·방금 싸움의 보정을 빼고 바탕 몫만 본다
    s.tension = {}; s.calm = 0; s.choice = null; s.battle = null; s.bag = []; s.hp = 100; s.counters.rare = 0; s.hidden = {};
    s.phase = 0; s.tick = 0;
    const ev = dispatch(s, { type: 'act', id: 'explore' });
    got[ev.find((e) => e.type === 'explore').outcome] += 1;
  }
  const near = (x, p) => assert.ok(Math.abs(x / N - p) < 0.02, `${x / N} ≠ ${p}`);
  near(got.battle, 0.45);
  near(got.find, 0.55 * 25 / 55);
  near(got.incident, 0.55 * 15 / 55);
  near(got.meet, 0.55 * 10 / 55);
  near(got.rare, 0.55 * 5 / 55);
});

test('오래 조용하면 전투가 가까워지고, 싸운 직후 두 번은 절반이다 (R2-3)', () => {
  const s = fresh();
  s.place = 'forest';
  assert.equal(battleChance(s), 0.30);
  s.tension.forest = 2;
  assert.ok(Math.abs(battleChance(s) - 0.50) < 1e-9);
  s.tension.forest = 99;
  assert.ok(Math.abs(battleChance(s) - 0.70) < 1e-9);
  s.tension.forest = 0;
  s.calm = 2;
  assert.equal(battleChance(s), 0.15);
  s.calm = 0;
  s.phase = 2;
  assert.equal(battleChance(s), 0.45);
  s.place = 'plaza';
  assert.equal(battleChance(s), 0);
  assert.equal(bodyView(s).sense, 0);
});

test('기척: 알아채면 덮칠지 지켜볼지 돌아갈지 고른다. 지켜보면 무엇인지 보인다 (E3)', () => {
  const s = fresh();
  s.place = 'forest';
  s.choice = { kind: 'sense', mon: 'boar', watched: false };
  assert.equal(modeOf(s), 'choice');
  assert.throws(() => dispatch(s, { type: 'act', id: 'explore' }), /먼저 정해야/);
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['먼저 덮친다', '숨어서 지켜본다', '돌아간다']);
  assert.ok(!choiceView(s).text.includes('멧돼지'));
  dispatch(s, { type: 'choose', id: 'watch' });
  assert.equal(s.counters.watch, 1);
  assert.ok(choiceView(s).text.includes('멧돼지'));
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['먼저 덮친다', '돌아간다']);
  dispatch(s, { type: 'choose', id: 'leave' });
  assert.equal(s.choice, null);
  assert.equal(s.battle, null);

  s.choice = { kind: 'sense', mon: 'rat', watched: false };
  dispatch(s, { type: 'choose', id: 'pounce' });
  assert.ok(s.battle ? s.battle.hp < MONSTERS.rat.hp : true, '먼저 한 대 친다');
});

test('기척을 알아챌 확률은 민첩으로 겨룬다. 사냥꾼의 조수는 더 잘 안다', () => {
  const a = fresh('s', 'smithboy');
  const h = fresh('s', 'hunter');
  assert.ok(Math.abs(senseChance(a, 'boar') - (0.5 + (9 - 8) * 0.05)) < 1e-9);
  assert.ok(Math.abs(senseChance(h, 'boar') - (0.5 + (11 - 8) * 0.05 + 0.15)) < 1e-9);
});

test('다섯 레벨 넘게 높으면 괴물이 달아난다 (R2-3)', () => {
  const s = fresh('run');
  s.place = 'river';
  s.level = 8;
  for (let i = 0; i < 200; i++) {
    s.choice = null;
    dispatch(s, { type: 'act', id: 'explore' });
    assert.equal(s.battle, null);
    if (s.choice) assert.equal(s.choice.kind, 'incident');
  }
});

test('전투: 다음 행동이 미리 보이고, 단축 칸이 전투용으로 바뀐다 (E6, E7)', () => {
  const s = fresh('bt');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  const ev = [];
  startBattle(s, ev, 'boar');
  assert.ok(ev.some((e) => e.type === 'line' && e.line.k === 'intent'));
  const view = enemyView(s);
  assert.equal(view.name, '성난 멧돼지');
  assert.ok(['들이받기', '돌진'].includes(view.next.name));
  const slots = slotsNow(s);
  assert.deepEqual(slots.map((x) => x.label.split(' ')[0]), ['공격', '스킬', '방어', '아이템', '도망']);
  assert.ok(slots[1].disabled);
  assert.equal(slots[4].label, `도망 ${Math.round(fleeChance(s) * 100)}%`);
  assert.throws(() => dispatch(s, { type: 'move', to: 'plaza' }), /싸우는 중/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'plaza' }), /싸우는 중/);
});

test('전투: 방어하면 절반만 받고, 돌진은 막고 되받아친다 (R2-2)', () => {
  const s = fresh('def');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  startBattle(s, [], 'boar');
  s.battle.intent = 'charge';
  const hp = s.hp;
  const foe = s.battle.hp;
  const ev = dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.hp, hp, '돌진을 막으면 다치지 않는다');
  assert.ok(s.battle.hp < foe, '되받아친다');
  assert.ok(ev.some((e) => e.type === 'line' && /막고 되받아쳤다/.test(e.line.text)));

  // 그냥 치기는 방어하면 절반
  const hits = { plain: [], guard: [] };
  for (let i = 0; i < 300; i++) {
    for (const kind of ['plain', 'guard']) {
      const t = fresh('g' + i);
      dispatch(t, { type: 'move', to: 'training' });
      t.place = 'forest';
      startBattle(t, [], 'boar');
      t.battle.intent = 'gore';
      const before = t.hp;
      t.battle.hp = 9999;
      dispatch(t, { type: 'battle', choice: kind === 'guard' ? 'defend' : 'attack' });
      hits[kind].push(before - t.hp);
    }
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(hits.guard) < avg(hits.plain) * 0.75, `${avg(hits.guard)} / ${avg(hits.plain)}`);
});

test('전투: 피해는 (공격×배율−방어)±10%, 최소 1', () => {
  const s = fresh('dmg');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  const attack = valueOf(s, 'attack');
  for (let i = 0; i < 100; i++) {
    startBattle(s, [], 'rat');
    s.battle.hp = 9999;
    s.battle.intent = 'scurry';
    s.hp = 100;
    s.equip.weapon.dur = 60;
    dispatch(s, { type: 'battle', choice: 'attack' });
    const dealt = 9999 - s.battle.hp;
    const base = attack - MONSTERS.rat.defense;
    assert.ok(dealt >= Math.round(base * 0.9) && dealt <= Math.round(Math.round(base * 1.1) * 1.5), `피해 ${dealt}`);
  }
});

test('전투: 이기면 경험치와 전리품, 레벨업 띠링은 점수 나누는 창을 부른다 (E10)', () => {
  const s = fresh('win');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  s.xp = 95;
  startBattle(s, [], 'rat');
  s.battle.hp = 1;
  s.battle.intent = 'scurry';
  const unspent = s.unspent;
  const ev = dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.battle, null);
  assert.equal(s.level, 2);
  assert.equal(s.unspent, unspent + 3);
  assert.equal(valueOf(s, 'maxHp'), 50 + 50 + 10);
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'levelup');
  assert.ok(d);
  assert.equal(s.calm, 2);
  assert.equal(s.dex.mon.rat.won, 1);
  assert.ok(ev.some((e) => e.type === 'battle' && e.phase === 'win'));
});

test('전투: 상태이상은 턴마다 깎고 턴이 지나면 풀린다 (E8)', () => {
  const s = fresh('st');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  startBattle(s, [], 'rat');
  s.battle.hp = 9999;
  s.battle.intent = 'scurry';
  s.status = [{ id: 'bleed', turns: 2 }];
  const hp = s.hp;
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.hp, hp - 3);
  assert.equal(bodyView(s).status[0].name, '출혈');
  s.battle.intent = 'scurry';
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.hp, hp - 6);
  assert.equal(s.status.length, 0);
});

test('전투: 기절하면 움직이지 못한다', () => {
  const s = fresh('stun');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'mine';
  startBattle(s, [], 'bat');
  s.battle.hp = 9999;
  s.battle.intent = 'screech';
  s.status = [{ id: 'stun', turns: 1 }];
  const ev = dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.battle.hp, 9999);
  assert.ok(ev.some((e) => e.type === 'line' && /움직일 수 없다/.test(e.line.text)));
});

test('전투 중에는 가방에서 먹을 것만 쓸 수 있고, 쓰면 한 턴이 간다', () => {
  const s = fresh('item');
  s.place = 'forest';
  addItem(s, 'redpotion', 1);
  addItem(s, 'ironore', 1);
  startBattle(s, [], 'rat');
  s.battle.intent = 'scurry';
  s.hp = 20;
  const turn = s.battle.turn;
  assert.throws(() => dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'ironore') }), /쓸 수 없는/);
  assert.equal(s.battle.turn, turn);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'redpotion') });
  assert.equal(s.hp, 60);
  assert.equal(s.battle.turn, turn + 1);
  assert.throws(() => dispatch(s, { type: 'equip', index: 0 }), /싸우는 중/);
});

test('쓰러지면 신전에서 깨어난다. 돈 10%와 재료 절반을 두고 오고, 레벨과 장비는 그대로다 (E29~E32)', () => {
  const s = fresh('fall');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  s.silver = 55;
  s.bag = [];
  addItem(s, 'ironore', 7);
  addItem(s, 'riceball', 4);
  s.level = 3;
  startBattle(s, [], 'boar');
  s.battle.intent = 'gore';
  s.battle.hp = 9999;
  s.hp = 1;
  const ev = dispatch(s, { type: 'battle', choice: 'attack' });
  const f = ev.find((e) => e.type === 'fall');
  assert.ok(f);
  assert.equal(s.place, 'temple');
  assert.equal(s.battle, null);
  assert.equal(s.silver, 50);
  assert.equal(countOf(s, 'ironore'), 4);
  assert.equal(countOf(s, 'riceball'), 4, '먹을 것은 두고 오지 않는다');
  assert.equal(s.level, 3);
  assert.equal(s.equip.weapon.id, 'woodsword');
  assert.deepEqual(f.info.items, [{ name: '철광석', n: 3 }]);
  assert.equal(f.info.silver, 5);
  assert.equal(s.hp, Math.ceil(valueOf(s, 'maxHp') * 0.3));
  assert.ok(isWeak(s));
  assert.ok(formula(derived(s).find((d) => d.id === 'attack')).includes('쇠약'));
  assert.ok(s.journal.at(-1).text.includes('신전'));
  assert.equal(s.dex.mon.boar.lost, 1);
});

test('유품은 쓰러진 그 자리에서 하루 안에 찾을 수 있다', () => {
  const s = fresh('relic');
  s.place = 'forest';
  s.silver = 100;
  s.bag = [];
  addItem(s, 'herb', 6);
  fall(s, [], '');
  assert.equal(s.relic.place, 'forest');
  assert.ok(!slotsNow(s).some((x) => x.label === '유품 찾기'));
  assert.ok(mapView(s).find((r) => r.id === 'forest').relic);
  s.place = 'forest';
  assert.ok(slotsNow(s).some((x) => x.label === '유품 찾기'));
  dispatch(s, { type: 'relic' });
  assert.equal(s.silver, 100);
  assert.equal(countOf(s, 'herb'), 6);
  assert.equal(s.relic, null);
  assert.throws(() => dispatch(s, { type: 'relic' }), /유품이 없/);
});

test('하루가 지나면 유품은 사라지고 쇠약은 풀린다', () => {
  const s = fresh('late');
  s.place = 'forest';
  s.silver = 100;
  fall(s, [], '');
  assert.equal(s.silver, 90);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.relic, null);
  assert.ok(!isWeak(s));
  assert.equal(s.silver, 90);
});

test('신전 고아는 두고 오는 돈이 절반이다 (T2)', () => {
  const s = fresh('orph', 'orphan');
  s.place = 'forest';
  s.silver = 100;
  fall(s, [], '');
  assert.equal(s.silver, 95);
});

test('모으기: 한 번에 하나, 숙련도가 오르고 허탕도 있다. 여러 번을 한꺼번에 하는 길은 없다', () => {
  const s = fresh('mine');
  s.place = 'mine';
  s.bag = [];
  let got = 0;
  for (let i = 0; i < 100; i++) {
    const before = countOf(s, 'ironore') + countOf(s, 'copperore');
    dispatch(s, { type: 'act', id: 'mine' });
    const after = countOf(s, 'ironore') + countOf(s, 'copperore');
    assert.ok(after - before === 0 || after - before === 1);
    got += after - before;
    s.full = 80;
  }
  assert.ok(got > 60 && got < 95, `얻은 것 ${got}`);
  assert.ok(s.skills.mining.grade >= 1);
  assert.equal(s.counters.act.mine, 100);
  assert.throws(() => dispatch(s, { type: 'act', id: 'fish' }), /여기서는 할 수 없는/);
  dispatch(s, { type: 'act', id: 'mine', times: 50, n: 50 });
  assert.equal(s.counters.act.mine, 101, 'times를 줘도 한 번만 한다');
});

test('사건: 고른 대로 일이 일어난다. 필요한 물건이 없으면 고를 수 없다', () => {
  const s = fresh('inc');
  s.place = 'forest';
  s.bag = [];
  s.choice = { kind: 'incident', id: 'fox', place: 'forest' };
  const v = choiceView(s);
  assert.equal(v.options.length, 3);
  assert.ok(v.options[1].disabled);
  assert.throws(() => dispatch(s, { type: 'choose', id: 'feed' }), /없습니다/);
  addItem(s, 'berry', 1);
  dispatch(s, { type: 'choose', id: 'feed' });
  assert.equal(s.counters.kind, 2);
  assert.equal(countOf(s, 'berry'), 0);
  assert.equal(s.choice, null);
  for (const list of Object.values(INCIDENTS)) for (const inc of list) for (const o of inc.options) assert.ok(o.effect.say, inc.id);
  for (const w of Object.values(WILDS)) for (const m of w.monsters) assert.ok(MONSTERS[m.id]);
});

test('옛 저장(1판)을 읽으면 지금 판으로 올라온다', () => {
  const s = fresh('old');
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 10; i++) dispatch(s, { type: 'act', id: 'strike' });
  // 1판 꼴로 되돌린다
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['hp', 'mp', 'full', 'xp', 'hungerTick', 'bag', 'equip', 'status', 'battle', 'choice', 'weak', 'relic', 'falls', 'tension', 'calm', 'dex']) delete old[k];
  delete old.flags.gotSword;
  old.v = 1;
  const raw = JSON.stringify({ v: 1, rev: 4, savedAt: 1, state: old });
  const data = parseSave(raw);
  assert.equal(data.v, SAVE_VERSION);
  const up = data.state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.equip.weapon.id, 'woodsword', '치던 사람은 목검을 들고 있다');
  assert.ok(up.flags.gotSword);
  assert.equal(up.hp, valueOf(up, 'maxHp'));
  assert.equal(up.counters.act.strike, 10);
  dispatch(up, { type: 'act', id: 'strike' });
  dispatch(up, { type: 'travel', to: 'river' });
  // 칸에 든 옛 저장도 읽히고, 다시 저장하면 지금 판으로 남는다
  const st = fakeStorage();
  st.setItem('ttiring.save.0', raw);
  const loaded = loadFrom(st, 0);
  assert.equal(loaded.v, SAVE_VERSION);
  saveTo(st, 0, loaded, 2, 4);
  assert.equal(JSON.parse(st.getItem('ttiring.save.0')).v, SAVE_VERSION);
  assert.throws(() => parseSave(JSON.stringify({ v: 99, state: old })), /새것/);
  assert.equal(migrate(fresh('same')).v, SAVE_VERSION);
});

test('저장했다 읽어도 싸움이 그대로 이어진다', () => {
  const s = fresh('mid');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  startBattle(s, [], 'wolf');
  const copy = JSON.parse(JSON.stringify(s));
  const a = dispatch(s, { type: 'battle', choice: 'attack' });
  const b = dispatch(copy, { type: 'battle', choice: 'attack' });
  assert.deepEqual(a, b);
  assert.deepEqual(s, copy);
  assert.equal(intentOf(s)?.id, intentOf(copy)?.id);
});

// ── 검토에서 나온 것들 ──
test('적이 건 기절은 다음 턴에 실제로 움직임을 막고, 공포는 적힌 턴 수만큼 간다', () => {
  let stunned = 0, blocked = 0;
  for (let i = 0; i < 300; i++) {
    const s = fresh('stn' + i);
    dispatch(s, { type: 'move', to: 'training' });
    s.place = 'mine';
    startBattle(s, [], 'bat');
    s.battle.hp = 9999; s.battle.intent = 'screech';
    dispatch(s, { type: 'battle', choice: 'attack' });
    if (!s.status.some((x) => x.id === 'stun')) continue;
    stunned++;
    s.battle.intent = 'screech';
    const ev = dispatch(s, { type: 'battle', choice: 'attack' });
    if (ev.some((e) => e.type === 'line' && /움직일 수 없다/.test(e.line.text))) blocked++;
  }
  assert.ok(stunned > 50, `기절 ${stunned}`);
  assert.equal(blocked, stunned);
  const s = fresh('fear');
  s.place = 'forest';
  startBattle(s, [], 'rat');
  s.status = [{ id: 'fear', turns: 2, fresh: true }];
  s.battle.hp = 9999;
  let turns = 0;
  for (let i = 0; i < 6 && s.battle; i++) { if (s.status.some((x) => x.id === 'fear')) turns++; s.battle.intent = 'scurry'; dispatch(s, { type: 'battle', choice: 'defend' }); }
  assert.equal(turns, 3, '걸린 턴과 그 뒤 두 턴');
});

test('싸운 직후 탐색 두 번은 실제로 전투가 절반이다 (R2-3)', () => {
  const hit = [0, 0, 0];
  const N = 6000;
  for (let i = 0; i < N; i++) {
    const s = fresh('calm' + i);
    s.place = 'forest'; s.calm = 2;
    for (let k = 0; k < 3; k++) {
      s.tension = {}; s.choice = null; s.battle = null; s.hp = 100;
      const calmBefore = s.calm;
      const ev = dispatch(s, { type: 'act', id: 'explore' });
      if (ev.find((e) => e.type === 'explore').outcome === 'battle') hit[k]++;
      s.calm = Math.max(0, calmBefore - 1); // 이긴 싸움이 다시 2로 올리는 것을 뺀다
    }
  }
  assert.ok(Math.abs(hit[0] / N - 0.15) < 0.02, `첫 번째 ${hit[0] / N}`);
  assert.ok(Math.abs(hit[1] / N - 0.15) < 0.02, `두 번째 ${hit[1] / N}`);
  assert.ok(Math.abs(hit[2] / N - 0.30) < 0.02, `세 번째 ${hit[2] / N}`);
});

test('버리는 개수가 이상하면 거절한다', () => {
  const s = fresh('dc');
  for (const n of [-5, 0.5, 99]) assert.throws(() => dispatch(s, { type: 'discard', index: 0, n }), /개수|그만큼/);
  assert.equal(countOf(s, 'riceball'), 3);
  dispatch(s, { type: 'discard', index: 0, n: 2 });
  assert.equal(countOf(s, 'riceball'), 1);
});

test('두 번 쓰러질 때: 새로 둘 것이 없으면 먼저 것은 남고, 있으면 먼저 것은 잃는다고 알린다', () => {
  const s = fresh('two');
  s.place = 'forest'; s.silver = 100; s.bag = [];
  fall(s, [], '');
  s.place = 'river'; s.silver = 5;
  const a = fall(s, [], '');
  assert.equal(s.relic.place, 'forest');
  assert.equal(a.keptOld, 'forest');
  assert.equal(a.relicPlace, null);
  s.place = 'river'; s.silver = 50;
  const ev = [];
  const b = fall(s, ev, '');
  assert.equal(s.relic.place, 'river');
  assert.ok(b.lostOld);
  assert.ok(ev.some((e) => e.type === 'line' && /먼저 두고 온 것/.test(e.line.text)));
});

test('망가진 저장은 읽기 전에 걸러진다', () => {
  const good = JSON.parse(JSON.stringify(fresh('brk')));
  const wrap = (st, v = SAVE_VERSION) => JSON.stringify({ v, rev: 1, savedAt: 1, state: st });
  assert.equal(parseSave(wrap(good)).state.name, '태윤');
  assert.throws(() => parseSave(wrap({ ...good, v: 1 })), /판이 서로 다릅니다/);
  assert.throws(() => parseSave(wrap({ ...good, bag: undefined })), /망가졌습니다/);
  assert.throws(() => parseSave(wrap({ ...good, place: 'moon' })), /모르는 곳/);
  assert.throws(() => parseSave(wrap({ ...good, battle: { mon: 'dragon', hp: 1 } })), /모르는 괴물/);
  assert.throws(() => parseSave(wrap({ ...good, bag: [{ id: 'nothing', n: 1 }] })), /모르는 물건/);
  assert.throws(() => parseSave(wrap({ ...good, v: 0 }, 0)), /판을 알 수 없/);
});

test('싸우는 중에 무기를 바꿔 쥐면 한 턴이 간다. 다른 칸과 점수 쓰기는 안 된다 (G1-3)', () => {
  const s = fresh('swap');
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest'; s.bag = [];
  addItem(s, 'ironsword', 1);
  addItem(s, 'trainwear', 1);
  s.unspent = 2;
  startBattle(s, [], 'rat');
  s.battle.hp = 9999; s.battle.intent = 'scurry';
  const turn = s.battle.turn;
  assert.throws(() => dispatch(s, { type: 'equip', index: 1 }), /무기와 보조만/);
  assert.throws(() => dispatch(s, { type: 'spend', stat: 'con' }), /싸우는 중/);
  assert.equal(s.battle.turn, turn);
  dispatch(s, { type: 'equip', index: 0 });
  assert.equal(s.equip.weapon.id, 'ironsword');
  assert.equal(s.battle.turn, turn + 1);
});

test('쓰러진 것은 죽을 고비를 넘긴 것이 아니다. 투지는 쌓이지 않는다', async () => {
  const { fall } = await import('../src/core/fall.js');
  const s = fresh();
  for (let i = 0; i < 6; i++) fall(s, [], '시험');
  assert.equal(s.falls, 6);
  assert.equal(s.counters.nearDeath, 0);
});
