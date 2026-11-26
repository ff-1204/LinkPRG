// 전체 검토(2026-11-26)에서 나온 것
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, enemyView } from '../src/core/game.js';
import { roll01 } from '../src/core/rng.js';
import { fleeChance } from '../src/core/battle.js';
import { maxDur, repairCost } from '../src/core/gear.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const fresh = (seed = 'review') => createGame({ name: '검토', origin: 'farmer', spent: {}, seed });

test('글로 굴리는 주사위는 끝 글자만 달라도 눈이 고르게 흩어진다 (열 번씩 묶이지 않는다)', () => {
  const xs = Array.from({ length: 2000 }, (_, i) => roll01(`가나-farmer|plus|${i + 1}`));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  // 이웃한 눈이 닮지 않았다: 이번이 0.3 아래일 때 다음도 0.3 아래일 확률이 0.3 언저리다
  let low = 0, both = 0;
  for (let i = 0; i + 1 < xs.length; i++) if (xs[i] < 0.3) { low++; if (xs[i + 1] < 0.3) both++; }
  assert.ok(Math.abs(both / low - 0.3) < 0.08, `이어질 확률 ${(both / low).toFixed(2)}`);
  // 열 칸으로 나눠도 고르다
  const bins = Array(10).fill(0);
  for (const x of xs) bins[Math.floor(x * 10)]++;
  assert.ok(bins.every((n) => n > 140 && n < 260), bins.join(','));
  assert.equal(roll01('같은 글'), roll01('같은 글'));
});

test('이름난 개체는 몰려 나오지 않는다', async () => {
  const { eliteChance } = await import('../src/core/battle.js');
  const s = fresh('elite-spread');
  s.dex.mon.rat = { seen: 999, won: 999, lost: 0 };
  assert.equal(eliteChance(s, 'rat'), 0.25);
  let run = 0, longest = 0, total = 0;
  for (let i = 1; i <= 2000; i++) {
    const hit = roll01(`${s.seed}|elite|rat|${i}`) < 0.25;
    total += hit ? 1 : 0;
    run = hit ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  assert.ok(Math.abs(total / 2000 - 0.25) < 0.04, `나온 몫 ${total / 2000}`);
  assert.ok(longest <= 9, `가장 길게 이어진 수 ${longest}`);
});

test('도망 확률은 5%에서 95% 사이다', () => {
  const s = fresh('flee');
  s.place = 'forest';
  s.battle = { mon: 'rat', hp: 10, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  s.stats.agi = 999;
  assert.equal(fleeChance(s), 0.95);
  s.stats.agi = -999;
  assert.equal(fleeChance(s), 0.05);
});

test('맞받아쳐 이기면, 동료가 대신 맞아 주어도 일격은 나간다', () => {
  let struck = 0, won = 0;
  for (let i = 0; i < 30; i++) {
    const s = fresh('clash-shield-' + i);
    s.stats.str = 200; s.hp = 9999; s.place = 'forest';
    dispatch(s, { type: 'stance', id: 'clash' });
    s.party = [{ id: 'stonerabbit', hp: 9999, crossed: 0, bond: 0, plan: 'guard', row: 'front' }];
    s.battle = { mon: 'boar', hp: 99999, turn: 1, intent: 'gore', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
    if (enemyView(s).next.kind === 'wait') continue;
    const lines = dispatch(s, { type: 'battle', choice: 'defend' }).filter((e) => e.type === 'line').map((e) => e.line.text).join(' ');
    if (lines.includes('마주 쳐서 꺾었다')) { won++; if (lines.includes('꺾인 틈으로 내리쳤다')) struck++; }
  }
  assert.ok(won > 0, '이긴 판이 있다');
  assert.equal(struck, won, '이긴 판마다 일격이 나갔다');
});

test('인내의 까닭에는 숙련도 이름이 적힌다 (속 이름이 드러나지 않는다)', () => {
  const s = fresh('reason');
  s.stats.str = 200; s.hp = 9999; s.place = 'forest';
  dispatch(s, { type: 'stance', id: 'clash' });
  s.counters.act.smash = 299;
  s.battle = { mon: 'boar', hp: 99999, turn: 1, intent: 'gore', stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  let found = null;
  for (let i = 0; i < 6 && !found; i++) { s.hp = 9999; found = dispatch(s, { type: 'battle', choice: 'defend' }).find((e) => e.type === 'ding' && e.ding.reason)?.ding; }
  assert.ok(found, '인내가 생겼다');
  assert.ok(found.reason.includes('강타'), found.reason);
  assert.ok(!/smash|guard|evade|focus|enhance/.test(found.reason));
});

test('옛 저장의 손수 만든 장비: 늘어난 내구도가 최대치로 읽히고, 모르는 길드는 비워진다', () => {
  const s = fresh('old-gear');
  const old = JSON.parse(JSON.stringify(s));
  old.bag.push({ id: 'ironsword', grade: 2, n: 1, dur: 120, maker: '검토' });
  old.guild = { id: 'nowhere', contrib: 5, joined: 1 };
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  const sword = up.bag.at(-1);
  assert.equal(maxDur(sword), 120);
  assert.equal(repairCost(up, sword), 0, '닳지 않았으니 고칠 것이 없다');
  sword.dur = 70;
  assert.equal(maxDur(sword), 120, '닳아도 최대치는 그대로다');
  assert.equal(up.guild, null);
});

test('대화의 길드 기여도는 한 사람에 하루 한 번이다', () => {
  const s = fresh('guild-talk');
  s.level = 3;
  dispatch(s, { type: 'guild', op: 'join', id: 'lantern' });
  dispatch(s, { type: 'move', to: 'artguild' });
  for (let i = 0; i < 20; i++) dispatch(s, { type: 'talk', npc: 'granny' });
  assert.equal(s.guild.contrib, 2, '등불 모임이라 두 배지만 한 번만');
});

test('강화하고 옵션이 붙은 장비는 이름과 값에 드러난다. 강화해 팔아서 남는 것은 없다', async () => {
  const { shopView, sellPrice, worth } = await import('../src/core/trade.js');
  const { enhanceView } = await import('../src/core/gear.js');
  const s = fresh('worth'); s.place = 'forge'; s.title = 'maker'; s.name = '검토';
  const plain = { id: 'ironsword', grade: 4, n: 1, dur: 80, maker: '검토' };
  const plus = { ...plain, plus: 7, opt: [{ id: 'sharp', v: 8 }] };
  s.bag.push(plain, plus);
  const names = shopView(s).mine.map((x) => x.name);
  assert.ok(names.includes('+7 날카로운 철검'), names.join(', '));
  assert.ok(worth(plus) > worth(plain));
  // 한 단계 강화에 드는 것(은화 + 재료 값)이 그 강화로 오르는 파는 값보다 늘 크다
  for (let p = 0; p < 10; p++) {
    const item = { ...plain, plus: p };
    const v = enhanceView({ ...s, bag: [], silver: 0 }, item);
    const cost = v.silver + v.need.n * 4;
    const gain = sellPrice({ ...item, plus: p + 1 }, s) - sellPrice(item, s);
    assert.ok(cost > gain, `+${p + 1}: 드는 것 ${cost}, 오르는 값 ${gain}`);
  }
});

test('태세의 채비는 적이 더 빨라도 먼저 적힌다. 모은 것은 피해·회복 스킬에만 쓰인다. 길드 일은 던전 밖에서', () => {
  const s = fresh('order');
  s.stats.agi = 1; s.stats.con = 99; s.hp = 9999; s.place = 'forest';
  dispatch(s, { type: 'stance', id: 'dodge' });
  s.battle = { mon: 'wolf', hp: 9999, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
  const lines = dispatch(s, { type: 'battle', choice: 'defend' }).filter((e) => e.type === 'line').map((e) => e.line.text);
  const prep = lines.findIndex((t) => t.includes('움직임을 읽었다'));
  const after = lines.findIndex((t) => t.includes('흘려보냈다') || t.includes('늦었다') || t.includes('오지 않았다'));
  assert.ok(prep >= 0 && after > prep, lines.join(' / '));
  // 던전 안에서는 길드 일을 못 한다
  const d = fresh('dg'); d.level = 5; d.dungeon = { id: 'ruins', room: 'f1-hall' };
  assert.throws(() => dispatch(d, { type: 'guild', op: 'join', id: 'fang' }), /던전 안에서는/);
});
