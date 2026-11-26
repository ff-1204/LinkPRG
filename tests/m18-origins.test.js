// 출신 서른 가지와 패 다섯 장, 등급 (Z25)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { ORIGINS, ROOTS, ORIGIN_GRADES, dealOrigins, originById, rollDice, rootOf } from '../src/data/origins.js';
import { countOf, addItem } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { repairCost } from '../src/core/gear.js';
import { jobXp } from '../src/core/jobs.js';
import { subView } from '../src/core/quests.js';
import { START_SCENES } from '../src/data/scenes.js';
import { ITEMS } from '../src/data/items.js';
import { SKILL_NAMES } from '../src/core/skills.js';

const make = (origin, seed = 'o') => createGame({ name: '출신', origin, rolled: rollDice('same'), seed });

test('출신은 서른 가지, 뿌리 여섯에 다섯씩. 등급은 일반 12, 고급 9, 희귀 6, 영웅 2, 전설 1', () => {
  assert.equal(ORIGINS.length, 30);
  assert.equal(new Set(ORIGINS.map((o) => o.id)).size, 30);
  assert.equal(new Set(ORIGINS.map((o) => o.name)).size, 30);
  for (const root of Object.keys(ROOTS)) assert.equal(ORIGINS.filter((o) => o.root === root).length, 5, root);
  assert.deepEqual([0, 1, 2, 3, 4].map((g) => ORIGINS.filter((o) => o.grade === g).length), [12, 9, 6, 2, 1]);
  // 등급이 높을수록 스탯이 많다
  const sum = (o) => Object.values(o.stats).reduce((a, b) => a + b, 0);
  for (const o of ORIGINS) {
    assert.ok(sum(o) <= [2, 2, 3, 4, 5][o.grade], `${o.name}: 스탯 ${sum(o)}`);
    if (o.grade >= 2) assert.equal(sum(o), [0, 0, 3, 4, 5][o.grade], o.name);
    assert.ok(o.story.length > 20 && o.number && o.talk, o.name);
    for (const id of Object.keys(o.skills)) assert.ok(SKILL_NAMES[id], `${o.name}: 숙련도 ${id}`);
    for (const [id] of o.items) assert.ok(ITEMS[id], `${o.name}: 물건 ${id}`);
    assert.ok(START_SCENES[o.id]?.journal && START_SCENES[o.id].lines.length >= 2, `${o.name}: 첫 장면`);
  }
});

test('서른 가지 모두로 시작할 수 있고, 적힌 스탯·숙련도·은화·물건을 들고 나온다', () => {
  const dice = rollDice('same');
  for (const o of ORIGINS) {
    const s = make(o.id);
    for (const k of ['str', 'agi', 'con', 'wis']) assert.equal(s.stats[k], dice[k] + (o.stats[k] || 0), `${o.name} ${k}`);
    for (const [id, grade] of Object.entries(o.skills)) assert.equal(s.skills[id].grade, grade, `${o.name} ${id}`);
    for (const [id, n] of o.items) assert.ok(countOf(s, id) >= n || s.bag.some((x) => x.id === id), `${o.name} ${id}`);
    assert.ok(s.silver >= o.silver, o.name);
    assert.equal(s.journal[0].text, START_SCENES[o.id].journal);
    assert.ok(s.log.some((l) => l.text === START_SCENES[o.id].lines[1][1]), `${o.name}: 첫 장면이 대화방에 뜬다`);
    // 한 걸음 걸어 봐도 멀쩡하다
    dispatch(s, { type: 'move', to: 'training' });
    dispatch(s, slotsNow(s).find((x) => x.label === '치기').action);
  }
});

test('패 다섯 장: 서로 다른 다섯 가지가 나오고, 등급이 높을수록 드물다', () => {
  const count = [0, 0, 0, 0, 0];
  const N = 6000;
  for (let i = 0; i < N; i++) {
    const hand = dealOrigins(`deal|${i}`);
    assert.equal(hand.length, 5);
    assert.equal(new Set(hand).size, 5);
    for (const id of hand) count[originById(id).grade]++;
  }
  const share = count.map((c) => c / (N * 5));
  assert.ok(share[0] > share[1] && share[1] > share[2] && share[2] > share[3] && share[3] > share[4], share.map((x) => x.toFixed(4)).join(' '));
  assert.ok(share[4] > 0 && share[4] < 0.01, `전설 ${share[4]}`);
  assert.deepEqual(dealOrigins('같은 글'), dealOrigins('같은 글'));
  assert.notDeepEqual(dealOrigins('deal|1'), dealOrigins('deal|2'));
  assert.equal(ORIGIN_GRADES.length, 5);
});

test('같은 뿌리의 출신은 퀘스트에서 같은 대답이 열린다', () => {
  const ledger = (origin) => {
    const s = make(origin, 'ledger-' + origin);
    s.people.keeper = { ...(s.people.keeper || {}), pts: 10, met: true }; // 주점 주인과 낯익은 사이
    dispatch(s, { type: 'move', to: 'tavern' });
    dispatch(s, { type: 'quest', op: 'accept', id: 'ledger' });
    dispatch(s, { type: 'move', to: 'forge' });
    return subView(s, 'ledger').step.choices.find((c) => c.id === 'errand');
  };
  for (const id of ['smithboy', 'minerkid', 'tinker']) {
    assert.equal(rootOf(id), 'smithboy');
    const c = ledger(id);
    assert.ok(c && c.chance === null, id + ': 판정 없이 통하는 대답이 열린다');
  }
  assert.equal(ledger('farmer'), undefined, '다른 뿌리에는 보이지 않는다');
  assert.equal(rootOf('nobody'), null);
});

test('덤이 실제로 듣는다', () => {
  // 숯쟁이: 더디게 지친다
  const a = make('smithboy'), b = make('charcoal');
  a.place = b.place = 'training';
  for (let i = 0; i < 30; i++) { dispatch(a, { type: 'act', id: 'strike' }); dispatch(b, { type: 'act', id: 'strike' }); }
  assert.ok(b.tired < a.tired);
  // 편자공의 조수: 수리 값 절반
  const sword = { id: 'ironsword', grade: 0, n: 1, dur: 10 };
  assert.ok(repairCost(make('farrier'), sword) < repairCost(make('smithboy'), sword));
  // 짐꾼: 무게 한도 +5 (스탯이 같은 방앗간 일꾼과 견준다)
  assert.equal(valueOf(make('porter'), 'carry'), valueOf(make('miller'), 'carry') + 5);
  // 순례자: 빵 둘
  const p = make('pilgrim');
  dispatch(p, { type: 'move', to: 'temple' });
  dispatch(p, { type: 'act', id: 'bread' });
  assert.equal(countOf(p, 'bread'), 2);
  // 종지기의 아이: 모든 숙련도가 5% 빨리
  assert.ok(Math.abs(jobXp(make('ringerkid'), 'strike', false) / jobXp(make('orphan'), 'strike', false) - 1.05) < 1e-9);
  // 기사의 종자: 무직이어도 낡은 방패를 든다. 다른 사람은 못 든다
  const q = make('squire');
  dispatch(q, { type: 'equip', index: q.bag.findIndex((x) => x.id === 'oldshield') });
  assert.equal(q.equip.off.id, 'oldshield');
  const n = make('smithboy'); addItem(n, 'oldshield');
  assert.throws(() => dispatch(n, { type: 'equip', index: n.bag.findIndex((x) => x.id === 'oldshield') }), /만 쓸 수 있습니다/);
  // 약초꾼의 아이: 먹는 것의 효과가 크다
  const h = make('herbkid'); h.full = 10;
  dispatch(h, { type: 'use', index: h.bag.findIndex((x) => x.id === 'riceball') });
  assert.equal(h.full, 10 + 36);
  // 묘지기: 기도 20번에 그림자 한 겹이 걷힌다
  const g = make('gravekeeper');
  assert.equal(g.flags.weakFast, true);
});
