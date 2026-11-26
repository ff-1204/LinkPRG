import { passPhase } from './_time.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedFrom, next } from '../src/core/rng.js';
import { emptySkill, useSkill, gradeLabel, xpGain } from '../src/core/skills.js';
import { createGame, dispatch, usersHere, scarecrowStage } from '../src/core/game.js';
import { buildStats, ORIGINS } from '../src/data/origins.js';
import { iGa, eulReul, ro } from '../src/core/ko.js';
import { HIDDEN, hiddenSlots } from '../src/core/hidden.js';
import * as LINES from '../src/data/lines.js';

const newGame = (extra = {}) => createGame({ name: '서진', origin: 'smithboy', spent: { str: 1, agi: 2 }, seed: 'test', ...extra });
const hit = (s, n, opt) => { const all = []; for (let i = 0; i < n; i++) { if (s.phase === 2) passPhase(s); all.push(...dispatch(s, { type: 'act', id: 'strike' }, opt)); } return all; }; // 밤에는 잔다

test('같은 씨앗이면 난수가 같다', () => {
  const a = { rng: seedFrom('x') }, b = { rng: seedFrom('x') };
  assert.deepEqual([next(a), next(a), next(a)], [next(b), next(b), next(b)]);
});

test('같은 씨앗으로 같은 행동을 두 번 돌리면 결과가 같다 (M1-2)', () => {
  const run = () => { const s = newGame(); dispatch(s, { type: 'move', to: 'training' }); hit(s, 320); return JSON.stringify(s); };
  assert.equal(run(), run());
});

test('출신 서른(뿌리 여섯), 시작 점수 5 (T1~T3, Z25)', () => {
  assert.equal(ORIGINS.length, 30);
  assert.equal(new Set(ORIGINS.map((o) => o.root)).size, 6);
  const { stats, unspent } = buildStats('smithboy', { str: 1, agi: 2 });
  assert.deepEqual(stats, { str: 12, agi: 11, con: 10, wis: 7 });
  assert.equal(unspent, 2);
  assert.throws(() => buildStats('smithboy', { str: 6 }), /5까지/);
  assert.throws(() => buildStats('nobody', {}), /모르는 출신/);
});

test('출신에 따라 시작이 다르다', () => {
  assert.equal(newGame().skills.smithing.grade, 1); // 대장 초급 2
  assert.equal(createGame({ name: '가', origin: 'fallen', spent: {}, seed: 's' }).silver, 100);
  assert.throws(() => createGame({ name: ' ', origin: 'farmer', spent: {} }), /이름/);
});

test('숙련도: 쉬운 대상일수록 덜 오른다 (M1-8)', () => {
  assert.ok(xpGain(0, 0) > xpGain(5, 0));
  assert.ok(xpGain(5, 5) > xpGain(5, 0));
  const s = emptySkill();
  for (let i = 0; i < 300; i++) useSkill(s, 0);
  assert.equal(gradeLabel(s.grade), '초급 7');
});

test('광장에서 훈련소로 옮기면 시간이 흐르고, 밤을 넘기면 날짜가 바뀐다 (M1-6)', () => {
  const s = newGame();
  const ev = dispatch(s, { type: 'move', to: 'training' });
  assert.equal(s.place, 'training');
  assert.equal(s.tick, 5);
  assert.ok(ev.some((e) => e.type === 'move'));
  passPhase(s);
  passPhase(s);
  assert.equal(s.phase, 2);
  passPhase(s);
  assert.deepEqual([s.day, s.phase], [2, 0]);
});

test('여기서 할 수 없는 일은 막는다', () => {
  const s = newGame();
  assert.throws(() => dispatch(s, { type: 'act', id: 'strike' }), /할 수 없는/);
});

test('허수아비를 열 번 치면 서로 다른 글이 셋 이상 나온다 (M1-9)', () => {
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  const lines = hit(s, 10).filter((e) => e.type === 'line' && e.line.k === 'me').map((e) => e.line.text);
  assert.equal(lines.length, 10);
  assert.ok(new Set(lines).size >= 3, `다른 글 ${new Set(lines).size}개`);
  for (let i = 1; i < lines.length; i++) assert.notEqual(lines[i], lines[i - 1], '바로 앞과 같은 글이 나오면 안 된다');
});

test('허수아비 그림은 100번마다 바뀌고 300번째에 터진다 (M1-15)', () => {
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(scarecrowStage(s), 0);
  hit(s, 99); assert.equal(scarecrowStage(s), 0);
  assert.ok(hit(s, 1).some((e) => e.type === 'art')); assert.equal(scarecrowStage(s), 1);
  hit(s, 100); assert.equal(scarecrowStage(s), 2);
  hit(s, 100); assert.equal(scarecrowStage(s), 3);
});

test('150번째에 "무언가 쌓이는 느낌", 300번째에 인내 (M1-12)', () => {
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  const a = hit(s, 149);
  assert.ok(!a.some((e) => e.type === 'line' && e.line.text.includes('쌓이는 느낌')));
  const b = hit(s, 1);
  assert.ok(b.some((e) => e.type === 'line' && e.line.text.includes('쌓이는 느낌')));
  assert.equal(hiddenSlots(s).find((h) => h.id === 'endure').half, true);
  const c = hit(s, 149);
  assert.ok(!c.some((e) => e.type === 'ding' && e.ding.level === 3));
  const d = hit(s, 1);
  const found = d.find((e) => e.type === 'ding' && e.ding.level === 3);
  assert.ok(found, '300번째에 아주 귀한 띠링');
  assert.equal(found.ding.title, "새로운 스탯 '인내'가 생겼습니다");
  assert.equal(found.ding.big, '인내 +1');
  assert.equal(found.ding.reason, '허수아비를 300번 쳤습니다');
  assert.equal(s.hidden.endure.value, 1);
  assert.ok(d.some((e) => e.type === 'line' && e.line.who === '교관' && e.line.text === '이런 녀석은 처음 본다.'));
});

test('히든 스탯은 열세 칸이고, 못 찾은 칸에는 이름도 문턱도 없다 (Q5-5)', () => {
  const s = newGame();
  const slots = hiddenSlots(s);
  assert.equal(slots.length, 13);
  assert.equal(HIDDEN.filter((h) => !h.after).length, 13, '열네 번째는 어떤 끝을 고른 뒤에만 생긴다');
  // 못 찾은 칸이 내보내는 것은 이 넷뿐이다. 이름, 효과, 문턱, 진행률은 없다.
  const bare = (list) => list.filter((x) => !x.found).forEach((slot) => assert.deepEqual(Object.keys(slot).sort(), ['found', 'half', 'hints', 'id']));
  bare(slots);
  dispatch(s, { type: 'move', to: 'training' });
  hit(s, 150, { chatter: 'low' });
  const mid = hiddenSlots(s);
  bare(mid);
  assert.equal(mid.find((x) => x.id === 'endure').half, true);
  assert.equal(mid.filter((x) => !x.found).length, 13, '절반을 넘어도 아직 찾은 것은 아니다');
});

test('글 어디에도 히든 스탯의 문턱 숫자가 없다 (Q5-5, 규칙 4)', () => {
  const words = { 3: ['사흘', '세 번', '삼 일'], 5: ['다섯 번'], 10: ['열 번', '열 개'], 20: ['스무 번'], 30: ['서른'], 50: ['오십', '쉰 번', '쉰 개'], 300: ['삼백', '300'] };
  const firsts = new Set(HIDDEN.map((h) => h.first));
  const hintTexts = [];
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (v.hint) hintTexts.push(v.hint.text, v.text);
    for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x);
  };
  walk(LINES);
  assert.ok(hintTexts.length >= 4, '귀띔이 있다');
  for (const text of hintTexts) {
    assert.equal(/\d{2,}/.test(text.replace('200번', '').replace('이백 번', '')), false, `귀띔에 숫자: ${text}`);
    for (const n of firsts) for (const w of words[n] || []) assert.equal(text.includes(w), false, `귀띔 "${text}"에 문턱 "${w}"`);
  }
  // 못 찾은 칸에 적히는 귀띔도 같다
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  hit(s, 299, { chatter: 'high' });
  const shown = JSON.stringify(hiddenSlots(s).filter((x) => !x.found));
  for (const w of ['삼백', '300', '오십']) assert.equal(shown.includes(w), false, `못 찾은 칸에 "${w}"`);
});

test('인내의 +1%는 실제로 숙련도를 더 올린다 (Q6 표)', () => {
  const plain = emptySkill(), boosted = emptySkill();
  for (let i = 0; i < 200; i++) { useSkill(plain, 0, 1); useSkill(boosted, 0, 1.01); }
  const total = (sk) => sk.grade * 1e6 + sk.xp;
  assert.ok(total(boosted) > total(plain), '1%의 덤이 반올림에 지워지지 않는다');
});

test('가상 유저 잡담: 허수아비를 오래 치면 그에 맞는 말이 뜬다 (M1-13)', () => {
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  const ev = hit(s, 130, { chatter: 'low' });
  const said = ev.filter((e) => e.type === 'line' && e.line.k === 'user').map((e) => e.line.text);
  assert.ok(said.includes('그거 아무것도 안 나와요. 저도 해 봤음.'));
  assert.ok(said.includes('저 사람 아직도 치는데요?'));
  assert.ok(ev.every((e) => e.type !== 'line' || e.line.k !== 'user' || !e.line.who.includes('서진')));
});

test('잡담의 귀띔은 히든 스탯 칸에 적힌다 (Q5-3)', () => {
  const s = newGame();
  dispatch(s, { type: 'move', to: 'training' });
  hit(s, 150, { chatter: 'low' });
  assert.equal(s.hints.endure.length, 1);
  assert.equal(hiddenSlots(s).find((h) => h.id === 'endure').hints.length, 1);
});

test('방에 있는 유저 수는 저장해도 같다', () => {
  const s = newGame();
  assert.equal(usersHere(s), usersHere(JSON.parse(JSON.stringify(s))));
});

test('조사', () => {
  assert.equal(iGa('인내'), '인내가');
  assert.equal(iGa('근성'), '근성이');
  assert.equal(iGa("'인내'"), "'인내'가");
  assert.equal(iGa('초급 7'), '초급 7이');
  assert.equal(iGa('초급 2'), '초급 2가');
  assert.equal(eulReul('손재주'), '손재주를');
  assert.equal(ro('훈련소'), '훈련소로');
  assert.equal(ro('광장'), '광장으로');
  assert.equal(ro('서쪽 숲'), '서쪽 숲으로');
  assert.equal(ro('마을'), '마을로');
});
