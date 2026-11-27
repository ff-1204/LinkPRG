// M17 이긴 자에게만: 잿골(레벨 41~50). 곳, 열기, 달궈진 쇠, 겨루기 마당, 식지 않는 가마, 8장 벼린 종, 서브와 히든.
// 기준: systems.md "15차: 잿골 화면"(AG-), roadmap.md M17-1 ~ M17-7. 여정은 journey-ash.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, mapView, bodyView, enemyView, ASH_FIRST, SAVE_VERSION, roomFee } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { parseSave } from '../src/core/save.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS } from '../src/data/wild.js';
import { SHOPS } from '../src/data/shops.js';
import { ITEMS } from '../src/data/items.js';
import { PEOPLE, CALLS, BELLOWERS } from '../src/data/people.js';
import { JOBS as BOARD } from '../src/data/quests.js';
import { RECIPES, ORDER_OF } from '../src/data/recipes.js';
import { recipeList } from '../src/core/craft.js';
import { shopView } from '../src/core/trade.js';
import { boardView } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { startBattle } from '../src/core/battle.js';
import { repairCost, enhanceView } from '../src/core/gear.js';
import { HEAT, heatKind, heatView, wear, heatWin, isHot } from '../src/core/heat.js';
import { ARENA, ARENA_LINES, foeToday, arenaPrize, arenaView } from '../src/core/arena.js';
import { ARENA_FOES, ARENA_FOE, HABITS, arenaIntent, habitSay, foeById } from '../src/data/arena.js';
import { BANDS, normalAt } from '../src/data/bands.js';
import { DUEL } from '../src/data/wild.js';
import { foeDef } from '../src/core/battle.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { heal, fight, travel, walk } from './_white.js';
import { salted, sold, give, count } from './_salt.js';
import { ashed, gear, mendBody, duel } from './_ash.js';
import { passPhase, talkTo } from './_time.js';
import { roomView, dungeonMap } from '../src/core/game.js';
import { DUNGEONS } from '../src/data/dungeon.js';
import { MONSTERS } from '../src/data/monsters.js';
import { mainView, offersOf, subView, hiddenView, questBook, hangable } from '../src/core/quests.js';
import { MAIN, SUB_ORDER, DARAE_FIRST, MARSH_ROAD_SAY, BELLOWS_KNACK, EMBER, EMBER_LINES, BOSS_LOSSES } from '../src/data/quests.js';
import { hiddenSlots } from '../src/core/hidden.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const labels = (s) => slotsNow(s).map((x) => x.label.replace(/ \(.*/, ''));

// ── M17-1 곳 (AG-A, AG-F1) ──
test('M17-1 7장을 끝내기 전에는 잿골이 지도·소문·저울목의 칸 어디에도 없다 (AG-F1)', () => {
  const s = salted('noash');
  const rows = mapView(s);
  for (const id of ['kilngate', 'ashslope', 'moltenbrook']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/가마골|재 비탈|쇳물 내|잿골/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/가마골|잿골/));
  s.place = 'saltgate';
  assert.ok(!slotsNow(s).some((x) => x.label === '잿골로 오른다'));
  for (const to of ['kilngate', 'ashslope', 'moltenbrook']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
  // 장비 칸도 없다
  assert.equal(bodyView(s).heat, null);
});

test('M17-1 7장을 끝내면 저울목 어귀에서 잿골로 올라 가마골에 닿는다 (AG-A1, AG-D2)', () => {
  const s = sold('up', { at: 'saltgate' });
  assert.equal(mapView(s).find((r) => r.id === 'kilngate').name, '가마골');
  assert.deepEqual(slotsNow(s).find((x) => x.label === '잿골로 오른다').action, { type: 'travel', to: 'kilngate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'kilngate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 25, '반나절 길');
  assert.ok(texts(s).includes(ASH_FIRST[0]) && texts(s).includes(ASH_FIRST[1]));
  assert.ok(ASH_FIRST[0].startsWith('소금이 끝나자 재가 시작됐다.'));
  travel(s, 'ashslope'); travel(s, 'kilngate');
  assert.equal(s.log.filter((l) => l.text === ASH_FIRST[0]).length, 1, '처음 한 번만');
});

test('M17-1 가마골의 방 여섯과 사냥터 둘. 재 비탈에서 잿빛 도마뱀을 만난다 (AG-A2~A9)', () => {
  assert.deepEqual(TOWNS['가마골'].order, ['kilngate', 'arena', 'bigforge', 'bellowsrow', 'ashinn', 'scaleshop']);
  for (const id of [...TOWNS['가마골'].order, 'ashslope', 'moltenbrook']) {
    const p = PLACES[id];
    assert.equal(p.band, 5, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  assert.deepEqual(WILDS.ashslope.monsters.map((m) => m.id), ['ashlizard', 'sparkbat']);
  assert.deepEqual(WILDS.moltenbrook.monsters.map((m) => m.id), ['moltencrab', 'ashblade']);
  assert.equal(PLACES.ashslope.levels, '41~44');
  // 시안의 단축 칸 (말 걸기는 방 목록에서)
  const at = (id, more = {}) => { const s = ashed(`slots-${id}`, { at: id }); Object.assign(s, more); return labels(s); };
  assert.deepEqual(at('kilngate'), ['둘러보기']);
  assert.deepEqual(at('kilngate', { phase: 2 }), ['둘러보기', '잠자기']);
  assert.deepEqual(at('arena'), ['겨루기', '구경']);
  assert.deepEqual(at('bigforge'), ['만들기', '상점', '고치기', '강화']);
  assert.deepEqual(at('bellowsrow'), ['풀무질', '게시판']);
  assert.deepEqual(at('ashinn'), ['방 빌리기', '보관함', '요리', '소문 게시판']);
  assert.deepEqual(at('scaleshop'), ['바느질', '상점', '용병']);
  assert.deepEqual(at('ashslope'), ['탐색', '캐기', '숫돌']);
  assert.deepEqual(at('ashslope', { phase: 2 }), ['탐색', '캐기', '숫돌', '야영']);
  // 방 글은 시안의 것 (AG-B1, AG-C1, AG-D1)
  assert.equal(PLACES.ashslope.room, '재가 발목까지 쌓였다. 밟으면 속이 아직 붉다. 손에 쥔 쇠가 저 혼자 따뜻해진다.');
  assert.equal(PLACES.arena.room, '둥근 마당 둘레에 사람들이 빽빽하다. 높은 대에 검 한 자루가 걸려 있다. 누가 이길 때마다 그 검이 운다.');
  assert.equal(PLACES.bellowsrow.room, '좁은 골목에 풀무 소리만 난다. 문마다 풀무 자루가 하나씩 서 있다. 아무도 고개를 들지 않는다.');
  assert.ok(WILDS.ashslope.finds.some((f) => f.say === '재 속에서 도마뱀 비늘 3장을 주웠다.'));
  const s = ashed('lizard', { at: 'ashslope' });
  s.equip.weapon = gear('ashiron_sword');
  let met = false;
  for (let i = 0; i < 80 && !met; i++) {
    mendBody(s);
    dispatch(s, { type: 'act', id: 'explore' });
    if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
    if (s.battle) { met = ['ashlizard', 'sparkbat'].includes(s.battle.mon); duel(s); }
  }
  assert.ok(met);
});

const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { s.tired = 0; s.full = 80; dispatch(s, { type: 'hammer' }); }
  assert.equal(s.craft, null);
};

test('M17-1 큰 대장간과 비늘 가게, 잿물 주막: 잿쇠와 숫돌, 비늘, 방 80. 잿쇠 갑옷을 지으면 대장 6단계가 열린다 (AG-A4~A7, AG-G5, LV-F5)', () => {
  const s = ashed('forge', { at: 'bigforge' });
  assert.deepEqual(shopView(s).goods.filter((g) => ['잿쇠 덩이', '숫돌'].includes(g.name)).map((g) => g.name).sort(), ['숫돌', '잿쇠 덩이']);
  assert.equal(ITEMS.whetstone.price, 60);
  // 숫돌은 잿골에서만 판다 (AG-F2)
  for (const [id, sh] of Object.entries(SHOPS)) assert.equal(sh.sells.includes('whetstone'), id === 'bigforge', id);
  s.craftLv.smith = { lv: 16, xp: 0 }; s.craftTier.smith = 4; s.job = 'warrior';
  assert.ok(!recipeList(s, ORDER_OF.smith).some((r) => r.id.startsWith('ashiron_')), '5단계 설계도는 아직 나오지 않는다');
  make(s, 'saltsteel_shield');
  assert.equal(s.craftTier.smith, 5);
  const list = recipeList(s, ORDER_OF.smith).filter((r) => r.id.startsWith('ashiron_'));
  assert.deepEqual(list.filter((r) => r.promo).map((r) => r.name), ['잿쇠 갑옷'], '승급작 이름표');
  s.craftLv.smith = { lv: 20, xp: 0 };
  make(s, 'ashiron_armor');
  assert.equal(s.craftTier.smith, 6, '대장 6단계가 열린다');
  const v = ashed('scale', { at: 'scaleshop' });
  assert.ok(shopView(v).goods.some((g) => g.id === 'lizardscale'));
  assert.ok(PLACES.scaleshop.merc);
  const inn = ashed('inn', { at: 'ashinn' });
  assert.equal(roomFee(inn), 80);
  assert.ok(PLACES.ashinn.storage && PLACES.ashinn.kitchen);
  // 풀무 골목의 게시판: 의뢰 여섯. 가져오는 의뢰의 삯은 사서 채우는 값보다 적다
  const b = ashed('board', { at: 'bellowsrow' });
  const ids = Object.entries(BOARD).filter(([, d]) => d.at === 'bellows').map(([id]) => id);
  assert.equal(ids.length, 6);
  assert.ok(boardView(b).length > 0 && boardView(b).every((c) => ids.includes(c.id)));
  for (const id of ids) { const d = BOARD[id]; if (d.kind === 'bring') assert.ok(d.silver < ITEMS[d.item].price * d.n, id); }
  // 가마골 사람 열. 풀무꾼이 다섯이다
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '가마골');
  assert.equal(here.length, 10);
  assert.deepEqual(here.filter((x) => x.bellower).map((x) => x.id), BELLOWERS);
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
  assert.equal(PEOPLE.noeul.name, '심판 노을');
  assert.equal(PEOPLE.darae.name, '풀무꾼 다래');
});

test('M17-1 풀무 골목에서는 배우지 않은 사람도 풀무를 민다. 일로 치고 대장 숙련도가 오른다 (AG-A5, AG-C4)', () => {
  const s = ashed('pump', { at: 'bellowsrow', origin: 'farmer' });
  assert.ok(!(s.learned || []).includes('bellows'));
  assert.deepEqual(labels(s), ['풀무질', '게시판']);
  const before = s.skills.smithing?.xp || 0, grade = s.skills.smithing?.grade || 0;
  dispatch(s, { type: 'act', id: 'bellows' });
  assert.ok((s.skills.smithing.grade > grade) || s.skills.smithing.xp > before);
  assert.equal(s.flags.dayWork, 1, '일로 센다');
  assert.equal(s.ash.pumps, 1);
  // 시작 마을의 대장간에서는 여전히 배워야 한다
  s.place = 'forge';
  assert.ok(labels(s).includes('구경하기'));
});

// ── M17-2 열기 (AG-B) ──
const hitsUntil = (s, pred, cap = 400) => { let n = 0; while (!pred() && n < cap) { wear(s, [], s.equip.weapon, 'weapon'); n += 1; } return n; };

test('M17-2 들판에서 쇠 장비는 두 배로 닳는다: 소금강 검(160)은 예순다섯 번째에 20% 아래로 내려간다 (AG-B3)', () => {
  const s = ashed('iron', { at: 'ashslope' });
  s.equip.weapon = gear('saltsteel_sword');
  assert.equal(s.equip.weapon.dur, 160);
  assert.equal(heatKind(s.equip.weapon), 'iron');
  const events = [];
  for (let i = 0; i < 64; i++) wear(s, events, s.equip.weapon, 'weapon');
  assert.equal(s.equip.weapon.dur, 32, '예순네 번에 128이 닳아 꼭 20%');
  assert.ok(!texts(s).includes('열기에 쇠가 무르다'));
  assert.equal(heatView(s).soft, false);
  wear(s, events, s.equip.weapon, 'weapon');
  assert.equal(s.equip.weapon.dur, 30);
  assert.ok(s.log.some((l) => l.text === '소금강 검의 내구도가 19%다. 열기에 쇠가 무르다.'), '대화방 한 줄');
  const v = heatView(s);
  assert.deepEqual([v.pct, v.soft, v.tag.name, v.tag.text], [19, true, '무른 쇠', '소금강 검이 곧 부러진다']);
  // 실제 싸움에서도 한 번 칠 때마다 2
  const f = ashed('ironfight', { at: 'ashslope' });
  f.equip.weapon = gear('saltsteel_sword');
  startBattle(f, [], 'ashlizard');
  const hpBefore = f.battle.hp;
  dispatch(f, { type: 'battle', choice: 'attack' });
  if (!f.battle || f.battle.hp < hpBefore) assert.equal(f.equip.weapon.dur, 158);
});

test('M17-2 잿쇠 장비는 보통으로, 도마뱀 비늘 장비는 절반만 닳는다. 가마골 안과 잿골 밖에서는 지금 그대로다 (AG-B3)', () => {
  const s = ashed('ashgear', { at: 'ashslope' });
  s.equip.weapon = gear('ashiron_sword');
  assert.equal(heatKind(s.equip.weapon), 'ash');
  for (let i = 0; i < 10; i++) wear(s, [], s.equip.weapon, 'weapon');
  assert.equal(s.equip.weapon.dur, ITEMS.ashiron_sword.dur - 10);
  // 비늘 장갑: 두 번에 1
  const g = gear('ashiron_gloves');
  assert.equal(heatKind(g), 'scale');
  for (let i = 0; i < 10; i++) wear(s, [], g, 'hand');
  assert.equal(g.dur, ITEMS.ashiron_gloves.dur - 5);
  // 다른 가죽·나무·천은 그대로
  for (const id of ['saltsteel_boots', 'leatherarmor', 'woodsword', 'trainwear', 'shortbow']) assert.equal(heatKind(gear(id)), 'other', id);
  for (const id of ['saltsteel_sword', 'frostiron_helm', 'steelarmor', 'ironsword', 'saltsteel_ring']) assert.equal(heatKind(gear(id)), 'iron', id);
  // 마을 안에서는 쇠도 1씩
  const t = ashed('town', { at: 'kilngate' });
  t.equip.weapon = gear('saltsteel_sword');
  wear(t, [], t.equip.weapon, 'weapon');
  assert.equal(t.equip.weapon.dur, 159);
  // 소금벌의 들판에서도 1씩
  const o = salted('out', { at: 'saltfloor' });
  o.equip.weapon = gear('saltsteel_sword');
  wear(o, [], o.equip.weapon, 'weapon');
  assert.equal(o.equip.weapon.dur, 159);
});

test('M17-2 장비 칸은 잿골에서만 보인다: 찬 쇠 장비 가운데 가장 많이 닳은 것의 내구도 (AG-B1, AG-F2)', () => {
  const s = ashed('cell', { at: 'ashslope' });
  s.equip.weapon = gear('saltsteel_sword', { dur: 114 });
  s.equip.head = gear('saltsteel_helm', { dur: 150 });
  const v = bodyView(s).heat;
  assert.equal(v.pct, 71, '시안 그림의 71%');
  assert.equal(v.name, '소금강 검');
  assert.equal(v.tag, null);
  assert.equal(v.field, true);
  s.place = 'kilngate';
  assert.equal(bodyView(s).heat.field, false);
  assert.equal(bodyView(s).heat.pct, 71, '가마골 안에서도 칸은 보인다');
  // 쇠 장비를 하나도 차지 않았으면 숫자가 없다
  s.equip.weapon = null; s.equip.head = null;
  assert.equal(bodyView(s).heat.pct, null);
  // 잿골 밖에서는 칸도 이름표도 없다
  for (const place of ['saltgate', 'saltfloor', 'plaza', 'icegate']) { s.place = place; assert.equal(bodyView(s).heat, null, place); }
  // 체온·물 칸과 겹치지 않는다
  s.place = 'ashslope';
  assert.equal(bodyView(s).cold, null);
  assert.equal(bodyView(s).thirst, null);
});

test('M17-2 숫돌: 쇠 장비 하나의 내구도 +20, 한 번 쓰면 없어진다. 잿골 밖에서는 단축 칸에 없지만 가방에서 쓸 수는 있다 (AG-B3, AG-F2)', () => {
  const s = ashed('whet', { at: 'ashslope' });
  s.equip.weapon = gear('saltsteel_sword', { dur: 30 });
  s.equip.head = gear('saltsteel_helm', { dur: 60 });
  let slot = slotsNow(s).find((x) => x.label === '숫돌');
  assert.ok(slot.disabled && slot.why === '숫돌이 없다');
  give(s, 'whetstone', 3);
  slot = slotsNow(s).find((x) => x.label === '숫돌');
  assert.deepEqual([slot.disabled, slot.sub], [undefined, '가방에 3개']);
  const tick = s.tick;
  dispatch(s, slot.action);
  assert.equal(s.equip.weapon.dur, 50, '가장 많이 닳은 것부터');
  assert.equal(count(s, 'whetstone'), 2);
  assert.equal(s.tick, tick, '움직임이 아니다');
  assert.equal(s.flags.dayWork || 0, 0, '일도 아니다');
  // 가득 찬 것에는 쓰지 못한다. 넘치지 않는다
  s.equip.weapon.dur = 155; s.equip.head = null;
  dispatch(s, { type: 'act', id: 'whet' });
  assert.equal(s.equip.weapon.dur, 160);
  assert.ok(slotsNow(s).find((x) => x.label === '숫돌').disabled);
  assert.throws(() => dispatch(s, { type: 'act', id: 'whet' }), /갈 쇠 장비가 없습니다/);
  // 부서진 것은 대장간에서 고쳐야 한다
  s.equip.weapon.dur = 0;
  assert.throws(() => dispatch(s, { type: 'act', id: 'whet' }), /갈 쇠 장비가 없습니다/);
  // 가죽·나무에는 듣지 않는다
  s.equip.weapon = gear('woodsword', { dur: 10 });
  assert.throws(() => dispatch(s, { type: 'act', id: 'whet' }), /갈 쇠 장비가 없습니다/);
  // 잿골 밖: 칸은 없고, 가방에서는 쓴다
  const o = salted('whetout', { at: 'saltfloor' });
  o.equip.weapon = gear('saltsteel_sword', { dur: 100 });
  give(o, 'whetstone', 1);
  assert.ok(!labels(o).includes('숫돌'));
  assert.throws(() => dispatch(o, { type: 'act', id: 'whet' }), /여기서는 할 수 없는 일/);
  dispatch(o, { type: 'use', index: o.bag.findIndex((x) => x.id === 'whetstone') });
  assert.equal(o.equip.weapon.dur, 120);
  assert.equal(count(o, 'whetstone'), 0);
});

test('M17-2 15판 저장은 지금 판으로 올라온다: 달궈진 쇠는 식은 채로, 겨루기는 서지 않은 채로 (저장 판)', () => {
  assert.ok(SAVE_VERSION >= 16);
  const s = sold('v15');
  const old = JSON.parse(JSON.stringify(s));
  delete old.ash; old.v = 15;
  const up = parseSave(JSON.stringify({ v: 15, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual(up.ash, { hot: 0, hotNo: 0, half: {}, pumps: 0, duel: { day: 0, wins: 0, lost: false, pumps: 0, told: 0, seenDay: 0, seen: [] }, ember: 0 });
  // 올라온 저장으로 잿골에 오른다
  up.place = 'saltgate';
  travel(up, 'kilngate');
  assert.equal(up.place, 'kilngate');
  // 지금 판의 저장도 그대로 읽힌다(겨루는 중에도)
  const d = ashed('v16', { at: 'arena' });
  dispatch(d, { type: 'act', id: 'duel' });
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: d })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(d)));
});

// ── M17-3 달궈진 쇠 (AG-B2, AG-B3, AG-F3) ──
const winIn = (s, mon = 'ashlizard') => { startBattle(s, [], mon); s.battle.hp = 1; dispatch(s, { type: 'battle', choice: 'attack' }); assert.equal(s.battle, null); };

test('M17-3 들판의 싸움을 이기면 든 무기가 달아 서른 번 움직이는 동안 간다. 처음 달기 전에는 도움말에도 없다 (AG-B3, AG-F3)', () => {
  const s = ashed('hot', { at: 'ashslope' });
  s.equip.weapon = gear('ashiron_sword');
  assert.equal(bodyView(s).heat.hot, null);
  const seen = (st) => ({ ash: true, hot: !!st.flags.sawHot });
  assert.ok(!JSON.stringify(HELP.map((t) => helpBody(t, seen(s)))).includes('달궈진'), '달기 전에는 도움말에 없다');
  winIn(s);
  assert.ok(s.log.some((l) => l.text === '잿쇠 검이 벌겋게 달았다. 식기 전에 모루에 올리면 잘 먹는다.'));
  assert.ok(isHot(s, s.equip.weapon));
  const hot = bodyView(s).heat.hot;
  assert.equal(hot.name, '달궈진 쇠');
  assert.equal(hot.text, `강화 +10%p (${hot.left}번 남음)`);
  assert.equal(hot.left, 30);
  assert.ok(JSON.stringify(HELP.map((t) => helpBody(t, seen(s)))).includes('달궈진 쇠'), '달아 본 뒤에는 도움말에 생긴다');
  // 서른 번 움직이면 식는다
  for (let i = 0; i < 29; i++) dispatch(s, { type: 'act', id: 'dig' });
  assert.equal(bodyView(s).heat.hot.left, 1);
  dispatch(s, { type: 'act', id: 'dig' });
  assert.equal(bodyView(s).heat.hot, null);
  assert.ok(!isHot(s, s.equip.weapon));
  assert.ok(s.log.some((l) => l.text === '달았던 쇠가 식었다.'));
  assert.equal(s.equip.weapon.hot, undefined, '표시도 걷힌다');
  // 다시 이기면 다시 단다. 달아 있는 동안 또 이기면 서른 번으로 되돌아가고 한 줄은 다시 나오지 않는다
  winIn(s); winIn(s);
  assert.equal(s.log.filter((l) => l.text.includes('벌겋게 달았다')).length, 2);
  // 마을 안의 싸움이나 잿골 밖의 싸움으로는 달지 않는다
  const o = salted('nothot', { at: 'saltfloor' });
  o.equip.weapon = gear('saltsteel_sword');
  winIn(o, 'saltscorpion');
  assert.ok(!texts(o).includes('벌겋게 달았다'));
  assert.equal(o.ash.hot, 0);
});

test('M17-3 달궈진 무기를 큰 대장간에서 강화하면 성공 확률 +10%p, 고치는 값 절반. 다른 무기와 다른 대장간에는 듣지 않는다 (AG-B3, AG-G2)', () => {
  const s = ashed('hotforge', { at: 'ashslope' });
  s.equip.weapon = gear('ashiron_sword', { dur: 60, plus: 5 });
  const other = gear('saltsteel_sword', { dur: 60, plus: 5 });
  s.bag.push(other);
  winIn(s);
  s.equip.weapon.dur = 60;
  // 들판에서는 아직 아니다
  const cold = { ...s.equip.weapon }; delete cold.hot;
  s.place = 'bigforge';
  const base = enhanceView(s, cold), hot = enhanceView(s, s.equip.weapon);
  assert.ok(Math.abs(hot.chance - base.chance - 0.10) < 1e-9, `${base.chance} → ${hot.chance}`);
  assert.equal(hot.hot, true);
  assert.equal(repairCost(s, s.equip.weapon), Math.max(1, Math.ceil(repairCost(s, cold) / 2 - 1e-9)));
  assert.ok(repairCost(s, s.equip.weapon) < repairCost(s, cold));
  // 가방의 다른 무기에는 듣지 않는다
  assert.equal(enhanceView(s, other).hot, false);
  // 다른 대장간에서는 듣지 않는다
  s.place = 'saltforge';
  assert.equal(enhanceView(s, s.equip.weapon).hot, false);
  assert.equal(repairCost(s, s.equip.weapon), repairCost(s, cold));
  // 큰 대장간에서 실제로 강화한다: 달아 있는 동안은 그대로 달아 있다
  s.place = 'bigforge';
  give(s, 'ironore', 40); s.silver = 5000;
  dispatch(s, { type: 'enhance', slot: 'weapon' });
  assert.ok(isHot(s, s.equip.weapon));
  // 잿골을 벗어나면 바로 식는다
  s.place = 'kilngate';
  travel(s, 'saltgate');
  assert.equal(s.ash.hot, 0);
  assert.ok(!isHot(s, s.equip.weapon));
});

// ── M17-4 겨루기 마당 (AG-C) ──
test('M17-4 겨루기 마당: 심판이 그날 상대를 알린다. 하루에 한 번, 내 레벨 언저리의 상대와 일대일 (AG-C1, AG-C2)', () => {
  const s = ashed('arena', { at: 'kilngate' });
  walk(s, 'arena');
  const foe = foeToday(s);
  assert.ok(ARENA_FOES.some((f) => f.name === foe.name));
  assert.ok(foe.level >= s.level - 1 && foe.level <= s.level + 2);
  assert.ok(s.log.some((l) => l.who === '심판 노을' && l.text === `오늘 상대는 '${foe.name}'이오. 레벨 ${foe.level}쯤. 죽이지는 않소. 지면 풀무 골목에서 풀무질 서른 번이오.`));
  walk(s, 'kilngate'); walk(s, 'arena');
  assert.equal(s.log.filter((l) => l.who === '심판 노을' && l.text.startsWith('오늘 상대는')).length, 1, '하루에 한 번만 말한다');
  const slot = slotsNow(s).find((x) => x.label === '겨루기');
  assert.equal(slot.sub, '오늘 1번 남음');
  // 용병이 있어도 일대일이다
  s.party.push({ id: 'gaon', hp: 100, bond: 0, crossed: 0, plan: 'together', row: 'front' });
  dispatch(s, slot.action);
  assert.ok(s.log.some((l) => l.text === ARENA_LINES.enter));
  const e = enemyView(s);
  const n = normalAt(foe.level);
  assert.equal(e.name, `겨루기 상대 '${foe.name}'`);
  // 상대의 세기는 마당의 숫자다 (M23-4): 그 레벨 보통 몬스터의 생명력 2.5배·공격력 1.4배. 들판의 모험가(1.2배·1.1배)는 그대로다
  assert.deepEqual([ARENA_FOE.hp, ARENA_FOE.attack, DUEL.hp, DUEL.attack], [2.5, 1.4, 1.2, 1.1]);
  assert.deepEqual([e.level, e.maxHp, foeDef(s.battle).attack], [foe.level, Math.round(n.hp * ARENA_FOE.hp), Math.round(n.attack * ARENA_FOE.attack)]);
  for (let i = 0; i < 6 && s.battle; i++) { mendBody(s); dispatch(s, { type: 'battle', choice: 'defend' }); }
  assert.ok(!texts(s).match(/가온이 쳤다|앞을 막아섰다/), '동료는 끼어들지 않는다');
});

test('M17-4 이기면 명성과 은화(하루 벌이의 절반), 검이 울어 띠링. 같은 날 다시 서지 못한다 (AG-C3)', () => {
  const s = ashed('win', { at: 'arena' });
  s.stats.str += 60; s.stats.con += 40; s.hp = valueOf(s, 'maxHp');
  const silver = s.silver, fame = s.fame['가마골'] || 0, xp = s.xp, level = s.level, dings = s.dings.length, shadow = s.shadow;
  const foe = foeToday(s);
  dispatch(s, { type: 'act', id: 'duel' });
  duel(s);
  assert.equal(s.battle, null);
  assert.equal(arenaPrize(), BANDS[4].day / 2);
  assert.equal(s.silver, silver + 385);
  assert.equal(s.fame['가마골'], fame + ARENA.fame);
  assert.deepEqual([s.xp, s.level], [xp, level], '경험치는 없다');
  assert.ok(s.log.some((l) => l.text === ARENA_LINES.win));
  const d = s.dings.slice(dings).find((x) => x.title === `겨루기에서 '${foe.name}'${(foe.name.charCodeAt(foe.name.length - 1) - 0xac00) % 28 ? '을' : '를'} 이겼습니다`);
  assert.ok(d && d.body.includes('검이 울었습니다'));
  assert.equal(s.ash.duel.wins, 1);
  assert.equal(s.buffs.murder, undefined, '살인의 추억은 붙지 않는다');
  assert.equal(s.shadow, shadow);
  // 같은 날 다시 서지 못한다
  const slot = slotsNow(s).find((x) => x.label === '겨루기');
  assert.ok(slot.disabled && slot.why === '오늘은 이미 겨뤘다');
  assert.throws(() => dispatch(s, { type: 'act', id: 'duel' }), /하루에 한 번/);
  // 다음 날에는 선다
  s.place = 'kilngate';
  while (s.day === s.ash.duel.day) passPhase(s);
  s.place = 'arena';
  assert.equal(slotsNow(s).find((x) => x.label === '겨루기').sub, '오늘 1번 남음');
});

test('M17-4 져도 죽지 않고 잃는 것이 없다. 풀무질 서른 번을 채워야 다시 선다 (AG-C4, AG-G3)', () => {
  const s = ashed('lose', { at: 'arena' });
  s.stats.str = 5; s.stats.con = 5; s.hp = valueOf(s, 'maxHp');
  give(s, 'ashiron', 9); s.silver = 777;
  const falls = s.falls, bag = JSON.stringify(s.bag);
  dispatch(s, { type: 'act', id: 'duel' });
  const events = [];
  let n = 0;
  while (s.battle && n++ < 300) events.push(...dispatch(s, { type: 'battle', choice: 'attack' }));
  assert.equal(s.battle, null);
  assert.ok(!events.some((e) => e.type === 'fall'), '쓰러지지 않는다');
  assert.deepEqual([s.falls, s.shadow, s.silver, s.place, !!s.flags.mustRebirth], [falls, 0, 777, 'arena', false]);
  assert.equal(JSON.stringify(s.bag), bag, '물건도 그대로');
  assert.ok(s.hp >= Math.ceil(valueOf(s, 'maxHp') * 0.3));
  assert.ok(s.log.some((l) => l.text === ARENA_LINES.lose) && s.log.some((l) => l.text === ARENA_LINES.loseNote));
  assert.equal(s.ash.duel.lost, true);
  let slot = slotsNow(s).find((x) => x.label === '겨루기');
  assert.ok(slot.disabled && slot.why === '풀무질 30번이 남았다');
  // 다음 날이 되어도 풀무질을 채우기 전에는 못 선다
  s.place = 'kilngate';
  while (s.day === s.ash.duel.day) passPhase(s);
  s.place = 'arena';
  assert.throws(() => dispatch(s, { type: 'act', id: 'duel' }), /풀무질 30번을 더/);
  // 다른 대장간의 풀무질은 세지 않는다
  s.learned = [...(s.learned || []), 'bellows'];
  s.place = 'forge'; s.phase = 0; s.tick = 0;
  dispatch(s, { type: 'act', id: 'bellows' });
  assert.equal(s.ash.duel.pumps, 0);
  s.place = 'bellowsrow';
  for (let i = 0; i < 29; i++) { mendBody(s); dispatch(s, { type: 'act', id: 'bellows' }); }
  assert.equal(s.ash.duel.lost, true);
  s.place = 'arena';
  assert.equal(slotsNow(s).find((x) => x.label === '겨루기').why, '풀무질 1번이 남았다');
  s.place = 'bellowsrow';
  mendBody(s); dispatch(s, { type: 'act', id: 'bellows' });
  assert.equal(s.ash.duel.lost, false);
  assert.ok(s.log.some((l) => l.text === ARENA_LINES.back));
  s.place = 'arena';
  assert.ok(!slotsNow(s).find((x) => x.label === '겨루기').disabled || s.ash.duel.day === s.day);
});

test('M17-4 물러나면 진 것이다. 소문도 나지 않는다 (AG-C2)', () => {
  const s = ashed('flee', { at: 'arena' });
  s.stats.agi += 200;
  const fame = JSON.stringify(s.fame);
  dispatch(s, { type: 'act', id: 'duel' });
  let n = 0;
  while (s.battle && n++ < 50) dispatch(s, { type: 'battle', choice: 'flee' });
  assert.equal(s.battle, null);
  assert.equal(s.ash.duel.lost, true);
  assert.equal(JSON.stringify(s.fame), fame);
  assert.equal(s.flags.hitRun, undefined);
});

test('M17-4 구경: 한 번 볼 때마다 그날 상대의 버릇 하나가 적히고, 상대는 그 버릇대로 움직인다 (AG-C5)', () => {
  for (const f of ARENA_FOES) { assert.equal(f.habits.length, 3, f.id); for (const h of f.habits) assert.ok(HABITS[h], h); }
  assert.equal(habitSay(foeById('nail'), 'third'), '쇠못은 세 번째 수마다 크게 휘두른다.');
  assert.equal(habitSay(foeById('spark'), 'even'), '불티는 짝수 번째 수마다 크게 휘두른다.');
  const s = ashed('watch', { at: 'arena' });
  const foe = foeById(foeToday(s).id);
  const tick = s.tick;
  for (let i = 0; i < 3; i++) dispatch(s, { type: 'act', id: 'watch' });
  assert.ok(s.tick > tick, '구경에는 때가 흐른다');
  assert.equal(s.flags.dayWork || 0, 0, '구경은 일이 아니다');
  const seen = s.log.filter((l) => l.who === '구경').map((l) => l.text);
  assert.deepEqual(seen, foe.habits.map((h) => habitSay(foe, h)));
  dispatch(s, { type: 'act', id: 'watch' });
  assert.equal(s.log.filter((l) => l.who === '구경').length, 3, '더 볼 것이 없다');
  assert.ok(s.log.some((l) => l.text === ARENA_LINES.watchNone));
  // 버릇의 규칙
  assert.equal(arenaIntent({ foe: 'nail', last: null }, 1, false), 'slash');
  assert.equal(arenaIntent({ foe: 'nail', last: 'slash' }, 3, false), 'heavy');
  assert.equal(arenaIntent({ foe: 'nail', last: 'breath' }, 2, false), 'heavy');
  assert.equal(arenaIntent({ foe: 'nail', last: 'slash' }, 2, false), null);
  assert.equal(arenaIntent({ foe: 'asheye', last: 'heavy' }, 2, false), 'slash');
  assert.equal(arenaIntent({ foe: 'asheye', last: 'slash', rested: false }, 5, true), 'breath');
  assert.equal(arenaIntent({ foe: 'asheye', last: 'slash', rested: true }, 5, true), null);
  assert.equal(arenaIntent({ foe: 'anvilfoot', last: 'slash' }, 4, false), 'breath');
  // 실제 싸움: 쇠못은 첫 수를 가볍게 베고 세 번째 수마다 크게 휘두른다. 불티는 숨을 고르지 않는다
  const f = ashed('habit', { at: 'arena' });
  f.stats.con += 400; f.hp = valueOf(f, 'maxHp');
  startBattle(f, [], ARENA.base, { arena: { foe: 'nail', name: '쇠못', level: 44, last: null, rested: false } });
  const kinds = [];
  for (let t = 1; t <= 9 && f.battle; t++) { kinds.push(enemyView(f).next.kind); dispatch(f, { type: 'battle', choice: 'defend' }); }
  assert.equal(kinds[0], 'hit');
  for (const i of [2, 5, 8]) if (kinds[i]) assert.equal(kinds[i], 'charge', `${i + 1}번째 수`);
  const g = ashed('norest', { at: 'arena' });
  g.stats.con += 600; g.hp = valueOf(g, 'maxHp');
  startBattle(g, [], ARENA.base, { arena: { foe: 'spark', name: '불티', level: 44, last: null, rested: false } });
  for (let t = 1; t <= 30 && g.battle; t++) { assert.notEqual(enemyView(g).next.kind, 'wait'); dispatch(g, { type: 'battle', choice: 'defend' }); }
});

// ── M17-5 식지 않는 가마와 벼린 종의 망치 (AG-A10, LV-I3) ──
/** 가마로 들어가 방을 차례로 지난다. upTo: 거기까지만. 맨 안쪽은 들어서면 바로 싸움이다. */
const kiln = (s, upTo = 'k5-anvil') => {
  if (s.place !== 'moltenbrook') { s.place = 'moltenbrook'; }
  s.choice = null; s.battle = null;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'kiln' });
  for (const id of ['k1-flue', 'k2-grate', 'k2-rack', 'k2-grate', 'k3-bench', 'k4-bar', 'k4-mold', 'k5-anvil']) {
    heal(s);
    dispatch(s, { type: 'room', to: id });
    if (id === upTo && id === 'k5-anvil') return;
    fight(s);
    if (s.choice?.kind === 'trap') { s.stats.agi += 80; dispatch(s, { type: 'choose', id: 'dodge' }); s.stats.agi -= 80; }
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon.room, id);
    if (id === upTo) return;
  }
};
const strong = (s) => { s.level = 50; s.stats.str += 60; s.stats.con += 50; s.equip.weapon = gear('ashiron_sword'); s.hp = valueOf(s, 'maxHp'); return s; };

test('M17-5 식지 않는 가마는 다섯 칸이고, 지금 폐허와 같은 틀이다. 가마 안도 열기가 듣는다 (AG-A10, AG-B3)', () => {
  const d = DUNGEONS.kiln;
  assert.deepEqual([d.name, d.from, d.floors.length, d.hot], ['식지 않는 가마', 'moltenbrook', 5, true]);
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.floor))].sort(), [0, 1, 2, 3, 4]);
  for (const [id, r] of Object.entries(d.rooms)) { assert.ok(r.text && r.name, id); for (const x of r.exits) assert.ok(d.rooms[x].exits.includes(id), `${id} ↔ ${x}`); }
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.kind))].sort(), ['boss', 'door', 'fight', 'hall', 'rest', 'trap', 'treasure']);
  const s = strong(ashed('kiln', { at: 'moltenbrook' }));
  assert.ok(slotsNow(s).some((x) => x.label === '가마로 들어간다'));
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'kiln' });
  assert.equal(roomView(s).dungeon, '식지 않는 가마');
  assert.equal(bodyView(s).heat.field, true);
  // 가마 안에서 소금강 검은 두 배로 닳는다
  s.equip.weapon = gear('saltsteel_sword');
  wear(s, [], s.equip.weapon, 'weapon');
  assert.equal(s.equip.weapon.dur, 158);
  // 가마 안의 싸움을 이겨도 무기가 단다
  s.equip.weapon = gear('ashiron_sword');
  dispatch(s, { type: 'room', to: 'k1-flue' });
  assert.equal(s.battle.mon, 'sparkbat');
  fight(s);
  assert.ok(isHot(s, s.equip.weapon));
  assert.equal(dungeonMap(s)[0].name, '첫째 칸');
  // 연장 걸이에 쇠지레와 숫돌이 있다
  assert.deepEqual(d.rooms['k2-rack'].loot.items.map((x) => x[0]), ['kilnkey', 'whetstone', 'redpotion']);
  assert.equal(d.rooms['k4-bar'].door.key, 'kilnkey');
});

test('M17-5 망치는 보통 몬스터의 생명력 4배·공격력 1.25배다. 쓰러뜨리면 자루째 부러진다 (LV-I3)', () => {
  const m = MONSTERS.bellhammer;
  assert.deepEqual([m.name, m.level, m.boss, m.band], ['벼린 종의 망치', 50, true, 5]);
  const n = normalAt(50);
  assert.deepEqual(n, { hp: Math.round(BANDS[4].mon.hp * 1.2), attack: Math.round(BANDS[4].mon.attack * 1.2), defense: Math.round(BANDS[4].mon.defense * 1.2) });
  assert.deepEqual([m.hp, m.attack, m.defense], [n.hp * 4, Math.round(n.attack * 1.25), n.defense]);
  assert.ok(m.hp > MONSTERS.ashblade.hp * 3.5 && m.attack > MONSTERS.ashblade.attack * 1.2);
  const s = strong(ashed('hammer', { at: 'moltenbrook' }));
  s.main.chapter = 99; // 장의 끝은 M17-6에서 본다
  kiln(s);
  assert.equal(s.battle.mon, 'bellhammer', '말이 통하지 않는다. 들어서면 바로 싸운다');
  assert.equal(enemyView(s).boss, true);
  fight(s);
  assert.equal(s.battle, null);
  assert.equal(s.dmem.kiln.keeper, 'beat');
  assert.ok(s.log.some((l) => l.text === DUNGEONS.kiln.bossDown));
  assert.ok(s.bag.some((x) => x.id === 'ashiron') && s.bag.some((x) => x.id === 'lizardscale'), '잿쇠와 도마뱀 비늘을 꼭 떨군다');
});

// ── M17-6 8장 벼린 종 (AG-D, LV-D8) ──
const friend = (s, id, pts = 30) => { s.people[id] = { pts, talked: 0, likes: [], dislikes: [], stats: [], met: true }; };
const mine = (s, id, more = {}) => { const it = { ...gear(id), maker: s.name, ...more }; s.bag.push(it); return it; };

test('M17-6 8장의 퀘스트 창: 벼린 종과 푸는 길 셋. 풀무꾼 다래와 처음 만난다 (AG-D, AG-D1)', () => {
  const s = ashed('ch8', { at: 'kilngate' });
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [8, '벼린 종']);
  assert.equal(v.text, '가마골 사람들은 종을 녹여 검을 지었다. 검은 마당의 높은 대에 걸려 있고, 누가 이길 때만 운다. 진 사람은 풀무 골목으로 내려가 평생 남의 불을 분다. 끝까지 한 것은 셈에 들지 않는다. 이긴 것만 든다.');
  assert.deepEqual(v.paths.map((p) => [p.name, p.text]), [['꺾는 길', '식지 않는 가마의 망치를 쓰러뜨린다'], ['지어 보이는 길', '영웅 등급 이상의 잿쇠 무기를 지어 대에 건다'], ['불을 끄는 길', "풀무 골목 다섯 사람과 '단골' 사이가 되고 풀무질을 삼백 번 한다"]]);
  assert.deepEqual(v.paths.map((p) => p.have), [0, 0, 0]);
  assert.ok(!v.text.includes('아직 쓰이지 않았다'), '잿골의 이야기는 이제 쓰였다');
  walk(s, 'bellowsrow');
  const at = s.log.findIndex((l) => l.who === '풀무꾼 다래' && l.text === DARAE_FIRST[0][1]);
  const said = s.log.slice(at, at + 3).map((l) => [l.k, l.who || '', l.text]);
  assert.deepEqual(said, DARAE_FIRST.map(([k, text]) => [k, k === 'npc' ? '풀무꾼 다래' : '', text]));
  assert.equal(DARAE_FIRST[1][1], '풀무질은 내가 이 골짜기에서 제일 잘해. 이십 년 했으니까. 그런데 그건 안 울려. 저 검은 이긴 것만 세거든.');
  walk(s, 'kilngate'); walk(s, 'bellowsrow');
  assert.equal(s.log.filter((l) => l.text === DARAE_FIRST[0][1] && l.who === '풀무꾼 다래' && l.k === 'npc').length >= 1, true);
  assert.equal(s.log.filter((l) => l.text === '풀무 자루를 잡아 보았다.').length, 1, '처음 한 번만');
  // 세 길의 부르는 이름이 서로 다르다
  assert.equal(new Set(MAIN[8].paths.map((p) => p.called)).size, 3);
});

test('M17-6 꺾는 길: 망치를 쓰러뜨리면 검에 금이 간다. 안개늪 길이 열린다 (AG-D3)', () => {
  const s = strong(ashed('beat', { at: 'moltenbrook' }));
  kiln(s); fight(s);
  assert.equal(s.main.chapter, 9);
  assert.equal(s.main.done.at(-1).path, 'beat');
  assert.equal(s.main.called, '망치를 꺾은 이');
  assert.ok(s.log.some((l) => l.text === '망치가 부러지자 가마의 불이 처음으로 낮아졌다. 마당의 검이 대에서 떨어져 땅에 꽂혔다. 한 번 울고, 금이 갔다. 금 사이로 종의 빛이 보였다.'));
  assert.ok(s.opened.includes('marshroad'));
  assert.ok(s.dings.some((d) => d.title.includes("8장 '벼린 종'") && d.body.includes('안개늪으로 내려가는 길이 열렸습니다')));
  // 안개늪이 났다 (M18): 지도에 뜬마을이 생기고, 퀘스트 창은 9장으로 넘어간다
  assert.ok(!mainView(s).text.includes(MARSH_ROAD_SAY));
  assert.equal(mainView(s).name, '잊힌 종');
  assert.ok(JSON.stringify(mapView(s)).includes('뜬마을'));
});

test('M17-6 지어 보이는 길: 내 손으로 지은 영웅 등급 이상의 잿쇠 무기를 대에 건다 (AG-D4)', () => {
  const s = ashed('hang', { at: 'arena' });
  assert.ok(!slotsNow(s).some((x) => x.label === '대에 건다'), '걸 것이 없으면 칸도 없다');
  assert.throws(() => dispatch(s, { type: 'hang' }), /영웅 등급 이상의 잿쇠 무기/);
  // 희귀 등급, 남이 지은 것, 앞 구간의 것, 방어구는 안 된다
  mine(s, 'ashiron_sword', { grade: 2 });
  s.bag.push({ ...gear('ashiron_sword'), grade: 4, maker: '큰 대장간 주인' });
  mine(s, 'saltsteel_sword', { grade: 4 });
  mine(s, 'ashiron_armor', { grade: 4 });
  assert.equal(hangable(s), null);
  assert.equal(mainView(s).paths[1].have, 0);
  // 영웅과 전설이 둘 다 있으면 영웅을 건다(더 좋은 것은 남긴다)
  mine(s, 'ashiron_wand', { grade: 4 });
  mine(s, 'ashiron_knife', { grade: 3 });
  assert.equal(hangable(s).id, 'ashiron_knife');
  assert.equal(mainView(s).paths[1].have, 1);
  const slot = slotsNow(s).find((x) => x.label === '대에 건다');
  assert.ok(slot.confirm.includes('돌아오지 않습니다') && slot.ask.yes === '건다');
  dispatch(s, slot.action);
  assert.ok(!s.bag.some((x) => x.id === 'ashiron_knife'));
  assert.ok(s.bag.some((x) => x.id === 'ashiron_wand'));
  assert.deepEqual([s.main.chapter, s.main.called], [9, '대에 검을 건 이']);
  assert.ok(s.log.some((l) => l.text === MAIN[8].paths[1].done));
  assert.ok(MAIN[8].paths[1].done.includes('"저건 누굴 이긴 게 아닌데. 끝까지 두드린 거지."'));
});

test("M17-6 불을 끄는 길: 풀무꾼 다섯과 '단골' 사이가 되고 풀무질을 삼백 번 한다 (AG-D5)", () => {
  const s = ashed('quench', { at: 'kilngate' });
  walk(s, 'bellowsrow');
  assert.ok(!slotsNow(s).some((x) => x.label === '풀무를 멈춘다'));
  for (const id of BELLOWERS.slice(0, 4)) friend(s, id);
  s.ash.pumps = 150;
  const p = mainView(s).paths[2];
  assert.deepEqual([p.have, p.need], [4 + 2, 10], '풀무꾼 한 사람에 한 칸, 풀무질 예순 번에 한 칸');
  assert.throws(() => dispatch(s, { type: 'quench' }), /다섯 모두와/);
  friend(s, BELLOWERS[4]);
  assert.throws(() => dispatch(s, { type: 'quench' }), /300번/);
  s.ash.pumps = 299;
  assert.ok(!slotsNow(s).some((x) => x.label === '풀무를 멈춘다'));
  mendBody(s); dispatch(s, { type: 'act', id: 'bellows' });
  assert.equal(s.ash.pumps, 300);
  const slot = slotsNow(s).find((x) => x.label === '풀무를 멈춘다');
  assert.equal(slot.sub, '단골 5 / 5 · 풀무질 300 / 300');
  // 마당에서는 못 한다
  s.place = 'arena';
  assert.throws(() => dispatch(s, { type: 'quench' }), /풀무 골목/);
  s.place = 'bellowsrow';
  dispatch(s, slot.action);
  assert.deepEqual([s.main.chapter, s.main.called], [9, '불을 끈 이']);
  assert.ok(s.log.some((l) => l.text === MAIN[8].paths[2].done));
  // 풀무꾼과는 말을 걸어 가까워진다(다른 사람들과 같은 규칙)
  const t = ashed('bond', { at: 'bellowsrow' });
  dispatch(t, { type: 'greet', npc: 'b_sol' });
  assert.ok(t.people.b_sol.met);
});

// ── M17-7 서브 셋과 히든 (AG-D6, AG-D7, AG-C3, AG-F4, LV-E5) ──
test('M17-7 서브 "풀무꾼의 팔": 사흘 동안 하루 서른 번씩 풀무질을 대신 해 주고 요령을 배운다 (AG-D6)', () => {
  const s = ashed('arm', { at: 'bellowsrow' });
  dispatch(s, { type: 'greet', npc: 'darae' });
  assert.ok(offersOf(s, 'darae').includes('bellowsarm'));
  dispatch(s, { type: 'quest', op: 'accept', id: 'bellowsarm' });
  assert.equal(subView(s, 'bellowsarm').step.text, '다래의 어깨가 나갔다. 사흘 동안 풀무 골목에서 풀무질을 대신 해 준다(하루 서른 번).');
  const pump = (n) => { for (let i = 0; i < n; i++) { mendBody(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'act', id: 'bellows' }); } };
  pump(29);
  assert.equal(subView(s, 'bellowsarm').step.goal, '0 / 3일 (오늘 29 / 30번)');
  pump(1);
  assert.equal(s.quests.bellowsarm.count, 1);
  pump(40);
  assert.equal(s.quests.bellowsarm.count, 1, '하루에 한 몫만 센다');
  s.day += 1; pump(30);
  // 다른 대장간의 풀무질은 세지 않는다
  s.day += 1; s.learned = [...(s.learned || []), 'bellows']; s.place = 'forge'; pump(30);
  assert.equal(s.quests.bellowsarm.count, 2);
  s.place = 'bellowsrow'; pump(30);
  assert.equal(s.quests.bellowsarm.step, 'end');
  const grade = () => s.skills.smithing.grade * 1e6 + s.skills.smithing.xp;
  const plain = JSON.parse(JSON.stringify(s));
  dispatch(s, { type: 'quest', op: 'choose', id: 'bellowsarm', choice: 'learn' });
  assert.deepEqual([s.quests.bellowsarm.done, s.quests.bellowsarm.ending, s.flags.bellowsKnack], [true, '사흘을 대신 밀고 요령을 배웠다', true]);
  // 요령: 풀무질로 오르는 대장 숙련도가 1.5배
  assert.equal(BELLOWS_KNACK, 1.5);
  const a = grade(); pump(1); const withKnack = grade() - a;
  const g0 = plain.skills.smithing.grade * 1e6 + plain.skills.smithing.xp;
  plain.tick = 0; plain.phase = 0; plain.hp = valueOf(plain, 'maxHp'); plain.full = 80; plain.tired = 0;
  dispatch(plain, { type: 'act', id: 'bellows' });
  const without = plain.skills.smithing.grade * 1e6 + plain.skills.smithing.xp - g0;
  assert.ok(withKnack > without, `${without} → ${withKnack}`);
});

test('M17-7 서브 "식은 가마": 쇳물 내에서 식지 않은 재 다섯 줌을 날라 불씨를 살린다. 가는 동안 식으면 처음부터다 (AG-D7)', () => {
  const s = ashed('ember', { at: 'bellowsrow' });
  s.equip.weapon = gear('ashiron_sword');
  dispatch(s, { type: 'greet', npc: 'b_sol' });
  // 퀘스트를 받기 전에는 캐도 재가 나오지 않는다
  const before = ashed('noember', { at: 'moltenbrook' });
  for (let i = 0; i < 5; i++) dispatch(before, { type: 'act', id: 'dig' });
  assert.equal(count(before, 'hotash'), 0);
  dispatch(s, { type: 'quest', op: 'accept', id: 'coldkiln' });
  assert.ok(subView(s, 'coldkiln').step.text.includes('가는 동안 식으면 처음부터다'));
  assert.ok(!subView(s, 'coldkiln').step.choices.find((c) => c.id === 'pour').can);
  s.place = 'moltenbrook';
  for (let i = 0; i < 7; i++) { mendBody(s); dispatch(s, { type: 'act', id: 'dig' }); }
  assert.equal(count(s, 'hotash'), 5, '다섯 줌까지만');
  assert.ok(s.log.some((l) => l.text === `${EMBER_LINES.scoop} (5 / 5)`));
  // 꾸물거리면 식는다: 첫 줌부터 열다섯 번
  assert.equal(EMBER.moves, 15);
  for (let i = 0; i < 8; i++) { mendBody(s); dispatch(s, { type: 'act', id: 'dig' }); }
  assert.equal(count(s, 'hotash'), 0);
  assert.ok(s.log.some((l) => l.text === EMBER_LINES.cold));
  // 다시 퍼 담아 곧장 간다
  for (let i = 0; i < 5; i++) { mendBody(s); dispatch(s, { type: 'act', id: 'dig' }); }
  assert.equal(count(s, 'hotash'), 5);
  s.calm = 99; s.flags.noAmbush = true;
  travel(s, 'kilngate'); walk(s, 'bellowsrow');
  assert.equal(count(s, 'hotash'), 5, '곧장 오면 식지 않는다');
  const silver = s.silver;
  dispatch(s, { type: 'quest', op: 'choose', id: 'coldkiln', choice: 'pour' });
  assert.deepEqual([s.quests.coldkiln.done, s.quests.coldkiln.ending, s.silver, count(s, 'hotash')], [true, '불씨를 살렸다', silver + 300, 0]);
  assert.ok(texts(s).includes('작고 맑은 소리가 났다'));
});

test('M17-7 겨루기에서 열 번 이기기 전에는 셋째 서브가 어디에도 없다. 열 번 이기면 큰 대장간의 주인이 나선다 (AG-C3, AG-F4)', () => {
  const s = ashed('ten', { at: 'bigforge' });
  dispatch(s, { type: 'greet', npc: 'ashmaster' });
  s.ash.duel.wins = 9;
  assert.deepEqual(offersOf(s, 'ashmaster'), []);
  assert.throws(() => dispatch(s, { type: 'quest', op: 'accept', id: 'ownblade' }), /아직 받을 수 없습니다/);
  assert.ok(!JSON.stringify([questBook(s), slotsNow(s), mainView(s)]).includes('이긴 자의 무기'));
  // 열 번째 승리
  s.place = 'arena'; s.stats.str += 80; s.stats.con += 60; s.hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'act', id: 'duel' });
  duel(s);
  assert.equal(s.ash.duel.wins, 10);
  assert.ok(s.log.some((l) => l.who === '심판 노을' && l.text === ARENA_LINES.ten));
  s.place = 'bigforge';
  assert.deepEqual(offersOf(s, 'ashmaster'), ['ownblade']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'ownblade' });
  assert.ok(questBook(s).subs.some((q) => q.name === '이긴 자의 무기'));
  // 쇠와 품삯을 대면 내 직업의 잿쇠 무기를 희귀 등급으로 지어 준다. 거저 주지 않는다
  assert.ok(!subView(s, 'ownblade').step.choices.find((c) => c.id === 'make').can);
  give(s, 'ashiron', 6); give(s, 'oakbranch', 1); s.silver = 1000;
  dispatch(s, { type: 'quest', op: 'choose', id: 'ownblade', choice: 'make' });
  const got = s.bag.find((x) => x.id === 'ashiron_sword');
  assert.deepEqual([got.grade, got.maker, s.silver, count(s, 'ashiron')], [2, '큰 대장간 주인', 230, 0]);
  assert.equal(hangable(s), null, '남이 지어 준 것은 대에 걸 수 없다');
  // 직업 무기를 드는 직업에게는 그 직업의 무기를
  const m = ashed('tenmage', { at: 'bigforge' });
  m.job = 'mage'; m.ash.duel.wins = 10; give(m, 'ashiron', 6); give(m, 'oakbranch', 1); m.silver = 1000;
  dispatch(m, { type: 'greet', npc: 'ashmaster' });
  dispatch(m, { type: 'quest', op: 'accept', id: 'ownblade' });
  dispatch(m, { type: 'quest', op: 'choose', id: 'ownblade', choice: 'make' });
  assert.ok(m.bag.some((x) => x.id === 'ashiron_wand' && x.grade === 2));
  assert.deepEqual(SUB_ORDER.slice(SUB_ORDER.indexOf('bellowsarm'), SUB_ORDER.indexOf('bellowsarm') + 3), ['bellowsarm', 'coldkiln', 'ownblade']);
});

test('M17-7 히든 "지고도 다시 온 사람": 같은 우두머리에게 열 번 지고 다시 선다. 조건은 화면과 도움말 어디에도 없다 (LV-E5)', () => {
  assert.equal(BOSS_LOSSES, 10);
  const s = ashed('back', { at: 'kilngate' });
  s.equip.weapon = gear('ashiron_sword');
  s.flags.noAmbush = true;
  // 보통 몬스터에게 진 것은 세지 않는다
  s.dex.mon.ashlizard = { seen: 20, won: 0, lost: 30 };
  s.dex.mon.bellhammer = { seen: 9, won: 0, lost: 9 };
  travel(s, 'moltenbrook');
  assert.equal(s.hq.cameback, undefined, '아홉 번으로는 나타나지 않는다');
  // 열 번째로 진다: 가마 맨 안쪽에서 실제로 쓰러진다
  s.main.chapter = 99;
  kiln(s, 'k4-mold');
  s.stats.str = 1; s.stats.con = 1; s.hp = 1;
  dispatch(s, { type: 'room', to: 'k5-anvil' });
  let n = 0;
  while (s.battle && n++ < 50) dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(s.dex.mon.bellhammer.lost, 10);
  assert.equal(s.place, 'temple', '쓰러져 신전에서 눈을 뜬다');
  assert.equal(s.hq.cameback, undefined, '다시 그 앞에 서야 나타난다');
  delete s.flags.mustRebirth; s.stats.str = 60; s.stats.con = 60; s.hp = valueOf(s, 'maxHp');
  s.place = 'kilngate'; s.choice = null;
  travel(s, 'moltenbrook');
  assert.equal(s.hq.cameback.status, 'offered');
  assert.equal(s.choice.kind, 'hq');
  assert.ok(s.dings.at(-1).title.includes('지고도 다시 온 사람'));
  dispatch(s, { type: 'choose', id: 'accept' });
  travel(s, 'kilngate'); walk(s, 'bellowsrow');
  dispatch(s, { type: 'greet', npc: 'b_yeoreum' });
  if (s.hq.cameback.status !== 'done') talkTo(s, 'b_yeoreum');
  assert.equal(s.hq.cameback.status, 'done');
  assert.ok(texts(s).includes('누가 세고 있다는 것만 알고 가'));
  // 조건이 화면에 나오지 않는다: 도움말, 히든 목록, 퀘스트 창, 단축 칸, 몸 상태, 마당
  const fresh = ashed('nohint', { at: 'moltenbrook' });
  fresh.dex.mon.bellhammer = { seen: 5, won: 0, lost: 5 };
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, { white: true, salt: true, stall: true, reborn: true, ash: true, hot: true })), hiddenView(fresh), hiddenSlots(fresh), questBook(fresh), mainView(fresh), slotsNow(fresh), bodyView(fresh), arenaView(fresh), mapView(fresh)]);
  assert.ok(!/열 번 지|10번 지|지고도 다시|cameback|BOSS_LOSSES/.test(shown));
  // 가 보기 전에는 도움말에 열기·겨루기 이야기가 없다 (AG-F2)
  const beforeAsh = JSON.stringify(HELP.map((t) => helpBody(t, { white: true, salt: true, stall: true, reborn: true })));
  assert.ok(!/잿골|무른 쇠|숫돌|겨루기|달궈진 쇠|가마골/.test(beforeAsh));
  const afterAsh = JSON.stringify(HELP.map((t) => helpBody(t, { ash: true })));
  assert.ok(/무른 쇠/.test(afterAsh) && /숫돌/.test(afterAsh) && /겨루기/.test(afterAsh) && !/달궈진 쇠/.test(afterAsh));
});
