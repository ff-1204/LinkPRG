// 여정 테스트: 소금벌 (로드맵 M16-11). 6장을 끝낸 사람이 소금벌로 내려가, 물을 챙기며 사냥하고, 시세를 보고, 좌판을 사서 지은 것을 팔고,
// 옛 우물을 찾고, 창고를 털어 7장을 끝내고, 사당에서 스스로 다시 태어난다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 40% 아래면 물약). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salted } from './_salt.js';
import { createGame, dispatch, slotsNow, mapView, bodyView, enemyView, chosenRebirth, SALT_FIRST } from '../src/core/game.js';
import { mainView, boardView, subView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { pricesView, shopView } from '../src/core/trade.js';
import { stallView } from '../src/core/stall.js';
import { THIRST_LINES } from '../src/core/thirst.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN } from '../src/data/quests.js';
import { rollDice, dealOrigins } from '../src/data/origins.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 아니면 친다. 우두머리 앞에서는 물약을 일찍 든다(M23-1: 보통 공격이 세져, 40%에서는 급소 한 번에 쓰러진다). */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * (enemyView(s).boss ? 0.6 : 0.4) && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon, at = s.dungeon?.room || s.place; let n = 0; while (s.battle && n++ < 400) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${at}의 ${foe}, 물약 ${s.bag.find((x) => x.id === 'redpotion')?.n || 0}병)`); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 물이 두 모금 아래면 물 주머니를 마신다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (s.eatGrill && !foodBuff(s) && has(s, 'dish_saltgrill') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_saltgrill') }); // 음식의 힘이 다하면 다시 먹는다
  const drink = slotsNow(s).find((x) => x.action?.id === 'drink' && !x.disabled);
  if (drink && s.water <= 2) dispatch(s, drink.action);
};
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'travel', to }); } battle(s); if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 한 벌 짓는다. 만드는 동안의 피로는 손으로 눌러 두었다(쉬어 가며 짓는 것을 줄였다). */
const craft = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); let n = 0; while (s.craft && n++ < 80) { s.tired = Math.min(s.tired, 60); dispatch(s, { type: 'hammer' }); } assert.equal(s.craft, null); };
/** 우물가 주막에서 방을 빌려 잔다. 낮에 빌리면 밤에 깨므로, 밤이면 한 번 더 자서 아침에 나선다(밤길은 피로가 훨씬 빨리 쌓인다). */
const inn = (s) => { dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
/** 해가 기울었는가: 지금 나서야 밤이 되기 전에 마을에 닿는다(길은 반나절이다). */
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 15);

test('소금벌: 물을 챙겨 사냥하고, 좌판에서 지은 것을 팔고, 창고를 털고, 스스로 다시 태어난다 (M16)', () => {
  // 6장(얼린 종)을 끝낸 레벨 34의 전사. 서릿쇠 장비(3단계)를 찼다. (흰마루는 journey-white가 한다: 여기서는 6장을 끝낸 사람에서 시작한다)
  const s = salted('journey-salt', { at: 'icegate' });
  delete s.flags.sawSalt;
  for (const id of ['frostiron_sword', 'frostiron_shield', 'frostiron_helm', 'frostiron_armor', 'frostiron_gloves', 'frostiron_boots', 'frostiron_ring']) wear(s, id);
  s.silver = 2500; s.hp = valueOf(s, 'maxHp');

  // 1. 언못 어귀에 "소금벌로 내려간다"가 생겼다. 반나절을 내려가 저울목에 닿는다. 물 칸이 생긴다
  assert.equal(bodyView(s).thirst, null, '소금벌 밖에서는 물 칸이 없다');
  assert.equal(mainView(s).name, '팔린 종');
  const down = slotsNow(s).find((x) => x.label === '소금벌로 내려간다');
  go(s, down.action.to);
  assert.ok(texts(s).includes(SALT_FIRST[0]));
  assert.equal(bodyView(s).thirst.water, 10);
  assert.equal(bodyView(s).cold, null, '체온 칸은 흰마루에서만');

  // 2. 저울 마당. 시세판을 보고, 물 주머니와 물약과 주먹밥을 산다. 빈 좌판의 값을 듣는다
  room(s, 'scaleyard');
  const board = pricesView(s);
  assert.equal(board.up.length + board.down.length + board.flat.length, 11);
  buy(s, 'waterpouch', 4); buy(s, 'redpotion', 8); buy(s, 'riceball', 4);
  assert.ok(!slotsNow(s).some((x) => x.label === '가게'), '사기 전에는 가게 칸이 없다');
  dispatch(s, { type: 'greet', npc: 'stallowner' });
  assert.ok(slotsNow(s).find((x) => x.label === '좌판 사기 (은화 3,800)').disabled, '아직 은화가 모자란다');

  // 3. 우물가 주막에서 소금벌 구이를 굽는다 (요리 4단계는 손으로 열었다: 눈밭 전골을 지은 사람). 이 구간은 음식이 있어야 한다
  buy(s, 'wormmeat', 6); buy(s, 'herb', 12); buy(s, 'salt', 6);
  room(s, 'wellinn');
  s.craftLv.cook = { lv: 14, xp: 0 }; s.craftTier.cook = 4;
  for (let i = 0; i < 6; i++) craft(s, 'cook_saltgrill');
  assert.equal(countOf(s, 'dish_saltgrill'), 6);

  // 4. 용병 막사에서 의뢰를 받고, 떼인 삯 이야기를 듣는다
  room(s, 'barracks');
  assert.ok(boardView(s).some((c) => c.id === 'scorp3'));
  dispatch(s, { type: 'job', op: 'accept', id: 'scorp3' });
  dispatch(s, { type: 'greet', npc: 'captain' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'backpay' });
  assert.equal(subView(s, 'backpay').name, '떼인 삯');

  // 5. 소금 바닥. 구이를 먹고(물이 한 모금 준다) 소금 전갈 셋을 잡는다. 물이 두 모금 아래면 주머니를 마신다
  if (s.phase === 2 || s.tired >= 45) { room(s, 'wellinn'); inn(s); }
  room(s, 'saltgate'); go(s, 'saltfloor');
  dispatch(s, { type: 'use', index: has(s, 'dish_saltgrill') });
  assert.equal(foodBuff(s).name, '짠 숨');
  assert.equal(s.water, 9, '짠 음식');
  let scorps = 0, moves = 0;
  while (scorps < 3 && moves++ < 500) {
    tend(s);
    if (!s.battle && !s.choice && (late(s) || s.tired >= 45)) { go(s, 'saltgate'); room(s, 'wellinn'); inn(s); room(s, 'saltgate'); go(s, 'saltfloor'); continue; } // 해가 기울거나 지치면 주막에서 잔다(밤길은 피로가 훨씬 빨리 쌓이고, 지친 채 싸우면 싸우다 잠든다)
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { const mon = s.battle.mon; battle(s); if (mon === 'saltscorpion' && !s.battle) scorps += 1; continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.equal(scorps, 3, '소금 전갈 셋');
  assert.ok(s.water < 9 || countOf(s, 'emptypouch') >= 1 || s.wells.includes('saltfloor'), '들판에서 물이 줄었다(마셨거나, 옛 우물을 찾았거나)');
  assert.ok(!texts(s).includes(THIRST_LINES.out), '물을 챙기면 마른 목이 되지 않는다');
  assert.equal(s.falls, 0);

  // 6. 돌아와 의뢰를 끝내고, 우물에서 은화 5에 물과 빈 주머니를 채운다
  go(s, 'saltgate'); room(s, 'barracks');
  let silver = s.silver;
  dispatch(s, { type: 'job', op: 'finish', id: 'scorp3' });
  assert.equal(s.silver, silver + 400);
  room(s, 'wellinn');
  silver = s.silver;
  if (s.water >= 10 && !countOf(s, 'emptypouch')) s.water = 6; // 옛 우물에서 채우고 온 판이면 손으로 덜어 낸다
  dispatch(s, { type: 'act', id: 'well' });
  assert.deepEqual([s.water, s.silver, countOf(s, 'emptypouch')], [10, silver - 5, 0]);

  // 7. 좌판을 산다 (은화는 손으로 넣었다: 이 구간 여드레 벌이다). 소금 대장간에서 투구 둘을 지어 올린다 (대장 4단계는 손으로 열었다: 서릿쇠 검을 지은 사람)
  s.silver += 4200;
  room(s, 'scaleyard');
  dispatch(s, slotsNow(s).find((x) => x.label.startsWith('좌판 사기')).action);
  assert.ok(slotsNow(s).some((x) => x.label === '가게'));
  room(s, 'saltforge');
  s.craftLv.smith = { lv: 13, xp: 0 }; s.craftTier.smith = 4;
  buy(s, 'saltsteel', 8);
  craft(s, 'saltsteel_helm'); craft(s, 'saltsteel_helm');
  room(s, 'scaleyard');
  for (let i = 0; i < 2; i++) dispatch(s, { type: 'stall', op: 'put', index: has(s, 'saltsteel_helm') });
  assert.equal(stallView(s).items.length, 2);
  const price = stallView(s).items[0].each;

  // 8. 마른 뱃길에서 옛 우물을 찾을 때까지 뒤진다 (레벨은 손으로 올렸다: 이 사냥터는 35~38이다). 내가 일하는 동안 좌판의 투구가 팔린다
  s.level = 38; s.stats.str += 8; s.stats.con += 6;
  // 소금강 장비 한 벌도 손으로 채웠다(설계도 열둘을 다 짓는 것은 M16-5의 테스트가 본다)
  for (const k of Object.keys(s.equip)) s.equip[k] = null;
  for (const id of ['saltsteel_sword', 'saltsteel_shield', 'saltsteel_helm', 'saltsteel_armor', 'saltsteel_gloves', 'saltsteel_boots', 'saltsteel_ring', 'saltsteel_ring']) wear(s, id);
  s.hp = valueOf(s, 'maxHp');
  buy(s, 'redpotion', 10); buy(s, 'waterpouch', 2);
  if (s.phase === 2 || s.tired >= 45) { room(s, 'wellinn'); inn(s); }
  room(s, 'saltgate'); go(s, 'drychannel');
  silver = s.silver; moves = 0; s.eatGrill = true;
  while (!s.wells.includes('drychannel') && moves++ < 900) {
    tend(s);
    if (!s.battle && !s.choice && (late(s) || s.tired >= 45 || countOf(s, 'redpotion') < 4 || (s.water <= 2 && countOf(s, 'waterpouch') < 1))) {
      // 마을에 들러: 주운 것을 팔고, 물약을 열둘까지 채우고, 닳은 장비를 고치고, 물을 채우고, 잔다
      go(s, 'saltgate'); room(s, 'scaleyard');
      for (const id of ['scorpshell', 'wormmeat', 'saltsteel', 'oakbranch']) if (has(s, id) >= 0) dispatch(s, { type: 'sell', index: has(s, id), n: s.bag[has(s, id)].n });
      buy(s, 'redpotion', Math.max(0, 12 - countOf(s, 'redpotion')));
      room(s, 'saltforge'); for (const slot of Object.keys(s.equip)) if (s.equip[slot] && s.equip[slot].dur < s.equip[slot].max) dispatch(s, { type: 'repair', slot });
      room(s, 'wellinn'); if (s.water < 10 || countOf(s, 'emptypouch')) dispatch(s, { type: 'act', id: 'well' });
      inn(s);
      room(s, 'saltgate'); go(s, 'drychannel'); continue;
    }
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { battle(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  delete s.eatGrill;
  assert.ok(s.wells.includes('drychannel'), '옛 우물을 찾았다');
  assert.equal(mapView(s).find((r) => r.id === 'drychannel').well, true, '지도에 남는다');
  battle(s); if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); battle(s);
  s.water = 4;
  dispatch(s, slotsNow(s).find((x) => x.label === '물 채우기').action);
  assert.equal(s.water, 10, '옛 우물은 값없이 채운다');
  assert.ok(s.log.some((l) => l.who === '가게' && l.text.includes('소금강 투구')) || stallView(s).items.length < 2, '일하는 동안 손님이 사 갔다');
  assert.ok(s.stall.regulars >= 1 && price > 0);
  assert.equal(s.falls, 0);

  // 9. 7장 터는 길: 창고로 숨어들어 징수인을 쓰러뜨린다 (레벨은 손으로 올렸다: 우두머리는 40이다). 구이와 물약을 챙긴다
  go(s, 'saltgate');
  if (s.phase === 2 || s.tired >= 45) { room(s, 'wellinn'); inn(s); }
  s.level = 40; s.stats.str += 6; s.stats.con += 5; s.hp = valueOf(s, 'maxHp');
  room(s, 'scaleyard'); buy(s, 'redpotion', 14);
  room(s, 'warehouse');
  assert.ok(texts(s).includes('띠링! 조각을 쥐었습니다.'));
  assert.deepEqual(mainView(s).paths.map((p) => p.have), [0, 0, 0]);
  // 아침에 든다: 낮에 들면 창고 안에서 밤이 되어 징수인 앞에서 곯아떨어진다 (M23-1: 창고지기와의 싸움이 길어졌다)
  if (s.phase !== 0 || s.tired >= 40) { room(s, 'wellinn'); inn(s); while (s.phase !== 0) dispatch(s, { type: 'act', id: 'room' }); room(s, 'warehouse'); }
  // 구이를 먹고 들어간다. 떨어졌으면 하나 더 굽는다(배가 고파 이미 먹었으면 그 힘이 붙어 있다)
  if (!foodBuff(s)) {
    if (has(s, 'dish_saltgrill') < 0) { room(s, 'scaleyard'); buy(s, 'wormmeat'); buy(s, 'herb', 2); buy(s, 'salt'); buy(s, 'riceball', 3); dispatch(s, { type: 'use', index: has(s, 'riceball') }); room(s, 'wellinn'); craft(s, 'cook_saltgrill'); room(s, 'warehouse'); }
    if (!foodBuff(s)) dispatch(s, { type: 'use', index: has(s, 'dish_saltgrill') });
  }
  assert.equal(foodBuff(s).name, '짠 숨');
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'shardhouse' });
  for (const id of ['d1-sacks', 'd2-scale', 'd2-ledger', 'd2-scale', 'd3-guard', 'd3-cot', 'd3-guard', 'd4-lock', 'd4-shelf', 'd5-pillar']) {
    if (s.hp < valueOf(s, 'maxHp') * 0.7 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    // 징수인 앞에서는 물약으로 몸을 다 채우고 든다 (M23-1: 창고지기들의 보통 공격이 세져, 다친 채로 들면 진다)
    if (id === 'd5-pillar') while (s.hp < valueOf(s, 'maxHp') * 0.9 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    if (id === 'd3-cot') dispatch(s, { type: 'dungeon', op: 'rest' });
    battle(s);
    if (s.choice?.kind === 'trap') dispatch(s, { type: 'choose', id: 'dodge' });
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon?.room, id);
  }
  assert.equal(s.dmem.shardhouse.keeper, 'beat');
  assert.equal(s.main.chapter, 8);
  assert.equal(s.main.called, '창고를 턴 이');
  assert.ok(texts(s).includes(MAIN[7].paths[0].done));
  assert.ok(s.opened.includes('ashroad'));
  assert.equal(s.falls, 0);
  for (const id of ['d4-shelf', 'd4-lock', 'd3-guard', 'd2-scale', 'd1-sacks', 'd1-plank']) dispatch(s, { type: 'room', to: id }); // 들어온 널 틈으로 되돌아 나간다
  dispatch(s, { type: 'dungeon', op: 'leave' });

  // 10. 작은 사당에 "다시 태어나기"가 생겼다. 스스로 내려놓고 다시 태어난다: 끝낸 장은 건너뛰고, 길과 가게는 남는다
  room(s, 'saltshrine');
  assert.ok(slotsNow(s).some((x) => x.label === '다시 태어나기'));
  const carry = chosenRebirth(s);
  assert.equal(carry.cards, 6);
  const hand = dealOrigins('journey-salt|deal', carry.cards);
  const next = createGame({ name: '서진', origin: hand[5], rolled: rollDice('journey-salt-2'), seed: 'journey-salt-2', carry });
  assert.deepEqual([next.lives, next.main.chapter, next.main.past.length], [2, 8, 7]);
  assert.ok(next.level > 1 && next.level < s.level);
  assert.ok(mapView(next).some((r) => r.name === '저울목'), '열린 길은 그대로다');
  assert.equal(next.stall.regulars, s.stall.regulars, '가게는 남는다');
  assert.equal(next.wells.includes('drychannel'), true);
});
