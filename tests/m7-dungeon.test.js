// M7: 던전(층과 방, 지도, 쉼터), 함정과 잠긴 문, 속성, 우두머리, 메인 2장. 여정: 도현 4~7, 소은 3.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, roomView, dungeonMap, enemyView, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { statChance, pickChance, tellChance } from '../src/core/dungeon.js';
import { elementMult } from '../src/core/battle.js';
import { choiceView } from '../src/core/explore.js';
import { mainView } from '../src/core/quests.js';
import { valueOf } from '../src/core/derived.js';
import { parseSave } from '../src/core/save.js';
import { DUNGEONS, BEATS, ELEMENTS } from '../src/data/dungeon.js';
import { MONSTERS } from '../src/data/monsters.js';

const inRuins = (seed = 'm7', origin = 'smithboy') => {
  const s = createGame({ name: '도현', origin, spent: { str: 3, con: 2 }, seed });
  dispatch(s, { type: 'move', to: 'training' });
  s.level = 12; s.stats.str += 14; s.stats.con += 14; s.stats.agi += 6; s.hp = valueOf(s, 'maxHp'); s.jobAsked = true;
  s.main.done.push({ chapter: 1, path: 'fight', day: 1 }); s.main.chapter = 2; s.opened.push('ruins');
  s.place = 'ruins';
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'ruins' });
  return s;
};
const heal = (s) => { s.hp = valueOf(s, 'maxHp'); s.full = 80; if (s.equip.weapon) s.equip.weapon.dur = 60; };
const fight = (s) => { let n = 0; while (s.battle && n++ < 400) { heal(s); dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); } };
const goRoom = (s, to) => { dispatch(s, { type: 'room', to }); };

test('던전: 방 목록에 "이 방에서 갈 수 있는 곳"이 뜨고, 가 보지 않은 방은 이름을 모른다 (T15)', () => {
  const s = inRuins();
  const v = roomView(s);
  assert.equal(v.dungeon, '폐허');
  assert.equal(v.floor, '지하 1층');
  assert.equal(v.name, '돌문 안');
  assert.deepEqual(v.exits.map((x) => x.name), ['가 보지 않은 곳']);
  assert.ok(v.canLeave);
  assert.throws(() => dispatch(s, { type: 'move', to: 'plaza' }), /던전 안/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'plaza' }), /던전 안/);
  assert.throws(() => goRoom(s, 'f1-watch'), /갈 수 없는 곳/);
  assert.ok(slotsNow(s).some((x) => x.label === '밖으로 나간다'));
  // 방 종류 여섯이 모두 있다
  const kinds = new Set(Object.values(DUNGEONS.ruins.rooms).map((r) => r.kind));
  for (const k of ['fight', 'trap', 'door', 'treasure', 'rest', 'boss']) assert.ok(kinds.has(k), k);
  for (const [id, r] of Object.entries(DUNGEONS.ruins.rooms)) { for (const e of r.exits) assert.ok(DUNGEONS.ruins.rooms[e].exits.includes(id), `${id} ↔ ${e}`); if (r.mon) assert.ok(MONSTERS[r.mon]); }
});

test('지나온 방만 지도에 그려진다. 나갔다 오면 지도는 남고 괴물은 다시 찬다 (T18, M7-6)', () => {
  const s = inRuins('map');
  assert.deepEqual(dungeonMap(s)[0].rooms.map((r) => r.name), ['돌문 안']);
  goRoom(s, 'f1-hall');
  dispatch(s, { type: 'choose', id: 'dodge' });
  assert.deepEqual(dungeonMap(s)[0].rooms.map((r) => r.id), ['f1-gate', 'f1-hall']);
  assert.ok(dungeonMap(s)[0].rooms.find((r) => r.id === 'f1-hall').here);
  goRoom(s, 'f1-forge');
  assert.ok(s.battle, '싸움 방에 들어서면 싸운다');
  fight(s);
  assert.ok(s.dungeon.cleared['f1-forge']);
  goRoom(s, 'f1-nook');
  assert.equal(countOf(s, 'ironore'), 4, '보물은 들어서면 챙긴다');
  assert.equal(countOf(s, 'ruinkey'), 1, '쇠문의 열쇠는 문보다 앞에서 얻을 수 있다');
  const silver = s.silver;
  // 나갔다 온다
  goRoom(s, 'f1-forge'); goRoom(s, 'f1-hall'); goRoom(s, 'f1-gate');
  assert.equal(s.choice, null, '한 번 지난 함정은 다시 걸리지 않는다');
  dispatch(s, { type: 'dungeon', op: 'leave' });
  assert.equal(s.dungeon, null);
  assert.equal(dungeonMap(s, 'ruins')[0].rooms.length, 4, '지도는 남는다');
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'ruins' });
  assert.deepEqual(roomView(s).exits.map((x) => x.name), ['긴 복도']);
  goRoom(s, 'f1-hall'); goRoom(s, 'f1-forge');
  assert.ok(s.battle, '괴물은 다시 찼다');
  fight(s);
  goRoom(s, 'f1-nook');
  assert.equal(s.silver, silver, '보물은 다시 차지 않는다');
});

test('싸움 방의 일이 끝나기 전에는 지나온 방으로만 돌아갈 수 있다', () => {
  const s = inRuins('block');
  goRoom(s, 'f1-hall');
  assert.equal(s.choice.kind, 'trap');
  dispatch(s, { type: 'choose', id: 'back' });
  assert.equal(s.dungeon.room, 'f1-gate');
  goRoom(s, 'f1-hall');
  dispatch(s, { type: 'choose', id: 'disarm' });
  goRoom(s, 'f1-forge');
  s.battle = null; // 싸움이 끝나지 않은 채라고 치면
  assert.ok(!roomView(s).exits.find((x) => x.id === 'f1-nook').can);
  assert.throws(() => goRoom(s, 'f1-nook'), /넘어야/);
  goRoom(s, 'f1-hall');
});

test('함정은 스탯 판정이다. 만 번의 성공 비율이 보이는 확률과 맞는다 (T16, M7-3)', () => {
  const s = inRuins('trap');
  goRoom(s, 'f1-hall');
  const v = choiceView(s);
  assert.equal(v.kind, 'trap');
  const shown = Math.round(statChance(s, DUNGEONS.ruins.rooms['f1-hall'].trap.dodge) * 100);
  assert.ok(v.options[0].label.includes(`성공 ${shown}%`), '확률이 고르기 전에 보인다');
  s.stats.agi = 12; // 55%
  let ok = 0;
  const N = 10000;
  for (let i = 0; i < N; i++) {
    s.dmem.ruins.done = {}; s.choice = { kind: 'trap', room: 'f1-hall' }; s.hp = 500; s.log = [];
    const ev = dispatch(s, { type: 'choose', id: 'dodge' });
    if (ev.find((e) => e.type === 'check').ok) ok++;
  }
  assert.ok(Math.abs(ok / N - 0.55) < 0.015, `${ok / N}`);
  // 실패하면 다친다
  s.stats.agi = 1; s.dmem.ruins.done = {}; s.choice = { kind: 'trap', room: 'f1-hall' }; s.hp = 100;
  let hurt = false;
  for (let i = 0; i < 30 && !hurt; i++) { s.dmem.ruins.done = {}; s.choice = { kind: 'trap', room: 'f1-hall' }; s.hp = 100; dispatch(s, { type: 'choose', id: 'dodge' }); hurt = s.hp === 82; }
  assert.ok(hurt, '밟으면 18 피해');
});

test('잠긴 문: 따기·부수기·열쇠. 부수면 다음 방의 적이 먼저 움직인다 (T17)', () => {
  const open = (seed) => { const s = inRuins(seed); goRoom(s, 'f1-hall'); dispatch(s, { type: 'choose', id: 'disarm' }); goRoom(s, 'f1-store'); return s; };
  // 잠겨 있으면 못 간다
  const a = open('doorA');
  assert.equal(choiceView(a).kind, 'door');
  assert.ok(choiceView(a).options.find((o) => o.id === 'key').disabled);
  dispatch(a, { type: 'choose', id: 'back' });
  goRoom(a, 'f1-store');
  a.choice = null;
  assert.throws(() => goRoom(a, 'f1-watch'), /잠겨|넘어야/);
  // 부순다 → 소리가 나서 다음 방의 적이 먼저 덤빈다
  a.choice = { kind: 'door', room: 'f1-store' };
  a.stats.str = 40;
  dispatch(a, { type: 'choose', id: 'force' });
  assert.ok(a.dungeon.alert);
  const hp = a.hp;
  const ev = [];
  ev.push(...dispatch(a, { type: 'room', to: 'f1-watch' }));
  assert.ok(ev.some((e) => e.type === 'line' && /적이 먼저 움직인다/.test(e.line.text)));
  assert.ok(a.hp < hp || ev.some((e) => e.type === 'line' && /숨 고르기|비명|막아섰다/.test(e.line.text)) || a.battle);
  // 따기: 자물쇠 숙련도가 오르고, 실패해도 다시 해 볼 수 있다
  const b = open('doorB');
  let n = 0;
  while (b.choice && n++ < 200) dispatch(b, { type: 'choose', id: 'pick' });
  assert.equal(b.choice, null);
  assert.ok(b.skills.lockpick.uses >= 1);
  assert.equal(b.dungeon.alert, false, '따면 소리가 나지 않는다');
  dispatch(b, { type: 'room', to: 'f1-watch' });
  assert.ok(pickChance(b, 2) > 0);
  // 열쇠
  const c = open('doorC');
  addItem(c, 'ruinkey', 1);
  dispatch(c, { type: 'choose', id: 'key' });
  assert.equal(countOf(c, 'ruinkey'), 0);
  assert.equal(c.choice, null);
});

test('쉼터는 한 번만 쉴 수 있다 (T19)', () => {
  const s = inRuins('rest');
  s.dmem.ruins.done = { 'f1-hall': true, 'f1-store': true };
  s.dungeon.cleared['f1-watch'] = true;
  goRoom(s, 'f1-hall'); goRoom(s, 'f1-store'); goRoom(s, 'f1-watch'); goRoom(s, 'f1-rest');
  s.hp = 10;
  assert.equal(slotsNow(s)[0].label, '쉬기');
  dispatch(s, { type: 'dungeon', op: 'rest' });
  assert.equal(s.hp, 10 + Math.round(valueOf(s, 'maxHp') * 0.5));
  assert.throws(() => dispatch(s, { type: 'dungeon', op: 'rest' }), /이미 쉬었습니다/);
  assert.ok(slotsNow(s)[0].disabled);
});

test('속성 여섯: 약점은 1.5배, 버티는 속성은 절반. 맞혀 보면 도감에 적힌다 (T23)', () => {
  assert.equal(ELEMENTS.length, 6);
  assert.equal(elementMult('물', '불'), 1.5);
  assert.equal(elementMult('불', '물'), 0.5);
  assert.equal(elementMult('불', '바람'), 1.5);
  assert.equal(elementMult('바람', '땅'), 1.5);
  assert.equal(elementMult('땅', '물'), 1.5);
  assert.equal(elementMult('빛', '어둠'), 1.5);
  assert.equal(elementMult('어둠', '빛'), 1.5);
  assert.equal(elementMult('물', '땅'), 0.5);
  assert.equal(elementMult('물', '바람'), 1);
  assert.equal(elementMult(null, '불'), 1);
  for (const e of ELEMENTS) assert.ok(ELEMENTS.includes(BEATS[e]));
  // 물 주머니: 불 속성 적에게 1.5배
  const s = inRuins('elem');
  s.battle = { mon: 'gatekeeper', hp: 100, turn: 3, intent: 'slam', stun: 9, weak: null, burn: 0, ward: null, streak: 0, phase: 1 }; s.status = [];
  addItem(s, 'waterpouch', 2);
  const ev = dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'waterpouch') });
  assert.equal(s.battle.hp, 100 - 24);
  assert.ok(ev.some((e) => e.type === 'line' && /약점을 찔렀다/.test(e.line.text)));
  assert.equal(s.dex.mon.gatekeeper.elems['물>불'], 1.5);
  // 땅 속성일 때는 물이 잘 듣지 않는다
  s.battle.phase = 0; s.battle.hp = 200; s.battle.stun = 9;
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'waterpouch') });
  assert.equal(s.battle.hp, 200 - 8);
  s.battle = null;
  assert.throws(() => { addItem(s, 'torch', 1); dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'torch') }); }, /싸움에서 쓰는/);
});

test('우두머리: 생명력 절반에서 불 속성으로 바뀌고 "불 숨"을 예고한다 (T22, M7-5)', () => {
  const s = inRuins('boss');
  s.battle = { mon: 'gatekeeper', hp: 140, turn: 1, intent: 'still', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 }; s.status = [];
  assert.equal(enemyView(s).element, '땅');
  assert.equal(enemyView(s).stages, 3);
  s.stats.str = 60;
  const ev = dispatch(s, { type: 'battle', choice: 'attack' });
  assert.ok(s.battle.hp <= 130);
  assert.equal(s.battle.phase, 1);
  assert.ok(ev.some((e) => e.type === 'line' && e.line.who === '국면이 바뀌었다' && e.line.text.includes('불')));
  assert.equal(enemyView(s).element, '불');
  assert.ok(['달군 팔', '불 숨'].includes(enemyView(s).next.name), '바뀐 국면의 행동을 예고한다');
  // 불 숨이 예고되면 막는다
  let seen = false;
  for (let i = 0; i < 40 && s.battle && !seen; i++) { s.hp = valueOf(s, 'maxHp'); s.battle.hp = 120; if (enemyView(s).next.name === '불 숨') { seen = true; const hp = s.hp; dispatch(s, { type: 'battle', choice: 'defend' }); assert.equal(s.hp, hp); } else dispatch(s, { type: 'battle', choice: 'defend' }); }
  assert.ok(seen, '불 숨이 예고된다');
  // 셋째 국면
  s.battle.hp = 40; s.battle.intent = 'breath'; s.hp = valueOf(s, 'maxHp'); s.stats.str = 12;
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.battle.phase, 2);
});

const toKeeper = (seed, origin) => {
  const s = inRuins(seed, origin);
  s.dmem.ruins.done = { 'f1-hall': true, 'f1-store': true, 'f2-vent': true };
  for (const id of ['f1-hall', 'f1-store', 'f1-watch', 'f1-stair', 'f2-land', 'f2-row', 'f2-vent', 'f2-door']) {
    goRoom(s, id);
    fight(s);
    heal(s);
  }
  assert.equal(s.dungeon.room, 'f2-door');
  assert.equal(s.choice.kind, 'keeper');
  return s;
};
const toBell = (s) => { goRoom(s, 'f3-stair'); goRoom(s, 'f3-hall'); fight(s); heal(s); return dispatch(s, { type: 'room', to: 'f3-bell' }); };

test('메인 2장: 문지기를 쓰러뜨리고 종 앞에 서면 "쓰러뜨리는 길"로 끝난다 (M7-7, 도현 7)', () => {
  const s = toKeeper('ch2a');
  assert.equal(mainView(s).name, '폐허의 소리');
  assert.equal(mainView(s).paths.length, 4);
  assert.ok(!JSON.stringify(mainView(s)).includes('사흘'));
  assert.throws(() => goRoom(s, 'f3-stair'), /먼저 정해야|넘어야/);
  dispatch(s, { type: 'choose', id: 'fight' });
  assert.equal(s.battle.mon, 'gatekeeper');
  // 미루와 함께 싸운다. 둘째 국면에서 물 주머니로 약점을 찌르고, 방침을 "치유만"으로 바꾼다
  s.party.push({ id: 'miru', hp: 60, row: 'back', plan: 'half', crossed: 0, bond: 10, down: false, day: 1 });
  addItem(s, 'waterpouch', 6);
  let threw = 0, changed = false, n = 0;
  while (s.battle && n++ < 600) {
    s.hp = Math.max(s.hp, 120); s.equip.weapon.dur = 60;
    const e = enemyView(s);
    if (e.element === '불' && !changed) { dispatch(s, { type: 'party', op: 'plan', id: 'miru', plan: 'healonly' }); changed = true; }
    if (e.next.kind === 'charge') dispatch(s, { type: 'battle', choice: 'defend' });
    else if (e.element === '불' && countOf(s, 'waterpouch') > 0) { const before = s.battle.hp; dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'waterpouch') }); if (s.battle && before - s.battle.hp >= 24) threw++; else if (!s.battle) threw++; }
    else dispatch(s, { type: 'battle', choice: 'attack' });
  }
  assert.equal(s.battle, null);
  assert.ok(threw >= 1, '물 주머니가 1.5배로 들어갔다');
  assert.ok(changed);
  assert.equal(s.dmem.ruins.keeper, 'beat');
  assert.equal(s.flags.keeperAlive, false);
  assert.equal(s.main.chapter, 2, '종 앞에 서야 장이 끝난다');
  const ev = toBell(s);
  assert.equal(s.main.chapter, 3);
  assert.equal(s.main.done[1].path, 'beat');
  assert.equal(s.main.called, '문을 부순 이');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'main'));
  assert.ok(ev.some((e) => e.type === 'line' && e.line.text.includes('금')));
});

test('메인 2장: 말로 알리는 길. 설득 판정이 통하면 문지기가 비켜서고 살아 있다 (소은 3)', () => {
  let done = null, failed = null;
  for (let i = 0; i < 40 && !(done && failed); i++) {
    const s = toKeeper('ch2b' + i, 'bard');
    const v = choiceView(s);
    assert.ok(v.options.find((o) => o.id === 'tell').label.includes(`성공 ${Math.round(tellChance(s) * 100)}%`));
    const ev = dispatch(s, { type: 'choose', id: 'tell' });
    const chk = ev.find((e) => e.type === 'check');
    assert.ok(ev.some((e) => e.type === 'line' && e.line.who === '판정' && e.line.text.includes(`주사위 ${chk.roll}`)));
    if (chk.ok) done = s; else failed = s;
  }
  assert.equal(done.dmem.ruins.keeper, 'tell');
  assert.equal(done.flags.keeperAlive, true);
  assert.equal(done.battle, null, '싸우지 않았다');
  toBell(done);
  assert.equal(done.main.done[1].path, 'tell');
  assert.equal(done.main.called, '소식을 전한 이');
  // 실패하면 그 대답만 닫히고 다른 길은 남는다
  assert.ok(choiceView(failed).options.find((o) => o.id === 'tell').disabled);
  assert.ok(!choiceView(failed).options.find((o) => o.id === 'fight').disabled);
  assert.throws(() => dispatch(failed, { type: 'choose', id: 'tell' }), /통하지 않았/);
});

test('메인 2장: 고쳐 주는 길, 몰래 지나가는 길, 그리고 숨은 길', () => {
  // 고친다: 대장 중급과 철광석 열 개
  const a = toKeeper('ch2c');
  assert.ok(choiceView(a).options.find((o) => o.id === 'mend').disabled);
  a.skills.smithing = { grade: 9, xp: 0, uses: 0 };
  addItem(a, 'ironore', 10);
  dispatch(a, { type: 'choose', id: 'mend' });
  assert.equal(a.dmem.ruins.keeper, 'mend');
  assert.equal(countOf(a, 'ironore') % 10 === 0 || countOf(a, 'ironore') >= 0, true);
  toBell(a);
  assert.equal(a.main.done[1].path, 'mend');
  // 몰래: 밤에만
  const b = toKeeper('ch2d');
  b.phase = 1;
  assert.ok(choiceView(b).options.find((o) => o.id === 'sneak').disabled);
  assert.throws(() => dispatch(b, { type: 'choose', id: 'sneak' }), /밤이어야/);
  b.phase = 2; b.stats.agi = 40;
  dispatch(b, { type: 'choose', id: 'sneak' });
  assert.equal(b.dmem.ruins.keeper, 'sneak');
  toBell(b);
  assert.equal(b.main.called, '그림자 밟는 이');
  // 숨은 길: 곁에서 사흘 밤
  const c = toKeeper('ch2e');
  for (let night = 1; night <= 3; night++) {
    c.phase = 2; c.tick = 0;
    const day = c.day;
    dispatch(c, { type: 'choose', id: 'stay' });
    assert.equal(c.phase, 0, '밤을 새우면 아침이 된다');
    assert.equal(c.day, day + 1);
    if (night < 3) { assert.equal(c.dmem.ruins.keeper, null); assert.equal(c.choice.kind, 'keeper'); }
  }
  assert.equal(c.dmem.ruins.keeper, 'hidden');
  assert.equal(c.flags.keeperAlive, true);
  toBell(c);
  assert.equal(c.main.done[1].path, 'hidden');
  assert.equal(c.main.called, '문지기의 벗');
});

test('도현 4~6: 1층에 들어가 함정을 민첩으로 넘고, 쇠문을 부수고, 쉼터에서 한 번 쉰다', () => {
  const s = inRuins('dohyun-4');
  goRoom(s, 'f1-hall');
  let ev = dispatch(s, { type: 'choose', id: 'dodge' });
  assert.ok(ev.some((e) => e.type === 'check'));
  heal(s);
  goRoom(s, 'f1-store');
  let n = 0;
  while (s.choice && n++ < 100) { dispatch(s, { type: 'choose', id: 'force' }); heal(s); }
  assert.ok(s.dungeon.alert, '문을 부쉈다. 소리가 났다');
  ev = dispatch(s, { type: 'room', to: 'f1-watch' });
  assert.ok(ev.some((e) => e.type === 'line' && /기다리고 있었다/.test(e.line.text)));
  fight(s);
  goRoom(s, 'f1-rest');
  s.hp = 30;
  dispatch(s, { type: 'dungeon', op: 'rest' });
  assert.ok(s.hp > 30);
  assert.throws(() => dispatch(s, { type: 'dungeon', op: 'rest' }), /이미 쉬었습니다/);
  assert.equal(dungeonMap(s)[0].rooms.length, 5, '지나온 방 다섯이 지도에 있다');
});

test('던전에서 쓰러지면 밖으로 실려 나온다. 6판 저장은 7판으로 올라온다', () => {
  const s = inRuins('fall');
  goRoom(s, 'f1-hall');
  dispatch(s, { type: 'choose', id: 'disarm' });
  goRoom(s, 'f1-forge');
  s.hp = 1; s.stats.con = 1;
  let n = 0;
  while (s.dungeon && n++ < 50) { s.hp = 1; if (s.battle) { s.battle.intent = 'fang'; s.battle.hp = 9999; dispatch(s, { type: 'battle', choice: 'attack' }); } else break; }
  assert.equal(s.dungeon, null);
  assert.equal(s.place, 'temple');
  assert.equal(s.relic?.place ?? 'ruins', 'ruins');
  const old = JSON.parse(JSON.stringify(createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'v6' })));
  delete old.dungeon; delete old.dmem;
  old.v = 6;
  const up = parseSave(JSON.stringify({ v: 6, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.dungeon, null);
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), dungeon: { id: 'ruins', room: 'nope', cleared: {}, rested: {} } } })), /던전/);
});

// ── 검토에서 나온 것들 ──
test('문지기 앞의 선택지는 여섯이다. 칸이 모자라면 다섯째 칸이 선택 창을 연다', () => {
  const s = toKeeper('six');
  const slots = slotsNow(s);
  assert.equal(slots.length, 5);
  assert.equal(slots[4].open, 'choice');
  assert.ok(choiceView(s).options.some((o) => o.id === 'back'));
});

test('몰래 지나가기는 들켜도 다음 날 밤에 다시 해 볼 수 있다. 밤을 새우면 배가 꺼진다', () => {
  const s = toKeeper('sneak2');
  s.phase = 2; s.stats.agi = 1;
  let n = 0;
  while (!s.dmem.ruins.sneakDay && !s.dmem.ruins.keeper && n++ < 60) { delete s.dmem.ruins.sneakDay; dispatch(s, { type: 'choose', id: 'sneak' }); }
  assert.equal(s.dmem.ruins.sneakDay, s.day);
  assert.throws(() => dispatch(s, { type: 'choose', id: 'sneak' }), /오늘은 안 됩니다/);
  s.day += 2;
  assert.ok(!choiceView(s).options.find((o) => o.id === 'sneak').disabled);
  const full = s.full;
  dispatch(s, { type: 'choose', id: 'stay' });
  assert.ok(s.full <= full - 5, `포만감 ${full} → ${s.full}`);
});
