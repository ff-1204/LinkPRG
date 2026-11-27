// 여정 테스트: 안개늪 (로드맵 M18-8). 8장을 끝낸 사람이 안개늪으로 내려가, 준비 없이 뒤지다 길을 잃고, 등불을 켜고 사냥하다 저주를 얻어 성수로 걷고,
// 빈 공방을 사서 견습 보리에게 일을 맡기고(내가 일한 만큼만 돈다), 가라앉는 오솔길 끝에서 이끼를 걷어 보고, 종지기를 쉬게 해 9장을 끝낸다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 40% 아래면 물약, 저주가 네 겹이면 성수). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forged } from './_ash.js';
import { dispatch, slotsNow, mapView, bodyView, enemyView, workshopView, MARSH_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { mainView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { MARSH_LINES } from '../src/core/marsh.js';
import { shopMaker } from '../src/core/workshop.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN, SUNKEN_ROAD_SAY } from '../src/data/quests.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
const curse = (s) => s.marsh.curse;
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 저주가 깊어지려 하면 성수를, 아프면 물약을 마시고, 아니면 친다. 물약은 절반에서 든다(M23-1: 안개늪의 보통 공격이 세졌다). */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (curse(s) >= 4 && has(s, 'holywater') >= 0) return dispatch(s, { type: 'use', index: has(s, 'holywater') });
  if (s.hp < max * 0.5 && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon, at = s.dungeon?.room || s.place; let n = 0; while (s.battle && n++ < 500) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${at}의 ${foe}, 물약 ${s.bag.find((x) => x.id === 'redpotion')?.n || 0}병)`); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 약탕의 힘이 다하면 다시 마신다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (!foodBuff(s) && has(s, 'dish_marshbrew') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_marshbrew') });
};
const skip = (s) => { if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); };
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) skip(s); else dispatch(s, { type: 'travel', to }); } battle(s); skip(s); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 한 그릇 끓인다. 만드는 동안의 피로는 손으로 눌러 두었다. */
const craft = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); let n = 0; while (s.craft && n++ < 80) { s.tired = Math.min(s.tired, 60); dispatch(s, { type: 'hammer' }); } assert.equal(s.craft, null); };
/** 물 위 주막에서 방을 빌려 잔다. 밤에 깨면 한 번 더 자서 아침에 나선다. */
const inn = (s) => { room(s, 'floatinn'); dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 15);
/** 물약이나 성수가 떨어져 간다. */
const low = (s) => countOf(s, 'redpotion') < 5 || (s.marsh.curse >= 2 && countOf(s, 'holywater') < 1);
/** 뜬마을에서 다시 채운다: 물약 열넷, 성수 셋, 등불 셋. */
const restock = (s) => { room(s, 'lampbridge'); buy(s, 'redpotion', Math.max(0, 14 - countOf(s, 'redpotion'))); buy(s, 'lamp', Math.max(0, 3 - countOf(s, 'lamp'))); room(s, 'marshshrine'); buy(s, 'holywater', Math.max(0, 3 - countOf(s, 'holywater'))); if (s.marsh.curse > 0) dispatch(s, { type: 'use', index: has(s, 'holywater') }); };
/** 등불이 꺼졌으면 다시 켠다. */
const lamp = (s) => { if (s.marsh.lamp < 1 && ITEMS.lamp && has(s, 'lamp') >= 0 && !s.battle && !s.choice) dispatch(s, { type: 'act', id: 'lamp' }); };
/** 들판에서 사냥한다. done()이 참이 될 때까지. 해가 기울거나 지치면 뜬마을에서 자고 온다. 길을 잃어 마을에 떨어지면 다시 나간다. */
const hunt = (s, field, done, { lit = true, cap = 700 } = {}) => {
  let moves = 0;
  while (!done() && moves++ < cap) {
    tend(s);
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { battle(s); continue; }
    if (s.place !== field) { if (late(s) || s.tired >= 45) inn(s); room(s, 'floatgate'); go(s, field); continue; }
    if (late(s) || s.tired >= 45 || low(s)) { go(s, 'floatgate'); restock(s); inn(s); room(s, 'floatgate'); go(s, field); continue; }
    if (lit) lamp(s);
    if (dispatch(s, { type: 'act', id: 'explore' }).some((e) => e.type === 'lost')) lostCount += 1;
  }
  assert.ok(done(), '사냥이 끝나지 않았다');
  battle(s); skip(s); battle(s);
};
/** 길을 잃은 수(대화방은 오래된 줄을 버리므로 따로 센다). */
let lostCount = 0;
const wins = (s) => ['mosstoad', 'mistleech', 'soakedscarecrow', 'marshlight'].reduce((a, id) => a + (s.dex.mon[id]?.won || 0), 0);

test('안개늪: 길을 잃고, 등불을 켜고, 저주를 성수로 걷고, 공방에서 견습을 부리고, 종지기를 쉬게 한다 (M18)', () => {
  // 8장(벼린 종)을 끝낸 레벨 54의 전사. 잿쇠 장비(5단계)를 찼다. (잿골은 journey-ash가 한다: 여기서는 8장을 끝낸 사람에서 시작한다)
  const s = forged('journey-marsh', { at: 'kilngate' });
  s.level = 54; s.stats.str += 14; s.stats.con += 12;
  for (const id of ['ashiron_sword', 'ashiron_shield', 'ashiron_helm', 'ashiron_armor', 'ashiron_gloves', 'ashiron_boots', 'ashiron_ring']) wear(s, id);
  s.silver = 9000; s.hp = valueOf(s, 'maxHp');

  // 1. 가마골 어귀에 "안개늪으로 내려간다"가 생겼다. 반나절을 내려가 뜬마을 나루에 닿는다. 저주 칸이 생긴다
  assert.equal(bodyView(s).curse, null, '안개늪 밖이고 저주도 없으면 칸이 없다');
  assert.equal(mainView(s).name, '잊힌 종');
  go(s, slotsNow(s).find((x) => x.label === '안개늪으로 내려간다').action.to);
  assert.ok(texts(s).includes(MARSH_FIRST[0]));
  assert.equal(bodyView(s).curse.n, 0);
  assert.equal(bodyView(s).heat, null, '장비 칸은 잿골에서만');
  assert.ok(mapView(s).some((r) => r.name === '뜬마을' && r.here));

  // 2. 물약과 주먹밥만 사서 준비 없이(등불도 표식도 없이) 이끼 밭을 뒤진다. 길을 잃는다: 다치지는 않지만 반나절이 가고 나루로 돌아온다
  room(s, 'lampbridge'); buy(s, 'redpotion', 14); buy(s, 'riceball', 6);
  room(s, 'floatgate'); go(s, 'mossfield');
  hunt(s, 'mossfield', () => lostCount >= 1 && !s.battle && !s.choice, { lit: false });
  assert.ok(texts(s).includes(MARSH_LINES.lost) && texts(s).includes(MARSH_LINES.found));
  assert.ok(s.log.some((l) => l.who === '등불지기 여울' && l.text === MARSH_LINES.keeper));

  // 3. 등불 다리에서 등불과 끈을, 늪 사당에서 성수를 산다. 약초꾼 오두막에서 늪 약탕을 끓인다 (요리 6단계는 손으로 열었다: 잿불 게 구이를 지은 사람)
  if (s.place !== 'floatgate') go(s, 'floatgate');
  room(s, 'lampbridge'); buy(s, 'lamp', 4); buy(s, 'marker', 10); buy(s, 'redpotion', Math.max(0, 14 - countOf(s, 'redpotion')));
  room(s, 'marshshrine'); buy(s, 'holywater', 4);
  room(s, 'herbhut');
  assert.ok(texts(s).includes('종은 어디 있느냐고 물었다.'), '수련을 처음 만났다');
  buy(s, 'toadleg', 4); buy(s, 'herb', 8); buy(s, 'salt', 4);
  s.craftLv.cook = { lv: 22, xp: 0 }; s.craftTier.cook = 6;
  for (let i = 0; i < 4; i++) craft(s, 'cook_marshbrew');
  inn(s);

  // 4. 등불을 켜고 이끼 밭에서 사냥한다. 맞다 보면 저주가 앉는다. 성수 한 병으로 모두 걷는다
  room(s, 'floatgate'); go(s, 'mossfield');
  const won0 = wins(s), lostBefore = lostCount;
  let drank = false;
  hunt(s, 'mossfield', () => {
    if (!s.battle && !s.choice && curse(s) >= 1 && !drank) {
      const slot = slotsNow(s).find((x) => x.label === '성수');
      if (slot && !slot.disabled) { assert.ok(bodyView(s).curse.tag.name.startsWith('저주 ')); dispatch(s, slot.action); assert.equal(curse(s), 0); drank = true; }
    }
    return drank && wins(s) - won0 >= 4 && !s.battle && !s.choice;
  });
  assert.ok(texts(s).includes(MARSH_LINES.curse));
  assert.ok(texts(s).includes('저주가 모두 걷혔다'));
  assert.ok(texts(s).includes(MARSH_LINES.lampOn));
  assert.equal(lostCount, lostBefore, '등불을 켠 동안에는 길을 잃지 않았다');
  assert.ok(countOf(s, 'mossiron') + countOf(s, 'toadleg') > 0, '이끼쇠나 두꺼비 다리를 주웠다');

  // 5. 가라앉는 숲에 끈 열 개를 묶는다. 이제 거기서는 등불 없이도 길을 잃지 않는다
  go(s, 'floatgate'); if (late(s) || s.tired >= 40) inn(s);
  room(s, 'floatgate'); go(s, 'sunkenwood');
  for (let i = 0; i < 10; i++) { battle(s); skip(s); dispatch(s, { type: 'act', id: 'knot' }); }
  assert.equal(s.marsh.knots.sunkenwood, 10);
  assert.ok(!slotsNow(s).some((x) => x.label === '표식 묶기'));

  // 6. 빈 공방을 둘러보고 산다 (은화는 손으로 넣었다: 13,000은 이 구간 열흘 벌이다). 물 위 주막에서 보리를 견습으로 들인다
  go(s, 'floatgate'); inn(s);
  room(s, 'emptyshop');
  assert.ok(!slotsNow(s).some((x) => /공방/.test(x.label)), '둘러보기 전에는 공방 칸이 없다');
  dispatch(s, { type: 'act', id: 'look' });
  s.silver += 16000;
  dispatch(s, slotsNow(s).find((x) => x.label.startsWith('공방 사기')).action);
  room(s, 'floatinn');
  dispatch(s, slotsNow(s).find((x) => x.label === '견습').action);
  assert.equal(workshopView(s).hand.name, '보리');

  // 7. 잿쇠 덩이를 선반에 넣고 잿쇠 투구를 맡긴다 (대장 6단계는 손으로 열었다: 잿쇠 갑옷을 지은 사람. 잿쇠 덩이도 손으로 넣었다: 잿골에서 캐 온 것)
  room(s, 'emptyshop');
  s.craftTier.smith = 6; s.craftLv.smith = { lv: 21, xp: 0 };
  s.bag.push({ id: 'ashiron', grade: 0, n: 16 });
  dispatch(s, { type: 'workshop', op: 'put', index: has(s, 'ashiron') });
  dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'make', recipe: 'ashiron_helm' } });
  assert.equal(workshopView(s).hand.left, 10);
  // 자고, 둘러보고, 사고팔아서는 한 칸도 차지 않는다
  inn(s); room(s, 'floatgate'); for (let i = 0; i < 15; i++) dispatch(s, { type: 'act', id: 'look' });
  assert.equal(s.shop.hand.work, 0, '쉬기만 해서는 견습이 돌지 않는다');
  assert.equal(s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length, 0);
  // 이끼 밭에서 사냥한다(탐색과 싸움의 턴이 일이다). 그동안 보리가 투구를 짓는다
  restock(s); room(s, 'floatgate'); go(s, 'mossfield');
  const dings = s.dings.length, made = s.made, smith = JSON.stringify(s.craftLv.smith);
  hunt(s, 'mossfield', () => !s.battle && !s.choice && s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length >= 2);
  const helm = s.shop.shelf.find((x) => x.id === 'ashiron_helm');
  assert.deepEqual([helm.grade, helm.maker], [0, shopMaker(s)]);
  assert.deepEqual([s.made, JSON.stringify(s.craftLv.smith)], [made, smith], '내 제작 레벨은 오르지 않는다');
  assert.ok(!s.dings.slice(dings).some((d) => /투구/.test(d.title)), '견습이 만든 것에는 띠링이 없다');
  assert.equal(lostCount, lostBefore, '등불을 켠 동안에는 길을 잃지 않았다');
  assert.ok(workshopView(s).today.length || s.shop.shelf.length, '오늘 만든 것이 적힌다');

  // 8. 9장 쉬게 하는 길: 가라앉는 오솔길로 들어가 종 앞에 선다 (레벨은 손으로 올렸다: 종지기는 60이다. 이끼쇠 장비도 손으로 채웠다)
  go(s, 'floatgate'); inn(s);
  s.level = 60; s.stats.str += 8; s.stats.con += 6;
  for (const id of ['mossiron_sword', 'mossiron_shield', 'mossiron_helm', 'mossiron_armor', 'mossiron_gloves', 'mossiron_boots', 'mossiron_ring']) wear(s, id);
  s.hp = valueOf(s, 'maxHp'); s.silver += 4000;
  room(s, 'lampbridge'); buy(s, 'redpotion', Math.max(0, 20 - countOf(s, 'redpotion')));
  room(s, 'marshshrine'); buy(s, 'holywater', Math.max(0, 4 - countOf(s, 'holywater')));
  if (has(s, 'dish_marshbrew') < 0 && !foodBuff(s)) { room(s, 'herbhut'); buy(s, 'toadleg'); buy(s, 'herb', 2); buy(s, 'salt'); craft(s, 'cook_marshbrew'); }
  room(s, 'lampbridge');
  tend(s);
  assert.equal(foodBuff(s).name, '맑아진 눈');
  dispatch(s, slotsNow(s).find((x) => x.label === '오솔길로 들어선다').action);
  for (const id of ['p1-reeds', 'p2-sink', 'p2-boat', 'p2-sink', 'p3-post', 'p3-hut', 'p3-post', 'p4-gate', 'p4-lights', 'p5-bell']) {
    if (s.hp < valueOf(s, 'maxHp') * 0.7 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    if (id === 'p3-hut') dispatch(s, { type: 'dungeon', op: 'rest' });
    battle(s);
    if (s.choice?.kind === 'trap') dispatch(s, { type: 'choose', id: 'dodge' });
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon?.room, id);
  }
  // 종지기는 먼저 치지 않는다. 곁에 서서 이끼를 걷어 본다: 한 번 누르면 한 번
  assert.equal(s.battle, null);
  for (let i = 0; i < 12; i++) dispatch(s, slotsNow(s).find((x) => x.label === '이끼 걷기').action);
  assert.equal(s.marsh.moss, 12);
  assert.equal(mainView(s).paths[1].have, 12);
  assert.ok(mainView(s).paths[2].have >= 1, '견습의 손은 가르치는 길에 쌓여 있다');
  if (curse(s) > 0 && has(s, 'holywater') >= 0) dispatch(s, { type: 'use', index: has(s, 'holywater') });
  if (s.hp < valueOf(s, 'maxHp') * 0.9 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  dispatch(s, slotsNow(s).find((x) => x.label === '종지기를 쉬게 한다').action);
  battle(s);
  assert.equal(s.dmem.sunkenpath.keeper, 'beat');
  assert.equal(s.main.chapter, 10);
  assert.equal(s.main.called, '종지기를 쉬게 한 이');
  assert.ok(texts(s).includes(MAIN[9].paths[0].done));
  assert.ok(s.opened.includes('sunkenroad'));
  assert.ok(!mainView(s).text.includes(SUNKEN_ROAD_SAY), '잠긴 도성이 났으니(M19) 덧말은 걷혔다');
  assert.equal(mainView(s).name, MAIN[10].name);
  assert.equal(s.falls, 0);

  // 9. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
});

test('안개늪: 처음 온 사람에게는 안개늪도 저주 칸도 공방도 견습도 없다 (AN-F)', () => {
  const s = forged('journey-marsh-fresh', { at: 'kilngate' });
  s.opened = s.opened.filter((id) => id !== 'marshroad');
  s.main.done = s.main.done.filter((d) => d.chapter !== 8); s.main.chapter = 8;
  assert.ok(!slotsNow(s).some((x) => x.label === '안개늪으로 내려간다'));
  assert.ok(!JSON.stringify(mapView(s)).match(/뜬마을|이끼 밭|가라앉는 숲/));
  assert.equal(bodyView(s).curse, null);
  assert.equal(workshopView(s), null);
  assert.ok(!JSON.stringify(slotsNow(s)).match(/등불|표식|성수|공방|견습/));
});
