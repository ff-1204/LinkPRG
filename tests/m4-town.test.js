// M4: 사람과의 사이, 의뢰, 서브·히든·메인 퀘스트, 명성, 칭호, 대화 판정.
import { passPhase, talkTo } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { bondOf, bondName, helloOf, fameRank, fameOf, titleView, checkChance, peopleDex, discountOf, peopleHere } from '../src/core/social.js';
import { boardToday, boardView, jobsView, offersOf, subView, mainView, hiddenView, questBook } from '../src/core/quests.js';
import { buyPrice, shopView } from '../src/core/trade.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { parseSave } from '../src/core/save.js';
import { JOBS, SUBS, HIDDENS, MAIN, JOB_LIMIT } from '../src/data/quests.js';
import { PEOPLE, TITLES, BONDS } from '../src/data/people.js';
import { ITEMS } from '../src/data/items.js';
import { MONSTERS } from '../src/data/monsters.js';
import { PLACES } from '../src/data/places.js';

const fresh = (seed = 'm4', origin = 'farmer', spent = {}) => createGame({ name: '덕수', origin, spent, seed });
const go = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const befriend = (s, id, stage) => { s.people[id] = { pts: BONDS[stage].at, talked: 0, likes: [], dislikes: [], stats: [], met: true }; };

test('선물: 좋아하는 것을 주면 낯익은 사이가 되고, 말투와 값이 바뀐다 (E26, E27)', () => {
  const s = fresh();
  go(s, 'store');
  s.silver = 100;
  const before = buyPrice(s, 'redpotion');
  assert.equal(before.now, before.base);
  dispatch(s, { type: 'greet', npc: 'granny' });
  const hello0 = helloOf(s, 'granny');
  assert.deepEqual(peopleDex(s)[0].likes, [], '주기 전에는 무엇을 좋아하는지 모른다');
  addItem(s, 'crucian', 1);
  const ev = dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'crucian') });
  assert.equal(bondName(s, 'granny'), '낯익은 사이');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'bond'));
  assert.notEqual(helloOf(s, 'granny'), hello0);
  assert.deepEqual(peopleDex(s)[0].likes, ['붕어']);
  const after = buyPrice(s, 'redpotion');
  assert.equal(after.base, 20);
  assert.equal(after.now, 19, '5% 깎인다');
  assert.ok(after.why.includes('낯익은 사이'));
  const row = shopView(s).goods.find((g) => g.id === 'redpotion');
  assert.ok(row.now < row.base, '원래 값과 깎인 값이 함께 나온다');
  dispatch(s, { type: 'buy', id: 'redpotion' });
  assert.equal(s.silver, 81);
});

test('싫어하는 것을 주면 사이가 내려가고, 그것도 도감에 적힌다. 없는 사람에게는 못 준다', () => {
  const s = fresh();
  go(s, 'store');
  befriend(s, 'granny', 1);
  addItem(s, 'batwing', 1);
  dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'batwing') });
  assert.equal(bondOf(s, 'granny'), 0);
  assert.deepEqual(peopleDex(s)[0].dislikes, ['박쥐 날개']);
  assert.throws(() => dispatch(s, { type: 'talk', npc: 'smith' }), /여기에 없습니다/);
  assert.deepEqual(peopleHere(s).map((p) => p.id), ['granny']);
});

test('이야기 듣기는 하루에 한 번만 사이를 올리고, 만난 사람 수가 쌓인다', () => {
  const s = fresh('m4', 'bard'); // 땅의 사람은 마을 사람들과 조금 가깝게 시작한다
  go(s, 'tavern');
  talkTo(s, 'keeper');
  talkTo(s, 'keeper');
  assert.equal(s.people.keeper.pts, 1);
  for (let i = 0; i < 3; i++) passPhase(s);
  talkTo(s, 'keeper');
  assert.equal(s.people.keeper.pts, 2);
  assert.deepEqual(s.counters.npcs, ['keeper']);
});

test('게시판: 날마다 달라지고 같은 날에는 같다. 날마다 다시 붙는 의뢰가 있다 (E19, E23)', () => {
  const s = fresh('bd');
  const today = boardToday(s);
  assert.deepEqual(boardToday(s), today);
  assert.ok(today.includes('herb5'));
  assert.equal(today.length, 4);
  const seen = new Set();
  for (let d = 1; d <= 30; d++) { s.day = d; assert.ok(boardToday(s).includes('herb5')); boardToday(s).forEach((x) => seen.add(x)); }
  assert.equal(seen.size, Object.values(JOBS).filter((j) => !j.at).length, '한 달이면 광장의 모든 의뢰가 한 번은 붙는다');
  for (const j of Object.values(JOBS)) { assert.ok(j.silver > 0 && j.xp > 0 && j.fame > 0 && j.by && j.say); assert.ok(j.kind === 'bring' ? ITEMS[j.item] : MONSTERS[j.mon]); }
});

test('의뢰: 세 개까지 받고, 조건이 모자라면 까닭이 보이고, 끝내면 은화·경험치·명성이 들어온다 (E20, E21)', () => {
  const s = fresh('job');
  go(s, 'store');
  assert.throws(() => dispatch(s, { type: 'job', op: 'accept', id: 'herb5' }), /광장/);
  go(s, 'plaza');
  // 조건이 모자란 카드가 붙는 날을 찾는다
  for (let d = 1; d <= 60; d++) { s.day = d; if (boardToday(s).some((id) => JOBS[id].minLevel > 1)) break; }
  const dim = boardView(s).find((c) => !c.can);
  assert.ok(dim.why.startsWith('레벨'));
  assert.throws(() => dispatch(s, { type: 'job', op: 'accept', id: dim.id }), /레벨/);
  dispatch(s, { type: 'job', op: 'accept', id: 'herb5' });
  assert.throws(() => dispatch(s, { type: 'job', op: 'accept', id: 'herb5' }), /이미 받은/);
  assert.ok(!boardView(s).some((c) => c.id === 'herb5'));
  assert.throws(() => dispatch(s, { type: 'job', op: 'finish', id: 'herb5' }), /다 채우지/);
  addItem(s, 'herb', 7);
  assert.equal(jobsView(s)[0].ready, true);
  const silver = s.silver, xp = s.xp;
  dispatch(s, { type: 'job', op: 'finish', id: 'herb5' });
  assert.equal(countOf(s, 'herb'), 2);
  assert.equal(s.silver, silver + 14);
  assert.equal(s.xp, xp + 30);
  assert.equal(fameOf(s), 2);
  assert.equal(s.jobsDone, 1);
  // 세 개까지
  s.level = 9;
  const ids = boardView(s).map((c) => c.id).slice(0, 3);
  for (const id of ids) dispatch(s, { type: 'job', op: 'accept', id });
  assert.equal(s.jobs.length, JOB_LIMIT);
  s.day += 1;
  const extra = boardView(s)[0];
  assert.ok(extra);
  assert.ok(!extra.can);
  assert.throws(() => dispatch(s, { type: 'job', op: 'accept', id: extra.id }), /3개까지/);
});

test('잡는 의뢰는 이긴 만큼 세고, 기한이 지나면 쪽지가 돌아간다', () => {
  const s = fresh('hunt');
  s.jobs.push({ id: 'rat3', have: 0, due: s.day + 3 });
  dispatch(s, { type: 'move', to: 'training' });
  s.place = 'forest';
  for (let i = 0; i < 3; i++) {
    s.battle = { mon: 'rat', hp: 1, turn: 1, intent: 'scurry' }; s.status = [];
    dispatch(s, { type: 'battle', choice: 'attack' });
  }
  assert.equal(jobsView(s)[0].have, 3);
  assert.ok(jobsView(s)[0].ready);
  s.jobs.push({ id: 'hide3', have: 0, due: s.day });
  s.place = 'plaza';
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.deepEqual(s.jobs.map((j) => j.id), ['rat3']);
});

test('명성이 오르면 값이 싸지고 첫마디가 바뀐다 (M4-8)', () => {
  const s = fresh('fame');
  go(s, 'store');
  const hello0 = helloOf(s, 'granny');
  s.fame['시작 마을'] = 10;
  assert.equal(fameRank(s), 1);
  assert.notEqual(helloOf(s, 'granny'), hello0);
  assert.ok(discountOf(s, 'granny').rate > 0);
  assert.equal(buyPrice(s, 'redpotion').now, 19);
});

test('서브 퀘스트는 조건을 채워야 나타난다. 이름 옆 숫자가 그것을 알린다 (Q1, Q3-6)', () => {
  const s = fresh('sub');
  go(s, 'store');
  assert.deepEqual(offersOf(s, 'granny'), []);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'accept', id: 'rod' }), /아직 받을 수 없/);
  befriend(s, 'granny', 1);
  assert.deepEqual(offersOf(s, 'granny'), ['rod']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'rod' });
  assert.deepEqual(offersOf(s, 'granny'), []);
  const v = subView(s, 'rod');
  assert.equal(v.step.id, 'find');
  assert.equal(v.ends.length, 3, '마지막 갈림 셋이 미리 보인다');
  assert.ok(v.ends.find((e) => e.label === '고쳐서 돌려준다').need.includes('참나무 가지'));
  assert.ok(v.more, '끝에 무언가 더 있을지도 모른다는 귀띔');
});

const withRod = (seed, origin = 'farmer') => {
  const s = fresh(seed, origin);
  befriend(s, 'granny', 1);
  go(s, 'store');
  dispatch(s, { type: 'quest', op: 'accept', id: 'rod' });
  s.place = 'river'; s.phase = 1;
  let n = 0;
  while (countOf(s, 'oldrod') < 1 && n++ < 300) { s.phase = 1; s.tick = 0; s.full = 80; dispatch(s, { type: 'act', id: 'fish' }); }
  assert.equal(countOf(s, 'oldrod'), 1, '낚시하다 낚싯대가 걸려 올라온다');
  assert.equal(subView(s, 'rod').step.id, 'end');
  s.place = 'store';
  return s;
};

test('할머니의 낚싯대: 세 갈림이 서로 다른 결말로 간다 (M4-3, M4-4)', () => {
  // 돌려준다 → 칭호 '마을의 단골'
  const a = withRod('rodA');
  a.place = 'plaza';
  assert.throws(() => dispatch(a, { type: 'quest', op: 'choose', id: 'rod', choice: 'return' }), /잡화점에서/);
  a.place = 'store';
  dispatch(a, { type: 'quest', op: 'choose', id: 'rod', choice: 'return' });
  assert.equal(a.quests.rod.ending, '돌려주었다');
  assert.equal(countOf(a, 'oldrod'), 0);
  assert.ok(a.titles.some((t) => t.id === 'regular'));
  assert.ok(bondOf(a, 'granny') >= 2);
  // 고쳐서 돌려준다 → 조건이 있어야 고를 수 있다
  const b = withRod('rodB');
  let c = subView(b, 'rod').step.choices.find((x) => x.id === 'mend');
  assert.ok(!c.can);
  assert.throws(() => dispatch(b, { type: 'quest', op: 'choose', id: 'rod', choice: 'mend' }), /있어야 하는 것/);
  addItem(b, 'oakbranch', 2);
  b.skills.fishing.grade = 4;
  c = subView(b, 'rod').step.choices.find((x) => x.id === 'mend');
  assert.ok(c.can);
  dispatch(b, { type: 'quest', op: 'choose', id: 'rod', choice: 'mend' });
  assert.equal(b.quests.rod.ending, '고쳐서 돌려주었다');
  assert.ok(b.quests.rod.set.includes('mended'));
  // 내가 쓴다 → 설득 판정. 실패하면 그 대답만 닫히고 다른 대답은 남는다
  let failed = null, won = null;
  for (let i = 0; i < 60 && !(failed && won); i++) {
    const k = withRod('rodK' + i);
    const shown = subView(k, 'rod').step.choices.find((x) => x.id === 'keep');
    assert.equal(shown.chance, Math.round(checkChance(k, 'persuade', 'granny') * 100), '확률이 고르기 전에 보인다');
    const ev = dispatch(k, { type: 'quest', op: 'choose', id: 'rod', choice: 'keep' });
    const chk = ev.find((e) => e.type === 'check');
    assert.ok(ev.some((e) => e.type === 'line' && e.line.who === '판정' && e.line.text.includes(`주사위 ${chk.roll}`)), '주사위 값이 보인다');
    if (chk.ok) won = k; else failed = k;
  }
  assert.equal(won.quests.rod.ending, '내가 쓰기로 했다');
  assert.equal(countOf(won, 'grannyrod'), 1);
  assert.equal(failed.quests.rod.done, false);
  const left = subView(failed, 'rod').step.choices;
  assert.ok(!left.find((x) => x.id === 'keep').can);
  assert.ok(left.find((x) => x.id === 'return').can, '다른 대답은 남는다');
  assert.throws(() => dispatch(failed, { type: 'quest', op: 'choose', id: 'rod', choice: 'keep' }), /통하지 않았다/);
});

test('주점의 외상 장부: 판정 셋과 돈, 출신이 여는 대답, 그리고 모든 결말 (M4-4, T11, T12)', () => {
  const start = (seed, origin = 'farmer') => {
    const s = fresh(seed, origin);
    befriend(s, 'keeper', 1);
    go(s, 'tavern');
    dispatch(s, { type: 'quest', op: 'accept', id: 'ledger' });
    go(s, 'forge');
    return s;
  };
  const ends = new Set();
  // 출신이 여는 대답은 그 출신에게만 보이고, 판정 없이 통한다
  const f = start('lg1');
  assert.ok(!subView(f, 'ledger').step.choices.some((c) => c.id === 'errand'));
  const sb = start('lg2', 'smithboy');
  const errand = subView(sb, 'ledger').step.choices.find((c) => c.id === 'errand');
  assert.equal(errand.chance, null);
  assert.ok(errand.free.includes('쇠의 사람'));
  const ev = dispatch(sb, { type: 'quest', op: 'choose', id: 'ledger', choice: 'errand' });
  assert.ok(!ev.some((e) => e.type === 'check'));
  go(sb, 'tavern');
  assert.deepEqual(subView(sb, 'ledger').step.choices.map((c) => c.id), ['give', 'pocket']);
  dispatch(sb, { type: 'quest', op: 'choose', id: 'ledger', choice: 'give' });
  ends.add(sb.quests.ledger.ending);
  // 가로챈다
  const p = start('lg3', 'smithboy');
  dispatch(p, { type: 'quest', op: 'choose', id: 'ledger', choice: 'errand' });
  go(p, 'tavern');
  const silver = p.silver;
  dispatch(p, { type: 'quest', op: 'choose', id: 'ledger', choice: 'pocket' });
  assert.equal(p.silver, silver + 30);
  assert.ok(p.lean < 0);
  ends.add(p.quests.ledger.ending);
  // 돈으로: 없으면 못 고른다
  const m = start('lg4');
  assert.ok(!subView(m, 'ledger').step.choices.find((c) => c.id === 'pay').can);
  m.silver = 30;
  dispatch(m, { type: 'quest', op: 'choose', id: 'ledger', choice: 'pay' });
  assert.equal(m.silver, 0);
  go(m, 'tavern');
  assert.deepEqual(subView(m, 'ledger').step.choices.map((c) => c.id), ['say', 'truth']);
  dispatch(m, { type: 'quest', op: 'choose', id: 'ledger', choice: 'truth' });
  assert.equal(m.silver, 30);
  ends.add(m.quests.ledger.ending);
  const m2 = start('lg5');
  m2.silver = 30;
  dispatch(m2, { type: 'quest', op: 'choose', id: 'ledger', choice: 'pay' });
  go(m2, 'tavern');
  dispatch(m2, { type: 'quest', op: 'choose', id: 'ledger', choice: 'say' });
  ends.add(m2.quests.ledger.ending);
  // 찢는다
  const t = start('lg6');
  dispatch(t, { type: 'quest', op: 'choose', id: 'ledger', choice: 'tear' });
  assert.ok(t.quests.ledger.done);
  ends.add(t.quests.ledger.ending);
  assert.equal(ends.size, 5);
  // 판정을 겪으면 그 사람의 스탯이 도감에 적힌다 (T14)
  const c = start('lg7');
  assert.deepEqual(peopleDex(c).find((x) => x.id === 'smith')?.stats || [], []);
  dispatch(c, { type: 'quest', op: 'choose', id: 'ledger', choice: 'threat' });
  assert.equal(peopleDex(c).find((x) => x.id === 'smith').stats.length, 1);
});

test('판정 만 번: 성공 비율이 보인 확률과 맞는다 (M4-10)', () => {
  const s = fresh('roll');
  befriend(s, 'keeper', 1);
  go(s, 'tavern');
  dispatch(s, { type: 'quest', op: 'accept', id: 'ledger' });
  go(s, 'forge');
  for (const kind of ['persuade', 'threat', 'trick']) {
    s.quests.ledger = { step: 'ask', set: [], closed: [], count: 0, done: false, ending: null, day: 1 };
    const shown = subView(s, 'ledger').step.choices.find((c) => c.id === kind).chance;
    let ok = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      s.quests.ledger = { step: 'ask', set: [], closed: [], count: 0, done: false, ending: null, day: 1 };
      s.people.smith = { pts: 50, talked: 0, likes: [], dislikes: [], stats: [], met: true };
      s.log = []; s.tick = 0; s.phase = 0; s.full = 80; s.day = 1; s.lean = 0;
      const ev = dispatch(s, { type: 'quest', op: 'choose', id: 'ledger', choice: kind });
      if (ev.find((e) => e.type === 'check').ok) ok++;
    }
    assert.ok(Math.abs((ok / N) * 100 - shown) < 1.5, `${kind}: ${(ok / N) * 100} ≠ ${shown}`);
  }
  // 떠돌이 악사는 설득이 10%p 높다
  const bard = fresh('b', 'bard');
  assert.ok(Math.abs(checkChance(bard, 'persuade', 'granny') - checkChance(fresh('b'), 'persuade', 'granny') - 0.10) < 1e-9);
});

test('히든 퀘스트: 찾기 전에는 어디에도 없고, 찾으면 가장 큰 띠링과 까닭이 뜬다 (Q4)', () => {
  const s = fresh('hq');
  go(s, 'training');
  dispatch(s, { type: 'greet', npc: 'instructor' });
  assert.deepEqual(hiddenView(s), []);
  assert.equal(JSON.stringify(questBook(s)).includes('교관의 부탁'), false);
  for (let i = 0; i < 300; i++) { dispatch(s, { type: 'act', id: 'strike' }); }
  assert.ok(s.hidden.endure.value >= 1);
  assert.deepEqual(hiddenView(s), [], '인내가 생긴 것만으로는 나타나지 않는다');
  const ev = dispatch(s, { type: 'greet', npc: 'instructor' });
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'hiddenquest').ding;
  assert.equal(d.level, 4);
  assert.ok(d.reason.includes('허수아비'));
  assert.equal(s.choice.kind, 'hq');
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['받는다', '거절한다']);
  // 거절하면 다시 나타나지 않고, 흔적만 남는다
  const no = JSON.parse(JSON.stringify(s));
  dispatch(no, { type: 'choose', id: 'decline' });
  assert.equal(no.hq.favor.status, 'declined');
  for (let i = 0; i < 5; i++) assert.ok(!dispatch(no, { type: 'greet', npc: 'instructor' }).some((e) => e.type === 'ding'));
  assert.ok(questBook(no).done.some((x) => x.name === '교관의 부탁' && x.how.includes('거절')));
  // 받으면: 멧돼지를 잡고 교관에게 돌아간다 → 메인 1장이 숨은 길로 끝난다
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(hiddenView(s)[0].status, 'active');
  s.place = 'forest';
  s.battle = { mon: 'boar', hp: 1, turn: 1, intent: 'gore' }; s.status = []; s.hp = 100;
  dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.hq.favor.step, 'back');
  s.place = 'training';
  assert.equal(s.main.chapter, 1);
  const end = dispatch(s, { type: 'greet', npc: 'instructor' });
  assert.equal(s.hq.favor.status, 'done');
  assert.ok(s.titles.some((t) => t.id === 'scarecrow'));
  assert.equal(s.main.chapter, 2);
  assert.equal(s.main.done[0].path, 'hidden');
  assert.equal(s.main.called, '허수아비 치던 이');
  assert.ok(end.some((e) => e.type === 'ding' && e.ding.kind === 'main'));
});

test('강바닥의 낚시꾼: 낚싯대를 고쳐서 돌려주고 아침의 강에 서면 나타난다 (M4-7)', () => {
  const other = withRod('rvA');
  dispatch(other, { type: 'quest', op: 'choose', id: 'rod', choice: 'return' });
  other.place = 'river';
  for (let i = 0; i < 10; i++) { other.phase = 0; other.tick = 0; dispatch(other, { type: 'act', id: 'fish' }); }
  assert.equal(other.hq.riverbed, undefined, '다르게 맺었으면 나타나지 않는다');

  const s = withRod('rvB');
  addItem(s, 'oakbranch', 2);
  s.skills.fishing.grade = 4;
  dispatch(s, { type: 'quest', op: 'choose', id: 'rod', choice: 'mend' });
  s.place = 'river'; s.phase = 1; s.tick = 0;
  dispatch(s, { type: 'act', id: 'fish' });
  assert.equal(s.hq.riverbed, undefined, '낮에는 나타나지 않는다');
  s.phase = 0; s.tick = 0;
  const ev = dispatch(s, { type: 'act', id: 'fish' });
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.title.includes('강바닥의 낚시꾼')));
  dispatch(s, { type: 'choose', id: 'accept' });
  for (let i = 0; i < 10; i++) { s.phase = 0; s.tick = 0; s.full = 80; dispatch(s, { type: 'act', id: 'fish' }); }
  assert.equal(s.hq.riverbed.status, 'done');
  assert.equal(countOf(s, 'mistrod'), 1);
  for (const q of Object.values(HIDDENS)) { assert.ok(q.why && q.offer && q.done && q.kind); }
});

test('메인 1장: 길 다섯이 미리 보이고, 숨은 길은 보이지 않는다. 가장 가까운 길이 일지 맨 위에 (Q2, Q3-4)', () => {
  const s = fresh('main');
  const v = mainView(s);
  assert.equal(v.name, '이름 없는 자');
  assert.equal(v.paths.length, 5);
  assert.ok(!JSON.stringify(v).includes('허수아비'));
  assert.equal(v.nearest.id, 'fight');
  befriend(s, 'granny', 2); befriend(s, 'keeper', 2);
  assert.equal(mainView(s).nearest.id, 'friend');
  assert.deepEqual([mainView(s).nearest.have, mainView(s).nearest.need], [2, 3]);
  assert.ok(mapView(s).find((r) => r.id === 'ruins').locked);
});

test('메인 1장은 사귀는 길·벌이의 길·만드는 길·싸우는 길 어느 것으로도 끝나고, 폐허 입구가 열린다 (M4-13)', () => {
  const ended = (s, path, called) => {
    assert.equal(s.main.chapter, 2);
    assert.equal(s.main.done[0].path, path);
    assert.equal(s.main.called, called);
    assert.ok(!mapView(s).find((r) => r.id === 'ruins').locked);
    assert.equal(mainView(s).name, '폐허의 소리');
  };
  // 사귀는 길
  const a = fresh('mA');
  befriend(a, 'granny', 2); befriend(a, 'keeper', 2); befriend(a, 'smith', 1);
  a.people.smith.pts = 29;
  go(a, 'forge');
  const ev = talkTo(a, 'smith');
  ended(a, 'friend', '이웃');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'main' && e.ding.level === 4));
  assert.ok(a.titles.some((t) => t.id === 'neighbor'));
  a.people.smith.pts = 10; // 낯익은 사이는 별명으로 부른다
  assert.ok(helloOf(a, 'smith').startsWith('이웃,'), '끝낸 길이 부르는 말을 바꾼다');
  a.people.smith.pts = 30; // 단골부터는 이름으로 (Z39)
  assert.ok(helloOf(a, 'smith').startsWith(a.name + ','));
  // 벌이의 길
  const b = fresh('mB');
  b.jobsDone = 9;
  b.jobs.push({ id: 'herb5', have: 0, due: 9 });
  addItem(b, 'herb', 5);
  dispatch(b, { type: 'job', op: 'finish', id: 'herb5' });
  ended(b, 'work', '일꾼');
  // 만드는 길: 제 손으로 만든 희귀 등급 이상을 판다
  const c = fresh('mC');
  go(c, 'forge');
  c.bag = [];
  addItem(c, 'ironsword', 1, { grade: 2, maker: '남' });
  dispatch(c, { type: 'sell', index: 0 });
  assert.equal(c.main.chapter, 1, '남이 만든 것은 치지 않는다');
  addItem(c, 'ironsword', 1, { grade: 2, maker: '덕수' });
  dispatch(c, { type: 'sell', index: 0 });
  ended(c, 'craft', '손 좋은 이');
  // 싸우는 길
  const d = fresh('mD');
  d.level = 4; d.xp = 579;
  dispatch(d, { type: 'move', to: 'training' });
  d.place = 'forest';
  d.battle = { mon: 'rat', hp: 1, turn: 1, intent: 'scurry' }; d.status = [];
  dispatch(d, { type: 'battle', choice: 'attack' });
  assert.equal(d.level, 5);
  assert.equal(d.main.chapter, 1, '레벨 5만으로는 끝나지 않는다. 직업을 얻어야 한다');
  dispatch(d, { type: 'career', op: 'choose', id: 'warrior' });
  ended(d, 'fight', '싸움꾼');
  dispatch(d, { type: 'travel', to: 'ruins' });
  assert.ok(d.place === 'ruins');
});

test('폐허 입구의 갇힌 이: 네 갈림 모두 갈 수 있고, 끝나면 그 사람은 떠난다 (M4-4)', () => {
  const start = (seed) => {
    const s = fresh(seed);
    s.main.done.push({ chapter: 1, path: 'fight', day: 1 }); s.main.chapter = 2; s.opened.push('ruins');
    s.place = 'ruins';
    assert.deepEqual(offersOf(s, 'trapped'), ['trapped']);
    dispatch(s, { type: 'quest', op: 'accept', id: 'trapped' });
    return s;
  };
  const a = start('tA');
  assert.ok(!subView(a, 'trapped').step.choices.find((c) => c.id === 'lever').can);
  addItem(a, 'oakbranch', 3);
  dispatch(a, { type: 'quest', op: 'choose', id: 'trapped', choice: 'lever' });
  assert.equal(a.quests.trapped.ending, '꺼내 주었다');
  assert.ok(a.titles.some((t) => t.id === 'helper'));
  assert.equal(fameOf(a), 10);
  assert.deepEqual(peopleHere(a), [], '풀려난 사람은 떠난다');
  assert.ok(!slotsNow(a).some((x) => x.label === '말 걸기'));
  const b = start('tB');
  addItem(b, 'oakbranch', 3);
  dispatch(b, { type: 'quest', op: 'choose', id: 'trapped', choice: 'price' });
  assert.equal(b.silver, 40);
  assert.ok(b.lean < 0);
  const c = start('tC');
  dispatch(c, { type: 'quest', op: 'choose', id: 'trapped', choice: 'leave' });
  assert.equal(c.quests.trapped.ending, '지나쳤다');
  let lifted = false;
  for (let i = 0; i < 40 && !lifted; i++) {
    const d = start('tD' + i);
    d.stats.str = 20;
    assert.equal(subView(d, 'trapped').step.choices.find((x) => x.id === 'lift').chance, 75);
    dispatch(d, { type: 'quest', op: 'choose', id: 'trapped', choice: 'lift' });
    lifted = d.quests.trapped.done;
    if (!lifted) assert.ok(subView(d, 'trapped').step.choices.find((x) => x.id === 'leave').can);
  }
  assert.ok(lifted);
});

test('칭호: 하나만 달고 마을에서만 바꾼다. 못 얻은 것은 ???와 귀띔뿐 (G3-1, G3-2)', () => {
  const s = withRod('ttl');
  dispatch(s, { type: 'quest', op: 'choose', id: 'rod', choice: 'return' });
  const got = titleView(s).find((t) => t.got);
  assert.equal(got.name, '마을의 단골');
  assert.ok(got.why.includes('낚싯대'));
  for (const t of titleView(s).filter((x) => !x.got)) { assert.ok(t.hint); assert.equal(t.name, undefined); assert.equal(t.effect, undefined); }
  assert.throws(() => dispatch(s, { type: 'title', id: 'helper' }), /얻지 못한/);
  const before = buyPrice(s, 'redpotion').now;
  dispatch(s, { type: 'title', id: 'regular' });
  assert.equal(s.title, 'regular');
  assert.ok(buyPrice(s, 'redpotion').now < before, '달면 값이 싸진다');
  s.place = 'forest';
  assert.throws(() => dispatch(s, { type: 'title', id: null }), /마을에서만/);
  s.place = 'store';
  dispatch(s, { type: 'title', id: null });
  assert.equal(s.title, null);
  for (const t of Object.values(TITLES)) assert.ok(t.name && t.effect && t.hint);
});

test('히든과 퀘스트의 글이 화면 쪽 값에 새지 않는다', () => {
  const s = fresh('leak');
  const all = JSON.stringify([questBook(s), mainView(s), hiddenView(s), titleView(s), hiddenSlots(s).filter((x) => !x.found)]);
  for (const word of ['교관의 부탁', '강바닥', '한길', '300', '삼백']) assert.ok(!all.includes(word), word);
  for (const q of Object.values(SUBS)) { assert.ok(PEOPLE[q.giver]); for (const st of q.steps) for (const c of st.choices || []) { assert.ok(c.say, `${q.id}.${c.id}`); if (c.check) assert.ok(c.failSay, `${q.id}.${c.id}`); } }
  for (const m of Object.values(MAIN)) for (const id of m.opens) assert.ok(PLACES[id]);
});

test('3판 저장을 읽으면 4판으로 올라온다', () => {
  const s = fresh('v3');
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['people', 'fame', 'titles', 'title', 'lean', 'jobs', 'jobsDone', 'board', 'quests', 'hq', 'main', 'opened']) delete old[k];
  old.dex = { mon: {} };
  old.v = 3;
  const up = parseSave(JSON.stringify({ v: 3, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.main.chapter, 1);
  go(up, 'store');
  talkTo(up, 'granny');
  assert.equal(up.people.granny.pts, 1);
});

// ── 검토에서 나온 것들 ──
test('선물은 한 사람에게 하루에 한 번이다', () => {
  const s = fresh('g1', 'fallen');
  go(s, 'store');
  for (let i = 0; i < 5; i++) dispatch(s, { type: 'buy', id: 'berry' });
  dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'berry') });
  assert.throws(() => dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'berry') }), /하루에 한 번/);
  assert.equal(countOf(s, 'berry'), 4, '거절되면 물건은 그대로다');
  go(s, 'tavern');
  for (let i = 0; i < 3; i++) passPhase(s);
  go(s, 'store');
  dispatch(s, { type: 'gift', npc: 'granny', index: s.bag.findIndex((x) => x.id === 'berry') });
  assert.equal(s.people.granny.pts, 4);
});

test('밀린 보관 삯이 있을 때 은화 찾기는 모자라면 아무것도 옮기지 않는다', () => {
  const s = fresh('debt');
  go(s, 'tavern');
  s.store['시작 마을'] = { items: [], silver: 5 };
  s.storeDebt = 20; s.silver = 0;
  assert.throws(() => dispatch(s, { type: 'withdraw', silver: 5 }), /밀린 보관 삯/);
  assert.equal(s.silver, 0);
  assert.equal(s.store['시작 마을'].silver, 5);
  s.store['시작 마을'].silver = 30;
  dispatch(s, { type: 'withdraw', silver: 30 });
  assert.equal(s.silver, 10);
  assert.equal(s.storeDebt, 0);
});

test('퀘스트 물건은 맡길 수 없고, 내놓을 것이 없으면 선택은 글도 주사위도 쓰기 전에 거절된다', () => {
  const s = withRod('qi');
  go(s, 'tavern');
  assert.throws(() => dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'oldrod') }), /맡길 수 없습니다/);
  go(s, 'store');
  s.bag = s.bag.filter((x) => x.id !== 'oldrod'); // 어떻게든 손에서 사라졌다고 치면
  const log = s.log.length, rng = s.rng;
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'rod', choice: 'keep' }), /있어야 합니다/);
  assert.equal(s.log.length, log);
  assert.equal(s.rng, rng);
  assert.deepEqual(s.quests.rod.set, []);
});

test('교관의 부탁은 허수아비 앞에서 생긴 인내여야 나타난다', () => {
  const s = fresh('fv');
  s.place = 'river';
  s.counters.act.fish = 300;
  s.hidden.endure = { value: 1, half: true };
  s.place = 'training';
  assert.ok(!dispatch(s, { type: 'greet', npc: 'instructor' }).some((e) => e.type === 'ding' && e.ding.kind === 'hiddenquest'));
  assert.equal(s.hq.favor, undefined);
});

test('망가진 새 칸이 든 저장은 걸러진다', () => {
  const good = JSON.parse(JSON.stringify(fresh('brk4')));
  const wrap = (st) => JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: st });
  assert.equal(parseSave(wrap(good)).state.name, '덕수');
  const bads = [
    { craft: { recipe: 'nope', hits: 0, warm: 0, cold: false, quality: 0 } },
    { quests: { rod: { step: 'nope', set: [], closed: [] } } },
    { hq: { favor: { status: 'active', step: 'nope' } } },
    { jobs: [{ id: 'nope', have: 0, due: 3 }] },
    { store: null },
    { store: { '시작 마을': { items: [{ id: 'nope', n: 1 }], silver: 0 } } },
    { board: null },
    { choice: { kind: 'incident', id: 'nope', place: 'forest' } },
    { storeDebt: -500 },
  ];
  for (const b of bads) assert.throws(() => parseSave(wrap({ ...good, ...b })), /망가졌습니다/, JSON.stringify(b));
});
