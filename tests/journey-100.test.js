// 여정 테스트: 레벨 1에서 100까지 (로드맵 M22의 끝났다고 보는 기준). 한 캐릭터, 한 저장으로 열 구간을 차례로 지난다.
// 구간마다: 그 구간의 사냥터로 길을 나서 그곳의 몬스터와 실제 규칙으로 한 판 싸우고, 그 구간의 장을 끝내고, 다음 지역으로 가는 길이 열리는 것을 본다.
// 마지막에 처음 모루에서 망치를 들어 종을 끝까지 짓고, 끝을 새기고, 레벨 100에서 경험치가 쌓이는 것과 "끝난 뒤"의 줄을 본다.
// 구간 안의 일(그 구간의 규칙, 푸는 길 셋, 서브와 히든)은 구간마다의 여정 테스트(journey-white ~ journey-anvil)가 본다. 여기서는 그것들이 한 줄로 이어지는지를 본다.
// 손으로 건너뛴 것: 구간마다의 사냥 수백 판(경험치를 그 구간 끝 레벨까지 준다), 장비 짓기(그 구간 장비를 입힌다), 장을 푸는 과정(끝내는 함수를 그대로 부른다).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, slotsNow, mapView, SAVE_VERSION } from '../src/core/game.js';
import { startBattle } from '../src/core/battle.js';
import { finishMain, mainView } from '../src/core/quests.js';
import { grantXp } from '../src/core/reward.js';
import { xpToNext } from '../src/core/level.js';
import { valueOf } from '../src/core/derived.js';
import { parseSave } from '../src/core/save.js';
import { afterView } from '../src/core/after.js';
import { tentsHere } from '../src/data/anvil.js';
import { rollDice } from '../src/data/origins.js';
import { ITEMS } from '../src/data/items.js';
import { PLACES, TOWNS } from '../src/data/places.js';
import { WILDS } from '../src/data/wild.js';
import { MAIN } from '../src/data/quests.js';
import { MONSTERS } from '../src/data/monsters.js';
import { BANDS, bandOfPlace, LEVEL_MAX } from '../src/data/bands.js';
import { TIERS } from '../src/data/tiers.js';
import { heal, fight, travel } from './_white.js';

/** 구간마다: 거점 마을, 한 판 싸울 사냥터, 그 구간에서 끝내는 장과 길(6장부터는 모두 끝까지 하거나 지어 내는 길). */
const ROUTE = [
  { n: 1, town: '시작 마을', wild: 'forest', chapters: [[1, 'fight'], [2, 'tell']] },
  { n: 2, town: '소리재', wild: 'pass', chapters: [[3, 'both'], [4, 'archive'], [5, 'mend']] },
  { n: 3, town: '언못', wild: 'snowfield', chapters: [[6, 'fish']] },
  { n: 4, town: '저울목', wild: 'saltfloor', chapters: [[7, 'buy']] },
  { n: 5, town: '가마골', wild: 'ashslope', chapters: [[8, 'forge']] },
  { n: 6, town: '뜬마을', wild: 'mossfield', chapters: [[9, 'peel']] },
  { n: 7, town: '지붕마을', wild: 'sunkenstreet', chapters: [[10, 'rebuild']] },
  { n: 8, town: '다릿목', wild: 'cliffroad', chapters: [[11, 'hear']] },
  { n: 9, town: '맞울', wild: 'pondside', chapters: [[12, 'share']] },
  { n: 10, town: '모루 아래 야영지', wild: 'meltgully', chapters: [] },
];
const put = (s, slot, id) => { if (ITEMS[id]) s.equip[slot] = { id, grade: 0, n: 1, dur: ITEMS[id].dur, max: ITEMS[id].dur }; };
/** 그 구간의 장비 한 벌(3구간부터는 그 단계의 것, 그 앞은 철검과 가죽). */
const gear = (s, n) => {
  if (n < 3) { put(s, 'weapon', 'ironsword'); return; }
  const m = TIERS.find((t) => t.n === n).metal[0];
  put(s, 'weapon', `${m}_sword`); put(s, 'head', `${m}_helm`); put(s, 'body', `${m}_armor`); put(s, 'hand', `${m}_gloves`); put(s, 'feet', `${m}_boots`);
};
/** 그 레벨이 될 때까지 경험치를 준다(손으로 건너뛴 사냥). 스탯 점수는 힘과 체력에 나눈다. */
const levelTo = (s, level) => {
  const ev = [];
  let g = 0;
  while (s.level < level && g++ < 200) grantXp(s, ev, xpToNext(s.level) - s.xp);
  const pts = s.unspent; s.stats.str += Math.ceil(pts / 2); s.stats.con += Math.floor(pts / 2); s.unspent = 0;
  heal(s);
};
const save = (s) => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;

test('여정: 레벨 1에서 100까지, 시작 마을에서 처음 모루까지 한 저장으로 이어진다 (M22)', (t) => {
  let s = createGame({ name: '끝까지', origin: 'farmer', rolled: rollDice('journey-100'), seed: 'journey-100' });
  assert.equal(s.level, 1);
  assert.equal(s.main.chapter, 1);
  assert.equal(BANDS.length, ROUTE.length);
  const seenTowns = [];
  let fights = 0;

  for (const r of ROUTE) {
    const band = BANDS[r.n - 1];
    // 1. 그 구간의 첫 레벨로 들어선다 (1구간은 레벨 1 그대로)
    if (r.n > 1) assert.equal(s.level, band.from - 1, `${band.name}에 들어설 때의 레벨`);
    gear(s, r.n);
    heal(s);
    // 2. 거점에 닿는다. 길이 열려 있어야 지도에 나오고 갈 수 있다
    const gate = TOWNS[r.town].gate;
    if (r.n === 2) for (const id of ['dock', 'bigmarket', 'pass']) if (!s.opened.includes(id)) s.opened.push(id); // 1부의 길(나루·소리재·고갯길)은 journey-town, m9, m10의 테스트가 본다
    if (r.n === 3 && !s.opened.includes('icegate')) s.opened.push('icegate'); // 끝을 본 밤 고개 너머의 소리 (journey-white가 본다)
    assert.ok(mapView(s).some((x) => x.name === r.town && !x.locked), `${r.town}이 지도에 있다`);
    if (s.place !== gate && PLACES[s.place].town !== r.town) travel(s, gate);
    assert.equal(PLACES[s.place].town, r.town);
    seenTowns.push(r.town);
    s.dex.places[gate] = true;
    // 3. 그 구간의 사냥터에서 그곳의 몬스터와 한 판 (실제 싸움 규칙: 큰 공격은 막고 나머지는 친다)
    if (PLACES[r.wild].locked && !s.opened.includes(PLACES[r.wild].opensWith || r.wild)) s.opened.push(PLACES[r.wild].opensWith || r.wild);
    heal(s);
    travel(s, r.wild);
    assert.equal(bandOfPlace(PLACES[r.wild]).n, r.n);
    const mon = WILDS[r.wild].monsters.at(-1).id;
    heal(s);
    startBattle(s, [], mon);
    fight(s);
    assert.equal(s.battle, null);
    assert.ok((s.dex.mon[mon]?.won || 0) >= 1, `${band.name}의 ${MONSTERS[mon].name}을 이겼다`);
    fights++;
    if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
    // 4. 그 구간의 끝 레벨까지 (손으로 건너뜀). 처음 모루는 망치를 들 수 있는 95까지만
    levelTo(s, r.n === 10 ? 95 : band.to);
    travel(s, gate);
    // 5. 그 구간의 장을 끝낸다. 다음 지역으로 가는 길이 열린다
    for (const [ch, path] of r.chapters) {
      assert.equal(s.main.chapter, ch, `${ch}장을 풀 차례`);
      if (ch === 5) { s.ending = 'mend'; s.endDay = s.day; } // 1부의 끝 (journey-seojin, m11의 테스트가 본다)
      const ev = [];
      finishMain(s, ev, path);
      for (const id of MAIN[ch].roads || []) assert.ok(s.opened.includes(id), `${ch}장을 끝내면 ${id}가 열린다`);
    }
    // 6. 저장했다 읽어도 같은 사람이다
    heal(s);
    const back = save(s);
    assert.equal(back.level, s.level);
    assert.deepEqual(back.main, s.main);
    s = back;
  }
  assert.deepEqual(seenTowns, ROUTE.map((r) => r.town));
  assert.equal(fights, 10);
  assert.equal(s.main.chapter, 13);
  assert.equal(s.main.done.length, 12);
  assert.equal(s.level, 95);

  // 7. 처음 모루: 일곱 천막에 일곱 사람, 모루 앞에서 망치를 든다
  assert.equal(PLACES[s.place].town, '모루 아래 야영지');
  assert.equal(tentsHere(s).length, 7);
  dispatch(s, { type: 'move', to: 'anvilfront' });
  assert.ok(slotsNow(s).some((x) => x.label === '망치를 든다'));
  heal(s);
  dispatch(s, { type: 'lifthammer' });
  let turns = 0;
  while (s.battle && turns++ < 800) { heal(s); dispatch(s, { type: 'battle', choice: s.battle.intent === 'charge' ? 'defend' : 'hammer' }); }
  assert.equal(s.anvil.built, true, `종을 끝까지 지었다 (${turns}턴)`);
  // 8. 일곱 장을 모두 끝까지 하거나 지어 내는 길로 풀었다: "다시 약속한다"가 열려 있다
  assert.deepEqual(slotsNow(s).filter((x) => !x.disabled).map((x) => x.label), ['다시 약속한다', '내려간다', '아직 새기지 않는다']);
  dispatch(s, { type: 'choose', id: 'again' });
  assert.equal(s.anvil.end, 'again');
  assert.equal(s.main.done.length, 13);
  assert.deepEqual(s.main.done.map((d) => d.chapter), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  assert.equal(mainView(s).name, '끝난 뒤: 다시 약속한다');

  // 9. 레벨 100: 거기가 끝이고, 그 뒤의 경험치는 쌓인다
  levelTo(s, 100);
  assert.equal(s.level, LEVEL_MAX);
  const ev = [];
  grantXp(s, ev, 482000 - s.xp);
  grantXp(s, ev, 10 ** 8);
  assert.equal(s.level, 100);
  assert.equal(s.xp, 482000 + 10 ** 8);
  assert.ok(!ev.some((e) => e.type === 'ding' && e.ding.kind === 'levelup'), '100 뒤에는 레벨업이 없다');
  const v = afterView(s);
  assert.ok(v.head.startsWith('레벨 100. 이 뒤의 경험치 '));
  assert.equal(v.rows.length, 6);
  assert.equal(valueOf(s, 'maxHp') > 0, true);
  // 10. 끝난 뒤에도 게임은 이어진다: 한 번 더 움직이고, 저장했다 읽어도 같다
  heal(s);
  dispatch(s, { type: 'act', id: 'look' });
  const last = save(s);
  assert.deepEqual(last.anvil, s.anvil);
  assert.equal(last.level, 100);
  assert.equal(s.falls, 0);
  t.diagnostic(`열 구간을 지나 ${s.day}일째, 레벨 ${s.level}, 끝낸 장 ${s.main.done.length}, 종을 짓는 데 ${turns}턴`);
});
