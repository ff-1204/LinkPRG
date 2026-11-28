// M5: 직업, 직업 스킬, 히든 직업, 세력과 성향.
import { mainMult } from '../src/core/statplan.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { jobChoices, jobName, skillsNow, jobXp, hiddenJobTraces } from '../src/core/jobs.js';
import { standingOf, standingName, factionView, leanName } from '../src/core/factions.js';
import { subView, offersOf, mainView } from '../src/core/quests.js';
import { pushOf } from '../src/core/craft.js';
import { valueOf } from '../src/core/derived.js';
import { parseSave } from '../src/core/save.js';
import { JOBS, JOB_ORDER, HIDDEN_JOBS, SKILL_LEVELS } from '../src/data/jobs.js';
import { FACTIONS } from '../src/data/factions.js';
import { ITEMS } from '../src/data/items.js';
import { RECIPES } from '../src/data/recipes.js';
import { BONDS } from '../src/data/people.js';

const fresh = (seed = 'm5', origin = 'smithboy', spent = {}) => createGame({ name: '도현', origin, spent, seed });
const lv = (s, n) => { s.level = n; s.hp = valueOf(s, 'maxHp'); s.mp = valueOf(s, 'maxMp'); };
const foe = (s, mon = 'crab', intent = 'shell') => { s.place = 'forest'; s.battle = { mon, hp: 9999, turn: 1, intent, stun: 0, weak: null, burn: 0, ward: null, streak: 0 }; s.status = []; };

test('직업 고르기: 다섯이 한눈에 보이고, 내 숙련도와 맞는 것이 표시된다 (N4-3)', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 40; i++) dispatch(s, { type: 'act', id: 'strike' });
  const list = jobChoices(s);
  assert.deepEqual(list.map((j) => j.name), ['전사', '궁수', '마법사', '사제', '도적']);
  assert.deepEqual(list.filter((j) => j.match).map((j) => j.name), ['전사'], '치기를 가장 많이 한 사람에게는 전사가 맞는다');
  for (const j of list) { assert.ok(j.first.name && j.first.text && j.role && j.next && j.fast.length); }
  assert.equal(list[0].first.name, '강타', '첫 스킬은 늘 공격 스킬 (Z126)');
});

test('직업은 레벨 5에 고른다. 한 번뿐이다. 고르지 않아도 된다 (T4, T8, N4-4)', () => {
  const s = fresh();
  assert.throws(() => dispatch(s, { type: 'career', op: 'choose', id: 'warrior' }), /레벨 5/);
  lv(s, 5);
  dispatch(s, { type: 'career', op: 'skip' });
  assert.equal(s.job, null);
  assert.equal(s.jobAsked, true);
  assert.equal(jobName(s), '무직');
  const ev = dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  assert.equal(jobName(s), '전사');
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'job'));
  assert.equal(countOf(s, 'oldshield'), 1, '직업 장비 하나를 받는다');
  assert.throws(() => dispatch(s, { type: 'career', op: 'choose', id: 'mage' }), /한 번만/);
  assert.equal(s.main.done[0]?.path, 'fight', '직업을 얻으면 1장의 싸우는 길이 끝난다');
  assert.ok(s.journal.some((j) => j.note === '전사가 된 날'));
});

test('직업에 맞는 숙련도는 1.5배 빨리 오른다 (T5)', () => {
  const gain = (job) => {
    const s = fresh('xp');
    dispatch(s, { type: 'move', to: 'training' });
    lv(s, 5);
    if (job) dispatch(s, { type: 'career', op: 'choose', id: job });
    s.skills.strike = { grade: 3, xp: 0, uses: 0 };
    dispatch(s, { type: 'act', id: 'strike' });
    return s.skills.strike.xp;
  };
  assert.ok(Math.abs(gain('warrior') / gain(null) - 1.5) < 1e-9);
  assert.ok(Math.abs(gain('mage') / gain(null) - 1) < 1e-9);
  assert.equal(jobXp({ job: 'archer' }, 'gathering'), 1.5);
});

test('직업 스킬은 레벨 5, 10, 15, 20에 하나씩 열리고, 단축 칸에 놓인다 (T6, T24)', () => {
  const s = fresh();
  dispatch(s, { type: 'move', to: 'training' });
  foe(s);
  assert.ok(slotsNow(s)[1].disabled);
  assert.ok(slotsNow(s)[1].why.includes('직업'));
  s.battle = null;
  lv(s, 5);
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  assert.deepEqual(skillsNow(s).map((x) => x.open), [true, false, false, false]);
  foe(s);
  assert.equal(slotsNow(s)[1].label, '강타 (마나 6)');
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'shieldup' }), /레벨 10/);
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'ember' }), /쓸 수 없는 스킬/);
  lv(s, 10);
  assert.deepEqual(skillsNow(s).map((x) => x.open), [true, true, false, false]);
  // 스킬이 둘 이상이면 싸우는 중에 고른다 (사용자 요청)
  assert.equal(slotsNow(s)[1].label, '스킬');
  assert.equal(slotsNow(s)[1].open, 'skillpick');
  dispatch(s, { type: 'quick', id: 'cleave' });
  s.mp = 2;
  assert.ok(slotsNow(s)[1].disabled, '어느 스킬도 쓸 마나가 없으면 꺼진다');
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'cleave' }), /마나가 모자랍니다/);
  for (const id of JOB_ORDER) { assert.equal(JOBS[id].skills[0].kind, 'atk', '1차의 첫 스킬은 공격 (Z126)'); assert.equal(JOBS[id].skills.length, SKILL_LEVELS.length); assert.equal(ITEMS[JOBS[id].gear].job, id); for (const sk of JOBS[id].skills) assert.ok(sk.name && sk.text && sk.say && sk.mp > 0); }
});

test('전사의 방패 올리기: 피해를 크게 줄이고, 돌진은 막고 되받아친다. 마나를 쓴다', () => {
  const s = fresh('shield');
  dispatch(s, { type: 'move', to: 'training' });
  lv(s, 10); // 방패 막기(방패 올리기)는 이제 레벨 10에 열린다 (Z126)
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  foe(s, 'boar', 'charge');
  const hp = s.hp, mp = s.mp;
  const ev = dispatch(s, { type: 'battle', choice: 'skill', index: 'shieldup' });
  assert.equal(s.hp, hp);
  assert.equal(s.mp, mp - 3);
  assert.ok(s.battle.hp < 9999);
  assert.ok(ev.some((e) => e.type === 'line' && /막고 되받아쳤다/.test(e.line.text)));
  // 그냥 치기를 막으면 방어(절반)보다 덜 받는다
  const taken = (choice) => { let sum = 0; for (let i = 0; i < 200; i++) { const t = fresh('sh' + i); dispatch(t, { type: 'move', to: 'training' }); lv(t, 10); dispatch(t, { type: 'career', op: 'choose', id: 'warrior' }); foe(t, 'boar', 'gore'); const b = t.hp; dispatch(t, choice); sum += b - t.hp; } return sum / 200; };
  assert.ok(taken({ type: 'battle', choice: 'skill', index: 'shieldup' }) < taken({ type: 'battle', choice: 'defend' }));
});

test('다른 직업의 스킬과 장비는 쓰지 못한다 (T6)', () => {
  const s = fresh();
  lv(s, 20);
  dispatch(s, { type: 'career', op: 'choose', id: 'mage' });
  addItem(s, 'oldshield', 1);
  assert.throws(() => dispatch(s, { type: 'equip', index: s.bag.findIndex((x) => x.id === 'oldshield') }), /전사만/);
  dispatch(s, { type: 'equip', index: s.bag.findIndex((x) => x.id === 'ashwand') });
  assert.equal(s.equip.weapon.id, 'ashwand');
  foe(s, 'rat', 'scurry');
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'skill', index: 'shieldup' }), /쓸 수 없는 스킬/);
  // 불씨: 방어를 무시하고, 적이 세 턴 동안 탄다
  dispatch(s, { type: 'battle', choice: 'skill', index: 'ember' });
  assert.ok(9999 - s.battle.hp >= Math.round(s.stats.wis * 2 * 0.9));
  assert.equal(s.battle.burn, 2, '첫 턴에 한 번 탔다');
  // 얼음 못: 적이 한 턴 못 움직인다
  s.battle.intent = 'bite';
  dispatch(s, { type: 'battle', choice: 'skill', index: 'frost' });
  const hp = s.hp;
  s.battle.intent = 'bite';
  if (s.battle.stun > 0) { const ev = dispatch(s, { type: 'battle', choice: 'defend' }); assert.equal(s.hp, hp); assert.ok(ev.some((e) => e.type === 'line' && /움직이지 못한다/.test(e.line.text))); }
});

test('사제는 고치고 씻어 낸다. 도적의 연막은 반드시 달아난다', () => {
  const p = fresh('pr');
  lv(p, 15); // 정화(씻어 내기)는 이제 레벨 15 (Z126)
  p.hidden.luck = { value: 1, half: true }; // 사제는 행운을 찾은 사람만 고른다 (Z116)
  dispatch(p, { type: 'career', op: 'choose', id: 'priest' });
  foe(p);
  p.hp = 10;
  p.status = [{ id: 'bleed', turns: 3 }];
  dispatch(p, { type: 'battle', choice: 'skill', index: 'wash' });
  assert.equal(p.status.length, 0);
  assert.ok(p.hp > 10);
  p.hp = 10;
  p.battle.intent = 'shell';
  const laid = dispatch(p, { type: 'battle', choice: 'skill', index: 'lay' });
  // 주 스탯 보너스(지혜와 행운)가 치유에도 붙고, 행운이 받치면 큰 치유가 든다 (Z116)
  const big = laid.some((e) => e.type === 'line' && /큰 치유/.test(e.line.text));
  assert.equal(p.hp, 10 + Math.round(p.stats.wis * 3 * mainMult(p) * (big ? 1.5 : 1)));
  assert.ok(mainMult(p) > 1.1, '사제는 행운 +10만으로도 10% 넘게 세다');
  const r = fresh('rg');
  lv(r, 15); // 연막탄(연막)은 이제 레벨 15 (Z126)
  dispatch(r, { type: 'career', op: 'choose', id: 'rogue' });
  foe(r, 'spider', 'crush');
  const ev = dispatch(r, { type: 'battle', choice: 'skill', index: 'smoke' });
  assert.equal(r.battle, null);
  assert.ok(ev.some((e) => e.type === 'battle' && e.phase === 'fled'));
});

test('히든 직업 한길꾼: 인내와 교관의 부탁을 채우면 제안이 오고, 받으면 기본 직업을 고를 수 없다 (N5)', () => {
  const s = fresh('hj');
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 300; i++) dispatch(s, { type: 'act', id: 'strike' });
  assert.deepEqual(hiddenJobTraces(s), []);
  dispatch(s, { type: 'greet', npc: 'instructor' });
  dispatch(s, { type: 'choose', id: 'accept' });
  s.place = 'forest';
  s.battle = { mon: 'boar', hp: 1, turn: 1, intent: 'gore', stun: 0, weak: null, burn: 0, ward: null, streak: 0 }; s.status = []; s.hp = 100;
  dispatch(s, { type: 'battle', choice: 'attack' });
  s.place = 'training';
  const ev = dispatch(s, { type: 'greet', npc: 'instructor' });
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'hiddenjob').ding;
  assert.equal(d.level, 4);
  assert.ok(d.title.includes('한길꾼'));
  assert.ok(d.reason, '찾은 까닭');
  assert.ok(d.body.includes('얻는 것') && d.body.includes('잃는 것'));
  assert.equal(s.choice.kind, 'hjob');
  assert.equal(s.main.done[0].path, 'hidden', '메인 1장은 숨은 길로 끝난다');
  // 거절하면 다시 오지 않는다
  const no = JSON.parse(JSON.stringify(s));
  dispatch(no, { type: 'choose', id: 'decline' });
  assert.equal(no.hjobs.oneway, 'declined');
  for (let i = 0; i < 3; i++) assert.ok(!dispatch(no, { type: 'greet', npc: 'instructor' }).some((e) => e.type === 'ding' && e.ding.kind === 'hiddenjob'));
  lv(no, 5);
  dispatch(no, { type: 'career', op: 'choose', id: 'warrior' });
  // 받으면
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(jobName(s), '한길꾼');
  lv(s, 5);
  assert.throws(() => dispatch(s, { type: 'career', op: 'choose', id: 'warrior' }), /한 번만/);
  assert.equal(skillsNow(s)[0].name, '한 번 더');
  // 같은 공격을 이어서 할수록 세진다
  foe(s);
  const hits = [];
  for (let i = 0; i < 8; i++) { const b = s.battle.hp; s.battle.intent = 'shell'; s.equip.weapon.dur = 60; dispatch(s, { type: 'battle', choice: 'attack' }); hits.push(b - s.battle.hp); }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(hits.slice(5)) > avg(hits.slice(0, 3)), `${hits}`);
  s.battle.intent = 'shell';
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(s.battle.streak, 0, '다른 일을 하면 쌓인 것이 끊긴다');
});

test('히든 직업 둘 더: 조건을 채우면 제안이 뜬다 (M5-5)', () => {
  // 손빛: 예술과 손재주가 생기고, 폐허의 모루에 새겨진 이름을 읽었다
  const a = fresh('hl');
  a.hidden.art = { value: 1, half: true }; a.counters.works = 10;
  a.hidden.craft = { value: 1, half: true }; a.counters.crafts = 50;
  a.place = 'ruins'; a.opened.push('ruins');
  a.choice = { kind: 'incident', id: 'anvil', place: 'ruins' };
  const ev = dispatch(a, { type: 'choose', id: 'read' });
  assert.ok(a.flags.readAnvil);
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.title.includes('손빛')));
  const before = pushOf(a, RECIPES.ironsword, 0, 0).total;
  dispatch(a, { type: 'choose', id: 'accept' });
  assert.equal(jobName(a), '손빛');
  assert.ok(Math.abs(pushOf(a, RECIPES.ironsword, 0, 0).total - before - 0.25) < 1e-9);
  assert.deepEqual(skillsNow(a), []);
  // 무명객: 레벨 30이 되도록 무직
  const b = fresh('nl');
  lv(b, 29); b.xp = 0;
  dispatch(b, { type: 'act', id: 'look' });
  assert.equal(b.hjobs.nameless, undefined);
  lv(b, 30);
  const ev2 = dispatch(b, { type: 'act', id: 'look' });
  assert.ok(ev2.some((e) => e.type === 'ding' && e.ding.title.includes('무명객')));
  dispatch(b, { type: 'choose', id: 'accept' });
  const unspent = b.unspent;
  b.xp = 1e9; // 다음 레벨까지 한 번만 오르게
  b.xp = 20 * 900 + 60 * 30 + 20 - 1;
  b.place = 'forest'; b.battle = { mon: 'rat', hp: 1, turn: 1, intent: 'scurry', stun: 0, weak: null, burn: 0, ward: null, streak: 0 }; b.status = [];
  dispatch(b, { type: 'battle', choice: 'attack' });
  assert.equal(b.level, 31);
  assert.equal(b.unspent, unspent + 4, '레벨이 오를 때 점수를 하나 더 받는다');
  // 직업이 있는 사람에게는 무명객이 오지 않는다
  const c = fresh('nl2');
  lv(c, 5); dispatch(c, { type: 'career', op: 'choose', id: 'rogue' }); lv(c, 30);
  dispatch(c, { type: 'act', id: 'look' });
  assert.equal(c.hjobs.nameless, undefined);
  for (const j of Object.values(HIDDEN_JOBS)) assert.ok(j.name && j.why && j.offer && j.gain && j.lose);
});

test('세력: 한쪽이 오르면 맞수는 내린다. 다섯 단계와 그 아래의 미움 (T32)', () => {
  const s = fresh('fc');
  assert.equal(standingName(s, 'miners'), '남');
  s.jobs.push({ id: 'spider1', have: 1, due: 9 });
  dispatch(s, { type: 'job', op: 'finish', id: 'spider1' });
  assert.equal(s.factions.miners, 10);
  assert.equal(s.factions.merchants, -5);
  assert.equal(standingName(s, 'miners'), '낯익음');
  assert.equal(standingName(s, 'merchants'), '남');
  s.factions.merchants = -11;
  assert.equal(standingName(s, 'merchants'), '미움');
  assert.equal(standingOf(s, 'merchants'), 0);
  for (const f of Object.values(FACTIONS)) assert.equal(FACTIONS[f.rival].rival, f.id, '맞수는 서로 맞수다');
  assert.equal(factionView(s).length, 4);
  const orphan = fresh('or', 'orphan');
  assert.equal(standingName(orphan, 'temple'), '낯익음', '신전 고아는 신전과 낯익다');
  assert.equal(leanName(s), '어느 쪽도 아닌 이');
});

test('광맥 다툼: 고르기 전에 결과가 보이고, 조합장 편에 서면 조합이 오르고 상단이 내린다 (T29, T30)', () => {
  const start = (seed) => { const s = fresh(seed); lv(s, 5); s.place = 'mine'; assert.deepEqual(offersOf(s, 'foreman'), ['vein']); dispatch(s, { type: 'quest', op: 'accept', id: 'vein' }); return s; };
  const low = fresh('v0');
  low.place = 'mine';
  assert.deepEqual(offersOf(low, 'foreman'), [], '레벨 5가 되어야 나타난다');
  const s = start('v1');
  const ch = subView(s, 'vein').step.choices;
  assert.deepEqual(ch.map((c) => c.id), ['miners', 'merchants', 'both', 'none']);
  const mine = ch.find((c) => c.id === 'miners');
  assert.ok(mine.fx.includes('광부 조합 오름') && mine.fx.includes('상단 내림') && mine.fx.includes('의로움'));
  assert.ok(ch.find((c) => c.id === 'merchants').fx.includes('은화 +60'));
  assert.ok(!ch.find((c) => c.id === 'both').can, '양쪽과 다 단골이어야 열린다');
  dispatch(s, { type: 'quest', op: 'choose', id: 'vein', choice: 'miners' });
  assert.equal(s.factions.miners, 30);
  assert.equal(s.factions.merchants, -15);
  assert.equal(standingName(s, 'miners'), '단골');
  assert.equal(standingName(s, 'merchants'), '미움');
  assert.equal(s.lean, 1);
  // 상단 편
  const m = start('v2');
  dispatch(m, { type: 'quest', op: 'choose', id: 'vein', choice: 'merchants' });
  assert.equal(m.silver, 60);
  assert.equal(standingName(m, 'merchants'), '단골');
  // 끼어들지 않는다
  const n = start('v3');
  dispatch(n, { type: 'quest', op: 'choose', id: 'vein', choice: 'none' });
  assert.ok(n.quests.vein.done);
  assert.deepEqual(n.factions, {});
  // 셋째 길
  const b = start('v4');
  b.factions.miners = 30; b.factions.merchants = 30;
  assert.ok(subView(b, 'vein').step.choices.find((c) => c.id === 'both').can);
  dispatch(b, { type: 'quest', op: 'choose', id: 'vein', choice: 'both' });
  assert.equal(b.factions.miners, 45);
  assert.equal(b.factions.merchants, 45, '둘을 한자리에 앉히면 어느 쪽도 내리지 않는다');
});

test('신전과 뒷골목: 양쪽 편과 끼어들지 않는다로 끝까지 갈 수 있다 (M5-7)', () => {
  const start = (seed) => { const s = fresh(seed); s.people.priest = { pts: BONDS[1].at, talked: 0, likes: [], dislikes: [], stats: [], met: true }; dispatch(s, { type: 'move', to: 'temple' }); dispatch(s, { type: 'quest', op: 'accept', id: 'alms' }); return s; };
  const ends = new Set();
  for (const id of ['temple', 'alley', 'none']) {
    const s = start('al-' + id);
    dispatch(s, { type: 'quest', op: 'choose', id: 'alms', choice: id });
    assert.ok(s.quests.alms.done);
    ends.add(s.quests.alms.ending);
    if (id === 'temple') { assert.equal(standingName(s, 'temple'), '단골'); assert.ok(s.factions.alley < 0); }
    if (id === 'alley') { assert.equal(standingName(s, 'alley'), '단골'); assert.equal(countOf(s, 'riceball'), 5); }
  }
  assert.equal(ends.size, 3);
});

test('4판 저장을 읽으면 5판으로 올라온다', () => {
  const s = fresh('v4', 'orphan');
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['jobAsked', 'hjobs', 'quick', 'factions']) delete old[k];
  old.v = 4;
  const up = parseSave(JSON.stringify({ v: 4, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.factions.temple, 10);
  lv(up, 5);
  dispatch(up, { type: 'career', op: 'choose', id: 'archer' });
  assert.equal(jobName(up), '궁수');
  assert.ok(mainView(up));
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), job: 'king' } })), /모르는 직업/);
});

// ── 검토에서 나온 것들 ──
test('감싸는 스킬은 누가 먼저든 적힌 횟수만큼 듣는다. 막는 스킬은 늘 마나가 든다', () => {
  for (const agi of [30, 1]) {
    const s = fresh('ward' + agi);
    dispatch(s, { type: 'move', to: 'training' });
    lv(s, 20); s.stats.agi = agi; s.stats.con = 40; lv(s, 20);
    dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
    foe(s, 'boar', 'gore');
    dispatch(s, { type: 'battle', choice: 'skill', index: 'brace' });
    let cut = agi === 30 ? 1 : 0; // 내가 먼저면 건 턴의 공격부터 듣는다
    for (let i = 0; i < 6; i++) { s.battle.intent = 'gore'; s.battle.hp = 9999; const had = !!s.battle.ward; dispatch(s, { type: 'battle', choice: 'defend' }); if (had) cut++; }
    assert.equal(cut, 3, `민첩 ${agi}`);
    // 방패 올리기: 적이 먼저여도 마나가 든다
    s.battle.intent = 'charge'; s.battle.hp = 9999;
    const mp = s.mp;
    dispatch(s, { type: 'battle', choice: 'skill', index: 'shieldup' });
    assert.equal(s.mp, mp - 3);
  }
});

test('히든 직업을 받으면 옛 직업의 전용 장비는 벗겨진다. 둘을 한자리에의 미리 보기에는 내리는 쪽이 없다', () => {
  const s = fresh('gear');
  lv(s, 5);
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  dispatch(s, { type: 'equip', index: s.bag.findIndex((x) => x.id === 'oldshield') });
  s.hjobs.oneway = 'offered'; s.choice = { kind: 'hjob', id: 'oneway' };
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.equip.off, null);
  assert.equal(countOf(s, 'oldshield'), 1);
  const t = fresh('flat'); lv(t, 5); t.place = 'mine';
  dispatch(t, { type: 'quest', op: 'accept', id: 'vein' });
  const fx = subView(t, 'vein').step.choices.find((c) => c.id === 'both').fx;
  assert.ok(fx.includes('광부 조합 오름') && fx.includes('상단 오름') && !fx.includes('내림'), fx);
});
