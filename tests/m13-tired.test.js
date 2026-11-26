// 시각, 피로, 잠, 조각칼 (사용자 요청 2026-11-26)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow, bodyView, clockOf } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';
import { SHOPS } from '../src/data/shops.js';
import { RECIPES } from '../src/data/recipes.js';

const fresh = (seed = 'tired') => createGame({ name: '졸음', origin: 'farmer', spent: {}, seed });
const strike = (s, n) => { for (let i = 0; i < n; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; } };

test('시각은 한 일마다 흐른다. 아침은 06시에 시작한다', () => {
  const s = fresh();
  assert.equal(clockOf(s), '06:00');
  dispatch(s, { type: 'move', to: 'training' });
  const before = clockOf(s);
  strike(s, 10);
  assert.ok(clockOf(s) > before, `${before} → ${clockOf(s)}`);
  s.phase = 1; s.tick = 0; assert.equal(clockOf(s), '12:00');
  s.phase = 2; s.tick = 0; assert.equal(clockOf(s), '20:00');
  s.tick = 49; assert.ok(clockOf(s) < '06:00', '자정을 넘긴 새벽');
});

test('피로는 한 일마다 쌓이고, 밤에 깨어 있으면 더 빨리 쌓인다. 70부터 벌이 붙는다', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  const t0 = s.tired;
  strike(s, 20);
  const day = s.tired - t0;
  assert.ok(day > 0);
  const n = fresh('night'); n.place = 'training'; n.phase = 2;
  strike(n, 20);
  assert.ok(n.tired > day * 2, `밤 ${n.tired} / 낮 ${day}`);
  const atk = valueOf(s, 'attack');
  s.tired = 70;
  assert.equal(bodyView(s).tiredOut, true);
  assert.ok(valueOf(s, 'attack') < atk);
});

test('쉬기: 낮에는 잠깐 쉬기(피로는 그대로), 밤에는 잠자기(피로가 풀리고 아침이 된다)', () => {
  const s = fresh();
  const rest = () => slotsNow(s).find((x) => x.action?.id === 'rest');
  assert.equal(rest().label, '잠깐 쉬기');
  s.tired = 50; s.hp = 10;
  const clock = clockOf(s);
  dispatch(s, { type: 'act', id: 'rest' });
  assert.equal(s.phase, 0, '잠깐 쉬어서는 때가 넘어가지 않는다');
  assert.ok(clockOf(s) > clock);
  assert.equal(s.tired, 50);
  assert.ok(s.hp > 10);
  s.phase = 2; s.tick = 10;
  assert.equal(rest().label, '잠자기');
  dispatch(s, { type: 'act', id: 'rest' });
  assert.equal(s.tired, 0);
  assert.deepEqual([s.day, s.phase], [2, 0]);
});

test('피로가 100이 되면 곯아떨어져 다음 날 아침이 된다. 들판에서는 은화를 조금 잃는다', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  s.tired = 99.8; s.silver = 100;
  dispatch(s, { type: 'act', id: 'strike' });
  assert.deepEqual([s.day, s.phase], [2, 0]);
  assert.equal(s.tired, 30);
  assert.equal(s.silver, 100, '마을에서는 잃지 않는다');
  const w = fresh('wild'); w.place = 'river'; w.tired = 99.8; w.silver = 100;
  dispatch(w, { type: 'act', id: slotsNow(w).find((x) => x.label === '낚시').action.id });
  if (!w.battle && !w.choice) { assert.equal(w.day, 2); assert.equal(w.silver, 95); }
});

test('조각은 조각칼이 있어야 한다. 대장간에서 사거나 만든다. 칼질마다 닳는다', () => {
  assert.ok(SHOPS.forge.sells.includes('chisel'));
  assert.equal(RECIPES.chisel.makes, 'chisel');
  const s = fresh();
  s.dex.animals.rabbit = true; addItem(s, 'oakbranch', 8);
  const slot = () => slotsNow(s).find((x) => x.label === '조각');
  assert.equal(slot().disabled, true);
  assert.equal(slot().why, '조각칼이 없다');
  assert.throws(() => dispatch(s, { type: 'sculpt', subject: 'rabbit' }), /조각칼/);
  const knife = addItem(s, 'chisel');
  assert.ok(!slot().disabled);
  assert.throws(() => dispatch(s, { type: 'equip', index: s.bag.indexOf(knife) }), /도구/);
  const dur = knife.dur;
  dispatch(s, { type: 'sculpt', subject: 'rabbit' });
  dispatch(s, { type: 'cut' });
  assert.equal(knife.dur, dur - 1);
  // 다 닳으면 부러지고, 새 칼이 있어야 이어 깎는다
  knife.dur = 1;
  dispatch(s, { type: 'cut' });
  assert.equal(countOf(s, 'chisel'), 0);
  assert.throws(() => dispatch(s, { type: 'cut' }), /조각칼/);
  assert.ok(s.sculpt, '깎던 것은 남아 있다');
});

test('10판 저장은 11판으로 올라온다. 깎아 본 사람은 조각칼을 쥐고 시작한다', () => {
  const s = fresh();
  const old = JSON.parse(JSON.stringify(s));
  delete old.tired; old.v = 10;
  old.works = [{ no: 1, subject: 'rabbit', grade: 0, day: 1, where: 'bag', maker: '졸음' }];
  const up = parseSave(JSON.stringify({ v: 10, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.tired, 0);
  assert.equal(countOf(up, 'chisel'), 1);
});

test('신전에서는 날마다 빵을 하나 거저 받는다. 하루에 한 번이고 팔 수 없다', async () => {
  const { sellPrice } = await import('../src/core/trade.js');
  const s = fresh('bread');
  dispatch(s, { type: 'move', to: 'temple' });
  const slot = () => slotsNow(s).find((x) => x.label === '빵 받기');
  assert.ok(slot() && !slot().disabled);
  dispatch(s, slot().action);
  assert.equal(countOf(s, 'bread'), 1);
  assert.equal(slot().disabled, true);
  assert.throws(() => dispatch(s, { type: 'act', id: 'bread' }), /하루에 하나/);
  assert.equal(sellPrice(s.bag.find((x) => x.id === 'bread'), s), 0);
  s.day += 1;
  dispatch(s, slot().action);
  assert.equal(countOf(s, 'bread'), 2);
  const full = (s.full = 10);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'bread') });
  assert.equal(s.full, full + 20);
});

test('그곳에 맞는 일을 할수록 사람이 먼저 말을 걸 확률이 오르고, 사이도 조금씩 가까워진다 (Z8)', async () => {
  const { spokeToday, speakChance, bondOf, SPEAK_BASE, WORK_PER_POINT, workPoints } = await import('../src/core/social.js');
  const s = fresh('speak');
  dispatch(s, { type: 'move', to: 'training' });
  assert.equal(spokeToday(s, 'instructor'), false, '남은 들어선다고 말을 걸지 않는다');
  assert.throws(() => dispatch(s, { type: 'talk', npc: 'instructor' }), /말을 걸어오지 않았습니다/);
  const greet = dispatch(s, { type: 'greet', npc: 'instructor' }).filter((e) => e.type === 'line').map((e) => e.line);
  assert.ok(!greet.some((l) => l.k === 'npc'), '먼저 말을 걸어오기 전에는 대꾸하지 않는다');
  // 확률: 할수록 오른다. 사이가 가까울수록 높다
  assert.ok(Math.abs(speakChance(s, 'instructor', 1) - (SPEAK_BASE[0] + 0.10)) < 1e-9, '땅의 사람은 시작 마을에서 +10%p');
  assert.ok(speakChance(s, 'instructor', 20) > speakChance(s, 'instructor', 5));
  // 쉬기는 그곳에 맞는 일이 아니다
  for (let i = 0; i < 5; i++) dispatch(s, { type: 'act', id: 'rest' });
  assert.equal(spokeToday(s, 'instructor'), false);
  assert.equal(s.flags.workHere.n, 0);
  // 허수아비를 친다. 서른몇 번 안에는 반드시 말을 건다
  let n = 0;
  while (!spokeToday(s, 'instructor') && n < 40) { dispatch(s, { type: 'act', id: 'strike' }); n++; }
  assert.ok(spokeToday(s, 'instructor'), '교관이 먼저 말을 걸었다');
  assert.ok(n >= 1 && n <= 33, n + '번째에');
  dispatch(s, { type: 'talk', npc: 'instructor' });
  // 일로 오르는 친밀도: 열 번에 하나, 그날 다음 것은 스무 번 더, 서른 번 더. 상한은 없다
  assert.deepEqual([9, 10, 29, 30, 60, 100].map(workPoints), [0, 1, 1, 2, 3, 4]);
  const t = fresh('bond'); t.place = 'training';
  for (let i = 0; i < WORK_PER_POINT * 6; i++) { dispatch(t, { type: 'act', id: 'strike' }); t.full = 80; t.tired = 0; if (t.phase === 2) { t.phase = 0; } }
  assert.equal(t.people.instructor.pts, 5 + 3, "예순 번이면 셋 (땅의 사람은 5에서 시작)");
  for (let i = 0; i < 40; i++) { dispatch(t, { type: "act", id: "strike" }); t.full = 80; t.tired = 0; t.phase = 0; }
  assert.equal(t.people.instructor.pts, 5 + 4, "많이 한 사람은 더 얻는다");
  // 벗은 들어서면 바로 말을 건다
  const f = fresh('friend'); f.people.instructor = { ...(f.people.instructor || {}), pts: 80, met: true };
  assert.ok(bondOf(f, 'instructor') >= 3);
  dispatch(f, { type: 'move', to: 'training' });
  assert.equal(spokeToday(f, 'instructor'), true);
  // 다음 날에는 다시 기다려야 한다
  s.day += 1;
  assert.equal(spokeToday(s, 'instructor'), false);
});

test('일할 거리가 없는 가게에서는 들어서면 주인이 먼저 말을 건다', async () => {
  const { spokeToday } = await import('../src/core/social.js');
  const s = fresh('shopkeeper');
  dispatch(s, { type: 'move', to: 'store' });
  assert.equal(spokeToday(s, 'granny'), true);
  dispatch(s, { type: 'talk', npc: 'granny' });
});

test('지쳐도 숙련도는 깎이지 않는다. 지친 채 일하면 히든 스탯 집념이 생긴다', async () => {
  const { jobXp } = await import('../src/core/jobs.js');
  const s = fresh('vigil');
  const base = jobXp(s, 'strike', false);
  s.tired = 90;
  assert.equal(jobXp(s, 'strike', false), base);
  s.place = 'training';
  for (let i = 0; i < 100; i++) { s.tired = 80; s.phase = 0; s.tick = 0; s.full = 80; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.equal(s.counters.tiredWork, 100);
  assert.equal(s.hidden.vigil.value, 1);
  // 집념이 있으면 더디게 지친다
  const a = fresh('a'); a.place = 'training';
  const b = fresh('a'); b.place = 'training'; b.hidden.vigil = { value: 3, half: true };
  for (let i = 0; i < 20; i++) { dispatch(a, { type: 'act', id: 'strike' }); dispatch(b, { type: 'act', id: 'strike' }); }
  assert.ok(b.tired < a.tired, a.tired + ' / ' + b.tired);
  // 지치지 않은 채 한 일은 세지 않는다
  assert.equal(a.counters.tiredWork, 0);
});

test('의뢰에는 어디서 하면 되는지가 적힌다. 아직 길을 모르는 곳은 적지 않는다', async () => {
  const { whereOf, boardView } = await import('../src/core/quests.js');
  const { JOBS } = await import('../src/data/quests.js');
  const s = fresh('where');
  assert.equal(whereOf(JOBS.herb5, s), '서쪽 숲에서 채집, 서쪽 숲에서 탐색');
  assert.ok(whereOf(JOBS.herb5, { ...s, opened: ['dock'] }).includes('갈대밭'));
  assert.ok(whereOf(JOBS.rat3, s).includes('서쪽 숲에서 사냥'));
  for (const [id, d] of Object.entries(JOBS)) assert.ok(whereOf(d, { ...s, opened: ['ruins', 'dock', 'bigmarket'] }), `${id}: 어디서인지 적혀 있다`);
  assert.ok(boardView(s).every((c) => typeof c.where === 'string'));
});

// ── 검토(2026-11-26)에서 나온 것 ──
test('검토: 신전에서는 들어서면 신전지기가 말을 건다. 말 걸기 창만 열어서는 매력이 쌓이지 않는다', async () => {
  const { spokeToday } = await import('../src/core/social.js');
  const s = fresh('priest');
  dispatch(s, { type: 'move', to: 'temple' });
  assert.equal(spokeToday(s, 'priest'), true);
  const t = fresh('charm');
  dispatch(t, { type: 'move', to: 'training' });
  dispatch(t, { type: 'greet', npc: 'instructor' });
  assert.equal(t.counters.npcs.length, 0, '대꾸하지 않은 사람은 말을 섞은 사람이 아니다');
});

test('검토: 잠깐 쉬기는 조금만 낫는다. 들판에서 쉬거나 자면 덮칠 수 있고, 맨바닥 잠은 피로가 다 풀리지 않는다', () => {
  const s = fresh('nap'); s.hp = 10;
  dispatch(s, { type: 'act', id: 'rest' });
  assert.ok(s.hp <= 10 + Math.round(bodyView(s).maxHp * 0.08));
  // 들판의 밤: 여러 씨앗 가운데 덮치는 밤이 있다
  let ambushed = 0, slept = 0;
  for (let i = 0; i < 40; i++) {
    const w = fresh('wildnight' + i); w.place = 'forest'; w.phase = 2; w.tired = 80;
    dispatch(w, { type: 'act', id: 'rest' });
    if (w.battle) { ambushed++; assert.equal(w.tired, 80, '잠들지 못했다'); }
    else { slept++; assert.equal(w.tired, 25); assert.equal(w.phase, 0); }
  }
  assert.ok(ambushed > 0 && slept > 0, `덮침 ${ambushed}, 잠 ${slept}`);
  // 마을에서는 덮치지 않고 다 풀린다
  const t = fresh('town'); t.phase = 2; t.tired = 80;
  dispatch(t, { type: 'act', id: 'rest' });
  assert.equal(t.tired, 0);
});

test('검토: 주점에서 방을 빌리면 낮에도 잘 수 있다. 값을 내고, 다 낫고, 다음 때가 된다', () => {
  const s = fresh('inn');
  dispatch(s, { type: 'move', to: 'tavern' });
  const slot = () => slotsNow(s).find((x) => x.action?.id === 'room');
  assert.equal(slot().disabled, true, '은화가 없으면 못 빌린다');
  s.silver = 25; s.tired = 90; s.hp = 5;
  assert.equal(slot().label, '방 빌리기 (은화 10)');
  dispatch(s, slot().action);
  assert.equal(s.silver, 15);
  assert.equal(s.tired, 0);
  assert.equal(s.hp, bodyView(s).maxHp);
  assert.equal(s.phase, 1, '아침에 빌리면 낮에 일어난다');
});

test('검토: 지친 채 한 망치질·칼질·싸움도 집념에 쌓인다. 만든 조각칼은 등급이 높을수록 오래 쓴다. 주운 조각칼은 닳지 않는다', async () => {
  const s = fresh('toil');
  s.dex.animals.rabbit = true; addItem(s, 'oakbranch', 4); addItem(s, 'oddknife');
  assert.ok(!slotsNow(s).find((x) => x.label === '조각').disabled, '이름 모를 조각칼로도 깎는다');
  dispatch(s, { type: 'sculpt', subject: 'rabbit' });
  s.tired = 80;
  for (let i = 0; i < 5; i++) dispatch(s, { type: 'cut' });
  assert.equal(s.counters.tiredWork, 5);
  assert.equal(countOf(s, 'oddknife'), 1);
  // 만든 조각칼: 등급 2면 내구도 두 배
  const { startCraft } = await import('../src/core/craft.js');
  const c = fresh('forge'); c.place = 'forge'; addItem(c, 'ironore', 2); addItem(c, 'oakbranch', 1);
  dispatch(c, { type: 'craft', recipe: 'chisel' });
  let n = 0; while (c.craft && n++ < 20) dispatch(c, { type: 'hammer' });
  const knife = c.bag.find((x) => x.id === 'chisel');
  assert.ok(knife && knife.dur >= Math.round(120 * (1 + 0.5 * knife.grade)), `등급 ${knife?.grade}, 내구도 ${knife?.dur}`);
  assert.ok(startCraft);
});

test('되받아치기에는 방어력과 막기 숙련이 실린다. 막을수록 막기 숙련도가 오르고 덜 맞는다', async () => {
  const { guardCut } = await import('../src/core/battle.js');
  const { enemyView } = await import('../src/core/game.js');
  const mk = (con) => {
    const s = fresh('tank'); s.stats.con = con; s.stats.str = 5; s.hp = 9999; s.place = 'forest';
    s.battle = { mon: 'boar', hp: 9999, turn: 1, intent: 'charge', stun: 0, weak: null, burn: 0, ward: null, streak: 0 };
    return s;
  };
  const counter = (s) => { const before = s.battle.hp; while (enemyView(s).next.kind !== 'charge') { s.hp = 9999; dispatch(s, { type: 'battle', choice: 'defend' }); } const b = s.battle.hp; dispatch(s, { type: 'battle', choice: 'defend' }); return b - s.battle.hp || before - b; };
  let weak = 0, strong = 0;
  for (let i = 0; i < 6; i++) { weak += counter(mk(6)); strong += counter(mk(40)); }
  assert.ok(strong > weak, `체력 40: ${strong} / 체력 6: ${weak}`);
  // 막기 숙련도
  const s = mk(10);
  for (let i = 0; i < 30; i++) { s.hp = 9999; s.full = 80; dispatch(s, { type: 'battle', choice: 'defend' }); }
  assert.ok(s.skills.guard && s.skills.guard.uses > 0, '막은 만큼 쌓인다');
  assert.equal(guardCut({ skills: {} }), 0.5);
  assert.equal(guardCut({ skills: { guard: { grade: 10 } } }), 0.6);
  assert.equal(guardCut({ skills: { guard: { grade: 44 } } }), 0.8);
});

// ── 전투 태세 넷 (Z16) ──
test('태세: 맞받아치기는 힘으로, 피하기는 민첩으로, 모으기는 지혜로 싸운다. 그렇게 싸울수록 숙련도가 오른다', async () => {
  const { clashChance, dodgeChance, STANCES } = await import('../src/core/battle.js');
  const { enemyView } = await import('../src/core/game.js');
  const mk = (stance, stats = {}) => {
    const s = fresh('stance-' + stance); Object.assign(s.stats, stats); s.hp = 9999; s.place = 'forest';
    dispatch(s, { type: 'stance', id: stance });
    s.battle = { mon: 'boar', hp: 9999, turn: 1, intent: 'gore', stun: 0, weak: null, burn: 0, ward: null, streak: 0 };
    return s;
  };
  assert.deepEqual(Object.keys(STANCES), ['hold', 'clash', 'dodge', 'focus']);
  assert.equal(slotsNow(mk('dodge'))[2].label, '피하기');
  assert.equal(slotsNow(mk('hold'))[2].label, '방어');
  assert.throws(() => dispatch(mk('hold'), { type: 'stance', id: 'clash' }), /싸우는 중/);
  // 스탯이 높을수록 잘된다
  assert.ok(clashChance(mk('clash', { str: 40 })) > clashChance(mk('clash', { str: 5 })));
  assert.ok(dodgeChance(mk('dodge', { agi: 40 })) > dodgeChance(mk('dodge', { agi: 5 })));
  // 맞받아치기: 이기면 적을 깎는다. 강타가 쌓인다
  const c = mk('clash', { str: 60 });
  for (let i = 0; i < 20; i++) { c.hp = 9999; c.full = 80; dispatch(c, { type: 'battle', choice: 'defend' }); }
  assert.ok(c.battle.hp < 9999, '꺾고 쳤다');
  assert.ok(c.skills.smash.uses > 0);
  // 피하기: 피한 다음 공격은 반드시 급소다
  const d = mk('dodge', { agi: 60 });
  let n = 0; while (!d.battle.edge && n++ < 30) { d.hp = 9999; dispatch(d, { type: 'battle', choice: 'defend' }); }
  assert.ok(d.battle.edge, '빈틈을 만들었다');
  const lines = dispatch(d, { type: 'battle', choice: 'attack' }).filter((e) => e.type === 'line').map((e) => e.line.text).join(' ');
  assert.ok(lines.includes('급소'), lines);
  assert.equal(d.battle.edge, null);
  assert.ok(d.skills.evade.uses > 0);
  // 모으기: 마나가 돌아오고 두 번까지 쌓인다
  const f = mk('focus', { wis: 30 }); f.mp = 0;
  dispatch(f, { type: 'battle', choice: 'defend' }); f.hp = 9999;
  dispatch(f, { type: 'battle', choice: 'defend' }); f.hp = 9999;
  dispatch(f, { type: 'battle', choice: 'defend' });
  assert.equal(f.battle.focus, 2);
  assert.ok(f.mp > 0);
  assert.ok(f.skills.focus.uses > 0);
  assert.ok(enemyView(f));
});

test('주점과 주막에서는 낮에도 낮잠을 잔다. 피로가 30 풀린다. 다른 곳의 낮은 잠깐 쉬기다', async () => {
  const { createGame, dispatch, slotsNow } = await import('../src/core/game.js');
  const { rollDice } = await import('../src/data/origins.js');
  const s = createGame({ name: '잠', origin: 'bard', rolled: rollDice('same'), seed: 'nap' });
  s.place = 'tavern'; s.phase = 1; s.tired = 50;
  const slot = slotsNow(s).find((x) => x.action?.id === 'rest');
  assert.equal(slot.label, '낮잠자기');
  dispatch(s, { type: 'act', id: 'rest' });
  assert.equal(s.tired, 20);
  s.place = 'plaza'; s.phase = 0;
  assert.equal(slotsNow(s).find((x) => x.action?.id === 'rest').label, '잠깐 쉬기');
  s.place = 'tavern'; s.phase = 2;
  assert.equal(slotsNow(s).find((x) => x.action?.id === 'rest').label, '잠자기');
});
