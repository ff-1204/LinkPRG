// M21 서로 답하는 못: 별못(레벨 81~90). 곳, 구간 용병과 고루 갖춘 일행, 읽힘, 못의 거울상, 지켜보기, 별 떨어진 자리, 12장 깨진 종, 서브와 히든, 견습 셋째 자리.
// 기준: systems.md "19차: 별못 화면"(BM-), roadmap.md M21-1 ~ M21-11. 여정은 journey-pond.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, slotsNow as slots, mapView, bodyView, roomFee, POND_FIRST } from '../src/core/game.js';
import { rumorsView } from '../src/core/world.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS, INCIDENTS } from '../src/data/wild.js';
import { ITEMS } from '../src/data/items.js';
import { PEOPLE, CALLS, WATCHED } from '../src/data/people.js';
import { JOBS as BOARD } from '../src/data/quests.js';
import { RECIPES } from '../src/data/recipes.js';
import { MONSTERS } from '../src/data/monsters.js';
import { shopView } from '../src/core/trade.js';
import { boardView } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { DAON_FIRST, DAON_FIRST_SEEN } from '../src/core/pond.js';
import { travel } from './_white.js';
import { count } from './_salt.js';
import { tend, settle } from './_marsh.js';
import { climbed, heard } from './_cloud.js';
import { ponded } from './_pond.js';

const texts = (s) => s.log.map((l) => l.text).join('\n');
const labels = (s) => slots(s).map((x) => x.label.replace(/ \(.*/, ''));
const make = (s, recipe) => {
  for (const n of RECIPES[recipe].needs) addItem(s, n.id, n.n);
  dispatch(s, { type: 'craft', recipe });
  let n = 0;
  while (s.craft && n++ < 80) { tend(s); dispatch(s, { type: 'hammer' }); }
};

// ── M21-1 곳 (BM-A, BM-G1) ──

test('M21-1 11장을 끝내기 전에는 별못이 지도·소문·다릿목의 칸 어디에도 없다 (BM-G1)', () => {
  const s = climbed('nopond');
  const rows = mapView(s);
  for (const id of ['echogate', 'pondside', 'starfield']) assert.ok(!rows.some((r) => r.id === id), `${id}가 지도에 있다`);
  assert.ok(!JSON.stringify(rows).match(/맞울|못 둘레|별 떨어진 벌|별못/));
  assert.ok(!JSON.stringify(rumorsView(s)).match(/맞울|별못/));
  assert.ok(!slots(s).some((x) => x.label === '별못으로 내려간다'));
  for (const to of ['echogate', 'pondside', 'starfield']) assert.throws(() => dispatch(s, { type: 'travel', to }), /아직 길을 모릅니다/);
  assert.equal(bodyView(s).read ?? null, null, '읽힘 칸도 없다');
});

test('M21-1 11장을 끝내면 다릿목 어귀에서 별못으로 내려가 맞울 어귀에 닿는다. 하루 길이다 (BM-A1, BM-E2)', () => {
  const s = heard('down', { at: 'bridgegate' });
  assert.equal(mapView(s).find((r) => r.id === 'echogate').name, '맞울');
  assert.deepEqual(slots(s).find((x) => x.label === '별못으로 내려간다').action, { type: 'travel', to: 'echogate' });
  const tick = s.day * 150 + s.phase * 50 + s.tick;
  travel(s, 'echogate');
  assert.ok(s.day * 150 + s.phase * 50 + s.tick - tick >= 50, '하루 길');
  assert.equal(POND_FIRST[0], '구름 아래로 내려서자 둥근 못이 있었다. 밤인데 물이 밝다. 못가에서 사람들이 일하고 있고, 그 곁마다 누가 앉아 있다. 종소리는 없다. 대신 여기저기서 낮은 말소리가 났다. 같은 말이었다.');
  assert.ok(texts(s).includes(POND_FIRST[0]) && texts(s).includes(POND_FIRST[1]));
  // 마당지기 다온과 처음 만난다 (BM-E1)
  for (const [, text] of DAON_FIRST) assert.ok(texts(s).includes(text), text);
  assert.deepEqual(s.log.filter((l) => DAON_FIRST.some((g) => g[1] === l.text)).map((l) => l.who || '나'), ['마당지기 다온', '마당지기 다온', '나', '마당지기 다온', '마당지기 다온']);
  assert.equal(DAON_FIRST[4][1], '그래도 종은 "봤어"라고는 안 했잖아. 그냥 울었지.');
  travel(s, 'bridgegate'); travel(s, 'echogate');
  assert.equal(s.log.filter((l) => l.text === POND_FIRST[0]).length, 1, '처음 한 번만');
  assert.equal(s.log.filter((l) => l.text === DAON_FIRST[0][1]).length, 1);
  assert.equal(bodyView(s).read ?? null, null, '맞울에서는 읽힘 칸이 없다 (BM-G2)');
});

test('M21-1 1부의 숨은 끝을 본 사람에게는 다온의 첫마디가 다르다 (BM-E1)', () => {
  const s = heard('seen', { at: 'bridgegate' });
  s.ending = 'hidden';
  travel(s, 'echogate');
  assert.ok(texts(s).includes(DAON_FIRST_SEEN));
  assert.ok(!texts(s).includes(DAON_FIRST[0][1]), '여느 첫마디는 나오지 않는다');
  assert.ok(texts(s).includes(DAON_FIRST[1][1]), '그 뒤는 같다');
});

test('M21-1 맞울의 방 여섯과 사냥터 둘. 못 둘레에서 별가루 나방을 만난다 (BM-A2~A9)', () => {
  assert.deepEqual(TOWNS['맞울'].order, ['echogate', 'answeryard', 'starforge', 'silkhouse', 'pondshrine', 'pondinn']);
  for (const id of [...TOWNS['맞울'].order, 'pondside', 'starfield']) {
    const p = PLACES[id];
    assert.equal(p.band, 9, id);
    assert.ok(p.room && p.stripAlt && p.strip.day && p.strip.night, id);
  }
  const want = {
    echogate: ['둘러보기'], answeryard: ['지켜보기', '게시판'], starforge: ['만들기', '상점', '고치기', '강화'],
    silkhouse: ['바느질', '상점', '용병'], pondshrine: ['기도', '상점'], pondinn: ['방 빌리기', '보관함', '요리', '소문 게시판'],
  };
  for (const [id, list] of Object.entries(want)) assert.deepEqual(labels(ponded(`at-${id}`, { at: id })), list, id);
  assert.equal(PLACES.echogate.room, '둥근 못을 둘러 집들이 서 있다. 물빛이 밤에도 밝다. 집마다 문이 열려 있다.');
  assert.equal(PLACES.answeryard.room, '마당 여기저기서 사람들이 제 일을 한다. 그물 깁는 이, 돌 쌓는 이, 글씨 쓰는 아이. 곁에 꼭 한 사람씩 앉아 보고 있다.');
  assert.equal(PLACES.pondside.room, '못물에 비친 내가 먼저 움직인다. 나는 아직 움직이지 않았다.');
  assert.ok(PLACES.starforge.room.startsWith('밤에만 불을 땐다. 별쇠는 어두워야 빛을 보고 두드릴 수 있다.'));
  assert.deepEqual([PLACES.pondside.levels, PLACES.starfield.levels, PLACES.pondside.mirror, PLACES.starfield.mirror, !!PLACES.echogate.mirror], ['81~84', '85~88', true, true, false]);
  assert.deepEqual(WILDS.pondside.monsters.map((m) => m.id), ['starmoth', 'pondmirror']);
  assert.deepEqual(WILDS.starfield.monsters.map((m) => m.id), ['starshard', 'voidecho']);
  assert.deepEqual([MONSTERS.starmoth.level, MONSTERS.pondmirror.level, MONSTERS.starshard.level, MONSTERS.voidecho.level], [81, 83, 86, 88]);
  assert.equal(WILDS.pondside.meets[0], '같은 것만 누르면 안 돼요. 막기 한 번 섞으세요');
  assert.ok(INCIDENTS.pondside.length >= 2 && INCIDENTS.starfield.length >= 2);
  // 못 둘레에서 탐색하면 별가루 나방이나 못의 거울상을 만난다
  const s = ponded('meet', { at: 'pondside' });
  for (let i = 0; i < 80 && !(s.dex.mon.starmoth?.seen); i++) { s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'explore' }); settle(s); }
  assert.ok(s.dex.mon.starmoth.seen > 0);
  // 캐면 별가루와 나방 비단이 나온다. 별 떨어진 벌에서는 별쇠와, 드물게 종 조각
  for (let i = 0; i < 60; i++) { s.tick = 0; s.phase = 0; tend(s); dispatch(s, { type: 'act', id: 'dig' }); settle(s); }
  assert.ok(count(s, 'stardust') > 0 && count(s, 'mothsilk') > 0);
  const y = ponded('field', { at: 'starfield' });
  for (let i = 0; i < 200; i++) { y.tick = 0; y.phase = 0; tend(y); dispatch(y, { type: 'act', id: 'dig' }); settle(y); }
  assert.ok(count(y, 'starmetal') > 0 && count(y, 'bellshard') > 0);
  assert.ok(WILDS.starfield.gather.drops.some((d) => d.id === 'bellshard'));
});

test('M21-1 별 대장간·비단 집·못가 사당의 가게, 별빛 성수 380, 못가 주막(방 570), 다시 태어나기, 게시판, 맞울 사람들. 별쇠 검을 지으면 대장 10단계가 열린다 (BM-A3~A7, BM-H6, LV-F9)', () => {
  const goods = (at) => shopView(ponded(`shop-${at}`, { at })).goods;
  const names = (at) => goods(at).map((g) => g.name);
  assert.ok(names('starforge').includes('별쇠 덩이'));
  assert.ok(names('silkhouse').includes('나방 비단') && names('silkhouse').includes('별가루'));
  assert.ok(names('pondshrine').includes('별빛 성수') && names('pondshrine').includes('깊은 성수'));
  assert.equal(ITEMS.starholy.price, 380);
  const inn = ponded('inn', { at: 'pondinn' });
  assert.equal(roomFee(inn), 570);
  assert.ok(PLACES.pondinn.storage && PLACES.pondinn.kitchen);
  // 다시 태어나기는 12장을 끝낸 사람에게만 (SB-E1)
  assert.ok(!labels(ponded('noreborn', { at: 'pondshrine' })).includes('다시 태어나기'));
  const done = ponded('reborn', { at: 'pondshrine' });
  done.main.done.push({ chapter: 12, path: 'gather', day: 120 }); done.main.chapter = 13;
  assert.ok(labels(done).includes('다시 태어나기'));
  // 게시판: 사냥 넷, 가져오는 일 셋
  const b = ponded('board', { at: 'answeryard' });
  const ids = Object.entries(BOARD).filter(([, d]) => d.at === 'pond').map(([id]) => id);
  assert.equal(ids.length, 7);
  assert.ok(boardView(b).length > 0 && boardView(b).every((c) => ids.includes(c.id)));
  for (const id of ids) { const d = BOARD[id]; assert.ok(d.minLevel >= 81, id); if (d.kind === 'bring') assert.ok(d.silver < ITEMS[d.item].price * d.n, id); else assert.equal(MONSTERS[d.mon].band, 9, id); }
  // 맞울 사람 열셋: 다온, 솔, 가게 셋과 주막, 그리고 마당의 일곱
  const here = Object.values(PEOPLE).filter((x) => PLACES[x.place]?.town === '맞울');
  assert.equal(here.length, 13);
  for (const x of here) assert.ok(x.hello.length === 5 && x.talk.length >= 3 && CALLS[x.id], x.id);
  assert.deepEqual([PEOPLE.daon.name, PEOPLE.dallae.name, PEOPLE.sol.name], ['마당지기 다온', '그물 깁는 달래', '조각 줍는 솔']);
  assert.equal(WATCHED.length, 7);
  for (const id of WATCHED) assert.equal(PEOPLE[id].place, 'answeryard', id);
  // 승급작: 별 대장간에서 짓는 대장의 승급작은 별쇠 검 (LV-F9)
  assert.equal(RECIPES.starmetal_sword.name, '별쇠 검');
  const c = ponded('promo', { at: 'starforge' });
  c.craftLv.smith = { lv: 36, xp: 0 }; c.craftTier.smith = 9;
  assert.ok(RECIPES.starmetal_sword.promo);
  make(c, 'starmetal_sword');
  assert.equal(c.craftTier.smith, 10);
});

// ── M21-6 답하는 마당: 지켜보기 (BM-D, BM-G4, BM-H4, BM-H5) ──
import { WATCH, WORKERS, watchTarget, answeredPeople } from '../src/core/pond.js';
import { bondOf } from '../src/core/social.js';
import { noticesView } from '../src/core/world.js';
import { walk } from './_white.js';

/** 지켜보기를 n번 누른다(때가 넘어가도 깨어 있게 몸을 돌본다). */
const watch = (s, n = 1) => { for (let i = 0; i < n; i++) { tend(s); dispatch(s, { type: 'act', id: 'witness' }); } };
const yard = (seed) => ponded(seed, { at: 'answeryard' });

test('M21-6 지켜보기: 한 번 누르면 한 번, 사람마다 서른 번. 끝까지 본 뒤에만 "봤다고 말한다"가 나온다 (BM-D1~D3, BM-G4)', () => {
  const s = yard('watch');
  assert.deepEqual([WATCH.n, WATCH.each], [30, 3]);
  assert.equal(watchTarget(s), 'dallae');
  assert.deepEqual([slots(s)[0].label, slots(s)[0].sub], ['지켜보기', '달래의 그물']);
  assert.ok(!JSON.stringify(slots(s)).includes('봤다고 말한다'), '끝까지 보기 전에는 없다');
  assert.throws(() => dispatch(s, { type: 'saw' }), /끝까지 지켜본 일이 없습니다/);
  watch(s, 17);
  assert.equal(s.pond.watch.dallae.n, 17);
  assert.equal(s.log.filter((l) => l.text.includes('곁에 앉아 지켜보았다')).length, 17, '한 번에 한 번');
  assert.ok(texts(s).includes('그물 깁는 노인 곁에 앉아 지켜보았다. (17 / 30)'));
  assert.ok(s.log.some((l) => l.who === '그물 깁는 달래' && l.text === '아직 멀었어. 그래도 누가 보고 있으니 손이 덜 떨리네.'));
  // 중간에 자리를 떠도 센 것은 남는다
  walk(s, 'echogate'); walk(s, 'answeryard');
  assert.equal(s.pond.watch.dallae.n, 17);
  watch(s, 13);
  assert.ok(texts(s).includes('달래가 마지막 코를 꿰었다.') && texts(s).includes('끝까지 지켜보았다. 말해 줄 수 있다.'));
  assert.deepEqual([slots(s)[0].label, slots(s)[0].action], ['봤다고 말한다', { type: 'saw' }]);
  assert.ok(!labels(s).includes('지켜보기'));
  assert.throws(() => dispatch(s, { type: 'act', id: 'witness' }), /먼저 봤다고 말해 준다/);
  // 봤다고 말한다: 띠링 대신 사람이 답하고, 세계 공지에 한 줄이 오른다
  const dings = s.dings.length;
  dispatch(s, { type: 'saw' });
  assert.ok(texts(s).includes('"봤어요. 다 하신 거."'));
  assert.ok(s.log.some((l) => l.who === '그물 깁는 달래' && l.text === '…그래. 봤구나. 그럼 된 거지.'));
  assert.ok(s.log.some((l) => l.who === '세계 공지' && l.text === "'그물 깁는 달래'가 그물 하나를 끝까지 기웠습니다. 본 사람: 나."));
  assert.ok(noticesView(s).some((n) => n.mine && n.text.startsWith("'그물 깁는 달래'가 그물 하나를 끝까지 기웠습니다.")));
  assert.equal(s.dings.length, dings, '띠링은 울리지 않는다(사이가 오르는 띠링이 아니면)');
  assert.deepEqual([s.pond.watch.dallae.done, s.pond.watch.dallae.n, s.pond.watch.dallae.ready], [1, 0, false]);
  assert.equal(answeredPeople(s), 1);
  // 그 사람은 다음 일을 꺼낸다
  assert.deepEqual([slots(s)[0].label, slots(s)[0].sub], ['지켜보기', '달래의 찌']);
});

test('M21-6 지켜보기는 한 번에 한 사람이다. 마당에서 말을 건 사람 곁에 앉는다. 사이가 오른다 (BM-D3, BM-D4)', () => {
  const s = yard('sit');
  watch(s, 4);
  dispatch(s, { type: 'greet', npc: 'hangyeol' });
  assert.equal(slots(s)[0].sub, '한결의 담');
  watch(s, 6);
  assert.deepEqual([s.pond.watch.dallae.n, s.pond.watch.hangyeol.n], [4, 6], '사람마다 따로 센다');
  dispatch(s, { type: 'greet', npc: 'dallae' });
  assert.equal(slots(s)[0].sub, '달래의 그물');
  // 지켜본 세 번에 사이 +1, 답해 주면 +10
  const b = yard('bond');
  const before = b.people.dallae?.pts || 0;
  watch(b, 30);
  const mid = b.people.dallae.pts - before;
  assert.ok(mid >= 10, '지켜본 세 번에 +1');
  dispatch(b, { type: 'saw' });
  assert.equal(b.people.dallae.pts - before, mid + 10, '답해 주면 +10');
  assert.ok(bondOf(b, 'dallae') >= 1);
  // 일곱 사람이 저마다 일을 셋씩 가졌다
  for (const id of WATCHED) { assert.equal(WORKERS[id].works.length, 3, id); assert.equal(WORKERS[id].mine.length, 3, id); for (const w of WORKERS[id].works) assert.ok(w.what && w.end && w.reply && w.notice && w.mid.length >= 2, id); }
  // 마당 밖에서는 지켜볼 수 없다
  const out = ponded('out');
  assert.throws(() => dispatch(out, { type: 'act', id: 'witness' }), /여기서는 할 수 없는 일입니다/);
  assert.throws(() => dispatch(out, { type: 'saw' }), /답하는 마당에서 말해 줍니다/);
});

test('M21-6 지켜보기는 "일"로 세지 않는다: 이자, 가게 손님, 견습, 상단의 짐이 움직이지 않는다 (BM-D4, BM-H4, LV-K9)', async () => {
  const { stallView, workshopView, caravanView } = await import('../src/core/game.js');
  const s = yard('nowork');
  s.silver = 90000;
  // 가게에 물건이 있고, 견습이 일을 맡았고, 짐이 가는 중이고, 은화를 맡겨 두었다
  s.stall = { regulars: 0, work: 0, items: [{ id: 'starmetal_sword', grade: 0, n: 1, dur: 260, max: 260, maker: s.name }], sold: [], today: [] };
  s.shop = { hand: { id: 'bori', pts: 0, job: { kind: 'gather', item: 'oldbronze' }, work: 0, idle: false, paidDay: s.day }, hand2: null, shelf: [], today: [], left: {} };
  s.caravan = { load: { to: 7, items: [{ id: 'mothsilk', grade: 0, n: 2 }], hop: 0, work: 0, no: 1, escort: null, day: s.day }, past: [], heard: {}, sent: 1 };
  s.store['맞울'] = { silver: 10000, items: [] };
  assert.ok(stallView(s) && workshopView(s) && caravanView(s));
  const day = s.day;
  s.flags.dayWork = 0;
  // 지켜보기 아흔 번과 "봤다고 말한다" 세 번: 한 사람의 일 셋을 끝까지
  for (let k = 0; k < 3; k++) { watch(s, 30); dispatch(s, { type: 'saw' }); }
  assert.equal(s.pond.watch.dallae.done, 3);
  assert.equal(s.flags.dayWork || 0, 0, '그날 한 일로 세지 않는다');
  assert.deepEqual([s.stall.work, s.stall.items.length], [0, 1], '가게에 손님이 오지 않는다');
  assert.deepEqual([s.shop.hand.work, s.shop.today.length, s.shop.hand.pts], [0, 0, 0], '견습이 돌지 않는다');
  assert.deepEqual([s.caravan.load.hop, s.caravan.load.work], [0, 0], '상단의 짐이 가지 않는다');
  // 지켜보기만 한 날에는 이자가 붙지 않는다
  let g = 0;
  while (s.day === day && g++ < 3000 && !slots(s)[0].disabled) { if (slots(s)[0].label === '봤다고 말한다') dispatch(s, { type: 'saw' }); else watch(s, 1); }
  assert.ok(s.day > day, '날이 넘어갔다');
  assert.equal(s.store['맞울'].silver, 10000, '이자가 붙지 않았다');
  assert.ok(!texts(s).includes('이자가 붙었다'));
  // 견주어 보기: 같은 날 일(기도)을 서른 번 하면 이자가 붙는다
  const w = yard('work');
  w.store['맞울'] = { silver: 10000, items: [] };
  w.place = 'pondshrine';
  const d2 = w.day;
  for (let i = 0; i < 31; i++) { tend(w); w.tick = 0; w.phase = 0; dispatch(w, { type: 'act', id: 'pray' }); }
  assert.ok((w.flags.dayWork || 0) >= 30);
  g = 0; w.phase = 2; w.tick = 49;
  while (w.day === d2 && g++ < 5) { tend(w); dispatch(w, { type: 'act', id: 'pray' }); }
  assert.equal(w.store['맞울'].silver, 10100);
});

test('M21-6 일곱 사람의 일을 모두 본 뒤에는 지켜볼 것이 없다. 세어진 것은 저장에 남는다', async () => {
  const { parseSave } = await import('../src/core/save.js');
  const { SAVE_VERSION } = await import('../src/core/game.js');
  const s = yard('all');
  s.pond.watch = Object.fromEntries(WATCHED.map((id) => [id, { n: 0, done: 3, ready: false }]));
  assert.equal(watchTarget(s), null);
  assert.ok(slots(s)[0].disabled && slots(s)[0].why === '마당의 일이 모두 끝났다');
  assert.throws(() => dispatch(s, { type: 'act', id: 'witness' }), /마당의 일이 모두 끝났다/);
  const h = yard('save');
  watch(h, 12);
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: JSON.parse(JSON.stringify(h)) })).state;
  assert.deepEqual(back.pond.watch.dallae, { n: 12, done: 0, ready: false });
  assert.equal(back.pond.who, 'dallae');
});

// ── M21-2 별못의 구간 용병과 북 치는 이, 고루 갖춘 일행 (LV-H3, LV-H4, BM-C, BM-H3, BM-H6, T26) ──
import { COMPANIONS, BAND_MERCS, ROLES, FULL_PARTY, partyMax, bardOfBand, fullRoles } from '../src/data/companions.js';
import { mercView, mercSeats, partyView, roleBonus, fullPartyView, partyFees } from '../src/core/party.js';
import { drumBuff } from '../src/core/buffs.js';
import { valueOf } from '../src/core/derived.js';
import { bardRate } from '../src/data/bands.js';
import { checkChance } from '../src/core/social.js';
import { withMercs } from './_sunken.js';

test('M21-2 비단 집의 용병: 북 치는 소담이 맨 위, 그 구간의 셋이 아래. 삯은 모두 690 (BM-C0, BM-H6)', () => {
  const s = ponded('mercs', { at: 'silkhouse' });
  assert.ok(PLACES.silkhouse.merc && PLACES.silkhouse.band === 9);
  const v = mercView(s);
  assert.deepEqual(v.map((m) => [m.name, m.role, m.fee]), [['북 치는 소담', '북돋는 이', 690], ['창잡이 한뫼', '때리는 사람', 690], ['활잡이 나리', '때리는 사람', 690], ['방패잡이 도란', '막는 사람', 690]]);
  assert.equal(v[0].text, '싸우지 않는다. 북을 치는 동안 일행 모두의 공격력·방어력 +12%. 맞지도 않는다.');
  assert.deepEqual(BAND_MERCS[9].order, ['hanmoe', 'nari', 'doran']);
  assert.equal(bardOfBand(9), 'drumsodam');
  assert.equal(COMPANIONS.drumsodam.drum, bardRate(9));
  assert.equal(Math.round(bardRate(9) * 100), 12);
  assert.equal(COMPANIONS.drummaru.fee, 420, '구름다리의 삯은 그대로다');
  // 구름다리의 용병은 별못까지 따라오지 않는다 (JD-C3)
  const up = heard('follow', { at: 'bridgegate' });
  withMercs(up, 'seori', 'bawi', 'drummaru');
  travel(up, 'echogate');
  assert.deepEqual(up.party, []);
  // 다른 거점에서는 구하지 못한다
  const far = ponded('far', { at: 'goathut' });
  far.silver = 5000;
  assert.throws(() => dispatch(far, { type: 'party', op: 'hire', id: 'drumsodam' }), /비단 집에서 구합니다/);
});

test('M21-2 일행 셋: 때리는 이·막는 이·북 치는 이를 다 둔다. 하루 삯 2,070. 북소리 +12% (BM-C0, BM-C1, LV-H4)', () => {
  const s = ponded('three', { at: 'silkhouse' });
  s.silver = 10000;
  assert.equal(partyMax(s), 3);
  assert.deepEqual(mercSeats(s), { n: 0, max: 3, note: '' });
  for (const id of ['hanmoe', 'doran', 'drumsodam']) dispatch(s, { type: 'party', op: 'hire', id });
  assert.equal(s.silver, 10000 - 2070);
  assert.deepEqual(s.party.map((c) => c.id), ['hanmoe', 'doran', 'drumsodam']);
  assert.deepEqual(partyFees(s), { n: 3, silver: 2070 });
  assert.deepEqual(mercSeats(s), { n: 3, max: 3, note: '' });
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'nari' }), /3명까지/);
  const d = drumBuff(s);
  assert.deepEqual([d.name, d.rate, d.text, d.by], ['북소리', bardRate(9), '공격력·방어력 +12%', '소담']);
  const withDrum = valueOf(s, 'attack');
  s.party = s.party.filter((c) => c.id !== 'drumsodam');
  assert.ok(withDrum > valueOf(s, 'attack'));
  assert.equal(partyFees(ponded('alone')), null, '삯을 받는 이가 없으면 줄이 없다');
});

test('M21-2 고루 갖춘 일행: 막는 이·때리는 이에 고치는 이 또는 북돋는 이가 있으면 모든 판정 +5%. 일행 창에 그 줄이 나온다 (BM-C2, BM-H3, T26)', () => {
  assert.equal(FULL_PARTY, '고루 갖춘 일행');
  const s = ponded('full', { at: 'silkhouse' });
  s.job = null; // 나는 때리는 사람으로 센다
  assert.equal(roleBonus(s), 0);
  assert.equal(fullPartyView(s), null, '고루 갖추지 못했으면 줄이 없다');
  // 막는 이 · 때리는 이 · 북돋는 이 (시안 C의 일행)
  withMercs(s, 'hanmoe', 'doran', 'drumsodam');
  assert.equal(roleBonus(s), 0.05);
  assert.deepEqual(fullPartyView(s), { name: '고루 갖춘 일행', roles: `${ROLES.guard} · ${ROLES.striker} · ${ROLES.bard}`, text: '모든 판정 +5%' });
  // 셋째 자리는 고치는 이여도 된다(지금 규칙 그대로)
  s.party = []; withMercs(s, 'doran', 'miru');
  assert.equal(roleBonus(s), 0.05);
  assert.equal(fullPartyView(s).roles, `${ROLES.guard} · ${ROLES.striker} · ${ROLES.healer}`);
  // 막는 이가 없으면, 때리는 이가 없으면 고루가 아니다
  s.party = []; withMercs(s, 'hanmoe', 'drumsodam');
  assert.equal(roleBonus(s), 0, '막는 이가 없다');
  s.job = 'priest'; s.party = []; withMercs(s, 'doran', 'drumsodam');
  assert.equal(roleBonus(s), 0, '때리는 이가 없다');
  s.party = []; withMercs(s, 'doran', 'hanmoe');
  assert.equal(roleBonus(s), 0.05, '사제인 나는 고치는 이로 센다');
  assert.deepEqual(fullRoles('warrior', [{ id: 'hanmoe' }, { id: 'drumsodam' }]), ['guard', 'striker', 'bard']);
  // 말로 하는 판정에도 같은 규칙이 걸린다
  const t = ponded('talk', { at: 'echogate' });
  t.job = null;
  const alone = checkChance(t, 'persuade', 'daon');
  withMercs(t, 'doran', 'drumsodam');
  assert.ok(Math.abs(checkChance(t, 'persuade', 'daon') - alone - 0.05) < 1e-9 || checkChance(t, 'persuade', 'daon') === 0.95);
  // 11장을 끝내기 전에는 셋째 자리가 어디에도 나오지 않는다 (BM-G3)
  const c = climbed('two', { at: 'goathut' });
  withMercs(c, 'seori', 'bawi');
  assert.equal(partyMax(c), 2);
  assert.ok(!JSON.stringify([mercView(c), mercSeats(c), partyView(c)]).match(/3명|셋/));
});

// ── M21-4 거울: 읽히는 버릇 (BM-B, BM-G2, BM-H1, BM-H2) ──
import { startBattle, foeDef, mirrorOf } from '../src/core/battle.js';
import { POND, READ_LINES, readView, ordinal } from '../src/core/pond.js';
import { xpNeeded } from '../src/core/skills.js';
import { equipPower } from '../src/core/inventory.js';
import { monsterXp } from '../src/data/bands.js';
import { xpToNext } from '../src/core/level.js';
import { starred, act } from './_pond.js';

/** 그 사냥터에서 그 몬스터와 싸움을 건다. 끝나지 않게 생명력을 넉넉히 준다. */
const facing = (seed, mon = 'starmoth', at = 'pondside') => {
  const s = starred(ponded(seed, { at }));
  startBattle(s, [], mon);
  s.battle.hp = 99999999; s.battle.intent = 'hit';
  return s;
};
const clone = (s) => JSON.parse(JSON.stringify(s));
const dmgOf = (lines, re) => { const l = lines.find((x) => re.test(x.text)); return l ? Number(l.text.match(/(\d+) 피해/)[1]) : null; };
const linesOf = (ev) => ev.filter((e) => e.type === 'line').map((e) => e.line);
const total = (sk) => { let t = sk.xp; for (let g = 0; g < sk.grade; g++) t += xpNeeded(g); return t; };

test('M21-4 읽힘: 직전과 같은 행동이면 +20, 다른 행동이면 −30. 싸움의 첫 행동에는 움직이지 않는다. 싸움이 끝나면 0 (BM-B3)', () => {
  assert.deepEqual([POND.same, POND.other, POND.at, POND.max, POND.cut, POND.hurt, POND.clean], [20, 30, 60, 100, 0.25, 0.25, 0.2]);
  const s = facing('read');
  const seen = [];
  const go = (choice) => { s.battle.intent = 'hit'; act(s, choice); seen.push(s.battle.read); };
  go('attack'); go('attack'); go('attack'); go('attack'); go('attack');
  assert.deepEqual(seen, [0, 20, 40, 60, 80], '첫 행동은 0, 그 뒤 같은 행동마다 +20');
  assert.equal(s.battle.same, 5);
  go('defend');
  assert.deepEqual([s.battle.read, s.battle.same], [50, 1], '다른 행동에 −30');
  go('defend'); go('defend'); go('defend'); go('defend');
  assert.equal(s.battle.read, 100, '100을 넘지 않는다');
  go('defend');
  assert.equal(s.battle.read, 100);
  go('attack'); go('defend'); go('attack'); go('defend');
  assert.equal(s.battle.read, 0, '0 아래로 내려가지 않는다');
  // 싸움이 끝나면 0: 새 싸움은 처음부터다
  s.battle.read = 80; s.battle.hp = 1; s.battle.intent = 'hit';
  act(s, 'defend'); act(s, 'attack');
  assert.equal(s.battle, null);
  assert.equal(readView(s), null);
  startBattle(s, [], 'starmoth');
  assert.equal(s.battle.read || 0, 0);
  assert.deepEqual(readView(s), { n: 0, max: 100, on: false, tag: null });
});

test('M21-4 읽혔다(60 넘게): 내 공격의 피해 −25%, 내가 맞는 피해 +25%. 다섯째 칸과 이름표 (BM-B1, BM-B3)', () => {
  const base = facing('cut');
  base.stats.agi = 200; // 내가 먼저 친다
  const a = clone(base), b = clone(base);
  a.battle.read = 80; a.battle.last = 'attack'; a.battle.same = 5; // 이번 공격으로 100: 읽힌 채다
  b.battle.read = 0; b.battle.last = 'attack'; b.battle.same = 2; // 이번 공격으로 20: 읽히지 않았다
  const la = linesOf(act(a, 'attack')), lb = linesOf(act(b, 'attack'));
  const mineA = dmgOf(la, /내리쳤다/), mineB = dmgOf(lb, /내리쳤다/);
  assert.equal(mineA, Math.max(1, Math.round(mineB * 0.75)), '내 공격 −25%');
  const hurtA = dmgOf(la.filter((l) => l.k === 'room'), /피해/), hurtB = dmgOf(lb.filter((l) => l.k === 'room'), /피해/);
  assert.equal(hurtA, Math.max(1, Math.round(hurtB * 1.25)), '맞는 피해 +25%');
  assert.deepEqual(bodyView(a).read, { n: 100, max: 100, on: true, tag: { name: '읽혔다', text: '내 공격 −25%, 맞는 피해 +25%' } });
  assert.deepEqual(bodyView(b).read, { n: 20, max: 100, on: false, tag: null });
  // 딱 60은 읽힌 것이 아니다(60을 "넘으면")
  const c = clone(base);
  c.battle.read = 40; c.battle.last = 'attack'; c.battle.same = 3;
  act(c, 'attack');
  assert.deepEqual([c.battle.read, bodyView(c).read.on, !!c.battle.wasRead], [60, false, false]);
});

test('M21-4 거듭 누른 칸에 "몇 번째"가 붙고, 읽히면 한 줄이 적힌다. 처음 읽혔을 때는 따로 알린다 (BM-B1, BM-G2)', () => {
  const s = facing('sub');
  assert.deepEqual(labels(s).slice(0, 4).filter((x) => x !== '스킬'), ['공격', '방어', '태세'].filter((x) => labels(s).includes(x)));
  assert.ok(labels(s).includes('태세') && !labels(s).includes('아이템'), '별못의 싸움에서는 넷째 칸이 태세다');
  assert.equal(slots(s)[0].sub, undefined);
  act(s, 'attack');
  assert.equal(slots(s)[0].sub, undefined, '한 번은 거듭한 것이 아니다');
  act(s, 'attack'); act(s, 'attack'); act(s, 'attack');
  assert.equal(slots(s)[0].sub, '4번째');
  assert.equal(slots(s).find((x) => x.label === '방어').sub, undefined);
  assert.ok(!texts(s).includes('같은 수다'), '아직 읽히지 않았다(60)');
  const ev = linesOf(act(s, 'attack'));
  assert.equal(slots(s)[0].sub, '5번째');
  assert.ok(ev.some((l) => l.text === '다섯 번째 같은 수다. 별가루 나방이 먼저 비켜섰다.'));
  assert.ok(ev.some((l) => l.text === READ_LINES.first), '처음 읽혔을 때의 한 줄');
  assert.equal(ordinal(4), '네 번째');
  act(s, 'attack');
  assert.equal(s.log.filter((l) => l.text === READ_LINES.first).length, 1, '처음 한 번만');
  // 다른 수를 섞어 풀리면 머뭇거린다
  s.battle.read = 80;
  const ev2 = linesOf(act(s, 'defend'));
  assert.equal(s.battle.read, 50);
  assert.ok(ev2.some((l) => l.text === '별가루 나방이 머뭇거린다. 읽지 못하고 있다.'));
  assert.equal(slots(s)[0].sub, undefined, '끊기면 칸의 글도 사라진다');
});

test('M21-4 태세를 바꾸면 읽힘이 0이 된다. 별못의 싸움에서만 되고 한 턴을 쓴다 (BM-B2, BM-B3)', () => {
  const s = facing('stance');
  s.stance = 'hold';
  s.battle.read = 80; s.battle.last = 'attack'; s.battle.same = 5; s.battle.wasRead = true;
  const turn = s.battle.turn;
  const ev = linesOf(act(s, 'stance', 'dodge'));
  assert.equal(s.stance, 'dodge');
  assert.deepEqual([s.battle.read, s.battle.same], [0, 0]);
  assert.equal(s.battle.turn, turn + 1, '한 턴을 쓴다');
  assert.ok(ev.some((l) => l.text === '태세를 피하기로 바꿨다.'));
  assert.ok(ev.some((l) => l.text === '별가루 나방이 머뭇거린다. 읽지 못하고 있다.'));
  // 바꾼 뒤의 첫 행동에는 읽힘이 움직이지 않는다(저쪽은 처음부터 다시 읽는다)
  act(s, 'attack');
  assert.equal(s.battle.read, 0);
  act(s, 'attack');
  assert.equal(s.battle.read, 20);
  assert.throws(() => act(s, 'stance', 'dodge'), /이미 그 태세입니다/);
  // 별못 밖의 싸움에서는 지금처럼 바꾸지 못한다
  const out = starred(ponded('out', { at: 'cliffroad' }));
  startBattle(out, [], 'cloudgoat');
  assert.throws(() => dispatch(out, { type: 'battle', choice: 'stance', index: 'dodge' }), /싸우는 중에는 태세를 바꿀 수 없습니다/);
  assert.throws(() => dispatch(out, { type: 'stance', id: 'dodge' }), /싸우는 중입니다/);
  assert.ok(labels(out).includes('아이템') && !labels(out).includes('태세'));
});

test('M21-4 별못 밖의 싸움에는 읽힘의 칸도 효과도 없다 (BM-G2)', () => {
  const s = starred(ponded('none', { at: 'cliffroad' }));
  startBattle(s, [], 'cloudgoat');
  s.battle.hp = 99999999;
  for (let i = 0; i < 8; i++) { s.battle.intent = 'hit'; act(s, 'attack'); }
  assert.equal(s.battle.read, undefined);
  assert.equal(bodyView(s).read, null);
  assert.equal(slots(s)[0].sub, undefined);
  assert.ok(!texts(s).includes('같은 수다') && !s.flags.sawRead);
  // 맞울의 방에서도, 싸우지 않을 때의 사냥터에서도 칸이 없다
  assert.equal(bodyView(ponded('town')).read, null);
  assert.equal(bodyView(ponded('field', { at: 'pondside' })).read, null);
});

test('M21-4 한 번도 읽히지 않고 이긴 싸움은 숙련도가 20% 더 오른다. 같은 공격을 쌓는 직업은 그대로 쌓인다 (BM-B3, BM-H2)', () => {
  const base = facing('clean');
  base.stats.agi = 200;
  base.skills.strike = { grade: 0, xp: 0, uses: 0 };
  base.battle.hp = 1;
  const a = clone(base), b = clone(base);
  b.battle.wasRead = true; // 한 번 읽혔던 싸움
  act(a, 'attack'); act(b, 'attack');
  assert.equal(a.battle, null); assert.equal(b.battle, null);
  const ga = total(a.skills.strike), gb = total(b.skills.strike);
  assert.ok(gb > 0 && Math.abs(ga - gb * 1.2) < 1e-6, `${ga} / ${gb}`);
  assert.ok(texts(a).includes('한 번도 읽히지 않았다.') && texts(a).includes('(숙련도 +20%)'));
  assert.ok(!texts(b).includes('한 번도 읽히지 않았다.'));
  assert.equal(a.skills.strike.uses, b.skills.strike.uses, '쓴 횟수는 더 세지 않는다');
  // 별못 밖에서 이긴 싸움에는 덤이 없다
  const o = starred(ponded('plain', { at: 'cliffroad' }));
  o.stats.agi = 200; o.skills.strike = { grade: 0, xp: 0, uses: 0 };
  startBattle(o, [], 'cloudgoat'); o.battle.hp = 1; o.battle.intent = 'hit';
  act(o, 'attack');
  assert.ok(!texts(o).includes('한 번도 읽히지 않았다.'));
  // 같은 공격을 이어서 할수록 쌓이는 것(한길꾼)은 건드리지 않았다: 읽혀도 쌓인 수는 그대로 오른다
  const w = facing('streak');
  w.job = 'oneway';
  for (let i = 0; i < 6; i++) { w.battle.intent = 'hit'; act(w, 'attack'); }
  assert.equal(w.battle.streak, 6);
  assert.ok(w.battle.read > 60, '쌓는 동안 읽힌다: 쌓을지 섞을지를 고른다');
  act(w, 'defend');
  assert.equal(w.battle.streak, 0, '다른 일을 하면 쌓인 것이 끊긴다(지금 규칙 그대로)');
});

// ── M21-5 못의 거울상 (BM-B3, BM-H1) ──

test('M21-5 못의 거울상: 공격력이 내 공격력의 90%, 방어력이 내 방어구 합, 경험치가 내 레벨의 몬스터 한 마리 반. 좋은 장비를 찰수록 세다', () => {
  assert.deepEqual([POND.mirror, POND.mirrorAttack, POND.mirrorXp], ['pondmirror', 0.9, 1.5]);
  const s = facing('mirror', 'pondmirror');
  const m = foeDef(s.battle);
  assert.equal(m.attack, Math.round(valueOf(s, 'attack') * 0.9));
  assert.equal(m.defense, equipPower(s).defense);
  assert.ok(m.defense > 0);
  assert.equal(m.xp, Math.round(monsterXp(s.level, xpToNext) * 1.5 * (s.battle.fierce || 1)));
  assert.deepEqual(mirrorOf(s), { attack: m.attack, defense: m.defense });
  // 맨몸으로 가면 거울상도 맨몸이다
  const bare = ponded('bare', { at: 'pondside' });
  for (const k of Object.keys(bare.equip)) bare.equip[k] = null;
  startBattle(bare, [], 'pondmirror');
  assert.equal(foeDef(bare.battle).defense, 0);
  assert.ok(foeDef(bare.battle).attack < m.attack);
  // 좋은 장비를 찰수록 세다: 무기를 강화하면 거울상의 공격력도 오른다
  const strong = starred(ponded('strong', { at: 'pondside' }));
  strong.equip.weapon.plus = 10;
  startBattle(strong, [], 'pondmirror');
  assert.ok(foeDef(strong.battle).attack > m.attack, `${foeDef(strong.battle).attack} > ${m.attack}`);
  // 싸우다 벗으면 다음 턴부터 저쪽도 바뀐다(지금의 나를 비춘다)
  const sw = facing('swap', 'pondmirror');
  const before = foeDef(sw.battle).defense;
  sw.equip.body = null;
  act(sw, 'attack');
  assert.ok(foeDef(sw.battle).defense < before);
  // 다른 몬스터는 내 장비를 따라 세지지 않는다 (BM-H1)
  const moth = facing('moth', 'starmoth'), moth2 = starred(ponded('moth2', { at: 'pondside' }));
  moth2.equip.weapon.plus = 10;
  startBattle(moth2, [], 'starmoth');
  assert.deepEqual([foeDef(moth2.battle).attack, foeDef(moth2.battle).defense], [foeDef(moth.battle).attack, foeDef(moth.battle).defense]);
  assert.equal(moth.battle.mirror, undefined);
  // 이기면 그 경험치를 받는다
  const win = facing('win', 'pondmirror');
  win.stats.agi = 200; win.battle.hp = 1;
  const want = foeDef(win.battle).xp;
  const ev = act(win, 'attack');
  assert.ok(linesOf(ev).some((l) => l.text.includes(`경험치 ${want}`)));
});

// ── M21-3 계산 도구: 별못을 용병 둘에 북 치는 이로, 읽히는 데서 잰다 (LV-I5, LV-A) ──
import { BANDS } from '../src/data/bands.js';

test('M21-3 계산 도구가 별못을 읽히는 데서, 용병 둘에 북 치는 이까지 넣어 잰다. 읽힌 판의 수와 처음 읽히는 턴을 낸다', async () => {
  const { measure, applyKit, buildPlayer, gearOf, bardOfKit, mercsOfKit, fieldOf, monstersOf } = await import('../tools/balance.mjs');
  assert.equal(BANDS[8].need, 'bard', '별못이 갖출 것은 버프 용병까지 (LV-A)');
  assert.deepEqual([mercsOfKit('bard'), bardOfKit('bard')], [2, true]);
  assert.ok(PLACES[fieldOf(BANDS[8])].mirror, '읽히는 곳에서 잰다');
  assert.equal(fieldOf(BANDS[7]), 'forest', '구름다리는 그대로다');
  assert.deepEqual(monstersOf(BANDS[8]).sort(), ['pondmirror', 'starmoth', 'starshard', 'voidecho']);
  const s = buildPlayer(BANDS[8], 'warrior', gearOf(9, 'str', 'warrior'));
  assert.equal(applyKit(s, BANDS[8], 'bard'), null);
  assert.deepEqual(s.party.map((c) => c.id), ['hanmoe', 'doran', 'drumsodam'], '일행 셋');
  const of = (o) => measure(9, { runs: 24, ...o }).find((r) => r.job === 'warrior');
  const none = of({ mercs: 0 }), full = of({ mercs: 2, bard: true });
  assert.ok(full.loss < none.loss, `일행 셋이면 덜 잃는다 (${none.loss}% → ${full.loss}%)`);
  assert.ok(Number.isInteger(full.reads) && full.reads >= 0 && full.reads <= 24);
  if (full.reads) assert.ok(full.readAt >= 5, '다섯 번째 같은 수부터 읽힌다');
  // 읽히지 않는 구간의 줄에는 읽힘이 적히지 않는다
  assert.equal(measure(8, { runs: 4, mercs: 0 })[0].reads, undefined);
});

// ── M21-7 별 떨어진 자리와 깨진 종의 마지막 조각 (BM-A10, LV-C9, LV-I3) ──
import { DUNGEONS } from '../src/data/dungeon.js';
import { normalAt } from '../src/data/bands.js';
import { MAIN, SUBS, HIDDENS, SHARDS, SHARD_LINES, SAW_SAY } from '../src/data/quests.js';
import { mainView, subView, offersOf, hiddenView, questBook } from '../src/core/quests.js';
import { HELP, HELP_MORE, helpBody } from '../src/ui/help.js';
import { recipeList } from '../src/core/craft.js';
import { ORDER_OF } from '../src/data/recipes.js';
import { give } from './_salt.js';

/** 별 떨어진 자리의 그 방에 선 사람(앞의 방들은 지나온 것으로 친다). */
const inPit = (s, room) => {
  s.place = 'starfield'; s.battle = null; s.choice = null;
  s.dungeon = { id: 'starpit', room, prev: null, cleared: {}, rested: {}, alert: false };
  s.dmem.starpit = s.dmem.starpit || { seen: [], done: {}, nights: 0, keeper: null };
  s.dmem.starpit.seen = Object.keys(DUNGEONS.starpit.rooms);
  return s;
};
/** 지금 싸움을 한 대에 끝낸다. */
const finish = (s) => { tend(s); s.battle.hp = 1; return dispatch(s, { type: 'battle', choice: 'attack' }); };

test('M21-7 별 떨어진 자리는 별 떨어진 벌에서 든다. 다섯 층이고 바닥에 마지막 조각이 있다. 안에서도 읽힌다 (BM-A10, BM-B3)', () => {
  const d = DUNGEONS.starpit;
  assert.deepEqual([d.name, d.from, d.floors.length], ['별 떨어진 자리', 'starfield', 5]);
  const rooms = Object.values(d.rooms);
  assert.equal(new Set(rooms.map((r) => r.floor)).size, 5);
  assert.deepEqual(rooms.filter((r) => r.kind === 'boss').map((r) => r.mon), ['lastshard']);
  for (const r of rooms) { assert.ok(r.name && r.text, r.name); for (const e of r.exits) assert.ok(d.rooms[e], `${r.name} → ${e}`); if (r.mon) assert.equal(MONSTERS[r.mon].band, 9); }
  const s = ponded('enter', { at: 'starfield' });
  assert.deepEqual(labels(s), ['탐색', '캐기', '구덩이로 내려간다']);
  s.dex.mon.starshard = { seen: 9, won: 0, lost: 0 };
  dispatch(s, { type: 'dungeon', op: 'enter', id: 'starpit' });
  assert.ok(texts(s).includes(d.enterSay));
  // 안의 싸움에서도 읽힌다
  const b = starred(inPit(ponded('read-in'), 'k1-slope'));
  startBattle(b, [], 'starshard'); b.battle.hp = 99999999;
  for (let i = 0; i < 5; i++) { b.battle.intent = 'hit'; act(b, 'attack'); }
  assert.equal(b.battle.read, 80);
  assert.ok(bodyView(b).read.on);
});

test('M21-7 깨진 종의 마지막 조각(90): 보통 몬스터의 생명력 4배·공격력 1.25배. 쓰러뜨리면 12장이 끝난다 (LV-I3, BM-E3)', () => {
  const m = MONSTERS.lastshard, n = normalAt(90);
  assert.deepEqual([m.name, m.level, m.boss, m.band], ['깨진 종의 마지막 조각', 90, true, 9]);
  assert.deepEqual([m.hp, m.attack, m.defense], [n.hp * 4, Math.round(n.attack * 1.25), n.defense]);
  assert.deepEqual(m.moves.map((x) => x.kind).sort(), ['charge', 'hit', 'wait']);
  const s = starred(inPit(ponded('boss'), 'k4-cry'));
  s.dungeon.cleared['k4-cry'] = true;
  assert.equal(s.main.chapter, 12);
  dispatch(s, { type: 'room', to: 'k5-bottom' });
  assert.equal(s.battle?.mon, 'lastshard', '들어서면 바로 싸운다');
  const ev = finish(s);
  assert.equal(s.dmem.starpit.keeper, 'beat');
  assert.ok(texts(s).includes(DUNGEONS.starpit.bossDown));
  assert.deepEqual(s.main.done.at(-1), { chapter: 12, path: 'gather', day: s.day });
  assert.equal(s.main.called, '조각을 거둔 이');
  assert.ok(texts(s).includes('조각은 싸우는 내내 울었다. 쓰러지자 울음이 멎었고, 손바닥만 한 쇳조각이 남았다. 들고 올라오자 다온이 한참 보았다. "혼자 울고 있었구나. 삼대를." 그는 그것을 못가의 빈 틀에 올려놓았다.'));
  assert.ok(!ev.some((e) => e.type === 'answered'), '12장의 끝 글에는 그 말이 이미 들어 있다');
});

// ── M21-8 12장 깨진 종 (BM-E, BM-G5, LV-D12) ──

test('M21-8 12장 깨진 종: 퀘스트 창의 글과 푸는 길 셋. 끝내면 처음 모루 길이 열린다(길만) (BM-E)', () => {
  const s = ponded('ch12');
  const v = mainView(s);
  assert.deepEqual([v.chapter, v.name], [12, '깨진 종']);
  assert.equal(v.text, '별이 떨어져 종을 깼다. 누구 탓도 아니었다. 맞울 사람들은 종을 다시 짓지 않았다. 대신 서로를 보기로 했다. 누가 끝까지 하면 곁의 사람이 말한다. "봤어." 그것으로 삼대를 살았다. 조각은 아직 구덩이 바닥에서 혼자 운다.');
  assert.deepEqual(v.paths.map((p) => [p.name, p.text, p.have, p.need]), [
    ['거두는 길', '별 떨어진 자리 바닥의 마지막 조각을 쓰러뜨려 거둔다', 0, 1],
    ['나누는 길', '종 조각 일곱으로 작은 종 일곱을 지어 집집에 건다(세공)', 0, 7],
    ['그대로 두는 길', '마을 사람 일곱의 일을 한 번씩 끝까지 보고 답해 준다', 0, 7],
  ]);
  assert.deepEqual(MAIN[12].paths.map((p) => p.called), ['조각을 거둔 이', '작은 종을 나눈 이', '봤다고 답한 이']);
  assert.deepEqual(MAIN[12].roads, ['anvilroad']);
  // 끝낸 뒤: 처음 모루로 가는 길이 열리고 13장이 보인다 (M22)
  const e = starred(inPit(ponded('road'), 'k4-cry'));
  e.dungeon.cleared['k4-cry'] = true;
  dispatch(e, { type: 'room', to: 'k5-bottom' });
  finish(e);
  assert.equal(e.main.chapter, 13);
  assert.ok(e.opened.includes('anvilroad'));
  assert.ok(e.dings.find((d) => d.title.includes("12장 '깨진 종'")).body.includes('처음 모루로 가는 길이 열렸습니다.'));
  assert.equal(mainView(e).name, '두 번째 약속');
  assert.ok(JSON.stringify(mapView(e)).includes('모루 아래 야영지'));
  // 끝내기 전에는 지도에 없다 (CM-G1)
  assert.ok(!JSON.stringify(mapView(ponded('noroad'))).includes('모루'));
});

test('M21-8 그대로 두는 길: 마을 사람 일곱의 일을 한 번씩 끝까지 보고 답해 주면 끝난다 (BM-E5)', () => {
  const s = yard('leave');
  for (const [i, id] of WATCHED.entries()) {
    assert.equal(s.main.chapter, 12);
    assert.equal(mainView(s).paths[2].have, i);
    dispatch(s, { type: 'greet', npc: id });
    watch(s, 30);
    dispatch(s, { type: 'saw' });
  }
  assert.deepEqual(s.main.done.at(-1), { chapter: 12, path: 'leave', day: s.day });
  assert.equal(s.main.called, '봤다고 답한 이');
  assert.ok(texts(s).includes('일곱 사람에게 답하고 나자, 마당의 모든 사람이 일손을 멈추고 이쪽을 보았다. 다온이 말했다. "봤어. 네가 한 거. 일곱 번 다." 구덩이 아래의 조각이 그날 처음으로 울음을 그쳤다.'));
  assert.equal(s.dings.filter((d) => d.title.startsWith('히든 퀘스트')).length, 0, '히든은 아직이다(사람마다 한 가지씩만 보았다)');
});

test('M21-8 나누는 길: 종 조각을 손에 넣어야 작은 종의 설계도가 보인다. 일곱을 지어 집집에 걸면 끝난다 (BM-E4, BM-G5)', () => {
  const s = ponded('share', { at: 'artguild' });
  s.craftLv.jewel = { lv: 33, xp: 0 }; s.craftTier.jewel = 9;
  const ids = () => recipeList(s, ORDER_OF.jewel).map((r) => r.id);
  assert.ok(!ids().includes('smallbell'), '종 조각을 손에 넣기 전에는 세공 목록에 없다');
  assert.throws(() => dispatch(s, { type: 'craft', recipe: 'smallbell' }), /아직 모르는 설계도입니다/);
  assert.ok(ITEMS.bellshard && ITEMS.smallbell && ITEMS.bellshard.kind === 'quest');
  give(s, 'bellshard', 7);
  dispatch(s, { type: 'act', id: 'sort' }); // 아무 일이나 하나 하면 가진 것이 도감에 적힌다
  assert.ok(ids().includes('smallbell'));
  const r = RECIPES.smallbell;
  assert.deepEqual([r.name, r.jewel, r.plain, r.needs], ['작은 종', true, true, [{ id: 'bellshard', n: 1 }]]);
  for (let i = 0; i < 7; i++) { dispatch(s, { type: 'craft', recipe: 'smallbell' }); let n = 0; while (s.craft && n++ < 80) { tend(s); dispatch(s, { type: 'hammer' }); } }
  assert.deepEqual([count(s, 'smallbell'), count(s, 'bellshard')], [7, 0]);
  assert.ok(texts(s).includes('마지막으로 광을 냈다. 작은 종이 다 되었다.'));
  // 맞울 어귀에서 한 번에 하나씩 건다
  s.place = 'echogate';
  const slot = slots(s).find((x) => x.label === '작은 종 걸기');
  assert.deepEqual([slot.sub, slot.action], ['0 / 7', { type: 'hangbell' }]);
  for (let i = 1; i <= 6; i++) { tend(s); dispatch(s, { type: 'hangbell' }); assert.equal(s.pond.bells, i); assert.equal(mainView(s).paths[1].have, i); }
  assert.equal(s.main.chapter, 12);
  tend(s); dispatch(s, { type: 'hangbell' });
  assert.deepEqual(s.main.done.at(-1), { chapter: 12, path: 'share', day: s.day });
  assert.equal(s.main.called, '작은 종을 나눈 이');
  assert.ok(texts(s).includes('일곱째 종을 처마에 걸자 집집의 작은 종이 한꺼번에 흔들렸다. 소리는 작았다. 옆집까지만 들렸다. "딱 좋네." 달래가 말했다. "옆집에서 들으면 됐지."'));
  assert.equal(count(s, 'smallbell'), 0);
  // 작은 종이 없으면 걸 칸도 없다
  const none = ponded('nobell');
  assert.ok(!labels(none).includes('작은 종 걸기'));
  assert.throws(() => dispatch(none, { type: 'hangbell' }), /작은 종이 없습니다/);
});

// ── M21-9 서브 둘과 히든 (BM-E6, BM-E7, LV-E9) ──

test('M21-9 서브 "서로 답하는 마을": 말이 다섯 사람을 거쳐 다온에게 돌아온다. 하루를 넘기면 준 사람에게 다시 받는다 (BM-E6)', () => {
  const s = ponded('relay');
  assert.deepEqual(offersOf(s, 'daon'), ['relay']);
  dispatch(s, { type: 'quest', op: 'accept', id: 'relay' });
  assert.deepEqual(SHARDS.relay, ['starsmith', 'silkhost', 'pondpriest', 'pondhost', 'dallae']);
  const say = (npc) => { walk(s, PEOPLE[npc].place); return dispatch(s, { type: 'greet', npc }); };
  // 차례가 아닌 사람에게 말을 걸어도 넘어가지 않는다
  say('silkhost');
  assert.equal(s.quests.relay.count, 0);
  say('starsmith');
  assert.equal(s.quests.relay.count, 1);
  assert.ok(texts(s).includes(SHARD_LINES.relay.starsmith));
  assert.equal(subView(s, 'relay').step.goal, '1 / 5');
  say('silkhost');
  assert.equal(s.quests.relay.count, 2);
  // 하루를 넘겼다: 다음 사람은 받지 않고, 준 사람에게 다시 받아야 한다
  s.day += 1;
  say('pondpriest');
  assert.equal(s.quests.relay.count, 2, '묵은 말은 받지 않는다');
  assert.ok(texts(s).includes(SHARD_LINES.relayLate));
  say('silkhost');
  assert.ok(s.log.some((l) => l.who === '비단 집 주인' && l.text === SHARD_LINES.relayAgain));
  say('pondpriest'); say('pondhost'); say('dallae');
  assert.equal(s.quests.relay.step, 'back');
  walk(s, 'echogate');
  dispatch(s, { type: 'quest', op: 'choose', id: 'relay', choice: 'done' });
  assert.ok(s.quests.relay.done);
  assert.equal(s.quests.relay.ending, '말을 한 바퀴 이었다');
});

test('M21-9 서브 "조각을 줍는 아이": 솔을 호위해 스무 조각을 모으면 조각 일곱을 받는다. 한 번 누르면 한 번이다 (BM-E7)', () => {
  const s = starred(ponded('kid'));
  assert.deepEqual(offersOf(s, 'sol'), ['shardkid']);
  assert.ok(!labels(ponded('nokid', { at: 'starfield' })).includes('호위'), '받기 전에는 칸이 없다');
  dispatch(s, { type: 'quest', op: 'accept', id: 'shardkid' });
  s.place = 'starfield';
  assert.deepEqual([slots(s).find((x) => x.label === '호위').sub, slots(s).find((x) => x.label === '호위').action], ['솔의 조각 0 / 20', { type: 'guardkid' }]);
  let presses = 0, fights = 0;
  while (s.quests.shardkid.step === 'guard' && presses < 400) {
    tend(s); s.tick = 0; s.phase = 0;
    const before = s.quests.shardkid.count;
    dispatch(s, { type: 'guardkid' });
    presses += 1;
    if (s.battle) { fights += 1; assert.equal(s.quests.shardkid.count, before, '덤빈 번에는 줍지 못한다'); assert.equal(MONSTERS[s.battle.mon].band, 9); while (s.battle) finish(s); }
    else if (s.quests.shardkid.step === 'guard') assert.equal(s.quests.shardkid.count, before + 1, '한 번에 하나');
  }
  assert.equal(s.quests.shardkid.step, 'back');
  assert.ok(fights > 0 && presses === 20 + fights, `${presses}번 눌러 ${fights}번 싸웠다`);
  assert.ok(texts(s).includes(SHARD_LINES.guardHalf) && texts(s).includes(SHARD_LINES.guardDone));
  assert.equal(SHARDS.guard, 20);
  s.place = 'echogate';
  dispatch(s, { type: 'quest', op: 'choose', id: 'shardkid', choice: 'done' });
  assert.ok(s.quests.shardkid.done);
  assert.equal(count(s, 'bellshard'), 7, '나누는 길의 재료');
});

test('M21-9 히든 "내가 울린 띠링": 일곱 사람의 일을 모두 끝까지 지켜본다. 조건은 화면과 도움말 어디에도 나오지 않는다 (LV-E9)', () => {
  const s = yard('hidden');
  // 12장은 다른 길로 끝낸 사람이다(그대로 두는 길과 겹치지 않게)
  s.main.done.push({ chapter: 12, path: 'gather', day: 120 }); s.main.chapter = 13; s.opened.push('anvilroad');
  // 스무 가지를 답해 준 사람: 아직 아무 일도 없다
  s.pond.watch = Object.fromEntries(WATCHED.map((id) => [id, { n: 0, done: 3, ready: false }]));
  s.pond.watch.boram = { n: 29, done: 2, ready: false };
  dispatch(s, { type: 'greet', npc: 'boram' });
  assert.equal(s.hq.myding, undefined);
  const shown = () => JSON.stringify([slots(s), mainView(s), questBook(s), hiddenView(s), hiddenSlots(s), HELP, HELP_MORE, helpBody(HELP.find((t) => t.id === 'people'), { pond: true })]);
  assert.ok(!shown().match(/내가 울린 띠링|스물한|일을 모두|사람마다 세/), '찾기 전에는 어디에도 없다');
  watch(s, 1);
  dispatch(s, { type: 'saw' });
  assert.equal(s.hq.myding.status, 'offered');
  assert.ok(s.dings.some((d) => d.title === '히든 퀘스트를 찾았습니다: 내가 울린 띠링'));
  assert.equal(HIDDENS.myding.name, '내가 울린 띠링');
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.hq.myding.status, 'active');
  walk(s, 'echogate');
  dispatch(s, { type: 'greet', npc: 'daon' });
  assert.equal(s.hq.myding.status, 'done');
  assert.ok(texts(s).includes(HIDDENS.myding.done));
  // 사람마다 한 가지씩만 본 사람에게는 나타나지 않는다
  const one = yard('one');
  one.main.done.push({ chapter: 12, path: 'gather', day: 120 }); one.main.chapter = 13;
  one.pond.watch = Object.fromEntries(WATCHED.map((id) => [id, { n: 0, done: 1, ready: false }]));
  watch(one, 3);
  assert.equal(one.hq.myding, undefined);
});
import { hiddenSlots } from '../src/core/hidden.js';

// ── M21-6 "봤어": 별못에서 끝까지 한 일에 마을 사람이 답한다 (BM-D5, BM-H5) ──

test('M21-6 별못에서 무언가를 끝까지 하면(제작 승급, 우두머리, 퀘스트) 마을 사람 하나가 "봤어"라고 말해 준다. 별못 밖에서는 아니다 (BM-D5, BM-H5)', () => {
  assert.equal(SAW_SAY[0][1], '봤어. 네가 한 거.');
  const said = (ev) => ev.filter((e) => e.type === 'line' && SAW_SAY.some(([who, text]) => e.line.who === PEOPLE[who].name && e.line.text === text));
  // 퀘스트(의뢰)를 끝냈다
  const j = ponded('job', { at: 'answeryard' });
  j.jobs.push({ id: 'starmetal6', due: j.day + 3, have: 0 });
  give(j, 'starmetal', 6);
  const ev = dispatch(j, { type: 'job', op: 'finish', id: 'starmetal6' });
  assert.equal(said(ev).length, 1);
  assert.ok(ev.some((e) => e.type === 'answered'));
  // 제작 승급: 별쇠 검을 지어 대장 10단계가 열렸다
  const c = ponded('promo2', { at: 'starforge' });
  c.craftLv.smith = { lv: 36, xp: 0 }; c.craftTier.smith = 9;
  make(c, 'starmetal_sword');
  assert.equal(c.craftTier.smith, 10);
  assert.equal(c.log.filter((l) => SAW_SAY.some(([who, text]) => l.who === PEOPLE[who].name && l.text === text)).length, 1);
  // 승급이 아닌 것을 지었을 때는 아니다
  const p = ponded('plain', { at: 'starforge' });
  p.craftLv.smith = { lv: 36, xp: 0 }; p.craftTier.smith = 9;
  make(p, 'starmetal_helm');
  assert.equal(p.log.filter((l) => SAW_SAY.some(([, text]) => l.text === text)).length, 0);
  // 서브 퀘스트를 끝냈다
  const q = ponded('sub');
  q.quests.shardkid = { step: 'back', set: [], closed: [], count: 0, done: false, ending: null, day: q.day };
  assert.equal(said(dispatch(q, { type: 'quest', op: 'choose', id: 'shardkid', choice: 'done' })).length, 1);
  // 별못 밖에서 끝낸 일에는 아무도 그 말을 하지 않는다
  const out = climbed('outjob', { at: 'goathut' });
  out.jobs.push({ id: 'silver6', due: out.day + 3, have: 0 });
  give(out, 'cloudsilver', 6);
  const ev2 = dispatch(out, { type: 'job', op: 'finish', id: 'silver6' });
  assert.equal(said(ev2).length, 0);
  assert.ok(!ev2.some((e) => e.type === 'answered'));
});

test('M21 가 본 뒤에야 생기는 도움말: 읽힘과 지켜보기는 별못에 가 본 뒤, 고루 갖춘 일행은 11장을 끝낸 뒤', () => {
  const fight = HELP.find((t) => t.id === 'fight'), people = HELP.find((t) => t.id === 'people');
  assert.ok(!helpBody(fight, {}).join('').match(/읽힘|거울상|고루 갖춘/));
  assert.ok(!helpBody(people, {}).join('').match(/지켜보기|봤다고 말한다/));
  assert.ok(helpBody(fight, { pond: true }).join('').includes('읽힘'));
  assert.ok(helpBody(fight, { three: true }).join('').includes('고루 갖춘 일행'));
  assert.ok(helpBody(people, { pond: true }).join('').includes('지켜보기'));
});

// ── M21-10 견습 셋째 자리 (LV-K2, AN-C8, AN-F4) ──
import { SHOP, seatsOf, workshopView, shopCarry } from '../src/core/workshop.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';
import { master, work } from './_marsh.js';
import { passPhase } from './_time.js';

test('M21-10 레벨 81부터 견습을 셋까지 둔다. 그 전에는 셋째 자리가 어디에도 나오지 않는다 (LV-K2, AN-F4)', () => {
  const s = master('third', { at: 'floatinn' });
  assert.deepEqual([SHOP.second, SHOP.third, SHOP.hands], [61, 81, ['bori', 'sora', 'iseul']]);
  s.level = 80;
  s.shop.hand2 = { id: 'sora', pts: 0, job: null, work: 0, idle: false, paidDay: s.day };
  assert.deepEqual([seatsOf(s), workshopView(s).seats, labels(s).includes('견습')], [2, 2, false]);
  assert.ok(!JSON.stringify([slots(s), workshopView(s)]).includes('이슬'), '셋째 자리의 사람은 어디에도 없다');
  assert.throws(() => dispatch(s, { type: 'workshop', op: 'hire' }), /자리가 찼습니다/);
  s.level = 81;
  assert.equal(workshopView(s).seats, 3);
  const slot = slots(s).find((x) => x.label === '견습');
  assert.ok(slot.sub.includes('이슬') && slot.confirm.includes(PEOPLE.iseul.story));
  const silver = s.silver;
  dispatch(s, slot.action);
  assert.equal(s.silver, silver - 100);
  assert.deepEqual([s.shop.hand.id, s.shop.hand2.id, s.shop.hand3.id], ['bori', 'sora', 'iseul']);
  assert.ok(texts(s).includes(PEOPLE.iseul.join));
  assert.ok(!labels(s).includes('견습'), '셋이 찼으면 칸이 없다');
  const v = workshopView(s);
  assert.deepEqual([v.hands, v.seats, v.list.map((x) => x.name)], [3, 3, ['보리', '소라', '이슬']]);
  // 셋이 저마다 맡은 일을 한다. 내가 일할 때만 돈다
  s.place = 'emptyshop';
  for (const [who, item] of [['bori', 'saltsteel'], ['sora', 'frostiron'], ['iseul', 'whitefur']]) dispatch(s, { type: 'workshop', op: 'job', who, job: { kind: 'gather', item } });
  work(s, 10);
  const shelf = Object.fromEntries(s.shop.shelf.map((x) => [x.id, x.n]));
  assert.deepEqual([shelf.saltsteel, shelf.frostiron, shelf.whitefur], [1, 1, 1]);
  // 저마다 삯을 받는다. 못 받은 사람만 떠난다
  s.silver = 250; s.place = 'floatgate';
  const day = s.day;
  while (s.day === day) passPhase(s);
  assert.deepEqual([s.shop.hand?.id, s.shop.hand2?.id, s.shop.hand3], ['bori', 'sora', null]);
  assert.equal(s.silver, 50);
  // 빈 자리에 다시 들인다: 가운데가 비어도 빈 자리부터 찬다
  s.shop.hand2 = null; s.silver = 1000; s.place = 'floatinn';
  dispatch(s, { type: 'workshop', op: 'hire' });
  assert.equal(s.shop.hand2.id, 'sora');
  dispatch(s, { type: 'workshop', op: 'hire' });
  assert.equal(s.shop.hand3.id, 'iseul');
  // 저장해도 셋 다 그대로다. 다시 태어나면 모두 떠난다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: JSON.parse(JSON.stringify(s)) })).state;
  assert.equal(back.shop.hand3.id, 'iseul');
  const carry = shopCarry(s);
  assert.deepEqual([carry.hand, carry.hand2, carry.hand3 ?? null], [null, null, null]);
});

test('M21 19판 저장은 지금 판으로 올라온다: 지켜본 일도 건 종도 없이. 견습이 둘이던 공방은 그대로 둘이다 (저장 판)', () => {
  assert.equal(SAVE_VERSION, 21);
  const s = master('v19', { at: 'floatinn' });
  s.level = 84;
  s.shop.hand2 = { id: 'sora', pts: 12, job: null, work: 0, idle: false, paidDay: s.day };
  withMercs(s, 'saeam', 'hanul');
  const old = JSON.parse(JSON.stringify(s));
  delete old.pond; old.v = 19;
  const up = parseSave(JSON.stringify({ v: 19, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, 21);
  assert.deepEqual(up.pond, { who: null, watch: {}, bells: 0 });
  assert.deepEqual([up.shop.hand.id, up.shop.hand2.id, up.shop.hand3 ?? null], ['bori', 'sora', null]);
  assert.deepEqual(up.party.map((c) => c.id), ['saeam', 'hanul']);
  assert.equal(workshopView(up).seats, 3, '81을 넘은 사람에게는 셋째 자리가 보인다');
  // 지켜보던 것과 건 종이 있는 채로 저장했다 읽어도 같다
  const t = yard('roundtrip');
  watch(t, 30);
  t.pond.bells = 3;
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: JSON.parse(JSON.stringify(t)) })).state;
  assert.deepEqual(back.pond, t.pond);
  assert.equal(slots(back)[0].label, '봤다고 말한다');
  // 망가진 칸은 걸러진다
  const bad = JSON.parse(JSON.stringify(t));
  bad.pond.watch.nobody = { n: 1, done: 0, ready: false };
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })), /저장 파일이 망가졌습니다|지켜본 일/);
});
