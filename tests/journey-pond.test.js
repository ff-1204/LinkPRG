// 여정 테스트: 별못 (로드맵 M21-11). 11장을 끝낸 사람이 다릿목에서 내려가 맞울에 닿고, 다온을 만나고,
// 비단 집에서 일행 셋(창잡이 한뫼, 방패잡이 도란, 북 치는 소담)을 갖춰 못 둘레에서 수를 섞어 가며 싸우고(읽히지 않고 이긴다),
// 같은 수만 거듭해 읽혀도 보고, 답하는 마당에서 달래의 그물을 끝까지 지켜보고 "봤다고 말한다"(일로 세지 않는다),
// 솔을 호위해 조각 스무 개를 줍게 하고, 별 떨어진 자리의 다섯 층을 내려가 마지막 조각을 거두어 12장을 끝낸다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 45% 아래면 물약). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heard } from './_cloud.js';
import { dispatch, slotsNow, mapView, bodyView, enemyView, POND_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { mainView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff, graceBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { mercView, mercSeats, fullPartyView, partyFees } from '../src/core/party.js';
import { partyMax } from '../src/data/companions.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN, SHARD_LINES } from '../src/data/quests.js';
import { DAON_FIRST, READ_LINES, POND } from '../src/core/pond.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
let turns = 0, mix = true;
/**
 * 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 아니면 친다.
 * mix면 수를 섞는다: 공격을 세 번 이어 읽힘이 40에 닿으면 다음은 막는다(바로 뒤에 모아 치기가 두 번 이어 와서 거듭 막아도 60을 넘지 않게). 아니면 읽힐 때까지 같은 수(막기)만 거듭하고, 읽힌 뒤에는 다시 섞는다.
 */
const turn = (s) => {
  const max = valueOf(s, 'maxHp'), b = s.battle;
  turns++;
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * (enemyView(s).boss ? 0.65 : 0.55) && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') }); // 물약은 55%에서 든다 (M23-1: 별못의 보통 공격이 세져 한 대가 생명력의 30%쯤이다. 45%까지 버티면 급소 한 번에 쓰러진다)
  if (!mix && !s.flags.sawRead) return dispatch(s, { type: 'battle', choice: 'defend' }); // 같은 수만 거듭한다: 막기만 한다 (M23-1 뒤로는 치기만 거듭하면 읽히기 전에 물약을 들어야 해서 수가 끊긴다)
  if ((mix || s.flags.sawRead) && b.last === 'attack' && (b.read || 0) >= POND.at - POND.same) return dispatch(s, { type: 'battle', choice: 'defend' });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon, at = s.dungeon?.room || s.place; let n = 0; while (s.battle && n++ < 900) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${at}의 ${foe}, 물약 ${countOf(s, 'redpotion')}병)`); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 떡과 성수의 힘이 다하면 다시 든다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (!foodBuff(s) && has(s, 'dish_starcake') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_starcake') });
  if (!graceBuff(s) && has(s, 'starholy') >= 0) dispatch(s, { type: 'use', index: has(s, 'starholy') });
};
const skip = (s) => { if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); };
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) skip(s); else dispatch(s, { type: 'travel', to }); } battle(s); skip(s); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 못가 주막에서 방을 빌려 잔다(용병도 낫는다). 밤에 깨면 한 번 더 자서 아침에 나선다. */
const inn = (s) => { room(s, 'pondinn'); dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 20);
const restock = (s) => { room(s, 'silkhouse'); buy(s, 'redpotion', Math.max(0, 20 - countOf(s, 'redpotion'))); buy(s, 'riceball', Math.max(0, 4 - countOf(s, 'riceball'))); room(s, 'pondshrine'); buy(s, 'starholy', Math.max(0, 2 - countOf(s, 'starholy'))); };
const MONS = ['starmoth', 'pondmirror', 'starshard', 'voidecho'];
const wonOf = (s) => MONS.reduce((a, id) => a + (s.dex.mon[id]?.won || 0), 0);
/** 그 사냥터에서 n마리를 잡는다(탐색하다 만나면 덮친다). 해가 지거나 지치면 맞울로 돌아가 자고 온다. @returns 한 마리에 든 턴 */
const hunt = (s, n, at = 'pondside') => {
  const won = wonOf(s), t0 = turns;
  let guard = 0;
  while (wonOf(s) - won < n && guard++ < 400) {
    tend(s);
    if (s.battle) { battle(s); continue; }
    if (s.choice) { if (s.choice.kind === 'sense') dispatch(s, { type: 'choose', id: 'pounce' }); else skip(s); continue; }
    if (s.place !== at) { room(s, 'echogate'); go(s, at); continue; }
    if (late(s) || s.tired >= 45) { go(s, 'echogate'); restock(s); inn(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  battle(s);
  assert.ok(wonOf(s) - won >= n, '사냥감을 잡았다');
  return Math.round(((turns - t0) / (wonOf(s) - won)) * 10) / 10;
};

test('별못: 다릿목에서 내려가, 일행 셋을 갖춰 수를 섞어 싸우고, 달래의 그물을 끝까지 지켜보고, 솔을 호위하고, 마지막 조각을 거둔다 (M21)', () => {
  // 1. 11장을 끝낸 사람이 다릿목 어귀에 서 있다 (레벨·스탯·장비·은화는 손으로 넣었다: 별못의 제 레벨 사람, 별쇠 한 벌)
  const s = heard('journey-pond', { at: 'bridgegate' });
  s.level = 84; s.stats.str += 15; s.stats.con += 12; s.silver = 60000;
  for (const id of ['starmetal_sword', 'starmetal_helm', 'starmetal_armor', 'starmetal_gloves', 'starmetal_boots', 'starmetal_ring', 'starmetal_ring']) wear(s, id); // 반지 둘까지 한 벌을 다 찬다 (M23-1: 별못의 보통 공격이 세져, 반지 없이는 구덩이를 해가 있는 동안에 못 끝낸다)
  for (const [id, n] of [['redpotion', 20], ['dish_starcake', 8], ['starholy', 3], ['riceball', 4]]) s.bag.push({ id, grade: 0, n });
  s.hp = valueOf(s, 'maxHp');
  s.dex.places.bridgegate = true; // 지금 서 있는 곳이다
  assert.equal(mapView(s).find((r) => r.id === 'echogate').name, '맞울');
  assert.equal(mainView(s).name, '깨진 종');

  // 2. 별못으로 내려간다. 하루 길이다. 내려설 때의 글이 뜨고, 다온을 만난다
  const t0 = s.day * 150 + s.phase * 50 + s.tick;
  dispatch(s, slotsNow(s).find((x) => x.label === '별못으로 내려간다').action);
  battle(s); skip(s);
  if (s.place !== 'echogate') go(s, 'echogate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - t0 >= 50);
  assert.ok(texts(s).includes(POND_FIRST[0]));
  for (const [, text] of DAON_FIRST) assert.ok(texts(s).includes(text));
  assert.equal(bodyView(s).read, null, '맞울에서는 읽힘 칸이 없다');

  // 3. 비단 집에서 일행 셋을 갖춘다: 때리는 이, 막는 이, 북돋는 이. 고루 갖춘 일행이다. 하루 삯은 2,070
  room(s, 'silkhouse');
  assert.deepEqual(mercView(s).map((m) => m.name), ['북 치는 소담', '창잡이 한뫼', '활잡이 나리', '방패잡이 도란']);
  assert.equal(partyMax(s), 3);
  for (const id of ['hanmoe', 'doran', 'drumsodam']) dispatch(s, { type: 'party', op: 'hire', id });
  assert.deepEqual([mercSeats(s).n, mercSeats(s).max], [3, 3]);
  assert.equal(fullPartyView(s).name, '고루 갖춘 일행');
  assert.equal(partyFees(s).silver, 2070);
  assert.equal(bodyView(s).drum.text, '공격력·방어력 +12%');

  // 4. 못 둘레: 수를 섞어 가며 넷을 잡는다. 한 번도 읽히지 않고 이긴 싸움에는 숙련도가 더 오른다
  room(s, 'echogate'); go(s, 'pondside');
  mix = true;
  const mixed = hunt(s, 4);
  assert.equal(s.falls, 0);
  assert.ok(texts(s).includes(READ_LINES.clean), '읽히지 않고 이겼다');
  assert.ok(!s.flags.sawRead, '수를 섞는 동안에는 한 번도 읽히지 않았다');

  // 5. 같은 수만 거듭해 본다: 읽힌다. 다섯째 칸이 차고 이름표가 붙는다
  mix = false;
  let sawTag = false;
  const won = wonOf(s);
  let g = 0;
  while (wonOf(s) === won && g++ < 300) {
    tend(s);
    if (s.battle) { turn(s); if (bodyView(s).read?.on) sawTag = true; continue; }
    if (s.choice) { if (s.choice.kind === 'sense') dispatch(s, { type: 'choose', id: 'pounce' }); else skip(s); continue; }
    if (s.place !== 'pondside') { room(s, 'echogate'); go(s, 'pondside'); continue; }
    if (late(s) || s.tired >= 45) { go(s, 'echogate'); restock(s); inn(s); room(s, 'echogate'); go(s, 'pondside'); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  battle(s);
  assert.ok(s.flags.sawRead && sawTag, '읽혔다');
  assert.ok(texts(s).includes(READ_LINES.first));
  mix = true;

  // 6. 답하는 마당: 달래의 그물을 서른 번 지켜보고 봤다고 말한다. 지켜보기는 일이 아니다
  if (s.place !== 'echogate') go(s, 'echogate');
  restock(s); inn(s);
  room(s, 'answeryard');
  const work = s.flags.dayWork || 0;
  for (let i = 0; i < 30; i++) dispatch(s, { type: 'act', id: 'witness' });
  assert.equal(s.flags.dayWork || 0, work, '일로 세지 않는다');
  assert.equal(slotsNow(s)[0].label, '봤다고 말한다');
  dispatch(s, { type: 'saw' });
  assert.ok(s.log.some((l) => l.who === '그물 깁는 달래' && l.text === '…그래. 봤구나. 그럼 된 거지.'));
  assert.equal(mainView(s).paths[2].have, 1);

  // 7. 서브 "조각을 줍는 아이": 솔을 호위해 스무 조각을 줍게 한다. 덤비는 것은 내가 막는다
  inn(s); restock(s);
  room(s, 'echogate');
  dispatch(s, { type: 'quest', op: 'accept', id: 'shardkid' });
  go(s, 'starfield');
  let presses = 0;
  while (s.quests.shardkid.step === 'guard' && presses < 300) {
    tend(s);
    if (s.battle) { battle(s); continue; }
    if (s.choice) { skip(s); continue; }
    if (s.place !== 'starfield') { room(s, 'echogate'); go(s, 'starfield'); continue; }
    if (late(s) || s.tired >= 45) { go(s, 'echogate'); restock(s); inn(s); continue; }
    dispatch(s, { type: 'guardkid' });
    presses += 1;
  }
  battle(s);
  assert.equal(s.quests.shardkid.step, 'back');
  assert.ok(texts(s).includes(SHARD_LINES.guardDone));
  go(s, 'echogate');
  dispatch(s, { type: 'quest', op: 'choose', id: 'shardkid', choice: 'done' });
  assert.equal(countOf(s, 'bellshard'), 7);
  assert.ok(s.log.some((l) => /^봤어\./.test(l.text)), '끝까지 한 일에 마을 사람이 답했다');

  // 8. 12장 거두는 길: 별 떨어진 자리로 내려간다 (레벨은 손으로 올렸다: 마지막 조각은 90이다. 물약과 은화도 손으로 채웠다)
  s.level = 90; s.stats.str += 9; s.stats.con += 8; s.silver += 30000;
  restock(s); room(s, 'silkhouse'); buy(s, 'redpotion', Math.max(0, 40 - countOf(s, 'redpotion')));
  // 아침에 나선다: 밤을 새우며 싸우면 피로가 두 배 넘게 쌓여, 긴 싸움 도중에 곯아떨어진다
  inn(s); while (s.phase !== 0) dispatch(s, { type: 'act', id: 'room' });
  s.hp = valueOf(s, 'maxHp');
  room(s, 'echogate'); go(s, 'starfield');
  tend(s);
  dispatch(s, slotsNow(s).find((x) => x.label === '구덩이로 내려간다').action);
  // 쉼터와 궤가 묻힌 방은 들르지 않고 곧장 내려간다: 다섯 층과 마지막 조각을 해가 있는 동안에 끝내려면 그래야 한다
  for (const id of ['k1-slope', 'k2-scorch', 'k3-glass', 'k4-cry', 'k5-bottom']) {
    tend(s); // 떡과 성수의 힘이 다했으면 다시 든다(구덩이는 길다)
    while (s.hp < valueOf(s, 'maxHp') * 0.9 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    battle(s);
    assert.equal(s.dungeon?.room, id);
  }
  assert.equal(s.dmem.starpit.keeper, 'beat');
  assert.equal(s.main.chapter, 13);
  assert.equal(s.main.called, '조각을 거둔 이');
  assert.ok(texts(s).includes(MAIN[12].paths[0].done));
  assert.ok(s.opened.includes('anvilroad'));
  assert.equal(mainView(s).name, '두 번째 약속');
  assert.ok(JSON.stringify(mapView(s)).includes('모루 아래 야영지'));
  assert.equal(s.falls, 0);

  // 9. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
  // 잰 것: 일행 셋과 수를 섞어 한 마리에 든 턴(roadmap.md M21 아래에 적는다)
  console.log(`  별못 여정: 못 둘레 한 마리에 일행 셋과 ${mixed}턴(수를 섞어, 읽힘 ${POND.at} 아래로), 호위는 ${presses}번 눌러 스무 조각`);
});

test('별못: 처음 온 사람에게는 별못도 읽힘 칸도 "봤다고 말한다"도 작은 종도 셋째 자리도 없다 (BM-G)', async () => {
  const { climbed } = await import('./_cloud.js');
  const { recipeList } = await import('../src/core/craft.js');
  const { ORDER_OF } = await import('../src/data/recipes.js');
  const { workshopView } = await import('../src/core/workshop.js');
  const s = climbed('journey-pond-fresh', { at: 'bridgegate' });
  assert.ok(!slotsNow(s).some((x) => x.label === '별못으로 내려간다'));
  assert.ok(!JSON.stringify(mapView(s)).match(/맞울|못 둘레|별 떨어진 벌/));
  assert.equal(bodyView(s).read, null);
  assert.equal(partyMax(s), 2);
  assert.ok(!JSON.stringify(slotsNow(s)).match(/지켜보기|봤다고|작은 종|호위|태세/));
  s.place = 'artguild'; s.craftLv.jewel = { lv: 36, xp: 0 }; s.craftTier.jewel = 9;
  assert.ok(!recipeList(s, ORDER_OF.jewel).some((r) => r.id === 'smallbell'), '종 조각을 손에 넣기 전에는 작은 종의 설계도가 없다');
  s.shop = { hand: null, hand2: null, shelf: [], today: [], left: {} };
  assert.equal(workshopView(s).seats, 2, '81이 되기 전에는 셋째 자리가 없다');
  s.place = 'goathut';
  assert.ok(!JSON.stringify(mercView(s)).match(/소담|한뫼|나리|도란/));
});
