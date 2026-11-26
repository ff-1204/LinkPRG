// M3: 제작, 등급 확률, 쇠가 식는다, 스킬 진화, 일하는 직업, 상점, 보관함.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, modeOf, craftView, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { gradeOdds, pushOf, recipeList } from '../src/core/craft.js';
import { branchOf, pendingEvolves, evolveView } from '../src/core/evolve.js';
import { shopView, buyPrice, sellPrice, storeView, STORE_CAP } from '../src/core/trade.js';
import { fall } from '../src/core/fall.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { xpNeeded } from '../src/core/skills.js';
import { GRADE_BASE, RECIPES } from '../src/data/recipes.js';
import { EVOLVE, EVOLVE_AT } from '../src/data/evolve.js';
import { ITEMS } from '../src/data/items.js';
import { SHOPS } from '../src/data/shops.js';
import { parseSave } from '../src/core/save.js';

const smith = (seed = 'm3') => {
  const s = createGame({ name: '태윤', origin: 'smithboy', spent: {}, seed });
  s.craftLv.smith.lv = 3; // 철검은 대장 레벨 3에 열린다 (Z79)
  dispatch(s, { type: 'move', to: 'forge' });
  s.bag = [];
  addItem(s, 'ironore', 60);
  addItem(s, 'oakbranch', 10);
  return s;
};
const hammerAll = (s) => { let ev = []; while (s.craft) { ev = ev.concat(dispatch(s, { type: 'hammer' })); s.full = 80; } return ev; };

test('검 한 자루는 망치질 열두 번이다. 한 번에 여러 번 치는 길은 없다 (N1-1)', () => {
  const s = smith();
  const ev = dispatch(s, { type: 'craft', recipe: 'ironsword' });
  assert.ok(ev.some((e) => e.type === 'craft' && e.phase === 'start'));
  assert.equal(countOf(s, 'ironore'), 54);
  assert.equal(countOf(s, 'oakbranch'), 9);
  assert.equal(modeOf(s), 'craft');
  for (let i = 1; i <= 11; i++) {
    dispatch(s, { type: 'hammer', times: 12, n: 12 });
    assert.equal(s.craft.hits, i, '한 번 누르면 한 번');
    assert.equal(countOf(s, 'ironsword'), 0);
  }
  const last = dispatch(s, { type: 'hammer' });
  assert.equal(s.craft, null);
  assert.equal(countOf(s, 'ironsword'), 1);
  const made = s.bag.find((x) => x.id === 'ironsword');
  assert.equal(made.maker, '태윤', '만든 이의 이름이 새겨진다');
  assert.ok(last.some((e) => e.type === 'ding' && ['craft', 'legend'].includes(e.ding.kind)));
  assert.equal(s.counters.act.hammer, 12);
  assert.equal(s.made, 1);
});

test('재료가 모자라면 시작할 수 없고, 대장간이 아니면 만들 수 없다', () => {
  const s = smith();
  s.bag = [];
  addItem(s, 'ironore', 5);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'ironsword' }), /모자랍니다/);
  assert.equal(countOf(s, 'ironore'), 5, '모자라면 아무것도 들어가지 않는다');
  assert.equal(recipeList(s).find((r) => r.id === 'ironsword').can, false);
  dispatch(s, { type: 'move', to: 'plaza' });
  addItem(s, 'ironore', 6); addItem(s, 'oakbranch', 1);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'ironsword' }), /화덕이 없/);
});

test('만드는 동안에는 다른 일을 못 하고, 그만두면 재료를 잃는다 (N1-4)', () => {
  const s = smith();
  dispatch(s, { type: 'craft', recipe: 'ironsword' });
  dispatch(s, { type: 'hammer' });
  assert.throws(() => dispatch(s, { type: 'move', to: 'plaza' }), /끝내거나 그만두어야/);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'ironsword' }), /끝내거나 그만두어야/);
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['망치질 1 / 12', '다시 달구기', '그만둔다']);
  assert.ok(slotsNow(s)[2].confirm);
  dispatch(s, { type: 'craftQuit' });
  assert.equal(s.craft, null);
  assert.equal(countOf(s, 'ironore'), 54);
  assert.equal(countOf(s, 'ironsword'), 0);
});

test('쇠가 식는다: 늦게 치면 튕기고, 다시 달궈야 이어진다 (N1-5)', () => {
  const s = smith();
  dispatch(s, { type: 'craft', recipe: 'ironsword' });
  dispatch(s, { type: 'hammer', late: true }); // 첫 망치질은 늦을 것이 없다
  assert.equal(s.craft.hits, 1);
  dispatch(s, { type: 'hammer' });
  const ev = dispatch(s, { type: 'hammer', late: true });
  assert.equal(s.craft.hits, 2, '식은 쇠는 쳐지지 않는다');
  assert.ok(s.craft.cold);
  assert.ok(ev.some((e) => e.type === 'line' && /쇠가 식었다/.test(e.line.text)));
  assert.throws(() => dispatch(s, { type: 'hammer' }), /다시 달궈야/);
  assert.ok(slotsNow(s)[0].disabled);
  assert.ok(!slotsNow(s)[1].disabled);
  assert.equal(craftView(s).cold, true);
  dispatch(s, { type: 'reheat' });
  assert.equal(s.craft.cold, false);
  assert.equal(s.craft.warm, 1, '식혔다 달구면 그만큼 깎인다');
  assert.throws(() => dispatch(s, { type: 'reheat' }), /아직 뜨겁/);
  hammerAll(s);
  assert.equal(countOf(s, 'ironsword'), 1);
});

test('그림은 망치질 4번째와 9번째에 바뀐다 (X1)', () => {
  const s = smith();
  dispatch(s, { type: 'craft', recipe: 'ironsword' });
  const stages = [];
  for (let i = 1; i <= 11; i++) { dispatch(s, { type: 'hammer' }); stages.push(craftView(s).stage); }
  assert.deepEqual(stages, [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3]);
});

test('등급 확률: 처음 값은 52·30·14·3.5·0.5이고 합은 늘 100이다 (N1-2)', () => {
  assert.deepEqual(gradeOdds(0).map((x) => Math.round(x * 10) / 10), GRADE_BASE);
  for (const p of [0, 0.3, 1, 2.5]) assert.ok(Math.abs(gradeOdds(p).reduce((a, x) => a + x, 0) - 100) < 1e-9);
  assert.ok(gradeOdds(1)[4] > gradeOdds(0.3)[4]);
  assert.ok(gradeOdds(1)[0] < gradeOdds(0.3)[0]);
});

test('확률을 움직이는 것 넷: 숙련도, 손재주, 재료 품질, 식기 전에 친 횟수 (N1-3)', () => {
  const s = smith();
  const r = RECIPES.ironsword;
  const base = pushOf(s, r, 0, 0).total;
  s.skills.smithing.grade += 5;
  const withSkill = pushOf(s, r, 0, 0).total;
  assert.ok(withSkill > base);
  s.hidden.craft = { value: 3, half: true };
  const withCraft = pushOf(s, r, 0, 0).total;
  assert.ok(withCraft > withSkill);
  assert.ok(pushOf(s, r, 0, 1).total > withCraft);
  assert.ok(pushOf(s, r, 12, 0).total > pushOf(s, r, 6, 0).total);
  // 품질 좋은 재료를 쓰면 그 품질이 셈에 들어간다
  const t = smith('q');
  t.bag = [];
  addItem(t, 'ironore', 6, { grade: 2 });
  addItem(t, 'oakbranch', 1);
  dispatch(t, { type: 'craft', recipe: 'ironsword' });
  assert.ok(Math.abs(t.craft.quality - 12 / 7) < 1e-9);
});

test('제작 창에 보인 확률과 만 번 만든 결과가 맞는다 (M3-2)', () => {
  const s = smith('odds');
  const shown = recipeList(s).find((r) => r.id === 'ironsword').best;
  const got = [0, 0, 0, 0, 0];
  const N = 10000;
  for (let i = 0; i < N; i++) {
    s.bag = [];
    addItem(s, 'ironore', 6); addItem(s, 'oakbranch', 1);
    s.skills.smithing = { grade: 1, xp: 0, uses: 0 }; s.counters.crafts = 0; s.hidden = {}; s.made = 0; s.choice = null; s.log = []; s.dings = []; s.journal = [];
    dispatch(s, { type: 'craft', recipe: 'ironsword' });
    for (let k = 0; k < 11; k++) dispatch(s, { type: 'hammer' });
    s.skills.smithing = { grade: 1, xp: 0, uses: 0 };
    const ev = dispatch(s, { type: 'hammer' });
    got[ev.find((e) => e.type === 'craft' && e.phase === 'done').grade] += 1;
    s.full = 80; s.tick = 0; s.phase = 0;
  }
  for (let g = 0; g < 5; g++) assert.ok(Math.abs((got[g] / N) * 100 - shown[g]) < 1.5, `등급 ${g}: ${(got[g] / N) * 100} ≠ ${shown[g]}`);
});

test('높은 등급을 띄울수록 손재주의 재료가 많이 쌓이고, 전설은 가장 큰 띠링이다 (M3-5)', () => {
  // 전설이 뜨는 씨앗을 찾는다
  let legend = null;
  for (let i = 0; i < 4000 && !legend; i++) {
    const s = smith('L' + i);
    s.skills.smithing.grade = 30;
    dispatch(s, { type: 'craft', recipe: 'ironsword' });
    const ev = hammerAll(s);
    const done = ev.find((e) => e.type === 'craft' && e.phase === 'done');
    if (done.grade === 4) legend = { s, ev };
    else assert.equal(s.counters.crafts, 1 + done.grade);
  }
  assert.ok(legend, '전설이 한 번은 뜬다');
  const d = legend.ev.find((e) => e.type === 'ding' && e.ding.kind === 'legend').ding;
  assert.equal(d.level, 4);
  assert.equal(d.big, '전설 등급');
  assert.equal(legend.s.counters.crafts, 5);
  const sword = legend.s.bag.find((x) => x.id === 'ironsword');
  assert.equal(sword.grade, 4);
  assert.equal(sword.maker, '태윤');
  assert.ok(legend.s.journal.at(-1).note.includes('전설'));
  // 히든은 여전히 이름을 내보내지 않는다
  assert.ok(!JSON.stringify(hiddenSlots(legend.s).filter((x) => !x.found)).includes('손재주'));
});

test('스킬 진화: 중급이 되면 갈래 둘이 뜨고, 고른 쪽 효과만 적용된다 (N4-1)', () => {
  const s = createGame({ name: '덕수', origin: 'farmer', spent: {}, seed: 'ev' });
  s.place = 'mine';
  s.skills.mining = { grade: EVOLVE_AT - 1, xp: 0, uses: 0 };
  assert.deepEqual(pendingEvolves(s), []);
  assert.throws(() => dispatch(s, { type: 'evolve', skill: 'mining', branch: 'vein' }), /중급이 되어야/);
  s.skills.mining.xp = xpNeeded(EVOLVE_AT - 1) - 0.5;
  const ev = dispatch(s, { type: 'act', id: 'mine' });
  assert.equal(s.skills.mining.grade, EVOLVE_AT);
  assert.ok(ev.some((e) => e.type === 'evolve' && e.skill === 'mining'));
  assert.deepEqual(pendingEvolves(s), ['mining']);
  assert.ok(!dispatch(s, { type: 'act', id: 'mine' }).some((e) => e.type === 'evolve'), '한 번만 알린다');
  const v = evolveView(s, 'mining');
  assert.equal(v.branches.length, 2);
  for (const b of v.branches) { assert.ok(b.gain); assert.ok(b.lose); }

  // 나중에 골라도 된다. 고르기 전에는 아무 효과도 없다
  assert.equal(branchOf(s, 'mining'), null);
  dispatch(s, { type: 'evolve', skill: 'mining', branch: 'vein' });
  assert.equal(branchOf(s, 'mining').id, 'vein');
  assert.throws(() => dispatch(s, { type: 'evolve', skill: 'mining', branch: 'steady' }), /이미 골랐/);

  const count = (branch) => {
    const t = createGame({ name: '덕수', origin: 'farmer', spent: {}, seed: 'cmp' });
    t.place = 'mine'; t.bag = [];
    t.skills.mining = { grade: EVOLVE_AT, xp: 0, uses: 0 };
    if (branch) t.evolve.mining = branch;
    for (let i = 0; i < 1500; i++) { dispatch(t, { type: 'act', id: 'mine' }); t.full = 80; t.skills.mining = { grade: EVOLVE_AT, xp: 0, uses: 0 }; }
    return { copper: countOf(t, 'copperore'), all: countOf(t, 'copperore') + countOf(t, 'ironore') };
  };
  const none = count(null), vein = count('vein'), steady = count('steady');
  assert.ok(vein.copper > none.copper * 1.4, `맥 읽기: 구리 ${vein.copper} / ${none.copper}`);
  assert.ok(vein.all < none.all, '맥 읽기는 허탕이 는다');
  assert.ok(steady.all > none.all, '끈질긴 곡괭이는 허탕이 준다');
});

test("갈래는 '잊는 물'로만 되돌린다 (N4-2)", () => {
  const s = createGame({ name: '덕수', origin: 'farmer', spent: {}, seed: 'fg' });
  s.skills.fishing = { grade: EVOLVE_AT, xp: 0, uses: 0 };
  dispatch(s, { type: 'evolve', skill: 'fishing', branch: 'small' });
  assert.throws(() => dispatch(s, { type: 'forget', skill: 'fishing' }), /잊는 물이 없/);
  addItem(s, 'forgetwater', 1);
  dispatch(s, { type: 'forget', skill: 'fishing' });
  assert.equal(branchOf(s, 'fishing'), null);
  assert.equal(countOf(s, 'forgetwater'), 0);
  dispatch(s, { type: 'evolve', skill: 'fishing', branch: 'patient' });
  assert.equal(branchOf(s, 'fishing').id, 'patient');
  for (const [skill, list] of Object.entries(EVOLVE)) { assert.equal(list.length, 2, skill); for (const b of list) assert.ok(b.gain && b.lose && b.name); }
});

test('치기의 갈래는 싸움에서 드러난다', () => {
  const dealt = (branch) => {
    let sum = 0;
    for (let i = 0; i < 300; i++) {
      const t = createGame({ name: '가', origin: 'smithboy', spent: {}, seed: 'sb' + i });
      dispatch(t, { type: 'move', to: 'training' });
      t.place = 'forest';
      if (branch) { t.skills.strike = { grade: EVOLVE_AT, xp: 0, uses: 0 }; t.evolve.strike = branch; } else t.skills.strike = { grade: EVOLVE_AT, xp: 0, uses: 0 };
      t.battle = { mon: 'crab', hp: 9999, turn: 1, intent: 'shell' };
      dispatch(t, { type: 'battle', choice: 'attack' });
      sum += 9999 - t.battle.hp;
    }
    return sum / 300;
  };
  const none = dealt(null), heavy = dealt('heavy');
  assert.ok(heavy > none * 1.05, `${heavy} / ${none}`);
});

test('대장간에서 세 자루를 만들면 주인이 일을 권한다. 받으면 대장장이가 되고 숙련도가 빨리 오른다 (T7)', () => {
  const s = smith('work');
  for (let i = 0; i < 3; i++) { dispatch(s, { type: 'craft', recipe: 'ironsword' }); hammerAll(s); if (i < 2) assert.equal(s.choice, null); }
  assert.equal(s.choice.kind, 'offer');
  assert.deepEqual(slotsNow(s).map((x) => x.label), ['일하겠다', '아직은 아니다']);
  dispatch(s, { type: 'choose', id: 'later' });
  assert.equal(s.work, null);
  for (let i = 0; i < 3; i++) { assert.equal(s.choice, null); dispatch(s, { type: 'craft', recipe: 'ironsword' }); hammerAll(s); }
  const ev = dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.work, 'smith');
  assert.ok(ev.some((e) => e.type === 'ding' && /대장장이/.test(e.ding.title)));
  assert.ok(s.journal.at(-1).note.includes('대장장이'));
  // 같은 망치질인데 더 빨리 오른다
  const gain = (work) => {
    const t = smith('xp');
    t.work = work;
    t.skills.smithing = { grade: 1, xp: 0, uses: 0 };
    dispatch(t, { type: 'craft', recipe: 'ironsword' });
    dispatch(t, { type: 'hammer' });
    return t.skills.smithing.xp;
  };
  assert.ok(Math.abs(gain('smith') / gain(null) - 1.5) < 1e-9);
  // 식구가 되면 대장간에서 값이 깎이고, 원래 값도 함께 보인다 (E25)
  const p = buyPrice(s, 'copperore');
  assert.ok(p.now < p.base);
  assert.ok(p.why);
});

test('상점: 사면 은화가 줄고, 판 값은 등급에 따라 다르다 (E24, E28)', () => {
  const s = createGame({ name: '가', origin: 'fallen', spent: {}, seed: 'shop' });
  assert.throws(() => dispatch(s, { type: 'buy', id: 'redpotion' }), /팔지 않는/);
  dispatch(s, { type: 'move', to: 'artguild' });
  const v = shopView(s);
  assert.deepEqual(v.goods.map((g) => g.id), SHOPS.artguild.sells);
  dispatch(s, { type: 'buy', id: 'chisel' });
  assert.equal(s.silver, 70);
  assert.equal(countOf(s, 'chisel'), 1);
  s.silver = 3;
  assert.throws(() => dispatch(s, { type: 'buy', id: 'chisel' }), /은화가 모자랍니다/);
  s.bag = [];
  addItem(s, 'ironsword', 1, { grade: 0 });
  addItem(s, 'ironsword', 1, { grade: 4 });
  addItem(s, 'ironore', 10);
  assert.equal(sellPrice(s.bag[0]), Math.floor(70 * 0.4));
  assert.equal(sellPrice(s.bag[1]), Math.floor(210 * 0.4));
  dispatch(s, { type: 'sell', index: 1 });
  assert.equal(s.silver, 3 + 84);
  dispatch(s, { type: 'sell', index: s.bag.findIndex((x) => x.id === 'ironore'), n: 10 });
  assert.equal(s.silver, 87 + 10);
  assert.equal(countOf(s, 'ironore'), 0);
  assert.throws(() => dispatch(s, { type: 'sell', index: 0, n: 5 }), /그만큼/);
  for (const shop of Object.values(SHOPS)) for (const id of shop.sells) assert.ok(ITEMS[id].price > 0, id);
  // 사서 바로 팔면 늘 손해다(돈이 불어나는 길이 없다)
  for (const shop of Object.values(SHOPS)) for (const id of shop.sells) assert.ok(sellPrice({ id, grade: ITEMS[id].grade || 0, n: 1 }) < ITEMS[id].price || ITEMS[id].price === 1, id);
});

test('보관함: 맡기고 찾는다. 무게 200까지, 은화도 맡긴다 (H1-5)', () => {
  const s = createGame({ name: '가', origin: 'fallen', spent: {}, seed: 'box' });
  s.bag = [];
  addItem(s, 'ironore', 50);
  addItem(s, 'ironsword', 1, { grade: 2, maker: '가' });
  assert.throws(() => dispatch(s, { type: 'deposit', index: 0, n: 5 }), /보관함이 없/);
  dispatch(s, { type: 'move', to: 'tavern' });
  dispatch(s, { type: 'deposit', index: 0, n: 30 });
  dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'ironsword') });
  dispatch(s, { type: 'deposit', silver: 60 });
  let v = storeView(s);
  assert.equal(v.weight, 34);
  assert.equal(v.cap, STORE_CAP);
  assert.equal(v.silver, 60);
  assert.equal(s.silver, 40);
  assert.equal(countOf(s, 'ironore'), 20);
  addItem(s, 'ironore', 300);
  assert.throws(() => dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'ironore'), n: 200 }), /찼습니다/);
  dispatch(s, { type: 'withdraw', index: storeView(s).items.findIndex((x) => x.item.id === 'ironsword') });
  const back = s.bag.find((x) => x.id === 'ironsword');
  assert.equal(back.grade, 2);
  assert.equal(back.maker, '가');
  assert.equal(back.dur, 80);
  dispatch(s, { type: 'withdraw', silver: 60 });
  assert.equal(s.silver, 100);
  assert.throws(() => dispatch(s, { type: 'withdraw', silver: 1 }), /맡기지 않았/);
});

test('맡긴 것이 있는 날만 은화 2. 쓰러져도 맡긴 것은 남는다 (H1-6)', () => {
  const s = createGame({ name: '가', origin: 'fallen', spent: {}, seed: 'fee' });
  dispatch(s, { type: 'move', to: 'tavern' });
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.silver, 100, '맡긴 것이 없으면 삯이 없다');
  s.bag = [];
  addItem(s, 'ironore', 20);
  dispatch(s, { type: 'deposit', index: 0, n: 20 });
  dispatch(s, { type: 'deposit', silver: 50 });
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(storeView(s).silver, 48, '맡긴 은화에서 먼저 뗀다');
  s.place = 'forest';
  addItem(s, 'herb', 10);
  s.silver = 50;
  fall(s, [], '');
  assert.equal(s.silver, 45);
  assert.equal(countOf(s, 'herb'), 5);
  dispatch(s, { type: 'move', to: 'tavern' });
  const v = storeView(s);
  assert.equal(v.items[0].n, 20);
  assert.equal(v.silver, 48);
  // 삯이 모자라면 달아 두고, 찾을 때 먼저 치른다
  dispatch(s, { type: 'withdraw', silver: 48 });
  s.silver = 0;
  for (let i = 0; i < 3; i++) passPhase(s);
  assert.equal(s.storeDebt, 2);
  assert.throws(() => dispatch(s, { type: 'withdraw', index: 0, n: 1 }), /밀린 보관 삯/);
  s.silver = 5;
  dispatch(s, { type: 'withdraw', index: 0, n: 20 });
  assert.equal(s.silver, 3);
  assert.equal(s.storeDebt, 0);
  assert.equal(countOf(s, 'ironore'), 20);
});

test('2판 저장을 읽으면 3판으로 올라온다', () => {
  const s = createGame({ name: '가', origin: 'farmer', spent: {}, seed: 'v2' });
  const old = JSON.parse(JSON.stringify(s));
  for (const k of ['craft', 'made', 'evolve', 'evolveSeen', 'work', 'workAsk', 'artguild', 'storeDebt']) delete old[k];
  old.v = 2;
  const up = parseSave(JSON.stringify({ v: 2, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual(up.evolve, {});
  dispatch(up, { type: 'move', to: 'forge' });
  addItem(up, 'copperore', 4); addItem(up, 'oakbranch', 1);
  dispatch(up, { type: 'craft', recipe: 'coppersword' });
  hammerAll(up);
  assert.equal(countOf(up, 'coppersword'), 1);
});
