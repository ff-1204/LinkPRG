// M24 남은 것 셋: 뜬마을의 뗏목 대장간(M24-1), 서브 "장인들의 연장"(M24-2), 사제의 윗단계 기도 구슬(M24-3).
// 기준: roadmap.md M24, systems.md AN-A11 · LV-E10.
import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, slotsNow, mapView, peopleHere, townRooms } from '../src/core/game.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { SHOPS } from '../src/data/shops.js';
import { PEOPLE, CALLS } from '../src/data/people.js';
import { RECIPES } from '../src/data/recipes.js';
import { shopView } from '../src/core/trade.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { forged } from './_ash.js';
import { marshed, owner } from './_marsh.js';

const labels = (s) => slotsNow(s).map((x) => x.label);
const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null);
};
const smith6 = (s) => { s.craftLv.smith = { lv: 24, xp: 0 }; s.craftTier.smith = 6; return s; };

test('M24-1 뗏목 대장간: 뜬마을의 방, 칸은 만들기·상점·고치기·강화, 이끼쇠를 판다 (AN-A11)', () => {
  assert.deepEqual(TOWNS['뜬마을'].order, ['floatgate', 'lampbridge', 'herbhut', 'raftforge', 'marshshrine', 'emptyshop', 'floatinn']);
  const p = PLACES.raftforge;
  assert.equal(p.name, '뗏목 대장간');
  assert.equal(p.band, 6);
  assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night);
  const s = marshed('raft', { at: 'raftforge' });
  assert.deepEqual(labels(s), ['만들기', '상점', '고치기', '강화']);
  assert.ok(townRooms(s).map((r) => r.name).includes('뗏목 대장간'));
  assert.deepEqual(SHOPS.raftforge.sells, ['mossiron', 'oakbranch', 'ironore', 'wolffang']);
  assert.ok(shopView(s).goods.some((g) => g.name === '이끼쇠 덩이'));
  assert.equal(SHOPS.raftforge.keeperId, 'raftsmith');
  const who = PEOPLE.raftsmith;
  assert.equal(who.place, 'raftforge');
  assert.ok(who.hello.length === 5 && who.talk.length >= 3 && CALLS.raftsmith);
  assert.deepEqual(peopleHere(s).map((x) => x.name), ['대장장이 느루']);
});

test('M24-1 공방을 사지 않은 사람이 뗏목 대장간에서 이끼쇠 장비를 짓고, 고치고, 강화한다', () => {
  const s = smith6(marshed('raft-make', { at: 'raftforge' }));
  assert.equal(s.shop, null, '공방이 없다');
  make(s, 'mossiron_sword');
  const i = s.bag.findIndex((x) => x.id === 'mossiron_sword');
  assert.ok(i >= 0, '이끼쇠 검이 가방에 들어왔다');
  dispatch(s, { type: 'equip', index: i });
  assert.equal(s.equip.weapon.id, 'mossiron_sword');
  // 고치기
  s.equip.weapon.dur -= 20; s.silver = 50000;
  const before = s.equip.weapon.dur;
  dispatch(s, { type: 'repair', slot: 'weapon' });
  assert.ok(s.equip.weapon.dur > before, '고쳐졌다');
  // 강화: 재료는 지금 규칙 그대로다. 되든 안 되든 여기서 시도할 수 있다
  addItem(s, 'ironore', 40); addItem(s, 'boarhide', 40);
  assert.doesNotThrow(() => dispatch(s, { type: 'enhance', slot: 'weapon' }));
  // 사기 전의 빈 공방에서는 여전히 못 짓는다 (AN-F3)
  s.place = 'emptyshop';
  for (const n of RECIPES.mossiron_helm.needs) addItem(s, n.id, n.n);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'mossiron_helm' }), /화덕/);
  assert.deepEqual(labels(s), ['둘러보기']);
});

test('M24-1 공방의 "만들기"·"바느질" 칸은 그대로다. 대장간에서는 바느질을 하지 않는다', () => {
  const o = owner('raft-owner', { at: 'emptyshop' });
  assert.ok(labels(o).includes('만들기') && labels(o).includes('바느질') && labels(o).includes('공방'));
  const s = marshed('raft-sew', { at: 'raftforge' });
  s.craftLv.sew = { lv: 24, xp: 0 }; s.craftTier.sew = 6;
  for (const n of RECIPES.mossiron_armor.needs) addItem(s, n.id, n.n);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'mossiron_armor' }), /꿰맬 수 없습니다/);
});

test('M24-1 8장을 끝내기 전에는 뗏목 대장간이 지도에도 갈 길에도 없다 (AN-F1)', () => {
  const s = forged('raft-before');
  s.main.done = s.main.done.filter((d) => d.chapter !== 8); s.opened = s.opened.filter((x) => x !== 'marshroad');
  assert.ok(!JSON.stringify(mapView(s)).includes('뜬마을'));
  assert.throws(() => dispatch(s, { type: 'travel', to: 'floatgate' }));
  assert.throws(() => dispatch(s, { type: 'move', to: 'raftforge' }));
});

// ── M24-2 서브 "장인들의 연장" (LV-E10) ──
import { SUBS, SUB_ORDER, TOOL_METALS, TOOL_METAL_N } from '../src/data/quests.js';
import { offersOf, subView, questBook } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { anviled } from './_anvil.js';
import { ponded } from './_pond.js';

test('M24-2 서브 "장인들의 연장": 야영지의 연장지기가 준다. 일곱 고장의 쇠를 일곱 덩이씩 (LV-E10)', () => {
  const q = SUBS.mastertools;
  assert.equal(q.name, '장인들의 연장');
  assert.equal(PEOPLE[q.giver].place, 'anvilcamp');
  assert.equal(SUB_ORDER.at(-1), 'mastertools');
  assert.deepEqual(TOOL_METALS, ['frostiron', 'saltsteel', 'ashiron', 'mossiron', 'oldbronze', 'cloudsilver', 'starmetal']);
  assert.equal(TOOL_METAL_N, 7);
  assert.equal(q.steps[0].at, 'firstkiln');
  assert.deepEqual(q.steps[0].choices[0].need.items, TOOL_METALS.map((id) => [id, 7]));
  // 보상은 경험치·명성·사이와 물건 하나(첫쇠)다. 새 규칙을 여는 표시는 없다
  const ok = q.steps[0].choices[0].ok;
  assert.deepEqual(Object.keys(ok).sort(), ['bond', 'fame', 'give', 'take', 'xp']);
  assert.deepEqual(ok.give, [['firstiron', 7]]);
  // 야영지의 칸은 그대로다 (CM-A2). 연장지기는 방의 사람 목록에 나온다
  const s = anviled('tools-camp');
  assert.deepEqual(PLACES.anvilcamp.actions, ['look', 'rest', 'cook', 'storage']);
  assert.deepEqual(peopleHere(s).map((p) => p.name), ['연장지기']);
  assert.ok(PEOPLE.toolkeeper.hello.length === 5 && PEOPLE.toolkeeper.talk.length >= 3 && CALLS.toolkeeper);
});

test('M24-2 받기 · 모으기 · 끝내기: 쇠가 모자라면 못 끝내고, 다 모아 식은 가마터에 가져가면 끝난다', () => {
  const s = anviled('tools-run');
  assert.deepEqual(offersOf(s, 'toolkeeper'), ['mastertools']);
  // 야영지가 아니면 못 받는다
  s.place = 'seventents';
  assert.throws(() => dispatch(s, { type: 'quest', op: 'accept', id: 'mastertools' }), /있는 곳에서 받습니다/);
  s.place = 'anvilcamp';
  dispatch(s, { type: 'quest', op: 'accept', id: 'mastertools' });
  assert.ok(s.log.some((l) => l.text === SUBS.mastertools.offer));
  assert.deepEqual(offersOf(s, 'toolkeeper'), []);
  assert.deepEqual(questBook(s).subs.map((v) => v.name), ['장인들의 연장']);
  // 야영지에서는 정할 수 없다. 가마터에서도 쇠가 없으면 못 끝낸다
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'mastertools', choice: 'forge' }), /식은 가마터에서/);
  dispatch(s, { type: 'move', to: 'firstkiln' });
  let v = subView(s, 'mastertools');
  assert.ok(v.step.here);
  assert.equal(v.step.choices.find((c) => c.id === 'forge').can, false);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'mastertools', choice: 'forge' }), /있어야 하는 것/);
  // 여섯 고장 것만 있어도, 한 고장이 여섯 덩이여도 안 된다
  for (const id of TOOL_METALS.slice(0, 6)) addItem(s, id, 7);
  addItem(s, 'starmetal', 6);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'mastertools', choice: 'forge' }), /있어야 하는 것/);
  addItem(s, 'starmetal', 1);
  // 마흔아홉 덩이는 이 구간 사람이 한 번에 질 수 있는 무게다
  assert.ok(valueOf(s, 'carry') >= 49, `무게 한도 ${valueOf(s, 'carry')}`);
  const xp = s.xp, lv = s.level, fame = s.fame, iron = countOf(s, 'firstiron');
  dispatch(s, { type: 'quest', op: 'choose', id: 'mastertools', choice: 'forge' });
  for (const id of TOOL_METALS) assert.equal(countOf(s, id), 0, id);
  assert.equal(countOf(s, 'firstiron'), iron + 7);
  assert.ok(s.level > lv || s.xp > xp, '경험치를 받았다');
  assert.ok((s.fame || 0) >= (fame || 0));
  assert.ok(s.quests.mastertools.done);
  assert.equal(s.quests.mastertools.ending, '일곱 장인의 연장을 다시 지었다');
  assert.deepEqual(questBook(s).subs, []);
  assert.ok(questBook(s).done.some((d) => d.kind === '서브' && d.name === '장인들의 연장'));
  // 한 번뿐이다
  assert.deepEqual(offersOf(s, 'toolkeeper'), []);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'accept', id: 'mastertools' }), /이미 받은/);
});

test('M24-2 끼어들지 않는 길도 있다: 쇠도 보상도 오가지 않는다', () => {
  const s = anviled('tools-none');
  dispatch(s, { type: 'quest', op: 'accept', id: 'mastertools' });
  dispatch(s, { type: 'move', to: 'firstkiln' });
  for (const id of TOOL_METALS) addItem(s, id, 7);
  const xp = s.xp;
  dispatch(s, { type: 'quest', op: 'choose', id: 'mastertools', choice: 'none' });
  assert.ok(s.quests.mastertools.done);
  for (const id of TOOL_METALS) assert.equal(countOf(s, id), 7);
  assert.equal(s.xp, xp);
  assert.equal(countOf(s, 'firstiron'), 0);
});

test('M24-2 처음 모루에 가기 전에는 서브가 어디에도 나오지 않는다', () => {
  // 12장을 끝내기 전: 줄 사람이 내놓지 않고, 야영지에 갈 길도 없고, 퀘스트 창에도 없다
  const s = ponded('tools-before');
  assert.ok(!s.main.done.some((d) => d.chapter === 12));
  assert.deepEqual(offersOf(s, 'toolkeeper'), []);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'anvilcamp' }));
  assert.throws(() => dispatch(s, { type: 'quest', op: 'accept', id: 'mastertools' }));
  const book = questBook(s);
  assert.ok(!JSON.stringify(book).includes('장인들의 연장') && !JSON.stringify(book).includes('연장지기'));
  assert.ok(!JSON.stringify(mapView(s)).includes('야영지'));
  // 다른 곳의 사람 목록에도 연장지기는 없다
  for (const id of Object.keys(PLACES)) { if (id === 'anvilcamp') continue; s.place = id; assert.ok(!peopleHere(s).some((p) => p.id === 'toolkeeper'), id); }
});

// ── M24-3 사제의 윗단계 기도 구슬 ──
import { TIERS, BEADS } from '../src/data/tiers.js';
import { BANDS } from '../src/data/bands.js';
import { ITEMS } from '../src/data/items.js';
import { ORDER_OF } from '../src/data/recipes.js';
import { attackStat } from '../src/core/derived.js';
import { gearOf } from '../tools/balance.mjs';

test('M24-3 3~10단계마다 그 단계의 기도 구슬 하나와 세공 설계도. 반지 자리, 공격력만, 사제만', () => {
  assert.equal(BEADS, 0.5);
  for (const t of TIERS) {
    const id = `${t.metal[0]}_beads`, d = ITEMS[id], r = RECIPES[id];
    assert.ok(d && r, id);
    assert.equal(d.slot, 'ring'); assert.equal(d.job, 'priest'); assert.equal(d.tier, t.n);
    assert.equal(d.attack, Math.round(BANDS[t.n - 1].weapon * 0.5), id);
    assert.equal(d.defense, undefined, '방어력은 없다');
    assert.ok(d.name.endsWith(' 기도 구슬') && d.desc.includes('사제만 쓴다'));
    assert.ok(r.jewel && r.branch === 'jewel' && !r.promo, '세공으로 꿰고, 승급작이 아니다');
    assert.ok(ORDER_OF.jewel.includes(id));
    assert.ok(r.needs.some((n) => n.id === t.metal[0]));
    // 그 단계의 반지(승급작)는 그대로다
    assert.ok(RECIPES[`${t.metal[0]}_ring`].promo || t.n === 10);
  }
  assert.equal(TIERS.length, 8);
});

test('M24-3 1~20의 기도 구슬은 그대로다(방어력 2, 공격력 없음)', () => {
  const d = ITEMS.prayerbeads;
  assert.deepEqual([d.defense, d.attack, d.price, d.tier, d.job], [2, undefined, 30, undefined, 'priest']);
  assert.deepEqual(RECIPES.prayerbeads.needs, [{ id: 'oakbranch', n: 2 }, { id: 'copperore', n: 1 }]);
});

test('M24-3 사제가 그 단계의 구슬을 차면 지혜로 치고 공격력이 구슬만큼 오른다. 사제가 아니면 차지 못한다', () => {
  const s = marshed('beads-priest');
  s.job = 'priest';
  const before = valueOf(s, 'attack');
  assert.equal(attackStat(s), 'str');
  addItem(s, 'mossiron_beads', 1);
  dispatch(s, { type: 'equip', index: s.bag.findIndex((x) => x.id === 'mossiron_beads') });
  assert.ok(Object.values(s.equip).some((it) => it?.id === 'mossiron_beads'));
  assert.equal(attackStat(s), 'wis');
  s.stats.wis = s.stats.str; // 스탯이 같을 때 구슬의 몫만 본다
  assert.equal(valueOf(s, 'attack') - before, ITEMS.mossiron_beads.attack);
  const w = marshed('beads-warrior');
  w.job = 'warrior';
  addItem(w, 'mossiron_beads', 1);
  assert.throws(() => dispatch(w, { type: 'equip', index: w.bag.findIndex((x) => x.id === 'mossiron_beads') }));
});

test('M24-3 계산 도구는 사제에게 그 단계의 구슬을 채운다. 1~20에서는 지금 구슬이다', () => {
  for (const t of TIERS) assert.equal(gearOf(t.n, 'wis', 'priest').ring2, `${t.metal[0]}_beads`);
  assert.equal(gearOf(1, 'wis', 'priest').ring2, 'prayerbeads');
  assert.equal(gearOf(6, 'str', 'warrior').ring2, 'mossiron_ring');
});
