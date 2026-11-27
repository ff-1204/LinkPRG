// M14 강철을 두드린다 (LV-F2, LV-C2, LV-M2): 강철 단계, 길잡이 늑대, 만들기 경험치
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { RECIPES, ORDER_OF } from '../src/data/recipes.js';
import { ITEMS } from '../src/data/items.js';
import { MONSTERS } from '../src/data/monsters.js';
import { WILDS } from '../src/data/wild.js';
import { SHOPS } from '../src/data/shops.js';
import { DISHES } from '../src/data/cooking.js';
import { BANDS, tierOfLv, makeXp, promoXp, monsterXp } from '../src/data/bands.js';
import { recipeList, promoOf } from '../src/core/craft.js';
import { xpToNext } from '../src/core/level.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const make = (seed = 'steel', origin = 'smithboy') => createGame({ name: '강철', origin, rolled: rollDice('same'), seed });
const give = (s, id, n) => s.bag.push({ id, grade: 0, n });
/** 설계도 하나를 끝까지 만든다. 만든 물건을 돌려준다. */
function craft(s, recipe) {
  const before = s.bag.length;
  // 만들다 보면 일 제안 같은 정할 것이 뜬다. 마지막 선택지(사양)로 넘긴다
  for (let i = 0; i < 5 && s.choice; i++) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
  dispatch(s, { type: 'craft', recipe });
  for (let i = 0; i < 80 && s.craft; i++) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null, `${recipe}을 다 만들었다`);
  return s.bag.find((x, i) => i >= before - 3 && x.id === RECIPES[recipe].makes) || s.bag.find((x) => x.id === RECIPES[recipe].makes);
}

test('강철 단계: 자리마다 장비가 있고, 무기 24와 방어구 합 32가 시안과 맞는다 (LV-F2)', () => {
  const t2 = Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && d.tier === 2);
  const best = (slot, key) => Math.max(0, ...t2.filter(([, d]) => d.slot === slot).map(([, d]) => d[key] || 0));
  assert.equal(best('weapon', 'attack'), BANDS[1].weapon);
  assert.equal(['off', 'head', 'body', 'hand', 'feet'].reduce((a, slot) => a + best(slot, 'defense'), 0), BANDS[1].armor);
  for (const slot of ['weapon', 'off', 'head', 'body', 'hand', 'feet', 'ring']) assert.ok(t2.some(([, d]) => d.slot === slot), `${slot} 자리`);
  for (const job of ['archer', 'mage', 'rogue']) assert.ok(t2.some(([, d]) => d.slot === 'weapon' && d.job === job), `${job}의 무기`);
  // 모든 강철 단계 장비는 만들 수 있고, 설계도는 제작 레벨 5~8이다
  for (const [id] of t2) { assert.ok(RECIPES[id], `${id}의 설계도`); assert.equal(tierOfLv(RECIPES[id].lv), 2, `${id}의 레벨`); }
  // 재료는 그 구간에서 나온다: 큰 시장에서 팔고, 고갯길에서 줍거나 잡아서 얻는다
  const drops = new Set(Object.values(MONSTERS).flatMap((m) => (m.drops || []).map((d) => d.id)));
  const finds = new Set(Object.values(WILDS).flatMap((w) => (w.finds || []).map((f) => f.id)));
  for (const id of ['steel', 'bearhide', 'bearmeat']) assert.ok(drops.has(id) || finds.has(id), `${id}가 나오는 곳`);
  assert.ok(SHOPS.bigmarket.sells.includes('steel'));
  assert.ok(!SHOPS.forge.sells.includes('steel'), '시작 마을 대장간은 강철을 팔지 않는다');
  for (const b of ['smith', 'sew', 'jewel', 'cook']) assert.ok(promoOf(b, 2), `${b} 2단계의 승급작`);
  assert.equal(promoOf('smith', 2), '강철 갑옷');
  assert.equal(DISHES.bearstew.promo, true);
});

test('강철 설계도는 대장 2단계가 열려야 만든다. 철검을 지어 승급하면 강철 투구부터 열린다', () => {
  const s = make();
  s.place = 'forge';
  give(s, 'steel', 30); give(s, 'ironore', 20); give(s, 'oakbranch', 10); give(s, 'bearhide', 10);
  assert.equal(recipeList(s, ORDER_OF.smith).find((r) => r.id === 'steelhelm'), undefined, '열리지 않은 단계의 설계도는 보이지 않는다');
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'steelhelm' }), /레벨 5/);
  s.craftLv.smith = { lv: 4, xp: 40 };
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'steelhelm' }), /레벨 5/, '4에서 멈춰 있다');
  craft(s, 'ironsword');
  assert.equal(s.craftTier.smith, 2);
  assert.equal(s.craftLv.smith.lv, 5);
  const helm = craft(s, 'steelhelm');
  assert.equal(helm.id, 'steelhelm');
  assert.ok(ITEMS.steelhelm.defense > ITEMS.ironhelm.defense);
  // 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back.craftTier, s.craftTier);
});

test('길잡이 늑대: 고갯길에 나오고 레벨 20이다 (LV-C2)', () => {
  const m = MONSTERS.guidewolf;
  assert.equal(m.level, 20);
  assert.ok(WILDS.pass.monsters.some((x) => x.id === 'guidewolf'));
  assert.ok(m.hp > MONSTERS.passbear.hp && m.xp > MONSTERS.passbear.xp);
  for (const mv of m.moves) assert.ok(mv.tell && mv.say);
  for (const d of m.drops) assert.ok(ITEMS[d.id]);
});

test('만들기에도 경험치가 붙는다: 그 단계 몬스터 한 마리의 40%, 승급한 그 한 번은 열 마리치 (LV-M2)', () => {
  // 그 설계도 레벨에 견줄 몬스터 한 마리의 40%: 제작 레벨 1은 캐릭터 레벨 1, 3은 6, 5는 11
  assert.equal(makeXp(1, 0, xpToNext), Math.round(monsterXp(1, xpToNext) * 0.4));
  assert.equal(makeXp(3, 0, xpToNext), Math.round(monsterXp(6, xpToNext) * 0.4));
  assert.equal(makeXp(3, 2, xpToNext), Math.round(monsterXp(6, xpToNext) * 0.4 * 2), '등급마다 절반씩 더');
  assert.ok(makeXp(5, 0, xpToNext) > makeXp(3, 0, xpToNext) * 2, '윗단계 물건은 훨씬 많이 준다');
  assert.ok(makeXp(1, 0, xpToNext) < 30, '가장 쉬운 설계도는 들쥐 한 마리보다 적게 준다');
  assert.equal(promoXp(1, xpToNext), monsterXp(5, xpToNext) * 10);
  const s = make('xp');
  s.place = 'forge';
  give(s, 'oakbranch', 30);
  const total = () => { let t = s.xp; for (let l = 1; l < s.level; l++) t += xpToNext(l); return t; };
  const before = total();
  const made = craft(s, 'woodsword');
  assert.equal(total() - before, makeXp(1, made.grade || 0, xpToNext));
});

test('여정: 한 번도 싸우지 않고 만들기만으로 레벨이 오르고, 승급해서 강철 검까지 짓는다', () => {
  const s = make('crafter');
  s.place = 'forge';
  give(s, 'oakbranch', 200); give(s, 'ironore', 200); give(s, 'copperore', 100); give(s, 'steel', 60);
  assert.equal(s.level, 1);
  let n = 0;
  // 목검과 구리 검으로 손을 익히고, 레벨이 되면 철검(승급작)을 짓는다
  while (s.craftTier.smith < 2 && n++ < 60) craft(s, s.craftLv.smith.lv >= 3 ? 'ironsword' : s.craftLv.smith.lv >= 1 && n % 2 ? 'coppersword' : 'woodsword');
  assert.equal(s.craftTier.smith, 2, '대장 2단계');
  while (s.craftLv.smith.lv < 5 && n++ < 200) craft(s, 'ironsword'); // 승급은 했어도 레벨 5가 되어야 강철을 다룬다
  while (s.craftLv.smith.lv < 7 && n++ < 200) craft(s, 'steelhelm');
  const sword = craft(s, 'steelsword');
  assert.equal(sword.id, 'steelsword');
  assert.equal(s.counters.fights || 0, 0, '한 번도 싸우지 않았다');
  assert.ok(s.level >= 8, `만들기만으로 레벨 ${s.level}`);
  assert.ok(s.dings.some((d) => d.kind === 'levelup'));
});

test('가 본 구간까지만: 강철 단계의 물건은 고갯길 쪽을 가 본 뒤에야 경매장과 전리품에 나온다 (LV-G1)', async () => {
  const { lotsToday } = await import('../src/core/auction.js');
  const { reachedBand } = await import('../src/data/bands.js');
  const { PLACES } = await import('../src/data/places.js');
  const tierOf = (id) => ITEMS[id].tier || 1;
  const s = make('reach');
  assert.equal(reachedBand(s, PLACES), 1);
  for (let day = 1; day <= 120; day++) for (const lot of lotsToday(s, day)) assert.equal(tierOf(lot.item.id), 1, `${day}일째 ${lot.item.id}`);
  s.dex.places.pass = true;
  assert.equal(reachedBand(s, PLACES), 2);
  let seen = 0;
  for (let day = 1; day <= 120; day++) for (const lot of lotsToday(s, day)) if (tierOf(lot.item.id) === 2) seen++;
  assert.ok(seen > 0, '가 본 뒤에는 올라온다');
});
