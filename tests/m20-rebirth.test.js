// 죽음의 그림자(Z31)와 환생(Z32)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { fall, SHADOW_MAX, shadowView } from '../src/core/fall.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { derived } from '../src/core/derived.js';
import { valueOf as hiddenValue, hiddenById } from '../src/core/hidden.js';
import { grantTitle } from '../src/core/social.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION, migrate } from '../src/core/migrate.js';

const make = (origin = 'bard', seed = 'rb') => createGame({ name: '환', origin, rolled: rollDice('same'), seed });
const atk = (s) => derived(s).find((d) => d.id === 'attack').value;

test('쓰러질 때마다 그림자가 한 겹 쌓인다. 한 겹에 공격·방어 −5%, 여섯 겹까지', () => {
  const s = make();
  s.stats.str = 40;
  const base = atk(s);
  const info = fall(s, [], '');
  assert.deepEqual([info.shadow.from, info.shadow.to], [0, 1]);
  assert.equal(atk(s), base - Math.round(base * 0.05));
  for (let i = 0; i < 9; i++) fall(s, [], '');
  assert.equal(s.shadow, SHADOW_MAX);
  assert.equal(atk(s), base - Math.round(base * 0.30));
});

test('축복: 겹 × 레벨 × 은화 5를 내면 모두 걷힌다. 신전지기 앞에서만', () => {
  const s = make();
  s.level = 4;
  fall(s, [], ''); fall(s, [], '');
  delete s.flags.mustRebirth;
  assert.equal(shadowView(s).fee, 2 * 4 * 5);
  s.silver = 39;
  assert.throws(() => dispatch(s, { type: 'bless', npc: 'priest' }), /모자랍니다/);
  s.silver = 100;
  assert.throws(() => dispatch(s, { type: 'bless', npc: 'highpriest' }), /여기에 없습니다/);
  dispatch(s, { type: 'bless', npc: 'priest' });
  assert.equal(s.shadow, 0);
  assert.equal(s.silver, 60);
  assert.throws(() => dispatch(s, { type: 'bless', npc: 'priest' }), /그림자가 없습니다/);
});

test('기도 30번에 한 겹이 걷힌다. 묘지기는 20번', () => {
  const s = make();
  fall(s, [], ''); fall(s, [], '');
  delete s.flags.mustRebirth; // 신전에서 눈을 뜬 쪽으로 친다
  for (let i = 0; i < 29; i++) { s.tired = 0; dispatch(s, { type: 'act', id: 'pray' }); }
  assert.equal(s.shadow, 2);
  s.tired = 0; dispatch(s, { type: 'act', id: 'pray' });
  assert.equal(s.shadow, 1);
  const g = make('gravekeeper', 'gk');
  fall(g, [], '');
  delete g.flags.mustRebirth;
  for (let i = 0; i < 20; i++) { g.tired = 0; dispatch(g, { type: 'act', id: 'pray' }); }
  assert.equal(g.shadow, 0);
});

test('환생: 히든 스탯, 다시 일어선 몸으로 오른 스탯, 칭호 모두, 도감을 안고 다시 태어난다', () => {
  const s = make('bard', 'old');
  s.counters.nearDeath = 7; // 투지 1
  dispatch(s, { type: 'move', to: 'training' });
  const fightDef = hiddenById('fight');
  s.hidden.fight = { value: hiddenValue(fightDef, s), half: true };
  s.toughGained = { str: 2, agi: 0, con: 1, wis: 0 };
  grantTitle(s, [], 'scarecrow', '허수아비를 많이 쳤다');
  grantTitle(s, [], 'neighbor', '단골');
  s.title = 'neighbor';
  s.dex.mon.rat = { seen: 3, won: 3, lost: 0 };
  s.level = 9; s.silver = 300; s.day = 22; s.phase = 1;
  fall(s, [], '');
  const carry = rebirthCarry(s);
  const n = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'new', carry });
  const plain = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'new' });
  assert.equal(n.lives, 2);
  assert.equal(n.pastLives[0].name, '환');
  assert.equal(n.pastLives[0].level, 9);
  assert.equal(n.level, 1);
  assert.equal(n.silver, plain.silver, '가진 은화는 가지고 가지 못한다 (보관함에 맡긴 것만 남는다)');
  assert.equal(n.shadow, 0, '그림자는 가지고 가지 않는다');
  assert.equal(n.stats.str, plain.stats.str + 2);
  assert.equal(n.stats.con, plain.stats.con + 1);
  assert.equal(n.hidden.fight.value, 1);
  assert.equal(hiddenValue(fightDef, n), 1, '지난 삶의 횟수가 이어 세어진다');
  n.counters.nearDeath = 5; // 새 삶에서 더 하면 지난 몫 위에 쌓인다
  assert.ok(hiddenValue(fightDef, n) >= 2);
  assert.deepEqual(n.titles.map((t) => t.id).sort(), ['neighbor', 'scarecrow']);
  assert.equal(n.title, 'neighbor');
  assert.equal(n.dex.mon.rat.seen, 3);
  assert.equal(n.day, 22, '날짜는 이어 센다');
  assert.equal(n.flags.toughDay, 22, '같은 날 다시 일어선 몸을 또 쌓지 못한다');
  assert.equal(Object.keys(n.people).length, Object.keys(plain.people).length, '사람들과의 사이는 처음부터');
  // 다시 환생하면 지난 삶이 늘어난다
  const third = createGame({ name: '셋', origin: 'bard', rolled: rollDice('same'), seed: 'n3', carry: rebirthCarry(n) });
  assert.equal(third.lives, 3);
  assert.equal(third.pastLives.length, 2);
  assert.equal(third.stats.str, make().stats.str + 2);
});

test('통찰은 도감으로도 세니, 도감을 가지고 가도 두 번 세지 않는다', () => {
  const s = make('bard', 'ins');
  for (let i = 0; i < 60; i++) s.dex.items['x' + i] = { seen: 1 };
  const def = hiddenById('insight');
  const before = hiddenValue(def, s);
  const n = createGame({ name: '새', origin: 'bard', rolled: rollDice('same'), seed: 'n', carry: rebirthCarry(s) });
  assert.equal(hiddenValue(def, n), before);
});

test('옛 저장의 하루 쇠약은 그림자 한 겹이 된다', () => {
  const s = make();
  const old = JSON.parse(JSON.stringify(s));
  delete old.shadow; delete old.shadowPray; delete old.lives; delete old.pastLives; delete old.pastHidden; delete old.toughGained;
  old.weak = { day: s.day + 1, phase: 0 };
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.shadow, 1);
  assert.equal(up.weak, undefined);
  assert.equal(up.lives, 1);
  const old2 = JSON.parse(JSON.stringify(old)); old2.weak = null; delete old2.shadow;
  assert.equal(parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old2 })).state.shadow, 0);
});

test('쓰러지면 운이 정한다: 다섯에 하나 꼴로 다시 태어나야 한다. 그러면 아무것도 할 수 없고, 저장해도 남는다', () => {
  let reborn = 0;
  for (let k = 0; k < 200; k++) {
    const s = make('bard', 'fate' + k);
    const info = fall(s, [], '');
    assert.ok(['temple', 'rebirth'].includes(info.fate));
    if (info.fate === 'rebirth') {
      reborn++;
      assert.equal(s.flags.mustRebirth, true);
      assert.throws(() => dispatch(s, { type: 'act', id: 'pray' }), /다시 태어나야/);
      const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
      assert.equal(back.flags.mustRebirth, true, '다시 불러와도 피할 수 없다');
      const n = createGame({ name: '새', origin: 'bard', rolled: rollDice('same'), seed: 'n' + k, carry: rebirthCarry(s) });
      assert.ok(!n.flags.mustRebirth, '새 삶은 묶이지 않는다');
    } else assert.ok(!s.flags.mustRebirth);
  }
  assert.ok(reborn >= 25 && reborn <= 55, `200번 가운데 ${reborn}번`);
});

test('환생: 숙련도 전부, 제작 레벨, 던전 지도, 경험치의 1%가 남는다 (Z98)', async () => {
  const { levelTotal, XP_KEEP } = await import('../src/core/rebirth.js');
  const { xpToNext } = await import('../src/core/level.js');
  const s = make('bard', 'keep');
  s.level = 30; s.xp = 500;
  s.skills.smithing = { grade: 7, xp: 12, uses: 300 };
  s.craftLv = { smith: { lv: 4, xp: 9 }, sew: { lv: 2, xp: 0 }, jewel: { lv: 1, xp: 3 } };
  s.dmem.ruins = { seen: ['f1-gate', 'f1-hall'], done: { chest1: true }, nights: 3, keeper: 'beat' };
  let total = 500; for (let l = 1; l < 30; l++) total += xpToNext(l);
  assert.equal(levelTotal(s), total);
  const carry = rebirthCarry(s);
  assert.equal(carry.xp, Math.floor(total * XP_KEEP));
  const n = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'keep2', carry });
  const plain = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'keep2' });
  assert.equal(n.level, 5, '레벨 30의 경험치 1%는 레벨 5만큼이다');
  assert.equal(n.unspent, plain.unspent + 4 * 3, '오른 레벨만큼 스탯 점수가 붙는다');
  assert.deepEqual([n.skills.smithing.grade, n.skills.smithing.xp], [7, 12]);
  assert.deepEqual(n.craftLv.smith, { lv: 4, xp: 9 });
  assert.deepEqual(n.craftLv.sew, { lv: 2, xp: 0 });
  assert.deepEqual(n.dmem.ruins, { seen: ['f1-gate', 'f1-hall'], done: {}, nights: 0, keeper: null }, '지도만 남고 문지기와의 일은 다시 한다');
  assert.equal(n.main.chapter, 1);
  // 저장했다 읽어도 같다
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: n })).state;
  assert.deepEqual(back.dmem, n.dmem);
});

test('일로 오른 스탯은 환생해도 남는다 (Z101). 삶을 거듭해도 이어 쌓인다', () => {
  const s = make('bard', 'toil');
  s.place = 'temple';
  const before = s.stats.wis;
  let n = 0;
  while ((s.toilGained.wis || 0) < 2 && n++ < 3000) { s.tired = 0; s.full = 80; dispatch(s, { type: 'act', id: 'pray' }); }
  assert.equal(s.toilGained.wis, 2, '기도로 지혜가 두 번 올랐다');
  assert.equal(s.stats.wis, before + 2);
  const plain = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'new' });
  for (const chosen of [false, true]) {
    const carry = rebirthCarry(s, { chosen });
    assert.equal(carry.toilGained.wis, 2);
    const next = createGame({ name: '새', origin: 'farmer', rolled: rollDice('same'), seed: 'new', carry });
    assert.equal(next.toilGained.wis, 2, '다음 삶에서도 세어 둔다');
    // 가져온 경험치로 레벨이 올라도 스탯은 점수로만 오른다: 지혜는 일로 오른 만큼만 더 높다
    assert.equal(next.stats.wis, plain.stats.wis + 2);
    next.toilGained.wis += 1;
    assert.equal(rebirthCarry(next).toilGained.wis, 3, '세 번째 삶으로도 이어진다');
  }
  // 이 칸이 없던 옛 저장은 0에서 센다
  const old = JSON.parse(JSON.stringify(s)); delete old.toilGained;
  assert.deepEqual(migrate(old).toilGained, { str: 0, agi: 0, con: 0, wis: 0 });
});
