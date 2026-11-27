// 여정 테스트: 처음 모루 (로드맵 M22-10). 12장을 끝낸 사람이 맞울에서 이틀 길을 올라 야영지에 닿고,
// 일곱 천막에서 제가 푼 길의 사람들을 만나 셋(방패 · 창 · 곁에서 보는 이)과 함께 쇳물 골에서 벼리며 싸우고,
// 레벨 95에 모루 앞에서 망치를 들어 지어지지 않은 종을 끝까지 짓고(지치면 내려와 자고 다시 오른다), 무엇을 새길지 고른다.
// 싸움은 실제 규칙으로 한다(큰 공격은 막고, 틈에는 두드리거나 친다. 피로와 포만감도 그대로 돈다). 손으로 건너뛴 곳은 그 자리에 적어 둔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, slotsNow, mapView, bodyView, enemyView, townRooms, SAVE_VERSION } from '../src/core/game.js';
import { mainView } from '../src/core/quests.js';
import { choiceView } from '../src/core/explore.js';
import { valueOf } from '../src/core/derived.js';
import { countOf } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { peopleHere } from '../src/core/social.js';
import { mercView, fullPartyView, partyFees } from '../src/core/party.js';
import { afterView } from '../src/core/after.js';
import { usersInBand } from '../src/core/world.js';
import { ANVIL, ANVIL_LINES, ANVIL_ENDS } from '../src/data/anvil.js';
import { anviled, ironed } from './_anvil.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const has = (s, id) => s.bag.findIndex((x) => x.id === id);
const labels = (s) => slotsNow(s).map((x) => x.label);
const skip = (s) => { if (s.choice && s.choice.kind !== 'anvilend') dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); };
let turns = 0;
/** 실제 규칙으로 한 턴: 큰 공격은 막고, 아프면 물약을 마시고, 벼림이 넷이 될 때까지는 틈에 두드리고, 그 뒤로는 친다. */
const turn = (s, temperTo = 4) => {
  const max = valueOf(s, 'maxHp');
  turns++;
  if (enemyView(s).next?.kind === 'charge') return dispatch(s, { type: 'battle', choice: 'defend' });
  if (s.hp < max * 0.45 && has(s, 'redpotion') >= 0) return dispatch(s, { type: 'use', index: has(s, 'redpotion') });
  if ((s.battle.temper || 0) < temperTo) return dispatch(s, { type: 'battle', choice: 'hammer' });
  return dispatch(s, { type: 'battle', choice: 'attack' });
};
const battle = (s) => { const foe = s.battle?.mon; let n = 0; while (s.battle && n++ < 900) turn(s); assert.equal(s.falls, 0, `쓰러지지 않았다 (${foe}, 물약 ${countOf(s, 'redpotion')}병)`); };
const tend = (s) => {
  if (s.battle || s.choice) return;
  if (s.full < 40 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
  if (s.hp < valueOf(s, 'maxHp') * 0.6 && has(s, 'redpotion') >= 0) dispatch(s, { type: 'use', index: has(s, 'redpotion') });
};
const go = (s, to) => { let n = 0; while (s.place !== to && n++ < 30) { if (s.battle) battle(s); else if (s.choice) skip(s); else dispatch(s, { type: 'travel', to }); } battle(s); skip(s); battle(s); assert.equal(s.place, to); };
const room = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const buy = (s, id, n = 1) => { for (let i = 0; i < n; i++) dispatch(s, { type: 'buy', id }); };
/** 야영지에서 밤을 기다렸다 잔다(방을 빌릴 데가 없다). 아침에 일어난다. */
const camp = (s) => {
  room(s, 'anvilcamp');
  let g = 0;
  while (s.phase !== 2 && g++ < 200) { tend(s); dispatch(s, { type: 'act', id: 'look' }); }
  dispatch(s, { type: 'act', id: 'rest' });
  assert.equal(s.phase, 0, '자고 나면 아침이다');
};
/** 망치를 들고 짓는다: 큰 공격은 막고 틈에는 두드린다. 배가 고프면 먹는다. 피로가 75를 넘으면 망치를 내려놓고 내려온다. @returns 이번에 오른 턴 */
const climb = (s) => {
  room(s, 'anvilfront');
  dispatch(s, { type: 'lifthammer' });
  let n = 0;
  while (s.battle && n < 600) {
    n++; turns++;
    if (s.tired >= 75) { dispatch(s, { type: 'battle', choice: 'flee' }); break; }
    if (s.battle.intent === 'charge') dispatch(s, { type: 'battle', choice: 'defend' });
    else if (s.full < 30 && has(s, 'riceball') >= 0) dispatch(s, { type: 'use', index: has(s, 'riceball') });
    else dispatch(s, { type: 'battle', choice: 'hammer' });
  }
  return n;
};

test('여정: 맞울에서 올라 일곱 천막의 사람들과 벼리며 싸우고, 지어지지 않은 종을 끝까지 지어 다시 약속한다 (M22)', (t) => {
  // 12장까지 끝낸 사람. 일곱 장 가운데 넷을 끝까지 하거나 지어 내는 길로 풀었다(6~9장), 10장은 쓰러뜨렸고, 11·12장은 사람과 풀었다
  const s = ironed(anviled('journey-anvil', { at: 'echogate', kinds: 'hhhhfww', level: 91 })); // 첫쇠 한 벌은 손으로 입혔다(가마터에서 짓는 것은 M22의 테스트가 본다)
  delete s.flags.sawAnvil; delete s.flags.sawAnvilTop;
  s.silver = 90000; s.tired = 0; s.full = 80; s.phase = 0; s.tick = 0;
  s.bag.push({ id: 'redpotion', grade: 0, n: 30 }, { id: 'riceball', grade: 0, n: 12 });

  // 1. 맞울 어귀에서 이틀 길을 오른다
  assert.ok(labels(s).includes('처음 모루로 오른다'));
  assert.ok(JSON.stringify(mapView(s)).includes('모루 아래 야영지'));
  const day0 = s.day * 3 + s.phase;
  go(s, 'anvilcamp');
  assert.ok(s.day * 3 + s.phase - day0 >= 2, '이틀 길');
  assert.ok(texts(s).includes('모닥불 곁에 천막이 몇 채 서 있다.'));
  assert.deepEqual(townRooms(s).map((r) => r.name), ['모루 아래 야영지', '일곱 천막', '식은 가마터', '모루 앞']);
  assert.ok(usersInBand(s, 10) <= 2);

  // 2. 일곱 천막: 내가 푼 길의 사람들이 와 있다
  room(s, 'seventents');
  assert.deepEqual(peopleHere(s).map((p) => p.name), ['얼음 낚시터의 임자', '상단 대리인 유겸', '큰 대장간 주인', '약초꾼 수련', '창잡이 파랑', '미루', '마당지기 다온']);
  dispatch(s, { type: 'greet', npc: 'tent12w' });
  assert.ok(texts(s).includes('일곱 번 다 봤어. 네가 한 거.'));
  for (const id of ['tent6h', 'tent7h', 'tent12w']) dispatch(s, { type: 'party', op: 'hire', id });
  assert.equal(s.silver, 90000 - 3300);
  assert.deepEqual(fullPartyView(s).roles, '막는 사람 · 때리는 사람 · 북돋는 이');
  assert.deepEqual(partyFees(s), { n: 3, silver: 3300 });
  assert.equal(bodyView(s).drum.rate, 0.14);
  assert.equal(mercView(s).filter((m) => m.joined).length, 3);
  buy(s, 'redpotion', 10);

  // 3. 쇳물 골에서 벼리며 싸운다
  camp(s);
  go(s, 'meltgully');
  let won = 0, guard = 0, tempered = 0;
  while (won < 3 && guard++ < 200) {
    tend(s);
    if (s.battle) { const t = () => { if ((s.battle?.temper || 0) > tempered) tempered = s.battle.temper; }; let n = 0; while (s.battle && n++ < 900) { turn(s); t(); } assert.equal(s.falls, 0); won = (s.dex.mon.coldmelt?.won || 0) + (s.dex.mon.promiseshadow?.won || 0); continue; }
    if (s.choice) { skip(s); continue; }
    if (s.place !== 'meltgully') go(s, 'meltgully');
    dispatch(s, { type: 'act', id: 'explore' });
  }
  assert.ok(won >= 3, `쇳물 골에서 세 마리 (${won})`);
  assert.ok(tempered >= 4, `싸우는 틈에 벼렸다 (벼림 ${tempered})`);
  assert.ok(texts(s).includes('모루 조각에 대고 내리쳤다.'));
  assert.equal(s.battle, null);
  go(s, 'anvilcamp');

  // 4. 레벨 95 전에는 모루 앞에 망치를 들 칸이 없다
  room(s, 'anvilfront');
  assert.ok(texts(s).includes(ANVIL_LINES.first[0]), '모루에 처음 오를 때의 글');
  assert.deepEqual(labels(s), ['둘러보기', '기도']);
  s.level = 95; s.stats.str += 6; s.stats.con += 5; // 손으로 건너뜀: 91에서 95까지의 사냥(140마리쯤)
  assert.ok(labels(s).includes('망치를 든다'));

  // 5. 망치를 든다. 대장 레벨이 낮아도 한 번 올라 다 짓는다: 일행이 껍질을 깨 주고, 깨진 동안에는 망치질이 두 배로 먹는다 (M23-3. 앞서는 두 번 올라 230턴쯤이었다)
  let climbs = 0, t0 = turns;
  while (!s.anvil.built && climbs < 8) {
    camp(s);
    room(s, 'seventents'); buy(s, 'riceball', Math.max(0, 6 - countOf(s, 'riceball')));
    const before = s.anvil.left;
    climb(s);
    climbs++;
    assert.equal(s.falls, 0, `쓰러지지 않았다 (${climbs}번째 오름)`);
    if (!s.anvil.built) { assert.ok(s.anvil.left > Math.floor(before / 2), `오를 때마다 더 짓는다 (${before} → ${s.anvil.left})`); assert.ok(labels(s).includes('망치를 든다')); }
  }
  assert.equal(s.anvil.built, true, `종을 다 지었다 (${climbs}번 올라 ${turns - t0}턴)`);
  assert.equal(climbs, 1, '대장 레벨이 낮아도 한 번 올라 짓는다');
  assert.ok(turns - t0 <= 110, `두드리기만 해도 100턴 언저리에 끝난다 (${turns - t0}턴)`);
  t.diagnostic(`대장 레벨 1, 일행 셋: ${climbs}번 올라 ${turns - t0}턴에 종을 다 지었다`);
  assert.ok(texts(s).includes(ANVIL_LINES.done));

  // 6. 고른다: 넷을 손의 길로 풀어 "다시 약속한다"가 열려 있다. 나머지 둘은 "???"다
  assert.deepEqual(s.choice, { kind: 'anvilend' });
  assert.deepEqual(choiceView(s).options.map((o) => o.label), ['다시 약속한다', '???', '???', '내려간다', '아직 새기지 않는다']);
  const dingsBefore = s.dings.length;
  dispatch(s, { type: 'choose', id: 'again' });
  assert.ok(texts(s).includes(ANVIL_ENDS.again.say));
  assert.equal(s.anvil.end, 'again');
  assert.equal(s.main.called, '다시 약속한 이');
  assert.ok(s.dings.length >= dingsBefore + 2);
  assert.equal(mainView(s).name, '끝난 뒤: 다시 약속한다');
  assert.equal(afterView(s).rows.length, 6);
  assert.equal(afterView(s).rows[4].value, '1 / 5');
  assert.equal(s.falls, 0);

  // 7. 끝난 뒤에도 게임은 이어진다: 내려가 쇳물 골에서 한 번 더 싸운다. 띠링이 또렷하다
  room(s, 'anvilcamp');
  camp(s);
  assert.ok(!labels(s).includes('새긴다'));

  // 8. 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back.anvil, s.anvil);
  assert.deepEqual(mainView(back), mainView(s));
});

test('여정: 대장 레벨이 높은 사람은 한 번 올라 종을 끝까지 짓는다 (CM-D4)', (t) => {
  const s = ironed(anviled('journey-smith', { at: 'anvilcamp', kinds: 'fffhhww', level: 95 }));
  s.craftLv.smith = { lv: 34, xp: 0 }; // 손으로 건너뜀: 별쇠 검까지 지어 대장 10단계에 든 사람
  s.silver = 20000; s.tired = 0; s.full = 80; s.phase = 0; s.tick = 0;
  s.bag.push({ id: 'riceball', grade: 0, n: 8 });
  const t0 = turns;
  const n = climb(s);
  assert.equal(s.anvil.built, true, `한 번에 지었다 (${n}턴)`);
  assert.ok(turns - t0 <= 75, `대장 레벨이 높으면 더 빨리 끝난다 (${turns - t0}턴)`);
  t.diagnostic(`대장 레벨 34, 혼자: 한 번 올라 ${n}턴, 피로 ${Math.round(s.tired)}`);
  assert.equal(s.falls, 0);
  // 고루 푼 사람은 "내려간다"만 고를 수 있다
  assert.deepEqual(choiceView(s).options.filter((o) => !o.disabled).map((o) => o.label), ['내려간다', '아직 새기지 않는다']);
  dispatch(s, { type: 'choose', id: 'descend' });
  assert.equal(s.anvil.end, 'descend');
  assert.equal(s.anvil.tent, true);
  assert.equal(ANVIL.bell, 100);
});
