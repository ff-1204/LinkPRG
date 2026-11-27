// M20 구름 위의 신전: 구름다리(레벨 71~80). 곳, 구간 용병과 북 치는 이, 바람, 상단, 하늘 신전, 11장 모신 종, 일행 셋, 서브와 히든.
// 기준: systems.md "18차: 구름다리 화면"(GD-), roadmap.md M20-1 ~ M20-9. 여정은 journey-cloud.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, slotsNow as slots, mapView, bodyView, roomFee, CLOUD_FIRST } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS, INCIDENTS } from '../src/data/wild.js';
import { ITEMS } from '../src/data/items.js';
import { PEOPLE, CALLS, BONDS } from '../src/data/people.js';
import { JOBS as BOARD, GOYO_FIRST } from '../src/data/quests.js';
import { RECIPES } from '../src/data/recipes.js';
import { MONSTERS } from '../src/data/monsters.js';
import { shopView, pricesView } from '../src/core/trade.js';
import { boardView } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { travel, walk } from './_white.js';
import { count, give } from './_salt.js';
import { tend, settle } from './_marsh.js';
import { sunk, quieted } from './_sunken.js';
import { climbed, silvered } from './_cloud.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const labels = (s) => slots(s).map((x) => x.label.replace(/ \(.*/, ''));
const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { tend(s); dispatch(s, { type: 'hammer' }); }
};

// ── M20-3 곳 (GD-A, GD-G1) ──

test('M20-3 10장을 끝내기 전에는 구름다리가 지도·소문·지붕마을의 칸 어디에도 없다 (GD-G1)', () => {
  const s = sunk('nocloud');
  const rows = mapView(s);
  for (const id of ['bridgegate', 'cliffroad', 'templeyard']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/다릿목|벼랑길|신전 뜰|구름다리/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/다릿목|구름다리/));
  assert.ok(!slots(s).some((x) => x.label === '산길로 오른다'));
  for (const to of ['bridgegate', 'cliffroad', 'templeyard']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
  assert.equal(bodyView(s).wind ?? null, null, '바람 칸도 없다');
});

test('M20-3 10장을 끝내면 지붕마을 선창에서 산길로 올라 다릿목 어귀에 닿는다. 하루 길이다 (GD-A1, GD-E2)', () => {
  const s = quieted('up', { at: 'roofgate' });
  assert.equal(mapView(s).find((r) => r.id === 'bridgegate').name, '다릿목');
  assert.deepEqual(slots(s).find((x) => x.label === '산길로 오른다').action, { type: 'travel', to: 'bridgegate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'bridgegate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 50, '하루 길');
  assert.equal(CLOUD_FIRST[0], '물이 끝나고 돌이 시작됐다. 구름을 뚫고 오르자 두 산 사이에 다리가 걸려 있었다. 다리 끝에 금빛 지붕이 있다. 여기까지 오는 동안 띠링이 한 번도 울리지 않았다는 것을 그제야 알았다.');
  assert.ok(texts(s).includes(CLOUD_FIRST[0]) && texts(s).includes(CLOUD_FIRST[1]));
  travel(s, 'roofgate'); travel(s, 'bridgegate');
  assert.equal(s.log.filter((l) => l.text === CLOUD_FIRST[0]).length, 1, '처음 한 번만');
  assert.equal(bodyView(s).wind ?? null, null, '다릿목에서는 바람 칸이 없다 (GD-G2)');
});

test('M20-3 다릿목의 방 여섯과 사냥터 둘. 벼랑길에서 구름 염소를 만난다 (GD-A2~A9)', () => {
  assert.deepEqual(TOWNS['다릿목'].order, ['bridgegate', 'bridgemarket', 'silverforge', 'goathut', 'templedoor', 'pilgriminn']);
  for (const id of [...TOWNS['다릿목'].order, 'cliffroad', 'templeyard']) {
    const p = PLACES[id];
    assert.equal(p.band, 8, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  const want = {
    bridgegate: ['둘러보기'], bridgemarket: ['시세판', '상점', '경매장'], silverforge: ['만들기', '상점', '고치기', '강화'],
    goathut: ['바느질', '상점', '용병', '게시판'], templedoor: ['기도', '둘러보기'], pilgriminn: ['방 빌리기', '보관함', '요리', '소문 게시판'],
  };
  for (const [id, list] of Object.entries(want)) assert.deepEqual(labels(climbed(`at-${id}`, { at: id })), list, id);
  assert.equal(PLACES.templedoor.room, '금칠한 문 앞에 사람들이 무릎을 꿇고 있다. 문은 닫혀 있다. 안에서 무언가 울리는 것 같기도 하고, 바람 소리 같기도 하다.');
  assert.ok(PLACES.cliffroad.room.startsWith('한쪽은 바위, 한쪽은 구름이다. 길은 사람 하나 폭이다.'));
  assert.ok(PLACES.bridgemarket.room.includes('짐꾼'), '장터의 방 글에 짐꾼이 오간다는 한 줄 (GD-G3)');
  assert.deepEqual([PLACES.cliffroad.levels, PLACES.templeyard.levels, PLACES.cliffroad.windy, PLACES.templeyard.windy, !!PLACES.bridgegate.windy], ['71~74', '75~78', true, true, false]);
  assert.deepEqual(WILDS.cliffroad.monsters.map((m) => m.id), ['cloudgoat', 'windknot']);
  assert.deepEqual(WILDS.templeyard.monsters.map((m) => m.id), ['stonemonk', 'goldmask']);
  assert.deepEqual([MONSTERS.cloudgoat.level, MONSTERS.windknot.level, MONSTERS.stonemonk.level, MONSTERS.goldmask.level], [71, 73, 76, 78]);
  assert.equal(WILDS.cliffroad.meets[0], '옆바람 불 땐 모아 치기 무조건 막으세요. 안 막으면 밀려요');
  assert.ok(INCIDENTS.cliffroad.length >= 2 && INCIDENTS.templeyard.length >= 2);
  // 벼랑길에서 탐색하면 구름 염소나 바람 매듭을 만난다
  const s = climbed('meet', { at: 'cliffroad' });
  for (let i = 0; i < 80 && !(s.dex.mon.cloudgoat?.seen); i++) { s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'explore' }); settle(s); }
  assert.ok(s.dex.mon.cloudgoat.seen > 0);
  // 캐면 염소털과 구름은이 나온다. 신전 뜰에서는 구름은
  for (let i = 0; i < 60; i++) { s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'dig' }); settle(s); }
  assert.ok(count(s, 'goatwool') > 0);
  const y = climbed('yard', { at: 'templeyard' });
  for (let i = 0; i < 60; i++) { y.tick = 0; y.phase = 0; tend(y); dispatch(y, { type: 'act', id: 'dig' }); settle(y); }
  assert.ok(count(y, 'cloudsilver') > 0);
});

test('M20-3 다리 장터·은 대장간·염소치기 움막의 가게, 시세판과 경매장, 순례자 숙소(방 350), 게시판, 다릿목 사람들. 구름은 갑옷을 지으면 대장 9단계가 열린다 (GD-A3~A7, GD-H7, LV-F8)', () => {
  const names = (at) => shopView(climbed(`shop-${at}`, { at })).goods.map((g) => g.name);
  assert.ok(names('bridgemarket').includes('구름은 덩이') && names('bridgemarket').includes('옛 청동 덩이') && names('bridgemarket').includes('소금강 덩이'), '온 지역의 물건');
  assert.ok(names('silverforge').includes('구름은 덩이'));
  assert.ok(names('goathut').includes('염소털') && names('goathut').includes('구름 염소 고기'));
  // 다리 장터는 사는 값도 파는 값도 날마다 바뀐다. 시세판에는 그 장터가 파는 것이 적힌다
  const m = climbed('prices', { at: 'bridgemarket' });
  const v = pricesView(m);
  const all = [...v.up, ...v.down, ...v.flat].map((r) => r.name);
  assert.ok(all.includes('구름은 덩이') && all.includes('염소털') && !all.includes('전갈 껍질'));
  assert.ok(shopView(m).market);
  assert.ok(PLACES.bridgemarket.auction && PLACES.bridgemarket.market);
  const inn = climbed('inn', { at: 'pilgriminn' });
  assert.equal(roomFee(inn), 350);
  assert.ok(PLACES.pilgriminn.storage && PLACES.pilgriminn.kitchen);
  // 게시판: 사냥 넷, 가져오는 일 셋
  const b = climbed('board', { at: 'goathut' });
  const ids = Object.entries(BOARD).filter(([, d]) => d.at === 'goat').map(([id]) => id);
  assert.equal(ids.length, 7);
  assert.ok(boardView(b).length > 0 && boardView(b).every((c) => ids.includes(c.id)));
  for (const id of ids) { const d = BOARD[id]; assert.ok(d.minLevel >= 71, id); if (d.kind === 'bring') assert.ok(d.silver < ITEMS[d.item].price * d.n, id); else assert.equal(MONSTERS[d.mon].band, 8, id); }
  // 다릿목 사람 일곱
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '다릿목');
  assert.equal(here.length, 7);
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
  assert.deepEqual([PEOPLE.goyo.name, PEOPLE.novice.name], ['문지기 사제 고요', '견습 사제 새벽']);
  // 문지기 사제 고요, 견습 사제 새벽과 처음 만난다 (GD-E1)
  const d = climbed('goyo');
  walk(d, 'templedoor');
  for (const [, text] of GOYO_FIRST) assert.ok(texts(d).includes(text));
  assert.deepEqual(d.log.filter((l) => GOYO_FIRST.some((g) => g[1] === l.text)).map((l) => l.who || '나'), ['문지기 사제 고요', '나', '문지기 사제 고요', '견습 사제 새벽']);
  assert.equal(GOYO_FIRST[3][1], '(작게) …저는 한 번도 못 들었어요. 말하면 안 되는데.');
  walk(d, 'bridgegate'); walk(d, 'templedoor');
  assert.equal(d.log.filter((l) => l.text === GOYO_FIRST[0][1]).length, 1);
  // 승급작: 세공은 구름은 반지(시안 LV-F8), 은 대장간에서 짓는 대장의 승급작은 구름은 갑옷
  assert.equal(RECIPES.cloudsilver_ring.name, '구름은 반지');
  assert.ok(RECIPES.cloudsilver_ring.promo && RECIPES.cloudsilver_ring.jewel);
  const c = climbed('promo', { at: 'silverforge' });
  c.craftLv.smith = { lv: 32, xp: 0 }; c.craftTier.smith = 8;
  assert.ok(RECIPES.cloudsilver_armor.promo);
  make(c, 'cloudsilver_armor');
  assert.equal(c.craftTier.smith, 9);
});

// ── M20-1 구름다리의 구간 용병과 북 치는 이 (LV-H3, LV-H4, GD-C, GD-G4, GD-H3, GD-H7) ──
import { COMPANIONS, BAND_MERCS, ROLES, PLANS, PARTY_MAX, partyMax, bardOfBand, mercsAt } from '../src/data/companions.js';
import { mercView, mercElsewhere, mercSeats, partyView, roleBonus, hitCompanion, guardFor } from '../src/core/party.js';
import { drumBuff, buffRows } from '../src/core/buffs.js';
import { valueOf } from '../src/core/derived.js';
import { bardRate, BANDS } from '../src/data/bands.js';
import { startBattle } from '../src/core/battle.js';
import { escorts } from '../src/core/sunken.js';
import { withMercs } from './_sunken.js';
import { heard } from './_cloud.js';

test('M20-1 염소치기 움막의 용병: 북 치는 마루가 맨 위, 그 구간의 셋이 아래. 삯은 모두 420 (GD-C0, GD-H7)', () => {
  const s = climbed('mercs', { at: 'goathut' });
  assert.ok(PLACES.goathut.merc && PLACES.goathut.band === 8);
  const v = mercView(s);
  assert.deepEqual(v.map((m) => [m.name, m.role, m.fee]), [['북 치는 마루', '북돋는 이', 420], ['창잡이 서리', '때리는 사람', 420], ['활잡이 수리', '때리는 사람', 420], ['방패잡이 바위', '막는 사람', 420]]);
  assert.equal(v[0].text, '싸우지 않는다. 북을 치는 동안 일행 모두의 공격력·방어력 +10%. 맞지도 않는다.');
  assert.match(v[1].text, /55%/); assert.match(v[3].text, /35%/);
  assert.deepEqual(BAND_MERCS[8].order, ['seori', 'suri', 'bawi']);
  assert.equal(bardOfBand(8), 'drummaru');
  assert.equal(bardOfBand(7), null, '그 앞 구간에는 북 치는 이가 없다');
  assert.equal(COMPANIONS.drummaru.drum, bardRate(8));
  assert.equal(bardRate(8), 0.10);
  assert.equal(COMPANIONS.seori.fee, Math.round((BANDS[7].day * 0.12) / 10) * 10);
  assert.equal(ROLES.bard, '북돋는 이');
  assert.equal(PLANS.bard.length, 1);
  // 다른 거점에서는 구하지 못한다
  const far = climbed('far', { at: 'guardpost' });
  far.silver = 5000;
  assert.throws(() => dispatch(far, { type: 'party', op: 'hire', id: 'drummaru' }), /염소치기 움막에서 구합니다/);
});

test('M20-1 일행은 둘까지라, 북 치는 이를 들이려면 한 사람을 보내야 한다 (GD-C1)', () => {
  const s = climbed('seat', { at: 'goathut' });
  s.silver = 5000;
  assert.equal(partyMax(s), PARTY_MAX);
  assert.deepEqual(mercSeats(s), { n: 0, max: 2, note: '' });
  dispatch(s, { type: 'party', op: 'hire', id: 'seori' });
  dispatch(s, { type: 'party', op: 'hire', id: 'bawi' });
  assert.equal(s.silver, 5000 - 840);
  assert.deepEqual(mercSeats(s), { n: 2, max: 2, note: '마루를 들이려면 한 사람을 보내야 한다.' });
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'drummaru' }), /2명까지/);
  assert.equal(mercView(s)[0].why, '동료는 2명까지');
  dispatch(s, { type: 'party', op: 'dismiss', id: 'bawi' });
  dispatch(s, { type: 'party', op: 'hire', id: 'drummaru' });
  assert.deepEqual(s.party.map((c) => c.id), ['seori', 'drummaru']);
  assert.deepEqual(mercSeats(s), { n: 2, max: 2, note: '' });
  assert.ok(!JSON.stringify([mercView(s), mercSeats(s), partyView(s)]).match(/3명|셋/), '셋째 자리는 어디에도 나오지 않는다');
  // 북 치는 이가 없는 거점의 용병 창에는 일행 줄이 없다(그 전의 창 그대로)
  assert.equal(mercSeats(climbed('old', { at: 'guardpost' })), null);
});

test('M20-1 북소리: 북 치는 이가 곁에 있는 동안 나와 일행의 공격력·방어력 +10%. 싸움 화면과 "걸린 효과"에 보인다 (LV-H4, GD-C2)', () => {
  const s = silvered(climbed('drum', { at: 'cliffroad' }));
  const [a0, d0] = [valueOf(s, 'attack'), valueOf(s, 'defense')];
  assert.equal(drumBuff(s), null);
  assert.equal(bodyView(s).drum, null);
  assert.ok(!buffRows(s).some((r) => r.name === '북소리'));
  withMercs(s, 'drummaru');
  assert.deepEqual([valueOf(s, 'attack'), valueOf(s, 'defense')], [a0 + Math.round(a0 * 0.1), d0 + Math.round(d0 * 0.1)]);
  assert.deepEqual([bodyView(s).drum.name, bodyView(s).drum.text], ['북소리', '공격력·방어력 +10%']);
  assert.deepEqual(buffRows(s).filter((r) => r.name === '북소리').map((r) => [r.kind, r.text]), [['용병', '공격력·방어력 +10%']]);
  // 음식·성수와 겹친다
  s.buffs.grace = { id: 'grace', name: '깊은 가호', power: 0.09, text: '', until: { day: s.day + 9, phase: 0 } };
  assert.ok(valueOf(s, 'attack') > a0 + Math.round(a0 * 0.1));
  // 그날 못 쓰게 된 이의 북은 울리지 않는다
  delete s.buffs.grace;
  s.party[0].out = s.day;
  assert.equal(valueOf(s, 'attack'), a0);
  delete s.party[0].out;
  // 일행의 공격에도 실리고, 대신 맞는 일행도 덜 다친다
  withMercs(s, 'bawi');
  const bawi = s.party.find((c) => c.id === 'bawi');
  const before = bawi.hp;
  hitCompanion(s, [], bawi, 110);
  assert.equal(before - bawi.hp, 100);
});

test('M20-1 북 치는 이는 싸우지도 맞지도 않는다. 호위도 서지 않는다. "고루 갖춘 일행"의 셋째 자리에는 선다 (GD-C0, BM-C2)', () => {
  const s = silvered(climbed('still', { at: 'cliffroad' }));
  withMercs(s, 'drummaru');
  const maru = s.party[0];
  const hp = maru.hp;
  startBattle(s, [], 'cloudgoat');
  for (let i = 0; i < 400; i++) assert.equal(guardFor(s), null, '대신 맞아 주지 않는다');
  let n = 0;
  while (s.battle && n++ < 60) { tend(s); dispatch(s, { type: 'battle', choice: s.battle.intent === 'charge' ? 'defend' : 'attack' }); }
  assert.ok(n > 1);
  assert.equal(maru.hp, hp);
  assert.ok(!texts(s).match(/마루[가이] (쳤다|앞을 막아섰다|머뭇거린다)/));
  // 고루 갖춘 일행 (T26): M21에서 셋째 자리가 고치는 이 또는 북돋는 이로 넓어졌다 (BM-C2)
  const r = climbed('roles');
  r.job = 'warrior';
  withMercs(r, 'seori', 'drummaru');
  assert.equal(roleBonus(r), 0.05, '막는 사람(나) · 때리는 사람 · 북돋는 이');
  r.party = []; withMercs(r, 'drummaru');
  assert.equal(roleBonus(r), 0, '때리는 사람이 없으면 고루가 아니다');
  r.party = []; withMercs(r, 'seori', 'miru');
  assert.equal(roleBonus(r), 0.05);
  // 호위받는 채집 (JD-C4): 싸우는 용병 둘이어야 한다
  const e = climbed('escort', { at: 'sunkenstreet' });
  withMercs(e, 'parang', 'drummaru');
  assert.equal(escorts(e), null);
});

test('M20-1 염소치기 움막에 가 보기 전에는 북 치는 이가 용병 창 어디에도 나오지 않는다 (GD-G4)', () => {
  const s = quieted('nobard', { at: 'guardpost' });
  assert.ok(!JSON.stringify([mercView(s), mercElsewhere(s), mercSeats(s)]).match(/마루|북|서리|바위/));
  s.dex.places.goathut = true;
  assert.ok(mercElsewhere(s).some((x) => x.why === '염소치기 움막에서 구한다'));
  // 구름다리에서는 앞 구간의 용병이 따라오지 않는다
  const up = climbed('stay', { at: 'roofgate' });
  withMercs(up, 'parang');
  travel(up, 'bridgegate');
  assert.deepEqual(up.party, []);
  assert.deepEqual(mercsAt(PLACES.goathut), ['drummaru', 'seori', 'suri', 'bawi']);
});

// ── M20-2 계산 도구의 북 치는 이 (LV-I5, LV-A) ──

test('M20-2 계산 도구가 구름다리를 용병 둘, 그리고 용병 하나에 북 치는 이로 잰다. 북소리가 있으면 덜 잃는다', async () => {
  const { measure, applyKit, buildPlayer, gearOf, bardOfKit, mercsOfKit, fieldOf } = await import('../tools/balance.mjs');
  assert.deepEqual(['merc2', 'bard'].map(bardOfKit), [false, true]);
  assert.deepEqual(['merc2', 'bard'].map(mercsOfKit), [2, 2]);
  assert.equal(BANDS[7].need, 'merc2', '구름다리가 갖출 것은 용병 둘 (LV-A)');
  const s = buildPlayer(BANDS[7], 'warrior', gearOf(8, 'str', 'warrior'));
  assert.equal(applyKit(s, BANDS[7], 'merc2', 1, true), null);
  assert.deepEqual(s.party.map((c) => c.id), ['seori', 'drummaru']);
  const of = (o) => measure(8, { runs: 24, ...o }).find((r) => r.job === 'warrior');
  const one = of({ mercs: 1 }), bard = of({ mercs: 1, bard: true });
  assert.ok(bard.loss < one.loss, `북 치는 이가 있으면 덜 잃는다 (${one.loss}% → ${bard.loss}%)`);
  assert.ok(bard.turns < one.turns, `싸움도 짧아진다 (${one.turns} → ${bard.turns})`);
  // 바람이 부는 데서도 잰다 (--wind)
  assert.equal(fieldOf(BANDS[7]), 'forest');
  assert.ok(PLACES[fieldOf(BANDS[7], true)].windy);
  assert.ok(Number.isFinite(measure(8, { runs: 6, mercs: 2, wind: true })[0].loss));
  // 처음 모루는 일곱 천막의 사람들이 용병과 북돋는 이를 대신한다 (M22)
  const top = buildPlayer(BANDS[9], 'warrior', gearOf(10, 'str', 'warrior'));
  assert.equal(applyKit(top, BANDS[9], 'bard'), null);
  assert.deepEqual(top.party.map((c) => c.id), ['tent7f', 'tent6f', 'tent12f']);
});

// ── M20-4 바람 (GD-B, GD-G2, GD-H1, GD-H2) ──
import { CLOUD, WINDS, CLOUD_LINES, windAt, windNow, windNext } from '../src/core/cloud.js';
import { fleeChance, dodgeChance } from '../src/core/battle.js';
import { blow, turnPhase as passPhase } from './_cloud.js';

/** 그 바람이 부는 곳에 선 사람(구름은 한 벌). */
const inWind = (seed, wind, at = 'cliffroad') => {
  const s = silvered(climbed(seed, { at }));
  blow(s, wind, windAt);
  return s;
};
/** 끝나지 않는 싸움 한 턴: 적의 다음 수를 정해 두고 한 번 움직인다. 그 턴에 적힌 줄을 돌려준다. */
const oneTurn = (s, intent, choice = 'attack') => {
  if (!s.battle) startBattle(s, [], s.place === 'templeyard' ? 'stonemonk' : 'cloudgoat');
  s.battle.hp = 999999; s.battle.intent = intent; s.hp = valueOf(s, 'maxHp'); s.tired = 0; s.full = 80; s.tick = 0;
  const from = s.log.length;
  dispatch(s, { type: 'battle', choice });
  return s.log.slice(from);
};

test('M20-4 바람은 때마다 셋 가운데 하나다. 씨앗으로 정해져 같은 날 같은 때는 늘 같고, 벼랑길과 신전 뜰에서만 분다 (GD-B3, GD-G2)', () => {
  const a = climbed('wind', { at: 'cliffroad' }), b = climbed('wind', { at: 'templeyard' });
  const seen = new Set();
  for (let d = 1; d <= 40; d++) for (let p = 0; p < 3; p++) { assert.equal(windAt(a, d, p), windAt(b, d, p)); seen.add(windAt(a, d, p)); }
  assert.deepEqual([...seen].sort(), ['head', 'side', 'tail']);
  assert.notDeepEqual(Array.from({ length: 30 }, (_, d) => windAt(a, d + 1, 0)), Array.from({ length: 30 }, (_, d) => windAt(climbed('other'), d + 1, 0)), '씨앗이 다르면 바람도 다르다');
  assert.deepEqual([WINDS.tail.name, WINDS.head.name, WINDS.side.name], ['뒷바람', '맞바람', '옆바람']);
  // 다섯째 칸과 이름표 (GD-B1, GD-B2)
  blow(a, 'tail', windAt);
  assert.deepEqual(bodyView(a).wind, { id: 'tail', name: '뒷바람', low: false, tag: { name: '뒷바람', text: '공격이 한 번 더 들어갈 수 있다' } });
  blow(a, 'side', windAt);
  assert.deepEqual([bodyView(a).wind.name, bodyView(a).wind.tag.text, bodyView(a).wind.low], ['옆바람', '큰 공격을 맞으면 밀려난다', true]);
  // 다릿목과 다른 지역에서는 칸이 없다
  for (const at of ['bridgegate', 'bridgemarket', 'templedoor', 'roofgate', 'sunkenstreet', 'forest']) assert.equal(bodyView(climbed(`no-${at}`, { at })).wind, null, at);
  assert.equal(windNow(climbed('town')), null);
});

test('M20-4 깃발 보기: 다음 때의 바람을 안다. 깃발로 본 바람이 다음 때에 그대로 분다 (GD-B2)', () => {
  const s = climbed('flag', { at: 'cliffroad' });
  assert.ok(labels(s).includes('깃발 보기'));
  assert.deepEqual(labels(s).slice(0, 3), ['탐색', '캐기', '깃발 보기']);
  for (let i = 0; i < 6; i++) {
    const next = windNext(s);
    const tick = [s.day, s.phase, s.tick].join();
    dispatch(s, { type: 'act', id: 'flag' });
    assert.equal(s.log.at(-1).text, `깃발을 올려다보았다. ${['낮', '밤', '내일 아침'][s.phase]}은 ${next.wind.name}이다.`);
    assert.equal([s.day, s.phase, s.tick].join(), tick, '때가 흐르지 않는다');
    passPhase(s);
    assert.equal(windNow(s).id, next.wind.id);
  }
  // 깃발은 벼랑길에만 있다
  assert.ok(!labels(climbed('yard', { at: 'templeyard' })).includes('깃발 보기'));
  assert.throws(() => dispatch(climbed('gate'), { type: 'act', id: 'flag' }));
});

test('M20-4 뒷바람: 내 공격이 20%로 한 번 더 들어간다(절반의 피해). 달아나기 +20%p (GD-B1, GD-B3)', () => {
  const s = inWind('tail', 'tail');
  let hits = 0, again = 0;
  for (let i = 0; i < 500; i++) {
    const lines = oneTurn(s, 'hit');
    const mine = lines.filter((l) => /내리쳤다/.test(l.text));
    const more = lines.filter((l) => l.text.startsWith(CLOUD_LINES.again));
    hits += mine.length; again += more.length;
    if (more.length) assert.equal(Number(more[0].text.match(/(\d+) 피해/)[1]), Math.max(1, Math.round(Number(mine[0].text.match(/(\d+) 피해/)[1]) * 0.5)), '절반의 피해');
  }
  assert.ok(Math.abs(again / hits - 0.2) < 0.06, `한 번 더 들어간 몫 ${again} / ${hits}`);
  assert.equal(CLOUD_LINES.again, '바람을 탔다. 한 번 더 들어갔다.');
  // 달아나기 +20%p
  s.stats.agi = 55;
  const withWind = fleeChance(s);
  blow(s, 'side', windAt);
  assert.ok(Math.abs(withWind - fleeChance(s) - 0.2) < 1e-9 || withWind === 0.95, `${withWind} / ${fleeChance(s)}`);
  // 다른 바람에서는 한 번 더 들어가지 않는다
  let other = 0;
  for (let i = 0; i < 80; i++) other += oneTurn(s, 'hit').filter((l) => l.text.startsWith(CLOUD_LINES.again)).length;
  assert.equal(other, 0);
});

test('M20-4 맞바람: 활과 던지는 물건 −30%, 피하기 −15%p, 적의 큰 공격이 한 턴 늦게 온다 (GD-B3)', () => {
  const s = inWind('head', 'head');
  startBattle(s, [], 'cloudgoat');
  const dodgeHead = dodgeChance(s);
  blow(s, 'tail', windAt);
  assert.ok(Math.abs(dodgeChance(s) - dodgeHead - 0.15) < 1e-9 || dodgeHead === 0.1, `${dodgeChance(s)} / ${dodgeHead}`);
  // 큰 공격이 늦는다: 예고된 턴에는 오지 않고, 다음 턴에 그대로 온다
  blow(s, 'head', windAt);
  const turn = s.battle.turn;
  const first = oneTurn(s, 'charge');
  assert.ok(first.some((l) => l.text === CLOUD_LINES.late));
  assert.equal(s.hp, valueOf(s, 'maxHp'), '그 턴에는 맞지 않는다');
  assert.deepEqual([s.battle.intent, s.battle.turn, s.battle.late], ['charge', turn + 1, 'due'], '다음 턴에 그대로 온다');
  assert.equal(s.log.at(-1).k, 'intent');
  const hp = s.hp;
  dispatch(s, { type: 'battle', choice: 'attack' });
  assert.ok(s.hp < hp, '늦은 것이 왔다');
  assert.equal(s.battle.late, null);
  // 늦은 것을 막으면 지금처럼 되받아친다
  s.battle.late = 'due'; s.stance = 'hold';
  assert.ok(oneTurn(s, 'charge', 'defend').some((l) => /막고 되받아쳤다/.test(l.text)));
  // 활: 맞바람에 30% 덜 들어간다
  const dmgOf = (wind) => {
    const a = inWind('bow', wind);
    a.job = 'archer'; a.stats.agi = 260;
    a.equip.weapon = { id: 'cloudsilver_bow', grade: 0, n: 1, dur: 999, max: 999 };
    let sum = 0, n = 0;
    for (let i = 0; i < 400; i++) {
      a.equip.weapon.dur = 999;
      const l = oneTurn(a, 'hit').find((x) => /내리쳤다/.test(x.text) && !/급소/.test(x.text));
      if (l) { sum += Number(l.text.match(/(\d+) 피해/)[1]); n++; assert.equal(/맞바람에 화살이 밀린다/.test(l.text), wind === 'head'); }
    }
    return sum / n;
  };
  const [calm, head] = [dmgOf('side'), dmgOf('head')];
  assert.ok(Math.abs(head / calm - 0.7) < 0.04, `활 ${Math.round(calm)} → ${Math.round(head)}`);
  // 던지는 물건도 30% 덜 들어간다(물 주머니 16 → 11)
  const thrown = (wind) => {
    const t = inWind('throw', wind);
    t.bag.push({ id: 'waterpouch', grade: 0, n: 1 });
    startBattle(t, [], 'windknot'); t.battle.hp = 999999; t.battle.intent = 'hit';
    const from = t.log.length;
    dispatch(t, { type: 'battle', choice: 'item', index: t.bag.findIndex((x) => x.id === 'waterpouch') });
    return t.log.slice(from).find((l) => /던졌다/.test(l.text)).text;
  };
  const [plain, blown] = [thrown('side'), thrown('head')];
  assert.ok(!/맞바람/.test(plain) && /맞바람에 밀린다/.test(blown));
  assert.equal(Number(blown.match(/(\d+) 피해/)[1]), Math.round(Number(plain.match(/(\d+) 피해/)[1]) * 0.7));
  // 검은 깎이지 않는다
  const sword = inWind('sword', 'head');
  assert.ok(!oneTurn(sword, 'hit').some((l) => /맞바람에 화살이 밀린다/.test(l.text)));
});

test('M20-4 옆바람: 큰 공격을 막지 못하고 맞으면 밀려나 다음 턴을 잃는다. 막으면 밀리지 않는다 (GD-B2, GD-B3)', () => {
  const s = inWind('side', 'side');
  assert.ok(oneTurn(s, 'charge').some((l) => l.text === '구름 염소에게 받혀 벼랑 끝까지 밀렸다. 한 턴을 잃었다.'));
  assert.equal(s.battle.pushed, true);
  // 다음 턴: 아무것도 하지 못한다
  const lost = oneTurn(s, 'hit');
  assert.ok(lost.some((l) => l.text === CLOUD_LINES.lost));
  assert.ok(!lost.some((l) => /내리쳤다/.test(l.text)), '치지 못했다');
  assert.ok(!s.battle.pushed);
  // 그다음 턴은 다시 친다
  assert.ok(oneTurn(s, 'hit').some((l) => /내리쳤다/.test(l.text)));
  // 막으면 밀리지 않는다
  s.stance = 'hold';
  oneTurn(s, 'charge', 'defend');
  assert.ok(!s.battle.pushed);
  // 보통 공격에는 밀리지 않는다
  oneTurn(s, 'hit');
  assert.ok(!s.battle.pushed);
  // 신전 뜰에서는 담장까지 밀린다
  const y = inWind('yard', 'side', 'templeyard');
  assert.ok(oneTurn(y, 'charge').some((l) => l.text === '돌 수도승에게 받혀 담장까지 밀렸다. 한 턴을 잃었다.'));
});

test('M20-4 바람이 불지 않는 데의 싸움에는 아무것도 걸리지 않는다. 들어설 때와 때가 바뀔 때 바람이 한 줄로 적힌다 (GD-B3)', () => {
  // 같은 날 같은 때라도 바람이 불지 않는 데서는 한 번 더 들어가지도, 밀리지도, 늦지도 않는다
  for (const wind of ['tail', 'head', 'side']) {
    const s = silvered(climbed(`calm-${wind}`, { at: 'forest' }));
    blow(s, wind, windAt);
    let said = '';
    for (let i = 0; i < 40; i++) { said += oneTurn(s, i % 2 ? 'charge' : 'hit').map((l) => l.text).join(' / '); assert.ok(!s.battle.pushed && !s.battle.late); }
    assert.ok(!said.includes(CLOUD_LINES.again) && !said.includes(CLOUD_LINES.late));
  }
  // 들어설 때
  const a = climbed('arrive', { at: 'bridgegate' });
  travel(a, 'cliffroad');
  assert.ok(a.log.some((l) => Object.values(WINDS).some((w) => l.text === w.room)));
  assert.equal(WINDS.tail.room, '등 뒤에서 바람이 민다.');
  // 때가 바뀔 때
  const b = climbed('turn', { at: 'cliffroad' });
  let said = 0;
  for (let i = 0; i < 12; i++) { const was = windNow(b).id; passPhase(b); if (windNow(b).id !== was) { assert.ok(b.log.some((l) => l.text === `바람이 바뀐다. ${windNow(b).name}이다. ${windNow(b).room}`)); said++; } }
  assert.ok(said > 0);
  assert.equal(CLOUD.again, 0.2);
});

// ── M20-5 상단 (LV-K3, LV-K9, LV-L6, GD-D, GD-G3, GD-H4) ──
import { CARAVAN, caravanView, caravanOffered, caravanWork, townRate, townPrice, riskTo, towns, hearRumor } from '../src/core/caravan.js';
import { mailView, unreadMail } from '../src/core/mail.js';
import { worth, SELL_RATE } from '../src/core/trade.js';
import { SAVE_VERSION } from '../src/core/game.js';
import { parseSave } from '../src/core/save.js';
const serialize = (s) => JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: JSON.parse(JSON.stringify(s)) });
import { talkTo } from './_time.js';

/** 상단 깃발을 가진 사람(다리 장터에 서 있다). 아랫동네의 거점은 다 가 본 사람이다. */
const trader = (seed = 'trader', opts = {}) => {
  const s = climbed(seed, { at: 'bridgemarket', ...opts });
  s.caravan = { load: null, past: [], heard: {}, sent: 0 };
  for (const t of towns()) s.dex.places[t.gate] = true;
  s.silver = 5000;
  return s;
};
const put = (s, id, n, extra = {}) => { s.bag.push({ id, grade: 0, n, ...extra }); return s.bag.length - 1; };
/** 싸움이 나지 않는 "일"을 n번 한다(다릿목의 기도). 짐이 가는 것만 본다. */
const toil = (s, n) => { const at = s.place; s.place = 'templedoor'; for (let i = 0; i < n; i++) { tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'act', id: 'pray' }); } s.place = at; };

test('M20-5 깃발을 사기 전에는 "상단"이 어디에도 없다. 장터 어른에게 값을 들은 뒤 42,000에 산다 (GD-D, GD-G3, LV-L6)', () => {
  const s = climbed('nocaravan', { at: 'bridgemarket' });
  s.silver = 50000;
  assert.equal(s.caravan, null);
  assert.equal(caravanView(s), null);
  assert.deepEqual(labels(s), ['시세판', '상점', '경매장']);
  assert.ok(!JSON.stringify(slots(s)).includes('상단') && !JSON.stringify(slots(s)).includes('깃발'));
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'buy' }), /장터 어른에게 먼저/);
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [] }), /상단이 없습니다/);
  assert.equal(hearRumor(s), null, '상단이 없으면 소문도 듣지 못한다');
  // 장터 어른에게 말을 걸면 값을 듣는다
  talkTo(s, 'marketelder');
  assert.ok(caravanOffered(s));
  assert.ok(PEOPLE.marketelder.talk.some((t) => t.includes('사만 이천')));
  const buy = slots(s).find((x) => x.label === '깃발 사기 (은화 42,000)');
  assert.ok(buy && buy.confirm && buy.ask);
  s.silver = 41999;
  assert.ok(slots(s).find((x) => x.label.startsWith('깃발 사기')).disabled);
  s.silver = 50000;
  dispatch(s, { type: 'caravan', op: 'buy' });
  assert.equal(s.silver, 8000);
  assert.deepEqual(s.caravan, { load: null, past: [], heard: {}, sent: 0 });
  assert.deepEqual(labels(s), ['시세판', '상점', '경매장', '상단']);
  assert.ok(s.dings.some((d) => d.title === '상단이 생겼습니다'));
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'buy' }), /이미/);
  assert.equal(CARAVAN.price, 42000);
  // 다른 곳에서는 살 수 없다
  const far = climbed('farbuy', { at: 'goathut' });
  far.people.marketelder = { met: true };
  assert.throws(() => dispatch(far, { type: 'caravan', op: 'buy' }), /다리 장터/);
});

test('M20-5 짐 꾸리기: 가방과 보관함에서, 무게 60까지, 짐꾼 삯 350. 한 번에 짐 하나 (GD-D2, GD-D6, GD-H7)', () => {
  const s = trader('pack');
  const ring = put(s, 'cloudsilver_ring', 1, { maker: s.name });
  const wool = put(s, 'goatwool', 25);
  s.store['다릿목'] = { items: [{ id: 'cloudsilver', grade: 0, n: 30 }], silver: 0 };
  const v = caravanView(s);
  assert.deepEqual([v.n, v.loads, v.weight, v.fee, v.every, v.here], [0, 1, 60, 350, 30, true]);
  assert.deepEqual(v.dests.map((d) => [d.town, d.works]), [['지붕마을', 30], ['뜬마을', 60], ['가마골', 90], ['저울목', 120], ['언못', 150]]);
  assert.ok(v.goods.some((g) => g.from === 'box' && g.name === '구름은 덩이') && v.goods.some((g) => g.from === 'bag' && g.name === '염소털'));
  assert.equal(ITEMS.cloudsilver_ring.weight, 0);
  // 무게를 넘기면 안 된다(염소털 하나에 2)
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: wool, n: 25 }, { from: 'box', index: 0, n: 11 }] }), /너무 무겁습니다 \(61 \/ 60\)/);
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [] }), /골라야/);
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 2, picks: [{ from: 'bag', index: wool, n: 1 }] }), /보낼 수 없는 곳/);
  s.silver = 349;
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: wool, n: 1 }] }), /짐꾼 삯 은화 350/);
  s.silver = 1000;
  const bagBefore = s.bag.length;
  dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: ring, n: 1 }, { from: 'bag', index: wool, n: 20 }, { from: 'box', index: 0, n: 20 }] });
  assert.equal(s.silver, 650);
  assert.equal(s.bag.length, bagBefore - 1, '반지는 통째로, 염소털은 다섯이 남는다');
  assert.equal(count(s, 'goatwool'), 5);
  assert.equal(s.store['다릿목'].items[0].n, 10);
  const l = caravanView(s).load;
  assert.deepEqual([l.from, l.to, l.left, l.escort], ['다릿목', '지붕마을', 30, '']);
  assert.match(l.items, /구름은 반지/); assert.match(l.items, /염소털 20/); assert.match(l.items, /구름은 덩이 20/);
  assert.equal(caravanView(s).n, 1);
  // 한 번에 짐 하나
  assert.throws(() => dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: 0, n: 1 }] }), /한 번에 하나/);
  // 퀘스트 물건은 싣지 못한다
  const q = trader('quest');
  const i = put(q, 'wetledger', 1);
  assert.throws(() => dispatch(q, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: i, n: 1 }] }), /팔 수 없는/);
  // 가 보지 않은 거점으로는 보내지 못한다
  delete q.dex.places.icegate;
  const j = put(q, 'goatwool', 1);
  assert.throws(() => dispatch(q, { type: 'caravan', op: 'send', to: 3, picks: [{ from: 'bag', index: j, n: 1 }] }), /보낼 수 없는 곳/);
  assert.ok(!caravanView(q).dests.some((d) => d.town === '언못'));
});

test('M20-5 쉬기만 눌러서는 짐이 가지 않는다. 내 일 서른 번에 거점 하나를 간다 (GD-D3, LV-K9)', () => {
  const s = trader('idle');
  dispatch(s, { type: 'caravan', op: 'send', to: 6, picks: [{ from: 'bag', index: put(s, 'goatwool', 10), n: 10 }] });
  // 쉬고, 자고, 둘러보고, 길을 가고, 사고파는 것으로는 한 걸음도 가지 않는다
  s.place = 'bridgegate';
  for (let i = 0; i < 40; i++) { tend(s); s.phase = 2; dispatch(s, { type: 'act', id: 'rest' }); }
  for (let i = 0; i < 40; i++) { tend(s); dispatch(s, { type: 'act', id: 'look' }); }
  walk(s, 'pilgriminn'); s.silver = 9000;
  for (let i = 0; i < 5; i++) { tend(s); dispatch(s, { type: 'act', id: 'room' }); }
  walk(s, 'bridgemarket');
  for (let i = 0; i < 20; i++) { dispatch(s, { type: 'buy', id: 'herb', n: 1 }); dispatch(s, { type: 'sell', index: s.bag.findIndex((x) => x.id === 'herb'), n: 1 }); }
  assert.deepEqual([s.caravan.load.hop, s.caravan.load.work], [0, 0], '쉬기·잠·둘러보기·사고팔기로는 가지 않는다');
  assert.equal(caravanView(s).load.left, 60);
  assert.ok(s.day > 5, '여러 날이 지났어도');
  // 일을 스물아홉 번 하면 아직이고, 서른 번째에 거점 하나를 간다
  s.caravan.load.no = 1; // 잃지 않는 판을 고른다(씨앗으로 정해진다)
  let n = 1;
  while ([1, 2].some((hop) => roll(s, n, hop) < 0.2) && n < 200) n++;
  s.caravan.load.no = n;
  toil(s, 29);
  assert.deepEqual([s.caravan.load.hop, s.caravan.load.work], [0, 29]);
  assert.equal(caravanView(s).load.left, 31);
  toil(s, 1);
  assert.deepEqual([s.caravan.load.hop, s.caravan.load.work], [1, 0]);
  assert.ok(s.log.some((l) => l.who === '상단' && l.text.includes('짐꾼이 고개 하나를 넘었다.') && l.text.includes('뜬마을까지 내 일 30번')));
  // 싸움의 한 턴도 일이다
  const b = trader('fight');
  dispatch(b, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(b, 'goatwool', 1), n: 1 }] });
  b.place = 'cliffroad';
  startBattle(b, [], 'cloudgoat'); b.battle.hp = 999999; b.battle.intent = 'hit';
  dispatch(b, { type: 'battle', choice: 'attack' });
  assert.equal(b.caravan.load.work, 1);
});
import { roll01 } from '../src/core/rng.js';
const roll = (s, no, hop) => roll01(`${s.seed}|caravan|${no}|${hop}`);
/** 그 길을 잃지 않고 가는 짐 번호를 찾아 둔다(씨앗으로 정해진다). */
const safeNo = (s, hops, limit = 0.01) => { let n = 1; while (Array.from({ length: hops }, (_, i) => roll(s, n, i + 1)).some((r) => r < limit ? false : r < 0.2) && n < 500) n++; return n; };

test('M20-5 닿으면 그곳의 그날 값으로 팔리고 은화가 우편함으로 온다. 띠링은 울리지 않는다 (GD-D3, GD-H4)', () => {
  const s = trader('sell');
  dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(s, 'goatwool', 10), n: 10 }, { from: 'bag', index: put(s, 'cloudsilver_ring', 1), n: 1 }] });
  s.caravan.load.no = safeNo(s, 1);
  const silver = s.silver, dings = s.dings.length, mails = mailView(s).length;
  toil(s, 30);
  assert.equal(s.caravan.load, null);
  const want = townPrice(s, { id: 'goatwool', grade: 0 }, 7) * 10 + townPrice(s, { id: 'cloudsilver_ring', grade: 0 }, 7);
  assert.deepEqual(s.caravan.past, [{ to: 7, silver: want, day: s.day }]);
  assert.equal(s.silver, silver, '은화는 주머니로 바로 오지 않는다');
  assert.ok(!s.dings.slice(dings).some((d) => /상단|짐|팔/.test(`${d.title}${d.body || ''}`)), '띠링은 울리지 않는다');
  const mail = mailView(s);
  assert.equal(mail.length, mails + 1);
  assert.deepEqual([mail[0].from, mail[0].title, mail[0].gift, mail[0].taken], ['지붕마을의 짐꾼', '다릿목 → 지붕마을 짐이 팔렸습니다', `은화 ${want}`, false]);
  assert.ok(unreadMail(s) > 0);
  dispatch(s, { type: 'mail', op: 'take', id: mail[0].id });
  assert.equal(s.silver, silver + want);
  assert.throws(() => dispatch(s, { type: 'mail', op: 'take', id: mail[0].id }), /이미 받았습니다/);
  assert.ok(s.log.some((l) => l.who === '상단' && l.text.includes('지붕마을에 짐이 닿아 그날 값에 팔렸다.')));
  assert.deepEqual(caravanView(s).past, [{ from: '다릿목', to: '지붕마을', lost: false, silver: want }]);
  // 써 보낸 편지는 저장했다 읽어도 그대로다
  const back = parseSave(serialize(s)).state;
  assert.deepEqual(mailView(back)[0].title, mail[0].title);
});

test('M20-5 그곳에서 나는 것은 30% 싸고, 두 지역 넘게 떨어진 곳의 것은 40% 비싸다. 그 위에 날마다 바뀌는 값이 얹힌다 (GD-D4)', () => {
  const s = trader('rate');
  // 날마다의 몫을 걷어 내고 지역의 몫만 본다: 여러 날의 평균
  const avg = (id, band) => { let sum = 0; for (let d = 1; d <= 600; d++) sum += townRate(s, id, band, d); return sum / 600; };
  const base = avg('cloudsilver', 7); // 구름은(8)을 잠긴 도성(7)에: 한 지역 떨어짐 → 제값
  assert.ok(Math.abs(base - 1) < 0.03, `이웃 지역 ${base}`);
  assert.ok(Math.abs(avg('cloudsilver', 6) / base - 1) < 0.03, '두 지역 떨어진 곳까지는 제값');
  assert.ok(Math.abs(avg('cloudsilver', 5) / base - 1.4) < 0.05, '두 지역 넘게 떨어진 곳의 것은 40% 비싸다');
  assert.ok(Math.abs(avg('oldbronze', 7) / base - 0.7) < 0.04, '그곳에서 나는 것은 30% 싸다');
  assert.ok(Math.abs(avg('herb', 7) / base - 1.4) < 0.05, '시작 마을의 약초는 어디서나 멀리서 온 것이다');
  // 날마다 0.7~1.3배로 움직이고, 거점마다 따로 움직인다
  const days = Array.from({ length: 200 }, (_, d) => townRate(s, 'goatwool', 7, d + 1));
  assert.ok(Math.min(...days) >= 0.7 - 1e-9 && Math.max(...days) <= 1.3 + 1e-9 && new Set(days).size > 10);
  assert.ok(Array.from({ length: 30 }, (_, d) => townRate(s, 'goatwool', 7, d + 1) !== townRate(s, 'goatwool', 6, d + 1)).some(Boolean));
  // 값의 바탕은 가게에 파는 값(제값의 40%)이다: 사서 보내는 것만으로는 남지 않는다
  const it = { id: 'cloudsilver', grade: 0 };
  assert.equal(townPrice(s, it, 7, 3), Math.max(1, Math.floor(worth(it) * SELL_RATE * townRate(s, 'cloudsilver', 7, 3))));
  for (const b of [3, 4, 5, 6, 7]) {
    let sum = 0;
    for (let d = 1; d <= 400; d++) { const p = townPrice(s, it, b, d); sum += p; assert.ok(p <= worth(it) * SELL_RATE * 1.4 * 1.3 + 1, '가장 좋은 날의 가장 먼 곳도 제값의 73%까지다'); }
    assert.ok(sum / 400 < worth(it) * 0.6, `${b}구간: 고르게 보면 다리 장터의 가장 싼 값(제값의 70%)에 못 미친다`);
  }
});

test('M20-5 지나가는 지역의 위험도만큼 짐을 잃을 수 있다. 잃으면 짐과 짐꾼 삯이 사라진다. 호위를 붙이면 절반이고 그 용병은 닿을 때까지 곁에 없다 (GD-D5)', () => {
  assert.deepEqual([7, 6, 5, 4, 3].map((b) => Math.round(riskTo(b) * 100)), [15, 28, 40, 48, 53]);
  assert.deepEqual([7, 5].map((b) => Math.round(riskTo(b, { escort: true }) * 100)), [8, 20]);
  assert.deepEqual([CARAVAN.risk[7], CARAVAN.risk[5], CARAVAN.risk[4]], [0.15, 0.12, 0.08], '잠긴 도성·잿골·소금벌은 시안의 숫자');
  // 많이 보내 보면 지붕마을까지는 15%쯤, 호위를 붙이면 그 절반쯤을 잃는다
  const lostOf = (escort) => {
    let lost = 0;
    const s = trader(`risk-${escort}`);
    for (let i = 0; i < 400; i++) {
      s.silver = 5000; s.party = [];
      if (escort) withMercs(s, 'bawi');
      dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(s, 'goatwool', 1), n: 1 }], escort: escort ? 'bawi' : null });
      for (let k = 0; k < 30; k++) caravanWork(s, []);
      if (s.caravan.past[0].lost) lost++;
    }
    return lost / 400;
  };
  const [bare, guarded] = [lostOf(false), lostOf(true)];
  assert.ok(Math.abs(bare - 0.15) < 0.05, `호위 없이 ${bare}`);
  assert.ok(Math.abs(guarded - 0.075) < 0.04, `호위와 ${guarded}`);
  // 잃으면 짐도 삯도 돌아오지 않고, 우편도 오지 않는다
  const s = trader('lost');
  let no = 1; while (roll(s, no, 1) >= 0.15) no++;
  dispatch(s, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(s, 'goatwool', 5), n: 5 }] });
  s.caravan.load.no = no;
  const [silver, mails] = [s.silver, mailView(s).length];
  toil(s, 30);
  assert.deepEqual(s.caravan.past[0], { to: 7, lost: true, day: s.day });
  assert.deepEqual([s.silver, mailView(s).length, count(s, 'goatwool')], [silver, mails, 0]);
  assert.ok(s.log.some((l) => l.who === '상단' && l.text === '잠긴 도성의 길에서 짐을 잃었다. 짐꾼은 빈 지게로 돌아왔다.'));
  assert.deepEqual(caravanView(s).past[0], { from: '다릿목', to: '지붕마을', lost: true, silver: 0 });
  // 호위: 닿을 때까지 일행에서 빠지고, 닿으면(잃어도) 돌아온다. 그동안의 삯도 낸다
  const e = trader('escort');
  withMercs(e, 'bawi', 'seori');
  assert.deepEqual(caravanView(e).escorts.map((x) => x.name), ['방패잡이 바위', '창잡이 서리']);
  dispatch(e, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(e, 'goatwool', 5), n: 5 }], escort: 'bawi' });
  assert.deepEqual(e.party.map((c) => c.id), ['seori']);
  assert.deepEqual([caravanView(e).load.escort, caravanView(e).load.risk], ['방패잡이 바위', 8]);
  // 나가 있는 동안에는 다시 구하지 못한다
  e.place = 'goathut';
  assert.equal(mercView(e).find((m) => m.id === 'bawi').why, '호위로 나가 있다');
  assert.throws(() => dispatch(e, { type: 'party', op: 'hire', id: 'bawi' }), /호위로 나가 있습니다/);
  e.place = 'bridgemarket';
  for (const c of [...e.party, e.caravan.load.escort]) c.paidDay = e.day - 5; // 첫날 삯은 구할 때 냈다. 며칠 지난 것으로 친다
  const before = e.silver;
  e.place = 'pilgriminn'; e.phase = 2; tend(e);
  dispatch(e, { type: 'act', id: 'room' });
  assert.equal(before - e.silver, 350 + 420 + 420, '방 값과, 곁의 서리와 호위 나간 바위의 하루 삯');
  toil(e, 30);
  assert.deepEqual(e.party.map((c) => c.id).sort(), ['bawi', 'seori']);
  assert.ok(texts(e).includes('바위가 돌아와 곁에 섰다.'));
  // 북 치는 이는 호위로 붙이지 못한다
  const d = trader('nodrum');
  withMercs(d, 'drummaru');
  assert.deepEqual(caravanView(d).escorts, []);
  assert.throws(() => dispatch(d, { type: 'caravan', op: 'send', to: 7, picks: [{ from: 'bag', index: put(d, 'goatwool', 1), n: 1 }], escort: 'drummaru' }), /호위로 붙일 수 있는 용병이 곁에 없습니다/);
});

test('M20-5 그곳 값은 숫자로 보이지 않고, 들은 소문만 적힌다 (GD-D2, GD-D7, GD-H4)', () => {
  const s = trader('rumor');
  put(s, 'goatwool', 10);
  assert.ok(caravanView(s).dests.every((d) => d.heard === '소문 없음'));
  // 창 어디에도 그곳의 값이 숫자로 나오지 않는다
  const prices = [3, 4, 5, 6, 7].map((b) => String(townPrice(s, { id: 'goatwool', grade: 0 }, b)));
  const shown = JSON.stringify(caravanView(s), (k, v) => (k === 'item' ? undefined : v));
  assert.ok(!/값|은화 \d/.test(shown.replace(/"fee":350/, '')));
  for (const d of caravanView(s).dests) assert.deepEqual(Object.keys(d).sort(), ['band', 'heard', 'region', 'risk', 'riskEscort', 'town', 'works']);
  void prices;
  // 순례자 숙소의 소문 게시판과 장터 어른에게서 듣는다
  s.place = 'pilgriminn';
  let heard = 0;
  for (let i = 0; i < 12; i++) { tend(s); const from = s.log.length; dispatch(s, { type: 'rumor' }); if (s.log.slice(from).some((l) => l.who === '숙소지기' && /짐꾼들이 그러는데, .+에서는 .+ (귀하다|흔하다|제값이라)더라\./.test(l.text))) heard++; }
  assert.equal(heard, 12);
  const v = caravanView(s);
  assert.ok(v.dests.some((d) => /(귀하다|흔하다|제값이라)고 들었다$/.test(d.heard)));
  assert.ok(!/\d/.test(v.dests.map((d) => d.heard).join('')), '들은 말에는 숫자가 없다');
  walk(s, 'bridgemarket');
  const from = s.log.length;
  talkTo(s, 'marketelder');
  assert.ok(s.log.slice(from).some((l) => l.who === '장터 어른' && /짐꾼들이 그러는데/.test(l.text)));
  // 들은 것은 그날 그곳의 값과 맞는다
  const h = Object.entries(s.caravan.heard)[0];
  const rate = townRate(s, h[1].id, Number(h[0]), h[1].day);
  assert.equal(h[1].tone, rate >= 1.15 ? 'rare' : rate <= 0.85 ? 'common' : 'flat');
  // 상단이 없는 사람에게는 그 줄이 없다
  const n = climbed('norumor', { at: 'pilgriminn' });
  dispatch(n, { type: 'rumor' });
  assert.ok(!texts(n).includes('짐꾼들이 그러는데'));
});

test('M20-5 18판 저장은 지금 판으로 올라온다: 상단은 없이. 일행이 둘이던 저장은 그대로 둘이다 (저장 판)', () => {
  assert.equal(SAVE_VERSION, 21);
  const s = climbed('v18', { at: 'goathut' });
  withMercs(s, 'parang', 'neoul');
  const old = JSON.parse(JSON.stringify(s));
  delete old.caravan; delete old.cloud; old.v = 18;
  const up = parseSave(JSON.stringify({ v: 18, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, 21);
  assert.equal(up.caravan, null);
  assert.deepEqual(up.cloud, { prayers: 0 });
  assert.deepEqual(up.party.map((c) => c.id), ['parang', 'neoul']);
  assert.equal(partyMax(up), 2);
  assert.equal(mercView(up)[0].why, '동료는 2명까지', '셋째 자리는 보이지 않는다');
  // 가는 짐과 호위가 있는 채로 저장했다 읽어도 같다
  const t = trader('roundtrip');
  withMercs(t, 'bawi');
  dispatch(t, { type: 'caravan', op: 'send', to: 5, picks: [{ from: 'bag', index: put(t, 'goatwool', 3), n: 3 }], escort: 'bawi' });
  const back = parseSave(serialize(t)).state;
  assert.deepEqual(back.caravan, t.caravan);
  assert.equal(caravanView(back).load.escort, '방패잡이 바위');
  // 다시 태어나면 상단은 남고 가던 짐은 없다
});

// ── M20-6 하늘 신전과 모신 종의 대사제 (GD-A10, LV-C8, LV-I3) ──
import { DUNGEONS } from '../src/data/dungeon.js';
import { normalAt } from '../src/data/bands.js';
import { MAIN, SUBS, HIDDENS, PRIEST, PRIEST_LINES, POND_ROAD_SAY } from '../src/data/quests.js';
import { mainView, subView, offersOf, hiddenView, questBook } from '../src/core/quests.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { hiddenSlots } from '../src/core/hidden.js';

/** 하늘 신전의 그 방에 선 사람(앞의 방들은 지나온 것으로 친다). */
const inTemple = (s, room) => {
  s.place = 'templeyard'; s.battle = null; s.choice = null;
  s.dungeon = { id: 'skytemple', room, prev: null, cleared: {}, rested: {}, alert: false };
  s.dmem.skytemple = s.dmem.skytemple || { seen: [], done: {}, nights: 0, keeper: null };
  s.dmem.skytemple.seen = Object.keys(DUNGEONS.skytemple.rooms);
  return s;
};
/** 지금 싸움을 한 대에 끝낸다. */
const finish = (s) => { tend(s); s.battle.hp = 1; return dispatch(s, { type: 'battle', choice: 'attack' }); };

test('M20-6 하늘 신전은 신전 뜰에서 든다. 전이 다섯이고 맨 안쪽에 대사제가 있다. 안에서는 바람이 불지 않는다 (GD-A10, GD-B3)', () => {
  const d = DUNGEONS.skytemple;
  assert.deepEqual([d.name, d.from, d.floors.length], ['하늘 신전', 'templeyard', 5]);
  const rooms = Object.values(d.rooms);
  assert.deepEqual(new Set(rooms.map((r) => r.floor)).size, 5);
  assert.deepEqual(rooms.filter((r) => r.kind === 'boss').map((r) => r.mon), ['bellpriest']);
  for (const r of rooms) { assert.ok(r.name && r.text, r.name); for (const e of r.exits) assert.ok(d.rooms[e], `${r.name} → ${e}`); if (r.mon) assert.equal(MONSTERS[r.mon].band, 8); }
  const s = climbed('enter', { at: 'templeyard' });
  assert.deepEqual(labels(s), ['탐색', '캐기', '기도', '신전으로 들어간다']);
  assert.ok(bodyView(s).wind, '뜰에는 바람이 분다');
  s.dex.mon.stonemonk = { seen: 9, won: 0, lost: 0 };
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'skytemple' });
  assert.ok(texts(s).includes(d.enterSay));
  assert.equal(bodyView(s).wind, null, '신전 안에서는 바람 칸이 없다');
  assert.equal(windNow(s), null);
  // 안의 싸움에는 바람이 걸리지 않는다
  const b = silvered(inTemple(climbed('calm-in'), 't1-hall'));
  for (const wind of ['tail', 'head', 'side']) {
    blow(b, wind, windAt);
    b.battle = null; startBattle(b, [], 'stonemonk');
    for (let i = 0; i < 30; i++) { b.battle.hp = 999999; b.battle.intent = i % 2 ? 'charge' : 'hit'; b.hp = valueOf(b, 'maxHp'); b.tick = 0; tend(b); dispatch(b, { type: 'battle', choice: 'attack' }); assert.ok(!b.battle.pushed && !b.battle.late); }
  }
  assert.ok(!texts(b).includes(CLOUD_LINES.again));
  // 안문은 공양 창고의 열쇠로 연다
  assert.equal(d.rooms['t4-door'].door.key, 'templekey');
  assert.ok(d.rooms['t2-store'].loot.items.some(([id]) => id === 'templekey'));
  assert.ok(ITEMS.templekey);
});

test('M20-6 모신 종의 대사제(80): 보통 몬스터의 생명력 4배·공격력 1.25배. 쓰러뜨리면 11장이 끝난다 (LV-I3, GD-E3)', () => {
  const m = MONSTERS.bellpriest, n = normalAt(80);
  assert.deepEqual([m.name, m.level, m.boss, m.band], ['모신 종의 대사제', 80, true, 8]);
  assert.deepEqual([m.hp, m.attack, m.defense], [n.hp * 4, Math.round(n.attack * 1.25), n.defense]);
  assert.deepEqual(m.moves.map((x) => x.kind).sort(), ['charge', 'hit', 'wait']);
  const s = silvered(inTemple(climbed('boss'), 't4-masks'));
  s.dungeon.cleared['t4-masks'] = true;
  assert.equal(s.main.chapter, 11);
  dispatch(s, { type: 'room', to: 't5-bell' });
  assert.equal(s.battle?.mon, 'bellpriest', '들어서면 바로 싸운다');
  finish(s);
  assert.equal(s.dmem.skytemple.keeper, 'beat');
  assert.ok(texts(s).includes(DUNGEONS.skytemple.bossDown));
  assert.deepEqual(s.main.done.at(-1), { chapter: 11, path: 'beat', day: s.day });
  assert.equal(s.main.called, '가면을 벗긴 이');
  assert.ok(texts(s).includes('대사제의 가면이 떨어졌다. 그 뒤에 지친 얼굴이 있었다. "나도… 못 들었네. 사십 년을." 문이 저절로 열렸다. 종소리가 다리 끝까지 흘러 나갔고, 무릎 꿇은 사람들이 고개를 들었다.'));
});

// ── M20-7 11장 모신 종, 일행 셋 (GD-E, GD-G5, GD-H5, GD-H6, LV-D11, LV-H5) ──

test('M20-7 11장 모신 종: 퀘스트 창의 글과 푸는 길 셋. 미루를 동료로 들인 적이 없으면 함께 여는 길은 "???"다 (GD-E, GD-G5)', () => {
  const s = climbed('ch11');
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [11, '모신 종']);
  assert.equal(v.text, '구름다리의 사제들은 종을 신이라 부른다. 금칠한 문 안에 모셔 두고, 닦은 귀에만 들린다고 가르친다. 문밖의 사람들은 평생 기도하며 들리기를 기다린다. 아랫마을 미루의 신전이 여기서 갈라져 나왔다.');
  assert.deepEqual(v.paths.map((p) => p.name), ['쓰러뜨리는 길', '스스로 듣는 길', '???']);
  assert.deepEqual(v.paths[2], { id: 'open', name: '???', text: '', have: 0, need: 1, closed: '아직 모르는 길', ratio: -1, unknown: true });
  assert.ok(!JSON.stringify(v).includes('미루를 동료로'), '조건이 새지 않는다');
  assert.deepEqual(v.paths.slice(0, 2).map((p) => p.text), ['하늘 신전 맨 안쪽의 대사제를 쓰러뜨린다', '기도 숙련도를 달인까지 올린다. 문밖에서 종이 답한다']);
  // 미루를 한 번이라도 들인 사람에게는 보인다
  s.flags.hadMiru = true;
  const w = mainView(s).paths[2];
  assert.deepEqual([w.name, w.text, w.need], ['함께 여는 길', "미루를 동료로 데려와, '가족 같은' 사이로 문 앞에 선다", 4]);
  // 들이는 순간 표가 선다
  const j = ended('join');
  j.people.miru = { pts: BONDS[4].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  j.place = PEOPLE.miru.place;
  dispatch(j, { type: 'party', op: 'ask', npc: 'miru' });
  assert.equal(j.flags.hadMiru, true);
  // 옛 저장: 미루가 곁에 있던 사람, 따라나선 날이 일지에 남은 사람
  const old = JSON.parse(JSON.stringify(withMercs(climbed('oldmiru'), 'miru')));
  delete old.flags.hadMiru; old.v = 18; delete old.caravan; delete old.cloud;
  assert.equal(parseSave(JSON.stringify({ v: 18, rev: 1, savedAt: 1, state: old })).state.flags.hadMiru, true);
  assert.deepEqual(Object.keys(MAIN[11].paths.map((p) => p.called).reduce((a, c) => ({ ...a, [c]: 1 }), {})).length, 3, '부르는 이름이 다 다르다');
});
import { ended } from './_white.js';

test('M20-7 스스로 듣는 길: 기도 숙련도가 달인이 되면 문밖에서 종이 답한다 (GD-E4)', () => {
  const s = climbed('hear', { at: 'templedoor' });
  s.skills.pray = { grade: 26, xp: 0 };
  tend(s); dispatch(s, { type: 'act', id: 'pray' });
  if ((s.skills.pray.grade || 0) < 27) { assert.equal(s.main.chapter, 11, '달인이 되기 전에는 끝나지 않는다'); s.skills.pray.grade = 27; tend(s); dispatch(s, { type: 'act', id: 'pray' }); }
  assert.deepEqual(s.main.done.at(-1), { chapter: 11, path: 'hear', day: s.day });
  assert.equal(s.main.called, '문밖에서 들은 이');
  assert.ok(texts(s).includes('띠링. 문밖에서, 문지기의 눈앞에서 울렸다. 고요가 입을 벌렸다. "문이 닫혀 있는데." 닫힌 문은 아무것도 막지 못하고 있었다. 처음부터.'));
  assert.deepEqual(mainView(climbed('prog')).paths[1].need, 27);
  // 다른 데서 올린 기도로는 끝나지 않는다(문 앞이어야 한다)
  const o = climbed('elsewhere', { at: 'templeyard' });
  o.skills.pray = { grade: 30, xp: 0 };
  o.phase = 0; tend(o); dispatch(o, { type: 'act', id: 'pray' }); settle(o);
  assert.equal(o.main.chapter, 11);
});

test("M20-7 함께 여는 길: 미루를 동료로 데려와 '가족 같은' 사이로 문 앞에 선다 (GD-E5, GD-H5)", () => {
  const s = climbed('open', { at: 'templedoor' });
  assert.ok(!labels(s).includes('문 앞에 선다'), '미루가 곁에 없으면 칸도 없다');
  assert.throws(() => dispatch(s, { type: 'opendoor' }), /미루가 곁에/);
  withMercs(s, 'miru');
  s.flags.hadMiru = true;
  s.people.miru = { pts: BONDS[3].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  const slot = slots(s).find((x) => x.label === '문 앞에 선다');
  assert.ok(slot.disabled && /가족 같은/.test(slot.why));
  assert.throws(() => dispatch(s, { type: 'opendoor' }), /가족 같은/);
  assert.equal(mainView(s).paths[2].have, 3, '미루가 곁에 있으면 사이가 칸으로 찬다');
  s.people.miru.pts = BONDS[4].at;
  assert.ok(!slots(s).find((x) => x.label === '문 앞에 선다').disabled);
  dispatch(s, { type: 'opendoor' });
  assert.deepEqual(s.main.done.at(-1), { chapter: 11, path: 'open', day: s.day });
  assert.equal(s.main.called, '문을 열어 둔 이');
  assert.ok(texts(s).includes('미루가 문에 손을 댔다. "신의 목소리가 아니었어요. 그래도 저는 여기 있을래요. 듣고 싶은 사람이 들을 수 있게, 문을 열어 두는 사람으로." 문이 열렸다.'));
  assert.ok(!labels(s).includes('문 앞에 선다'));
  // 다른 곳에서는 설 수 없다
  const far = climbed('faropen', { at: 'bridgegate' });
  withMercs(far, 'miru'); far.people.miru = { pts: BONDS[4].at, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  assert.throws(() => dispatch(far, { type: 'opendoor' }), /신전 문 앞/);
});

test('M20-7 11장을 끝내면 별못 길이 열리고(길만) 일행이 셋이 된다. 그 전에는 "셋"이 어디에도 나오지 않는다 (GD-H6, LV-H5)', () => {
  const s = climbed('three', { at: 'goathut' });
  s.silver = 9000;
  dispatch(s, { type: 'party', op: 'hire', id: 'seori' });
  dispatch(s, { type: 'party', op: 'hire', id: 'bawi' });
  assert.equal(partyMax(s), 2);
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'drummaru' }), /2명까지/);
  assert.ok(!JSON.stringify([mercView(s), mercSeats(s), partyView(s), mainView(s), slots(s)]).match(/3명|셋까지|\(2 \/ 3\)/));
  // 11장을 끝낸다(쓰러뜨리는 길)
  inTemple(s, 't4-masks'); s.dungeon.cleared['t4-masks'] = true;
  silvered(s);
  dispatch(s, { type: 'room', to: 't5-bell' });
  finish(s);
  assert.equal(s.main.chapter, 12);
  assert.ok(s.opened.includes('pondroad'));
  const ding = s.dings.find((d) => d.title.includes("11장 '모신 종'"));
  assert.ok(ding.body.includes('별못으로 내려가는 길이 열렸습니다. 이제 동료를 셋까지 둡니다.'));
  // 별못이 났다 (M21): 퀘스트 창에는 12장이 오고, 지도에 맞울이 나온다
  assert.equal(mainView(s).name, '깨진 종');
  assert.ok(!mainView(s).text.includes(POND_ROAD_SAY));
  assert.ok(JSON.stringify(mapView(s)).includes('맞울'));
  // 셋째 자리
  s.dungeon = null; s.battle = null; s.place = 'goathut';
  assert.equal(partyMax(s), 3);
  assert.deepEqual(mercSeats(s), { n: 2, max: 3, note: '' });
  dispatch(s, { type: 'party', op: 'hire', id: 'drummaru' });
  assert.deepEqual(s.party.map((c) => c.id), ['seori', 'bawi', 'drummaru']);
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'suri' }), /3명까지/);
  assert.deepEqual(mercSeats(s), { n: 3, max: 3, note: '' });
  // 셋을 둔 채 저장했다 읽어도 같다
  const back = parseSave(serialize(s)).state;
  assert.deepEqual(back.party.map((c) => c.id), ['seori', 'bawi', 'drummaru']);
  // 셋이 함께 싸운다: 서리는 치고, 바위는 막고, 마루의 북이 울린다
  s.place = 'cliffroad';
  startBattle(s, [], 'cloudgoat');
  assert.equal(bodyView(s).drum.name, '북소리');
  let n = 0;
  while (s.battle && n++ < 80) { tend(s); s.tick = 0; dispatch(s, { type: 'battle', choice: s.battle.intent === 'charge' ? 'defend' : 'attack' }); }
  assert.ok(texts(s).includes('서리가 쳤다'));
  // 지난 삶에서 11장을 끝낸 사람도 셋이다(건너뛴 장도 끝낸 장이다)
  const past = climbed('past');
  past.main.past = [{ chapter: 11, path: 'hear' }];
  assert.equal(partyMax(past), 3);
});

// ── M20-8 서브 둘과 히든 (GD-E6, GD-E7, LV-E8) ──

test('M20-8 서브 "다리 고치는 이들": 구름은 덩이 서른과 염소털 스물을 대 주면 벼랑길에서 옆바람에 밀려나지 않는다 (GD-E6)', () => {
  const s = climbed('menders', { at: 'bridgegate' });
  talkTo(s, 'bridgeman');
  assert.ok(offersOf(s, 'bridgeman').includes('bridgemenders'));
  dispatch(s, { type: 'quest', op: 'accept', id: 'bridgemenders' });
  assert.throws(() => dispatch(s, { type: 'quest', op: 'choose', id: 'bridgemenders', choice: 'give' }));
  give(s, 'cloudsilver', 30); give(s, 'goatwool', 20);
  dispatch(s, { type: 'quest', op: 'choose', id: 'bridgemenders', choice: 'give' });
  assert.ok(s.quests.bridgemenders.done);
  assert.deepEqual([count(s, 'cloudsilver'), count(s, 'goatwool'), s.flags.planksFixed], [0, 0, true]);
  // 다 고친 뒤의 벼랑길: 옆바람에 큰 공격을 맞아도 밀려나지 않는다
  silvered(s); s.place = 'cliffroad'; blow(s, 'side', windAt);
  const lines = oneTurn(s, 'charge');
  assert.ok(lines.some((l) => l.text === CLOUD_LINES.held));
  assert.ok(!s.battle.pushed);
  assert.ok(oneTurn(s, 'hit').some((l) => /내리쳤다/.test(l.text)), '다음 턴을 잃지 않는다');
  // 신전 뜰의 옆바람은 그대로다
  s.battle = null; s.place = 'templeyard'; blow(s, 'side', windAt);
  oneTurn(s, 'charge');
  assert.equal(s.battle.pushed, true);
  // 끼어들지 않은 사람의 다리는 그대로다
  const n = climbed('nomend', { at: 'bridgegate' });
  talkTo(n, 'bridgeman');
  dispatch(n, { type: 'quest', op: 'accept', id: 'bridgemenders' });
  dispatch(n, { type: 'quest', op: 'choose', id: 'bridgemenders', choice: 'none' });
  assert.ok(!n.flags.planksFixed);
});

test('M20-8 서브 "견습 사제의 의심": 염소 치기 쉰 번. 한 번 누르면 한 번이고, 일로 친다 (GD-E7)', () => {
  const s = climbed('herd', { at: 'templedoor' });
  assert.ok(!labels(climbed('noherd', { at: 'goathut' })).includes('염소 치기'), '받기 전에는 칸이 없다');
  talkTo(s, 'novice');
  dispatch(s, { type: 'quest', op: 'accept', id: 'novicedoubt' });
  assert.throws(() => dispatch(s, { type: 'herd' }), /염소치기 움막/);
  walk(s, 'goathut');
  assert.deepEqual(slots(s).find((x) => x.label === '염소 치기').sub, '0 / 50');
  s.flags.dayWork = 0;
  for (let i = 1; i <= 49; i++) { tend(s); s.tick = 0; s.phase = 0; dispatch(s, { type: 'herd' }); assert.equal(s.quests.novicedoubt.count, i, '한 번에 하나'); }
  assert.equal(s.flags.dayWork, 49, '일로 친다');
  assert.ok(texts(s).includes(PRIEST_LINES.herdHalf));
  tend(s); dispatch(s, { type: 'herd' });
  assert.equal(s.quests.novicedoubt.step, 'back');
  assert.ok(texts(s).includes(PRIEST_LINES.herdDone));
  assert.ok(!labels(s).includes('염소 치기'));
  assert.throws(() => dispatch(s, { type: 'herd' }), /칠 염소가 없습니다/);
  walk(s, 'templedoor');
  dispatch(s, { type: 'quest', op: 'choose', id: 'novicedoubt', choice: 'done' });
  assert.ok(s.quests.novicedoubt.done);
  assert.ok(texts(s).includes('울렸어요. 띠링, 하고. 문 안이 아니라 제 귀 바로 옆에서요.'));
});

test('M20-8 히든 "듣지 못한 기도": 구름다리에서 올린 답 없는 기도 삼백 번. 조건은 화면과 도움말 어디에도 나오지 않는다 (LV-E8)', () => {
  const s = climbed('unheard', { at: 'templedoor' });
  s.skills.pray = { grade: 0, xp: 0 };
  s.cloud.prayers = 298;
  s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.cloud.prayers, 299);
  assert.ok(!s.hq.unheard, '이백아흔아홉 번으로는 나타나지 않는다');
  s.skills.pray.grade = 0; tend(s); dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.hq.unheard?.status, 'offered');
  assert.ok(s.dings.some((d) => d.reason === HIDDENS.unheard.why || JSON.stringify(d).includes(HIDDENS.unheard.why)));
  dispatch(s, { type: 'choose', id: 'accept' });
  talkTo(s, 'novice');
  assert.equal(s.hq.unheard.status, 'done');
  assert.ok(texts(s).includes(HIDDENS.unheard.done));
  // 신전 뜰의 기도도 센다. 다른 지역의 기도는 세지 않는다
  const y = climbed('yardpray', { at: 'templeyard' });
  y.phase = 0; tend(y); dispatch(y, { type: 'act', id: 'pray' }); settle(y);
  assert.equal(y.cloud.prayers, 1);
  const o = climbed('otherpray', { at: 'belltop' });
  o.phase = 0; tend(o); dispatch(o, { type: 'act', id: 'pray' });
  assert.equal(o.cloud.prayers, 0);
  // 스스로 듣는 길로 11장을 끝낸 뒤의 기도는 세지 않는다. 다른 길로 끝낸 사람의 기도는 센다
  const h = climbed('afterhear', { at: 'templedoor' });
  h.main.done.push({ chapter: 11, path: 'hear', day: 1 }); h.main.chapter = 12;
  h.phase = 0; tend(h); dispatch(h, { type: 'act', id: 'pray' });
  assert.equal(h.cloud.prayers, 0);
  const b = heard('afterbeat', { at: 'templedoor' });
  b.phase = 0; tend(b); dispatch(b, { type: 'act', id: 'pray' });
  assert.equal(b.cloud.prayers, 1);
  // 조건(삼백, 기도 수)은 어디에도 나오지 않는다
  const fresh = climbed('hide', { at: 'templedoor' });
  fresh.cloud.prayers = 120;
  const shown = JSON.stringify([bodyView(fresh), slots(fresh), mainView(fresh), questBook(fresh), hiddenSlots(fresh), HELP, HELP_MORE]);
  assert.ok(!/듣지 못한 기도|삼백|300|120/.test(shown.replace(/"(silver|xp|price|hp|maxHp|carry|weight)":\d+/g, '')), '조건이 새지 않는다');
});

test('M20 가 본 뒤에야 생기는 도움말: 바람은 구름다리에 가 본 뒤, 북 치는 이는 움막에 가 본 뒤, 셋째 자리는 11장을 끝낸 뒤, 상단은 깃발을 산 뒤 (GD-G)', () => {
  const all = (seen) => HELP.flatMap((t) => helpBody(t, seen)).join(' / ');
  const before = all({ white: true, salt: true, stall: true, reborn: true, ash: true, hot: true, marsh: true, shop: true, sunken: true, escort: true });
  assert.ok(!/뒷바람|맞바람|옆바람|깃발 보기|북 치는|북소리|북돋는|상단|짐꾼|동료를 셋까지/.test(before));
  assert.ok(/뒷바람/.test(all({ cloud: true })) && !/북소리|상단|동료를 셋까지/.test(all({ cloud: true })));
  assert.ok(/북소리/.test(all({ bard: true })));
  assert.ok(/동료를 셋까지/.test(all({ three: true })));
  assert.ok(/상단/.test(all({ caravan: true })) && /쉬거나 자는 동안에는 가지 않습니다/.test(all({ caravan: true })));
});
