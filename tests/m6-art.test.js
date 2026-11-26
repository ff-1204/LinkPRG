// M6: 조각과 작품, 요리, 버프, 동료와 파티.
import { passPhase, talkTo } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, modeOf, sculptView, statueOf, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { sculptMenu, worksView, workOdds } from '../src/core/sculpt.js';
import { cookMenu } from '../src/core/cook.js';
import { buffOf, foodBuff, buffRows } from '../src/core/buffs.js';
import { partyView, roleBonus } from '../src/core/party.js';
import { valueOf, derived, formula } from '../src/core/derived.js';
import { fameOf, checkChance, peopleHere } from '../src/core/social.js';
import { mainView } from '../src/core/quests.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { parseSave } from '../src/core/save.js';
import { CUTS, WORK_BASE, SUBJECTS } from '../src/data/works.js';
import { DISHES, INGREDIENTS } from '../src/data/cooking.js';
import { COMPANIONS, PLANS } from '../src/data/companions.js';
import { ITEMS } from '../src/data/items.js';
import { BONDS } from '../src/data/people.js';

const fresh = (seed = 'm6', origin = 'farmer') => createGame({ name: '가을', origin, spent: {}, seed });
const carve = (s, subject = 'rabbit') => {
  if (s.place !== 'artguild') s.place = 'artguild'; // 조각은 예술협회에서 (Z80)
  if (countOf(s, 'oakbranch') < 4) addItem(s, 'oakbranch', 4); addItem(s, 'chisel'); s.tired = 0;
  s.dex.animals.rabbit = true;
  if (!s.bag.some((x) => x.id === 'chisel' && x.dur > 40)) addItem(s, 'chisel');
  s.tired = 0; // 푹 자고 깎는다
  if (s.place === 'plaza') s.place = 'artguild'; dispatch(s, { type: 'sculpt', subject });
  let ev = [];
  while (s.sculpt) { ev = dispatch(s, { type: 'cut' }); s.full = 80; }
  return ev.find((e) => e.type === 'sculpt' && e.phase === 'done');
};
const foe = (s, mon = 'crab', intent = 'shell', hp = 9999) => { s.place = 'forest'; s.battle = { mon, hp, turn: 1, intent, stun: 0, weak: null, burn: 0, ward: null, streak: 0 }; s.status = []; };

test('본 것만 깎는다. 만나 보지 않은 것은 주제에 나오지 않는다 (N2-4)', () => {
  const s = fresh();
  s.place = 'artguild';
  addItem(s, 'oakbranch', 8); addItem(s, 'chisel'); s.tired = 0;
  assert.deepEqual(sculptMenu(s).subjects, []);
  if (s.place === 'plaza') s.place = 'artguild'; assert.throws(() => dispatch(s, { type: 'sculpt', subject: 'rabbit' }), /본 적 없는/);
  // 숲에서 토끼를 보면 깎을 수 있다
  s.place = 'forest';
  let n = 0;
  while (!s.dex.animals.rabbit && n++ < 400) { if (s.battle) dispatch(s, { type: 'battle', choice: 'flee' }); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'explore' }); s.hp = 100; s.full = 80; if (s.place !== 'forest') s.place = 'forest'; }
  assert.ok(s.dex.animals.rabbit, '탐색하다 보면 토끼를 본다');
  s.battle = null; s.choice = null; s.place = 'artguild';
  assert.ok(sculptMenu(s).subjects.some((x) => x.id === 'rabbit'));
  // 괴물은 마주친 것만, 사람은 단골 이상만
  assert.ok(!sculptMenu(s).subjects.some((x) => x.id === 'granny'));
  s.people.granny = { pts: BONDS[2].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.ok(sculptMenu(s).subjects.some((x) => x.id === 'granny'));
  s.place = 'forest';
  assert.throws(() => dispatch(s, { type: 'sculpt', subject: 'rabbit' }), /깎을 수 없습니다/);
});

test('작품 하나에 칼질 마흔 번. 그림은 10·22·34번째에 바뀌고 등급은 마지막에야 갈린다 (N2-1, X1-3)', () => {
  const s = fresh();
  s.dex.animals.rabbit = true;
  addItem(s, 'oakbranch', 5); addItem(s, 'chisel'); s.tired = 0;
  if (s.place === 'plaza') s.place = 'artguild'; dispatch(s, { type: 'sculpt', subject: 'rabbit' });
  assert.equal(countOf(s, 'oakbranch'), 1);
  assert.equal(modeOf(s), 'sculpt');
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['칼질 0 / 40', '그만둔다']);
  assert.throws(() => dispatch(s, { type: 'move', to: 'store' }), /끝내거나 그만두어야/);
  const stages = [];
  for (let i = 1; i < CUTS; i++) {
    dispatch(s, { type: 'cut', times: 40 });
    assert.equal(s.sculpt.cuts, i, '한 번 누르면 한 번');
    stages.push(sculptView(s).stage);
    assert.equal(JSON.stringify(sculptView(s)).includes('grade'), false, '끝나기 전에는 등급이 어디에도 없다');
    assert.equal(s.works.length, 0);
  }
  assert.deepEqual([stages[8], stages[9], stages[20], stages[21], stages[32], stages[33]], [0, 1, 1, 2, 2, 3]);
  const ev = dispatch(s, { type: 'cut' });
  assert.equal(s.sculpt, null);
  assert.equal(s.works.length, 1);
  assert.ok(ev.some((e) => e.type === 'ding' && ['work', 'masterwork'].includes(e.ding.kind)));
  assert.equal(s.counters.act.cut, 40);
  assert.ok(s.skills.sculpting.grade >= 0);
  assert.equal(worksView(s)[0].whereName, '가방');
});

test('그만두면 깎던 것은 버려진다', () => {
  const s = fresh();
  s.dex.animals.rabbit = true;
  addItem(s, 'oakbranch', 4); addItem(s, 'chisel'); s.tired = 0;
  if (s.place === 'plaza') s.place = 'artguild'; dispatch(s, { type: 'sculpt', subject: 'rabbit' });
  dispatch(s, { type: 'cut' });
  dispatch(s, { type: 'sculptQuit' });
  assert.equal(s.sculpt, null);
  assert.equal(countOf(s, 'oakbranch'), 0);
  assert.equal(s.works.length, 0);
});

test('작품 등급: 처음 값은 20·45·25·9·1이고, 천 번 깎은 결과가 그 확률과 맞는다 (N2-5)', () => {
  const s = fresh('odds');
  assert.deepEqual(workOdds(s).map((x) => Math.round(x)), WORK_BASE);
  const got = [0, 0, 0, 0, 0];
  const N = 1000;
  for (let i = 0; i < N; i++) {
    s.skills.sculpting = { grade: 0, xp: 0, uses: 0 }; s.hidden = {}; s.counters.works = 0; s.works = []; s.log = []; s.dings = []; s.journal = []; s.day = 1; s.phase = 0; s.tick = 0;
    s.dex.animals.rabbit = true; s.place = 'artguild'; s.bag = []; addItem(s, 'oakbranch', 4); addItem(s, 'chisel'); s.tired = 0;
    if (s.place === 'plaza') s.place = 'artguild'; dispatch(s, { type: 'sculpt', subject: 'rabbit' });
    for (let k = 0; k < CUTS - 1; k++) dispatch(s, { type: 'cut' });
    s.skills.sculpting = { grade: 0, xp: 0, uses: 0 }; s.full = 80;
    got[dispatch(s, { type: 'cut' }).find((e) => e.type === 'sculpt' && e.phase === 'done').grade] += 1;
  }
  for (let g = 0; g < 5; g++) assert.ok(Math.abs((got[g] / N) * 100 - WORK_BASE[g]) < 5, `등급 ${g}: ${(got[g] / N) * 100}`);
});

test('작품 열 개를 만들면 히든 스탯 예술이 생긴다. 그 전에는 생명 부여의 이름이 보이지 않는다 (M6-6, N2-3)', () => {
  const s = fresh('art');
  for (let i = 0; i < 9; i++) carve(s);
  assert.equal(s.hidden.art?.value || 0, 0);
  assert.equal(worksView(s)[0].aliveLabel, '???');
  assert.throws(() => dispatch(s, { type: 'work', op: 'alive', no: 1 }), /아직 할 수 없는/);
  assert.ok(!JSON.stringify(hiddenSlots(s).filter((x) => !x.found)).includes('예술'));
  carve(s);
  assert.equal(s.hidden.art.value, 1);
  assert.equal(worksView(s)[0].aliveLabel, '생명을 불어넣는다');
});

test('감상하면 하루 동안 버프가 붙고 "지금 걸린 것"에 남은 때가 보인다 (M6-3)', () => {
  const s = fresh('adm');
  s.works.push({ no: 1, subject: 'rabbit', grade: 3, day: 1, where: 'bag', maker: '가을' }, { no: 2, subject: 'rabbit', grade: 0, day: 1, where: 'bag', maker: '가을' });
  const hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'work', op: 'admire', no: 2 });
  assert.equal(buffOf(s), null, '졸작은 힘을 주지 않는다');
  dispatch(s, { type: 'work', op: 'admire', no: 1 });
  assert.equal(buffOf(s).name, '벅찬 가슴');
  assert.equal(valueOf(s, 'maxHp'), hp + 10);
  assert.deepEqual(buffRows(s).map((r) => [r.kind, r.until.day]), [['감상', 2]]);
  assert.ok(formula(derived(s).find((d) => d.id === 'maxHp')).includes('벅찬 가슴'));
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(buffOf(s), null, '하루가 지나면 사라진다');
  assert.equal(valueOf(s, 'maxHp'), hp);
});

test('걸작을 광장에 세우면 다음 날 명성이 오르고, 띠와 "이 방" 글에 내 조각이 선다 (M6-5, X3-3)', () => {
  const s = fresh('stat');
  s.works.push({ no: 1, subject: 'rabbit', grade: 3, day: 1, where: 'bag', maker: '가을' });
  s.place = 'store';
  assert.throws(() => dispatch(s, { type: 'work', op: 'place', no: 1 }), /광장/);
  s.place = 'plaza';
  dispatch(s, { type: 'work', op: 'place', no: 1 });
  assert.equal(statueOf(s).name, '걸작 토끼상');
  assert.equal(fameOf(s), 0);
  assert.equal(s.main.done[0]?.path, 'sculpt', '메인 1장의 깎는 길이 끝난다');
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(fameOf(s), 8);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(fameOf(s), 8, '한 번만 오른다');
  dispatch(s, { type: 'move', to: 'store' });
  const ev = dispatch(s, { type: 'move', to: 'plaza' });
  assert.ok(ev.some((e) => e.type === 'line' && e.line.k === 'room' && e.line.text.includes('걸작 토끼상')));
  // 다른 것을 세우면 먼저 것은 가방으로 돌아온다
  s.works.push({ no: 2, subject: 'rabbit', grade: 4, day: 2, where: 'bag', maker: '가을' });
  dispatch(s, { type: 'work', op: 'place', no: 2 });
  assert.equal(worksView(s)[0].where, 'bag');
  assert.equal(statueOf(s).name, '대작 토끼상');
});

test('작품은 팔고 선물할 수 있다. 그 사람을 깎은 것이면 더 기뻐한다 (N2-2)', () => {
  const s = fresh('wk', 'bard'); // 땅의 사람은 마을 사람들과 조금 가깝게 시작하므로 다른 뿌리로 잰다
  s.works.push({ no: 1, subject: 'rabbit', grade: 2, day: 1, where: 'bag', maker: '가을' }, { no: 2, subject: 'granny', grade: 2, day: 1, where: 'bag', maker: '가을' }, { no: 3, subject: 'rabbit', grade: 2, day: 1, where: 'bag', maker: '가을' });
  s.place = 'store';
  dispatch(s, { type: 'work', op: 'sell', no: 1 });
  assert.equal(s.silver, Math.floor(45 * 0.4));
  assert.throws(() => dispatch(s, { type: 'work', op: 'sell', no: 1 }), /가방에 있는/);
  dispatch(s, { type: 'work', op: 'gift', no: 3, npc: 'granny' });
  const plain = s.people.granny.pts;
  assert.throws(() => dispatch(s, { type: 'work', op: 'gift', no: 2, npc: 'granny' }), /하루에 한 번/);
  s.day += 1;
  dispatch(s, { type: 'work', op: 'gift', no: 2, npc: 'granny' });
  assert.equal(s.people.granny.pts - plain, plain * 2);
  assert.equal(worksView(s)[1].whereName, '잡화점 할머니에게 선물함');
});

test('요리: 맞는 조합은 레시피가 적히고, 틀리면 "먹을 수는 있는 것". 재료는 돌아오지 않는다 (N3-1, N3-3)', () => {
  const s = fresh('cook');
  addItem(s, 'crucian', 3); addItem(s, 'salt', 2); addItem(s, 'herb', 1);
  assert.throws(() => dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] }), /모닥불/);
  s.place = 'river';
  s.full = 10;
  assert.throws(() => dispatch(s, { type: 'cook', ids: ['crucian', 'crucian', 'crucian', 'salt'] }), /3개까지/);
  assert.throws(() => dispatch(s, { type: 'cook', ids: ['ironore'] }), /넣을 수 없는/);
  assert.equal(cookMenu(s).known.length, 0);
  const ev = dispatch(s, { type: 'cook', ids: ['salt', 'crucian'] });
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.title.includes('소금 붕어 구이')));
  assert.equal(s.full, 55);
  assert.equal(countOf(s, 'crucian'), 2);
  assert.equal(cookMenu(s).known[0].name, '소금 붕어 구이');
  assert.equal(foodBuff(s).name, '든든한 속');
  assert.ok(!dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] }).some((e) => e.type === 'ding' && e.ding.kind === 'dish'), '두 번째부터는 새 레시피가 아니다');
  // 틀린 조합
  addItem(s, 'berry', 1);
  s.full = 10;
  dispatch(s, { type: 'cook', ids: ['berry', 'crucian'] });
  assert.ok(s.full === 24 || s.full === 25, `포만감 ${s.full} (굽는 사이 배가 조금 꺼진다)`);
  assert.equal(countOf(s, 'crucian'), 0);
  assert.deepEqual(cookMenu(s).fails, ['산열매, 붕어']);
  assert.ok(s.skills.cooking);
});

test('음식 버프는 한 번에 하나만 붙는다. 못 찾은 조합의 귀띔은 사람에게 들어야 보인다 (N3-4, N3-5)', () => {
  const s = fresh('buff');
  s.place = 'river';
  addItem(s, 'crucian', 2); addItem(s, 'salt', 2); addItem(s, 'herb', 2); addItem(s, 'boarmeat', 1);
  dispatch(s, { type: 'cook', ids: ['crucian', 'salt'] });
  const hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'cook', ids: ['boarmeat', 'herb', 'salt'] });
  assert.equal(foodBuff(s).name, '뜨거운 피');
  assert.equal(valueOf(s, 'maxHp'), hp - 15, '먼저 붙어 있던 것은 사라진다');
  assert.equal(buffRows(s).filter((r) => r.kind === '음식').length, 1);
  assert.deepEqual(cookMenu(s).hints, []);
  s.place = 'temple';
  talkTo(s, 'priest');
  assert.equal(cookMenu(s).hints.length, 1);
  for (const d of Object.values(DISHES)) { assert.ok(d.hint && d.buff.name && d.buff.text && d.full > 0); for (const id of d.needs) assert.ok(INGREDIENTS.includes(id) && ITEMS[id]); }
});

test('동료 영입: 사이가 단골 이상인 미루에게 청한다. 파티는 둘까지 (T28, T25)', () => {
  const s = fresh('miru');
  s.place = 'tavern';
  assert.throws(() => dispatch(s, { type: 'party', op: 'ask', npc: 'miru' }), /단골/);
  s.people.miru = { pts: BONDS[2].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  const ev = dispatch(s, { type: 'party', op: 'ask', npc: 'miru' });
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'companion'));
  const v = partyView(s)[0];
  assert.equal(v.name, '미루');
  assert.equal(v.rowName, '뒷줄');
  assert.equal(v.role, '고치는 사람');
  assert.equal(v.plan, 'half');
  assert.equal(v.plans.length, 4);
  assert.ok(v.wants);
  assert.ok(!peopleHere(s).some((p) => p.id === 'miru'), '함께 다니는 사람은 그 자리에 없다');
  assert.throws(() => dispatch(s, { type: 'party', op: 'ask', npc: 'miru' }), /여기에 없|이미 함께/);
  // 용병: 하루 은화 60
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire' }), /은화 60/);
  s.silver = 100;
  dispatch(s, { type: 'party', op: 'hire' });
  assert.equal(s.party.length, 2);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.silver, 40);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.deepEqual(s.party.map((c) => c.id), ['miru'], '삯을 못 내면 용병은 떠난다');
  for (const c of Object.values(COMPANIONS)) { assert.ok(c.name && c.wants && c.join && c.leave && PLANS[c.role].length === 4); }
});

test('토끼상에 생명을 주면 돌토끼가 동료가 된다. 예술을 조금 잃는다 (M6-6)', () => {
  const s = fresh('life');
  s.counters.works = 12;
  s.hidden.art = { value: 1, half: true };
  s.works.push({ no: 1, subject: 'rabbit', grade: 0, day: 1, where: 'bag', maker: '가을' }, { no: 2, subject: 'rabbit', grade: 2, day: 1, where: 'bag', maker: '가을' }, { no: 3, subject: 'crab', grade: 2, day: 1, where: 'bag', maker: '가을' });
  assert.throws(() => dispatch(s, { type: 'work', op: 'alive', no: 1 }), /졸작/);
  assert.throws(() => dispatch(s, { type: 'work', op: 'alive', no: 3 }), /깨어나지 않습니다/);
  dispatch(s, { type: 'work', op: 'alive', no: 2 });
  assert.equal(partyView(s)[0].name, '돌토끼');
  assert.equal(partyView(s)[0].rowName, '앞줄');
  assert.equal(s.counters.works, 7);
  assert.equal(worksView(s)[1].whereName, '살아 움직인다');
  assert.throws(() => dispatch(s, { type: 'party', op: 'row', id: 'stonerabbit', row: 'back' }), /뒷줄에는/);
});

test('방침대로 동료가 스스로 움직인다: 돌토끼는 대신 맞고, 미루는 절반 아래일 때 고친다 (T21, H1-2)', () => {
  const s = fresh('plan');
  dispatch(s, { type: 'move', to: 'training' });
  s.party.push({ id: 'stonerabbit', hp: 80, row: 'front', plan: 'mefirst', crossed: 0, bond: 0, down: false, day: 1 });
  let taken = 0, blocked = 0;
  for (let i = 0; i < 100; i++) {
    foe(s, 'boar', 'gore'); s.hp = 100; s.party[0].hp = 80; s.party[0].down = false;
    const before = s.hp;
    const ev = dispatch(s, { type: 'battle', choice: 'attack' });
    if (ev.some((e) => e.type === 'line' && /앞을 막아섰다/.test(e.line.text))) { blocked++; assert.equal(s.hp, before); } else taken++;
  }
  assert.ok(blocked > 55 && blocked < 85, `대신 맞은 횟수 ${blocked}`);
  // 방침을 바꾸면(싸우는 중에도) 같이 친다
  foe(s);
  dispatch(s, { type: 'party', op: 'plan', id: 'stonerabbit', plan: 'together' });
  const ev = dispatch(s, { type: 'battle', choice: 'defend' });
  assert.ok(ev.some((e) => e.type === 'line' && /돌토끼가 쳤다/.test(e.line.text)));
  assert.throws(() => dispatch(s, { type: 'party', op: 'plan', id: 'stonerabbit', plan: 'healonly' }), /없는 방침/);
  // 미루: 절반 아래면 치유
  s.party = [{ id: 'miru', hp: 60, row: 'back', plan: 'half', crossed: 0, bond: 0, down: false, day: 1 }];
  foe(s); s.hp = valueOf(s, 'maxHp');
  let e2 = dispatch(s, { type: 'battle', choice: 'defend' });
  assert.ok(!e2.some((e) => e.type === 'line' && /손을 얹었다/.test(e.line.text)));
  s.hp = 20; s.battle.intent = 'shell';
  e2 = dispatch(s, { type: 'battle', choice: 'defend' });
  assert.ok(e2.some((e) => e.type === 'line' && /미루가 손을 얹었다/.test(e.line.text)));
  assert.equal(s.hp, 36);
  assert.ok(taken >= 0);
});

test('동료는 쓰러져도 싸움이 끝나면 일어난다. 바라는 것을 세 번 거스르면 떠난다 (H1-3, H1-4)', () => {
  const s = fresh('cross');
  dispatch(s, { type: 'move', to: 'training' });
  s.party.push({ id: 'stonerabbit', hp: 1, row: 'front', plan: 'mefirst', crossed: 0, bond: 5, down: false, day: 1 });
  let n = 0;
  while (!s.party[0].down && n++ < 60) { foe(s, 'boar', 'gore', 9999); s.hp = 100; s.party[0].hp = 1; dispatch(s, { type: 'battle', choice: 'defend' }); if (!s.party[0].down) s.battle = null; }
  assert.ok(s.party[0].down);
  s.battle.hp = 1; s.battle.intent = 'gore';
  dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.party[0].down, false);
  assert.ok(s.party[0].hp > 0);
  assert.equal(s.party[0].bond, 3, '쓰러지면 사이가 조금 내린다');
  // 돌토끼는 만든 이가 굶는 것을 싫어한다
  s.place = 'plaza'; s.battle = null;
  for (let d = 1; d <= 3; d++) {
    s.full = 0;
    for (let i = 0; i < 3; i++) { s.full = 0; passPhase(s); }
    if (d < 3) assert.equal(partyView(s)[0].crossed, d);
  }
  assert.equal(s.party.length, 0, '세 번 거스르면 떠난다');
  assert.ok(s.log.some((l) => l.text.includes('뒤돌아보지 않았다')));
});

test('막는 사람·때리는 사람·고치는 사람이 고루 있으면 모든 판정 +5% (T26)', () => {
  const s = fresh('role');
  const before = checkChance(s, 'threat', 'smith');
  s.party.push({ id: 'miru', hp: 60, row: 'back', plan: 'half', crossed: 0, bond: 0, down: false, day: 1 });
  assert.equal(roleBonus(s), 0);
  s.party.push({ id: 'stonerabbit', hp: 80, row: 'front', plan: 'mefirst', crossed: 0, bond: 0, down: false, day: 1 });
  assert.equal(roleBonus(s), 0.05);
  assert.ok(Math.abs(checkChance(s, 'threat', 'smith') - before - 0.05) < 1e-9);
});

test('깎는 길이 열려 있고, 5판 저장은 6판으로 올라온다', () => {
  const s = fresh('v5');
  assert.equal(mainView(s).paths.find((p) => p.id === 'sculpt').closed, '');
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['sculpt', 'works', 'buffs', 'cookHints', 'cookFails', 'party']) delete old[k];
  delete old.dex.animals; delete old.dex.dishes;
  old.v = 5;
  const up = parseSave(JSON.stringify({ v: 5, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.ok(carve(up));
  assert.equal(up.works.length, 1);
  assert.ok(SUBJECTS.rabbit);
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), party: [{ id: 'dragon' }] } })), /모르는 동료/);
});

// ── 검토에서 나온 것들 ──
test('깎는 중에는 히든 직업 제안이 끼어들지 않는다. 끝나면 온다', () => {
  const s = fresh('stuck');
  s.hidden.endure = { value: 1, half: true }; s.counters.act.strike = 300;
  s.hq.favor = { status: 'done', step: 'back', count: 0, day: 1 };
  s.dex.animals.rabbit = true; s.place = 'artguild'; addItem(s, 'oakbranch', 4); addItem(s, 'chisel'); s.tired = 0;
  s.sculpt = { subject: 'rabbit', cuts: 0 }; s.bag = s.bag.filter((x) => x.id !== 'oakbranch');
  dispatch(s, { type: 'cut' });
  assert.equal(s.choice, null);
  for (let i = 0; i < 39; i++) dispatch(s, { type: 'cut' });
  assert.equal(s.sculpt, null);
  assert.equal(s.choice?.kind, 'hjob', '다 깎고 나면 제안이 온다');
  dispatch(s, { type: 'choose', id: 'decline' });
});

test('세운 작품의 명성은 작품마다 한 번만 오른다', () => {
  const s = fresh('fameonce');
  s.place = 'plaza';
  s.works.push({ no: 1, subject: 'rabbit', grade: 3, day: 1, where: 'bag', maker: '가을' }, { no: 2, subject: 'rabbit', grade: 3, day: 1, where: 'bag', maker: '가을' });
  for (let d = 0; d < 6; d++) { dispatch(s, { type: 'work', op: 'place', no: (d % 2) + 1 }); for (let i = 0; i < 3; i++) passPhase(s); s.full = 80; }
  assert.equal(fameOf(s), 16);
});

test('용병은 구할 때 첫날 삯을 낸다. 그날 헤어져도 돌려받지 못한다', () => {
  const s = fresh('merc');
  s.place = 'tavern'; s.silver = 130;
  dispatch(s, { type: 'party', op: 'hire' });
  assert.equal(s.silver, 70);
  dispatch(s, { type: 'party', op: 'dismiss', id: 'gaon' });
  assert.equal(s.silver, 70);
  dispatch(s, { type: 'party', op: 'hire' });
  assert.equal(s.silver, 10);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.silver, 10, '첫날 삯은 이미 냈다');
  assert.equal(s.party.length, 1);
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.party.length, 0, '둘째 날 삯이 없으면 떠난다');
});

test('떠난 조각의 간 곳이 적힌다. 망가진 새 칸은 걸러진다', () => {
  const s = fresh('gone');
  s.hidden.art = { value: 1, half: true }; s.counters.works = 12;
  s.works.push({ no: 1, subject: 'rabbit', grade: 2, day: 1, where: 'bag', maker: '가을' });
  dispatch(s, { type: 'work', op: 'alive', no: 1 });
  dispatch(s, { type: 'party', op: 'dismiss', id: 'stonerabbit' });
  assert.equal(worksView(s)[0].whereName, '떠났다');
  assert.equal(worksView(s)[0].admire, '');
  const good = JSON.parse(JSON.stringify(s));
  const wrap = (st) => JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: st });
  assert.ok(parseSave(wrap(good)));
  const bads = [
    { buffs: { food: { name: 'x' } } },
    { works: [{ no: 1, subject: 'rabbit', grade: 9, where: 'bag' }] },
    { works: [{ no: 1, subject: 'rabbit', grade: 1, where: 'gift' }] },
    { cookFails: null },
    { party: [{ id: 'miru', hp: 1, crossed: 0, bond: 0 }, { id: 'miru', hp: 1, crossed: 0, bond: 0 }] },
    { sculpt: { subject: 'rabbit', cuts: 'x' } },
    { factions: { miners: 'a' } },
    { choice: { kind: 'hjob', id: 'oneway' } },
  ];
  for (const b of bads) assert.throws(() => parseSave(wrap({ ...good, ...b })), /망가졌습니다/, JSON.stringify(b));
});
