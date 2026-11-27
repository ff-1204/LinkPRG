// 퀘스트의 "어떻게"와 바로가기 (Z109), 지난 삶에서 끝낸 장을 세는 서브 (Z110)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { goTo, placePath, mainView, offersOf, redoChapter, questBook, acceptSub } from '../src/core/quests.js';
import { MAIN, SUBS, HIDDENS } from '../src/data/quests.js';
import { MAIN_HOW, SUB_GOAL_AT, HIDDEN_GOAL_AT } from '../src/data/questhow.js';
import { PLACES } from '../src/data/places.js';
import { DUNGEONS } from '../src/data/dungeon.js';

const mk = () => createGame({ name: '확인', origin: 'hunter', rolled: rollDice('how'), seed: 'how', cid: 'how-1' });

test('메인의 모든 길에 설명이 있고, 곳은 있는 곳이다', () => {
  for (const [ch, m] of Object.entries(MAIN)) {
    const ids = m.steps ? m.steps.map((s) => s.id) : m.paths.map((p) => p.id);
    for (const id of ids) {
      const x = MAIN_HOW[ch]?.[id];
      assert.ok(x && x[1], `${ch}장 ${id}`);
      if (x[0]) assert.ok(x[0][0] === '@' ? PLACES[DUNGEONS[x[0].slice(1)].from] : PLACES[x[0]], `${ch}장 ${id}의 곳`);
    }
    // 숨은 길은 적지 않는다
    if (m.hidden) assert.equal(MAIN_HOW[ch][m.hidden.id], undefined);
  }
});

test('세는 단계가 있는 서브와 히든은 하는 곳이 적혀 있다', () => {
  for (const [id, q] of Object.entries(SUBS)) if (q.steps.some((s) => s.goal)) assert.ok(PLACES[SUB_GOAL_AT[id]], id);
  for (const [id, q] of Object.entries(HIDDENS)) if (q.steps.some((s) => !s.goal.talk)) assert.ok(PLACES[HIDDEN_GOAL_AT[id]], id);
});

test('바로가기: 같은 마을은 방으로, 들판은 들판으로, 다른 마을은 어귀로, 모르는 길은 없다', () => {
  const s = mk();
  assert.deepEqual(goTo(s, 'forge').action, { type: 'move', to: 'forge' });
  assert.deepEqual(goTo(s, 'forest').action, { type: 'travel', to: 'forest' });
  assert.equal(goTo(s, s.place).here, true);
  assert.equal(goTo(s, 'branch'), null); // 나루는 아직 길을 모른다
  s.opened.push('dock');
  const g = goTo(s, 'branch');
  assert.deepEqual(g.action, { type: 'travel', to: 'dock' });
  assert.equal(g.name, '나루');
  // 누르면 실제로 간다
  dispatch(s, goTo(s, 'forge').action);
  assert.equal(s.place, 'forge');
});

test('상세 위치: 마을 > 방, 들판은 이름만, 던전은 들머리 뒤에', () => {
  assert.equal(placePath('branch'), '나루 > 상단 지부');
  assert.equal(placePath('forest'), '서쪽 숲');
  assert.equal(placePath('@icetower'), '언못 > 종루 아래 > 얼음 종루');
  const s = mk(); s.main.chapter = 3;
  assert.equal(mainView(s).paths[0].where, '나루 > 상단 지부');
});

test('1장의 길마다 회색 글이 나오고, 닫히거나 모르는 길에는 없다', () => {
  const s = mk();
  const v = mainView(s);
  for (const p of v.paths) assert.ok(p.how, p.id);
  assert.equal(v.paths.find((p) => p.id === 'work').go[0].here, s.place === 'plaza');
  s.main.chapter = 11;
  const open = mainView(s).paths.find((p) => p.id === 'open');
  assert.equal(open.unknown, true);
  assert.equal(open.how, undefined);
});

test('서브: 고르는 단계는 정하는 곳으로, 세는 단계는 하는 곳으로 간다', () => {
  const s = mk();
  s.people.granny = { pts: 9999, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  s.place = 'artguild';
  assert.ok(offersOf(s, 'granny').includes('rod'));
  acceptSub(s, [], 'rod');
  const v = questBook(s).subs.find((x) => x.id === 'rod');
  assert.equal(v.step.where, '강가 낚시터');
  assert.deepEqual(v.step.go[0].action, { type: 'travel', to: 'river' });
});

test('지난 삶에서 끝낸 장도 서브가 나타나는 조건으로 센다: 3장만 다시 풀어도 막히지 않는다', () => {
  const s = mk();
  s.main.past = [{ chapter: 1, path: 'fight' }, { chapter: 2, path: 'beat' }, { chapter: 3, path: 'merchants' }];
  s.main.chapter = 4;
  redoChapter(s, [], 3);
  assert.equal(s.main.chapter, 3);
  assert.deepEqual(offersOf(s, 'agent'), ['lode']);
  assert.deepEqual(offersOf(s, 'trapped'), ['trapped']);
  // 2장을 다시 풀려고 열어 둔 동안에는 2장을 끝낸 것으로 세지 않는다
  redoChapter(s, [], 2);
  assert.deepEqual(offersOf(s, 'agent'), []);
});
