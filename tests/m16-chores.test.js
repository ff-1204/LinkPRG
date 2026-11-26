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
  const s = fresh();
  dispatch(s, { type: 'move', to: 'forge' });
  const slot = slotsNow(s).find((x) => x.label === '풀무질');
  assert.ok(slot);
  for (let i = 0; i < 40; i++) { dispatch(s, slot.action); s.full = 80; s.tired = 0; s.phase = 0; }
  assert.equal(s.counters.act.bellows, 40);
  assert.ok(s.skills.smithing.uses >= 40);
  // 같은 풀무질이라도 소리재의 장인 거리에서는 더 버거워서 더 많이 오른다
  const near = fresh('a'); near.place = 'forge';
  const far = fresh('a'); far.place = 'craftrow';
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
