// M11: 메인 5장과 끝 넷, 끝난 뒤의 세계. 여정: 소은 7·8.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, enemyView, SAVE_VERSION } from '../src/core/game.js';
import { endingChoices, hiddenEnding, ringView, afterText } from '../src/core/ending.js';
import { choiceView } from '../src/core/explore.js';
import { mainView } from '../src/core/quests.js';
import { hiddenSlots, hiddenTotal, foundCount } from '../src/core/hidden.js';
import { noticesView } from '../src/core/world.js';
import { valueOf } from '../src/core/derived.js';
import { saveTo, loadFrom, listSlots, parseSave } from '../src/core/save.js';
import { BONDS } from '../src/data/people.js';

const atBell = (seed = 'm11', opts = {}) => {
  const s = createGame({ name: '소은', origin: 'bard', spent: { agi: 3, con: 2 }, seed });
  dispatch(s, { type: 'move', to: 'training' });
  s.level = 25; s.stats.str += 30; s.stats.con += 30; s.stats.agi += 14; s.hp = valueOf(s, 'maxHp'); s.jobAsked = true;
  s.main.done.push({ chapter: 1, path: 'friend', day: 1 }, { chapter: 2, path: 'tell', day: 2 }, { chapter: 3, path: opts.lode || 'both', day: 3 }, { chapter: 4, path: 'archive', day: 4 });
  s.main.chapter = 5;
  s.opened.push('ruins', 'dock', 'bigmarket');
  s.dmem.ruins = { seen: ['f1-gate', 'f1-hall', 'f1-store', 'f1-watch', 'f1-stair', 'f2-land', 'f2-row', 'f2-vent', 'f2-door', 'f3-stair', 'f3-hall', 'f3-bell'], done: { 'f1-hall': true, 'f1-store': true, 'f2-vent': true }, nights: 0, keeper: opts.keeper || 'tell', bell: true };
  s.flags.keeperAlive = (opts.keeper || 'tell') !== 'beat';
  s.flags.lode = opts.lode || 'both';
  if (opts.prep) opts.prep(s);
  s.place = 'ruins';
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'ruins' });
  for (const id of ['f1-hall', 'f1-store', 'f1-watch', 'f1-stair', 'f2-land', 'f2-row', 'f2-vent', 'f2-door', 'f3-stair', 'f3-hall', 'f3-bell']) {
    dispatch(s, { type: 'room', to: id });
    let n = 0;
    while (s.battle && n++ < 300) { s.hp = valueOf(s, 'maxHp'); if (s.equip.weapon) s.equip.weapon.dur = 60; dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); }
  }
  assert.equal(s.dungeon.room, 'f3-bell');
  return s;
};
const family = (s) => { for (const id of ['granny', 'instructor', 'smith', 'keeper', 'priest']) s.people[id] = { pts: BONDS[4].at, talked: 0, likes: [], dislikes: [], stats: [], met: true }; };

test('5장: 살아온 방식에 따라 고를 수 있는 끝이 다르다. 못 고르는 끝은 까닭과 함께 흐리게 보인다 (M11-1)', () => {
  const s = atBell('c1', { lode: 'merchants', keeper: 'beat' });
  assert.equal(mainView(s).name, '마지막 울림');
  assert.equal(mainView(s).paths.length, 3);
  assert.ok(!JSON.stringify(mainView(s)).includes('서로 답한다'));
  assert.ok(slotsNow(s).some((x) => x.label === '종 앞에 선다'));
  dispatch(s, { type: 'ending' });
  assert.equal(s.choice.kind, 'ending');
  const v = choiceView(s);
  assert.equal(v.options.length, 4);
  const mend = v.options.find((o) => o.id === 'mend');
  assert.ok(mend.disabled);
  assert.ok(mend.why.includes('대장'));
  assert.ok(!v.options.find((o) => o.id === 'free').disabled, '푼다는 누구나 고를 수 있다');
  assert.ok(v.options.find((o) => o.id === 'keep').disabled);
  assert.throws(() => dispatch(s, { type: 'choose', id: 'mend' }), /대장/);
  dispatch(s, { type: 'choose', id: 'back' });
  assert.equal(s.choice, null);
  assert.equal(s.ending, null, '고르지 않고 물러날 수 있다');
  // 조건을 하나씩 채우면 열린다
  s.work = 'smith';
  assert.ok(endingChoices(s).find((c) => c.id === 'mend').why.includes('울림쇠'), '상단에 넘겼으면 울림쇠가 없다');
  s.flags.lode = 'miners';
  assert.ok(endingChoices(s).find((c) => c.id === 'mend').can);
  for (const id of ['endure', 'kind', 'luck', 'stealth', 'charm']) s.hidden[id] = { value: 1, half: true };
  assert.ok(endingChoices(s).find((c) => c.id === 'keep').why.includes('문지기'));
});

test('끝 "잇는다": 띠링이 또렷해지고 새 히든 스탯이 하나 생긴다. 게임은 이어진다 (M11-2)', () => {
  const s = atBell('mend', { lode: 'miners', prep: (x) => { x.skills.smithing = { grade: 27, xp: 0, uses: 0 }; } });
  assert.equal(hiddenTotal(s), 13);
  dispatch(s, { type: 'ending' });
  const ev = dispatch(s, { type: 'choose', id: 'mend' });
  assert.equal(s.ending, 'mend');
  assert.equal(s.main.chapter, 6);
  assert.equal(s.main.done[4].path, 'mend');
  assert.equal(s.main.called, '종을 이은 이');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'ending'));
  assert.ok(mainView(s).name.includes('끝난 뒤'));
  assert.ok(afterText(s).includes('또렷'));
  assert.equal(hiddenTotal(s), 14);
  assert.ok(hiddenSlots(s).some((x) => x.id === 'echo' && !x.found && x.name === undefined), '새 히든도 찾기 전에는 이름이 없다');
  // 세계는 이어진다: 나가서 허수아비를 친다. 띠링이 쌓이면 열세 번째가 생긴다
  for (const id of ['f3-hall', 'f3-stair', 'f2-door', 'f2-vent', 'f2-row', 'f2-land', 'f1-stair', 'f1-watch', 'f1-store', 'f1-hall', 'f1-gate']) dispatch(s, { type: 'room', to: id });
  dispatch(s, { type: 'dungeon', op: 'leave' });
  s.place = 'training';
  const before = foundCount(s);
  let n = 0;
  while (!(s.hidden.echo?.value > 0) && n++ < 3000) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
  assert.ok(s.hidden.echo.value >= 1);
  assert.ok(foundCount(s) > before);
  assert.ok(s.dings.at(-1).clear, '또렷한 띠링');
});

test('끝 "푼다": 큰 띠링이 사라지고, 히든 스탯의 문턱이 모두 보인다 (M11-3)', () => {
  const s = atBell('free');
  assert.ok(hiddenSlots(s).filter((x) => !x.found).every((x) => x.name === undefined && x.need === undefined));
  dispatch(s, { type: 'ending' });
  dispatch(s, { type: 'choose', id: 'free' });
  assert.equal(s.ending, 'free');
  const open = hiddenSlots(s).filter((x) => !x.found);
  assert.equal(open.length, 13);
  for (const x of open) { assert.ok(x.name && x.need > 0 && x.how && x.have >= 0, x.id); }
  assert.equal(open.find((x) => x.id === 'endure').need, 300);
  // 큰 띠링은 더 울리지 않는다
  s.dungeon = null; s.place = 'training';
  const from = s.dings.length;
  for (let i = 0; i < 300; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
  assert.ok(s.hidden.endure.value >= 1);
  assert.ok(s.dings.slice(from).every((d) => d.level <= 2), '귀함보다 큰 띠링이 없다');
  assert.ok(s.dings.some((d) => d.title.includes('인내')));
});

test('끝 "맡는다": 내 띠링은 울리지 않고, 남의 끈기를 지켜보고 울려 줄 수 있다 (M11-4)', () => {
  const s = atBell('keep', { prep: (x) => { for (const id of ['endure', 'kind', 'luck', 'stealth', 'charm']) x.hidden[id] = { value: 1, half: true }; x.counters.act.strike = 300; x.counters.kind = 20; x.counters.rare = 10; x.counters.watch = 30; x.counters.npcs = Array.from({ length: 30 }, (_, i) => 'n' + i); } });
  assert.equal(ringView(s), null);
  dispatch(s, { type: 'ending' });
  dispatch(s, { type: 'choose', id: 'keep' });
  assert.equal(s.ending, 'keep');
  const v = ringView(s);
  assert.equal(v.list.length, 3);
  assert.ok(v.list.every((x) => x.name && x.what));
  assert.deepEqual(ringView(s), v, '같은 날에는 같은 이들이다');
  dispatch(s, { type: 'ring', k: 0 });
  assert.equal(s.rung.total, 1);
  assert.throws(() => dispatch(s, { type: 'ring', k: 0 }), /이미 답해/);
  assert.ok(noticesView(s).some((n) => n.mine && n.text.includes('띠링이 울렸습니다')));
  assert.ok(ringView(s).list[0].done);
  // 내 띠링은 더 울리지 않는다
  s.dungeon = null; s.place = 'training'; s.skills.strike = { grade: 0, xp: 0, uses: 0 };
  const before = s.dings.length;
  for (let i = 0; i < 60; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
  const mine = s.dings.slice(before);
  assert.ok(mine.length > 0);
  assert.ok(mine.every((d) => d.silent && d.level === 1));
  assert.ok(s.log.some((l) => l.text.includes('종은 울리지 않았다')));
  // 다음 날에는 다른 이들이 보인다
  s.day += 1;
  assert.ok(ringView(s).list.every((x) => !x.done));
});

test('숨은 끝 "서로 답한다": 선택지에 없다. 조건을 채우면 고르지 않고 이 끝이 된다 (M11-5, 소은 7)', () => {
  const half = atBell('h0', { prep: family });
  assert.equal(hiddenEnding(half), false, '사람만으로는 모자라다');
  const s = atBell('hidden', { prep: (x) => {
    family(x);
    for (const f of ['miners', 'merchants', 'temple', 'alley']) x.factions[f] = 30;
    x.party.push({ id: 'miru', hp: 60, row: 'back', plan: 'half', crossed: 0, bond: 40, down: false, day: 1 }, { id: 'stonerabbit', hp: 80, row: 'front', plan: 'mefirst', crossed: 0, bond: 40, down: false, day: 1 });
  } });
  assert.ok(hiddenEnding(s));
  // 대장 달인이 아니라 "잇는다"는 고를 수 없다
  assert.ok(!endingChoices(s).find((c) => c.id === 'mend').can);
  const ev = dispatch(s, { type: 'ending' });
  assert.equal(s.choice, null, '고르는 창이 뜨지 않는다');
  assert.equal(s.ending, 'hidden');
  assert.equal(s.main.done[4].path, 'hidden');
  assert.ok(ev.some((e) => e.type === 'line' && e.line.text.includes('봤어. 네가 한 거.')));
  assert.equal(s.main.called, '모두가 본 이');
  // 8단계: 끝난 뒤에도 세계는 이어지고, 띠링 대신 사람들의 말이 대화방에 뜬다
  s.dungeon = null; s.place = 'training'; s.skills.strike = { grade: 0, xp: 0, uses: 0 };
  const log = s.log.length;
  for (let i = 0; i < 60; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
  const voices = s.log.slice(log).filter((l) => l.k === 'npc' && /봤|보이더군/.test(l.text));
  assert.ok(voices.length >= 1);
  assert.ok(!s.log.slice(log).some((l) => l.k === 'ding'), '띠링 줄은 없다');
  assert.ok(ringView(s).verb.includes('봤다고'));
  // 다른 끝을 보려고 둘째 저장 칸에 새 사람을 만든다
  const m = new Map();
  const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  saveTo(st, 0, s, 1);
  saveTo(st, 1, createGame({ name: '또 다른 나', origin: 'farmer', spent: {}, seed: 'again' }), 2);
  const slots = listSlots(st);
  assert.equal(slots[0].name, '소은');
  assert.equal(slots[1].name, '또 다른 나');
  assert.equal(loadFrom(st, 0).ending, 'hidden');
  assert.equal(loadFrom(st, 1).ending, null);
});

test('끝은 한 번만 고른다. 9판 저장은 10판으로 올라온다', () => {
  const s = atBell('once');
  dispatch(s, { type: 'ending' });
  dispatch(s, { type: 'choose', id: 'free' });
  assert.throws(() => dispatch(s, { type: 'ending' }), /설 때가 아닙니다/);
  assert.ok(!slotsNow(s).some((x) => x.label === '종 앞에 선다'));
  const old = JSON.parse(JSON.stringify(createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'v9' })));
  delete old.ending; delete old.endDay; delete old.rung; old.v = 9;
  const up = parseSave(JSON.stringify({ v: 9, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.ending, null);
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), ending: 'boom' } })), /모르는 끝/);
});
