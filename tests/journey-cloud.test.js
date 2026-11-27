// 여정 테스트: 구름다리 (로드맵 M20-9). 10장을 끝낸 사람이 지붕마을에서 산길로 올라 다릿목에 닿고, 문 앞에서 고요와 새벽을 만나고,
// 염소치기 움막에서 용병 둘을 구해 벼랑길에서 깃발을 보고 싸우고, 한 사람을 북 치는 마루로 바꿔 다시 싸우고,
// 다리 장터에서 상단 깃발을 사 짐을 보내고(쉬는 동안에는 가지 않는다), 새벽과 염소 쉰 번을 치는 동안 짐이 닿고,
// 하늘 신전의 다섯 전을 지나 대사제를 쓰러뜨려 11장을 끝내고, 셋째 동료를 들인다.
// 싸움은 실제 규칙으로 한다(모아 치기는 막고, 생명력이 45% 아래면 물약). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quieted } from './_sunken.js';
import { dispatch, slotsNow, mapView, bodyView, enemyView, CLOUD_FIRST, SAVE_VERSION } from '../src/core/game.js';
import { mainView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { foodBuff, graceBuff } from '../src/core/buffs.js';
import { countOf } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { mercView, mercSeats } from '../src/core/party.js';
import { caravanView } from '../src/core/caravan.js';
import { mailView } from '../src/core/mail.js';
import { windNext, windNow, WINDS, CLOUD_LINES } from '../src/core/cloud.js';
import { partyMax } from '../src/data/companions.js';
import { ITEMS } from '../src/data/items.js';
import { MAIN, GOYO_FIRST, POND_ROAD_SAY, PRIEST_LINES } from '../src/data/quests.js';
import { talkTo } from './_time.js';

const wear = (s, id) => { const d = ITEMS[id]; const slot = d.slot === 'ring' ? (s.equip.ring1 ? 'ring2' : 'ring1') : d.slot; s.equip[slot] = { id, grade: 0, n: 1, dur: d.dur, max: d.dur }; };
const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
let turns = 0;
/** 실제 규칙으로 한 턴: 모아 치기는 막고, 아프면 물약을 마시고, 아니면 친다. */
const turn = (s) => {
  const max = valueOf(s, 'maxHp');
  turns++;
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  // 우두머리 앞에서는 넉넉히 남긴다(한 대가 크다)
  if (s.hp < max * (enemyView(s).boss || s.battle.mon === 'bellpriest' ? 0.65 : 0.45) && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon, at = s.dungeon?.room || s.place; let n = 0; while (s.battle && n++ < 600) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${at}의 ${foe}, 물약 ${countOf(s, 'redpotion')}병)`); };
/** 싸움 사이: 배가 고프면 먹고, 다쳤으면 물약을 마시고, 죽과 성수의 힘이 다하면 다시 든다. */
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if (!foodBuff(s) && has(s, 'dish_goatporridge') >= 0) dispatch(s, { type: 'use', index: has(s, 'dish_goatporridge') });
  if (!graceBuff(s) && has(s, 'deepholy') >= 0) dispatch(s, { type: 'use', index: has(s, 'deepholy') });
};
const skip = (s) => { if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); };
/** 길을 간다. 덮치면 싸우고, 기척은 물러난다. */
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) skip(s); else dispatch(s, { type: 'travel', to }); } battle(s); skip(s); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 순례자 숙소에서 방을 빌려 잔다(용병도 낫는다). 밤에 깨면 한 번 더 자서 아침에 나선다. */
const inn = (s) => { room(s, 'pilgriminn'); dispatch(s, { type: 'act', id: 'room' }); if (s.phase === 2) dispatch(s, { type: 'act', id: 'room' }); };
const late = (s) => s.phase === 2 || (s.phase === 1 && s.tick >= 20);
const restock = (s) => { room(s, 'bridgemarket'); buy(s, 'redpotion', Math.max(0, 16 - countOf(s, 'redpotion'))); buy(s, 'deepholy', Math.max(0, 2 - countOf(s, 'deepholy'))); buy(s, 'riceball', Math.max(0, 4 - countOf(s, 'riceball'))); };
const wonOf = (s) => ['cloudgoat', 'windknot', 'stonemonk', 'goldmask'].reduce((a, id) => a + (s.dex.mon[id]?.won || 0), 0);
/** 벼랑길에서 n마리를 잡는다(탐색하다 만나면 덮친다). 해가 지거나 지치면 내려가 자고 온다. @returns 한 마리에 든 턴 */
const hunt = (s, n) => {
  const won = wonOf(s), t0 = turns;
  let guard = 0;
  while (wonOf(s) - won < n && guard++ < 400) {
    tend(s);
    if (s.battle) { battle(s); continue; }
    if (s.choice) { if (s.choice.kind === 'sense') dispatch(s, { type: 'choose', id: 'pounce' }); else skip(s); continue; }
    if (s.place !== 'cliffroad') { room(s, 'bridgegate'); go(s, 'cliffroad'); continue; }
    if (late(s) || s.tired >= 45) { go(s, 'bridgegate'); restock(s); inn(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
  }
  battle(s);
  assert.ok(wonOf(s) - won >= n, '사냥감을 잡았다');
  return Math.round(((turns - t0) / (wonOf(s) - won)) * 10) / 10;
};

test('구름다리: 산길로 올라, 깃발을 보고 바람 속에서 싸우고, 북 치는 이를 들이고, 상단으로 짐을 보내고, 대사제를 쓰러뜨려 셋째 동료를 들인다 (M20)', () => {
  // 1. 10장을 끝낸 사람이 지붕마을 선창에 서 있다 (레벨·스탯·장비·은화는 손으로 넣었다: 구름다리의 제 레벨 사람, 구름은 한 벌)
  const s = quieted('journey-cloud', { at: 'roofgate' });
  s.level = 74; s.stats.str += 15; s.stats.con += 12; s.silver = 30000;
  s.sunken.boxes = { sunkenstreet: 1 }; // 상자를 하나 열어 본 사람(잠긴 도성의 히든이 끼어들지 않게)
  for (const id of ['cloudsilver_sword', 'cloudsilver_helm', 'cloudsilver_armor', 'cloudsilver_gloves', 'cloudsilver_boots']) wear(s, id);
  for (const [id, n] of [['redpotion', 16], ['dish_goatporridge', 6], ['deepholy', 2], ['riceball', 4]]) s.bag.push({ id, grade: 0, n });
  s.hp = valueOf(s, 'maxHp');
  s.dex.places.roofgate = true; // 지금 서 있는 곳이다
  assert.ok(!JSON.stringify(mapView(s)).includes('구름다리'));
  assert.equal(mapView(s).find((r) => r.id === 'bridgegate').name, '다릿목');

  // 2. 산길로 오른다. 하루 길이다. 다리에 오를 때의 글이 뜬다
  const t0 = s.day * 150 + s.phase * 50 + s.tick;
  dispatch(s, slotsNow(s).find((x) => x.label === '산길로 오른다').action);
  battle(s); skip(s);
  if (s.place !== 'bridgegate') go(s, 'bridgegate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - t0 >= 50);
  assert.ok(texts(s).includes(CLOUD_FIRST[0]));
  assert.equal(bodyView(s).wind, null, '다릿목에서는 바람 칸이 없다');

  // 3. 신전 문 앞에서 고요와 새벽을 만난다. 11장의 셋째 길은 아직 "???"다(미루를 들인 적이 없다)
  room(s, 'templedoor');
  for (const [, text] of GOYO_FIRST) assert.ok(texts(s).includes(text));
  assert.deepEqual(mainView(s).paths.map((p) => p.name), ['쓰러뜨리는 길', '스스로 듣는 길', '???']);

  // 4. 염소치기 움막에서 용병 둘(창잡이 서리, 방패잡이 바위)을 구한다. 일행은 둘까지다
  room(s, 'goathut');
  assert.deepEqual(mercView(s).map((m) => m.name), ['북 치는 마루', '창잡이 서리', '활잡이 수리', '방패잡이 바위']);
  dispatch(s, { type: 'party', op: 'hire', id: 'seori' });
  dispatch(s, { type: 'party', op: 'hire', id: 'bawi' });
  assert.equal(mercSeats(s).note, '마루를 들이려면 한 사람을 보내야 한다.');

  // 5. 벼랑길: 깃발을 보고 다음 바람을 안다. 바람 속에서 구름 염소와 바람 매듭을 잡는다
  room(s, 'bridgegate'); go(s, 'cliffroad');
  assert.ok(bodyView(s).wind && Object.values(WINDS).some((w) => w.name === bodyView(s).wind.name));
  const next = windNext(s);
  dispatch(s, { type: 'act', id: 'flag' });
  assert.equal(s.log.at(-1).text, `${CLOUD_LINES.flag} ${next.when}은 ${next.wind.name}이다.`);
  const two = hunt(s, 4);
  assert.equal(s.falls, 0);

  // 6. 바위를 보내고 북 치는 마루를 들인다. 북소리가 울린다. 다시 잡는다
  if (s.place !== 'bridgegate') go(s, 'bridgegate');
  room(s, 'goathut');
  dispatch(s, { type: 'party', op: 'dismiss', id: 'bawi' });
  dispatch(s, { type: 'party', op: 'hire', id: 'drummaru' });
  assert.deepEqual(bodyView(s).drum.text, '공격력·방어력 +10%');
  room(s, 'bridgegate'); go(s, 'cliffroad');
  const drum = hunt(s, 4);
  assert.ok(!texts(s).match(/마루[가이] (쳤다|앞을 막아섰다)/), '마루는 싸우지도 맞지도 않는다');

  // 7. 다리 장터: 장터 어른에게 값을 듣고 상단 깃발을 산다 (은화는 손으로 채웠다: 깃발은 이 구간 열이틀 벌이다)
  if (s.place !== 'bridgegate') go(s, 'bridgegate');
  room(s, 'bridgemarket');
  assert.ok(!slotsNow(s).some((x) => x.label === '상단' || x.label.startsWith('깃발 사기')));
  talkTo(s, 'marketelder');
  s.silver += 45000;
  dispatch(s, slotsNow(s).find((x) => x.label.startsWith('깃발 사기')).action);
  assert.ok(slotsNow(s).some((x) => x.label === '상단'));
  // 사냥에서 얻은 것을 서리의 호위를 붙여 지붕마을로 보낸다
  const picks = s.bag.map((it, index) => ({ it, index })).filter((x) => ['goatwool', 'goatmeat', 'cloudsilver'].includes(x.it.id)).map((x) => ({ from: 'bag', index: x.index, n: Math.min(x.it.n, x.it.id === 'goatwool' ? 20 : 15) }));
  assert.ok(picks.length > 0, '보낼 것이 있다');
  dispatch(s, { type: 'caravan', op: 'send', to: 7, picks, escort: 'seori' });
  assert.deepEqual(s.party.map((c) => c.id), ['drummaru'], '호위는 닿을 때까지 곁에 없다');
  assert.equal(caravanView(s).load.left, 30);
  // 자는 동안에는 가지 않는다
  inn(s); inn(s);
  assert.equal(caravanView(s).load.left, 30, '쉬거나 자는 동안에는 짐이 가지 않는다');

  // 8. 서브 "견습 사제의 의심": 새벽과 염소 쉰 번을 친다. 그 서른 번째에 짐이 지붕마을에 닿는다(아니면 길에서 잃는다)
  room(s, 'templedoor');
  talkTo(s, 'novice');
  dispatch(s, { type: 'quest', op: 'accept', id: 'novicedoubt' });
  room(s, 'goathut');
  const mails = mailView(s).length;
  for (let i = 0; i < 50; i++) {
    if (late(s) || s.tired >= 60) { inn(s); room(s, 'goathut'); }
    tend(s);
    dispatch(s, slotsNow(s).find((x) => x.label === '염소 치기').action);
    if (i === 28) assert.equal(caravanView(s).load.left, 1);
  }
  assert.ok(texts(s).includes(PRIEST_LINES.herdDone));
  assert.equal(s.caravan.load, null);
  const past = caravanView(s).past[0];
  assert.equal(past.to, '지붕마을');
  if (!past.lost) {
    assert.equal(mailView(s).length, mails + 1);
    const silver = s.silver;
    dispatch(s, { type: 'mail', op: 'take', id: mailView(s)[0].id });
    assert.equal(s.silver, silver + past.silver);
  }
  assert.ok(s.party.some((c) => c.id === 'seori'), '서리가 돌아왔다');
  room(s, 'templedoor');
  dispatch(s, { type: 'quest', op: 'choose', id: 'novicedoubt', choice: 'done' });
  assert.ok(s.quests.novicedoubt.done);

  // 9. 11장 쓰러뜨리는 길: 하늘 신전으로 들어간다 (레벨은 손으로 올렸다: 대사제는 80이다. 물약과 은화도 손으로 채웠다)
  s.level = 80; s.stats.str += 9; s.stats.con += 8; s.silver += 10000;
  room(s, 'bridgemarket'); buy(s, 'redpotion', Math.max(0, 30 - countOf(s, 'redpotion'))); buy(s, 'deepholy', Math.max(0, 3 - countOf(s, 'deepholy')));
  inn(s);
  s.hp = valueOf(s, 'maxHp');
  room(s, 'bridgegate'); go(s, 'templeyard');
  assert.ok(bodyView(s).wind, '뜰에는 바람이 분다');
  tend(s);
  dispatch(s, slotsNow(s).find((x) => x.label === '신전으로 들어간다').action);
  assert.equal(bodyView(s).wind, null, '신전 안에서는 바람이 불지 않는다');
  assert.equal(windNow(s), null);
  for (const id of ['t1-hall', 't2-incense', 't2-store', 't2-incense', 't2-cell', 't2-incense', 't3-scripture', 't4-door', 't4-masks', 't5-bell']) {
    if (s.hp < valueOf(s, 'maxHp') * 0.7 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
    dispatch(s, { type: 'room', to: id });
    if (id === 't2-cell') dispatch(s, { type: 'dungeon', op: 'rest' });
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    battle(s);
    assert.equal(s.dungeon?.room, id);
  }
  assert.equal(s.dmem.skytemple.keeper, 'beat');
  assert.equal(s.main.chapter, 12);
  assert.equal(s.main.called, '가면을 벗긴 이');
  assert.ok(texts(s).includes(MAIN[11].paths[0].done));
  assert.ok(s.opened.includes('pondroad'));
  assert.equal(mainView(s).name, '깨진 종'); // 별못이 났다 (M21): 퀘스트 창에 12장이 온다
  assert.ok(!mainView(s).text.includes(POND_ROAD_SAY));

  // 10. 전을 되짚어 나와 움막으로 간다. 이제 동료가 셋이다: 방패잡이 바위를 다시 들인다
  for (const id of ['t4-masks', 't4-door', 't3-scripture', 't2-incense', 't1-hall', 't1-gap']) { dispatch(s, { type: 'room', to: id }); battle(s); }
  dispatch(s, { type: 'dungeon', op: 'leave' });
  go(s, 'bridgegate'); room(s, 'goathut');
  assert.equal(partyMax(s), 3);
  assert.deepEqual([mercSeats(s).n, mercSeats(s).max], [2, 3]);
  dispatch(s, { type: 'party', op: 'hire', id: 'bawi' });
  assert.deepEqual(s.party.map((c) => c.id).sort(), ['bawi', 'drummaru', 'seori']);
  assert.equal(s.falls, 0);

  // 11. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
  // 잰 것: 용병 둘과, 용병 하나에 북 치는 이와 한 마리에 든 턴(roadmap.md M20 아래에 적는다)
  console.log(`  구름다리 여정: 벼랑길 한 마리에 용병 둘과 ${two}턴, 용병 하나에 북 치는 이와 ${drum}턴, 짐은 ${past.lost ? '길에서 잃음' : `은화 ${past.silver}에 팔림`}`);
});

test('구름다리: 처음 온 사람에게는 구름다리도 바람 칸도 북 치는 이도 상단도 셋째 자리도 없다 (GD-G)', () => {
  const s = quieted('journey-cloud-fresh', { at: 'roofgate' });
  s.opened = s.opened.filter((id) => id !== 'cloudroad');
  s.main.done = s.main.done.filter((d) => d.chapter !== 10); s.main.chapter = 10;
  assert.ok(!slotsNow(s).some((x) => x.label === '산길로 오른다'));
  assert.ok(!JSON.stringify(mapView(s)).match(/다릿목|벼랑길|신전 뜰/));
  assert.equal(bodyView(s).wind, null);
  assert.equal(bodyView(s).drum, null);
  assert.equal(caravanView(s), null);
  assert.equal(partyMax(s), 2);
  assert.ok(!JSON.stringify(slotsNow(s)).match(/깃발|상단|염소|문 앞에 선다/));
  s.place = 'guardpost';
  assert.ok(!JSON.stringify(mercView(s)).match(/마루|서리|바위|북/));
  assert.equal(mercSeats(s), null);
});
