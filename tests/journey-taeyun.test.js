// 여정: 태윤(2·3단계)과 하람(4·7단계)의 조각 (M2-12).
// 채광 → 습격 → 예고를 읽고 방어, 그리고 쓰러짐 → 유품 찾기.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, enemyView, mapView } from '../src/core/game.js';
import { addItem, countOf, previewEquip } from '../src/core/inventory.js';
import { valueOf } from '../src/core/derived.js';

/** 사람이 하듯 한 번에 하나씩 누른다. 예고가 돌진류면 막고, 아니면 친다. */
function fightOn(s, log) {
  let guard = 0;
  while (s.battle && guard++ < 200) {
    const e = enemyView(s);
    const choice = e.next.kind === 'charge' ? 'defend' : s.hp < 30 && s.bag.some((x) => x.id === 'redpotion') ? null : 'attack';
    const ev = choice ? dispatch(s, { type: 'battle', choice }) : dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'redpotion') });
    log.push(...ev);
  }
}

test('태윤: 광산에 가서 캐고, 습격을 받아도 예고를 읽고 살아서 돌아온다', () => {
  const s = createGame({ name: '태윤', origin: 'smithboy', spent: { str: 2, con: 3 }, seed: 'taeyun-7' });
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 60; i++) dispatch(s, { type: 'act', id: 'strike' });
  dispatch(s, { type: 'move', to: 'plaza' });
  addItem(s, 'redpotion', 3); // 가게는 M3. 여정을 위해 쥐여 준다
  s.level = 5; s.stats.str += 6; s.stats.con += 6; s.hp = valueOf(s, 'maxHp');

  assert.equal(mapView(s).find((r) => r.id === 'mine').ambush, 15);
  const log = [];
  log.push(...dispatch(s, { type: 'travel', to: 'mine' }));
  fightOn(s, log);
  assert.equal(s.place, 'mine');

  // 캔다. 중간에 탐색도 한다. 기척을 알아채면 지켜본 뒤 돌아간다(싸움을 고르지 않는다).
  let blocked = 0;
  for (let i = 0; i < 120 && s.place === 'mine'; i++) {
    if (s.choice) {
      const ids = slotsNow(s).map((x) => x.action.id);
      dispatch(s, { type: 'choose', id: ids.includes('watch') ? 'watch' : ids.includes('leave') ? 'leave' : ids[ids.length - 1] });
      continue;
    }
    const ev = dispatch(s, { type: 'act', id: i % 6 === 5 ? 'explore' : 'mine' });
    log.push(...ev);
    const before = log.length;
    fightOn(s, log);
    blocked += log.slice(before).filter((e) => e.type === 'line' && /막고 되받아쳤다/.test(e.line.text)).length;
    if (s.full < 30) dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'riceball') });
  }
  assert.equal(s.place, 'mine', '쓰러지지 않았다');
  assert.equal(s.falls, 0);
  assert.ok(countOf(s, 'ironore') >= 40, `철광석 ${countOf(s, 'ironore')}`);
  assert.ok(s.skills.mining.grade >= 1);
  assert.ok(log.some((e) => e.type === 'battle' && e.phase === 'win'), '싸움을 한 번은 이겼다');
  assert.ok(blocked >= 1, '돌진을 막고 되받아친 적이 있다');
  assert.ok(log.some((e) => e.type === 'line' && e.line.k === 'intent'), '다음 행동이 예고되었다');

  log.push(...dispatch(s, { type: 'travel', to: 'plaza' }));
  fightOn(s, log);
  if (s.place !== 'plaza') dispatch(s, { type: 'travel', to: 'plaza' });
});

test('하람: 욕심내다 쓰러지고, 신전에서 깨어 유품을 찾으러 간다', () => {
  const s = createGame({ name: '하람', origin: 'farmer', spent: { agi: 5 }, seed: 'haram-3' });
  dispatch(s, { type: 'move', to: 'training' });
  s.silver = 80;
  let guard = 0;
  while (s.place !== 'forest' && guard++ < 20) { if (s.battle) dispatch(s, { type: 'battle', choice: 'flee' }); else dispatch(s, { type: 'travel', to: 'forest' }); }
  for (let i = 0; i < 12; i++) { if (!s.battle && !s.choice) dispatch(s, { type: 'act', id: 'gather' }); }
  addItem(s, 'oakbranch', 8);
  const branches = countOf(s, 'oakbranch');

  // 쓰러질 때까지 덮치고 친다. 방어하지 않는다.
  let fell = null;
  guard = 0;
  while (!fell && guard++ < 3000) {
    let ev;
    if (s.battle) ev = dispatch(s, { type: 'battle', choice: 'attack' });
    else if (s.choice) ev = dispatch(s, { type: 'choose', id: slotsNow(s)[0].action.id });
    else ev = dispatch(s, { type: 'act', id: 'explore' });
    fell = ev.find((e) => e.type === 'fall') || null;
    if (s.level > 3) s.hp = Math.min(s.hp, 20); // 너무 세지면 끝나지 않으니 지친 것으로 친다
  }
  assert.ok(fell, '결국 쓰러진다');
  delete s.flags.mustRebirth; // 이 여정은 신전에서 눈을 뜬 쪽으로 친다 (운명은 m20에서 따로 본다)
  assert.equal(s.place, 'temple');
  assert.ok(s.shadow >= 1, '죽음의 그림자가 쌓였다');
  assert.equal(fell.info.relicPlace, 'forest');
  const lostBranches = branches - countOf(s, 'oakbranch');
  assert.ok(countOf(s, 'oakbranch') <= branches);
  assert.ok(s.journal.at(-1).text.includes('신전'));
  assert.equal(s.equip.weapon.id, 'woodsword');

  // 바로 찾으러 간다
  const silverAfterFall = s.silver;
  guard = 0;
  while (s.place !== 'forest' && guard++ < 30) {
    if (s.battle) dispatch(s, { type: 'battle', choice: 'flee' });
    else if (s.place === 'temple') dispatch(s, { type: 'move', to: 'plaza' });
    else dispatch(s, { type: 'travel', to: 'forest' });
    if (s.place === 'temple' && !s.relic) break;
  }
  if (s.relic && s.place === 'forest' && !s.battle) {
    assert.ok(slotsNow(s).some((x) => x.label === '유품 찾기'));
    dispatch(s, { type: 'relic' });
    assert.equal(s.silver, silverAfterFall + fell.info.silver);
    assert.equal(s.relic, null);
    if (lostBranches > 0) assert.ok(countOf(s, 'oakbranch') > branches - lostBranches);
  }
});

test('목검을 철검으로 바꾸기 전에 공격력이 미리 보인다 (M2-3)', () => {
  const s = createGame({ name: '태윤', origin: 'smithboy', spent: { str: 4 }, seed: 'pv' });
  dispatch(s, { type: 'move', to: 'training' });
  s.bag = [];
  addItem(s, 'ironsword', 1);
  const pv = previewEquip(s, 0);
  const now = valueOf(s, 'attack');
  assert.equal(now, 21);
  assert.equal(now + pv.attack[1] - pv.attack[0], 29);
  assert.equal(pv.old.name, '낡은 목검');
  dispatch(s, { type: 'equip', index: 0 });
  assert.equal(valueOf(s, 'attack'), 29);
  assert.equal(s.bag[0].id, 'woodsword');
});

// ── M3-10: 태윤 4·5·6·7단계. 보관함 → 제작 → 진화 → 대장장이 → 전설 → 장착 (씨앗 고정) ──
test('태윤: 넘치는 재료를 맡기고, 열두 번씩 두드려 대장장이가 되고, 전설을 띄워 찬다', async () => {
  const { storeView } = await import('../src/core/trade.js');
  const { pendingEvolves, branchOf } = await import('../src/core/evolve.js');
  const { bodyView } = await import('../src/core/game.js');
  const s = createGame({ name: '태윤', origin: 'smithboy', spent: { str: 3 }, seed: 'taeyun-forge-2' });
  dispatch(s, { type: 'move', to: 'training' });
  s.bag = [];
  addItem(s, 'ironore', 70);
  addItem(s, 'oakbranch', 12);
  // 4단계: 무게가 넘친 것을 보고 주점 보관함에 맡긴다
  assert.ok(bodyView(s).over);
  dispatch(s, { type: 'move', to: 'tavern' });
  dispatch(s, { type: 'deposit', index: s.bag.findIndex((x) => x.id === 'ironore'), n: 40 });
  assert.ok(!bodyView(s).over);
  assert.equal(storeView(s).items[0].n, 40);

  // 5단계: 대장간에서 열두 번씩 손으로 두드린다
  dispatch(s, { type: 'move', to: 'forge' });
  let presses = 0, best = -1, legend = null, swords = 0;
  const makeOne = () => {
    if (countOf(s, 'ironore') < 6) { addItem(s, 'ironore', 60); }
    if (countOf(s, 'oakbranch') < 1) addItem(s, 'oakbranch', 10);
    const ready = !!s.evolve.smithing && s.work === 'smith'; // 갈래를 고르고 대장장이가 된 뒤의 전설만 센다
    dispatch(s, { type: 'craft', recipe: 'ironsword' });
    let ev = [];
    while (s.craft) { ev = dispatch(s, { type: 'hammer' }); presses++; s.full = 80; }
    swords++;
    const done = ev.find((e) => e.type === 'craft' && e.phase === 'done');
    best = Math.max(best, done.grade);
    if (done.grade === 4 && ready) legend = ev.find((e) => e.type === 'ding' && e.ding.kind === 'legend');
    // 6단계: 권유가 오면 받고, 갈림길이 오면 날 벼리기를 고른다
    if (s.choice?.kind === 'offer') dispatch(s, { type: 'choose', id: 'accept' });
    if (pendingEvolves(s).includes('smithing')) dispatch(s, { type: 'evolve', skill: 'smithing', branch: 'edge' });
    // 팔아서 가방을 비운다(전설은 남긴다)
    for (let i = s.bag.length - 1; i >= 0; i--) if (s.bag[i].id === 'ironsword' && !(legend && s.bag[i].grade === 4)) dispatch(s, { type: 'sell', index: i });
  };
  for (let i = 0; i < 1500 && !legend; i++) makeOne();
  assert.equal(presses, swords * 12, '모든 검은 열두 번씩 손으로 두드렸다');
  assert.equal(s.work, 'smith');
  assert.equal(branchOf(s, 'smithing').id, 'edge');
  assert.ok(s.silver > 0, '판 값이 은화로 들어왔다');

  // 7단계: 전설이 뜨고, 바꾸기 전에 얼마나 오르는지 보고 찬다
  assert.ok(legend, `전설이 뜬다 (만든 검 ${swords}자루, 가장 높은 등급 ${best})`);
  assert.equal(legend.ding.level, 4);
  const index = s.bag.findIndex((x) => x.id === 'ironsword' && x.grade === 4);
  const sword = s.bag[index];
  assert.equal(sword.maker, '태윤');
  assert.equal(sword.dur, Math.round(Math.round(80 * 0.8) * 1.1), '날 벼리기는 내구도를 깎고, 전설을 두드린 자 칭호가 곧바로 10% 늘린다 (Z51)');
  const before = valueOf(s, 'attack');
  const pv = previewEquip(s, index);
  // 전설에는 옵션이 셋 붙는다. 날카로운 옵션이 있으면 그만큼 더 세다
  const sharp = (sword.opt || []).filter((o) => o.id === "sharp").reduce((a, o) => a + o.v, 0);
  assert.equal(sword.opt.length, 3);
  assert.deepEqual(pv.attack, [6, 42 + sharp]);
  dispatch(s, { type: 'equip', index });
  assert.equal(valueOf(s, 'attack'), before + 36 + sharp);
  assert.ok(s.hidden.craft?.value >= 1, '수없이 만든 손에는 무언가 생겼다');
});
