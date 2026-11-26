// 곳마다 하는 일 (Z23): 훈련소의 치기처럼, 한 번 누르면 한 번 하고 그 숙련도가 오른다
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { valueOf } from '../src/core/derived.js';
import { PLACES, ACTIONS } from '../src/data/places.js';
import { ACTION_LINES } from '../src/data/lines.js';
import { SKILL_NAMES } from '../src/core/skills.js';
import { spokeToday } from '../src/core/social.js';

const fresh = (seed = 'chore') => createGame({ name: '일꾼', origin: 'farmer', spent: {}, seed });
const chores = Object.values(ACTIONS).filter((a) => a.chore);

test('마을의 곳마다 손으로 거듭할 일이 하나씩 있다. 칸은 다섯을 넘지 않는다', () => {
  const none = [];
  for (const p of Object.values(PLACES)) {
    assert.ok(p.actions.length <= 5, `${p.name}: 칸 ${p.actions.length}`);
    if (p.wild) continue;
    const work = p.actions.filter((id) => ACTIONS[id] && !ACTIONS[id].open && !ACTIONS[id].rest && !ACTIONS[id].service);
    if (!work.length) none.push(p.name);
  }
  // 주점·주막·여인숙은 칸이 이미 다섯이라 없다
  assert.deepEqual(none.sort(), ['뱃사람 주막', '여인숙 골목', '주점'].sort());
  for (const a of chores) {
    assert.ok(SKILL_NAMES[a.skill], `${a.label}: 숙련도 이름`);
    assert.ok(ACTION_LINES[a.id].length >= 3, `${a.label}: 글이 셋 이상`);
  }
});

test('한 번 누르면 한 번. 그 일의 숙련도가 오르고, 먼 마을일수록 많이 오른다', () => {
  const smithy = (seed) => createGame({ name: '쇠', origin: 'smithboy', spent: {}, seed }); // 쇠의 사람은 풀무질을 처음부터 안다
  const s = smithy('chore');
  dispatch(s, { type: 'move', to: 'forge' });
  const slot = slotsNow(s).find((x) => x.label === '풀무질');
  assert.ok(slot);
  for (let i = 0; i < 40; i++) { dispatch(s, slot.action); s.full = 80; s.tired = 0; s.phase = 0; }
  assert.equal(s.counters.act.bellows, 40);
  assert.ok(s.skills.smithing.uses >= 40);
  // 같은 풀무질이라도 소리재의 장인 거리에서는 더 버거워서 더 많이 오른다
  const near = smithy('a'); near.place = 'forge';
  const far = smithy('a'); far.place = 'craftrow';
  for (let i = 0; i < 30; i++) { for (const g of [near, far]) { dispatch(g, { type: 'act', id: 'bellows' }); g.full = 80; g.tired = 0; g.phase = 0; } }
  const prog = (g) => g.skills.smithing.grade * 1e6 + g.skills.smithing.xp;
  assert.ok(prog(far) > prog(near));
});

test('새 숙련도 셋은 몸에 돌아온다: 기도는 마나, 나르기는 무게 한도, 지구력은 생명력', () => {
  const s = fresh();
  const mp = valueOf(s, 'maxMp'), carry = valueOf(s, 'carry'), hp = valueOf(s, 'maxHp');
  s.skills.pray = { grade: 10, xp: 0, uses: 0 };
  s.skills.haul = { grade: 10, xp: 0, uses: 0 };
  s.skills.stamina = { grade: 10, xp: 0, uses: 0 };
  assert.equal(valueOf(s, 'maxMp'), mp + 5);
  assert.equal(valueOf(s, 'carry'), carry + 5);
  assert.equal(valueOf(s, 'maxHp'), hp + 10);
  // 신전에서 기도하면 기도 숙련이 쌓인다
  const t = fresh('pray');
  dispatch(t, { type: 'move', to: 'temple' });
  for (let i = 0; i < 10; i++) dispatch(t, { type: 'act', id: 'pray' });
  assert.ok(t.skills.pray.uses >= 10);
});

test('가게에 일이 생겨도 주인은 전처럼 들어서면 먼저 말을 건다', () => {
  const s = fresh('shop');
  dispatch(s, { type: 'move', to: 'store' });
  assert.equal(spokeToday(s, 'granny'), true);
});

test('게임의 이름은 LinkPRG다. "띠링"은 알림 소리로만 남는다', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('<title>LinkPRG</title>'));
  const app = fs.readFileSync(new URL('../src/ui/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes("h('h1', {}, 'LinkPRG')"));
  assert.ok(!app.includes("h('h1', {}, '띠링')"));
});

test('남의 일터의 일은 배워야 한다: 모르면 구경하고, 오래 구경하거나 낯익은 사이가 되어 청하면 배운다 (Z29)', async () => {
  const { WATCH_TO_LEARN, knowsWork, nativeWork } = await import('../src/core/work.js');
  // 땅의 사람은 풀무질을 모른다. 칸은 "구경하기"로 뜬다
  const s = fresh('watch');
  dispatch(s, { type: 'move', to: 'forge' });
  const slot = slotsNow(s).find((x) => x.action?.id === 'bellows');
  assert.equal(slot.label, '구경하기 (풀무질)');
  for (let i = 0; i < WATCH_TO_LEARN - 1; i++) { dispatch(s, slot.action); s.full = 80; s.tired = 0; s.phase = 0; }
  assert.equal(knowsWork(s, 'bellows'), false);
  assert.equal(s.skills.smithing?.uses || 0, 0, '구경으로는 숙련도가 오르지 않는다');
  dispatch(s, slot.action);
  assert.equal(knowsWork(s, 'bellows'), true, '스무 번 구경하면 주인이 가르쳐 준다');
  assert.equal(slotsNow(s).find((x) => x.action?.id === 'bellows').label, '풀무질');
  // 낯익은 사이가 되어 청해도 배운다
  const t = fresh('ask');
  t.opened.push('dock'); t.place = 'shipyard'; // 나루의 배 짓는 곳
  assert.throws(() => dispatch(t, { type: 'learn', npc: 'shipwright' }), /낯선 사이/);
  t.people.shipwright = { pts: 10, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  dispatch(t, { type: 'learn', npc: 'shipwright' });
  assert.equal(knowsWork(t, 'plane'), true);
  assert.throws(() => dispatch(t, { type: 'learn', npc: 'shipwright' }), /더 배울 일이 없습니다/);
  // 출신이 처음부터 아는 일
  assert.deepEqual(nativeWork('smithboy').sort(), ['bellows', 'plane']);
  assert.ok(nativeWork('ferrykid').includes('rowing'));
  assert.equal(knowsWork(createGame({ name: '배', origin: 'ferrykid', spent: {}, seed: 'f' }), 'rowing'), true);
  // 누구나 하는 일(기도)은 배우지 않아도 된다
  assert.equal(knowsWork(fresh('pray'), 'pray'), true);
});

test('옛 저장: 이미 해 본 일은 아는 일로 읽힌다', async () => {
  const { parseSave } = await import('../src/core/save.js');
  const { SAVE_VERSION } = await import('../src/core/migrate.js');
  const s = fresh('old-work');
  const old = JSON.parse(JSON.stringify(s));
  delete old.learned;
  old.counters.act.bellows = 12;
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.ok(up.learned.includes('bellows'));
  assert.ok(!up.learned.includes('plane'));
});
