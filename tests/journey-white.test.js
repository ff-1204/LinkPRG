// 여정 테스트: 흰마루 (로드맵 M15-8). 1부의 끝을 본 사람이 고개를 넘어, 추위를 다루며 사냥하고, 얼음 구멍에서 낚고, 종루를 올라 6장을 끝낸다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 40% 아래면 물약). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ended } from './_white.js';
import { createGame, dispatch, slotsNow, mapView, bodyView, enemyView, BEYOND_LINE, WHITE_FIRST } from '../src/core/game.js';
import { mainView, boardView, subView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { coldView, furCount } from '../src/core/cold.js';
import { foodBuff } from '../src/core/buffs.js';
import { countOf, addItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { RECIPES } from '../src/data/recipes.js';
import { COLD_LINES } from '../src/core/cold.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 아니면 친다. */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  const potion = s.bag.findIndex((x) => x.id === 'redpotion');
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * 0.4 && potion >= 0) return dispatch(s, { type: 'use', index: potion });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon, at = s.dungeon?.room || s.place; let n = 0; while (s.battle && n++ < 300) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${at}의 ${foe}, 물약 ${s.bag.find((x) => x.id === 'redpotion')?.n || 0}병)`); };
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) dispatch(s, { type: 'choose', id: 'leave' }); else dispatch(s, { type: 'travel', to }); } battle(s); if (s.choice) dispatch(s, { type: 'choose', id: 'leave' }); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
const craft = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); let n = 0; while (s.craft && n++ < 60) dispatch(s, { type: 'hammer' }); assert.equal(s.craft, null); };
/** 밤이면 주막에서 방을 빌려 자고, 배가 고프면 주먹밥을 먹는다. */
const tend = (s) => {
  if (s.full < 40 && !s.choice && !s.battle) { const i = s.bag.findIndex((x) => x.id === 'riceball'); if (i >= 0) dispatch(s, { type: 'use', index: i }); }
};

test('흰마루: 고개를 넘어, 식지 않게 사냥하고, 식은 몸으로 낚고, 종루를 오른다 (M15)', () => {
  // 1부의 끝(잇는다)을 본 레벨 24의 전사. 강철 장비(2단계)를 찼다. (1부는 다른 여정 테스트가 한다: 여기서는 끝을 본 사람에서 시작한다)
  const s = ended('journey-white', { night: false });
  for (const id of ['steelsword', 'steelshield', 'steelhelm', 'steelarmor', 'beargloves', 'bearboots', 'steelring']) wear(s, id);
  s.silver = 1200; s.hp = valueOf(s, 'maxHp');

  // 1. 끝을 본 그날은 아직 아무것도 없다. 밤이 되자 고개 너머에서 소리가 들린다
  assert.ok(!mapView(s).some((r) => r.name === '언못'));
  assert.ok(mainView(s).name.startsWith('끝난 뒤'));
  let n = 0;
  while (s.phase !== 2 && n++ < 200) dispatch(s, { type: 'act', id: 'look' });
  assert.ok(texts(s).includes(BEYOND_LINE));
  assert.equal(mainView(s).name, '얼린 종');
  dispatch(s, { type: 'act', id: 'rest' }); // 광장에서 자고 아침에 나선다

  // 2. 소리재를 지나 고갯길로. "고개를 넘는다"가 생겼다. 큰 시장에서 횃불과 물약, 주먹밥을 산다
  go(s, 'bigmarket');
  buy(s, 'torch', 4); buy(s, 'redpotion', 6); buy(s, 'riceball', 4);
  go(s, 'pass');
  assert.equal(bodyView(s).cold, null, '흰마루 밖에서는 체온 칸이 없다');
  const cross = slotsNow(s).find((x) => x.label === '고개를 넘는다');
  assert.ok(cross);
  go(s, cross.action.to);
  assert.ok(texts(s).includes(WHITE_FIRST[0]) && texts(s).includes(WHITE_FIRST[1]));
  assert.equal(bodyView(s).cold.warm, 100, '체온 칸이 생겼다. 100에서 시작한다');

  // 3. 사냥꾼 움막에서 의뢰를 받고, 굶는 겨울 이야기를 듣는다
  room(s, 'hunterhut');
  assert.ok(boardView(s).some((c) => c.id === 'fox3'));
  dispatch(s, { type: 'job', op: 'accept', id: 'fox3' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'winter' });
  assert.equal(subView(s, 'winter').name, '굶는 겨울');

  // 4. 눈밭. 횃불을 켜고 서리 여우 셋을 잡는다. 체온이 62 아래로 내려가기 전에 돌아온다
  go(s, 'snowfield');
  dispatch(s, { type: 'act', id: 'torch' });
  assert.ok(texts(s).includes(COLD_LINES.torchOn));
  let foxes = 0, moves = 0;
  while (foxes < 3 && moves++ < 400) {
    tend(s);
    // 다쳤으면 싸움 사이에 물약을 마신다
    if (!s.battle && !s.choice && s.hp < valueOf(s, 'maxHp') * 0.6 && countOf(s, 'redpotion')) { dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'redpotion') }); continue; }
    if (!s.battle && !s.choice && (s.phase === 2 || coldView(s).warm < 62 || s.hp < valueOf(s, 'maxHp') * 0.5)) {
      // 밤이 오거나 식거나 물약이 떨어진 채 다치면 마을로 돌아가 주막에서 잔다
      go(s, 'icegate'); room(s, 'hearth');
      dispatch(s, { type: 'act', id: 'room' });
      assert.equal(coldView(s).warm, 100);
      go(s, 'snowfield');
      if (!s.torch && countOf(s, 'torch')) dispatch(s, { type: 'act', id: 'torch' });
      continue;
    }
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { const mon = s.battle.mon; battle(s); if (mon === 'frostfox' && !s.battle) foxes += 1; continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.equal(foxes, 3, '서리 여우 셋');
  assert.ok(countOf(s, 'whitefur') >= 1, '흰털 가죽이 떨어졌다');
  assert.equal(coldView(s).stage, 0, '준비하고 나가면 식은 몸이 되기 전에 판을 끝낸다');
  assert.equal(s.falls, 0);

  // 5. 움막에 돌아가 의뢰를 끝내고, 흰털 가죽으로 장갑과 장화를 지어 찬다 (재봉 3단계는 손으로 열었다: 곰 가죽 장화를 지은 사람)
  go(s, 'icegate'); room(s, 'hunterhut');
  const silver = s.silver;
  dispatch(s, { type: 'job', op: 'finish', id: 'fox3' });
  assert.equal(s.silver, silver + 240);
  s.craftLv.sew = { lv: 10, xp: 0 }; s.craftTier.sew = 3;
  while (countOf(s, 'whitefur') < 4) buy(s, 'whitefur');
  craft(s, 'frostiron_gloves'); craft(s, 'frostiron_boots');
  for (const id of ['frostiron_gloves', 'frostiron_boots']) dispatch(s, { type: 'equip', index: s.bag.findIndex((x) => x.id === id) });
  assert.equal(furCount(s), 2, '털옷 둘');

  // 6. 화롯방 주막에서 눈밭 전골을 끓인다 (요리 3단계는 손으로 열었다: 곰 고기 전골을 지은 사람)
  buy(s, 'icemeat', 2); buy(s, 'herb', 4); buy(s, 'salt', 2);
  room(s, 'hearth');
  s.craftLv.cook = { lv: 10, xp: 0 }; s.craftTier.cook = 3;
  craft(s, 'cook_snowpot'); craft(s, 'cook_snowpot');
  assert.equal(countOf(s, 'dish_snowpot'), 2);

  // 7. 이번에는 일부러 식힌다: 횃불 없이 눈밭에 서서 체온을 50 아래로. 식은 몸이 된다
  if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' });
  go(s, 'snowfield');
  n = 0;
  while ((s.torch > 0 || coldView(s).warm > 50) && n++ < 300) {
    tend(s);
    if (s.battle) battle(s); else if (s.choice) dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'leave' : slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.equal(coldView(s).tag.name, '식은 몸');
  assert.ok(texts(s).includes(COLD_LINES.cool));
  // 8. 식은 몸 그대로 얼음 낚시터로. 어귀를 지나며 조금 풀리지만 아직 식어 있다. 은어가 문다
  go(s, 'icegate'); room(s, 'icehole');
  assert.equal(coldView(s).stage, 1);
  n = 0;
  while (countOf(s, 'silverfish') < 3 && n++ < 120) { tend(s); if (s.phase === 2) break; dispatch(s, { type: 'act', id: 'fish' }); }
  assert.ok(countOf(s, 'silverfish') >= 1, '식은 몸으로만 잡히는 얼음 밑 은어');
  assert.equal(s.dex.items.silverfish, true);
  // 뜨거운 전골 한 그릇으로 몸을 푼다
  const before = coldView(s).warm;
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  assert.equal(coldView(s).warm, Math.min(100, before + 40));
  assert.equal(foodBuff(s).name, '녹은 손끝');

  // 9. 종루 아래에서 종지기 한솔을 만난다
  room(s, 'underbell');
  assert.ok(s.log.some((l) => l.who === '종지기 한솔' && l.text.includes('깨우러 왔나')));
  assert.ok(slotsNow(s).find((x) => x.label === '한솔을 설득한다').disabled, '아직 남이다');

  // 10. 종루에 오른다. (레벨 30과 서릿쇠 장비는 손으로 갖췄다: 눈밭과 언 호수에서 레벨 여섯을 올리고 장비를 지은 뒤다)
  s.level = 30; s.stats.str += 9; s.stats.con += 7; s.unspent = 0;
  for (const id of ['frostiron_sword', 'frostiron_shield', 'frostiron_helm', 'frostiron_armor', 'frostiron_ring']) wear(s, id);
  while (countOf(s, 'redpotion') < 8) addItem(s, 'redpotion', 1);
  room(s, 'hearth'); dispatch(s, { type: 'act', id: 'room' }); // 자고, 화롯불 곁을 붙이고 간다
  if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' });
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'dish_snowpot') });
  room(s, 'underbell');
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'icetower' });
  for (const id of ['t1-hall', 't1-stair', 't2-step', 't2-store', 't2-step', 't3-loft', 't3-rest']) {
    dispatch(s, { type: 'room', to: id });
    battle(s);
    if (s.choice?.kind === 'trap') dispatch(s, { type: 'choose', id: 'dodge' });
  }
  dispatch(s, { type: 'dungeon', op: 'rest' }); // 종지기의 쪽방에서 한 번 쉰다
  for (const id of ['t3-loft', 't4-door']) dispatch(s, { type: 'room', to: id });
  dispatch(s, { type: 'choose', id: 'key' }); // 창고에서 찾은 얼음 낀 열쇠
  dispatch(s, { type: 'room', to: 't4-ropes' }); battle(s);
  dispatch(s, { type: 'room', to: 't5-bell' });
  assert.equal(enemyView(s).name, '잠든 종의 파수꾼');
  assert.equal(coldView(s).stage, 0, '화롯불 곁과 털옷 덕에 식은 몸이 되기 전에 꼭대기에 닿았다');
  battle(s);

  // 11. 파수꾼이 쓰러지고 6장이 끝난다. 소금벌로 내려가는 길이 열린다
  assert.equal(s.battle, null);
  assert.equal(s.main.chapter, 7);
  assert.equal(s.main.called, '얼음을 깬 이');
  assert.ok(texts(s).includes('종이 한 번 울었다. 삼십 년 만이었다.'));
  assert.ok(s.opened.includes('saltflat'));
  assert.equal(s.falls, 0, '한 번도 쓰러지지 않았다');
});

test('흰마루: 처음 온 사람에게는 흰마루도 체온도 없다 (WM-F)', () => {
  const s = createGame({ name: '처음', origin: 'farmer', spent: {}, seed: 'journey-white-fresh' });
  assert.equal(bodyView(s).cold, null);
  assert.ok(!mapView(s).some((r) => ['언못', '눈밭', '언 호수'].includes(r.name)));
  assert.ok(!JSON.stringify([mainView(s), slotsNow(s)]).match(/언못|체온|흰마루|얼린 종/));
});
