// M9: 나루(명성은 마을마다 따로, 밤에만 열리는 곳, 날마다 값이 바뀌는 어시장), 갈대밭, 가라앉은 배, 메인 3장. 여정: 소은 4·5.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, townRooms, enemyView, roomView, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { fameOf, townOf, peopleHere, titleView } from '../src/core/social.js';
import { buyPrice, shopView, storeView } from '../src/core/trade.js';
import { subView, offersOf, mainView } from '../src/core/quests.js';
import { standingName } from '../src/core/factions.js';
import { valueOf } from '../src/core/derived.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { PEOPLE } from '../src/data/people.js';
import { SHOPS } from '../src/data/shops.js';
import { ITEMS } from '../src/data/items.js';
import { MONSTERS } from '../src/data/monsters.js';
import { DUNGEONS } from '../src/data/dungeon.js';

const afterCh2 = (seed = 'm9', origin = 'bard') => {
  const s = createGame({ name: '소은', origin, spent: { agi: 3, con: 2 }, seed });
  dispatch(s, { type: 'move', to: 'training' });
  dispatch(s, { type: 'move', to: 'plaza' });
  s.level = 14; s.stats.str += 16; s.stats.con += 16; s.stats.agi += 8; s.hp = valueOf(s, 'maxHp'); s.jobAsked = true;
  s.main.done.push({ chapter: 1, path: 'friend', day: 1 }, { chapter: 2, path: 'tell', day: 2 }); s.main.chapter = 3; s.main.called = '소식을 전한 이';
  s.opened.push('ruins', 'dock'); s.dmem.ruins = { seen: [], done: {}, nights: 0, keeper: 'tell', bell: true };
  return s;
};
const heal = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; if (s.equip.weapon) s.equip.weapon.dur = 60; };
const fight = (s) => { let n = 0; while (s.battle && n++ < 400) { heal(s); dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); } };
const travel = (s, to) => { let n = 0; while (s.place !== to && n++ < 20) { if (s.battle) fight(s); else dispatch(s, { type: 'travel', to }); } fight(s); assert.equal(s.place, to); };

test('나루는 메인 2장이 끝나야 길이 난다. 곳 일곱과 사람 일곱 (H3-1)', () => {
  const fresh = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'lock' });
  assert.ok(mapView(fresh).find((r) => r.id === 'dock').locked);
  assert.throws(() => dispatch(fresh, { type: 'travel', to: 'dock' }), /길을 모릅니다/);
  const s = afterCh2();
  assert.ok(!mapView(s).find((r) => r.id === 'dock').locked);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'inn' }), /어귀로/);
  travel(s, 'dock');
  assert.equal(townOf(s), '나루');
  assert.deepEqual(TOWNS['나루'].order.length, 7);
  for (const id of TOWNS['나루'].order) { assert.equal(PLACES[id].town, '나루'); assert.ok(PLACES[id].room && PLACES[id].stripAlt); }
  assert.equal(Object.values(PEOPLE).filter((p) => PLACES[p.place].town === '나루').length, 7);
  assert.ok(mapView(s).find((r) => r.id === 'dock').here);
  assert.ok(!mapView(s).find((r) => r.id === 'plaza').here);
  dispatch(s, { type: 'move', to: 'inn' });
  assert.throws(() => dispatch(s, { type: 'move', to: 'plaza' }), /갈 수 없습니다/);
});

test('명성은 마을마다 따로 쌓인다. 칭호는 어디서나 통한다. 보관함도 마을마다 따로다 (H3-4)', () => {
  const s = afterCh2('fame');
  s.fame['시작 마을'] = 50;
  s.titles.push({ id: 'helper', day: 1, why: '시험' });
  dispatch(s, { type: 'move', to: 'tavern' });
  s.bag = []; addItem(s, 'ironore', 5);
  dispatch(s, { type: 'deposit', index: 0, n: 5 });
  dispatch(s, { type: 'move', to: 'plaza' });
  travel(s, 'dock');
  assert.equal(fameOf(s), 0, '나루에서는 0에서 시작한다');
  assert.equal(fameOf(s, '시작 마을'), 50);
  dispatch(s, { type: 'title', id: 'helper' });
  assert.equal(titleView(s).find((t) => t.worn).name, '손 내민 이');
  dispatch(s, { type: 'move', to: 'inn' });
  assert.deepEqual(storeView(s).items, [], '윗마을에 맡긴 것은 윗마을에 있다');
  addItem(s, 'tar', 2);
  dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'tar'), n: 2 });
  assert.equal(s.store['나루'].items[0].n, 2);
  assert.equal(s.store['시작 마을'].items[0].n, 5);
});

test('다리 밑은 밤에만 열린다 (H3-2)', () => {
  const s = afterCh2('night');
  travel(s, 'dock');
  s.phase = 1;
  assert.ok(townRooms(s).find((r) => r.id === 'underbridge').closed);
  assert.throws(() => dispatch(s, { type: 'move', to: 'underbridge' }), /밤에만/);
  s.phase = 2; s.tick = 0;
  assert.ok(!townRooms(s).find((r) => r.id === 'underbridge').closed);
  dispatch(s, { type: 'move', to: 'underbridge' });
  assert.equal(peopleHere(s)[0].name, '다리 밑의 눈');
  assert.ok(shopView(s).goods.some((g) => g.id === 'forgetwater'));
});

test('어시장: 같은 소금 값이 날마다 다르고, 시작 마을에 없는 물건이 있다 (H3-5, M9-2)', () => {
  const s = afterCh2('market');
  travel(s, 'dock');
  dispatch(s, { type: 'move', to: 'fishmarket' });
  const prices = new Set();
  const eel = new Set();
  for (let d = 1; d <= 12; d++) { s.day = d; prices.add(buyPrice(s, 'sailcloth').now); eel.add(buyPrice(s, 'eel').now); assert.equal(buyPrice(s, 'eel').now, buyPrice(s, 'eel').now); }
  assert.ok(prices.size >= 4, `돛천 값 ${[...prices]}`);
  assert.ok(eel.size >= 3);
  assert.ok(shopView(s).daily);
  const here = new Set(SHOPS.fishmarket.sells);
  const up = new Set([...SHOPS.store.sells, ...SHOPS.forge.sells]);
  assert.ok([...here].filter((x) => !up.has(x)).length >= 3, '나루에서만 파는 것');
  for (const id of here) assert.ok(ITEMS[id].price > 0);
  s.silver = 500;
  dispatch(s, { type: 'buy', id: 'eel' });
  assert.equal(countOf(s, 'eel'), 1);
});

test('갈대밭에서 새 괴물이 나온다 (M9-3)', () => {
  const s = afterCh2('reeds');
  travel(s, 'reeds');
  const seen = new Set();
  let n = 0;
  while (seen.size < 2 && n++ < 600) {
    if (s.battle) { seen.add(s.battle.mon); fight(s); }
    else if (s.choice) dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id });
    else if (s.place !== 'reeds') travel(s, 'reeds');
    else dispatch(s, { type: 'act', id: 'explore' });
    heal(s);
  }
  assert.deepEqual([...seen].sort(), ['mudtoad', 'reedsnake']);
  for (const id of ['reedsnake', 'mudtoad', 'drowned']) { assert.ok(MONSTERS[id].element && MONSTERS[id].level >= 9); }
  assert.equal(PLACES.reeds.levels, '9~12');
});

test('배가 있어야 가라앉은 배에 갈 수 있다. 배는 재료와 품삯으로 짓는다 (M9-3)', () => {
  const s = afterCh2('boat');
  travel(s, 'dock');
  const slot = slotsNow(s).find((x) => x.label.includes('가라앉은 배'));
  assert.ok(slot.disabled);
  assert.ok(slot.why.includes('배가 있어야'));
  assert.throws(() => dispatch(s, { type: 'dungeon', op: 'enter', id: 'ship' }), /배가 있어야/);
  dispatch(s, { type: 'move', to: 'shipyard' });
  assert.throws(() => dispatch(s, { type: 'boat' }), /모자랍니다/);
  addItem(s, 'oakbranch', 20); addItem(s, 'tar', 5); addItem(s, 'sailcloth', 2);
  s.silver = 50;
  assert.throws(() => dispatch(s, { type: 'boat' }), /품삯/);
  s.silver = 130;
  const ev = dispatch(s, { type: 'boat' });
  assert.ok(s.flags.boat);
  assert.equal(s.silver, 30);
  assert.equal(countOf(s, 'tar'), 0);
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'boat'));
  assert.throws(() => dispatch(s, { type: 'boat' }), /이미 배가/);
  dispatch(s, { type: 'move', to: 'dock' });
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'ship' });
  assert.equal(roomView(s).dungeon, '가라앉은 배');
  for (const [id, r] of Object.entries(DUNGEONS.ship.rooms)) for (const e of r.exits) assert.ok(DUNGEONS.ship.rooms[e].exits.includes(id), `${id} ↔ ${e}`);
});

test('사당에 바치는 것은 하루 한 번이다', () => {
  const s = afterCh2('offer');
  travel(s, 'dock');
  dispatch(s, { type: 'move', to: 'shrine' });
  s.silver = 25;
  dispatch(s, { type: 'offer' });
  assert.equal(s.silver, 15);
  assert.equal(s.counters.offer, 1);
  assert.throws(() => dispatch(s, { type: 'offer' }), /이미 바쳤/);
});

const atBranch = (seed, origin) => {
  const s = afterCh2(seed, origin);
  travel(s, 'dock');
  dispatch(s, { type: 'move', to: 'branch' });
  assert.deepEqual(offersOf(s, 'agent'), ['lode']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'lode' });
  return s;
};

test('메인 3장: 조합·상단·한자리·사들이기의 네 길과 숨은 길 (M9-5)', () => {
  const s0 = atBranch('ch3');
  const v = mainView(s0);
  assert.equal(v.name, '광맥의 주인');
  assert.equal(v.paths.length, 4);
  assert.ok(!JSON.stringify(v).includes('증서'));
  const choices = subView(s0, 'lode').step.choices;
  assert.deepEqual(choices.map((c) => c.id), ['miners', 'merchants', 'both', 'buy'], '숨은 길은 증서가 있어야 보인다');
  assert.ok(choices.every((c) => !c.can), '아직 어느 쪽과도 단골이 아니다');
  assert.ok(choices.find((c) => c.id === 'miners').fx.includes('광부 조합 오름'));
  const end = (prep, id, called) => {
    const s = atBranch('ch3-' + id);
    prep(s);
    const ev = dispatch(s, { type: 'quest', op: 'choose', id: 'lode', choice: id });
    assert.equal(s.main.chapter, 4);
    assert.equal(s.main.done[2].path, id === 'deed' ? 'hidden' : id);
    assert.equal(s.main.called, called);
    assert.equal(s.flags.lode, id === 'deed' ? 'hidden' : id);
    assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'main'));
    return s;
  };
  const a = end((s) => { s.factions.miners = 30; }, 'miners', '캐는 이들의 벗');
  assert.equal(standingName(a, 'merchants'), '미움');
  const b = end((s) => { s.factions.merchants = 30; }, 'merchants', '값을 아는 이');
  assert.equal(b.silver, 300);
  const c = end((s) => { s.silver = 3000; }, 'buy', '광맥의 임자');
  assert.equal(c.silver, 0);
  const d = end((s) => { addItem(s, 'deed', 1); assert.ok(subView(s, 'lode').step.choices.find((x) => x.id === 'deed').can); }, 'deed', '증서를 건진 이');
  assert.equal(countOf(d, 'deed'), 0);
  assert.ok(d.factions.miners > 0 && d.factions.merchants > 0);
  assert.equal(mainView(d).name, '흐려지는 띠링');
});

test('소은 4·5: 새 길로 나루에 가 짐을 맡기고, 양쪽과 단골이 되어 둘을 한자리에 앉힌다', () => {
  const s = afterCh2('soeun-4');
  assert.equal(mapView(s).find((r) => r.id === 'dock').name, '나루');
  travel(s, 'dock');
  assert.equal(fameOf(s), 0, '명성이 0에서 다시 시작한다');
  dispatch(s, { type: 'move', to: 'inn' });
  addItem(s, 'ironore', 12);
  dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'ironore'), n: 12 });
  assert.equal(storeView(s).items[0].n, 12);
  // 5단계: 양쪽과 단골. 의뢰와 세력 사이의 일로 쌓는다(여기서는 쌓인 뒤라고 친다)
  s.factions.miners = 30; s.factions.merchants = 30;
  dispatch(s, { type: 'move', to: 'branch' });
  dispatch(s, { type: 'greet', npc: 'agent' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'lode' });
  assert.equal(mainView(s).nearest.id, 'miners');
  const both = subView(s, 'lode').step.choices.find((c) => c.id === 'both');
  assert.ok(both.can);
  assert.ok(both.fx.includes('광부 조합 오름') && both.fx.includes('상단 오름') && !both.fx.includes('내림'));
  dispatch(s, { type: 'quest', op: 'choose', id: 'lode', choice: 'both' });
  assert.equal(s.main.done[2].path, 'both');
  assert.equal(s.factions.miners, 50);
  assert.equal(s.factions.merchants, 50);
  assert.equal(s.main.called, '자리를 놓은 이');
  assert.ok(SAVE_VERSION >= 8);
});
