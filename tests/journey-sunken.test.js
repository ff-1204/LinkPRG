// 여정 테스트: 잠긴 도성 (로드맵 M19-11). 9장을 끝낸 사람이 물길을 따라 지붕마을로 내려가, 혼자 물 아래로 들어가 짝 하나를 잡아 보고(숨이 모자라면 공기 주머니를 문다),
// 근위 막사에서 용병 둘을 구해 다시 내려가 짝을 잡고, 호위를 받으며 청동을 캐고, 잠긴 궁의 전각 다섯을 지나 메아리를 잠재워 10장을 끝낸다.
// 상자는 하나도 열지 않는다. 물 위로 올라오면 히든 "받지 않은 사람"이 나타난다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 45% 아래면 물약, 숨이 셋 아래면 공기 주머니). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rested } from './_marsh.js';
import { dispatch, slotsNow, mapView, bodyView, enemyView, SUNKEN_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { mainView, hiddenView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff, graceBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { mercView, partyView } from '../src/core/party.js';
import { SUNKEN_LINES, chestsOpened, escorts } from '../src/core/sunken.js';
import { COMPANIONS } from '../src/data/companions.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN, CLOUD_ROAD_SAY, HIDDENS } from '../src/data/quests.js';
import { talkTo } from './_time.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
const breath = (s) => bodyView(s).breath?.n ?? 99;
let turns = 0, bags = 0, escorted = 0;
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 숨이 셋 아래면 공기 주머니를 물고, 아니면 친다. */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  turns++;
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * 0.45 && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (breath(s) < 3 && has(s, 'airbag') >= 0) { bags++; return dispatch(s, { type: 'use', index: has(s, 'airbag') }); }
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { let n = 0; while (s.battle && n++ < 600) turn(s); assert.equal(s.falls, 0, '쓰러지지 않았다'); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 찜과 성수의 힘이 다하면 다시 든다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (!foodBuff(s) && has(s, 'dish_scalesteam') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_scalesteam') });
  if (!graceBuff(s) && has(s, 'deepholy') >= 0) dispatch(s, { type: 'use', index: has(s, 'deepholy') });
};
const skip = (s) => { if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); };
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) skip(s); else dispatch(s, { type: 'travel', to }); } battle(s); skip(s); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
const craft = (s, recipe) => { dispatch(s, { type: 'craft', recipe }); let n = 0; while (s.craft && n++ < 80) { s.tired = Math.min(s.tired, 60); dispatch(s, { type: 'hammer' }); } assert.equal(s.craft, null); };
/** 뱃집 주막에서 방을 빌려 잔다(용병도 낫는다). 밤에 깨면 한 번 더 자서 아침에 나선다. */
const inn = (s) => { room(s, 'boatinn'); dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 20);
/** 지붕마을에서 다시 채운다: 물약 열넷, 공기 주머니 여섯, 깊은 성수 둘. */
const restock = (s) => { room(s, 'divers'); buy(s, 'redpotion', Math.max(0, 14 - countOf(s, 'redpotion'))); buy(s, 'airbag', Math.max(0, 6 - countOf(s, 'airbag'))); room(s, 'watershrine'); buy(s, 'deepholy', Math.max(0, 2 - countOf(s, 'deepholy'))); };
/** 물 위로 올라온다. */
const up = (s) => { battle(s); skip(s); battle(s); if (bodyView(s).breath) dispatch(s, slotsNow(s).find((x) => x.label === '숨 쉬기').action); assert.equal(s.place, 'roofgate'); };
const wonOf = (s) => ['soakedgate', 'scalehound', 'belljelly', 'sunkenguard'].reduce((a, id) => a + (s.dex.mon[id]?.won || 0), 0);
/** 잠긴 거리에서 짝 하나를 잡는다(탐색하다 만나면 덮친다). @returns 그 짝에 든 턴 */
const huntPair = (s) => {
  const won = wonOf(s), t0 = turns;
  let moves = 0;
  while (wonOf(s) - won < 2 && moves++ < 200) {
    tend(s);
    if (s.choice) { dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id }); continue; }
    if (s.battle) { battle(s); continue; }
    if (s.place !== 'sunkenstreet') { go(s, 'sunkenstreet'); continue; }
    if (breath(s) < 6) { up(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  battle(s);
  assert.ok(wonOf(s) - won >= 2, '짝을 잡지 못했다');
  return turns - t0;
};

test('잠긴 도성: 혼자 내려가 짝을 잡아 보고, 용병 둘과 다시 잡고, 호위받으며 캐고, 메아리를 잠재운다 (M19)', () => {
  // 9장(잊힌 종)을 끝낸 레벨 64의 전사. (안개늪은 journey-marsh가 한다: 여기서는 9장을 끝낸 사람에서 시작한다)
  // 옛 청동 장비(7단계)는 손으로 채웠다: 청동 대장간에서 지은 것으로 친다. 비늘 가죽 장갑과 장화까지 차서 숨이 스물넷이다
  const s = rested('journey-sunken', { at: 'floatgate' });
  s.level = 64; s.stats.str += 14; s.stats.con += 12;
  for (const id of ['oldbronze_sword', 'oldbronze_shield', 'oldbronze_helm', 'oldbronze_armor', 'oldbronze_gloves', 'oldbronze_boots', 'oldbronze_ring']) wear(s, id);
  s.silver = 20000; s.hp = valueOf(s, 'maxHp');

  // 1. 뜬마을 나루에 "물길을 따라 내려간다"가 생겼다. 반나절을 내려가 지붕마을 선창에 닿는다. 마을에서는 숨 칸이 없다
  assert.equal(mainView(s).name, '늘 울리던 종');
  go(s, slotsNow(s).find((x) => x.label === '물길을 따라 내려간다').action.to);
  assert.ok(texts(s).includes(SUNKEN_FIRST[0]));
  assert.equal(bodyView(s).breath, null, '지붕마을에서는 네 칸이다');
  assert.equal(bodyView(s).curse, null, '저주 칸은 안개늪에서만');
  assert.ok(mapView(s).some((r) => r.name === '지붕마을' && r.here));

  // 2. 잠수꾼 조합에서 한별을 만나고 공기 주머니를, 물가 사당에서 깊은 성수를 산다. 뱃집 주막에서 비늘 찜을 찐다 (요리 7단계는 손으로 열었다: 늪 약탕을 끓인 사람)
  room(s, 'divers');
  assert.ok(texts(s).includes('아래에 상자가 많더라고 했다.'), '한별을 처음 만났다');
  buy(s, 'airbag', 6); buy(s, 'redpotion', 14); buy(s, 'riceball', 6); buy(s, 'jellycurd', 4); buy(s, 'herb', 8); buy(s, 'salt', 4);
  room(s, 'watershrine'); buy(s, 'deepholy', 3);
  room(s, 'boatinn');
  s.craftLv.cook = { lv: 26, xp: 0 }; s.craftTier.cook = 7;
  for (let i = 0; i < 4; i++) craft(s, 'cook_scalesteam');
  inn(s);

  // 3. 혼자 잠긴 거리로 내려간다. 숨 칸이 생긴다. 짝 하나를 잡는다: 하나를 쓰러뜨리면 둘째가 곧바로 덤빈다. 혼자서는 싸움이 길다(숨이 셋 아래로 내려가면 공기 주머니를 문다)
  room(s, 'roofgate'); go(s, 'sunkenstreet');
  assert.equal(bodyView(s).breath.max, 24);
  const aloneBags = bags;
  const alone = huntPair(s);
  assert.ok(texts(s).includes(SUNKEN_LINES.pair));
  const usedAlone = bags - aloneBags;
  up(s);
  assert.ok(texts(s).includes(SUNKEN_LINES.up));
  assert.equal(bodyView(s).breath, null);

  // 4. 근위 막사에서 창잡이 파랑과 방패잡이 너울을 구한다(하루 삯 250씩). 지금 용병 셋은 여기까지 따라오지 않는다
  room(s, 'guardpost');
  assert.deepEqual(mercView(s).map((m) => m.name), ['창잡이 파랑', '활잡이 이랑', '방패잡이 너울']);
  dispatch(s, { type: 'party', op: 'hire', id: 'parang' });
  dispatch(s, { type: 'party', op: 'hire', id: 'neoul' });
  assert.deepEqual(partyView(s).map((c) => c.name), ['창잡이 파랑', '방패잡이 너울']);
  restock(s); inn(s);

  // 5. 둘을 데리고 다시 내려가 짝을 잡는다. 싸움이 짧아진다: 파랑이 턴마다 함께 치고, 너울이 둘째를 붙잡아 절반으로 만든다
  room(s, 'roofgate'); go(s, 'sunkenstreet');
  const both = huntPair(s);
  assert.ok(texts(s).includes('너울이 방패로 둘째를 막아섰다. 둘째는 생명력 절반으로 덤빈다.'));
  assert.ok(both < alone, `용병 둘이면 한 짝이 짧다 (혼자 ${alone}턴 → 둘과 ${both}턴)`);
  assert.ok(usedAlone >= 0);

  // 6. 호위받는 채집: 캐는 동안 덤비는 것은 용병 둘이 맡는다. 나는 캐기만 한다. 숨이 닳으면 올라오고, 용병이 다치면 재운다
  let digs = 0;
  const bronze0 = countOf(s, 'oldbronze');
  while ((escorted < 2 || countOf(s, 'oldbronze') - bronze0 < 6) && digs++ < 300) {
    tend(s);
    if (s.battle) { battle(s); continue; }
    if (s.choice) { skip(s); continue; }
    if (s.place !== 'sunkenstreet') { if (late(s) || s.tired >= 45 || !escorts(s) || s.party.some((c) => c.hp < COMPANIONS[c.id].hp * 0.4)) { restock(s); inn(s); } room(s, 'roofgate'); go(s, 'sunkenstreet'); continue; }
    if (breath(s) < 5 || late(s) || s.tired >= 45 || !escorts(s) || s.party.some((c) => c.hp < COMPANIONS[c.id].hp * 0.4)) { up(s); continue; }
    if (dispatch(s, { type: 'act', id: 'dig' }).some((e) => e.type === 'escort')) escorted++;
  }
  assert.ok(escorted >= 2, '호위 싸움이 났다');
  assert.ok(texts(s).includes(SUNKEN_LINES.escortFirst) || s.flags.sawEscort);
  assert.ok(countOf(s, 'oldbronze') - bronze0 >= 6, '청동을 캤다');
  assert.equal(s.falls, 0);

  // 7. 10장 잠재우는 길: 잠긴 궁으로 들어간다 (레벨은 손으로 올렸다: 메아리는 70이다. 물약과 공기 주머니, 은화도 손으로 채웠다)
  if (s.place !== 'roofgate') up(s);
  s.level = 70; s.stats.str += 9; s.stats.con += 8; s.silver += 10000;
  room(s, 'divers'); buy(s, 'redpotion', Math.max(0, 24 - countOf(s, 'redpotion'))); buy(s, 'airbag', Math.max(0, 16 - countOf(s, 'airbag')));
  room(s, 'watershrine'); buy(s, 'deepholy', Math.max(0, 3 - countOf(s, 'deepholy')));
  inn(s);
  s.hp = valueOf(s, 'maxHp');
  room(s, 'roofgate'); go(s, 'palaceyard');
  tend(s);
  dispatch(s, slotsNow(s).find((x) => x.label === '궁으로 들어간다').action);
  const air = () => { while (!s.battle && !s.choice && breath(s) < 10 && has(s, 'airbag') >= 0) { bags++; dispatch(s, { type: 'airbag' }); } };
  for (const id of ['s1-post', 's2-hall', 's2-store', 's2-hall', 's2-air', 's2-hall', 's2-post', 's3-post', 's4-door', 's4-post', 's5-post', 's5-bell']) {
    air();
    if (s.hp < valueOf(s, 'maxHp') * 0.7 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    if (id === 's2-air') dispatch(s, { type: 'dungeon', op: 'rest' });
    // 근위병 앞에서는 먼저 교대를 알려 본다. 통하지 않으면 싸운다
    if (s.choice?.kind === 'post') dispatch(s, { type: 'choose', id: 'relieve' });
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    battle(s);
    assert.equal(s.dungeon?.room, id);
  }
  assert.equal(s.dmem.sunkenpalace.keeper, 'beat');
  assert.equal(s.main.chapter, 11);
  assert.equal(s.main.called, '메아리를 잠재운 이');
  assert.ok(texts(s).includes(MAIN[10].paths[0].done));
  assert.ok(s.opened.includes('cloudroad'));
  assert.ok(!mainView(s).text.includes(CLOUD_ROAD_SAY), '구름다리가 났으니(M20) 덧말은 걷혔다');
  assert.equal(mainView(s).name, MAIN[11].name);
  assert.equal(chestsOpened(s), 0, '상자는 하나도 열지 않았다');

  // 8. 전각을 되짚어 문지방으로 나와 물 위로 올라온다. 히든 "받지 않은 사람"이 나타난다. 한별에게 빈 상자를 보여 준다
  for (const id of ['s5-post', 's4-post', 's4-door', 's3-post', 's2-post', 's2-hall', 's1-post', 's1-gate']) { air(); dispatch(s, { type: 'room', to: id }); if (s.choice?.kind === 'post') dispatch(s, { type: 'choose', id: 'relieve' }); battle(s); }
  dispatch(s, slotsNow(s).find((x) => x.label === '숨 쉬기').action);
  assert.equal(s.place, 'roofgate');
  assert.equal(s.choice?.kind, 'hq');
  dispatch(s, { type: 'choose', id: 'accept' });
  room(s, 'divers');
  dispatch(s, { type: 'greet', npc: 'hanbyeol' });
  if (s.hq.ungifted.status !== 'done') talkTo(s, 'hanbyeol');
  assert.equal(hiddenView(s).find((h) => h.id === 'ungifted').status, 'done');
  assert.ok(texts(s).includes(HIDDENS.ungifted.done));
  assert.equal(s.falls, 0);

  // 9. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
  // 잰 것: 혼자 한 짝과 용병 둘과의 한 짝에 든 턴(roadmap.md M19 아래에 적는다)
  console.log(`  잠긴 도성 여정: 혼자 한 짝 ${alone}턴(공기 주머니 ${usedAlone}개), 용병 둘과 한 짝 ${both}턴, 호위 싸움 ${escorted}번, 여정 동안 문 공기 주머니 ${bags}개`);
});

test('잠긴 도성: 처음 온 사람에게는 잠긴 도성도 숨 칸도 구간 용병도 호위받는 채집도 없다 (JD-F)', () => {
  const s = rested('journey-sunken-fresh', { at: 'floatgate' });
  s.opened = s.opened.filter((id) => id !== 'sunkenroad');
  s.main.done = s.main.done.filter((d) => d.chapter !== 9); s.main.chapter = 9;
  assert.ok(!slotsNow(s).some((x) => x.label === '물길을 따라 내려간다'));
  assert.ok(!JSON.stringify(mapView(s)).match(/지붕마을|잠긴 거리|잠긴 궁/));
  assert.equal(bodyView(s).breath, null);
  assert.ok(!JSON.stringify(slotsNow(s)).match(/숨 쉬기|공기 주머니|호위/));
  s.place = 'floatinn';
  assert.ok(!JSON.stringify(mercView(s)).match(/파랑|너울|이랑/));
});
