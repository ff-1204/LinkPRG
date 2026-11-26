// 사람들의 말(Z26), 뿌리의 약속(Z25 ①), 첫 장면(Z27), 등급의 맛, 옛 인연(Z28)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, enemyView } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { TALKS } from '../src/data/talks.js';
import { PEOPLE } from '../src/data/people.js';
import { talkLine, spokeToday, bondOf } from '../src/core/social.js';
import { countOf, addItem } from '../src/core/inventory.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const make = (origin, seed = 'lore') => createGame({ name: '말', origin, rolled: rollDice('same'), seed });
const ROOTS = ['smithboy', 'farmer', 'hunter', 'bard', 'fallen', 'orphan'];
const listen = (s, id) => { s.flags.spoke = { ...(s.flags.spoke || {}), [id]: s.day }; return talkLine(s, id); };

test('사람 스물다섯의 말이 여섯 갈래로 다 있다. 히든의 이름은 말하지 않는다', () => {
  const ids = Object.keys(TALKS);
  assert.equal(ids.length, 25);
  for (const id of ids) {
    const t = TALKS[id];
    assert.ok(PEOPLE[id], id);
    assert.ok(t.chat.length >= 8, `${id} 잡담`);
    assert.ok(t.tip.length >= 3, `${id} 상식`);
    for (let ch = 1; ch <= 5; ch++) assert.ok((t.hint[ch] || []).length >= 1, `${id} ${ch}장 힌트`);
    assert.ok(t.close.length >= 3, `${id} 속마음`);
    assert.ok(t.time.day.length && t.time.night.length, `${id} 때`);
    for (const r of ROOTS) assert.ok(t.root[r], `${id} 출신 ${r}`);
    const all = JSON.stringify(t);
    for (const word of ['인내', '근성', '투지', '손재주', '매력', '통찰', '담력', '은신', '행운', '신앙', '친화', '집념', '울림을 얻']) assert.ok(!all.includes(word), `${id}: ${word}`);
  }
});

test('처음에는 내 뿌리를 알아보는 말, 그다음 이번 장의 힌트, 그다음 상식. 같은 줄은 연달아 나오지 않는다', () => {
  const s = make('hunter');
  const first = listen(s, 'instructor');
  assert.equal(first.kind, 'root');
  assert.equal(first.text, TALKS.instructor.root.hunter);
  assert.equal(listen(s, 'instructor').kind, 'hint');
  assert.equal(listen(s, 'instructor').kind, 'tip');
  assert.ok(s.lore.hints.some((h) => h.who === '교관' && h.ch === 1), '들은 힌트는 모인다');
  let last = null;
  for (let i = 0; i < 40; i++) { const l = listen(s, 'instructor'); assert.notEqual(l.text, last); last = l.text; }
  // 장이 넘어가면 그 장의 힌트가 먼저 나온다
  s.main.chapter = 3;
  const h = listen(s, 'instructor');
  assert.equal(h.kind, 'hint');
  assert.ok(TALKS.instructor.hint[3].includes(h.text));
});

test('속마음은 단골부터, 때의 말은 그때만 나온다', () => {
  const s = make('orphan', 'close');
  const kinds = new Set();
  for (let i = 0; i < 60; i++) kinds.add(listen(s, 'granny').kind);
  assert.ok(!kinds.has('close'));
  s.people.granny.pts = 40;
  let close = false;
  for (let i = 0; i < 80 && !close; i++) close = listen(s, 'granny').kind === 'close';
  assert.ok(close, '단골이 되니 속마음이 나온다');
  s.phase = 2;
  const nights = new Set();
  for (let i = 0; i < 80; i++) { const l = listen(s, 'granny'); if (l.kind === 'time') nights.add(l.text); }
  for (const t of nights) assert.ok(TALKS.granny.time.night.includes(t));
});

test('뿌리의 약속: 쇠·땅·숲·길·이름 있는 사람마다 적힌 대로 된다', () => {
  // 쇠의 사람: 대장간 주인과 낯익게 시작하고, 들어서면 먼저 말을 건다
  const a = make('minerkid', 'smith');
  assert.equal(bondOf(a, 'smith'), 1);
  dispatch(a, { type: 'move', to: 'forge' });
  assert.equal(spokeToday(a, 'smith'), true);
  // 땅의 사람: 시작 마을 사람들과 조금 가깝게
  const b = make('woodcutter', 'farm');
  assert.equal(b.people.instructor.pts, 5);
  assert.equal(b.people.agent, undefined, '나루 사람은 아니다');
  // 숲의 사람: 멧돼지 약점을 안다
  const c = make('trapper', 'forest');
  assert.ok(c.dex.mon.boar.seen >= 1);
  c.place = 'forest';
  c.battle = { mon: 'boar', hp: 999, turn: 1, intent: 'charge', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  if (enemyView(c).next?.kind === 'charge') assert.ok(enemyView(c).hint.includes('뒷발'));
  // 길의 사람: 주점에서 하루 한 잔
  const d = make('porter', 'road');
  dispatch(d, { type: 'move', to: 'tavern' });
  d.full = 50; d.tired = 40;
  dispatch(d, { type: 'drink', npc: 'keeper' });
  assert.equal(d.full, 60);
  assert.equal(d.tired, 30);
  assert.throws(() => dispatch(d, { type: 'drink', npc: 'keeper' }), /이미/);
  assert.throws(() => dispatch(make('farmer'), { type: 'drink', npc: 'keeper' }), /여기에 없습니다|사이가 아닙니다/);
  // 이름 있는 사람: 상단 쪽과 낯익게
  const e = make('clerk', 'name');
  assert.equal(bondOf(e, 'agent'), 1);
  assert.equal(bondOf(e, 'trader'), 1);
});

test('출신마다 첫 장면이 대화방에 뜬다. 영웅 이상은 가상 유저가, 전설은 세계 공지가 알아본다', () => {
  const s = make('squire', 'hero');
  assert.ok(s.log.some((l) => l.k === 'user' && l.text.includes('잘 안 나오는')));
  const t = make('ringerkid', 'legend');
  assert.ok(t.world.notices.some((n) => n.text && n.text.includes('드문 지난날')));
  assert.equal(t.flags.legendNight, true);
  t.phase = 1; t.tick = 49;
  dispatch(t, { type: 'move', to: 'training' });
  for (let i = 0; i < 60 && t.phase !== 2; i++) dispatch(t, { type: 'act', id: 'strike' });
  assert.ok(t.log.some((l) => l.text.includes('아주 작은 울림')));
});

test('옛 인연: 뿌리마다 한 번. 쇠의 사람은 정을 주워 대장간 주인에게 가져간다', () => {
  const s = make('smithboy', 'mem-smith');
  s.day = 3; s.place = 'mine'; s.counters.act.mine = 14;
  dispatch(s, { type: 'act', id: 'mine' });
  assert.equal(s.flags.memory, 'carry');
  assert.equal(countOf(s, 'oldchisel'), 1);
  s.place = 'forge';
  const before = s.people.smith.pts;
  s.flags.spoke = { smith: s.day };
  dispatch(s, { type: 'talk', npc: 'smith' });
  assert.equal(s.flags.memory, 'done');
  assert.equal(countOf(s, 'oldchisel'), 0);
  assert.ok(s.people.smith.pts > before);
  assert.ok(s.lore.hints.some((h) => h.ch === 3));
  // 신전의 사람: 기도하다 마루 밑 상자
  const o = make('pilgrim', 'mem-temple');
  o.day = 2; o.place = 'temple';
  dispatch(o, { type: 'act', id: 'pray' });
  assert.equal(o.flags.memory, 'done');
  assert.equal(countOf(o, 'bellpicture'), 1);
  // 길의 사람: 나루 주막에 들어서면
  const b = make('bard', 'mem-road');
  b.opened.push('dock'); b.place = 'dock';
  dispatch(b, { type: 'move', to: 'inn' });
  assert.equal(b.flags.memory, 'done');
  assert.ok(bondOf(b, 'innkeeper') >= 2);
  // 한 번뿐이다
  dispatch(b, { type: 'move', to: 'dock' });
  const n = b.journal.length;
  dispatch(b, { type: 'move', to: 'inn' });
  assert.equal(b.journal.length, n);
});

test('옛 인연: 이름 있는 사람은 빚 문서를 사들이거나 찢는다. 그 선택은 저장해도 남는다', () => {
  const s = make('fallen', 'mem-name');
  s.opened.push('bigmarket'); s.place = 'craftrow'; s.silver = 100;
  dispatch(s, { type: 'move', to: 'bigmarket' });
  assert.equal(s.choice?.kind, 'memory');
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.equal(back.choice.kind, 'memory');
  dispatch(s, { type: 'choose', id: 'tear' });
  assert.equal(s.flags.memory, 'done');
  assert.ok(s.people.elder.pts >= 10);
  const t = make('fallen', 'mem-name2');
  t.opened.push('bigmarket'); t.place = 'craftrow'; t.silver = 100;
  dispatch(t, { type: 'move', to: 'bigmarket' });
  dispatch(t, { type: 'choose', id: 'buy' });
  assert.equal(t.silver, 70);
});

test('옛 저장에는 들은 말이 없다. 읽으면 빈 채로 올라온다', () => {
  const s = make('farmer', 'old');
  const old = JSON.parse(JSON.stringify(s));
  delete old.lore;
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.deepEqual(up.lore, { hints: [] });
  assert.ok(addItem);
});

// ── 다시 일어선 몸 (Z30) ──
test('센 놈의 생명력을 30% 넘게 깎고 쓰러지면 지금 스탯의 1%가 쌓인다. 하루 한 번. 1이 차면 스탯이 오른다', () => {
  const lose = (s, mon, hpLeft) => {
    s.place = 'forest'; s.hp = 1; s.stats.agi = 1;
    s.battle = { mon, hp: hpLeft, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
    let ev = [];
    for (let i = 0; i < 30 && s.battle; i++) { s.hp = 1; ev = dispatch(s, { type: 'battle', choice: 'defend' }); }
    return ev.find((e) => e.type === 'fall')?.info;
  };
  // 멧돼지(레벨 5)에게 레벨 1이 덤벼 절반을 깎고 쓰러진다
  const s = make('farmer', 'tough');
  const str = s.stats.str;
  const info = lose(s, 'boar', 30);
  assert.ok(info, '쓰러졌다');
  assert.ok(info.tough, '다시 일어선 몸이 쌓였다');
  assert.equal(info.tough.gained.str, Math.round(str * 0.01 * 100) / 100);
  assert.equal(s.tough.str, info.tough.gained.str);
  // 같은 날 또 쓰러지면 쌓이지 않는다
  assert.equal(lose(s, 'boar', 30)?.tough ?? null, null);
  // 다음 날에는 다시 쌓인다. 쌓인 것이 1을 넘으면 스탯이 오른다
  s.day += 1; s.tough.str = 0.95;
  const before = s.stats.str;
  const next = lose(s, 'boar', 30);
  assert.ok(next.tough.raised.includes('str'));
  assert.equal(s.stats.str, before + 1);
  // 거의 못 깎았으면(30% 아래) 쌓이지 않는다
  const t = make('farmer', 'tough2');
  assert.equal(lose(t, 'boar', 58)?.tough ?? null, null);
  // 나보다 약한 적에게 쓰러지면 쌓이지 않는다
  const u = make('farmer', 'tough3'); u.level = 10;
  assert.equal(lose(u, 'rat', 1)?.tough ?? null, null);
});
