// 여정 테스트: 잿골 (로드맵 M17-8). 7장을 끝낸 사람이 잿골로 올라, 소금강 검이 무르는 것을 겪고, 숫돌로 버티다 잿쇠 검으로 갈아타고,
// 달궈진 무기를 큰 대장간에서 강화하고, 마당에서 구경하고 겨루고, 식은 가마에 불씨를 나르고, 식지 않는 가마의 망치를 꺾어 8장을 끝낸다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 40% 아래면 물약). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sold } from './_salt.js';
import { dispatch, slotsNow, mapView, bodyView, enemyView, ASH_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { mainView, subView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { shopView } from '../src/core/trade.js';
import { enhanceView } from '../src/core/gear.js';
import { isHot } from '../src/core/heat.js';
import { foeToday, ARENA_LINES } from '../src/core/arena.js';
import { parseSave } from '../src/core/save.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN, MARSH_ROAD_SAY } from '../src/data/quests.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 아니면 친다. */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * 0.4 && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { let n = 0; while (s.battle && n++ < 400) turn(s); assert.equal(s.falls, 0, '쓰러지지 않았다'); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 게 구이의 힘이 다하면 다시 먹는다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (!foodBuff(s) && has(s, 'dish_embercrab') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_embercrab') });
};
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'travel', to }); } battle(s); if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 한 벌 짓는다. 만드는 동안의 피로는 손으로 눌러 두었다(쉬어 가며 짓는 것을 줄였다). */
const craft = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); let n = 0; while (s.craft && n++ < 80) { s.tired = Math.min(s.tired, 60); dispatch(s, { type: 'hammer' }); } assert.equal(s.craft, null); };
/** 잿물 주막에서 방을 빌려 잔다. 낮에 빌리면 밤에 깨므로, 밤이면 한 번 더 자서 아침에 나선다(밤길은 피로가 훨씬 빨리 쌓인다). */
const inn = (s) => { room(s, 'ashinn'); dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
/** 해가 기울었는가: 지금 나서야 밤이 되기 전에 마을에 닿는다(길은 반나절이다). */
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 15);
/** 들판에서 사냥한다. done()이 참이 될 때까지. 해가 기울거나 지치면 가마골에서 자고 온다. */
const hunt = (s, field, done, cap = 600) => {
  let moves = 0;
  while (!done() && moves++ < cap) {
    tend(s);
    if (!s.battle && !s.choice && (late(s) || s.tired >= 45)) { go(s, 'kilngate'); inn(s); room(s, 'kilngate'); go(s, field); continue; }
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { battle(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.ok(done(), '사냥이 끝나지 않았다');
  battle(s); if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); battle(s);
};

test('잿골: 무르는 검을 숫돌로 버티다 잿쇠로 갈아타고, 달궈 강화하고, 마당에서 겨루고, 망치를 꺾는다 (M17)', () => {
  // 7장(팔린 종)을 끝낸 레벨 44의 전사. 소금강 장비(4단계)를 찼다. (소금벌은 journey-salt가 한다: 여기서는 7장을 끝낸 사람에서 시작한다)
  const s = sold('journey-ash', { at: 'saltgate' });
  s.level = 44; s.stats.str += 14; s.stats.con += 12;
  for (const id of ['saltsteel_sword', 'saltsteel_shield', 'saltsteel_helm', 'saltsteel_armor', 'saltsteel_gloves', 'saltsteel_boots', 'saltsteel_ring']) wear(s, id);
  s.silver = 6000; s.hp = valueOf(s, 'maxHp');

  // 1. 저울목 어귀에 "잿골로 오른다"가 생겼다. 반나절을 올라 가마골에 닿는다. 장비 칸이 생긴다
  assert.equal(bodyView(s).heat, null, '잿골 밖에서는 장비 칸이 없다');
  assert.equal(mainView(s).name, '벼린 종');
  const up = slotsNow(s).find((x) => x.label === '잿골로 오른다');
  go(s, up.action.to);
  assert.ok(texts(s).includes(ASH_FIRST[0]));
  assert.equal(bodyView(s).heat.pct, 100);
  assert.equal(bodyView(s).thirst, null, '물 칸은 소금벌에서만');
  assert.ok(mapView(s).some((r) => r.name === '가마골' && r.here));

  // 2. 큰 대장간에서 숫돌 셋을, 비늘 가게에서 물약과 주먹밥과 게 구이 거리를 산다. 잿물 주막에서 게 구이를 굽는다 (요리 5단계는 손으로 열었다: 소금벌 구이를 지은 사람)
  room(s, 'bigforge');
  assert.ok(shopView(s).goods.some((g) => g.id === 'whetstone'));
  buy(s, 'whetstone', 3);
  room(s, 'scaleshop');
  buy(s, 'redpotion', 12); buy(s, 'riceball', 6); buy(s, 'crabmeat', 4); buy(s, 'herb', 8); buy(s, 'salt', 4);
  room(s, 'ashinn');
  s.craftLv.cook = { lv: 18, xp: 0 }; s.craftTier.cook = 5;
  for (let i = 0; i < 4; i++) craft(s, 'cook_embercrab');
  assert.equal(countOf(s, 'dish_embercrab'), 4);
  inn(s);

  // 3. 재 비탈. 소금강 검은 한 번 칠 때마다 2씩 닳는다. 20% 아래로 내려가면 "무른 쇠"가 뜬다. 숫돌로 버틴다
  room(s, 'kilngate'); go(s, 'ashslope');
  let wins = 0, whets = 0;
  const sword = s.equip.weapon;
  hunt(s, 'ashslope', () => {
    if (!s.battle && !s.choice) {
      wins = (s.dex.mon.ashlizard?.won || 0) + (s.dex.mon.sparkbat?.won || 0);
      const slot = slotsNow(s).find((x) => x.label === '숫돌');
      if (sword.dur < sword.max * 0.2 && slot && !slot.disabled) { dispatch(s, slot.action); whets += 1; }
    }
    return texts(s).includes('열기에 쇠가 무르다') && whets >= 1 && !s.battle && !s.choice;
  });
  assert.ok(wins >= 4, `무르기까지 ${wins}판`);
  assert.ok(wins <= 14, '소금강 검은 열 판 남짓에 무른다(시안: 여덟 판쯤)');
  assert.ok(texts(s).includes('소금강 검의 내구도가'));
  assert.ok(texts(s).includes('숫돌로 소금강 검을 갈았다. 내구도 +20'));
  assert.ok(countOf(s, 'lizardscale') + countOf(s, 'ashiron') > 0, '비늘이나 잿쇠를 주웠다');
  assert.equal(s.falls, 0);

  // 4. 가마골로 돌아와 잿쇠 검을 짓는다 (대장 5단계는 손으로 열었다: 저울꾼의 방패를 지은 사람). 이제 한 번에 1씩 닳는다
  go(s, 'kilngate'); room(s, 'bigforge');
  dispatch(s, { type: 'repair', slot: 'weapon' });
  s.craftLv.smith = { lv: 19, xp: 0 }; s.craftTier.smith = 5;
  buy(s, 'ashiron', Math.max(0, 6 - countOf(s, 'ashiron'))); buy(s, 'oakbranch', Math.max(0, 1 - countOf(s, 'oakbranch')));
  craft(s, 'ashiron_sword');
  dispatch(s, { type: 'equip', index: has(s, 'ashiron_sword') });
  assert.equal(s.equip.weapon.id, 'ashiron_sword');
  assert.equal(s.equip.weapon.maker, s.name);
  if (late(s) || s.tired >= 45) inn(s);

  // 5. 다시 재 비탈. 한 판 이기면 잿쇠 검이 단다. 식기 전에(서른 번 움직이기 전에) 큰 대장간으로 돌아가 강화한다
  room(s, 'kilngate'); go(s, 'ashslope');
  const durBefore = s.equip.weapon.dur;
  const wonBefore = (s.dex.mon.ashlizard?.won || 0) + (s.dex.mon.sparkbat?.won || 0);
  hunt(s, 'ashslope', () => !s.battle && !s.choice && (s.dex.mon.ashlizard?.won || 0) + (s.dex.mon.sparkbat?.won || 0) > wonBefore && isHot(s, s.equip.weapon));
  assert.ok(texts(s).includes('잿쇠 검이 벌겋게 달았다. 식기 전에 모루에 올리면 잘 먹는다.'));
  assert.ok(durBefore - s.equip.weapon.dur <= 30, '잿쇠 검은 보통으로 닳는다');
  assert.equal(bodyView(s).heat.hot.name, '달궈진 쇠');
  go(s, 'kilngate');
  if (!isHot(s, s.equip.weapon)) { go(s, 'ashslope'); hunt(s, 'ashslope', () => !s.battle && !s.choice && isHot(s, s.equip.weapon)); go(s, 'kilngate'); } // 오는 길에 습격을 받아 식었으면 한 번 더
  room(s, 'bigforge');
  assert.ok(isHot(s, s.equip.weapon), '식기 전에 닿았다');
  buy(s, 'ironore', 3);
  const view = enhanceView(s, s.equip.weapon);
  assert.equal(view.hot, true);
  assert.equal(view.chance, 1, '+0에서 +1은 본디 100%다. 달궈진 쇠의 +10%p는 그 위에 얹힌다');
  dispatch(s, { type: 'enhance', slot: 'weapon' });
  assert.equal(s.equip.weapon.plus, 1);
  const second = enhanceView(s, s.equip.weapon);
  assert.ok(second.hot && second.chance >= 0.999, '+1에서 +2는 90%에 10%p가 얹혀 꼭 된다');
  dispatch(s, { type: 'enhance', slot: 'weapon' });
  assert.equal(s.equip.weapon.plus, 2);

  // 6. 겨루기 마당. 먼저 구경해 그날 상대의 버릇을 본 뒤 선다. 지면 풀무 골목에서 서른 번을 밀고 다음 날 다시 선다
  inn(s);
  let fights = 0;
  while (s.ash.duel.wins < 1 && fights < 4) {
    room(s, 'arena');
    const foe = foeToday(s);
    assert.ok(s.log.some((l) => l.who === '심판 노을' && l.text.includes(`'${foe.name}'`)));
    for (let i = 0; i < 3; i++) dispatch(s, { type: 'act', id: 'watch' });
    assert.ok(s.log.filter((l) => l.who === '구경').length >= 3);
    const silver = s.silver;
    dispatch(s, { type: 'act', id: 'duel' });
    battle(s);
    fights += 1;
    if (s.ash.duel.lost) {
      assert.equal(s.silver, silver, '져도 잃는 것이 없다');
      room(s, 'bellowsrow');
      for (let i = 0; i < 30; i++) { tend(s); dispatch(s, { type: 'act', id: 'bellows' }); }
      assert.equal(s.ash.duel.lost, false);
    } else assert.equal(s.silver, silver + 385);
    inn(s);
  }
  assert.ok(s.ash.duel.wins >= 1, '마당에서 한 번은 이겼다');
  assert.ok(texts(s).includes(ARENA_LINES.win));
  assert.ok(s.dings.some((d) => d.body === '높은 대에 걸린 검이 울었습니다.'));
  assert.equal(s.falls, 0, '겨루기로는 쓰러지지 않는다');

  // 7. 풀무 골목. 다래를 만나고, 솔에게서 "식은 가마"를 받는다. 쇳물 내에서 재 다섯 줌을 퍼 담아 식기 전에 나른다
  room(s, 'bellowsrow');
  assert.ok(texts(s).includes('풀무 자루를 잡아 보았다.'));
  dispatch(s, { type: 'greet', npc: 'b_sol' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'coldkiln' });
  room(s, 'scaleshop'); buy(s, 'redpotion', Math.max(0, 12 - countOf(s, 'redpotion'))); buy(s, 'riceball', Math.max(0, 6 - countOf(s, 'riceball')));
  room(s, 'bigforge'); for (const slot of Object.keys(s.equip)) if (s.equip[slot] && s.equip[slot].dur < s.equip[slot].max) dispatch(s, { type: 'repair', slot });
  let tries = 0;
  while (!s.quests.coldkiln.done && tries++ < 6) {
    if (late(s) || s.tired >= 40) inn(s);
    room(s, 'kilngate'); go(s, 'moltenbrook');
    let digs = 0;
    while (countOf(s, 'hotash') < 5 && digs++ < 12) { tend(s); if (s.battle) battle(s); else dispatch(s, { type: 'act', id: 'dig' }); }
    go(s, 'kilngate'); room(s, 'bellowsrow');
    if (countOf(s, 'hotash') >= 5) dispatch(s, { type: 'quest', op: 'choose', id: 'coldkiln', choice: 'pour' });
  }
  assert.equal(s.quests.coldkiln.ending, '불씨를 살렸다');
  assert.equal(subView(s, 'coldkiln').done, true);

  // 8. 8장 꺾는 길: 식지 않는 가마로 들어가 망치를 쓰러뜨린다 (레벨은 손으로 올렸다: 우두머리는 50이다. 나머지 잿쇠 장비도 손으로 채웠다: 한 벌을 다 짓는 것은 m50이 본다)
  inn(s);
  s.level = 50; s.stats.str += 8; s.stats.con += 6;
  for (const id of ['ashiron_shield', 'ashiron_helm', 'ashiron_armor', 'ashiron_gloves', 'ashiron_boots', 'ashiron_ring']) wear(s, id);
  s.hp = valueOf(s, 'maxHp');
  room(s, 'scaleshop'); buy(s, 'redpotion', Math.max(0, 16 - countOf(s, 'redpotion')));
  if (has(s, 'dish_embercrab') < 0 && !foodBuff(s)) { buy(s, 'crabmeat'); buy(s, 'herb', 2); buy(s, 'salt'); room(s, 'ashinn'); craft(s, 'cook_embercrab'); }
  room(s, 'bigforge'); for (const slot of Object.keys(s.equip)) if (s.equip[slot] && s.equip[slot].dur < s.equip[slot].max) dispatch(s, { type: 'repair', slot });
  room(s, 'kilngate'); go(s, 'moltenbrook');
  tend(s);
  assert.equal(foodBuff(s).name, '달궈진 속');
  assert.deepEqual(mainView(s).paths.slice(0, 2).map((p) => p.have), [0, 0]);
  assert.ok(mainView(s).paths[2].have > 0, '풀무 골목에서 한 일은 불을 끄는 길에 쌓여 있다');
  dispatch(s, slotsNow(s).find((x) => x.label === '가마로 들어간다').action);
  for (const id of ['k1-flue', 'k2-grate', 'k2-rack', 'k2-grate', 'k3-bench', 'k3-nook', 'k3-bench', 'k4-bar', 'k4-mold', 'k5-anvil']) {
    if (s.hp < valueOf(s, 'maxHp') * 0.7 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    if (id === 'k3-nook') dispatch(s, { type: 'dungeon', op: 'rest' });
    battle(s);
    if (s.choice?.kind === 'trap') dispatch(s, { type: 'choose', id: 'dodge' });
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon?.room, id);
  }
  assert.equal(s.dmem.kiln.keeper, 'beat');
  assert.equal(s.main.chapter, 9);
  assert.equal(s.main.called, '망치를 꺾은 이');
  assert.ok(texts(s).includes(MAIN[8].paths[0].done));
  assert.ok(s.opened.includes('marshroad'));
  assert.ok(!mainView(s).text.includes(MARSH_ROAD_SAY));
  assert.equal(mainView(s).name, '잊힌 종', '안개늪이 났다 (M18)');
  assert.equal(s.falls, 0);

  // 9. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
});

test('잿골: 처음 온 사람에게는 잿골도 장비 칸도 숫돌 칸도 없다 (AG-F)', () => {
  const s = sold('journey-ash-fresh', { at: 'saltgate' });
  s.opened = s.opened.filter((id) => id !== 'ashroad');
  s.main.done = s.main.done.filter((d) => d.chapter !== 7); s.main.chapter = 7;
  assert.ok(!slotsNow(s).some((x) => x.label === '잿골로 오른다'));
  assert.ok(!JSON.stringify(mapView(s)).match(/가마골|재 비탈|쇳물 내/));
  assert.equal(bodyView(s).heat, null);
  assert.ok(!JSON.stringify(slotsNow(s)).match(/숫돌|겨루기|구경/));
});
