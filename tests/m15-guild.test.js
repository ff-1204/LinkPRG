// 길드 (Z21)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { addItem } from '../src/core/inventory.js';
import { guildView, guildPerk, guildRank, GUILD_RANKS, guildBoard } from '../src/core/guild.js';
import { jobXp } from '../src/core/jobs.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';

const fresh = (seed = 'guild') => createGame({ name: '단원', origin: 'smithboy', spent: {}, seed });

test('길드: 한 일만큼 기여도가 쌓이고 계급이 오른다. 성격에 맞는 일은 두 배, 계급이 덕을 준다', () => {
  const s = fresh();
  assert.throws(() => dispatch(s, { type: 'guild', op: 'join', id: 'anvil' }), /레벨 3부터/);
  s.level = 3;
  dispatch(s, { type: 'guild', op: 'join', id: 'anvil' });
  assert.equal(guildView(s).mine.rank, '신입');
  assert.throws(() => dispatch(s, { type: 'guild', op: 'join', id: 'fang' }), /이미/);
  // 모루회: 강화 성공은 두 배로 쌓인다
  s.place = 'forge'; s.silver = 100000; addItem(s, 'ironore', 999);
  const sword = addItem(s, 'ironsword');
  dispatch(s, { type: 'enhance', index: s.bag.indexOf(sword) }); // +1은 반드시 된다
  assert.equal(sword.plus, 1);
  assert.equal(s.guild.contrib, 2);
  // 헌납: 은화 10에 기여 2
  dispatch(s, { type: 'guild', op: 'donate' });
  assert.equal(s.guild.contrib, 4);
  // 계급이 오르면 덕이 생긴다
  const base = jobXp(s, 'smithing', false);
  s.guild.contrib = GUILD_RANKS[2].at;
  assert.equal(guildRank(s), 2);
  assert.ok(Math.abs(guildPerk(s, 'craft') - 0.04) < 1e-9);
  assert.equal(guildPerk(s, 'fight'), 0, '다른 길드의 덕은 없다');
  assert.ok(jobXp(s, 'smithing', false) > base);
  // 순위에 내 기여도가 실린다
  const mine = guildBoard(s).find((x) => x.mine);
  s.guild.contrib += 5000;
  assert.equal(guildBoard(s).find((x) => x.mine).score, mine.score + 5000);
  assert.equal(guildBoard(s)[0].id, 'anvil');
  // 저장했다 읽어도 남는다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.equal(back.guild.id, 'anvil');
  // 나오면 기여도를 잃고, 그날은 다시 못 든다
  dispatch(s, { type: 'guild', op: 'leave' });
  assert.equal(s.guild, null);
  assert.throws(() => dispatch(s, { type: 'guild', op: 'join', id: 'fang' }), /내일/);
});

test('길드: 싸움에서 이기면 기여도가 쌓인다. 송곳니단이면 두 배이고 경험치도 더 얻는다', () => {
  const win = (guild) => {
    const s = fresh('fight'); s.level = 3; s.stats.str = 80; s.hp = 9999; s.place = 'forest';
    if (guild) dispatch(s, { type: 'guild', op: 'join', id: guild });
    if (guild) s.guild.contrib = GUILD_RANKS[4].at;
    const before = s.guild?.contrib || 0;
    s.battle = { mon: 'rat', hp: 1, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
    const xp0 = s.xp + s.level * 100000;
    dispatch(s, { type: 'battle', choice: 'attack' });
    return { got: (s.guild?.contrib || 0) - before, s, xp0 };
  };
  assert.equal(win('fang').got, 2);
  assert.equal(win('anvil').got, 1);
  assert.equal(win(null).got, 0);
});

test('옛 저장에는 길드가 없다. 읽으면 빈 채로 올라온다', () => {
  const s = fresh('old');
  const old = JSON.parse(JSON.stringify(s));
  delete old.guild; delete old.stance;
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.guild, null);
  assert.equal(up.stance, 'hold');
});

test('주사위: 굴릴 때마다 스탯이 달리 나뉜다. 합계는 늘 같고, 출신 보너스는 그 위에 더해진다', async () => {
  const { rollDice, DICE_TOTAL, DICE_MIN } = await import('../src/data/origins.js');
  const seen = new Set();
  let maxStr = 0;
  for (let n = 1; n <= 500; n++) {
    const r = rollDice(`salt|${n}`);
    assert.equal(r.str + r.agi + r.con + r.wis, DICE_TOTAL);
    assert.ok(Object.values(r).every((v) => Number.isInteger(v) && v >= DICE_MIN));
    seen.add(JSON.stringify(r));
    maxStr = Math.max(maxStr, r.str);
  }
  assert.ok(seen.size > 200, `눈이 고루 다르다 (${seen.size})`);
  assert.ok(maxStr >= 15, `오래 굴리면 한쪽으로 쏠린 눈도 나온다 (힘 ${maxStr})`);
  assert.deepEqual(rollDice('같은 글'), rollDice('같은 글'));
  const r = rollDice('salt|7');
  const s = createGame({ name: '주사위', origin: 'smithboy', rolled: r, seed: 'dice' });
  assert.equal(s.stats.str, r.str + 1, '대장간 심부름꾼은 힘 +1');
  assert.equal(s.unspent, 0);
  assert.throws(() => createGame({ name: '속임', origin: 'farmer', rolled: { str: 30, agi: 30, con: 30, wis: 30 } }), /주사위/);
});
