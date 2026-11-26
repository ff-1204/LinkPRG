// M10: 소리재(동네 셋, 뒷골목), 모험가 회관, 고갯길, 2차 전직, 메인 4장과 흐려지는 띠링. 여정: 소은 6, 도현 8.
import { passPhase, talkTo } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, townRooms, enemyView, SAVE_VERSION } from '../src/core/game.js';
import { addItem } from '../src/core/inventory.js';
import { townOf, fameOf } from '../src/core/social.js';
import { boardView, boardToday, mainView } from '../src/core/quests.js';
import { advanceView, jobName } from '../src/core/jobs.js';
import { valueOf } from '../src/core/derived.js';
import { parseSave } from '../src/core/save.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { PEOPLE, BONDS } from '../src/data/people.js';
import { JOBS as BOARD } from '../src/data/quests.js';
import { ADVANCED, JOBS, JOB_ORDER } from '../src/data/jobs.js';
import { MONSTERS } from '../src/data/monsters.js';
import { SEARCH_NEED } from '../src/data/lines.js';

const afterCh3 = (seed = 'm10', origin = 'bard', lode = 'both') => {
  const s = createGame({ name: '소은', origin, spent: { agi: 3, con: 2 }, seed });
  dispatch(s, { type: 'move', to: 'training' });
  dispatch(s, { type: 'move', to: 'plaza' });
  s.level = 21; s.stats.str += 26; s.stats.con += 26; s.stats.agi += 12; s.hp = valueOf(s, 'maxHp'); s.jobAsked = true;
  s.main.done.push({ chapter: 1, path: 'friend', day: 1 }, { chapter: 2, path: 'tell', day: 2 }, { chapter: 3, path: lode, day: 3 });
  s.main.chapter = 4; s.main.called = '자리를 놓은 이';
  s.opened.push('ruins', 'dock', 'bigmarket');
  s.dmem.ruins = { seen: Object.keys((PLACES, {})), done: { 'f1-hall': true, 'f1-store': true, 'f2-vent': true }, nights: 0, keeper: 'tell', bell: true };
  s.dmem.ruins.seen = ['f1-gate', 'f1-hall', 'f1-store', 'f1-watch', 'f1-stair', 'f2-land', 'f2-row', 'f2-vent', 'f2-door', 'f3-stair', 'f3-hall', 'f3-bell'];
  s.flags.keeperAlive = true; s.flags.lode = lode;
  return s;
};
const heal = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; if (s.equip.weapon) s.equip.weapon.dur = 60; };
const fight = (s) => { let n = 0; while (s.battle && n++ < 400) { heal(s); dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); } };
const travel = (s, to) => { let n = 0; while (s.place !== to && n++ < 20) { if (s.battle) fight(s); else dispatch(s, { type: 'travel', to }); } fight(s); assert.equal(s.place, to); };

test('소리재는 3장이 끝나야 길이 난다. 동네 셋과 곳 여덟, 사람 여덟 (H4-1)', () => {
  const fresh = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'lock' });
  assert.ok(mapView(fresh).find((r) => r.id === 'bigmarket').locked);
  const s = afterCh3();
  travel(s, 'bigmarket');
  assert.equal(townOf(s), '소리재');
  assert.equal(fameOf(s), 0);
  assert.equal(TOWNS['소리재'].order.length, 8);
  assert.deepEqual([...new Set(TOWNS['소리재'].order.map((id) => PLACES[id].part))].sort(), ['가운뎃동네', '아랫동네', '윗동네']);
  assert.equal(Object.values(PEOPLE).filter((p) => PLACES[p.place].town === '소리재').length, 8);
  dispatch(s, { type: 'move', to: 'belltower' });
  assert.ok(PLACES.belltower.room.includes('종이 없는 종루'));
  assert.ok(PLACES.belltower.stripAlt.includes('종 없이'));
});

test('뒷골목은 뒷골목과 낯익음 이상이어야 들어간다 (H4-6)', () => {
  const s = afterCh3('alley');
  travel(s, 'bigmarket');
  assert.ok(townRooms(s).find((r) => r.id === 'backalley').closed);
  assert.throws(() => dispatch(s, { type: 'move', to: 'backalley' }), /낯이 익어야/);
  s.factions.alley = 10;
  assert.ok(!townRooms(s).find((r) => r.id === 'backalley').closed);
  dispatch(s, { type: 'move', to: 'backalley' });
  assert.equal(s.place, 'backalley');
});

test('모험가 회관: C 난이도부터의 의뢰가 붙고 용병을 구한다. 고갯길에는 새 괴물이 나온다 (H4-5, M10-2)', () => {
  const s = afterCh3('guild');
  travel(s, 'bigmarket');
  dispatch(s, { type: 'move', to: 'guild' });
  const cards = boardView(s);
  assert.ok(cards.length >= 3);
  for (const c of cards) assert.ok(['C', 'B', 'A', 'S'].includes(c.rank), c.rank);
  assert.ok(boardToday(s).every((id) => BOARD[id].at === 'guild'));
  dispatch(s, { type: 'job', op: 'accept', id: cards[0].id });
  s.silver = 100;
  dispatch(s, { type: 'party', op: 'hire' });
  assert.equal(s.party[0].id, 'gaon');
  // 회관에서 받은 의뢰는 광장에서 끝낼 수 없다
  const id = s.jobs[0].id;
  if (BOARD[id].kind === 'hunt') s.jobs[0].have = BOARD[id].n; else addItem(s, BOARD[id].item, BOARD[id].n);
  dispatch(s, { type: 'job', op: 'finish', id });
  assert.equal(s.jobsDone, 1);
  // 고갯길
  for (const m of ['rockhawk', 'passbear']) assert.ok(MONSTERS[m].level >= 15);
  dispatch(s, { type: 'move', to: 'bigmarket' });
  s.level = 18; // 다섯 레벨 넘게 높으면 달아나 버린다
  travel(s, 'pass');
  const seen = new Set();
  let n = 0;
  while (seen.size < 2 && n++ < 800) {
    if (s.battle) { seen.add(s.battle.mon); s.battle.hp = 1; s.battle.intent = MONSTERS[s.battle.mon].moves[0].id; heal(s); dispatch(s, { type: 'battle', choice: 'attack' }); }
    else if (s.choice) dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'pounce' : slotsNow(s).at(-1).action.id });
    else if (s.place !== 'pass') { if (s.place === 'temple') dispatch(s, { type: 'move', to: 'plaza' }); travel(s, 'pass'); }
    else dispatch(s, { type: 'act', id: 'explore' });
    heal(s);
  }
  assert.deepEqual([...seen].sort(), ['passbear', 'rockhawk']);
});

test('2차 전직: 장인 거리에서, 레벨 20, 둘 중 하나. 되돌릴 수 없다 (M10-3, 도현 8)', () => {
  for (const id of JOB_ORDER) assert.equal(Object.values(ADVANCED).filter((a) => a.from === id).length, 2, JOBS[id].name);
  const s = afterCh3('adv', 'smithboy');
  s.level = 19;
  s.job = 'warrior';
  travel(s, 'bigmarket');
  assert.throws(() => dispatch(s, { type: 'advance', id: 'knight' }), /장인 거리/);
  dispatch(s, { type: 'move', to: 'craftrow' });
  assert.deepEqual(advanceView(s).list.map((x) => x.name), ['기사', '광전사']);
  assert.ok(!advanceView(s).can);
  assert.throws(() => dispatch(s, { type: 'advance', id: 'knight' }), /레벨 20/);
  s.level = 20;
  assert.throws(() => dispatch(s, { type: 'advance', id: 'marksman' }), /갈라지는 길이 아닙니다/);
  const hp = valueOf(s, 'maxHp');
  const ev = dispatch(s, { type: 'advance', id: 'knight' });
  assert.equal(jobName(s), '기사');
  assert.equal(valueOf(s, 'maxHp'), hp + 40);
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'job'));
  assert.throws(() => dispatch(s, { type: 'advance', id: 'berserker' }), /한 번뿐/);
  assert.ok(s.journal.some((j) => j.note === '기사가 된 날'));
  // 광전사는 생명력이 절반 아래일 때 더 세다
  const dmg = (job2, hpRate) => { let sum = 0; for (let i = 0; i < 200; i++) { const t = afterCh3('rage' + i, 'smithboy'); t.job = 'warrior'; t.job2 = job2; t.place = 'forest'; t.hp = Math.round(valueOf(t, 'maxHp') * hpRate); t.battle = { mon: 'crab', hp: 9999, turn: 2, intent: 'shell', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 }; t.status = []; dispatch(t, { type: 'battle', choice: 'attack' }); sum += 9999 - t.battle.hp; } return sum / 200; };
  assert.ok(dmg('berserker', 0.3) > dmg(null, 0.3) * 1.15);
  assert.ok(Math.abs(dmg('berserker', 1) - dmg(null, 1)) < dmg(null, 1) * 0.06);
});

test('4장 동안만 띠링 셋에 하나가 늦게·흐리게 온다. 미뤄도 더 나빠지지 않는다 (M10-5, S1-3)', () => {
  const rate = (s, days) => {
    s.place = 'training'; s.skills.strike = { grade: 0, xp: 0, uses: 0 };
    for (let d = 0; d < days; d++) { for (let i = 0; i < 3; i++) { s.place = 'plaza'; passPhase(s); s.full = 80; } }
    s.place = 'training';
    const before = s.dings.length;
    for (let i = 0; i < 400; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
    const got = s.dings.slice(before);
    return got.filter((d) => d.faint).length / got.length;
  };
  const early = afterCh3('faint');
  const r1 = rate(early, 0);
  assert.ok(r1 > 0.2 && r1 < 0.45, `흐린 띠링의 몫 ${r1}`);
  const late = afterCh3('faint');
  const r2 = rate(late, 30);
  assert.ok(Math.abs(r2 - r1) < 0.1, `한 달을 미뤄도 그대로다 (${r1} → ${r2})`);
  const other = afterCh3('faint'); other.main.chapter = 3;
  assert.equal(rate(other, 0), 0, '4장이 아니면 흐려지지 않는다');
  // 가상 유저들이 띠링 이야기를 한다
  const s = afterCh3('chat');
  s.place = 'training';
  for (let i = 0; i < 400; i++) { dispatch(s, { type: 'act', id: 'strike' }, { chatter: 'high' }); s.full = 80; }
  assert.ok(s.log.some((l) => l.k === 'user' && /알림|띠링/.test(l.text)));
});

const toRoom = (s, room) => { travel(s, 'ruins'); dispatch(s, { type: 'dungeon', op: 'enter', id: 'ruins' }); for (const id of ['f1-hall', 'f1-store', 'f1-watch', 'f1-stair', 'f2-land', 'f2-row', 'f2-vent', 'f2-door', 'f3-stair', 'f3-hall', 'f3-bell']) { dispatch(s, { type: 'room', to: id }); fight(s); heal(s); if (id === room) break; } assert.equal(s.dungeon.room, room); };

test('메인 4장: 기록의 길. 서고를 열두 번 뒤지면 서약문이 맞춰진다 (소은 6)', () => {
  const s = afterCh3('ch4a');
  const v = mainView(s);
  assert.equal(v.name, '흐려지는 띠링');
  assert.equal(v.paths.length, 4);
  travel(s, 'bigmarket');
  dispatch(s, { type: 'move', to: 'archive' });
  for (let i = 1; i < SEARCH_NEED; i++) { dispatch(s, { type: 'act', id: 'search', times: 12 }); assert.equal(s.flags.archive, i); assert.equal(s.main.chapter, 4); s.full = 80; }
  assert.deepEqual([mainView(s).nearest.id, mainView(s).nearest.have], ['archive', 11]);
  const ev = dispatch(s, { type: 'act', id: 'search' });
  assert.equal(s.main.chapter, 5);
  assert.equal(s.main.done[3].path, 'archive');
  assert.equal(s.main.called, '기록을 맞춘 이');
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'main').ding;
  assert.equal(d.faint, false, '장을 끝내는 띠링은 흐려지지 않는다');
  assert.ok(ev.some((e) => e.type === 'line' && e.line.text.includes('약속')));
  assert.ok(s.skills.appraise.uses >= 12);
  assert.equal(mainView(s).name, '마지막 울림');
  // 지난 알림에서 첫 띠링을 다시 열면 그때의 대화방이 남아 있다
  assert.ok(Array.isArray(s.dings[0]?.context ?? []));
});

test('메인 4장: 핏줄의 길, 문지기의 길, 종의 길, 그리고 종이 먼저 말을 거는 길', () => {
  // 핏줄: 종루지기와 단골
  const a = afterCh3('ch4b');
  travel(a, 'bigmarket');
  dispatch(a, { type: 'move', to: 'belltower' });
  a.people.heir = { pts: BONDS[2].at - 1, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  talkTo(a, 'heir');
  assert.equal(a.main.done[3].path, 'heir');
  // 문지기: 살아 있어야 한다
  const b = afterCh3('ch4c');
  toRoom(b, 'f2-door');
  assert.ok(slotsNow(b).some((x) => x.label === '문지기에게 묻는다'));
  dispatch(b, { type: 'ask', who: 'keeper' });
  assert.equal(b.main.done[3].path, 'keeper');
  const dead = afterCh3('ch4d'); dead.flags.keeperAlive = false; dead.dmem.ruins.keeper = 'beat';
  toRoom(dead, 'f2-door');
  assert.ok(!slotsNow(dead).some((x) => x.label === '문지기에게 묻는다'));
  assert.throws(() => dispatch(dead, { type: 'ask', who: 'keeper' }), /이제 없습니다/);
  // 종: 지혜 판정. 하루에 한 번
  const c = afterCh3('ch4e');
  toRoom(c, 'f3-bell');
  c.stats.wis = 40;
  dispatch(c, { type: 'ask', who: 'bell' });
  assert.equal(c.main.done[3].path, 'bell');
  const c2 = afterCh3('ch4f');
  toRoom(c2, 'f3-bell');
  c2.stats.wis = 1;
  let n = 0;
  while (c2.main.chapter === 4 && n++ < 5) { c2.flags.bellDay = 0; dispatch(c2, { type: 'ask', who: 'bell' }); if (c2.main.chapter === 4) { assert.throws(() => dispatch(c2, { type: 'ask', who: 'bell' }), /오늘은/); } }
  // 숨은 길: 히든 스탯 다섯
  const d = afterCh3('ch4g');
  for (const id of ['endure', 'kind', 'luck', 'stealth', 'charm']) d.hidden[id] = { value: 1, half: true };
  d.counters.act.strike = 300; d.counters.kind = 20; d.counters.rare = 10; d.counters.watch = 30; d.counters.npcs = Array.from({ length: 30 }, (_, i) => 'n' + i);
  assert.ok(!JSON.stringify(mainView(d)).includes('먼저 말'));
  toRoom(d, 'f3-bell');
  assert.equal(d.main.done[3].path, 'hidden');
  assert.equal(d.main.called, '종이 알아본 이');
});

test('8판 저장은 9판으로 올라온다', () => {
  const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'v8' });
  const old = JSON.parse(JSON.stringify(s));
  delete old.job2; old.v = 8;
  const up = parseSave(JSON.stringify({ v: 8, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.job2, null);
  // 직업과 맞지 않는 2차 전직(히든 직업으로 갈아탄 옛 저장)은 읽을 때 내려놓는다
  assert.equal(parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), job: 'mage', job2: 'knight' } })).state.job2, null);
});
