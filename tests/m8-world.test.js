// M8: 가상 유저의 세계, 세계 공지와 최초 발견, 랭킹, 소문, 경매장, 지난번 이후. 여정: 태윤 1·8, 서진 8, 덕수 8.
import { passPhase } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, SAVE_VERSION } from '../src/core/game.js';
import { addItem, countOf } from '../src/core/inventory.js';
import { userAt, userBase, worldFirst, noticesView, ranking, rumorsView, sinceLast, markSeen } from '../src/core/world.js';
import { lotsToday, auctionView, feeRate } from '../src/core/auction.js';
import { hiddenSlots } from '../src/core/hidden.js';
import { titleView } from '../src/core/social.js';
import { parseSave } from '../src/core/save.js';
import { USER_COUNT, FIRSTS, RANKS, RUMORS_HINT, RUMORS_ABOUT_ME } from '../src/data/world.js';
import { HIDDEN } from '../src/core/hidden.js';

const fresh = (seed = 'm8', origin = 'smithboy') => createGame({ name: '태윤', origin, spent: {}, seed });
const nextDay = (s) => { if (s.place !== 'plaza') s.place = 'plaza'; const d = s.day; while (s.day === d) { passPhase(s); s.full = 80; } };

test('가상 유저 삼백 명: 이름이 겹치지 않고, 날마다 자라기만 한다 (M8-1)', () => {
  const s = fresh();
  assert.equal(USER_COUNT, 300);
  const names = new Set();
  for (let i = 0; i < USER_COUNT; i++) names.add(userBase(s, i).name);
  assert.equal(names.size, 300);
  let grew = 0;
  for (let i = 0; i < USER_COUNT; i++) {
    const a = userAt(s, i, 3), b = userAt(s, i, 4), c = userAt(s, i, 30);
    for (const k of ['level', 'craft', 'art', 'fame']) { assert.ok(b[k] >= a[k], `${a.name} ${k}`); assert.ok(c[k] >= b[k]); }
    if (c.level > a.level || c.craft > a.craft) grew++;
    assert.ok(a.styleName);
  }
  assert.ok(grew > 280, `한 달이면 거의 모두 자란다 (${grew})`);
  // 같은 씨앗이면 같은 세계
  assert.deepEqual(userAt(fresh(), 17, 9), userAt(s, 17, 9));
  assert.notDeepEqual(userAt(fresh('다른 씨앗'), 17, 9).style + userAt(fresh('다른 씨앗'), 18, 9).style + userAt(fresh('다른 씨앗'), 19, 9).style + userAt(fresh('다른 씨앗'), 20, 9).style, null);
});

test('세계 공지: 내가 처음 찾으면 내 이름으로, 가상 유저가 먼저면 그 이름으로 뜬다 (M8-2, Q1-4)', () => {
  // 내가 먼저: 이틀 만에 허수아비 300번
  const s = fresh('first');
  dispatch(s, { type: 'move', to: 'training' });
  let ev = [];
  for (let i = 0; i < 300; i++) ev = dispatch(s, { type: 'act', id: 'strike' });
  assert.ok(s.day < worldFirst(s, 'stat:endure').day);
  const d = ev.find((e) => e.type === 'ding' && e.ding.kind === 'first');
  assert.equal(d.ding.level, 5, '귀한 정도: 세계 최초');
  assert.equal(s.world.firsts['stat:endure'].mine, true);
  assert.ok(noticesView(s).some((n) => n.mine && n.text.includes("'태윤'님이 히든 스탯 '인내'를")));
  // 가상 유저가 먼저: 그날이 지나도록 내가 못 찾으면 그 사람 이름으로 공지가 뜬다
  const t = fresh('late');
  const w = worldFirst(t, 'stat:endure');
  while (t.day < w.day) nextDay(t);
  assert.equal(t.world.firsts['stat:endure'].who, w.who);
  assert.equal(t.world.firsts['stat:endure'].mine, false);
  const line = noticesView(t, 200).find((n) => n.first && n.text.includes(w.who));
  assert.ok(line.text.includes("히든 스탯 '???'를"), '내가 아직 못 찾은 히든의 이름은 가려진다');
  assert.ok(!JSON.stringify(noticesView(t, 200)).includes('인내'));
  // 나중에 내가 찾아도 세계 최초는 아니다. 하지만 이제 이름은 보인다
  dispatch(t, { type: 'move', to: 'training' });
  let ev2 = [];
  for (let i = 0; i < 300; i++) { ev2.push(...dispatch(t, { type: 'act', id: 'strike' })); t.full = 80; }
  assert.ok(!ev2.some((e) => e.type === 'ding' && e.ding.kind === 'first'));
  assert.ok(ev2.some((e) => e.type === 'ding' && e.ding.title.includes('인내')));
  assert.ok(noticesView(t, 200).some((n) => n.text.includes(`'${w.who}'님이 히든 스탯 '인내'를`)));
  for (const [k, f] of Object.entries(FIRSTS)) { assert.ok(f.by[0] >= 8 && f.by[1] >= f.by[0], k); assert.ok(f.verb); }
});

test('가상 유저의 나날도 공지에 뜬다 (N6-6)', () => {
  const s = fresh('news');
  for (let i = 0; i < 5; i++) nextDay(s);
  const list = noticesView(s, 200);
  assert.ok(list.length >= 5);
  assert.ok(list.every((n) => n.text.startsWith("'")));
  assert.ok(s.log.some((l) => l.who === '세계 공지'));
});

test('랭킹 다섯 가지와 내 순위 둘레 (N6-4, N6-5)', () => {
  const s = fresh('rank');
  assert.deepEqual(RANKS.map((r) => r.name), ['레벨', '제작', '예술', '명성', '최초 발견']);
  for (const r of RANKS) {
    const v = ranking(s, r.id);
    assert.equal(v.total, 301);
    assert.equal(v.top.length, 3);
    const i = v.around.findIndex((x) => x.me);
    assert.ok(i >= 0);
    assert.equal(v.around[i].rank, v.myRank);
    if (v.myRank > 2 && v.myRank < 300) assert.equal(v.around.length, 5, '위아래 두 줄씩');
    for (let k = 1; k < v.around.length; k++) assert.equal(v.around[k].rank, v.around[k - 1].rank + 1);
  }
  const before = ranking(s, 'level').myRank;
  s.level = 40;
  assert.ok(ranking(s, 'level').myRank < before);
  assert.equal(ranking(s, 'level').myRank, 1);
  s.world.firsts['stat:endure'] = { who: s.name, day: 1, mine: true };
  assert.equal(ranking(s, 'first').myRank, 1);
});

test('소문 게시판: 사흘 내리 낚시하면 그 소문이 올라온다. 귀띔은 숫자도 이름도 없다 (M8-4, Q4-5)', () => {
  const s = fresh('rumor');
  assert.throws(() => dispatch(s, { type: 'rumor' }), /주점/);
  s.place = 'river';
  for (let d = 0; d < 3; d++) {
    assert.ok(!rumorsView(s).some((r) => r.id === 'fishdays'), `${d}일째에는 아직`);
    s.place = 'river'; s.battle = null; s.choice = null;
    dispatch(s, { type: 'act', id: 'fish' });
    if (d < 2) nextDay(s);
  }
  s.battle = null; s.choice = null;
  assert.ok(rumorsView(s).some((r) => r.id === 'fishdays' && r.text.includes('낚시')));
  // 하루 거르면 끊긴다
  nextDay(s); nextDay(s);
  assert.ok(!rumorsView(s).some((r) => r.id === 'fishdays'));
  // 읽으면 귀띔이 상태창의 그 칸에 적힌다
  s.place = 'tavern';
  const hints = rumorsView(s).filter((r) => r.about === 'hint');
  assert.equal(hints.length, 2);
  assert.notEqual(hints[0].id, hints[1].id);
  dispatch(s, { type: 'rumor' });
  for (const h of hints) assert.ok(s.hints[h.stat].includes(h.text));
  assert.ok(hiddenSlots(s).some((x) => !x.found && x.hints.length));
  for (const r of [...RUMORS_HINT, ...RUMORS_ABOUT_ME]) {
    assert.ok(!/\d/.test(r.text), r.text);
    for (const h of HIDDEN) assert.ok(!r.text.includes(h.name) || h.name === '행운' && false || !RUMORS_HINT.includes(r), `${r.text} / ${h.name}`);
  }
  // 떠돌이 악사는 하나 더 듣는다
  const b = fresh('rumor', 'bard');
  b.place = 'tavern';
  dispatch(b, { type: 'rumor' });
  assert.ok(Object.values(b.hints).flat().length >= 2);
});

test('경매장: 올리면 입찰이 붙고, 끝나면 수수료를 뺀 은화가 들어온다 (M8-5, N6-1~N6-3)', () => {
  const s = fresh('auc');
  s.bag = [];
  addItem(s, 'ironsword', 1, { grade: 2, maker: '태윤' });
  s.place = 'store';
  assert.throws(() => dispatch(s, { type: 'auction', op: 'list', index: 0, start: 20, days: 1 }), /광장/);
  s.place = 'plaza';
  assert.throws(() => dispatch(s, { type: 'auction', op: 'list', index: 0, start: 0, days: 1 }), /시작가/);
  assert.throws(() => dispatch(s, { type: 'auction', op: 'list', index: 0, start: 20, days: 2 }), /하루 또는 사흘/);
  dispatch(s, { type: 'auction', op: 'list', index: 0, start: 40, days: 1 });
  assert.equal(countOf(s, 'ironsword'), 0);
  let v = auctionView(s);
  assert.equal(v.mine.length, 1);
  assert.equal(v.fee, 5);
  const silver = s.silver;
  nextDay(s);
  v = auctionView(s);
  assert.equal(v.mine.length, 0);
  const deal = s.auction.history.at(-1);
  assert.equal(deal.kind, 'sold');
  assert.ok(deal.amount >= 40);
  assert.equal(deal.fee, Math.ceil(deal.amount * 0.05));
  assert.equal(s.silver, silver + deal.amount - deal.fee);
  assert.ok(deal.text.includes('낙찰'));
  assert.ok(s.log.some((l) => l.who === '경매장'));
  // 너무 비싸게 올리면 아무도 사지 않고 돌아온다
  addItem(s, 'ironsword', 1, { grade: 0 });
  dispatch(s, { type: 'auction', op: 'list', index: s.bag.findIndex((x) => x.id === 'ironsword'), start: 5000, days: 1 });
  nextDay(s);
  assert.equal(s.auction.history.at(-1).kind, 'unsold');
  assert.equal(countOf(s, 'ironsword'), 1);
  // 사흘짜리는 입찰과 한마디가 쌓인다
  dispatch(s, { type: 'auction', op: 'list', index: s.bag.findIndex((x) => x.id === 'ironsword'), start: 10, days: 3 });
  nextDay(s);
  const mine = auctionView(s).mine[0];
  assert.ok(mine.bids.length >= 1);
  assert.ok(mine.bids[0].who && mine.bids[0].say);
  assert.equal(mine.left, 2);
  // 상단과 단골이면 수수료가 절반
  s.factions.merchants = 30;
  assert.equal(feeRate(s), 0.025);
});

test('경매장: 가상 유저의 물건에 입찰한다. 이기면 물건이, 지면 은화가 돌아온다', () => {
  let won = null, lost = null;
  for (let i = 0; i < 40 && !(won && lost); i++) {
    const s = fresh('bid' + i);
    s.silver = 5000;
    const lots = lotsToday(s);
    assert.equal(lots.length, 3);
    assert.deepEqual(lotsToday(s), lots, '같은 날에는 같은 물건이 나온다');
    const lot = lots[0];
    assert.throws(() => dispatch(s, { type: 'auction', op: 'bid', key: lot.key, amount: lot.ask - 1 }), /이상을 불러야/);
    const high = i % 2 === 0;
    const amount = high ? lot.fair * 2 : lot.ask;
    dispatch(s, { type: 'auction', op: 'bid', key: lot.key, amount });
    assert.equal(s.silver, 5000 - amount);
    assert.throws(() => dispatch(s, { type: 'auction', op: 'bid', key: lot.key, amount }), /높아야/);
    const before = countOf(s, lot.item.id);
    nextDay(s);
    const h = s.auction.history.at(-1);
    if (h.kind === 'won') { won = s; assert.ok(countOf(s, lot.item.id) > before); assert.equal(s.silver, 5000 - amount); }
    else { lost = s; assert.equal(h.kind, 'lost'); assert.equal(s.silver, 5000); }
    assert.equal(s.auction.bids.length, 0);
  }
  assert.ok(won && lost, '이길 때도 질 때도 있다');
});

test('지난번 이후: 그사이의 낙찰·소문·공지가 먼저 보이고, 보고 나면 다음에는 안 보인다 (M8-6)', () => {
  const s = fresh('since');
  assert.deepEqual([sinceLast(s).notices, sinceLast(s).deals, sinceLast(s).rumors], [[], [], []]);
  s.bag = [];
  addItem(s, 'ironsword', 1, { grade: 2 });
  dispatch(s, { type: 'auction', op: 'list', index: 0, start: 30, days: 1 });
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 300; i++) { dispatch(s, { type: 'act', id: 'strike' }); s.full = 80; }
  const v = sinceLast(s);
  assert.ok(v.deals.some((t) => t.includes('낙찰')));
  assert.ok(v.rumors.some((t) => t.includes('허수아비')));
  assert.ok(v.notices.some((t) => t.includes('태윤')));
  markSeen(s);
  assert.deepEqual([sinceLast(s).notices, sinceLast(s).deals, sinceLast(s).rumors], [[], [], []]);
});

test('전설을 띄우면 세계 공지와 칭호 "전설을 두드린 자"를 얻는다 (태윤 8)', () => {
  let s = null, ev = [];
  for (let i = 0; i < 4000 && !s; i++) {
    const t = fresh('L8-' + i);
    dispatch(t, { type: 'move', to: 'forge' });
    t.bag = []; addItem(t, 'ironore', 6); addItem(t, 'oakbranch', 1);
    t.skills.smithing.grade = 30;
    dispatch(t, { type: 'craft', recipe: 'ironsword' });
    let e = [];
    while (t.craft) e = dispatch(t, { type: 'hammer' });
    if (e.some((x) => x.type === 'craft' && x.phase === 'done' && x.grade === 4)) { s = t; ev = e; }
  }
  assert.ok(s);
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'first'));
  assert.ok(noticesView(s).some((n) => n.mine && n.text.includes('전설 장비를 세계에서 처음 만들었습니다')));
  assert.equal(titleView(s).find((t) => t.got && t.id === 'legend').name, '전설을 두드린 자');
  assert.ok(rumorsView(s).some((r) => r.id === 'legend'));
  // 남는 희귀 검을 경매장에 올리자 가상 유저들이 한마디씩 남기며 입찰한다
  if (s.choice) dispatch(s, { type: 'choose', id: 'later' });
  s.place = 'plaza';
  addItem(s, 'ironsword', 1, { grade: 2, maker: s.name });
  dispatch(s, { type: 'auction', op: 'list', index: s.bag.findIndex((x) => x.id === 'ironsword' && x.grade === 2), start: 30, days: 3 });
  nextDay(s);
  assert.ok(auctionView(s).mine[0].bids.every((b) => b.say));
});

test('서진 8·덕수 8: 한길꾼이 되면 세계 공지에 이름이 뜨고, 사흘 낚시의 소문이 게시판에 오른다', () => {
  const s = createGame({ name: '서진', origin: 'smithboy', spent: {}, seed: 'seojin-8' });
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 300; i++) dispatch(s, { type: 'act', id: 'strike' });
  dispatch(s, { type: 'greet', npc: 'instructor' });
  dispatch(s, { type: 'choose', id: 'accept' });
  s.place = 'forest';
  s.battle = { mon: 'boar', hp: 1, turn: 1, intent: 'gore', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 }; s.status = []; s.hp = 100;
  dispatch(s, { type: 'battle', choice: 'attack' });
  s.place = 'training';
  dispatch(s, { type: 'greet', npc: 'instructor' });
  dispatch(s, { type: 'choose', id: 'accept' });
  assert.equal(s.job, 'oneway');
  assert.equal(s.main.done[0].path, 'hidden');
  const texts = noticesView(s).filter((n) => n.mine).map((n) => n.text);
  assert.ok(texts.some((t) => t.includes("히든 직업 '한길꾼'을")));
  assert.ok(texts.some((t) => t.includes("히든 퀘스트 '교관의 부탁'을")));
  assert.equal(ranking(s, 'first').myRank, 1);
});

test('7판 저장은 8판으로 올라온다', () => {
  const s = fresh('v7');
  const old = JSON.parse(JSON.stringify(s));
  delete old.world; delete old.auction;
  old.v = 7; old.day = 5;
  const up = parseSave(JSON.stringify({ v: 7, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.world.today.day, 5);
  nextDay(up);
  assert.ok(up.world.notices.length >= 1);
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, state: { ...JSON.parse(JSON.stringify(s)), auction: null } })), /경매장/);
});

// ── 검토에서 나온 것들 ──
test('가게에서 사서 경매에 올리는 것으로는 은화가 불어나지 않는다. 싸게 올려도 헐값에 팔리지 않는다', () => {
  let spent = 0, back = 0;
  for (let i = 0; i < 60; i++) {
    const s = fresh('loop' + i);
    s.bag = []; s.silver = 0;
    addItem(s, 'redpotion', 10);
    spent += 200;
    dispatch(s, { type: 'auction', op: 'list', index: 0, start: 230, days: 3 });
    for (let d = 0; d < 3; d++) nextDay(s);
    back += s.silver + countOf(s, 'redpotion') * 20 * 0.4;
  }
  assert.ok(back < spent, `쓴 은화 ${spent}, 돌아온 은화 ${Math.round(back)}`);
  const t = fresh('cheap');
  t.bag = []; addItem(t, 'forgetwater', 1);
  dispatch(t, { type: 'auction', op: 'list', index: 0, start: 1, days: 3 });
  for (let d = 0; d < 3; d++) nextDay(t);
  assert.ok(t.auction.history.at(-1).amount >= 100, `잊는 물이 은화 ${t.auction.history.at(-1).amount}에 팔렸다`);
  // 유찰된 묶음은 가방의 같은 것과 다시 묶인다
  const u = fresh('unsold');
  u.bag = []; addItem(u, 'herb', 5);
  dispatch(u, { type: 'auction', op: 'list', index: 0, start: 9000, days: 1 });
  addItem(u, 'herb', 2);
  nextDay(u);
  assert.equal(u.bag.filter((x) => x.id === 'herb').length, 1);
  assert.equal(countOf(u, 'herb'), 7);
});

test('날이 넘어가는 바로 그 행동으로 찾은 것은 내 것이다', () => {
  const s = fresh('edge');
  const w = worldFirst(s, 'stat:endure');
  dispatch(s, { type: 'move', to: 'training' });
  s.counters.act.strike = 299; s.day = w.day - 1; s.phase = 2; s.tick = 49; s.world.today.day = s.day;
  const ev = dispatch(s, { type: 'act', id: 'strike' });
  assert.equal(s.day, w.day);
  assert.equal(s.world.firsts['stat:endure'].mine, true);
  assert.ok(ev.some((e) => e.type === 'ding' && e.ding.kind === 'first'));
});

test('망가진 세계·경매 칸은 걸러진다', () => {
  const good = JSON.parse(JSON.stringify(fresh('brk8')));
  const wrap = (st) => JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: st });
  assert.ok(parseSave(wrap(good)));
  const item = { id: 'herb', grade: 0, n: 1 };
  const bads = [
    { world: { ...good.world, firsts: { 'stat:endure': null } } },
    { auction: { no: 1, mine: [{ no: 1, item, start: 1, day: 1, ends: 2, bids: [null] }], bids: [], history: [] } },
    { auction: { no: 1, mine: [{ no: 1, item: { ...item, n: 0 }, start: 1, day: 1, ends: 2, bids: [] }], bids: [], history: [] } },
    { auction: { no: 1, mine: [], bids: [{ key: '1-0', amount: 1.5, item, fair: 3, ends: 2 }], history: [] } },
    { auction: { no: 1, mine: [], bids: [], history: [null] } },
    { dmem: { ruins: { seen: [], done: {}, nights: 'x' } } },
    { dungeon: { id: 'ruins', room: 'f2-door', cleared: {}, rested: {} }, choice: { kind: 'trap', room: 'f2-door' } },
  ];
  for (const b of bads) assert.throws(() => parseSave(wrap({ ...good, ...b })), /망가졌습니다/, JSON.stringify(b).slice(0, 80));
});
