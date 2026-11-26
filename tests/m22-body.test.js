// 굶주림(Z38), 이름 부르기(Z39), 환생 때 숙련도 5%(Z32), 허겁지겁(Z40)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, bodyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { helloOf, callName, bondOf } from '../src/core/social.js';
import { rebirthCarry, skillTotal } from '../src/core/rebirth.js';
import { countOf, addItem } from '../src/core/inventory.js';

const make = (seed = 'b', name = '도리미', origin = 'bard') => createGame({ name, origin, rolled: rollDice('same'), seed });

test('포만감 0에서 배가 더 고파질 때마다 생명력이 2%씩 깎이고, 0이 되면 굶어 쓰러진다', () => {
  const s = make('starve');
  s.place = 'training'; s.full = 0; s.bag = [];
  const max = bodyView(s).maxHp;
  const before = s.hp;
  for (let i = 0; i < 10; i++) { s.tired = 0; s.flags.faint = false; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.ok(s.hp < before, '몸이 상했다');
  assert.ok(s.log.some((l) => l.text.includes('굶주림에 몸이 상한다')));
  assert.equal((before - s.hp) % Math.max(1, Math.round(max * 0.02)), 0, '한 번에 2%씩');
  // 생명력이 바닥나면 굶어 쓰러진다
  s.hp = 1; s.tired = 0;
  let fell = null;
  for (let i = 0; i < 20 && !fell; i++) { s.tired = 0; delete s.flags.faint; fell = dispatch(s, { type: 'act', id: 'strike' }).find((e) => e.type === 'fall'); }
  assert.ok(fell, '굶어 쓰러졌다');
  assert.equal(fell.info.starved, true);
  assert.ok(s.full >= 20, '깨면 묽은 죽 한 그릇');
  // 먹으면 깎이지 않는다
  const t = make('fed'); t.place = 'training'; t.full = 50;
  const hp = t.hp;
  for (let i = 0; i < 10; i++) dispatch(t, { type: 'act', id: 'strike' });
  assert.equal(t.hp, hp);
});

test('사람들은 낯익은 사이부터 제 말투로 내 이름을 부른다. 벗부터는 정다운 꼴', () => {
  const s = make('name');
  assert.equal(callName(s, 'instructor'), null, '남은 이름을 모른다');
  assert.ok(!helloOf(s, 'instructor').includes('도리미'));
  s.people.instructor = { pts: 10, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.equal(bondOf(s, 'instructor'), 1);
  assert.ok(helloOf(s, 'instructor').startsWith('도리미. '));
  s.people.instructor.pts = 70;
  assert.ok(helloOf(s, 'instructor').startsWith('도리미야, '), '벗은 정답게');
  s.people.agent = { pts: 10, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.ok(helloOf(s, 'agent').startsWith('도리미 님, '));
  // 받침이 있으면 "아"
  const t = make('name2', '서진');
  t.people.smith = { pts: 70, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.ok(helloOf(t, 'smith').startsWith('서진아, '));
  // 단골부터는 이야기 중에도 이따금 부른다
  t.people.granny = { pts: 30, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  t.place = 'store';
  let named = 0;
  for (let i = 0; i < 30; i++) {
    t.flags.spoke = { granny: t.day }; t.tick = i;
    dispatch(t, { type: 'talk', npc: 'granny' });
    if (t.log.at(-1).text.startsWith('서진,')) named++;
  }
  assert.ok(named > 0 && named < 30, `서른 번에 ${named}번`);
});

test('환생하면 숙련도마다 쌓은 경험치의 5%를 가지고 간다', () => {
  const s = make('skill');
  s.skills.strike = { grade: 10, xp: 50, uses: 900 };
  const total = skillTotal(s.skills.strike);
  const carry = rebirthCarry(s);
  assert.equal(carry.skills.strike, Math.floor(total * 0.05));
  const n = createGame({ name: '새', origin: 'bard', rolled: rollDice('same'), seed: 'n', carry });
  assert.equal(skillTotal(n.skills.strike), Math.floor(total * 0.05));
  assert.ok(n.skills.strike.grade >= 1);
});

test('배가 바닥나면 가방의 먹을 것을 허겁지겁 먹는다. 배를 가장 덜 채우는 것부터', () => {
  const s = make('gobble');
  s.place = 'training'; s.full = 1; s.bag = [];
  addItem(s, 'riceball', 2);
  for (let i = 0; i < 20 && countOf(s, 'riceball') === 2; i++) { s.tired = 0; dispatch(s, { type: 'act', id: 'strike' }); }
  assert.equal(countOf(s, 'riceball'), 1, '하나를 먹었다');
  assert.ok(s.log.some((l) => l.text.includes('허겁지겁')));
  assert.ok(s.full > 5);
  assert.ok(!s.log.some((l) => l.text.includes('허기를 못 이기고')));
});

test('방을 빌려 자면 그 집의 잘 잔 몸이 깬 때부터 두 때 붙는다 (Z41)', async () => {
  const { derived } = await import('../src/core/derived.js');
  const { restBuff, xpBoost, buffRows } = await import('../src/core/buffs.js');
  const { slotsNow } = await import('../src/core/game.js');
  const room = (place, seed) => { const s = make(seed); s.place = place; s.opened.push('dock', 'bigmarket'); s.silver = 100; s.phase = 2; s.tick = 10; return s; };
  // 주점: 피로가 더디게
  const a = room('tavern', 'rt');
  assert.ok(slotsNow(a).find((x) => x.action?.id === 'room').sub.includes('개운한 몸'));
  dispatch(a, { type: 'act', id: 'room' });
  assert.equal(a.phase, 0);
  assert.equal(restBuff(a).name, '개운한 몸');
  assert.deepEqual(restBuff(a).until, { day: a.day, phase: 2 });
  assert.ok(a.log.some((l) => l.text.startsWith('잘 잔 몸: 개운한 몸')));
  assert.ok(buffRows(a).some((r) => r.kind === '잠'));
  const b = make('rt2'); b.place = 'training';
  for (let i = 0; i < 20; i++) { dispatch(a.place === 'tavern' ? (a.place = 'training', a) : a, { type: 'act', id: 'strike' }); dispatch(b, { type: 'act', id: 'strike' }); }
  assert.ok(a.tired < b.tired, `개운한 몸 ${a.tired} < 보통 ${b.tired}`);
  // 주막: 생명력·힘
  const c = room('inn', 'ri');
  const hp = derived(c).find((d) => d.id === 'maxHp').value;
  dispatch(c, { type: 'act', id: 'room' });
  assert.ok(derived(c).find((d) => d.id === 'maxHp').value > hp);
  assert.equal(c.hp, derived(c).find((d) => d.id === 'maxHp').value, '늘어난 만큼 차 있다');
  // 여인숙: 숙련도
  const e = room('innrow', 'rr');
  dispatch(e, { type: 'act', id: 'room' });
  assert.ok(Math.abs(xpBoost(e) - 1.05) < 1e-9);
  // 두 때가 지나면 풀린다
  e.phase = 2;
  assert.equal(restBuff(e), null);
});

test('맡긴 은화에는 날마다 1% 이자. 은화만 맡기면 삯이 없다. 다시 태어나도 보관함은 통째로 남는다 (Z42)', async () => {
  const { storeDay, storeView } = await import('../src/core/trade.js');
  const s = make('bank');
  s.place = 'tavern'; s.silver = 1000;
  dispatch(s, { type: 'deposit', silver: 500 });
  storeDay(s, []);
  assert.equal(s.store['시작 마을'].silver, 505, '이자 1%');
  assert.equal(s.silver, 500, '은화만 맡기면 삯이 없다');
  assert.equal(storeView(s).interest, 5);
  s.bag = []; addItem(s, 'ironore', 5);
  dispatch(s, { type: 'deposit', index: 0, n: 5 });
  storeDay(s, []);
  assert.equal(s.store['시작 마을'].silver, 505 + 5 - 2, '이자 붙고, 물건이 있으니 삯 2');
  // 다시 태어나도 남는다
  const n = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'nb', carry: rebirthCarry(s) });
  assert.equal(n.store['시작 마을'].silver, 508);
  assert.equal(n.store['시작 마을'].items[0].id, 'ironore');
  dispatch(n, { type: 'move', to: 'tavern' });
  assert.ok(n.log.some((l) => l.text.includes('장부에 네 앞으로 맡긴 것이 있군')));
  const k = n.log.length;
  dispatch(n, { type: 'move', to: 'plaza' }); dispatch(n, { type: 'move', to: 'tavern' });
  assert.ok(!n.log.slice(k).some((l) => l.text.includes('장부')), '한 번만 알려 준다');
});

test('신전의 축복받기: 그림자가 있으면 걷고, 없으면 두 때 동안 신의 가호 (Z43)', async () => {
  const { slotsNow } = await import('../src/core/game.js');
  const { graceBuff } = await import('../src/core/buffs.js');
  const { derived } = await import('../src/core/derived.js');
  const s = make('grace'); s.place = 'temple'; s.silver = 100; s.level = 3; s.stats.str = 40;
  const slot = () => slotsNow(s).find((x) => x.action?.id === 'blessing');
  assert.equal(slot().label, '축복받기 (은화 15)');
  assert.ok(slot().sub.includes('신의 가호'));
  const atk = derived(s).find((d) => d.id === 'attack').value;
  dispatch(s, { type: 'act', id: 'blessing' });
  assert.equal(s.silver, 85);
  assert.ok(graceBuff(s));
  assert.ok(derived(s).find((d) => d.id === 'attack').value > atk);
  // 그림자가 있으면 걷는다
  s.shadow = 2;
  assert.ok(slot().sub.includes('그림자 2겹'));
  assert.equal(slot().label, '축복받기 (은화 30)');
  dispatch(s, { type: 'act', id: 'blessing' });
  assert.equal(s.shadow, 0);
  assert.equal(s.silver, 55);
  // 은화가 모자라면 칸이 꺼진다
  s.silver = 3;
  assert.equal(slot().disabled, true);
});

test('싸우는 중에는 다른 곳으로 갈 수 없다', () => {
  const s = make('nomove');
  s.place = 'training';
  s.battle = { mon: 'rat', hp: 20, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  assert.throws(() => dispatch(s, { type: 'move', to: 'plaza' }), /싸우는 중/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'forest' }), /싸우는 중/);
  assert.equal(s.place, 'training');
});

test('신전·사당에서 기도하다 지쳐 잠들면 피로가 다 풀린다. 다른 곳은 30 (Z45)', () => {
  const s = make('holy'); s.place = 'temple'; s.tired = 99.8; s.full = 80;
  for (let i = 0; i < 5 && s.tired > 0; i++) dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.tired, 0);
  assert.equal(s.phase, 0);
  assert.ok(s.log.some((l) => l.text.includes('담요를 덮어 주었다')));
  const t = make('field'); t.place = 'training'; t.tired = 99.8; t.full = 80;
  for (let i = 0; i < 5 && t.phase !== 0 || i === 0; i++) dispatch(t, { type: 'act', id: 'strike' });
  assert.equal(t.tired, 30);
});

test('자연 회복: 싸우지 않는 동안 민첩이 높을수록 생명력이 빨리 찬다. 배고프면 절반, 굶으면 멈춘다 (Z49)', async () => {
  const { regenRate } = await import('../src/core/game.js');
  const { derived } = await import('../src/core/derived.js');
  const run = (agi, full = 80) => {
    const s = make('regen' + agi); s.place = 'training'; s.stats.agi = agi; s.full = full;
    const max = derived(s).find((d) => d.id === 'maxHp').value;
    s.hp = 1;
    for (let i = 0; i < 20; i++) { s.tired = 0; s.full = full; dispatch(s, { type: 'act', id: 'strike' }); }
    return (s.hp - 1) / max;
  };
  const slow = run(5), fast = run(30);
  assert.ok(fast > slow * 2, `민첩 30 ${fast.toFixed(3)} > 민첩 5 ${slow.toFixed(3)}의 두 배`);
  assert.ok(Math.abs(run(10) - 20 * 0.003) < 0.02, '민첩 10이면 1틱에 0.3%쯤');
  assert.ok(run(10, 10) < run(10) * 0.75, '배고프면 느리다');
  const s = make('regen0'); s.stats.agi = 20; s.full = 0;
  assert.equal(regenRate(s), 0, '굶으면 멈춘다');
  s.full = 50; s.battle = { mon: 'rat' };
  assert.equal(regenRate(s), 0, '싸우는 중에는 멈춘다');
});

test('신전의 치료: 하루 한 번 공짜로 생명력이 다 차고 상태이상이 풀린다. 낮에만 (Z50)', async () => {
  const { slotsNow } = await import('../src/core/game.js');
  const { derived } = await import('../src/core/derived.js');
  const s = make('heal'); s.place = 'temple'; s.phase = 0; s.silver = 7;
  s.hp = 3; s.status = [{ id: 'bleed', turns: 3 }];
  const slot = () => slotsNow(s).find((x) => x.action?.id === 'heal');
  assert.ok(slot() && !slot().disabled);
  dispatch(s, { type: 'act', id: 'heal' });
  assert.equal(s.hp, derived(s).find((d) => d.id === 'maxHp').value);
  assert.equal(s.status.length, 0);
  assert.equal(s.silver, 7, '공짜');
  assert.equal(slot().disabled, true, '오늘은 이미 받았다');
  assert.throws(() => dispatch(s, { type: 'act', id: 'heal' }), /이미/);
  s.day += 1; s.phase = 2;
  assert.equal(slot(), undefined, '밤에는 치료 칸 대신 잠자기');
  s.phase = 0; s.place = 'shrine';
  assert.ok(slot() && !slot().disabled, '다음 날, 나루 사당에서도');
});

test('칭호의 효과는 얻은 것 모두 늘 붙는다. 달지 않아도 (Z51)', async () => {
  const { grantTitle } = await import('../src/core/social.js');
  const { buyPrice } = await import('../src/core/trade.js');
  const s = make('titles'); s.place = 'store';
  const p0 = buyPrice(s, 'redpotion').now;
  grantTitle(s, [], 'regular', 'x');
  assert.equal(s.title, null, '달지 않았다');
  assert.ok(buyPrice(s, 'redpotion').now < p0);
});

test('지혜가 높으면 출혈·중독·화상·기절에 덜 걸리고, 지혜 20부터는 걸려도 1턴 짧다. 공포는 그대로 (Z52)', async () => {
  const { wisResist } = await import('../src/core/battle.js');
  const s = make('wis');
  s.stats.wis = 0; assert.equal(wisResist(s), 0);
  s.stats.wis = 10; assert.ok(Math.abs(wisResist(s) - 0.2) < 1e-9);
  s.stats.wis = 99; assert.equal(wisResist(s), 0.6, '많아야 60%');
  // 돌거미의 독니(중독 50%, 5턴)를 여러 번 맞는다: 지혜가 높을수록 덜 걸리고, 걸려도 4턴
  const hits = (wis) => {
    let got = 0, turns = new Set(), resisted = 0;
    for (let k = 0; k < 120; k++) {
      const t = make('wis' + k); t.stats.wis = wis; t.stats.con = 60; t.place = 'forest';
      t.battle = { mon: 'spider', hp: 9999, turn: 1, intent: 'fang', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
      try { dispatch(t, { type: 'battle', choice: 'attack' }); } catch { continue; }
      const p = t.status.find((x) => x.id === 'poison');
      if (p) { got++; turns.add(p.turns); }
      if (t.log.some((l) => l.text.includes('중독되지 않았다'))) resisted++;
    }
    return { got, turns, resisted };
  };
  const low = hits(0), high = hits(25);
  assert.ok(high.got < low.got, `지혜 25 ${high.got} < 지혜 0 ${low.got}`);
  assert.ok(high.resisted > 0, '막으면 한 줄이 뜬다');
  assert.equal(low.resisted, 0);
  // 턴이 끝날 때 한 번 줄어 있다: 5턴이면 4, 짧아지면 3
  assert.ok([...low.turns].includes(4));
  for (const n of high.turns) assert.ok(n <= 3, '지혜 20부터 1턴 짧게');
});
