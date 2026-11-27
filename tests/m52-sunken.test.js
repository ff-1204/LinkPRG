// M19 가라앉은 서울: 잠긴 도성(레벨 61~70). 구간 용병, 곳, 숨, 짝, 호위받는 채집, 견습 둘째 자리, 잠긴 궁, 10장 늘 울리던 종, 서브와 히든.
// 기준: systems.md "17차: 잠긴 도성 화면"(JD-), roadmap.md M19-1 ~ M19-10. 여정은 journey-sunken.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, slotsNow } from '../src/core/game.js';
import { BANDS } from '../src/data/bands.js';
import { PLACES } from '../src/data/places.js';
import { COMPANIONS, BAND_MERCS, BAND_MERC, MERC_ORDER, GUARD_RATE, refAttack, bandMercStats, mercsAt } from '../src/data/companions.js';
import { mercView, mercElsewhere, partyView, guardFor } from '../src/core/party.js';
import { startBattle } from '../src/core/battle.js';
import { travel, walk, ended } from './_white.js';
import { marshed } from './_marsh.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');

// ── M19-1 구간 용병 (LV-H3, JD-C1, JD-C3, JD-F5, JD-G3, JD-G6) ──

test('M19-1 거점 다섯에 그 구간의 용병 셋: 때리는 이 둘(하나는 뒷줄), 막는 이 하나', () => {
  assert.deepEqual(Object.keys(BAND_MERCS).map(Number), [3, 4, 5, 6, 7, 8, 9, 10]); // 구름다리의 셋은 M20에서, 별못의 셋은 M21에서, 처음 모루의 천막은 M22에서 왔다
  for (const g of Object.values(BAND_MERCS)) {
    if (g.tents) continue; // 일곱 천막은 M22의 테스트에서 본다 (CM-C)
    if (g.band < 7) { // 잠긴 도성의 근위 막사는 M19-3에서 본다
      assert.ok(PLACES[g.place].merc && PLACES[g.place].actions.includes('merc'), `${g.place}에 용병 칸`);
      assert.equal(PLACES[g.place].band, g.band);
    }
    const ds = g.order.map((id) => COMPANIONS[id]);
    assert.deepEqual(ds.map((d) => [d.role, d.row]), [['striker', 'front'], ['striker', 'back'], ['guard', 'front']]);
    for (const d of ds) { assert.equal(d.way, 'merc'); assert.equal(d.band, g.band); assert.ok(d.join && d.leave && d.name); }
  }
  assert.deepEqual(BAND_MERCS[7].order.map((id) => COMPANIONS[id].name), ['파랑', '이랑', '너울'], '잠긴 도성의 이름은 시안의 것');
  const names = Object.values(COMPANIONS).filter((d) => d.home !== 'seventents').map((d) => d.name); // 천막의 사람들은 아래에서 올라온 그 사람들이다(파랑, 미루). M22의 테스트에서 본다
  assert.equal(new Set(names).size, names.length, '이름이 겹치지 않는다');
});

test('M19-1 숫자는 구간 자료에서: 때리는 이는 기준 사람의 55%로 치고, 삯은 하루 벌이의 12%', () => {
  for (const n of [3, 4, 5, 6, 7]) {
    const b = BANDS[n - 1], mine = refAttack(n) - b.mon.defense;
    const [st, back, guard] = BAND_MERCS[n].order.map((id) => COMPANIONS[id]);
    assert.ok(Math.abs((st.attack - b.mon.defense) / mine - 0.55) < 0.01, `${n}구간 때리는 이 55%`);
    assert.ok(back.attack < st.attack && guard.attack < back.attack);
    for (const d of [st, back, guard]) assert.ok(Math.abs(d.fee - b.day * 0.12) <= 5, `${n}구간 삯`);
    assert.equal(guard.guardRate, 0.35);
    assert.equal(guard.hp, Math.round(b.mon.hp / 100) * 100);
  }
  // 잠긴 도성은 시안의 숫자 그대로 (JD-C1)
  assert.deepEqual(BAND_MERCS[7].order.map((id) => [COMPANIONS[id].hp, COMPANIONS[id].fee]), [[1400, 250], [1100, 250], [2000, 250]]);
  assert.equal(bandMercStats(7, 'striker').attack, COMPANIONS.parang.attack);
  assert.equal(BAND_MERC.strike, 0.55);
});

test('M19-1 막는 이는 맞을 것의 35%쯤을 대신 맞는다. 돌방패는 지금대로 70%', () => {
  const rate = (id) => {
    const s = marshed(`g-${id}`);
    s.party.push({ id, hp: 99999, row: 'front', plan: 'mefirst', crossed: 0, bond: 0, down: false, day: s.day });
    startBattle(s, [], 'mosstoad');
    let n = 0;
    for (let i = 0; i < 4000; i++) if (guardFor(s)) n++;
    return n / 4000;
  };
  assert.ok(Math.abs(rate('hanul') - 0.35) < 0.03);
  assert.ok(Math.abs(rate('stoneshield') - GUARD_RATE) < 0.03);
});

test('M19-1 사냥꾼 움막의 용병 창에는 그 구간 사람 셋. 제 거점에서만 구한다', () => {
  const s = ended('m1');
  travel(s, 'icegate'); walk(s, 'hunterhut');
  assert.deepEqual(mercView(s).map((m) => [m.name, m.fee]), [['창잡이 솔개', 30], ['활잡이 새벽', 30], ['방패잡이 바우', 30]]);
  assert.match(mercView(s)[0].text, /55%/);
  assert.match(mercView(s)[2].text, /35%/);
  s.silver = 500;
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'gaon' }), /훈련소나 모험가 회관/);
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'mireu' }), /용병 막사에서 구합니다/);
  dispatch(s, { type: 'party', op: 'hire', id: 'bau' });
  assert.equal(s.silver, 470);
  assert.equal(partyView(s)[0].name, '방패잡이 바우');
  assert.equal(partyView(s)[0].fee, 30);
  assert.deepEqual(mercsAt(PLACES.training), MERC_ORDER);
});

test('M19-1 지금 용병 셋은 소리재까지만 따라온다. 구간 용병도 제 구간까지만', () => {
  const s = ended('m2');
  s.place = 'guild'; s.silver = 5000;
  dispatch(s, { type: 'party', op: 'hire', id: 'gaon' });
  dispatch(s, { type: 'party', op: 'hire', id: 'stoneshield' });
  s.place = 'pass';
  travel(s, 'icegate');
  assert.equal(s.party.length, 0, '고개를 넘을 때 둘 다 남았다');
  assert.match(texts(s), /가온이 걸음을 멈췄다/);
  assert.match(texts(s), /돌방패가 걸음을 멈췄다/);
  // 흰마루의 용병은 흰마루와 그 앞 구간에서는 따라온다
  walk(s, 'hunterhut');
  dispatch(s, { type: 'party', op: 'hire', id: 'solgae' });
  travel(s, 'snowfield');
  assert.equal(s.party.length, 1);
  travel(s, 'pass');
  assert.equal(s.party.length, 1, '앞 구간으로는 따라온다');
  // 소금벌로 내려가면 남는다
  s.opened.push('saltflat');
  travel(s, 'icegate');
  travel(s, 'saltgate');
  assert.equal(s.party.length, 0);
  assert.match(texts(s), /솔개가 걸음을 멈췄다/);
});

test('M19-1 가 보지 않은 거점의 용병은 용병 창에 나오지 않는다 (JD-F5)', () => {
  const s = ended('m3');
  s.place = 'training';
  assert.deepEqual(mercElsewhere(s), [], '아무 데도 안 가 본 사람');
  s.dex.places.hunterhut = true;
  assert.deepEqual(mercElsewhere(s), [{ names: '솔개 · 새벽 · 바우', why: '사냥꾼 움막에서 구한다' }]);
  s.dex.places.training = true;
  s.place = 'hunterhut';
  assert.deepEqual(mercElsewhere(s), [{ names: '가온 · 바람결 · 돌방패', why: '여기까지 따라오지 않는다' }]);
  s.dex.places.barracks = true;
  assert.deepEqual(mercElsewhere(s).map((x) => x.why), ['여기까지 따라오지 않는다', '용병 막사에서 구한다']);
  assert.ok(!JSON.stringify(mercElsewhere(s)).includes('파랑'));
});

// ── M19-2 계산 도구의 용병 (LV-I5) ──

test('M19-2 계산 도구가 용병 하나·둘을 데리고 잰다. 용병이 있으면 싸움이 짧아지고 덜 잃는다', async () => {
  const { measure, mercsOf, mercsOfKit, applyKit, buildPlayer, gearOf } = await import('../tools/balance.mjs');
  assert.deepEqual(mercsOf(BANDS[6]), ['parang', 'neoul'], '때리는 이와 막는 이');
  assert.deepEqual(mercsOf(BANDS[0]), ['gaon', 'stoneshield'], '1~20은 지금 용병');
  assert.deepEqual(mercsOf(BANDS[7]), ['seori', 'bawi'], '구름다리의 용병은 M20에서 왔다');
  assert.deepEqual(mercsOf(BANDS[8]), ['hanmoe', 'doran'], '별못의 용병은 M21에서 왔다');
  assert.deepEqual(mercsOf(BANDS[9]), ['tent7f', 'tent6f'], '처음 모루는 일곱 천막의 사람이 용병을 대신한다 (M22)');
  assert.deepEqual(['bare', 'holy', 'merc', 'merc2', 'bard'].map(mercsOfKit), [0, 0, 1, 2, 2]);
  const s = buildPlayer(BANDS[6], 'warrior', gearOf(7, 'str', 'warrior'));
  assert.equal(applyKit(s, BANDS[6], 'merc'), null);
  assert.deepEqual(s.party.map((c) => c.id), ['parang']);
  assert.ok(s.buffs.food && s.buffs.grace, '음식과 성수도 갖춘다');
  const of = (mercs) => measure(6, { runs: 24, mercs }).find((r) => r.job === 'warrior');
  const [alone, one, two] = [0, 1, 2].map(of);
  assert.ok(one.turns < alone.turns, `용병 하나면 턴이 준다 (${alone.turns} → ${one.turns})`);
  assert.ok(two.loss < one.loss, `막는 이까지 있으면 덜 잃는다 (${one.loss}% → ${two.loss}%)`);
});

// ── M19-3 곳 (JD-A, JD-F1) ──
import { mapView, bodyView, enemyView, roomFee, SUNKEN_FIRST, SAVE_VERSION, workshopView, slotsNow as slots } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { parseSave } from '../src/core/save.js';
import { TOWNS } from '../src/data/places.js';
import { WILDS, INCIDENTS } from '../src/data/wild.js';
import { ITEMS } from '../src/data/items.js';
import { PEOPLE, CALLS } from '../src/data/people.js';
import { JOBS as BOARD, MAIN, HANBYEOL_FIRST, CLOUD_ROAD_SAY, ECHO, HIDDENS } from '../src/data/quests.js';
import { RECIPES } from '../src/data/recipes.js';
import { DUNGEONS } from '../src/data/dungeon.js';
import { MONSTERS } from '../src/data/monsters.js';
import { normalAt } from '../src/data/bands.js';
import { shopView } from '../src/core/trade.js';
import { boardView, mainView, offersOf, subView, hiddenView, questBook } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';
import { SUNKEN, SUNKEN_LINES, breathMax, breathMove, breathView, underwater, pairComes, escorts, chestsOpened, chestsLeft, giftBoost } from '../src/core/sunken.js';
import { relieveChance, relievedPosts } from '../src/core/dungeon.js';
import { SHOP, shopCarry, stageNow, seatsOf } from '../src/core/workshop.js';
import { partyRest } from '../src/core/party.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { give, count } from './_salt.js';
import { rested, tend, settle, master, work } from './_marsh.js';
import { passPhase, talkTo } from './_time.js';
import { sunk, quieted, withMercs, bronzed } from './_sunken.js';

const labels = (s) => slots(s).map((x) => x.label.replace(/ \(.*/, ''));
const ALL_HELP = { white: true, salt: true, stall: true, reborn: true, ash: true, hot: true, marsh: true, shop: true, sunken: true, escort: true };
const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { tend(s); dispatch(s, { type: 'hammer' }); }
};
/** 첫째든 둘째든 지금 싸움을 한 대에 끝낸다. */
const finish = (s) => { tend(s); s.battle.hp = 1; return dispatch(s, { type: 'battle', choice: 'attack' }); };
/** 잠긴 궁의 그 방에 선 사람(앞의 방들은 지나온 것으로 친다). */
const inPalace = (s, room, { relieved = [] } = {}) => {
  s.place = 'palaceyard'; s.battle = null; s.choice = null;
  s.dungeon = { id: 'sunkenpalace', room, prev: null, cleared: {}, rested: {}, alert: false };
  s.dmem.sunkenpalace = s.dmem.sunkenpalace || { seen: [], done: {}, nights: 0, keeper: null };
  s.dmem.sunkenpalace.seen = Object.keys(DUNGEONS.sunkenpalace.rooms);
  for (const id of relieved) s.dmem.sunkenpalace.done[id] = true;
  s.sunken.breath = breathMax(s);
  return s;
};
const POSTS = ['s1-post', 's2-post', 's3-post', 's4-post', 's5-post'];

test('M19-3 9장을 끝내기 전에는 잠긴 도성이 지도·소문·뜬마을의 칸 어디에도 없다 (JD-F1)', () => {
  const s = marshed('nosunk');
  const rows = mapView(s);
  for (const id of ['roofgate', 'sunkenstreet', 'palaceyard']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/지붕마을|잠긴 거리|잠긴 궁|잠긴 도성/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/지붕마을|잠긴 도성/));
  s.place = 'floatgate';
  assert.ok(!slots(s).some((x) => x.label === '물길을 따라 내려간다'));
  for (const to of ['roofgate', 'sunkenstreet', 'palaceyard']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
  assert.equal(bodyView(s).breath, null, '숨 칸도 없다');
  s.place = 'floatinn';
  assert.ok(!JSON.stringify([mercView(s), mercElsewhere(s)]).match(/파랑|너울|이랑/), '가 보지 않은 거점의 용병');
});

test('M19-3 9장을 끝내면 뜬마을 나루에서 물길을 따라 내려가 지붕마을 선창에 닿는다 (JD-A1, JD-D2)', () => {
  const s = rested('down', { at: 'floatgate' });
  assert.equal(mapView(s).find((r) => r.id === 'roofgate').name, '지붕마을');
  assert.deepEqual(slots(s).find((x) => x.label === '물길을 따라 내려간다').action, { type: 'travel', to: 'roofgate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'roofgate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 25, '배로 반나절');
  assert.equal(SUNKEN_FIRST[0], '안개가 걷히자 물 위에 지붕들이 떠 있었다. 지붕이 아니다. 잠긴 것의 꼭대기다. 배 밑으로 거리가 지나갔다. 그리고 물속에서, 아주 많은 띠링이 한꺼번에 울리고 있었다.');
  assert.ok(texts(s).includes(SUNKEN_FIRST[0]) && texts(s).includes(SUNKEN_FIRST[1]));
  travel(s, 'floatgate'); travel(s, 'roofgate');
  assert.equal(s.log.filter((l) => l.text === SUNKEN_FIRST[0]).length, 1, '처음 한 번만');
  assert.equal(bodyView(s).breath, null, '지붕마을에서는 네 칸이다 (JD-F2)');
});

test('M19-3 지붕마을의 방 일곱과 사냥터 둘. 잠긴 거리에서 물먹은 문지기를 만난다 (JD-A2~A10)', () => {
  assert.deepEqual(TOWNS['지붕마을'].order, ['roofgate', 'belltop', 'guardpost', 'bronzeforge', 'divers', 'watershrine', 'boatinn']);
  for (const id of [...TOWNS['지붕마을'].order, 'sunkenstreet', 'palaceyard']) {
    const p = PLACES[id];
    assert.equal(p.band, 7, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  const want = {
    roofgate: ['둘러보기'], belltop: ['둘러보기', '기도'], guardpost: ['용병', '게시판'], bronzeforge: ['만들기', '상점', '고치기', '강화'],
    divers: ['상점', '바느질', '게시판'], watershrine: ['기도', '상점'], boatinn: ['방 빌리기', '보관함', '요리', '소문 게시판'],
    sunkenstreet: ['탐색', '캐기', '숨 쉬기', '공기 주머니'], palaceyard: ['탐색', '캐기', '숨 쉬기', '공기 주머니', '궁으로 들어간다'],
  };
  for (const [id, list] of Object.entries(want)) assert.deepEqual(labels(sunk(`at-${id}`, { at: id })), list, id);
  assert.deepEqual(labels(Object.assign(sunk('night', { at: 'roofgate' }), { phase: 2 })), ['둘러보기', '잠자기']);
  assert.equal(PLACES.divers.room, '벽마다 건져 올린 것들이 걸려 있다. 깨진 그릇, 녹슨 열쇠, 그리고 뚜껑이 열리지 않은 상자들.');
  assert.equal(PLACES.sunkenstreet.room, '기와지붕 아래로 내려서자 거리가 그대로 있다. 간판, 수레, 열린 문. 모든 것이 천천히 흔들린다.');
  assert.deepEqual([PLACES.sunkenstreet.levels, PLACES.palaceyard.levels, PLACES.sunkenstreet.under, PLACES.palaceyard.under], ['61~64', '65~68', true, true]);
  assert.deepEqual(WILDS.sunkenstreet.monsters.map((m) => m.id), ['soakedgate', 'scalehound']);
  assert.deepEqual(WILDS.palaceyard.monsters.map((m) => m.id), ['belljelly', 'sunkenguard']);
  assert.deepEqual([MONSTERS.soakedgate.level, MONSTERS.scalehound.level, MONSTERS.belljelly.level, MONSTERS.sunkenguard.level], [61, 63, 66, 68]);
  // 잠긴 거리에서 탐색하면 문지기나 사냥개를 만난다
  const s = sunk('meet', { at: 'sunkenstreet' });
  for (let i = 0; i < 80 && !(s.dex.mon.soakedgate?.seen); i++) { s.sunken.breath = 20; s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'explore' }); settle(s); }
  assert.ok(s.dex.mon.soakedgate.seen > 0);
  // 캐면 옛 청동과 비늘 가죽이 나온다
  for (let i = 0; i < 60; i++) { s.sunken.breath = 20; s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'dig' }); settle(s); }
  assert.ok(count(s, 'oldbronze') > 0);
});

test('M19-3 청동 대장간·잠수꾼 조합·물가 사당의 가게, 뱃집 주막(방 210), 게시판 둘, 지붕마을 사람들. 근위병의 창을 지으면 대장 8단계가 열린다 (JD-A4~A8, JD-G6, LV-F7)', () => {
  const names = (at) => shopView(sunk(`shop-${at}`, { at })).goods.map((g) => g.name);
  assert.ok(names('bronzeforge').includes('옛 청동 덩이'));
  assert.ok(names('divers').includes('공기 주머니') && names('divers').includes('비늘 가죽'));
  assert.ok(names('watershrine').includes('깊은 성수'));
  assert.deepEqual([ITEMS.airbag.price, ITEMS.deepholy.price, COMPANIONS.parang.fee], [120, 130, 250]);
  const inn = sunk('inn', { at: 'boatinn' });
  assert.equal(roomFee(inn), 210);
  assert.ok(PLACES.boatinn.storage && PLACES.boatinn.kitchen);
  // 깊은 성수는 지금 성수보다 센 가호를 건다
  const h = sunk('holy');
  give(h, 'deepholy', 1);
  dispatch(h, { type: 'use', index: h.bag.findIndex((x) => x.id === 'deepholy') });
  assert.equal(h.buffs.grace.power, 0.09);
  // 게시판 둘: 근위 막사는 사냥, 잠수꾼 조합은 건져 오는 일
  for (const [at, place, n] of [['guard', 'guardpost', 4], ['divers', 'divers', 3]]) {
    const b = sunk(`board-${at}`, { at: place });
    const ids = Object.entries(BOARD).filter(([, d]) => d.at === at).map(([id]) => id);
    assert.equal(ids.length, n, at);
    assert.ok(boardView(b).length > 0 && boardView(b).every((c) => ids.includes(c.id)));
    for (const id of ids) { const d = BOARD[id]; assert.ok(d.minLevel >= 61, id); if (d.kind === 'bring') assert.ok(d.silver < ITEMS[d.item].price * d.n, id); }
  }
  // 지붕마을 사람 여덟
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '지붕마을');
  assert.equal(here.length, 8);
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
  assert.deepEqual([PEOPLE.hanbyeol.name, PEOPLE.parang.name], ['조합장 한별', '창잡이 파랑']);
  // 근위 막사의 용병 셋 (JD-C1)
  const g = sunk('merc', { at: 'guardpost' });
  assert.ok(PLACES.guardpost.merc && PLACES.guardpost.band === 7);
  assert.deepEqual(mercView(g).map((m) => [m.name, m.fee, m.hp]), [['창잡이 파랑', 250, 1400], ['활잡이 이랑', 250, 1100], ['방패잡이 너울', 250, 2000]]);
  g.silver = 1000;
  dispatch(g, { type: 'party', op: 'hire', id: 'parang' });
  dispatch(g, { type: 'party', op: 'hire', id: 'neoul' });
  assert.equal(g.silver, 500);
  assert.throws(() => dispatch(g, { type: 'party', op: 'hire', id: 'irang' }), /2명까지/);
  g.dex.places.training = true; g.dex.places.floatinn = true;
  assert.deepEqual(mercElsewhere(g).map((x) => x.why), ['여기까지 따라오지 않는다', '여기까지 따라오지 않는다']);
  const far = sunk('far', { at: 'floatinn' });
  far.silver = 1000;
  assert.throws(() => dispatch(far, { type: 'party', op: 'hire', id: 'parang' }), /근위 막사에서 구합니다/);
  // 조합장 한별과 처음 만난다 (JD-D1)
  const d = sunk('hanbyeol');
  walk(d, 'divers');
  for (const [, text] of HANBYEOL_FIRST) assert.ok(texts(d).includes(text));
  assert.equal(HANBYEOL_FIRST[3][1], '임금의 하사품이야. 그냥 가지라고 둔 거. 열면 좋은 게 나와. …우린 안 열어.');
  walk(d, 'roofgate'); walk(d, 'divers');
  assert.equal(d.log.filter((l) => l.text === HANBYEOL_FIRST[0][1]).length, 1);
  // 승급작: 근위병의 창
  const c = sunk('promo', { at: 'bronzeforge' });
  c.craftLv.smith = { lv: 27, xp: 0 }; c.craftTier.smith = 7;
  assert.equal(RECIPES.oldbronze_sword.name, '근위병의 창');
  make(c, 'oldbronze_sword');
  assert.equal(c.craftTier.smith, 8);
  // 공기 주머니는 비늘 가죽 둘로 직접 꿰맨다 (JD-B3)
  const w = sunk('sew', { at: 'divers' });
  w.craftLv.sew = { lv: 25, xp: 0 }; w.craftTier.sew = 7;
  assert.deepEqual(RECIPES.airbag.needs, [{ id: 'scalehide', n: 2 }]);
  make(w, 'airbag');
  assert.equal(count(w, 'airbag'), 1);
  assert.ok(w.bag.find((x) => x.id === 'airbag').grade === 0 && !w.bag.find((x) => x.id === 'airbag').maker);
  // 가 본 뒤에야 생기는 도움말 줄
  const before = JSON.stringify(HELP.map((t) => helpBody(t, { marsh: true, shop: true })));
  assert.ok(!/숨 쉬기|막힌 숨|짝을 지어|공기 주머니/.test(before));
  const after = JSON.stringify(HELP.map((t) => helpBody(t, { sunken: true })));
  assert.ok(/숨 쉬기/.test(after) && /막힌 숨/.test(after) && /짝을 지어/.test(after) && !/덤비는 것은 용병이 맡습니다/.test(after));
});

// ── M19-4 숨 (JD-B1~B3, JD-F2) ──
test('M19-4 물 아래에서 한 번 움직일 때마다, 싸움의 한 턴마다 숨이 하나씩 준다. 스무 번이 가득이다 (JD-B3)', () => {
  assert.deepEqual([SUNKEN.max, SUNKEN.choke, SUNKEN.bagAir, SUNKEN.perGear, SUNKEN.dive], [20, 0.05, 10, 2, 5]);
  const s = sunk('breath', { at: 'sunkenstreet' });
  assert.deepEqual(bodyView(s).breath, { n: 20, max: 20, choke: false, tag: null });
  // 캐기 한 번에 하나(덤비는 것이 없던 번)
  let checked = 0;
  for (let i = 0; i < 12 && checked < 3; i++) {
    s.sunken.breath = 20; tend(s); s.tick = 0; s.phase = 0;
    const ev = dispatch(s, { type: 'act', id: 'dig' });
    if (!s.battle && !ev.some((e) => e.type === 'escort')) { assert.equal(bodyView(s).breath.n, 19); checked++; }
    settle(s);
  }
  assert.equal(checked, 3);
  // 싸움의 한 턴에도 하나
  s.sunken.breath = 20; tend(s);
  startBattle(s, [], 'soakedgate');
  dispatch(s, { type: 'battle', choice: 'attack' });
  assert.equal(bodyView(s).breath.n, 19);
  dispatch(s, { type: 'battle', choice: 'defend' });
  assert.equal(bodyView(s).breath.n, 18);
  // 스무 번 움직이면 다한다
  const m = sunk('twenty', { at: 'sunkenstreet' });
  for (let i = 0; i < 19; i++) breathMove(m, []);
  assert.equal(bodyView(m).breath.n, 1);
  const ev = [];
  breathMove(m, ev);
  assert.deepEqual([bodyView(m).breath.n, bodyView(m).breath.choke, bodyView(m).breath.tag.name, bodyView(m).breath.tag.text], [0, true, '막힌 숨', '움직일 때마다 생명력이 깎인다']);
  assert.ok(m.log.some((l) => l.text === '숨이 다했다. 가슴이 탄다.') && ev.some((e) => e.type === 'breath'));
});

test('M19-4 막힌 숨: 움직일 때마다 최대 생명력의 5%가 깎인다. 싸움 밖에서 바닥나면 쓰러진다 (JD-B2, JD-B3)', () => {
  const s = sunk('choke', { at: 'palaceyard' });
  const max = valueOf(s, 'maxHp');
  s.sunken.breath = 0;
  breathMove(s, []);
  assert.equal(s.hp, max - Math.round(max * 0.05));
  assert.ok(s.log.at(-1).text === `숨이 다했다. 가슴이 탄다. 생명력 −${Math.round(max * 0.05)}.`);
  // 싸우는 중에는 숨만으로 끊어지지 않는다
  startBattle(s, [], 'belljelly');
  s.hp = 3; breathMove(s, []);
  assert.equal(s.hp, 1);
  s.battle = null; s.status = [];
  // 싸움 밖에서 바닥나면 쓰러지고, 깨어나면 숨이 가득하다
  s.hp = 5; s.sunken.breath = 0; s.tick = 0; s.phase = 0; s.full = 80; s.tired = 0;
  let ev = [];
  for (let i = 0; i < 6 && !ev.some((e) => e.type === 'fall'); i++) { s.battle = null; s.choice = null; s.hp = Math.min(s.hp, 5); ev = dispatch(s, { type: 'act', id: 'dig' }); }
  assert.ok(ev.some((e) => e.type === 'fall' && e.info?.choked !== false));
  assert.equal(SUNKEN_LINES.fall, '숨이 끊어졌다. 몸이 물 위로 떠올랐다.');
  assert.ok(!underwater(s) && !s.flags.choked);
  assert.equal(s.sunken.breath, breathMax(s));
});

test('M19-4 숨 쉬기는 선창으로 돌아와 숨을 채운다. 싸우는 중에는 못 한다. 다시 내려가는 데 다섯 번 움직인 만큼의 때가 든다 (JD-B2, JD-B3)', () => {
  const s = sunk('surface', { at: 'sunkenstreet' });
  s.sunken.breath = 3;
  startBattle(s, [], 'soakedgate');
  assert.throws(() => dispatch(s, { type: 'act', id: 'surface' }), /싸우는 중/);
  s.battle = null; s.status = [];
  s.sunken.breath = 0;
  dispatch(s, { type: 'act', id: 'surface' });
  assert.equal(s.place, 'roofgate');
  assert.ok(texts(s).includes('물 위로 솟구쳤다. 숨이 돌아왔다.') && texts(s).includes('젖은 채로 널 위에 엎드렸다.'));
  assert.equal(bodyView(s).breath, null);
  assert.equal(s.sunken.breath, 20);
  assert.throws(() => dispatch(s, { type: 'act', id: 'surface' }), /할 수 없는 일/);
  // 다시 내려간다: 다섯 번 움직인 만큼
  const t0 = s.day * 150 + s.phase * 50 + s.tick;
  dispatch(s, { type: 'travel', to: 'sunkenstreet' });
  assert.equal(s.place, 'sunkenstreet');
  assert.equal(s.day * 150 + s.phase * 50 + s.tick - t0, 5);
  // 뜬마을에서 곧장 내려가면 반나절이다
  const f = sunk('far2', { at: 'floatgate' });
  const t1 = f.day * 150 + f.phase * 50 + f.tick;
  dispatch(f, { type: 'travel', to: 'sunkenstreet' });
  assert.equal(f.day * 150 + f.phase * 50 + f.tick - t1, 25);
});

test('M19-4 공기 주머니: 물 아래에서 숨 +10. 싸우는 중에도 쓴다(한 턴). 물 위에서는 못 쓴다 (JD-B3)', () => {
  const s = sunk('bag', { at: 'sunkenstreet' });
  assert.ok(slots(s).find((x) => x.label === '공기 주머니').disabled, '없으면 꺼져 있다');
  give(s, 'airbag', 3);
  assert.equal(slots(s).find((x) => x.label === '공기 주머니').why, '숨이 가득하다');
  assert.throws(() => dispatch(s, { type: 'act', id: 'airbag' }), /숨이 가득합니다/);
  s.sunken.breath = 5;
  assert.equal(slots(s).find((x) => x.label === '공기 주머니').sub, '가방에 3개');
  dispatch(s, { type: 'act', id: 'airbag' });
  assert.deepEqual([bodyView(s).breath.n, count(s, 'airbag')], [15, 2]);
  s.sunken.breath = 15; dispatch(s, { type: 'act', id: 'airbag' });
  assert.equal(bodyView(s).breath.n, 20, '가득을 넘지 않는다');
  // 싸우는 중: 가방에서 쓰고 한 턴이 간다
  s.sunken.breath = 5;
  startBattle(s, [], 'soakedgate');
  tend(s);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'airbag') });
  assert.deepEqual([bodyView(s).breath.n, count(s, 'airbag')], [14, 0]);
  assert.ok(texts(s).includes('공기 주머니를 물었다. 숨 +10.'));
  // 물 위에서는 쓰지 못하고, 없어지지도 않는다
  const t = sunk('dry');
  give(t, 'airbag', 1);
  assert.throws(() => dispatch(t, { type: 'use', index: t.bag.findIndex((x) => x.id === 'airbag') }), /물 아래에서/);
  assert.equal(count(t, 'airbag'), 1);
});

test('M19-4 비늘 가죽 장비 하나마다 숨 +2. 물 위에서는 칸도 이름표도 없다 (JD-B3, JD-F2)', () => {
  const s = sunk('gear', { at: 'sunkenstreet' });
  assert.equal(breathMax(s), 20);
  const put = (slot, id) => { s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
  put('hand', 'oldbronze_gloves');
  assert.equal(breathMax(s), 22);
  put('feet', 'oldbronze_boots');
  assert.equal(breathMax(s), 24);
  put('head', 'oldbronze_helm'); put('body', 'oldbronze_armor');
  assert.equal(breathMax(s), 24, '청동으로 지은 것은 아니다');
  assert.deepEqual([ITEMS.oldbronze_gloves.name, ITEMS.oldbronze_boots.name], ['비늘 가죽 장갑', '비늘 가죽 장화']);
  put('hand', 'mossiron_gloves');
  assert.equal(breathMax(s), 22, '다른 구간의 가죽은 아니다');
  for (const id of TOWNS['지붕마을'].order) assert.equal(breathView(sunk(`dry-${id}`, { at: id })), null, id);
  assert.equal(breathView(rested('marsh', { at: 'mossfield' })), null);
  for (const id of ['sunkenstreet', 'palaceyard']) assert.ok(breathView(sunk(`wet-${id}`, { at: id })), id);
});

// ── M19-5 짝 (JD-B1, JD-B3, JD-G1) ──
test('M19-5 하나를 쓰러뜨리면 둘째가 곧바로 덤빈다. 경험치와 전리품은 둘 몫이고, 사이에 쉬거나 올라갈 수 없다 (JD-B3)', () => {
  const s = sunk('pair', { at: 'sunkenstreet' });
  startBattle(s, [], 'soakedgate');
  assert.ok(pairComes(s, s.battle));
  const ev = finish(s);
  assert.ok(ev.some((e) => e.type === 'battle' && e.phase === 'win'));
  assert.ok(s.battle && s.battle.second, '그 자리에서 둘째와의 싸움이 시작된다');
  assert.ok(texts(s).includes('물살이 갈라진다. 짝이 온다. 숨 돌릴 틈이 없다.'));
  assert.deepEqual([s.battle.turn, s.battle.hp, enemyView(s).maxHp], [1, enemyView(s).maxHp, enemyView(s).maxHp], '둘째는 멀쩡한 채로, 제 첫 턴부터');
  assert.throws(() => dispatch(s, { type: 'act', id: 'surface' }), /싸우는 중/);
  assert.throws(() => dispatch(s, { type: 'act', id: 'dig' }), /싸우는 중/);
  assert.ok(!pairComes(s, s.battle), '둘째 뒤에는 더 오지 않는다');
  finish(s);
  assert.equal(s.battle, null);
  assert.equal(s.dex.mon.soakedgate.won, 2);
  assert.equal(s.log.filter((l) => l.text.startsWith(`얻은 것: 경험치 ${MONSTERS.soakedgate.xp}`)).length, 2);
});

test('M19-5 막는 이가 있으면 둘째가 생명력 절반으로 덤빈다. 때리는 이만 있으면 그대로다 (JD-B1, JD-B3)', () => {
  const s = withMercs(sunk('half', { at: 'sunkenstreet' }), 'neoul');
  startBattle(s, [], 'scalehound');
  finish(s);
  assert.ok(s.battle.second);
  assert.equal(s.battle.hp, Math.ceil(enemyView(s).maxHp / 2));
  assert.ok(texts(s).includes('너울이 방패로 둘째를 막아섰다. 둘째는 생명력 절반으로 덤빈다.'));
  const p = withMercs(sunk('full', { at: 'sunkenstreet' }), 'parang');
  startBattle(p, [], 'scalehound');
  finish(p);
  assert.equal(p.battle.hp, enemyView(p).maxHp, '첫째를 쓰러뜨린 턴에 동료가 둘째를 치지도 않는다');
  assert.equal(p.battle.turn, 1);
});

test('M19-5 우두머리, 혼자 선 근위병, 다른 지역의 몬스터, 물 위의 싸움에는 짝이 없다 (JD-B3)', () => {
  const one = (mon, at, opt) => { const s = sunk(`one-${mon}-${at}`, { at }); startBattle(s, [], mon, opt); finish(s); return s.battle; };
  assert.equal(one('bellecho', 'palaceyard'), null, '우두머리');
  assert.equal(one('sunkenguard', 'palaceyard', { solo: true }), null, '자리를 지키는 근위병');
  assert.equal(one('mosstoad', 'sunkenstreet'), null, '다른 지역의 몬스터');
  assert.equal(one('soakedgate', 'roofgate'), null, '물 위');
  assert.equal(one('soakedgate', 'sunkenstreet', { hungry: true }), null, '굶주린 놈은 혼자 온다');
  assert.ok(one('sunkenguard', 'palaceyard'), '뜰의 근위병은 둘이다');
  const m = rested('else', { at: 'mossfield' });
  startBattle(m, [], 'mosstoad'); finish(m);
  assert.equal(m.battle, null, '안개늪은 그대로다');
});

// ── M19-6 호위받는 채집 (JD-C2, JD-C4~C6, JD-F3) ──
test('M19-6 용병 둘이 다 있으면 캐는 동안 덤비는 것을 용병이 맡는다. 경험치 절반, 전리품 그대로, 용병이 다친다 (JD-C4, JD-C5)', () => {
  const s = withMercs(sunk('escort', { at: 'sunkenstreet' }), 'parang', 'neoul');
  assert.ok(escorts(s));
  assert.ok(!JSON.stringify(slots(s)).includes('호위받는 중'), '처음 겪기 전에는 칸에도 적히지 않는다 (JD-F3)');
  let n = 0;
  const lvl = s.level; s.xp = 0;
  for (let i = 0; i < 300 && n < 2; i++) {
    for (const c of s.party) c.hp = COMPANIONS[c.id].hp;
    s.sunken.breath = 20; tend(s); s.tick = 0; s.phase = 0;
    const ev = dispatch(s, { type: 'act', id: 'dig' });
    assert.equal(s.battle, null, '나는 싸우지 않는다');
    if (!ev.some((e) => e.type === 'escort')) continue;
    n++;
    for (const c of s.party) { const lost = 1 - c.hp / COMPANIONS[c.id].hp; assert.ok(lost >= 0.149 && lost <= 0.301, `${c.id} ${lost}`); }
  }
  assert.equal(n, 2);
  assert.ok(s.flags.sawEscort);
  assert.equal(s.log.filter((l) => l.text === SUNKEN_LINES.escortFirst).length <= 1, true, '처음 한 번만 알린다');
  assert.ok(texts(s).match(/파랑과 너울이 앞을 막았다\. "캐시오\. 여긴 우리가\."/));
  assert.ok(texts(s).match(/파랑과 너울이 (물먹은 문지기|비늘 사냥개) 둘을 물리쳤다\. 경험치 \+[\d,]+ \(절반\)\./));
  assert.equal(slots(s).find((x) => x.label === '캐기').sub, '호위받는 중');
  // 경험치는 둘 몫의 절반이다
  const line = s.log.filter((l) => /둘을 물리쳤다/.test(l.text)).at(-1).text;
  const mon = /물먹은 문지기/.test(line) ? 'soakedgate' : 'scalehound';
  assert.ok(line.includes(`경험치 +${MONSTERS[mon].xp.toLocaleString('en-US')} (절반)`));
  assert.ok(s.level > lvl || s.xp > 0);
  assert.ok(/덤비는 것은 용병이 맡습니다/.test(JSON.stringify(HELP.map((t) => helpBody(t, { escort: true })))));
});

test('M19-6 용병이 하나뿐이거나 쓰러져 있으면 호위받지 못한다. 쓰러진 용병은 그날 못 쓰고, 자면 낫는다 (JD-C4, JD-C5)', () => {
  const one = withMercs(sunk('one', { at: 'sunkenstreet' }), 'parang');
  assert.equal(escorts(one), null);
  let fought = false;
  for (let i = 0; i < 200 && !fought; i++) { one.sunken.breath = 20; tend(one); one.tick = 0; one.phase = 0; const ev = dispatch(one, { type: 'act', id: 'dig' }); assert.ok(!ev.some((e) => e.type === 'escort')); fought = !!one.battle; settle(one); }
  assert.ok(fought, '덤비는 것은 내 몫이다');
  assert.ok(!one.flags.sawEscort);
  // 호위 싸움에서 쓰러지면 그날은 못 쓴다
  const s = withMercs(sunk('down', { at: 'sunkenstreet' }), 'parang', 'neoul');
  let out = false;
  for (let i = 0; i < 400 && !out; i++) {
    s.party[0].hp = 10; s.party[1].hp = 2000;
    s.sunken.breath = 20; tend(s); s.tick = 0; s.phase = 0;
    dispatch(s, { type: 'act', id: 'dig' });
    out = s.party[0].out === s.day;
  }
  assert.ok(out);
  assert.ok(texts(s).includes('파랑이 쓰러졌다. 오늘은 더 못 쓴다'));
  assert.equal(escorts(s), null);
  assert.ok(!slots(s).find((x) => x.label === '캐기').sub);
  startBattle(s, [], 'soakedgate');
  const before = s.battle.hp;
  s.battle.hp = 99999; dispatch(s, { type: 'battle', choice: 'defend' });
  assert.ok(!texts(s).includes('파랑이 쳤다'), '쓰러진 날에는 싸움에도 끼지 못한다');
  s.battle = null; s.status = []; void before;
  partyRest(s);
  assert.ok(escorts(s) && s.party[0].hp === 1400 && s.party[0].out === undefined);
  // 다른 지역에서는 캐는 동안 덤비지 않는다
  const m = rested('else2', { at: 'mossfield' });
  m.marsh.lamp = 60;
  for (let i = 0; i < 80; i++) { tend(m); m.tick = 0; m.phase = 0; dispatch(m, { type: 'act', id: 'dig' }); assert.equal(m.battle, null); }
});

// ── M19-7 견습 둘째 자리 (AN-C8, AN-F4, LV-K2) ──
test('M19-7 레벨 61부터 견습을 하나 더 둔다. 그 전에는 둘째 자리가 어디에도 나오지 않는다 (AN-C8, AN-F4)', () => {
  const s = master('second', { at: 'floatinn' });
  assert.equal(SHOP.second, 61);
  s.level = 60;
  assert.deepEqual([seatsOf(s), workshopView(s).seats, labels(s).includes('견습')], [1, 1, false]);
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'hire' }), /자리가 찼습니다/);
  s.level = 61;
  assert.equal(workshopView(s).seats, 2);
  const slot = slots(s).find((x) => x.label === '견습');
  assert.ok(slot.sub.includes('소라') && slot.confirm.includes(PEOPLE.sora.story));
  const silver = s.silver;
  dispatch(s, slot.action);
  assert.equal(s.silver, silver - 100);
  assert.deepEqual([s.shop.hand.id, s.shop.hand2.id], ['bori', 'sora']);
  assert.ok(!labels(s).includes('견습'), '둘이 찼으면 칸이 없다');
  const v = workshopView(s);
  assert.deepEqual([v.hands, v.seats, v.list.map((x) => x.name)], [2, 2, ['보리', '소라']]);
  // 둘이 저마다 맡은 일을 한다
  s.place = 'emptyshop';
  dispatch(s, { type: 'workshop', op: 'job', who: 'bori', job: { kind: 'gather', item: 'saltsteel' } });
  dispatch(s, { type: 'workshop', op: 'job', who: 'sora', job: { kind: 'gather', item: 'frostiron' } });
  assert.deepEqual(workshopView(s).list.map((x) => x.job), ['소금강 덩이 모으기', '서릿쇠 덩이 모으기']);
  work(s, 10);
  const shelf = Object.fromEntries(s.shop.shelf.map((x) => [x.id, x.n]));
  assert.deepEqual([shelf.saltsteel, shelf.frostiron], [1, 1]);
  // 저마다 삯을 받는다. 못 받은 사람만 떠난다
  s.silver = 150; s.place = 'floatgate';
  const day = s.day;
  while (s.day === day) passPhase(s);
  assert.deepEqual([s.shop.hand?.id, s.shop.hand2], ['bori', null]);
  assert.equal(s.silver, 50);
  // 둘 가운데 더 익은 손으로 9장의 길을 센다
  s.shop.hand2 = { id: 'sora', pts: 70, job: null, work: 0, idle: false, paidDay: s.day };
  assert.equal(stageNow(s), 5);
  // 저장해도 둘 다 그대로다. 다시 태어나면 둘 다 떠난다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.equal(back.shop.hand2.id, 'sora');
  assert.deepEqual([shopCarry(s).hand, shopCarry(s).hand2], [null, null]);
});

// ── M19-8 던전 잠긴 궁과 임금의 하사품 (JD-A11, JD-F4, JD-G5) ──
test('M19-8 잠긴 궁 다섯 전각. 메아리는 보통 몬스터의 생명력 4배·공격력 1.25배이고, 궁 안도 물 아래다 (JD-A11, LV-I3)', () => {
  const d = DUNGEONS.sunkenpalace;
  assert.deepEqual([d.name, d.from, d.under, d.floors.length], ['잠긴 궁', 'palaceyard', true, 5]);
  assert.deepEqual(Object.entries(d.rooms).filter(([, r]) => r.post).map(([id]) => id), POSTS);
  for (const id of POSTS) assert.equal(d.rooms[id].mon, 'sunkenguard');
  for (const r of Object.values(d.rooms)) { assert.ok(r.text && r.name); for (const x of r.exits) assert.ok(d.rooms[x].exits.includes(Object.keys(d.rooms).find((k) => d.rooms[k] === r))); }
  const n = normalAt(70), b = MONSTERS.bellecho;
  assert.deepEqual([b.name, b.level, b.hp, b.attack, b.boss], ['늘 울리던 종의 메아리', 70, n.hp * 4, Math.round(n.attack * 1.25), true]);
  const s = sunk('palace', { at: 'palaceyard' });
  dispatch(s, slots(s).find((x) => x.label === '궁으로 들어간다').action);
  assert.ok(underwater(s) && bodyView(s).breath);
  const before = bodyView(s).breath.n;
  dispatch(s, { type: 'room', to: 's1-post' });
  assert.equal(bodyView(s).breath.n, before - 1, '궁 안에서도 움직일 때마다 숨이 준다');
  assert.equal(s.choice.kind, 'post');
});

test('M19-8 근위병 앞에서: 교대를 알리거나, 쓰러뜨리거나, 물러난다. 자리를 지키는 근위병에게는 짝이 없다 (JD-D)', () => {
  const s = inPalace(sunk('post'), 's1-gate');
  dispatch(s, { type: 'room', to: 's1-post' });
  assert.deepEqual(slots(s).map((x) => x.label.replace(/ \(.*/, '')), ['교대를 알린다', '쓰러뜨린다', '돌아간다']);
  assert.throws(() => dispatch(s, { type: 'room', to: 's2-hall' }), /정해야|넘어야/);
  dispatch(s, { type: 'choose', id: 'fight' });
  assert.ok(s.battle.solo);
  finish(s);
  assert.equal(s.battle, null, '혼자 선 근위병이다');
  // 회랑의 해파리는 짝이다. 둘째까지 쓰러뜨려야 방이 빈다
  dispatch(s, { type: 'room', to: 's2-hall' });
  assert.equal(s.battle.mon, 'belljelly');
  finish(s);
  assert.ok(s.battle.second);
  assert.throws(() => dispatch(s, { type: 'room', to: 's2-post' }), /싸우는 중/);
  finish(s);
  tend(s); s.sunken.breath = 20;
  dispatch(s, { type: 'room', to: 's2-post' });
  assert.equal(s.choice.kind, 'post');
  // 교대를 알린다: 설득 판정. 고집 15
  assert.equal(relieveChance(sunk('plain')), 0.25);
  let ok = null, bad = null;
  for (let i = 0; i < 40 && !(ok && bad); i++) {
    const t = inPalace(sunk(`rel-${i}`), 's1-gate');
    t.hidden.charm = { value: i % 2 ? 0 : 12 };
    dispatch(t, { type: 'room', to: 's1-post' });
    dispatch(t, { type: 'choose', id: 'relieve' });
    if (t.dmem.sunkenpalace.done['s1-post']) ok = ok || t; else bad = bad || t;
  }
  assert.ok(ok && bad);
  assert.deepEqual([relievedPosts(ok), ok.battle, ok.choice], [1, null, null]);
  assert.ok(texts(ok).includes('"교대요. 내려와도 되오. 임금은 없고, 지킬 문도 없소."') && texts(ok).includes('교대를 알린 근위병 1 / 5.'));
  // 알린 자리는 다시 서지 않는다(나갔다 와도)
  dispatch(ok, { type: 'room', to: 's1-gate' });
  dispatch(ok, { type: 'dungeon', op: 'leave' });
  ok.sunken.breath = 20;
  dispatch(ok, { type: 'dungeon', op: 'enter', id: 'sunkenpalace' });
  dispatch(ok, { type: 'room', to: 's1-post' });
  assert.deepEqual([ok.choice, ok.battle], [null, null]);
  // 통하지 않으면 근위병이 먼저 친다
  assert.ok(bad.battle && bad.battle.solo);
  assert.ok(texts(bad).includes('근위병은 듣지 않는다. 검을 뽑는다. 맹세가 귀보다 깊다.') && texts(bad).includes('기척을 놓쳤다. 적이 먼저 움직인다.'));
});

test('M19-8 공기 고인 다락에서 쉬면 숨이 찬다. 문지방에서는 숨 쉬러 올라간다. 궁 안에서도 공기 주머니를 문다 (JD-A11)', () => {
  const s = inPalace(sunk('air'), 's2-air');
  s.sunken.breath = 3; s.hp = 100;
  dispatch(s, { type: 'dungeon', op: 'rest' });
  assert.equal(bodyView(s).breath.n, 20);
  assert.ok(texts(s).includes('숨이 가득 찼다.') && s.hp > 100);
  assert.throws(() => dispatch(s, { type: 'surface' }), /들어온 곳/);
  give(s, 'airbag', 1);
  s.sunken.breath = 6;
  assert.equal(slots(s).find((x) => x.label === '공기 주머니').sub, '가방에 1개');
  dispatch(s, { type: 'airbag' });
  assert.deepEqual([bodyView(s).breath.n, count(s, 'airbag')], [16, 0]);
  const g = inPalace(sunk('gate'), 's1-gate');
  g.sunken.breath = 2;
  assert.ok(labels(g).includes('숨 쉬기') && labels(g).includes('밖으로 나간다'));
  dispatch(g, { type: 'surface' });
  assert.deepEqual([g.place, g.dungeon, g.sunken.breath], ['roofgate', null, 20]);
  // 숨이 다한 채 궁 안을 헤매면 쓰러진다
  const c = inPalace(sunk('lost'), 's1-post', { relieved: ['s1-post'] });
  c.sunken.breath = 0; c.hp = 5;
  const ev = dispatch(c, { type: 'room', to: 's1-gate' });
  assert.ok(ev.some((e) => e.type === 'fall') && c.dungeon === null);
});

test('M19-8 임금의 하사품: 상자는 보이고 열 수 있다. 열면 좋은 것이 나오고 메아리가 5%씩 세진다. 그것은 어디에도 나오지 않는다 (JD-F4, JD-G5)', () => {
  assert.deepEqual(SUNKEN.boxes, { sunkenstreet: 4, palaceyard: 4, vault: 3 });
  const s = inPalace(sunk('vault'), 's3-vault');
  assert.equal(slots(s)[0].label, '상자를 연다');
  for (let i = 0; i < 3; i++) dispatch(s, { type: 'chest' });
  const gifts = s.bag.filter((x) => ITEMS[x.id].kind === 'gear');
  assert.equal(gifts.length, 3);
  for (const g of gifts) assert.ok(ITEMS[g.id].tier === 7 && g.grade >= 2 && !g.maker, `${g.id} ${g.grade}`);
  assert.ok(!labels(s).includes('상자를 연다'), '다 열면 칸이 없다');
  assert.throws(() => dispatch(s, { type: 'chest' }), /남아 있지 않습니다/);
  assert.equal(chestsOpened(s), 3);
  // 들판의 상자: 사건으로 만난다. 열 수도, 지나갈 수도 있다. 곳마다 넷뿐이다
  const f = sunk('field', { at: 'sunkenstreet' });
  assert.ok(INCIDENTS.sunkenstreet.some((x) => x.chest) && INCIDENTS.palaceyard.some((x) => x.chest));
  f.choice = { kind: 'incident', id: 'chest', place: 'sunkenstreet' };
  assert.deepEqual(slots(f).map((x) => x.label), ['상자를 연다', '지나간다']);
  dispatch(f, { type: 'choose', id: 'leave' });
  assert.equal(chestsOpened(f), 0);
  for (let i = 0; i < 4; i++) { f.sunken.breath = 20; f.choice = { kind: 'incident', id: 'chest', place: 'sunkenstreet' }; dispatch(f, { type: 'choose', id: 'open' }); }
  assert.deepEqual([chestsOpened(f), chestsLeft(f, 'sunkenstreet')], [4, 0]);
  assert.ok(texts(f).includes('임금의 하사품: ') && texts(f).includes('"받아라. 아무것도 하지 않아도 된다."'));
  let again = 0;
  for (let i = 0; i < 150; i++) { f.sunken.breath = 20; tend(f); f.tick = 0; f.phase = 0; f.battle = null; f.status = []; f.choice = null; dispatch(f, { type: 'act', id: 'explore' }); if (f.choice?.kind === 'incident' && f.choice.id === 'chest') again++; }
  assert.equal(again, 0, '다 연 곳에는 상자가 더 나오지 않는다');
  // 연 상자만큼 메아리가 세다
  const base = MONSTERS.bellecho;
  const boss = (t) => { t.day = 1; startBattle(t, [], 'bellecho'); return [enemyView(t).maxHp, t.battle.gift]; };
  assert.deepEqual(boss(sunk('clean', { at: 'palaceyard' })), [base.hp, undefined]);
  assert.equal(giftBoost(s), 1.15);
  assert.deepEqual(boss(s), [Math.round(base.hp * 1.15), 1.15]);
  assert.equal(boss(f)[0], Math.round(base.hp * 1.2));
  // 그것은 화면 어디에도 나오지 않는다
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, ALL_HELP)), hiddenView(s), hiddenSlots(s), questBook(s), mainView(s), slots(s), bodyView(s), { ...enemyView(s), hp: 0, maxHp: 0 }, mapView(s)]);
  assert.ok(!/하사품|메아리가 세|세진다|gift|상자를 열/.test(shown));
});

// ── M19-9 10장 늘 울리던 종 (JD-D, LV-D10) ──
test('M19-9 퀘스트 창: 10장의 글과 푸는 길 셋. 부르는 이름이 다르다 (JD-D)', () => {
  const v = mainView(sunk('main'));
  assert.equal(v.name, '늘 울리던 종');
  assert.equal(v.text, '이 도성의 임금은 백성을 아꼈다. 그래서 종에게 시켰다. 누구에게나, 날마다, 무엇을 하든 울라고. 아침에 눈만 떠도 띠링이 왔다. 석 달 만에 종이 터졌고, 터진 자리로 물이 들어왔다. 물 아래에서는 아직도 그 메아리가 운다. 아무에게나, 끝없이.');
  assert.deepEqual(v.paths.map((p) => [p.name, p.text]), [['잠재우는 길', '잠긴 궁 맨 안쪽의 메아리를 쓰러뜨린다'], ['다시 짓는 길', '옛 청동 덩이 이백과 근위병의 창(승급작)을 종루에 바친다'], ['풀어 주는 길', '가라앉은 근위병 다섯에게 교대를 알린다(설득 판정)']]);
  assert.equal(new Set(MAIN[10].paths.map((p) => p.called)).size, 3);
  assert.deepEqual(v.paths.map((p) => [p.have, p.need]), [[0, 1], [0, 201], [0, 5]]);
  // 물가 사당의 다시 태어나기는 이 도성의 일을 끝낸 사람에게만 (SB-E1)
  assert.ok(!labels(sunk('shrine', { at: 'watershrine' })).includes('다시 태어나기'));
  assert.ok(labels(quieted('shrine2', { at: 'watershrine' })).includes('다시 태어나기'));
});

test('M19-9 잠재우는 길: 메아리를 쓰러뜨리면 물속이 조용해진다. 구름다리로 오르는 길이 열린다 (JD-D3)', () => {
  const s = inPalace(sunk('quiet'), 's5-post', { relieved: ['s5-post'] });
  dispatch(s, { type: 'room', to: 's5-bell' });
  assert.equal(s.battle.mon, 'bellecho');
  finish(s);
  assert.equal(s.battle, null, '우두머리에게는 짝이 없다');
  assert.deepEqual([s.main.chapter, s.main.done.at(-1).path, s.main.called, s.dmem.sunkenpalace.keeper], [11, 'quiet', '메아리를 잠재운 이', 'beat']);
  assert.ok(s.log.some((l) => l.text === '메아리가 흩어지자 물속이 처음으로 조용해졌다. 너무 조용해서 내 숨소리가 들렸다. 위에서 누가 종루의 빈 고리를 한 번 쳤다. 띵. 그것으로 충분했다.'));
  assert.ok(s.opened.includes('cloudroad'));
  assert.ok(s.dings.some((d) => d.title.includes("10장 '늘 울리던 종'") && d.body.includes('구름다리로 오르는 길이 열렸습니다')));
  // 구름다리가 났다 (M20): 지도에 다릿목이 나오고, 퀘스트 창은 11장을 보여 준다(덧말은 걷었다)
  assert.ok(!mainView(s).text.includes(CLOUD_ROAD_SAY));
  assert.equal(mainView(s).name, MAIN[11].name);
  assert.ok(JSON.stringify(mapView(s)).includes('다릿목'));
});

test('M19-9 다시 짓는 길: 옛 청동 덩이 이백과 내 손으로 지은 근위병의 창을 종루에 바친다 (JD-D4)', () => {
  const s = sunk('rebuild', { at: 'belltop' });
  assert.deepEqual(labels(s), ['둘러보기', '기도'], '청동이 없으면 칸도 없다');
  give(s, 'oldbronze', 150);
  assert.equal(slots(s).find((x) => x.label === '청동을 바친다').sub, '0 / 200');
  dispatch(s, { type: 'bronze' });
  assert.deepEqual([s.sunken.bronze, count(s, 'oldbronze')], [150, 0]);
  assert.ok(slots(s).find((x) => x.label === '청동을 바친다').disabled);
  assert.throws(() => dispatch(s, { type: 'bronze' }), /옛 청동 덩이가 없습니다/);
  give(s, 'oldbronze', 80);
  dispatch(s, { type: 'bronze' });
  assert.deepEqual([s.sunken.bronze, count(s, 'oldbronze')], [200, 30]);
  assert.deepEqual(mainView(s).paths[1].have, 200);
  // 상자에서 나온 창으로는 안 된다. 내 손으로 지은 것이어야 한다
  s.bag.push({ id: 'oldbronze_sword', grade: 3, n: 1, dur: 220, max: 220 });
  let slot = slots(s).find((x) => x.label === '창을 바친다');
  assert.ok(slot.disabled && slot.why === '내 손으로 지은 근위병의 창이 없다');
  assert.throws(() => dispatch(s, { type: 'bronze' }), /내 손으로 지은 근위병의 창/);
  s.bag.push({ id: 'oldbronze_sword', grade: 0, n: 1, dur: 220, max: 220, maker: s.name });
  slot = slots(s).find((x) => x.label === '창을 바친다');
  assert.ok(!slot.disabled && slot.confirm.includes('돌아오지 않습니다') && slot.ask.yes === '바친다');
  dispatch(s, slot.action);
  assert.deepEqual([s.main.chapter, s.main.called], [11, '작은 종을 지은 이']);
  assert.ok(s.log.some((l) => l.text === '이백 번째 청동을 올리자 대장장이가 쇳물을 부었다. 작은 종이었다. 옛것의 반의반도 안 됐다. "이건 아무에게나 안 울어." 그가 말했다. "그래야 종이지."'));
  assert.deepEqual(s.bag.filter((x) => x.id === 'oldbronze_sword').map((x) => x.grade), [3], '내가 지은 것만 바쳤다');
  assert.ok(!labels(s).includes('창을 바친다') && !labels(s).includes('청동을 바친다'));
  // 다른 곳에서는 바치지 못한다
  const t = sunk('else3', { at: 'roofgate' }); give(t, 'oldbronze', 10);
  assert.throws(() => dispatch(t, { type: 'bronze' }), /종루 꼭대기/);
});

test('M19-9 풀어 주는 길: 근위병 다섯에게 교대를 알리면 메아리도 갈 데가 없다 (JD-D5)', () => {
  let done = null;
  for (let i = 0; i < 40 && !done; i++) {
    const s = inPalace(sunk(`five-${i}`), 's4-post', { relieved: POSTS.slice(0, 4) });
    s.hidden.charm = { value: 12 };
    assert.equal(mainView(s).paths[2].have, 4);
    dispatch(s, { type: 'room', to: 's5-post' });
    dispatch(s, { type: 'choose', id: 'relieve' });
    if (!s.battle) done = s;
  }
  assert.ok(done);
  assert.deepEqual([done.main.chapter, done.main.done.at(-1).path, done.main.called], [11, 'relieve', '교대를 알린 이']);
  assert.ok(done.log.some((l) => l.text === '다섯째 근위병이 검을 내렸다. 갑옷 안의 물이 빠져나갔다. "교대… 왔는가. 오래… 걸렸군." 물 아래의 띠링이 하나씩 꺼졌다. 지킬 것이 없어지자 메아리도 갈 데가 없었다.'));
  assert.ok(done.opened.includes('cloudroad'));
});

// ── M19-10 서브 둘과 히든 (JD-D6, JD-D7, LV-E7) ──
test('M19-10 서브 "젖은 족보": 잠긴 거리에서 캐다 보면 궤가 나온다. 다섯 권을 건져다 준다 (JD-D6)', () => {
  const s = sunk('ledger', { at: 'roofgate' });
  dispatch(s, { type: 'greet', npc: 'pierman' });
  assert.ok(offersOf(s, 'pierman').includes('wetledger'));
  // 받기 전에는 캐도 나오지 않는다
  const no = sunk('noledger', { at: 'sunkenstreet' });
  for (let i = 0; i < 60; i++) { no.sunken.breath = 20; tend(no); no.tick = 0; no.phase = 0; dispatch(no, { type: 'act', id: 'dig' }); settle(no); }
  assert.equal(count(no, 'wetledger'), 0);
  dispatch(s, { type: 'quest', op: 'accept', id: 'wetledger' });
  assert.equal(subView(s, 'wetledger').step.text, '잠긴 거리의 집 다섯 채에서 족보를 건져 온다. 캐기로 찾는다.');
  s.place = 'sunkenstreet';
  let digs = 0;
  while (count(s, 'wetledger') < 5 && digs++ < 300) { s.sunken.breath = 20; tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'act', id: 'dig' }); settle(s); }
  assert.equal(count(s, 'wetledger'), 5);
  for (let i = 0; i < 40; i++) { s.sunken.breath = 20; tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'act', id: 'dig' }); settle(s); }
  assert.equal(count(s, 'wetledger'), 5, '다섯 권까지');
  s.place = 'roofgate'; s.sunken.breath = 20;
  dispatch(s, { type: 'quest', op: 'choose', id: 'wetledger', choice: 'give' });
  assert.deepEqual([s.quests.wetledger.done, s.quests.wetledger.ending, count(s, 'wetledger')], [true, '다섯 집의 성을 찾아 주었다', 0]);
});

test('M19-10 서브 "근위병의 마지막 순찰": 밤에 파랑과 잠긴 거리를 예순 걸음 돈다. 숨을 세 번 채워야 하는 길이다 (JD-D7)', () => {
  const s = sunk('patrol', { at: 'guardpost' });
  dispatch(s, { type: 'greet', npc: 'parang' });
  assert.ok(offersOf(s, 'parang').includes('lastpatrol'));
  assert.ok(!JSON.stringify(slots(sunk('nopatrol', { at: 'sunkenstreet' }))).includes('순찰'), '받기 전에는 칸이 없다');
  dispatch(s, { type: 'quest', op: 'accept', id: 'lastpatrol' });
  s.place = 'sunkenstreet'; s.phase = 0;
  let slot = slots(s).find((x) => x.label === '순찰');
  assert.deepEqual([slot.sub, slot.disabled, slot.why], ['0 / 60', true, '밤에 돈다']);
  s.phase = 2;
  assert.equal(slots(s).find((x) => x.label === '순찰').why, '파랑이 곁에 있어야 한다');
  assert.throws(() => dispatch(s, { type: 'patrol' }), /파랑이 곁에/);
  withMercs(s, 'parang');
  let fills = 1; // 처음 내려설 때의 숨까지 센다
  for (let i = 0; i < 60; i++) {
    s.phase = 2; s.tick = 0; tend(s);
    if (bodyView(s).breath.n <= 0) { s.sunken.breath = 20; fills++; }
    dispatch(s, { type: 'patrol' });
    assert.equal(s.battle, null);
  }
  assert.equal(fills, 3, '숨을 세 번 채워야 하는 길이');
  assert.equal(ECHO.patrol, 60);
  assert.ok(texts(s).includes('길의 절반이다. 파랑이 멈추지 않고 말했다. "증조부는 여기까지였소."'));
  assert.equal(s.quests.lastpatrol.step, 'back');
  assert.ok(!labels(s).includes('순찰'), '다 돈 뒤에는 칸이 없다');
  s.place = 'guardpost'; s.sunken.breath = 20;
  dispatch(s, { type: 'quest', op: 'choose', id: 'lastpatrol', choice: 'done' });
  assert.deepEqual([s.quests.lastpatrol.done, s.quests.lastpatrol.ending], [true, '마지막 순찰을 끝까지 돌았다']);
});

test('M19-10 히든 "받지 않은 사람": 상자를 하나도 열지 않고 10장을 끝낸 사람이 물 위로 올라왔을 때. 조건은 화면과 도움말 어디에도 없다 (LV-E7)', () => {
  const s = inPalace(sunk('ungifted'), 's5-post', { relieved: ['s5-post'] });
  dispatch(s, { type: 'room', to: 's5-bell' });
  finish(s);
  assert.equal(s.main.chapter, 11);
  assert.equal(s.hq.ungifted, undefined, '물 아래에서는 아직이다');
  s.dungeon.room = 's1-gate'; tend(s); s.sunken.breath = 20;
  dispatch(s, { type: 'surface' });
  assert.equal(s.hq.ungifted.status, 'offered');
  assert.equal(s.choice.kind, 'hq');
  assert.ok(s.dings.at(-1).title.includes('받지 않은 사람'));
  dispatch(s, { type: 'choose', id: 'accept' });
  walk(s, 'divers');
  dispatch(s, { type: 'greet', npc: 'hanbyeol' });
  if (s.hq.ungifted.status !== 'done') talkTo(s, 'hanbyeol');
  assert.equal(s.hq.ungifted.status, 'done');
  assert.ok(texts(s).includes(HIDDENS.ungifted.done));
  // 하나라도 열었으면 나타나지 않는다
  const o = inPalace(sunk('gifted'), 's5-post', { relieved: ['s5-post'] });
  o.sunken.boxes.vault = 1;
  dispatch(o, { type: 'room', to: 's5-bell' });
  finish(o);
  o.dungeon.room = 's1-gate'; tend(o); o.sunken.breath = 20;
  dispatch(o, { type: 'surface' });
  walk(o, 'divers'); walk(o, 'roofgate');
  assert.deepEqual([o.main.chapter, o.hq.ungifted, o.choice], [11, undefined, null]);
  // 조건이 화면에 나오지 않는다
  const f = sunk('nohint', { at: 'sunkenstreet' });
  const shown = JSON.stringify([HELP, HELP_MORE, HELP.map((t) => helpBody(t, ALL_HELP)), hiddenView(f), hiddenSlots(f), questBook(f), mainView(f), slots(f), bodyView(f), mapView(f)]);
  assert.ok(!/받지 않은|ungifted|열지 않/.test(shown));
});

// ── 저장 판 (M19-11) ──
test('M19 17판 저장은 지금 판으로 올라온다: 숨은 가득 찬 채로, 상자는 하나도 열지 않은 채로. 공방에는 빈 둘째 자리가 생긴다 (저장 판)', () => {
  assert.ok(SAVE_VERSION >= 18);
  const s = master('v17', { at: 'floatinn' });
  const old = JSON.parse(JSON.stringify(s));
  delete old.sunken; delete old.shop.hand2; old.v = 17;
  const up = parseSave(JSON.stringify({ v: 17, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.deepEqual(up.sunken, { breath: 20, boxes: {}, bronze: 0 });
  assert.deepEqual([up.shop.hand.id, up.shop.hand2], ['bori', null]);
  // 지금 판의 저장도 그대로 읽힌다(숨이 닳은 채로도, 상자를 연 채로도, 용병이 쓰러진 날에도)
  const m = withMercs(bronzed(sunk('v18', { at: 'sunkenstreet' })), 'parang', 'neoul');
  m.sunken.breath = 7; m.sunken.boxes = { sunkenstreet: 2, vault: 3 }; m.sunken.bronze = 120; m.party[0].out = m.day; m.party[0].hp = 0;
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: m })).state;
  assert.deepEqual(back, JSON.parse(JSON.stringify(m)));
  const p = inPalace(sunk('v18b'), 's1-gate');
  dispatch(p, { type: 'room', to: 's1-post' });
  assert.equal(parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: p })).state.choice.kind, 'post');
  // 망가진 칸은 거른다
  const bad = JSON.parse(JSON.stringify(m)); bad.sunken.boxes.vault = 9;
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })), /잠긴 도성/);
});
