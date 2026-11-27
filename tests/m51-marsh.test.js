// M18 이끼 덮인 종: 안개늪(레벨 51~60). 곳, 저주, 안개, 공방과 견습, 가라앉는 오솔길, 9장 잊힌 종, 서브와 히든.
// 기준: systems.md "16차: 안개늪 화면"(AN-), roadmap.md M18-1 ~ M18-7. 여정은 journey-marsh.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, slotsNow, mapView, bodyView, enemyView, roomView, roomFee, MARSH_FIRST, SAVE_VERSION, workshopView, createGame } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { parseSave } from '../src/core/save.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS } from '../src/data/wild.js';
import { SHOPS } from '../src/data/shops.js';
import { ITEMS } from '../src/data/items.js';
import { PEOPLE, CALLS } from '../src/data/people.js';
import { JOBS as BOARD, MAIN, SURYEON_FIRST, SUNKEN_ROAD_SAY, MOSS, HIDDENS } from '../src/data/quests.js';
import { RECIPES, ORDER_OF } from '../src/data/recipes.js';
import { DUNGEONS } from '../src/data/dungeon.js';
import { MONSTERS } from '../src/data/monsters.js';
import { BANDS, normalAt } from '../src/data/bands.js';
import { recipeList } from '../src/core/craft.js';
import { shopView } from '../src/core/trade.js';
import { boardView, mainView, offersOf, subView, hiddenView, questBook } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { startBattle, healOf } from '../src/core/battle.js';
import { graceBuff } from '../src/core/buffs.js';
import { MARSH, MARSH_LINES, curseHit, curseMult, curseView, fogSafe } from '../src/core/marsh.js';
import { SHOP, SHOP_LINES, handStage, everyOf, jobChoices, shopCarry, shopMaker } from '../src/core/workshop.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { travel, walk } from './_white.js';
import { give, count, salted } from './_salt.js';
import { ashed, forged, gear } from './_ash.js';
import { passPhase, talkTo } from './_time.js';
import { marshed, rested, tend, settle, owner, master, work } from './_marsh.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const labels = (s) => slotsNow(s).map((x) => x.label.replace(/ \(.*/, ''));
const lit = (s) => { s.marsh.lamp = 60; return s; };

// ── M18-1 곳 (AN-A, AN-F1) ──
test('M18-1 8장을 끝내기 전에는 안개늪이 지도·소문·가마골의 칸 어디에도 없다 (AN-F1)', () => {
  const s = ashed('nomarsh');
  const rows = mapView(s);
  for (const id of ['floatgate', 'mossfield', 'sunkenwood']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/뜬마을|이끼 밭|가라앉는 숲|안개늪/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/뜬마을|안개늪/));
  s.place = 'kilngate';
  assert.ok(!slotsNow(s).some((x) => x.label === '안개늪으로 내려간다'));
  for (const to of ['floatgate', 'mossfield', 'sunkenwood']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
  assert.equal(bodyView(s).curse, null, '저주 칸도 없다');
  assert.equal(workshopView(s), null);
});

test('M18-1 8장을 끝내면 가마골 어귀에서 안개늪으로 내려가 뜬마을 나루에 닿는다 (AN-A1, AN-D2)', () => {
  const s = forged('down', { at: 'kilngate' });
  assert.equal(mapView(s).find((r) => r.id === 'floatgate').name, '뜬마을');
  assert.deepEqual(slotsNow(s).find((x) => x.label === '안개늪으로 내려간다').action, { type: 'travel', to: 'floatgate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'floatgate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 25, '반나절 길');
  assert.equal(MARSH_FIRST[0], '재가 끝나자 안개가 시작됐다. 발밑이 물이다. 멀리 불빛 몇이 떠 있는데 가까워지지 않는다. 여기서는 아무 소리도 울리지 않는다. 종소리도, 함성도, 띠링도.');
  assert.ok(texts(s).includes(MARSH_FIRST[0]) && texts(s).includes(MARSH_FIRST[1]));
  travel(s, 'kilngate'); travel(s, 'floatgate');
  assert.equal(s.log.filter((l) => l.text === MARSH_FIRST[0]).length, 1, '처음 한 번만');
  assert.equal(bodyView(s).curse.n, 0, '안개늪에서는 저주 칸이 보인다');
});

test('M18-1 뜬마을의 방 여섯(M24-1에서 뗏목 대장간이 더해져 일곱)과 사냥터 둘. 이끼 밭에서 이끼 두꺼비를 만난다 (AN-A2~A9, AN-A11)', () => {
  assert.deepEqual(TOWNS['뜬마을'].order, ['floatgate', 'lampbridge', 'herbhut', 'raftforge', 'marshshrine', 'emptyshop', 'floatinn']);
  for (const id of [...TOWNS['뜬마을'].order, 'mossfield', 'sunkenwood']) {
    const p = PLACES[id];
    assert.equal(p.band, 6, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  assert.deepEqual(WILDS.mossfield.monsters.map((m) => m.id), ['mosstoad', 'mistleech']);
  assert.deepEqual(WILDS.sunkenwood.monsters.map((m) => m.id), ['soakedscarecrow', 'marshlight']);
  assert.equal(PLACES.mossfield.levels, '51~54');
  // 시안의 단축 칸 (말 걸기는 방 목록에서). 공방·견습·성수·다시 태어나기는 아직 없다
  const at = (id, more = {}) => { const s = marshed(`slots-${id}`, { at: id }); Object.assign(s, more); return labels(s); };
  assert.deepEqual(at('floatgate'), ['둘러보기']);
  assert.deepEqual(at('floatgate', { phase: 2 }), ['둘러보기', '잠자기']);
  assert.deepEqual(at('lampbridge'), ['상점', '게시판', '오솔길로 들어선다']);
  assert.deepEqual(at('herbhut'), ['바느질', '상점', '요리']);
  assert.deepEqual(at('marshshrine'), ['기도', '상점']);
  assert.deepEqual(at('emptyshop'), ['둘러보기']);
  assert.deepEqual(at('floatinn'), ['방 빌리기', '보관함', '소문 게시판', '용병']);
  assert.deepEqual(at('mossfield'), ['탐색', '캐기', '등불']);
  assert.deepEqual(at('sunkenwood'), ['탐색', '표식 묶기', '등불']);
  assert.deepEqual(at('sunkenwood', { phase: 2 }), ['탐색', '표식 묶기', '등불', '야영']);
  // 방 글은 시안의 것 (AN-B1, AN-D1)
  assert.equal(PLACES.sunkenwood.room, '나무들이 허리까지 물에 잠겨 있다. 안개가 한 걸음 앞을 가린다. 어디선가 불빛 하나가 따라온다.');
  assert.equal(PLACES.herbhut.room, '천장에 약초가 가득 매달려 있다. 구석에 반쯤 짠 바구니, 반쯤 깎은 노, 반쯤 쓴 장부가 쌓여 있다.');
  const s = lit(marshed('toad', { at: 'mossfield' }));
  let met = false;
  for (let i = 0; i < 80 && !met; i++) {
    tend(s); s.marsh.lamp = 60;
    dispatch(s, { type: 'act', id: 'explore' });
    if (s.battle) met = ['mosstoad', 'mistleech'].includes(s.battle.mon);
    if (s.choice?.mon) met = ['mosstoad', 'mistleech'].includes(s.choice.mon);
    settle(s);
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

test('M18-1 등불 다리·약초꾼 오두막·늪 사당의 가게, 물 위 주막(방 130), 게시판, 뜬마을 사람들. 안개실 옷을 지으면 바느질 7단계가 열린다 (AN-A3~A7, AN-G5, LV-F6)', () => {
  const s = marshed('shops', { at: 'lampbridge' });
  assert.deepEqual(shopView(s).goods.filter((g) => ['등불', '표식 끈', '이끼쇠 덩이'].includes(g.name)).map((g) => g.name).sort(), ['등불', '이끼쇠 덩이', '표식 끈']);
  assert.deepEqual([ITEMS.lamp.price, ITEMS.marker.price], [90, 40]);
  // 등불과 표식 끈은 등불 다리에서만 판다
  for (const [id, sh] of Object.entries(SHOPS)) { assert.equal(sh.sells.includes('lamp'), id === 'lampbridge', id); assert.equal(sh.sells.includes('marker'), id === 'lampbridge', id); }
  assert.ok(SHOPS.marshshrine.sells.includes('holywater') && !SHOPS.marshshrine.sells.includes('deepholy'), '이 구간의 성수는 지금 성수다 (AN-G6)');
  assert.ok(SHOPS.herbhut.sells.includes('mistthread'));
  const inn = marshed('inn', { at: 'floatinn' });
  assert.equal(roomFee(inn), 130);
  assert.ok(PLACES.floatinn.storage && PLACES.floatinn.merc && PLACES.herbhut.kitchen);
  // 게시판: 의뢰 여섯. 가져오는 의뢰의 삯은 사서 채우는 값보다 적다
  const ids = Object.entries(BOARD).filter(([, d]) => d.at === 'lamp').map(([id]) => id);
  assert.equal(ids.length, 6);
  assert.ok(boardView(s).length > 0 && boardView(s).every((c) => ids.includes(c.id)));
  for (const id of ids) { const d = BOARD[id]; assert.ok(d.minLevel >= 51, id); if (d.kind === 'bring') assert.ok(d.silver < ITEMS[d.item].price * d.n, id); }
  // 뜬마을 사람 일곱(견습 둘째 소라는 M19에서 왔다)
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '뜬마을');
  assert.equal(here.length, 9); // 보리, 소라(M19), 이슬(M21: 견습 셋째 자리), 뗏목 대장간의 느루(M24-1)까지
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
  assert.deepEqual([PEOPLE.suryeon.name, PEOPLE.yeoul.name, PEOPLE.bori.name], ['약초꾼 수련', '등불지기 여울', '보리']);
  assert.ok(PEOPLE.bori.story && PEOPLE.bori.join);
  // 승급작: 안개실 옷은 꿰맨다
  const t = marshed('sew', { at: 'herbhut' });
  t.craftLv.sew = { lv: 24, xp: 0 }; t.craftTier.sew = 6;
  assert.deepEqual(recipeList(t, ORDER_OF.sew).filter((r) => r.id.startsWith('mossiron_') && r.promo).map((r) => r.name), ['안개실 옷']);
  make(t, 'mossiron_armor');
  assert.equal(t.craftTier.sew, 7, '바느질 7단계가 열린다');
});

// ── M18-2 저주 (AN-B1, AN-B3, AN-F2, AN-F5) ──
test('M18-2 안개늪의 몬스터에게 맞으면 저주가 한 겹씩 앉는다. 다섯 겹까지. 다른 지역의 몬스터로는 앉지 않는다 (AN-B3)', () => {
  assert.deepEqual([MARSH.rate, MARSH.max, MARSH.per], [0.20, 5, 0.05]);
  const s = marshed('curse', { at: 'sunkenwood' });
  let hits = 0;
  while (s.marsh.curse < 1 && hits < 200) { curseHit(s, [], 'soakedscarecrow'); hits += 1; }
  assert.equal(s.marsh.curse, 1);
  assert.ok(s.log.some((l) => l.text === '물먹은 허수아비의 손이 스쳤다. 저주가 한 겹 더 앉았다.'), '시안의 한 줄');
  for (let i = 0; i < 400; i++) curseHit(s, [], 'mosstoad');
  assert.equal(s.marsh.curse, 5, '다섯 겹까지');
  assert.ok(s.log.some((l) => l.text === MARSH_LINES.deep));
  // 스무 번에 네 번꼴
  const r = marshed('rate'); let got = 0;
  for (let i = 0; i < 2000; i++) { r.marsh.curse = 0; curseHit(r, [], 'mistleech'); got += r.marsh.curse; }
  assert.ok(got > 300 && got < 500, `2000번에 ${got}번`);
  // 잿골의 도마뱀에게 맞아서는 앉지 않는다
  const o = marshed('other');
  for (let i = 0; i < 300; i++) curseHit(o, [], 'ashlizard');
  assert.equal(o.marsh.curse, 0);
  for (const id of ['mosstoad', 'mistleech', 'soakedscarecrow', 'marshlight', 'mossbellman']) assert.ok(MONSTERS[id].curseSay && MONSTERS[id].band === 6, id);
  // 실제 싸움에서 맞다 보면 앉는다
  const f = marshed('realhit', { at: 'mossfield' });
  f.stats.con += 400; f.hp = valueOf(f, 'maxHp');
  startBattle(f, [], 'mosstoad');
  let n = 0;
  while (f.battle && f.marsh.curse < 1 && n++ < 200) { f.battle.hp = 99999; dispatch(f, { type: 'battle', choice: 'attack' }); }
  assert.ok(f.marsh.curse >= 1);
});

test('M18-2 한 겹마다 받는 피해 +5%. 다섯 겹(깊은 저주)이면 음식과 물약이 절반만 채운다 (AN-B3)', () => {
  const a = marshed('dmg', { at: 'mossfield' });
  a.stats.con += 300; a.hp = valueOf(a, 'maxHp');
  startBattle(a, [], 'mosstoad');
  const b = JSON.parse(JSON.stringify(a));
  b.marsh.curse = 4;
  assert.equal(curseMult(b), 1.2);
  const ha = a.hp, hb = b.hp;
  dispatch(a, { type: 'battle', choice: 'attack' }); dispatch(b, { type: 'battle', choice: 'attack' });
  const la = ha - a.hp, lb = hb - b.hp;
  assert.ok(la > 0, '맞았다');
  assert.equal(lb, Math.round(la * 1.2), `${la} → ${lb}`);
  // 깊은 저주
  const s = marshed('deep');
  const max = valueOf(s, 'maxHp');
  const full = healOf(s, ITEMS.redpotion, max), food = healOf(s, ITEMS.riceball, max);
  s.marsh.curse = 4;
  assert.equal(healOf(s, ITEMS.redpotion, max), full, '네 겹까지는 그대로');
  s.marsh.curse = 5;
  assert.equal(healOf(s, ITEMS.redpotion, max), Math.round(full / 2));
  assert.equal(healOf(s, ITEMS.riceball, max), Math.round(food / 2));
  const v = bodyView(s).curse;
  assert.deepEqual([v.n, v.deep, v.tag.name, v.tag.text, v.deepTag.name, v.deepTag.text], [5, true, '저주 5겹', '받는 피해 +25%', '깊은 저주', '음식과 물약으로 차는 생명력이 절반']);
  s.marsh.curse = 3;
  assert.deepEqual([bodyView(s).curse.tag.name, bodyView(s).curse.tag.text, bodyView(s).curse.deepTag], ['저주 3겹', '받는 피해 +15%', null], '시안 그림의 이름표');
});

test('M18-2 성수 한 병에 모두 걷힌다. 늪 사당의 기도 열 번에 한 겹. 단축 칸 "성수"는 저주가 앉았을 때만 생긴다 (AN-B1, AN-B3)', () => {
  const s = marshed('holy', { at: 'sunkenwood' });
  assert.ok(!labels(s).includes('성수'));
  assert.throws(() => dispatch(s, { type: 'act', id: 'holy' }), /여기서는 할 수 없는 일/);
  s.marsh.curse = 3; s.shadow = 1;
  let slot = slotsNow(s).find((x) => x.label === '성수');
  assert.ok(slot.disabled && slot.why === '성수가 없다');
  give(s, 'holywater', 2);
  slot = slotsNow(s).find((x) => x.label === '성수');
  assert.equal(slot.sub, '가방에 2병');
  dispatch(s, slot.action);
  assert.deepEqual([s.marsh.curse, s.shadow, count(s, 'holywater')], [0, 0, 1]);
  assert.ok(s.log.at(-1).text.startsWith('성수를 마셨다.') && s.log.at(-1).text.includes('저주가 모두 걷혔다') && s.log.at(-1).text.includes('두 때 동안'));
  assert.equal(graceBuff(s).power, 0.05, '지금 성수 그대로다 (AN-G6)');
  assert.ok(!labels(s).includes('성수'), '걷히면 칸도 없다');
  assert.equal(ITEMS.holywater.price, 60);
  // 기도: 늪 사당에서만, 열 번에 한 겹
  const p = marshed('pray', { at: 'marshshrine' });
  p.marsh.curse = 2;
  for (let i = 0; i < 9; i++) { tend(p); p.tick = 0; dispatch(p, { type: 'act', id: 'pray' }); }
  assert.equal(p.marsh.curse, 2);
  tend(p); dispatch(p, { type: 'act', id: 'pray' });
  assert.equal(p.marsh.curse, 1);
  assert.ok(p.log.some((l) => l.text === `${MARSH_LINES.prayed} 남은 저주 1겹.`));
  for (let i = 0; i < 10; i++) { tend(p); p.tick = 0; dispatch(p, { type: 'act', id: 'pray' }); }
  assert.equal(p.marsh.curse, 0);
  assert.ok(p.log.some((l) => l.text === MARSH_LINES.prayedAll));
  // 다른 사당의 기도로는 걷히지 않는다
  const o = marshed('prayout', { at: 'saltshrine' });
  o.marsh.curse = 2;
  for (let i = 0; i < 20; i++) { tend(o); o.tick = 0; dispatch(o, { type: 'act', id: 'pray' }); }
  assert.equal(o.marsh.curse, 2);
});

test('M18-2 저주는 안개늪을 떠나도 남고 칸이 따라간다. 저주가 없고 안개늪 밖이면 칸이 없다. 세 겹 넘게 안고 이긴 싸움은 따로 세어지고 어디에도 나오지 않는다 (AN-F2, AN-F5)', () => {
  const s = marshed('carry', { at: 'floatgate' });
  s.marsh.curse = 2;
  travel(s, 'kilngate');
  assert.equal(s.marsh.curse, 2);
  assert.equal(bodyView(s).curse.tag.name, '저주 2겹');
  assert.ok(bodyView(s).heat, '잿골의 장비 칸과 나란히 있다');
  s.marsh.curse = 0;
  assert.equal(bodyView(s).curse, null);
  for (const place of ['saltgate', 'plaza', 'icegate']) { s.place = place; assert.equal(bodyView(s).curse, null, place); }
  // 따로 세는 싸움: 세 겹으로는 세지 않고, 네 겹부터 센다
  const w = marshed('wins', { at: 'mossfield' });
  const winOne = () => { startBattle(w, [], 'mosstoad'); settle(w); };
  w.marsh.curse = 3; winOne();
  assert.equal(w.counters.cursedWins || 0, 0);
  w.marsh.curse = 4; winOne(); w.marsh.curse = 5; winOne();
  assert.equal(w.counters.cursedWins, 2);
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, { marsh: true, shop: true })), hiddenView(w), hiddenSlots(w), questBook(w), slotsNow(w), bodyView(w), mapView(w)]);
  assert.ok(!/cursedWins|세 겹 넘게|안고 이긴/.test(shown));
  // 가 보기 전에는 도움말에 저주·안개·공방 이야기가 없다
  const before = JSON.stringify(HELP.map((t) => helpBody(t, { white: true, salt: true, stall: true, reborn: true, ash: true, hot: true })));
  assert.ok(!/저주|안개늪|등불|표식 끈|공방|견습/.test(before));
  const after = JSON.stringify(HELP.map((t) => helpBody(t, { marsh: true })));
  assert.ok(/깊은 저주/.test(after) && /표식 끈/.test(after) && !/견습/.test(after));
  assert.ok(/견습/.test(JSON.stringify(HELP.map((t) => helpBody(t, { shop: true })))));
});

test('M18-2 16판 저장은 지금 판으로 올라온다: 저주 없이, 등불은 꺼진 채로, 공방은 없이 (저장 판)', () => {
  assert.ok(SAVE_VERSION >= 17);
  const s = forged('v16');
  const old = JSON.parse(JSON.stringify(s));
  delete old.marsh; delete old.shop; old.v = 16;
  const up = parseSave(JSON.stringify({ v: 16, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual(up.marsh, { curse: 0, pray: 0, lamp: 0, knots: {}, moss: 0 });
  assert.equal(up.shop, null);
  up.place = 'kilngate';
  travel(up, 'floatgate');
  assert.equal(up.place, 'floatgate');
  // 지금 판의 저장도 그대로 읽힌다(견습이 일하는 중에도, 저주를 안은 채로도)
  const m = master('v17', { at: 'emptyshop' });
  m.craftTier.smith = 6; give(m, 'ashiron', 12);
  dispatch(m, { type: 'workshop', op: 'put', index: m.bag.findIndex((x) => x.id === 'ashiron') });
  dispatch(m, { type: 'workshop', op: 'job', job: { kind: 'make', recipe: 'ashiron_helm' } });
  work(m, 13); m.marsh.curse = 3; m.marsh.lamp = 20; m.marsh.knots.sunkenwood = 4; m.marsh.moss = 77;
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: m })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(m)));
  // 망가진 칸은 거른다
  const bad = JSON.parse(JSON.stringify(m)); bad.shop.hand.id = 'nobody';
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })), /견습/);
});

// ── M18-3 안개 (AN-B2, AN-B3) ──
test('M18-3 등불도 표식도 없이 탐색하면 길을 잃는다: 다치지 않고 잃는 것도 없지만 반나절이 가고 뜬마을 나루로 돌아온다 (AN-B2, AN-G2)', () => {
  assert.equal(MARSH.lost, 0.15);
  const s = marshed('lost', { at: 'mossfield' });
  s.silver = 1234; give(s, 'mossiron', 7);
  let before = 0, tries = 0, hp = 0;
  while (s.place === 'mossfield' && tries++ < 300) {
    tend(s); settle(s);
    before = s.day * 150 + s.phase * 50 + s.tick; hp = s.hp;
    dispatch(s, { type: 'act', id: 'explore' });
    if (s.place === 'mossfield') settle(s);
  }
  assert.equal(s.place, 'floatgate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - before >= 25, '반나절이 갔다');
  assert.deepEqual([s.hp >= hp, s.silver, count(s, 'mossiron'), s.falls, s.battle], [true, 1234, 7, 0, null]);
  const i = s.log.findIndex((l) => l.text === '안개가 짙어졌다. 왔던 길이 보이지 않는다. 길을 잃었다.');
  assert.ok(i >= 0);
  const tail = s.log.slice(i).map((l) => [l.who || '', l.text]);
  assert.ok(tail.some(([, t]) => t === '한참을 헤맨 끝에 등불 다리가 보였다. 반나절이 지났다.'));
  assert.deepEqual(tail.at(-1), ['등불지기 여울', '또 한 사람. 등불을 들든가, 끈을 묶어 두든가 해요. 묶어 둔 데는 안 잃어요.']);
  // 열 번에 한 번 반꼴
  const r = marshed('lostrate', { at: 'sunkenwood' }); let lost = 0;
  for (let k = 0; k < 400; k++) { r.place = 'sunkenwood'; r.battle = null; r.choice = null; r.phase = 0; r.tick = 0; tend(r); dispatch(r, { type: 'act', id: 'explore' }); if (r.place === 'floatgate') lost += 1; }
  assert.ok(lost > 35 && lost < 90, `400번에 ${lost}번`);
});

test('M18-3 등불을 켠 동안(예순 번)에는 길을 잃지 않는다. 안개늪 밖에서는 칸이 없다 (AN-B1, AN-B3)', () => {
  const s = marshed('lamp', { at: 'mossfield' });
  let slot = slotsNow(s).find((x) => x.label === '등불');
  assert.ok(slot.disabled && slot.why === '등불이 없다');
  give(s, 'lamp', 2);
  slot = slotsNow(s).find((x) => x.label === '등불');
  assert.equal(slot.sub, '가방에 2개');
  const tick = s.tick;
  dispatch(s, slot.action);
  assert.deepEqual([s.marsh.lamp, count(s, 'lamp'), s.tick, s.flags.dayWork || 0], [60, 1, tick, 0], '켜는 것은 움직임도 일도 아니다');
  assert.ok(s.log.some((l) => l.text === MARSH_LINES.lampOn));
  slot = slotsNow(s).find((x) => x.label === '등불');
  assert.ok(slot.disabled && slot.sub === '켜짐 · 60번 남음');
  assert.deepEqual(bodyView(s).curse.lamp, { id: 'lamp', name: '등불', text: '길을 잃지 않는다 (60번 남음)', left: 60 });
  assert.throws(() => dispatch(s, { type: 'act', id: 'lamp' }), /이미 켜져/);
  let moves = 0;
  while (s.marsh.lamp > 0 && moves < 200) {
    tend(s); s.phase = 0; s.tick = 0;
    if (s.battle || s.choice) { settle(s); continue; }
    dispatch(s, { type: 'act', id: 'explore' });
    assert.equal(s.place, 'mossfield', '등불이 켜져 있는 동안은 잃지 않는다');
    moves += 1;
  }
  assert.ok(s.log.some((l) => l.text === MARSH_LINES.lampOut));
  assert.equal(fogSafe(s), false);
  // 안개늪 밖: 칸도 없고 켤 수도 없다. 마을 안에서도 못 켠다
  const o = ashed('lampout', { at: 'ashslope' });
  give(o, 'lamp', 1);
  assert.ok(!labels(o).includes('등불') && !labels(o).includes('표식 묶기'));
  assert.throws(() => dispatch(o, { type: 'act', id: 'lamp' }), /여기서는 할 수 없는 일/);
});

test('M18-3 표식 끈: 한 번에 하나, 열 개를 묶은 곳에서는 영영 길을 잃지 않는다 (AN-B3)', () => {
  const s = marshed('knot', { at: 'sunkenwood' });
  let slot = slotsNow(s).find((x) => x.label === '표식 묶기');
  assert.ok(slot.disabled && slot.why === '표식 끈이 없다');
  give(s, 'marker', 12);
  slot = slotsNow(s).find((x) => x.label === '표식 묶기');
  assert.equal(slot.sub, '끈 12개');
  dispatch(s, slot.action);
  assert.deepEqual([s.marsh.knots.sunkenwood, count(s, 'marker'), s.flags.dayWork || 0], [1, 11, 0]);
  assert.ok(s.log.some((l) => l.text === `${MARSH_LINES.knot} (1 / 10)`));
  assert.equal(fogSafe(s), false, '아홉 개까지는 아직 잃는다');
  for (let i = 0; i < 9; i++) { tend(s); s.tick = 0; dispatch(s, { type: 'act', id: 'knot' }); }
  assert.equal(s.marsh.knots.sunkenwood, 10);
  assert.ok(s.log.some((l) => l.text === '가라앉는 숲의 길을 다 묶었다. 이제 여기서는 길을 잃지 않는다.'));
  assert.equal(fogSafe(s), true);
  assert.ok(!labels(s).includes('표식 묶기'), '다 묶은 곳에는 칸이 없다');
  assert.throws(() => dispatch(s, { type: 'act', id: 'knot' }), /여기서는 할 수 없는 일/);
  assert.equal(count(s, 'marker'), 2);
  for (let k = 0; k < 150; k++) { s.battle = null; s.choice = null; s.phase = 0; s.tick = 0; tend(s); dispatch(s, { type: 'act', id: 'explore' }); assert.equal(s.place, 'sunkenwood'); }
  // 이끼 밭은 끈을 묶는 곳이 아니다(다리의 등불을 붙인다, AN-D6). 가라앉는 숲을 묶었다고 이끼 밭까지 안전하지는 않다
  s.place = 'mossfield'; s.battle = null; s.choice = null;
  assert.ok(!labels(s).includes('표식 묶기'));
  assert.equal(fogSafe(s), false);
});

// ── M18-4 공방과 견습 (AN-C, AN-F3, AN-F4, LV-K) ──
const helmJob = (s, n = 22) => {
  s.craftTier.smith = 6; s.craftLv.smith = { lv: 21, xp: 0 };
  s.place = 'emptyshop';
  give(s, 'ashiron', n);
  dispatch(s, { type: 'workshop', op: 'put', index: s.bag.findIndex((x) => x.id === 'ashiron') });
  dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'make', recipe: 'ashiron_helm' } });
};
const shelfOf = (s, id) => s.shop.shelf.filter((x) => x.id === id).reduce((a, x) => a + x.n, 0);

test('M18-4 사기 전에는 "공방" 칸이 어디에도 없다. 빈 공방을 둘러보면 값을 알고, 은화 13,000에 산다 (AN-F3, LV-L6)', () => {
  const s = marshed('buy', { at: 'emptyshop' });
  assert.deepEqual(labels(s), ['둘러보기']);
  assert.equal(workshopView(s), null);
  for (const id of TOWNS['뜬마을'].order) { s.place = id; assert.ok(!JSON.stringify(slotsNow(s)).match(/공방|견습/), id); }
  s.place = 'emptyshop';
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'buy' }), /먼저 빈 공방을 둘러봐야/);
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'ashiron_helm' }), /화덕이 없습니다/);
  dispatch(s, { type: 'act', id: 'look' });
  assert.ok(s.log.some((l) => l.text === SHOP_LINES.price) && SHOP_LINES.price.includes('13,000'));
  s.silver = 12999;
  let slot = slotsNow(s).find((x) => x.label.startsWith('공방 사기'));
  assert.equal(slot.label, '공방 사기 (은화 13,000)');
  assert.ok(slot.disabled && slot.confirm.includes('13,000') && slot.ask.yes === '산다');
  assert.throws(() => dispatch(s, slot.action), /은화가 모자랍니다/);
  s.silver = 13500;
  const dings = s.dings.length;
  dispatch(s, slot.action);
  assert.equal(s.silver, 500);
  assert.ok(s.dings.slice(dings).some((d) => d.title === '공방이 생겼습니다'));
  assert.deepEqual(labels(s), ['둘러보기', '공방', '만들기', '바느질'], '남아 있던 모루와 물레를 쓴다');
  assert.equal(slotsNow(s).find((x) => x.label === '공방').open, 'workshop');
  // 처음 샀을 때의 창 (AN-C2)
  const v = workshopView(s);
  assert.deepEqual([v.hands, v.seats, v.hand, v.empty, v.seat, v.shelf.length], [0, 1, null, '모루도 물레도 식어 있다. 일할 사람을 들이면, 내가 일하는 동안 곁에서 같이 만든다. 내가 쉬면 견습도 쉰다.', '물 위 주막에서 사람을 찾는다', 0]);
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'buy' }), /이미 공방이/);
});

test('M18-4 견습은 물 위 주막에서 찾는다. 자리는 하나뿐이고, 둘째·셋째 자리는 어디에도 나오지 않는다 (AN-C4, AN-C8, AN-F4)', () => {
  const s = owner('hire', { at: 'floatinn' });
  s.silver = 99;
  let slot = slotsNow(s).find((x) => x.label === '견습');
  assert.equal(slot.sub, '보리 · 하루 삯 100');
  assert.ok(slot.disabled && slot.confirm.includes(PEOPLE.bori.story) && slot.ask.yes === '들인다');
  s.silver = 1000;
  slot = slotsNow(s).find((x) => x.label === '견습');
  dispatch(s, slot.action);
  assert.equal(s.silver, 900, '첫날 삯은 들일 때 낸다');
  assert.ok(s.log.some((l) => l.who === '보리' && l.text === PEOPLE.bori.join));
  assert.ok(!labels(s).includes('견습'), '자리가 찼으면 칸이 없다');
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'hire' }), /자리가 찼습니다/);
  const v = workshopView(s);
  assert.deepEqual([v.hands, v.seats, v.hand.name, v.hand.stage, v.hand.every, v.hand.job, v.wage], [1, 1, '보리', 1, 10, '', 100]);
  assert.equal(SHOP.seats, 1);
  assert.ok(!/61|81|둘째|셋째|소라/.test(JSON.stringify([v, slotsNow(s), HELP_MORE.make.filter((x) => x.needs === 'shop')])));
  // 일을 맡기는 것과 선반은 공방에서만
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'gather', item: 'saltsteel' } }), /공방에서 맡깁니다/);
  // 공방이 없는 사람에게는 칸도 없고 들일 수도 없다
  const n = marshed('nohire', { at: 'floatinn' });
  assert.ok(!labels(n).includes('견습'));
  assert.throws(() => dispatch(n, { type: 'workshop', op: 'hire' }), /공방이 없습니다/);
});

test('M18-4 맡길 일: 짓기는 내 단계보다 한 단계 아래의 설계도, 모으기는 두 단계 아래까지의 재료 (AN-C3, LV-M5)', () => {
  const s = master('jobs', { at: 'emptyshop' });
  s.craftTier.smith = 6; s.craftTier.sew = 5; s.craftTier.jewel = 1;
  const c = jobChoices(s);
  const helm = c.make.find((x) => x.name === '잿쇠 투구'), sword = c.make.find((x) => x.name === '잿쇠 검');
  assert.deepEqual([helm.needs, sword.needs], ['잿쇠 덩이 4', '잿쇠 덩이 6, 참나무 가지 1'], '시안의 두 줄');
  assert.ok(!c.make.some((x) => x.recipe.startsWith('mossiron_')), '제 단계의 것은 내 손으로만');
  assert.ok(!c.make.some((x) => x.recipe.startsWith('saltsteel_') && RECIPES[x.recipe].branch === 'smith'), '두 단계 아래의 것은 짓지 않는다');
  assert.ok(c.make.some((x) => x.recipe === 'saltsteel_boots'), '바느질은 바느질 단계를 따른다');
  assert.ok(c.make.every((x) => ITEMS[RECIPES[x.recipe].makes].kind === 'gear'));
  assert.deepEqual(c.gather.slice(0, 2).map((x) => [x.name, x.needs]), [['소금강 덩이 모으기', '내 10번에 하나'], ['전갈 껍질 모으기', '내 10번에 하나']]);
  assert.ok(!c.gather.some((x) => ['ashiron', 'lizardscale', 'mossiron', 'mistthread'].includes(x.item)), '한 단계 아래와 제 단계의 재료는 모으지 못한다');
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'make', recipe: 'mossiron_sword' } }), /맡길 수 없는 일/);
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'gather', item: 'ashiron' } }), /맡길 수 없는 일/);
  // 모으기: 내 열 번에 하나. 손은 오르지 않는다
  dispatch(s, { type: 'workshop', op: 'job', job: { kind: 'gather', item: 'saltsteel' } });
  assert.equal(workshopView(s).hand.job, '소금강 덩이 모으기');
  work(s, 9);
  assert.equal(shelfOf(s, 'saltsteel'), 0);
  assert.equal(workshopView(s).hand.left, 1);
  work(s, 1);
  assert.equal(shelfOf(s, 'saltsteel'), 1);
  work(s, 20);
  assert.deepEqual([shelfOf(s, 'saltsteel'), s.shop.hand.pts], [3, 0]);
  s.shop.hand.pts = 70;
  assert.equal(everyOf(s.shop.hand), 10, '손이 늘어도 모으기는 열 번에 하나다');
  // 선반의 것을 꺼낸다
  dispatch(s, { type: 'workshop', op: 'take', index: 0 });
  assert.deepEqual([count(s, 'saltsteel'), shelfOf(s, 'saltsteel')], [3, 0]);
});

test('M18-4 견습은 내가 열 번 일할 때 한 번 짓는다. 일반 등급으로만, 띠링도 숙련도도 제작 레벨도 경험치도 없이 (AN-C1, AN-C7, LV-K10)', () => {
  const s = master('make', { at: 'emptyshop' });
  helmJob(s, 22);
  assert.equal(workshopView(s).shelf.find((x) => x.id === 'ashiron').per, '투구 5개 치', '시안의 한 줄');
  const snap = () => JSON.stringify([s.made, s.craftLv, s.xp, s.level, s.skills.smithing || null, s.counters.crafts, s.dings.filter((d) => /잿쇠|만들|제작/.test(d.title + (d.body || ''))).length]);
  const before = snap();
  work(s, 9);
  assert.equal(s.shop.shelf.some((x) => x.id === 'ashiron_helm'), false);
  assert.equal(workshopView(s).hand.left, 1, '다음 하나까지 일 1번');
  work(s, 1);
  const helm = s.shop.shelf.find((x) => x.id === 'ashiron_helm');
  assert.deepEqual([helm.grade, helm.maker, helm.dur, shelfOf(s, 'ashiron')], [0, shopMaker(s), ITEMS.ashiron_helm.dur, 18]);
  assert.equal(snap(), before, '내 것은 아무것도 오르지 않는다');
  assert.equal(s.shop.hand.pts, 1);
  work(s, 40);
  assert.equal(s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length, 5);
  assert.deepEqual(workshopView(s).today, [{ name: '잿쇠 투구', n: 5, stall: 0, shelf: 5 }]);
  assert.equal(snap(), before);
  assert.ok(s.shop.shelf.every((x) => (x.grade || 0) === 0));
  // 날이 바뀌면 "오늘 만든 것"이 비고 삯이 나간다
  const silver = s.silver;
  s.place = 'floatgate';
  while (s.shop.hand.paidDay < s.day + 1 && s.day < 200) { const d = s.day; passPhase(s); if (s.day > d) break; }
  assert.deepEqual([workshopView(s).today, s.silver], [[], silver - 100]);
  assert.ok(s.log.some((l) => l.text === '보리에게 하루 삯 은화 100을 냈다.'));
});

test('M18-4 쉬기·잠·방 빌리기·길 가기·사고팔기·둘러보기만으로는 견습이 하나도 만들지 않는다 (LV-K, 지키는 것 2번·10번)', () => {
  const s = master('idle', { at: 'emptyshop' });
  helmJob(s, 40);
  s.shop.hand.pts = 70; // 가장 빠른 손이어도
  const days = s.day;
  for (let d = 0; d < 12; d++) {
    s.place = 'floatinn'; tend(s);
    dispatch(s, { type: 'act', id: 'room' }); // 방을 빌려 잔다
    dispatch(s, { type: 'move', to: 'floatgate' }); // 방을 옮긴다
    for (let i = 0; i < 12; i++) dispatch(s, { type: 'act', id: 'look' }); // 둘러본다
    dispatch(s, { type: 'move', to: 'lampbridge' });
    dispatch(s, { type: 'buy', id: 'lamp' }); // 산다
    dispatch(s, { type: 'sell', index: s.bag.findIndex((x) => x.id === 'lamp') }); // 판다
    dispatch(s, { type: 'move', to: 'floatinn' });
    dispatch(s, { type: 'act', id: 'room' });
    s.flags.noAmbush = true; s.calm = 99;
    travel(s, 'kilngate'); travel(s, 'floatgate'); // 길을 간다
    if (s.phase === 2) { tend(s); dispatch(s, { type: 'act', id: 'rest' }); } // 쉰다
  }
  assert.ok(s.day - days >= 12, `${s.day - days}일이 지났다`);
  assert.deepEqual([s.shop.hand.work, s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length, shelfOf(s, 'ashiron'), s.shop.hand.pts], [0, 0, 40, 70], '하나도 만들지 않았다');
  assert.equal(s.stall, null);
  assert.ok(s.shop.hand, '삯은 나갔다');
  // 일을 맡기지 않았으면 내가 일해도 돌지 않는다
  const n = master('nojob', { at: 'emptyshop' });
  work(n, 30);
  assert.deepEqual([n.shop.hand.work, n.shop.shelf.length], [0, 0]);
});

test('M18-4 만든 것은 가게 진열대의 빈 칸으로 먼저 가고, 남으면 공방 선반에 쌓인다. 견습이 지은 것은 좌판에 다시 올릴 수 있다 (AN-C1, AN-G3)', () => {
  const s = master('stall', { at: 'emptyshop' });
  s.stall = { regulars: 0, work: 0, items: [], sold: [], today: [] };
  for (let i = 0; i < 4; i++) s.stall.items.push({ ...gear('saltsteel_helm'), maker: s.name });
  helmJob(s, 40);
  const silver = s.silver;
  work(s, 30); // 견습 셋. 그사이 가게 손님도 한 번(스무 번에 하나) 온다
  const row = workshopView(s).today[0];
  assert.equal(row.n, 3);
  assert.ok(row.stall >= 2 && row.stall + row.shelf === 3, `진열대로 ${row.stall}, 선반에 ${row.shelf}`);
  assert.ok(s.stall.items.length <= 6);
  assert.ok(s.silver > silver, '가게 손님이 사 갔다');
  // 내려서 다시 올린다
  s.place = 'scaleyard';
  const i = s.stall.items.findIndex((x) => x.maker === shopMaker(s));
  dispatch(s, { type: 'stall', op: 'take', index: i });
  dispatch(s, { type: 'stall', op: 'put', index: s.bag.findIndex((x) => x.maker === shopMaker(s)) });
  // 주운 것은 여전히 못 올린다
  s.bag.push(gear('ashiron_helm'));
  assert.throws(() => dispatch(s, { type: 'stall', op: 'put', index: s.bag.length - 1 }), /내가 만든 물건만/);
});

test('M18-4 재료가 떨어지면 한 줄을 남기고 쉰다. 삯은 그대로 나가고, 못 주면 떠난다. 다시 들이면 익힌 손 그대로다 (AN-C4, AN-C6)', () => {
  const s = master('short', { at: 'emptyshop' });
  helmJob(s, 6); // 투구 하나 치와 두 덩이
  work(s, 40);
  assert.equal(s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length, 1);
  assert.equal(s.log.filter((l) => l.text === '보리가 손을 놓았다. 잿쇠 덩이가 떨어졌다.').length, 1, '한 번만 알린다');
  assert.equal(workshopView(s).hand.idle, true);
  // 재료를 넣으면 바로 다시 잡는다
  give(s, 'ashiron', 8);
  dispatch(s, { type: 'workshop', op: 'put', index: s.bag.findIndex((x) => x.id === 'ashiron') });
  work(s, 1);
  assert.equal(s.shop.shelf.filter((x) => x.id === 'ashiron_helm').length, 2);
  // 삯을 못 주면 떠난다
  s.shop.hand.pts = 30; s.silver = 50; s.place = 'floatgate';
  const day = s.day;
  while (s.day === day) passPhase(s);
  assert.equal(s.shop.hand, null);
  assert.ok(s.log.some((l) => l.text === '삯을 주지 못했다. 보리가 연장을 내려놓고 주막으로 돌아갔다.'));
  assert.equal(s.silver, 50, '없는 삯을 떼어 가지는 않는다');
  s.place = 'floatinn'; s.silver = 500;
  dispatch(s, { type: 'workshop', op: 'hire' });
  assert.equal(s.shop.hand.pts, 30);
  // 선반에는 재료만 넣는다
  s.place = 'emptyshop'; give(s, 'redpotion', 1);
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'put', index: s.bag.findIndex((x) => x.id === 'redpotion') }), /재료만/);
});

test('M18-4 견습의 손은 다섯 단계: 만든 수만큼 오르고, 내가 공방에서 같은 것을 만들면 두 배. 열 번에 한 번 → 다섯 번에 한 번 (AN-C5, LV-K4)', () => {
  assert.deepEqual([0, 9, 10, 25, 45, 69, 70, 500].map(handStage), [1, 1, 2, 3, 4, 4, 5, 5]);
  assert.deepEqual(SHOP.every, [10, 9, 8, 6, 5]);
  const s = master('hand', { at: 'emptyshop' });
  helmJob(s, 400);
  s.shop.hand.pts = 9;
  work(s, 10);
  assert.equal(s.shop.hand.pts, 10);
  assert.ok(s.log.some((l) => l.who === '공방' && l.text === '보리의 손이 늘었다. 손 2단계.'));
  assert.equal(workshopView(s).hand.every, 9);
  s.shop.hand.pts = 70; s.shop.hand.work = 0;
  work(s, 5);
  assert.equal(s.shop.hand.pts, 71, '다섯 번에 한 번');
  // 곁에서 같은 것을 두드리면 두 배
  s.shop.hand.pts = 0; s.shop.hand.work = 9;
  for (const n of RECIPES.ashiron_helm.needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe: 'ashiron_helm' });
  tend(s); dispatch(s, { type: 'hammer' });
  assert.equal(s.shop.hand.pts, 2);
  // 다른 것을 두드리면 하나
  while (s.craft) { tend(s); s.shop.hand.work = 0; dispatch(s, { type: 'hammer' }); }
  s.shop.hand.pts = 0; s.shop.hand.work = 9;
  for (const n of RECIPES.ashiron_knife.needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe: 'ashiron_knife' });
  tend(s); dispatch(s, { type: 'hammer' });
  assert.equal(s.shop.hand.pts, 1);
});

test('M18-4 다시 태어나면 공방은 남고 견습은 떠난다 (LV-K11)', () => {
  const s = master('reborn', { at: 'emptyshop' });
  helmJob(s, 22); s.shop.hand.pts = 50;
  work(s, 10);
  const c = shopCarry(s);
  assert.deepEqual([c.hand, c.left, c.today], [null, {}, []]);
  assert.equal(c.shelf.filter((x) => x.id === 'ashiron_helm').length, 1);
  const carry = rebirthCarry(s);
  const n = createGame({ name: '새삶', origin: 'farmer', seed: 'reborn-shop', carry });
  assert.ok(n.shop && n.shop.hand === null && n.shop.shelf.length === c.shelf.length);
  assert.equal(n.marsh.curse, 0);
});

// ── M18-5 가라앉는 오솔길과 이끼 덮인 종지기 (AN-A10, LV-I3) ──
/** 오솔길로 들어가 방을 차례로 지난다. 종 앞까지. */
const path = (s) => {
  s.place = 'lampbridge'; s.choice = null; s.battle = null;
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'sunkenpath' });
  for (const id of ['p1-reeds', 'p2-sink', 'p2-boat', 'p2-sink', 'p3-post', 'p4-gate', 'p4-lights', 'p5-bell']) {
    tend(s);
    dispatch(s, { type: 'room', to: id });
    if (s.battle) settle(s);
    if (s.choice?.kind === 'trap') { s.stats.agi += 90; dispatch(s, { type: 'choose', id: 'dodge' }); s.stats.agi -= 90; }
    if (s.choice?.kind === 'door') dispatch(s, { type: 'choose', id: 'key' });
    assert.equal(s.dungeon.room, id);
  }
};

test('M18-5 가라앉는 오솔길은 다섯 굽이이고, 지금 폐허와 같은 틀이다. 종지기는 먼저 치지 않는다 (AN-A10)', () => {
  const d = DUNGEONS.sunkenpath;
  assert.deepEqual([d.name, d.from, d.floors.length], ['가라앉는 오솔길', 'lampbridge', 5]);
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.floor))].sort(), [0, 1, 2, 3, 4]);
  for (const [id, r] of Object.entries(d.rooms)) { assert.ok(r.text && r.name, id); for (const x of r.exits) assert.ok(d.rooms[x].exits.includes(id), `${id} ↔ ${x}`); }
  assert.deepEqual([...new Set(Object.values(d.rooms).map((r) => r.kind))].sort(), ['boss', 'door', 'fight', 'hall', 'rest', 'trap', 'treasure']);
  assert.deepEqual(d.rooms['p2-boat'].loot.items.map((x) => x[0]), ['mosskey', 'lamp', 'holywater', 'redpotion']);
  const s = marshed('path', { at: 'lampbridge' });
  path(s);
  assert.equal(roomView(s).dungeon, '가라앉는 오솔길');
  assert.equal(s.battle, null, '들어서도 싸움이 나지 않는다');
  assert.equal(s.choice, null);
  assert.deepEqual(slotsNow(s).map((x) => x.label).slice(0, 2), ['이끼 걷기', '종지기를 쉬게 한다']);
  assert.equal(bodyView(s).curse.field, false, '오솔길 안은 길이 하나라 안개에 잃지 않는다');
  // 오솔길 밖에서는 걷을 수도, 싸움을 걸 수도 없다
  const o = marshed('nopath', { at: 'lampbridge' });
  assert.throws(() => dispatch(o, { type: 'moss' }), /오솔길의 끝/);
  assert.throws(() => dispatch(o, { type: 'bellman' }), /종지기가 없습니다/);
});

test('M18-5 종지기는 보통 몬스터의 생명력 4배·공격력 1.25배다. 쓰러뜨리면 종에 기대어 주저앉는다 (LV-I3)', () => {
  const m = MONSTERS.mossbellman;
  assert.deepEqual([m.name, m.level, m.boss, m.band], ['이끼 덮인 종지기', 60, true, 6]);
  const n = normalAt(60);
  assert.deepEqual(n, { hp: Math.round(BANDS[5].mon.hp * 1.2), attack: Math.round(BANDS[5].mon.attack * 1.2), defense: Math.round(BANDS[5].mon.defense * 1.2) });
  assert.deepEqual([m.hp, m.attack, m.defense], [n.hp * 4, Math.round(n.attack * 1.25), n.defense]);
  const s = marshed('bellman', { at: 'lampbridge' });
  s.main.chapter = 99; // 장의 끝은 M18-6에서 본다
  path(s);
  dispatch(s, slotsNow(s).find((x) => x.label === '종지기를 쉬게 한다').action);
  assert.equal(s.battle.mon, 'mossbellman');
  assert.equal(enemyView(s).boss, true);
  settle(s);
  assert.equal(s.dmem.sunkenpath.keeper, 'beat');
  assert.ok(s.log.some((l) => l.text === DUNGEONS.sunkenpath.bossDown));
  assert.ok(s.bag.some((x) => x.id === 'mossiron') && s.bag.some((x) => x.id === 'mistthread'), '이끼쇠와 안개실을 꼭 떨군다');
  assert.deepEqual(slotsNow(s).map((x) => x.label).filter((l) => l === '이끼 걷기' || l === '종지기를 쉬게 한다'), ['이끼 걷기'], '쉬게 한 뒤에도 이끼는 걷을 수 있다');
  assert.throws(() => dispatch(s, { type: 'bellman' }), /종지기가 없습니다/);
});

// ── M18-6 9장 잊힌 종 (AN-D, LV-D9) ──
test('M18-6 9장의 퀘스트 창: 잊힌 종과 푸는 길 셋. 약초꾼 수련과 처음 만난다 (AN-D, AN-D1)', () => {
  const s = marshed('ch9', { at: 'floatgate' });
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [9, '잊힌 종']);
  assert.equal(v.text, '뜬마을의 종은 아무도 숨기지 않았다. 아무도 팔지 않았고 아무도 녹이지 않았다. 그냥 울 일이 없었다. 이 마을에서는 무엇이든 하다가 만다. 종은 늪 속 오솔길 끝에서 이끼에 덮였고, 마지막 종지기는 종 곁을 떠나지 않다가 종과 한 몸이 되었다.');
  assert.deepEqual(v.paths.map((p) => [p.name, p.text]), [['쉬게 하는 길', '오솔길 끝의 종지기를 쓰러뜨려 쉬게 한다'], ['걷어 내는 길', '종의 이끼를 손으로 오백 번 걷는다'], ['가르치는 길', '견습 하나의 손을 끝(5단계)까지 키운다']]);
  assert.deepEqual(v.paths.map((p) => [p.have, p.need]), [[0, 1], [0, 500], [0, 5]]);
  assert.ok(!v.text.includes('아직 쓰이지 않았다'), '안개늪의 이야기는 이제 쓰였다');
  walk(s, 'herbhut');
  const at = s.log.findIndex((l) => l.who === '약초꾼 수련' && l.text === SURYEON_FIRST[0][1]);
  assert.deepEqual(s.log.slice(at, at + 4).map((l) => [l.k, l.who || '', l.text]), SURYEON_FIRST.map(([k, text]) => [k, k === 'npc' ? '약초꾼 수련' : '', text]));
  assert.equal(SURYEON_FIRST[3][1], '종이요? …있었죠, 아마.');
  walk(s, 'floatgate'); walk(s, 'herbhut');
  assert.equal(s.log.filter((l) => l.text === '종은 어디 있느냐고 물었다.').length, 1, '처음 한 번만');
  assert.equal(new Set(MAIN[9].paths.map((p) => p.called)).size, 3);
  // 늪 사당의 "다시 태어나기"는 9장을 끝낸 사람에게만 (SB-E1)
  s.place = 'marshshrine';
  assert.ok(!labels(s).includes('다시 태어나기'));
  assert.ok(labels(rested('rb', { at: 'marshshrine' })).includes('다시 태어나기'));
  assert.ok(labels(marshed('rb7', { at: 'saltshrine' })).includes('다시 태어나기'), '저울목의 사당은 그대로 7장이다');
});

test('M18-6 쉬게 하는 길: 종지기를 쓰러뜨리면 종이 낮게 한 번 운다. 잠긴 도성으로 가는 물길이 열린다 (AN-D3)', () => {
  const s = marshed('rest', { at: 'lampbridge' });
  path(s);
  dispatch(s, { type: 'bellman' });
  settle(s);
  assert.deepEqual([s.main.chapter, s.main.done.at(-1).path, s.main.called], [10, 'rest', '종지기를 쉬게 한 이']);
  assert.ok(s.log.some((l) => l.text === '이끼가 흘러내리자 그 아래 사람의 얼굴이 있었다. 눈을 뜨고 있었다. "누가… 왔나." 그리고 종에 기댄 채 눈을 감았다. 종이 아주 낮게 한 번 울었다. 고맙다는 소리 같았다.'));
  assert.ok(s.opened.includes('sunkenroad'));
  assert.ok(s.dings.some((d) => d.title.includes("9장 '잊힌 종'") && d.body.includes('잠긴 도성으로 가는 물길이 열렸습니다')));
  // 잠긴 도성이 났다 (M19): 지도에 지붕마을이 나오고, 퀘스트 창은 10장을 보여 준다(덧말은 걷었다)
  assert.ok(!mainView(s).text.includes(SUNKEN_ROAD_SAY));
  assert.equal(mainView(s).name, MAIN[10].name);
  assert.ok(JSON.stringify(mapView(s)).includes('지붕마을'));
});

test('M18-6 걷어 내는 길: 종의 이끼를 손으로 오백 번 걷는다. 한 번 누르면 한 번이고, 일로 친다 (AN-D4)', () => {
  const s = marshed('peel', { at: 'lampbridge' });
  path(s);
  const slot = () => slotsNow(s).find((x) => x.label === '이끼 걷기');
  assert.equal(slot().sub, '0 / 500');
  const tick = s.tick, workDone = s.flags.dayWork || 0;
  dispatch(s, slot().action);
  assert.deepEqual([s.marsh.moss, s.tick - tick, (s.flags.dayWork || 0) - workDone], [1, 1, 1]);
  assert.equal(mainView(s).paths[1].have, 1);
  for (let i = 0; i < 498; i++) { tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'moss' }); }
  assert.deepEqual([s.marsh.moss, s.main.chapter, slot().sub], [499, 9, '499 / 500']);
  tend(s); dispatch(s, { type: 'moss' });
  assert.deepEqual([s.main.chapter, s.main.called], [10, '이끼를 걷은 이']);
  assert.ok(s.log.some((l) => l.text === '오백 번째 이끼를 걷자 종의 맨살이 드러났다. 띠링. 종이 답했다. 이 마을에서 처음으로, 끝까지 한 사람에게.'));
  assert.equal(s.dmem.sunkenpath.keeper, null, '종지기는 그대로 종 곁에 있다');
  // 끝낸 뒤에도 이끼는 계속 걷을 수 있다. 칸에 숫자는 더 나오지 않는다
  assert.equal(slot().sub, undefined);
  tend(s); dispatch(s, { type: 'moss' });
  assert.equal(s.marsh.moss, 501);
});

test('M18-6 가르치는 길: 견습 하나의 손을 끝(5단계)까지 키운다 (AN-D5, AN-G4)', () => {
  const s = master('teach', { at: 'emptyshop' });
  helmJob(s, 400);
  assert.deepEqual(mainView(s).paths[2].have, 1, '들이면 1단계');
  s.shop.hand.pts = 45;
  assert.equal(mainView(s).paths[2].have, 4);
  s.shop.hand.pts = 68;
  work(s, 6);
  assert.deepEqual([s.shop.hand.pts, s.main.chapter], [69, 9]);
  work(s, 6);
  assert.equal(s.shop.hand.pts, 70);
  assert.deepEqual([s.main.chapter, s.main.called], [10, '끝을 가르친 이']);
  assert.ok(s.log.some((l) => l.text === MAIN[9].paths[2].done));
  assert.ok(MAIN[9].paths[2].done.startsWith('보리가 마지막 망치질을 하고 고개를 들었다. "다 됐어요. …이게 다 된 거예요?"'));
  assert.ok(s.opened.includes('sunkenroad'));
});

// ── M18-7 서브 둘과 히든 (AN-D6, AN-D7, LV-E6) ──
test('M18-7 서브 "길 잃은 등불": 꺼진 등불 여섯 자리에 불을 붙이면 이끼 밭에서는 길을 잃지 않는다 (AN-D6)', () => {
  const s = marshed('lamps', { at: 'lampbridge' });
  dispatch(s, { type: 'greet', npc: 'yeoul' });
  assert.ok(offersOf(s, 'yeoul').includes('lostlamps'));
  dispatch(s, { type: 'quest', op: 'accept', id: 'lostlamps' });
  assert.equal(subView(s, 'lostlamps').step.text, '등불 다리의 꺼진 등불 여섯 자리에 불을 다시 붙인다. 자리마다 등불 하나가 든다. 다 붙이면 이끼 밭에서는 길을 잃지 않는다.');
  give(s, 'lamp', 5);
  assert.ok(!subView(s, 'lostlamps').step.choices.find((c) => c.id === 'light').can);
  give(s, 'lamp', 2);
  dispatch(s, { type: 'quest', op: 'choose', id: 'lostlamps', choice: 'light' });
  assert.deepEqual([s.quests.lostlamps.done, s.quests.lostlamps.ending, count(s, 'lamp'), s.flags.lampsLit], [true, '여섯 자리에 불을 붙였다', 1, true]);
  s.place = 'mossfield';
  assert.equal(fogSafe(s), true);
  for (let k = 0; k < 150; k++) { s.battle = null; s.choice = null; s.phase = 0; s.tick = 0; tend(s); dispatch(s, { type: 'act', id: 'explore' }); assert.equal(s.place, 'mossfield'); }
  s.place = 'sunkenwood'; s.battle = null; s.choice = null;
  assert.equal(fogSafe(s), false, '가라앉는 숲은 끈을 묶어야 한다');
});

test('M18-7 서브 "약초꾼의 제자": 안개늪의 약초 다섯 가지를 캐서 장부를 채우고 늪 약탕의 요령을 배운다 (AN-D7)', () => {
  const herbs = ['marshmoss', 'toadgrass', 'mistmint', 'lampshroom', 'fogbloom'];
  for (const id of herbs) assert.equal(ITEMS[id].kind, 'material', id);
  const found = new Set([...WILDS.mossfield.gather.drops.map((x) => x.id), ...WILDS.sunkenwood.finds.map((x) => x.id)]);
  for (const id of herbs) assert.ok(found.has(id), `${id}는 안개늪에서 난다`);
  const s = marshed('ledger', { at: 'herbhut' });
  dispatch(s, { type: 'greet', npc: 'suryeon' });
  dispatch(s, { type: 'quest', op: 'accept', id: 'herbledger' });
  for (const id of herbs.slice(0, 4)) give(s, id, 1);
  assert.ok(!subView(s, 'herbledger').step.choices.find((c) => c.id === 'fill').can);
  // 이끼 밭에서 캐면 약초가 나온다
  const d = lit(marshed('dig', { at: 'mossfield' }));
  for (let i = 0; i < 60; i++) { tend(d); d.tick = 0; d.phase = 0; dispatch(d, { type: 'act', id: 'dig' }); settle(d); }
  assert.ok(count(d, 'mossiron') > 0 && count(d, 'marshmoss') + count(d, 'toadgrass') + count(d, 'mistmint') > 0);
  give(s, 'fogbloom', 1);
  dispatch(s, { type: 'quest', op: 'choose', id: 'herbledger', choice: 'fill' });
  assert.deepEqual([s.quests.herbledger.done, s.quests.herbledger.ending, s.flags.brewKnack, count(s, 'fogbloom')], [true, '장부를 끝까지 채웠다', true, 0]);
  // 요령: 늪 약탕을 끓이면 한 그릇이 더 나온다
  s.craftLv.cook = { lv: 22, xp: 0 }; s.craftTier.cook = 6;
  make(s, 'cook_marshbrew');
  assert.equal(count(s, 'dish_marshbrew'), 2);
  const p = marshed('plain', { at: 'herbhut' });
  p.craftLv.cook = { lv: 22, xp: 0 }; p.craftTier.cook = 6;
  make(p, 'cook_marshbrew');
  assert.equal(count(p, 'dish_marshbrew'), 1);
});

test('M18-7 히든 "이끼 한 장": 종의 이끼를 손으로 천 번 걷는다. 조건은 화면과 도움말 어디에도 없다 (LV-E6)', () => {
  assert.deepEqual([MOSS.peel, MOSS.hidden], [500, 1000]);
  const s = rested('leaf', { at: 'lampbridge' });
  s.dmem.sunkenpath = { seen: [], done: {}, nights: 0, keeper: 'beat' };
  path(s);
  s.marsh.moss = 998;
  tend(s); dispatch(s, { type: 'moss' });
  assert.equal(s.hq.mossleaf, undefined, '구백아흔아홉 번으로는 나타나지 않는다');
  tend(s); dispatch(s, { type: 'moss' });
  assert.equal(s.hq.mossleaf.status, 'offered');
  assert.equal(s.choice.kind, 'hq');
  assert.ok(s.dings.at(-1).title.includes('이끼 한 장'));
  dispatch(s, { type: 'choose', id: 'accept' });
  for (const id of ['p4-lights', 'p4-gate', 'p3-post', 'p2-sink', 'p1-reeds', 'p1-end']) { tend(s); dispatch(s, { type: 'room', to: id }); settle(s); }
  dispatch(s, { type: 'dungeon', op: 'leave' });
  walk(s, 'herbhut');
  dispatch(s, { type: 'greet', npc: 'suryeon' });
  if (s.hq.mossleaf.status !== 'done') talkTo(s, 'suryeon');
  assert.equal(s.hq.mossleaf.status, 'done');
  assert.ok(texts(s).includes(HIDDENS.mossleaf.done));
  // 조건이 화면에 나오지 않는다: 도움말, 히든 목록, 퀘스트 창, 단축 칸(종 앞에서도), 몸 상태
  const f = marshed('nohint', { at: 'lampbridge' });
  path(f); f.marsh.moss = 300;
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, { white: true, salt: true, stall: true, reborn: true, ash: true, hot: true, marsh: true, shop: true })), hiddenView(f), hiddenSlots(f), questBook(f), mainView(f), slotsNow(f), bodyView(f), workshopView(f), mapView(f)]);
  assert.ok(!/천 번|1000|1,000|이끼 한 장|mossleaf/.test(shown));
  const r = rested('nohint2', { at: 'lampbridge' });
  r.dmem.sunkenpath = { seen: [], done: {}, nights: 0, keeper: 'beat' };
  path(r); r.marsh.moss = 700;
  assert.ok(!/700|1000|천 번/.test(JSON.stringify(slotsNow(r))), '9장을 끝낸 뒤에는 칸에 걷은 수도 나오지 않는다');
});
