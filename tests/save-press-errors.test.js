import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { saveTo, loadFrom, listSlots, clearSlot, exportText, importText, shouldAutosave, SLOT_COUNT, revOf, SaveConflict } from '../src/core/save.js';
import { createPressGuard, slotIndex, keyDecision } from '../src/core/press.js';
import { recordError, readErrors, clearErrors } from '../src/core/errors.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), size: () => m.size };
}
const newGame = () => createGame({ name: '서진', origin: 'smithboy', spent: {}, seed: 'save' });

test('저장하고 다시 열면 같은 상태다 (M1-7)', () => {
  const st = fakeStorage();
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 40; i++) dispatch(s, { type: 'act', id: 'strike' });
  saveTo(st, 0, s);
  assert.deepEqual(loadFrom(st, 0), s);
});

test('저장 칸은 셋이고, 칸마다 따로다', () => {
  const st = fakeStorage();
  assert.equal(SLOT_COUNT, 3);
  saveTo(st, 1, newGame());
  const slots = listSlots(st);
  assert.deepEqual(slots.map((x) => x.empty), [true, false, true]);
  assert.equal(slots[1].name, '서진');
  assert.equal(slots[1].when, '1일째 아침');
  assert.throws(() => saveTo(st, 3, newGame()), /0부터 2/);
});

test('되감는 저장이 없다: 한 칸에는 가장 나중 것 하나만 남는다 (G4-2)', () => {
  const st = fakeStorage();
  const s = newGame();
  saveTo(st, 0, s);
  dispatch(s, { type: 'move', to: 'training' });
  saveTo(st, 0, s);
  assert.equal(st.size(), 1, '지난 저장을 따로 남기지 않는다');
  assert.equal(loadFrom(st, 0).place, 'training');
});

test('방을 옮기거나 띠링이 뜨면 저절로 저장할 때다', () => {
  const s = newGame();
  assert.equal(shouldAutosave(dispatch(s, { type: 'move', to: 'training' })), true);
  assert.equal(shouldAutosave(dispatch(s, { type: 'act', id: 'strike' })), false);
  let ev = [];
  for (let i = 0; i < 30 && !ev.some((e) => e.type === 'ding'); i++) ev = dispatch(s, { type: 'act', id: 'strike' });
  assert.ok(ev.some((e) => e.type === 'ding'), '서른 번 안에 숙련도가 올라 띠링이 뜬다');
  assert.ok(ev.every((e) => e.type !== 'move' && e.type !== 'phase'), '띠링 말고 다른 까닭이 없다');
  assert.equal(shouldAutosave(ev), true, '띠링이 뜨면 저장할 때다');
});

test('파일로 내보내고 다른 칸으로 가져온다', () => {
  const st = fakeStorage();
  saveTo(st, 0, newGame());
  importText(st, 2, exportText(st, 0));
  assert.equal(loadFrom(st, 2).name, '서진');
  assert.throws(() => importText(st, 1, '{"x":1}'), /저장 파일이 아닙니다/);
  assert.throws(() => importText(st, 1, 'not json'), /읽을 수 없습니다/);
  assert.throws(() => exportText(st, 1), /비어/);
  clearSlot(st, 0);
  assert.equal(loadFrom(st, 0), null);
});

// 화면이 하는 그대로: 키가 내려오면 keyDecision에 묻고, 단축 칸이 나오면 그 칸의 행동을 한 번 dispatch한다.
function keyboard(state) {
  const guard = createPressGuard();
  const base = { onButton: false, onInput: false, windowOpen: false, modifier: false, inGame: true };
  const act = () => dispatch(state, { type: 'act', id: 'strike' });
  return {
    guard,
    down(code, key, repeat, extra = {}) {
      const d = keyDecision(guard, { ...base, code, key, repeat, ...extra });
      if (d.slot === 0) act();
      return d;
    },
    up: (code) => guard.up(code),
    /** 단추 위에서 Enter를 눌렀을 때 브라우저가 하는 일: 막히지 않았으면 클릭 한 번. */
    enterOnButton(repeat) {
      const d = keyDecision(guard, { ...base, code: 'Enter', key: 'Enter', repeat, onButton: true });
      if (!d.prevent) act();
      return d;
    },
  };
}
const atTraining = () => { const s = newGame(); dispatch(s, { type: 'move', to: 'training' }); return s; };

test('숫자 키를 2초 동안 누르고 있어도 허수아비를 한 번만 친다 (M1-8, 사용자 결정)', () => {
  const s = atTraining();
  const kb = keyboard(s);
  kb.down('Digit1', '1', false);
  for (let t = 30; t < 2000; t += 30) kb.down('Digit1', '1', true); // 운영체제가 보내는 반복
  assert.equal(s.counters.act.strike, 1);
  kb.down('Digit1', '1', false); // repeat 표시가 빠진 채 또 내려와도
  assert.equal(s.counters.act.strike, 1);
  kb.up('Digit1');
  kb.down('Digit1', '1', false);
  assert.equal(s.counters.act.strike, 2, '떼었다 다시 누르면 한 번 더');
});

test('단추 위에서 Enter를 2초 동안 누르고 있어도 한 번만 친다', () => {
  const s = atTraining();
  const kb = keyboard(s);
  kb.enterOnButton(false);
  for (let t = 30; t < 2000; t += 30) assert.equal(kb.enterOnButton(true).prevent, true, '반복은 어느 단추에서든 막는다');
  assert.equal(s.counters.act.strike, 1);
});

test('창이 떠 있거나 글을 치는 중이면 숫자 키로 치지 않는다', () => {
  const s = atTraining();
  const kb = keyboard(s);
  kb.down('Digit1', '1', false, { windowOpen: true });
  kb.down('Digit1', '1', false, { onInput: true });
  kb.down('Digit1', '1', false, { modifier: true });
  kb.down('Digit1', '1', false, { inGame: false });
  assert.equal(s.counters.act.strike, undefined);
});

test('Shift를 같이 눌렀다 떼어도 숫자 키가 죽지 않는다', () => {
  const s = atTraining();
  const kb = keyboard(s);
  kb.down('Digit1', '1', false);
  kb.up('Digit1'); // Shift를 누른 채 떼면 글자는 "!"이지만 자리는 Digit1이다
  kb.down('Digit1', '!', false);
  assert.equal(s.counters.act.strike, 2);
});

test('단축 칸 숫자 키', () => {
  assert.deepEqual(['Digit1', 'Digit5', 'Numpad3', 'Digit6', 'KeyA', 'Digit0', '1'].map(slotIndex), [0, 4, 2, -1, -1, -1, -1]);
});

test('다른 창이 먼저 고친 칸은 덮어쓰지 않는다: 창 두 개로 되감을 수 없다 (G4-2)', () => {
  const st = fakeStorage();
  const a = newGame();
  let revA = saveTo(st, 0, a);
  const b = loadFrom(st, 0); // 창 B가 같은 칸을 열어 둔다
  const revB = revOf(st, 0);
  dispatch(a, { type: 'move', to: 'training' });
  for (let i = 0; i < 50; i++) dispatch(a, { type: 'act', id: 'strike' });
  revA = saveTo(st, 0, a, 2000, revA); // 창 A가 앞서 나간다
  assert.throws(() => saveTo(st, 0, b, 3000, revB), SaveConflict, '창 B의 옛 상태는 쓰이지 않는다');
  assert.equal(loadFrom(st, 0).counters.act.strike, 50, '앞서 나간 저장이 그대로 남는다');
  assert.equal(revOf(st, 0), revA);
  assert.equal(revOf(st, 1), 0);
});

test('일부러 낸 오류가 기록에 남는다 (I00-01-03)', () => {
  const st = fakeStorage();
  try { throw new Error('일부러 낸 오류'); } catch (e) { recordError(st, e, '테스트', 1000); }
  const list = readErrors(st);
  assert.equal(list.length, 1);
  assert.equal(list[0].message, '일부러 낸 오류');
  assert.equal(list[0].where, '테스트');
  for (let i = 0; i < 60; i++) recordError(st, 'x' + i);
  assert.equal(readErrors(st).length, 50, '마지막 50개만 남긴다');
  clearErrors(st);
  assert.equal(readErrors(st).length, 0);
});
