// 여정 (M4-14): 덕수 4·5·6, 서진 5·6, 하람 6·8, 소은 1·2단계.
// 사람이 하듯 한 번에 하나씩 누른다. 상태를 손으로 고치는 곳은 그 까닭을 적는다.
import { passPhase, talkTo } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, enemyView } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { bondName, bondOf, fameOf, titleView, helloOf } from '../src/core/social.js';
import { boardView, jobsView, offersOf, subView, mainView, hiddenView } from '../src/core/quests.js';
import { buyPrice } from '../src/core/trade.js';
import { valueOf } from '../src/core/derived.js';

const go = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const feed = (s) => { s.full = 80; };

/** 예고가 돌진류면 막고 아니면 친다. */
function fight(s) {
  let n = 0;
  while (s.battle && n++ < 300) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' });
}
/** 길을 나선다. 습격당하면 싸우고 다시 간다. */
function travel(s, to) {
  let n = 0;
  while (s.place !== to && n++ < 20) { if (s.battle) fight(s); else if (s.place === 'temple') go(s, 'plaza'); else if (!mapView(s).find((r) => r.id === to)?.here) dispatch(s, { type: 'travel', to }); }
  fight(s);
  assert.equal(s.place, to);
}

test('덕수 4·5·6: 생선을 선물해 낯익은 사이가 되고, 의뢰를 끝내고, 낚싯대를 돌려주고 칭호를 단다', () => {
  const s = createGame({ name: '덕수', origin: 'farmer', spent: { con: 3, str: 2 }, seed: 'deoksu-4' });
  go(s, 'training'); // 목검을 받는다
  s.level = 6; s.stats.str += 8; s.stats.con += 8; s.hp = valueOf(s, 'maxHp'); // 숲을 다닐 만큼 큰 뒤라고 친다
  s.main.done.push({ chapter: 1, path: 'fight', day: 1 }); s.main.chapter = 2; s.main.called = '싸움꾼'; // 1장은 이미 끝났다

  // 4단계: 낚시해서 얻은 붕어를 잡화점 할머니에게 선물한다
  travel(s, 'river');
  let n = 0;
  while (countOf(s, 'crucian') < 2 && n++ < 60) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'fish' }); feed(s); }
  assert.ok(countOf(s, 'crucian') >= 2);
  travel(s, 'plaza');
  go(s, 'store');
  s.silver = 60;
  const full = buyPrice(s, 'redpotion').now;
  dispatch(s, { type: 'greet', npc: 'granny' });
  dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'crucian') });
  assert.equal(bondName(s, 'granny'), '낯익은 사이');
  const cut = buyPrice(s, 'redpotion');
  assert.ok(cut.now < full && cut.base === full, '값에 줄이 그어지고 깎인다');
  dispatch(s, { type: 'buy', id: 'redpotion' });
  assert.equal(s.silver, 60 - cut.now);

  // 5단계: 게시판에서 "멧돼지 가죽 3장"을 받아 끝낸다
  go(s, 'plaza');
  n = 0;
  while (!boardView(s).some((c) => c.id === 'hide3') && n++ < 40) { passPhase(s); feed(s); }
  assert.equal(boardView(s).find((c) => c.id === 'hide3').rank, 'E');
  dispatch(s, { type: 'job', op: 'accept', id: 'hide3' });
  travel(s, 'forest');
  n = 0;
  while (countOf(s, 'boarhide') < 3 && n++ < 600) {
    if (s.battle) fight(s);
    else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s)[0].action.id });
    else dispatch(s, { type: 'act', id: 'explore' });
    feed(s); s.hp = valueOf(s, 'maxHp'); // 물약과 쉬기를 줄여 적는다
    if (s.place !== 'forest') { travel(s, 'forest'); }
    for (const j of s.jobs) j.due = s.day + 3; // 가죽이 모일 때까지 기한을 다시 받았다고 친다
  }
  assert.ok(countOf(s, 'boarhide') >= 3);
  travel(s, 'plaza');
  assert.ok(jobsView(s)[0].ready);
  const before = { silver: s.silver, fame: fameOf(s), xp: s.xp, level: s.level };
  dispatch(s, { type: 'job', op: 'finish', id: 'hide3' });
  assert.equal(s.silver, before.silver + 34);
  assert.equal(fameOf(s), before.fame + 3);
  assert.ok(s.xp !== before.xp || s.level > before.level);

  // 6단계: 할머니가 "할머니의 낚싯대"를 준다. 갈림 셋을 미리 보고 돌려준다. 칭호를 단다
  go(s, 'store');
  assert.deepEqual(offersOf(s, 'granny'), ['rod']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'rod' });
  assert.equal(subView(s, 'rod').ends.length, 3);
  travel(s, 'river');
  n = 0;
  while (countOf(s, 'oldrod') < 1 && n++ < 400) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'fish' }); feed(s); if (s.phase === 0) { s.phase = 1; } }
  assert.equal(countOf(s, 'oldrod'), 1);
  travel(s, 'plaza');
  go(s, 'store');
  dispatch(s, { type: 'quest', op: 'choose', id: 'rod', choice: 'return' });
  assert.equal(titleView(s).find((t) => t.got).name, '마을의 단골');
  const p0 = buyPrice(s, 'redpotion').now;
  dispatch(s, { type: 'title', id: 'regular' });
  assert.ok(buyPrice(s, 'redpotion').now < p0);
});

test('서진 5·6: 300번 친 뒤 교관에게 말을 걸자 히든 퀘스트가 뜨고, 숲에서 멧돼지를 잡는다', () => {
  const s = createGame({ name: '서진', origin: 'smithboy', spent: { str: 3, con: 2 }, seed: 'seojin-5' });
  go(s, 'training');
  for (let i = 0; i < 300; i++) dispatch(s, { type: 'act', id: 'strike' });
  s.bag.forEach((x, i) => { if (x.id === 'riceball') dispatch(s, { type: 'use', index: i }); });
  const hello0 = helloOf(s, 'instructor');
  const ev = dispatch(s, { type: 'greet', npc: 'instructor' });
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'hiddenquest');
  assert.ok(d, '가장 큰 띠링이 뜬다');
  assert.equal(d.ding.level, 4);
  assert.ok(d.ding.title.includes('교관의 부탁'));
  assert.ok(d.ding.reason, '찾은 까닭이 적혀 있다');
  assert.ok(ev.some((e) => e.type === 'line' && e.line.text.includes('이런 녀석은 처음 본다')));
  assert.ok(hello0);
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(hiddenView(s)[0].status, 'active');
  // 6단계: 서쪽 숲에서 기척 창이 뜨면 먼저 덮쳐 멧돼지를 잡는다
  s.level = 6; s.stats.str += 8; s.stats.con += 8; s.hp = valueOf(s, 'maxHp'); feed(s); // 멧돼지를 잡을 만큼 큰 뒤라고 친다
  travel(s, 'forest');
  let n = 0, pounced = false;
  while ((s.hq.favor.step === 'boar' || !pounced) && n++ < 3000) {
    if (s.battle) fight(s);
    else if (s.choice?.kind === 'sense') { pounced = true; dispatch(s, { type: 'choose', id: 'pounce' }); }
    else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
    else dispatch(s, { type: 'act', id: 'explore' });
    feed(s); s.hp = valueOf(s, 'maxHp');
    if (s.place !== 'forest') travel(s, 'forest');
  }
  assert.equal(s.hq.favor.step, 'back');
  assert.ok(pounced, '기척 창에서 먼저 덮친 적이 있다');
  assert.ok(s.dex.mon.boar.won >= 1);
});

test('하람 6·8: 폐허 입구에서 갇힌 이를 풀어 주자 명성이 오르고, 얻은 칭호를 달면 판정이 달라진다', async () => {
  const { checkChance } = await import('../src/core/social.js');
  const s = createGame({ name: '하람', origin: 'smithboy', spent: { agi: 5 }, seed: 'haram-6' });
  go(s, 'training');
  assert.throws(() => dispatch(s, { type: 'travel', to: 'ruins' }), /길을 모릅니다/);
  s.jobsDone = 9; s.jobs.push({ id: 'herb5', have: 0, due: 99 }); addItem(s, 'herb', 5); // 의뢰 아홉을 끝낸 뒤
  go(s, 'plaza');
  dispatch(s, { type: 'job', op: 'finish', id: 'herb5' });
  assert.equal(s.main.called, '일꾼');
  s.level = 8; s.stats.str += 10; s.stats.con += 10; s.hp = valueOf(s, 'maxHp'); // 폐허까지 갈 만큼 큰 뒤
  addItem(s, 'oakbranch', 3);
  travel(s, 'ruins');
  assert.deepEqual(offersOf(s, 'trapped'), ['trapped']);
  dispatch(s, { type: 'greet', npc: 'trapped' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'trapped' });
  const fame = fameOf(s);
  const view = subView(s, 'trapped');
  assert.equal(view.step.choices.length, 4);
  dispatch(s, { type: 'quest', op: 'choose', id: 'trapped', choice: 'lever' });
  assert.equal(fameOf(s), fame + 10);
  assert.ok(s.titles.some((t) => t.id === 'helper'));
  // 8단계: 마을로 돌아와 칭호를 단다. 설득이 쉬워진다
  travel(s, 'plaza');
  const p0 = checkChance(s, 'persuade', 'keeper');
  dispatch(s, { type: 'title', id: 'helper' });
  assert.ok(checkChance(s, 'persuade', 'keeper') > p0);
  go(s, 'tavern');
  assert.ok(helloOf(s, 'keeper'));
});

test('소은 1·2: 사귀는 길로 1장을 끝내고, 낚싯대를 세 번째 길로 맺어 새벽 강에서 히든 퀘스트를 찾는다', () => {
  const s = createGame({ name: '소은', origin: 'bard', spent: { agi: 3, con: 2 }, seed: 'soeun-1' });
  const v = mainView(s);
  assert.equal(v.name, '이름 없는 자');
  assert.equal(v.paths.length, 5);
  // 사람 셋과 단골: 날마다 이야기를 듣고, 좋아하는 것을 건넨다(선물은 주운 것이라고 친다)
  const gifts = { granny: 'crucian', keeper: 'boarmeat', smith: 'copperore' };
  const places = { granny: 'store', keeper: 'tavern', smith: 'forge' };
  let day = 0;
  while (s.main.chapter === 1 && day++ < 30) {
    for (const id of Object.keys(gifts)) {
      if (bondOf(s, id) >= 2) continue;
      go(s, places[id]);
      dispatch(s, { type: 'greet', npc: id });
      talkTo(s, id);
      addItem(s, gifts[id], 1);
      dispatch(s, { type: 'gift', npc: id, index: s.bag.findIndex((x) => x.id === gifts[id]) });
      if (s.main.chapter !== 1) break;
    }
    if (s.main.chapter === 1 && mainView(s).nearest) assert.ok(['friend', 'fight'].includes(mainView(s).nearest.id));
    feed(s);
    // 선물은 한 사람에게 하루 한 번이다. 하루를 보낸다
    if (s.main.chapter === 1) { go(s, 'tavern'); for (let i = 0; i < 3; i++) passPhase(s); feed(s); }
  }
  assert.equal(s.main.done[0].path, 'friend');
  assert.equal(s.main.called, '이웃');
  assert.ok(!mapView(s).find((r) => r.id === 'ruins').locked, '지도에 새 길이 난다');
  // 2단계: 낚싯대를 고쳐서 돌려주고, 아침 강에 선다
  go(s, 'store');
  dispatch(s, { type: 'quest', op: 'accept', id: 'rod' });
  go(s, 'training');
  s.level = 6; s.stats.str += 8; s.stats.con += 8; s.hp = valueOf(s, 'maxHp'); // 강가를 다닐 만큼 큰 뒤
  travel(s, 'river');
  let n = 0;
  while ((countOf(s, 'oldrod') < 1 || (s.skills.fishing?.grade || 0) < 4) && n++ < 2000) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'fish' }); feed(s); }
  assert.ok((s.skills.fishing?.grade || 0) >= 4, '낚시가 초급 5가 될 때까지 던졌다');
  addItem(s, 'oakbranch', 2);
  travel(s, 'plaza');
  go(s, 'store');
  dispatch(s, { type: 'quest', op: 'choose', id: 'rod', choice: 'mend' });
  travel(s, 'river');
  n = 0;
  let found = null;
  while (!found && n++ < 400) {
    if (s.battle) { fight(s); continue; }
    if (s.choice && s.choice.kind !== 'hq') { dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); continue; }
    const ev = dispatch(s, { type: 'act', id: 'fish' });
    found = ev.find((e) => e.type === 'ding' && e.ding.kind === 'hiddenquest') || null;
    if (found) assert.equal(ev.find((e) => e.type === 'gather').phase, 0, '아침이었다');
    feed(s);
  }
  assert.ok(found.ding.title.includes('강바닥의 낚시꾼'));
  assert.equal(s.choice.kind, 'hq');
});
