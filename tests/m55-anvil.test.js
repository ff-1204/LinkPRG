// M22 두 번째 약속: 처음 모루 (systems.md 20차, CM-). 세부 항목마다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, slotsNow, mapView, bodyView, townRooms, usersHere, SAVE_VERSION } from '../src/core/game.js';
import { startBattle, foeDef } from '../src/core/battle.js';
import { peopleHere } from '../src/core/social.js';
import { mercView, mercElsewhere } from '../src/core/party.js';
import { mainView, questBook } from '../src/core/quests.js';
import { choiceView } from '../src/core/explore.js';
import { parseSave } from '../src/core/save.js';
import { rebirthCarry, levelTotal } from '../src/core/rebirth.js';
import { gainXp, xpToNext } from '../src/core/level.js';
import { jobXp } from '../src/core/jobs.js';
import { ANVIL, temperMult, hiddenAnvilEnd, anvilEndChoices, temperView } from '../src/core/anvil.js';
import { afterView, STORY_HIDDENS, PROMO_WORKS, NAMED_MONS, notePromo } from '../src/core/after.js';
import { userAt, usersInBand, rumorsView, noticeText, follower, ranking, worldFirst } from '../src/core/world.js';
import { ANVIL_ENDS, ANVIL_LINES, TENT_PEOPLE, TENT_ROWS, PATH_KIND, tentsHere, kindCount, MAIN13, TENT_FEE } from '../src/data/anvil.js';
import { MAIN, HIDDENS } from '../src/data/quests.js';
import { MONSTERS } from '../src/data/monsters.js';
import { PLACES } from '../src/data/places.js';
import { WILDS } from '../src/data/wild.js';
import { SHOPS } from '../src/data/shops.js';
import { COMPANIONS } from '../src/data/companions.js';
import { PEOPLE } from '../src/data/people.js';
import { BANDS, normalAt, BOSS, LEVEL_MAX } from '../src/data/bands.js';
import { FIRSTS, USER_COUNT } from '../src/data/world.js';
import { HELP, HELP_MORE } from '../src/ui/help.js';
import { valueOf } from '../src/core/derived.js';
import { ponded, answered } from './_pond.js';
import { anviled, ironed, allHidden, act, lift, buildBell, pathsOf } from './_anvil.js';

const texts = (s) => s.log.map((l) => `${l.who || ''} ${l.text}`).join('\n');
const labels = (s) => slotsNow(s).map((x) => x.label);
const fresh = (s) => { s.tired = 0; s.full = 80; s.hp = valueOf(s, 'maxHp'); return s; };

// ── M22-1 곳 ──
test('M22-1 12장을 끝내기 전에는 처음 모루가 지도·소문·맞울의 칸 어디에도 없다 (CM-G1)', () => {
  const s = ponded('m22-hide');
  assert.ok(!JSON.stringify(mapView(s)).includes('모루'));
  assert.ok(!labels(s).some((l) => l.includes('모루')));
  assert.ok(!JSON.stringify(rumorsView(s)).includes('천막'));
  assert.throws(() => dispatch(s, { type: 'travel', to: 'anvilcamp' }), /길을 모릅니다/);
  assert.ok(!JSON.stringify(mainView(s)).includes('모루'));
});

test('M22-1 12장을 끝내면 맞울 어귀에서 이틀 길을 올라 모루 아래 야영지에 닿는다 (CM-A1, CM-A2)', () => {
  const s = fresh(answered('m22-road'));
  assert.ok(labels(s).includes('처음 모루로 오른다'));
  const day = s.day, phase = s.phase;
  dispatch(s, { type: 'travel', to: 'anvilcamp' });
  assert.equal(s.place, 'anvilcamp');
  assert.equal((s.day - day) * 3 + (s.phase - phase), 2, '이틀 길: 두 때가 간다');
  assert.equal(ANVIL.road, 100);
  assert.ok(texts(s).includes('모닥불 곁에 천막이 몇 채 서 있다.'));
  assert.ok(texts(s).includes(ANVIL_LINES.first[1]));
  assert.deepEqual(townRooms(s).map((r) => r.name), ['모루 아래 야영지', '일곱 천막', '식은 가마터', '모루 앞']);
  assert.ok(JSON.stringify(mapView(s)).includes('쇳물 골') && JSON.stringify(mapView(s)).includes('장인의 길'));
});

test('M22-1 곳의 칸은 시안대로다. 마을도 던전도 없다 (CM-A2~A7, CM-H6)', () => {
  const a = (id) => PLACES[id].actions;
  assert.deepEqual(a('anvilcamp'), ['look', 'rest', 'cook', 'storage']);
  assert.deepEqual(a('seventents'), ['talk', 'shop', 'merc']);
  assert.deepEqual(a('firstkiln'), ['craft', 'mend', 'plus', 'sew']);
  assert.deepEqual(a('anvilfront'), ['look', 'pray']);
  assert.deepEqual(a('meltgully'), ['explore', 'dig', 'rest']);
  assert.deepEqual(a('masterroad'), ['explore', 'dig', 'rest']);
  assert.deepEqual(WILDS.meltgully.monsters.map((m) => m.id), ['coldmelt', 'promiseshadow']);
  assert.deepEqual(WILDS.masterroad.monsters.map((m) => m.id), ['firsthand']);
  assert.deepEqual([MONSTERS.coldmelt.level, MONSTERS.promiseshadow.level, MONSTERS.firsthand.level], [91, 94, 97]);
  for (const id of ['anvilcamp', 'seventents', 'firstkiln', 'anvilfront', 'meltgully', 'masterroad']) assert.equal(PLACES[id].band, 10);
  // 방 빌리기도, 사당도, 게시판도 없다
  for (const id of ['anvilcamp', 'seventents', 'firstkiln', 'anvilfront']) for (const x of ['room', 'reborn', 'board', 'rumor']) assert.ok(!a(id).includes(x), `${id}에 ${x}`);
  // 첫쇠는 가게에 없다. 산에서 캔다
  assert.ok(!SHOPS.seventents.sells.includes('firstiron') && !SHOPS.seventents.sells.includes('shadowhide'));
  assert.ok(WILDS.meltgully.gather.drops.some((d) => d.id === 'firstiron') && WILDS.masterroad.gather.drops.some((d) => d.id === 'shadowhide'));
});

// ── M22-2 일곱 천막 ──
test('M22-2 일곱 천막: 지역마다 한 사람. 푼 길에 따라 사람이 다르다. 늘 일곱이다 (CM-C)', () => {
  assert.equal(TENT_PEOPLE.length, 21);
  assert.deepEqual(TENT_ROWS.map((r) => r[1]), ['흰마루', '소금벌', '잿골', '안개늪', '잠긴 도성', '구름다리', '별못']);
  // 시안 C의 표 그대로
  assert.deepEqual(TENT_ROWS.map((r) => [r[3].force.name, r[3].hand.name, r[3].word.name]), [
    ['깨어난 종루의 아이', '얼음 낚시터의 임자', '종지기 한솔'],
    ['삯을 받은 칼잡이', '상단 대리인 유겸', '저울을 내려놓은 저울꾼'],
    ['심판 노을', '큰 대장간 주인', '풀무꾼 다래'],
    ['등불지기 여울', '약초꾼 수련', '견습 보리'],
    ['창잡이 파랑', '청동 대장장이', '조합장 한별'],
    ['가면을 벗은 대사제', '견습 사제 새벽', '미루'],
    ['조각 줍는 솔', '그물 깁는 달래', '마당지기 다온'],
  ]);
  const f = anviled('t-f', { at: 'seventents', kinds: 'fffffff' });
  assert.deepEqual(peopleHere(f).map((p) => p.name), ['깨어난 종루의 아이', '삯을 받은 칼잡이', '심판 노을', '등불지기 여울', '창잡이 파랑', '가면을 벗은 대사제', '조각 줍는 솔']);
  const w = anviled('t-w', { at: 'seventents', kinds: 'wwwwwww' });
  assert.deepEqual(peopleHere(w).map((p) => p.name), ['종지기 한솔', '저울을 내려놓은 저울꾼', '풀무꾼 다래', '견습 보리', '조합장 한별', '미루', '마당지기 다온']);
  const mix = anviled('t-m', { at: 'seventents', kinds: 'hfwhfwh' });
  assert.deepEqual(peopleHere(mix).map((p) => p.name), ['얼음 낚시터의 임자', '삯을 받은 칼잡이', '풀무꾼 다래', '약초꾼 수련', '창잡이 파랑', '미루', '그물 깁는 달래']);
  assert.equal(tentsHere(mix).length, 7);
  // 일곱 장의 길 스물하나가 모두 힘·손·말 가운데 하나에 든다 (CM-C1)
  for (const ch of [6, 7, 8, 9, 10, 11, 12]) assert.deepEqual(MAIN[ch].paths.map((p) => PATH_KIND[ch][p.id]), ['force', 'hand', 'word'], `${ch}장`);
});

test('M22-2 지난 삶에서 끝낸 장은 지난 삶에 푼 길의 사람이 와 있다. 이번 삶에 다시 풀면 그 길의 사람이다 (CM-G4)', () => {
  const s = anviled('t-past', { at: 'seventents', kinds: 'fffffff' });
  const six = s.main.done.find((d) => d.chapter === 6);
  s.main.done = s.main.done.filter((d) => d.chapter !== 6);
  s.main.past = [{ ...six, path: 'talk' }];
  assert.equal(peopleHere(s)[0].name, '종지기 한솔');
  s.main.done.push({ chapter: 6, path: 'fish', day: 200 });
  assert.equal(peopleHere(s)[0].name, '얼음 낚시터의 임자');
});

test('M22-2 천막의 사람이 그 지역의 가게와 용병을 대신한다. 삯은 1,100. 와 있지 않은 사람은 구하지 못한다 (CM-C, CM-H6)', () => {
  const s = anviled('t-merc', { at: 'seventents', kinds: 'fffhhww' });
  s.silver = 9000;
  const v = mercView(s);
  assert.deepEqual(v.map((m) => m.role), ['막는 사람', '때리는 사람', '때리는 사람', '때리는 사람', '막는 사람', '고치는 사람', '북돋는 이']);
  assert.ok(v.every((m) => m.fee === 1100) && TENT_FEE === 1100);
  dispatch(s, { type: 'party', op: 'hire', id: 'tent7f' });
  assert.equal(s.silver, 7900);
  assert.ok(s.party.some((c) => c.id === 'tent7f'));
  assert.ok(!peopleHere(s).some((p) => p.id === 'tent7f'), '함께 나선 사람은 천막에 없다');
  assert.throws(() => dispatch(s, { type: 'party', op: 'hire', id: 'tent7w' }), /에서 구합니다|모르는/);
  assert.throws(() => dispatch(s, { type: 'talk', npc: 'tent6w' }), /여기에 없습니다/);
  // 맡는 자리는 누가 와 있든 같다
  for (const r of TENT_ROWS) assert.equal(new Set(['force', 'hand', 'word'].map((k) => COMPANIONS[r[3][k].id].role)).size, 1);
  // 일곱 천막의 가게: 지나온 일곱 지역의 쇠
  for (const id of ['frostiron', 'saltsteel', 'ashiron', 'mossiron', 'oldbronze', 'cloudsilver', 'starmetal']) assert.ok(SHOPS.seventents.sells.includes(id));
  // 다른 거점의 용병 창에는 내가 푼 길의 사람만 보인다
  s.place = 'silkhouse'; s.dex.places.seventents = true;
  const there = JSON.stringify(mercElsewhere(s));
  assert.ok(there.includes('칼잡이') && !there.includes('유겸') && !there.includes('저울꾼'));
});

test('M22-2 "힘 · 손 · 말"이라는 말은 화면에 나오지 않는다 (CM-C1)', () => {
  const s = anviled('t-word', { at: 'seventents' });
  const shown = JSON.stringify([peopleHere(s), mercView(s), mainView(s), questBook(s), slotsNow(s), townRooms(s)]);
  for (const w of ['force', '힘으로', '손으로 풀', '말로 풀', '힘의 길', '손의 길', '말의 길']) assert.ok(!shown.includes(w), w);
});

// ── M22-3 벼리며 싸우기 ──
test('M22-3 처음 모루의 싸움에서는 넷째 칸이 "망치질"이다. 한 턴에 벼림 +1, 하나마다 공격력 +4%, 열둘이 끝 (CM-B1, CM-B3)', () => {
  const s = ironed(anviled('tm-1', { at: 'meltgully' }));
  startBattle(s, [], 'coldmelt');
  const slots = slotsNow(s);
  assert.deepEqual(slots.map((x) => x.label.replace(/ \d+%$/, '')), ['공격', '스킬', '방어', '망치질', '도망']);
  assert.equal(slots[3].sub, '벼림 +1');
  assert.deepEqual(bodyView(s).temper.n, 0);
  s.battle.hp = 10 ** 7; // 오래 버티게
  s.battle.intent = 'hit';
  act(s, 'hammer');
  assert.equal(s.battle.temper, 1);
  assert.ok(texts(s).includes('싸우는 틈에 첫쇠 검을 모루 조각에 대고 내리쳤다. 벼림 1.'));
  assert.ok(Math.abs(temperMult(s) - 1.04) < 1e-9);
  for (let i = 0; i < 14; i++) { s.battle.intent = 'hit'; act(s, 'hammer'); }
  assert.equal(s.battle.temper, 12);
  assert.ok(Math.abs(temperMult(s) - 1.48) < 1e-9);
  const v = bodyView(s).temper;
  assert.deepEqual([v.n, v.max, v.pct], [12, 12, 48]);
  assert.deepEqual(v.tags[0], { name: '벼림 12', text: '공격력 +48%' });
});

test('M22-3 대장 레벨이 33을 넘으면 망치질 한 번에 둘이다 (CM-B3)', () => {
  const s = ironed(anviled('tm-2', { at: 'masterroad' }));
  s.craftLv.smith = { lv: 33, xp: 0 };
  startBattle(s, [], 'firsthand');
  s.battle.hp = 10 ** 7; s.battle.intent = 'hit';
  act(s, 'hammer');
  assert.equal(s.battle.temper, 1, '33은 넘은 것이 아니다');
  s.craftLv.smith.lv = 34;
  assert.equal(slotsNow(s)[3].sub, '벼림 +2');
  s.battle.intent = 'hit';
  act(s, 'hammer');
  assert.equal(s.battle.temper, 3);
});

test('M22-3 큰 공격을 막지 못하고 맞으면 벼림이 절반이 된다. 막으면 그대로다 (CM-B2, CM-B3)', () => {
  const s = ironed(anviled('tm-3', { at: 'meltgully' }));
  startBattle(s, [], 'coldmelt');
  s.battle.hp = 10 ** 7; s.battle.temper = 7;
  s.battle.intent = 'charge';
  act(s, 'defend');
  assert.equal(s.battle.temper, 7, '막으면 식지 않는다');
  s.battle.intent = 'hit';
  act(s, 'attack');
  assert.equal(s.battle.temper, 7, '작은 공격에는 식지 않는다');
  s.battle.intent = 'charge';
  act(s, 'attack');
  assert.equal(s.battle.temper, 3);
  assert.ok(texts(s).includes('달궈 놓은 것이 식었다. 벼림 3.'));
  assert.deepEqual(bodyView(s).temper.tags.map((t) => t.name), ['벼림 3', '식었다']);
  // 다시 두드리면 "식었다"가 걷힌다
  s.battle.intent = 'hit';
  act(s, 'hammer');
  assert.deepEqual(bodyView(s).temper.tags.map((t) => t.name), ['벼림 4']);
});

test('M22-3 벼림 열둘로 이긴 싸움은 든 무기의 내구도가 닳지 않고 따로 세어진다. 세어진 수는 화면에 나오지 않는다 (CM-B3)', () => {
  const s = ironed(anviled('tm-4', { at: 'meltgully' }));
  startBattle(s, [], 'coldmelt');
  const dur = s.equip.weapon.dur;
  s.battle.temper = 12; s.equip.weapon.dur = dur - 3; s.battle.intent = 'hit'; s.battle.hp = 1; // 한 번에 끝나게
  act(s, 'attack');
  assert.equal(s.battle, null);
  assert.equal(s.equip.weapon.dur, dur, '싸움을 시작할 때의 내구도로 돌아온다');
  assert.equal(s.counters.fullTemper, 1);
  assert.ok(texts(s).includes(ANVIL_LINES.kept));
  assert.ok(!JSON.stringify([bodyView(s), questBook(s), slotsNow(s)]).includes('fullTemper'));
  // 열둘이 아니면 닳는다. 싸움이 끝나면 벼림은 0이다(새 싸움은 0에서 시작한다)
  startBattle(s, [], 'coldmelt');
  assert.equal(s.battle.temper || 0, 0);
  s.battle.temper = 11; s.battle.intent = 'hit'; s.battle.hp = 1;
  act(s, 'attack');
  assert.ok(s.equip.weapon.dur < dur);
  assert.equal(s.counters.fullTemper, 1);
});

test('M22-3 처음 모루 밖의 싸움에는 망치질 칸도 벼림 칸도 없다 (CM-B3)', () => {
  const s = ironed(anviled('tm-5', { at: 'pondside' }));
  startBattle(s, [], 'starmoth');
  assert.ok(!labels(s).includes('망치질'));
  assert.equal(bodyView(s).temper, null);
  assert.throws(() => dispatch(s, { type: 'battle', choice: 'hammer' }), /벼릴 수 없습니다/);
  assert.equal(temperMult(s), 1);
});

// ── M22-5 마지막 싸움 ──
test('M22-5 레벨 95가 되기 전에는 모루 앞에 "둘러보기"와 "기도"만 있다. 둘러보면 한 줄 (CM-G2)', () => {
  const s = fresh(anviled('tb-1', { at: 'anvilfront', level: 94 }));
  assert.deepEqual(labels(s), ['둘러보기', '기도']);
  assert.throws(() => dispatch(s, { type: 'lifthammer' }), /손이 모자라다/);
  dispatch(s, { type: 'act', id: 'look' });
  assert.ok(texts(s).includes('아직 손이 모자라다'));
  s.level = 95;
  assert.deepEqual(labels(s), ['둘러보기', '기도', '망치를 든다']);
  // 12장을 끝내지 않은 사람에게는 없다
  const p = ponded('tb-1b'); p.level = 99; p.place = 'anvilfront';
  assert.ok(!labels(p).includes('망치를 든다'));
});

test('M22-5 지어지지 않은 종: 보통 몬스터의 생명력 4배·공격력 1.25배. 싸움에서 깨는 식은 껍질은 그 20분의 1이다 (LV-I3, CM-D3)', () => {
  const m = MONSTERS.unbuiltbell, n = normalAt(100);
  assert.deepEqual([m.level, m.hp, m.attack, m.boss, m.build], [100, n.hp * BOSS.hp, Math.round(n.attack * BOSS.attack), true, true]);
  const s = ironed(anviled('tb-2', { level: 96 }));
  lift(s);
  assert.equal(s.battle.mon, 'unbuiltbell');
  assert.equal(ANVIL.shell, 0.05);
  assert.ok(Math.abs(foeDef(s.battle).hp / (m.hp * ANVIL.shell) - 1) < 0.2, '껍질(사나움만큼만 더)');
  assert.equal(foeDef(s.battle).attack >= m.attack, true);
  assert.ok(texts(s).includes(ANVIL_LINES.lift) && texts(s).includes(ANVIL_LINES.bellRoom));
  const v = bodyView(s).temper;
  assert.deepEqual(v.bell, { n: 0, max: 100, shell: true, open: 0 });
  assert.deepEqual(v.tags[0], { name: '식은 껍질', text: '남음 (망치질이 절반만 먹는다)' });
  const slots = slotsNow(s);
  assert.equal(slots[0].sub, '껍질을 깬다');
  assert.equal(slots[3].label, '망치질');
});

test('M22-5 다섯 턴마다 큰 공격을 한다. 그 사이는 틈이다. 막지 못하면 종이 다섯 줄어든다 (CM-D5)', () => {
  const s = ironed(anviled('tb-3', { level: 96 }));
  lift(s);
  const seen = [];
  for (let i = 0; i < 10; i++) { seen.push(s.battle.intent); act(s, s.battle.intent === 'charge' ? 'defend' : 'hammer'); }
  assert.deepEqual(seen, ['seethe', 'seethe', 'seethe', 'seethe', 'charge', 'seethe', 'seethe', 'seethe', 'seethe', 'charge']);
  assert.equal(s.battle.bell, 4, '껍질이 남아 있으면 두 번에 +1 (여덟 번 두드렸다)');
  // 큰 공격을 맞는다
  s.battle.bellx = 40; s.battle.bell = 20; s.battle.temper = 6; s.party = []; s.stats.con += 300; // 맞고도 서 있게
  while (s.battle.intent !== 'charge') act(s, 'hammer');
  const before = s.battle.bell;
  s.battle.temper = 6;
  act(s, 'hammer');
  assert.equal(s.battle.bell, before - 5, '반 칸을 두드리고 다섯을 잃었다');
  assert.ok(texts(s).includes('종 −5.'));
  assert.ok(s.battle.temper <= 4, '벼림도 절반이 된다');
});

test('M22-5 생명력이 0이 되어도 쓰러지지 않는다. 껍질을 깨면 망치질이 두 배로 먹고, 열 턴 뒤 다시 굳는다 (CM-D2, CM-D3, M23-3)', () => {
  const s = ironed(anviled('tb-4', { level: 96 }));
  lift(s);
  s.battle.hp = 1;
  act(s, 'attack');
  assert.ok(s.battle, '쓰러지지 않는다');
  assert.equal(s.battle.hp, 0);
  assert.ok(texts(s).includes(ANVIL_LINES.broke));
  assert.equal(bodyView(s).temper.bell.shell, false);
  assert.equal(slotsNow(s)[3].sub, '종 +2');
  let turns = 0, got = 0;
  while (s.battle.hp === 0 && turns < 30) {
    const b0 = s.battle.bell;
    act(s, s.battle.intent === 'charge' ? 'defend' : 'hammer');
    got += s.battle.bell - b0; turns++;
  }
  assert.equal(turns, 10, '꼭 열 턴 동안 열려 있다');
  assert.equal(got, 16, '막는 두 턴을 빼고 여덟 번이 두 배로 먹었다 (한 번에 +2)');
  assert.ok(texts(s).includes(ANVIL_LINES.hard));
  assert.ok(s.battle.hp > 0);
  // 공격을 더 해도 싸움은 끝나지 않는다
  for (let i = 0; i < 12; i++) act(s, s.battle.intent === 'charge' ? 'defend' : 'attack');
  assert.ok(s.battle);
});

test('M22-5 대장 레벨이 33을 넘으면 껍질이 남아 있어도 한 번에 하나, 깨면 한 번에 넷이다 (CM-D4, M23-3)', () => {
  const s = ironed(anviled('tb-5', { level: 96 }));
  s.craftLv.smith = { lv: 34, xp: 0 };
  lift(s);
  assert.equal(slotsNow(s)[3].sub, '종 +1');
  act(s, 'hammer'); act(s, 'hammer');
  assert.equal(s.battle.bell, 2);
  s.battle.hp = 0; s.battle.open = 5;
  assert.equal(slotsNow(s)[3].sub, '종 +4');
  act(s, 'hammer');
  assert.equal(s.battle.bell, 6);
});

test('M22-5 종을 100까지 채워야 싸움이 끝난다. 끝나면 정이 쥐여 있다 (CM-D2, CM-D7)', () => {
  const s = ironed(anviled('tb-6', { level: 96 }));
  lift(s);
  s.battle.bellx = 198; s.battle.bell = 99;
  act(s, 'hammer');
  assert.ok(s.battle, '껍질이 있어 반만 먹었다: 아직 99다');
  act(s, 'hammer');
  assert.equal(s.battle, null);
  assert.equal(s.anvil.built, true);
  assert.ok(texts(s).includes(ANVIL_LINES.done) && texts(s).includes(ANVIL_LINES.carve[0]));
  assert.deepEqual(s.choice, { kind: 'anvilend' });
  assert.equal(s.dex.mon.unbuiltbell.won, 1);
  assert.equal(s.falls, 0);
  // 다 지은 뒤에는 망치를 다시 들 수 없다
  dispatch(s, { type: 'choose', id: 'back' });
  assert.deepEqual(labels(s), ['둘러보기', '기도', '새긴다']);
  assert.throws(() => dispatch(s, { type: 'lifthammer' }), /이미 다 지었습니다/);
});

test('M22-5 내려왔다 다시 오르면 채운 것의 절반에서 시작한다. 쓰러졌을 때도 같다 (CM-D5)', () => {
  const s = ironed(anviled('tb-7', { level: 96 }));
  lift(s);
  s.battle.bellx = 124; s.battle.bell = 62;
  assert.match(slotsNow(s)[4].label, /도망 100%/);
  act(s, 'flee');
  assert.equal(s.battle, null);
  assert.equal(s.anvil.left, 62);
  assert.equal(s.place, 'anvilfront');
  assert.equal(slotsNow(s).find((x) => x.label === '망치를 든다').sub, '종 31에서');
  lift(s);
  assert.equal(s.battle.bell, 31);
  assert.ok(texts(s).includes('종 31.'));
  // 쓰러진다: 쓰러짐의 규칙을 그대로 따른다
  s.battle.bellx = 80; s.battle.bell = 40; s.party = [];
  while (s.battle.intent !== 'charge') act(s, 'hammer');
  s.hp = 1; s.tired = 0; s.full = 80;
  dispatch(s, { type: 'battle', choice: 'hammer' });
  assert.equal(s.battle, null);
  assert.equal(s.falls, 1);
  assert.ok(s.anvil.left >= 35 && s.anvil.left <= 45, `쓰러질 때의 종이 남는다 (${s.anvil.left})`);
});

// ── M22-6 13장과 끝 다섯 ──
test('M22-6 13장 두 번째 약속: 퀘스트 창에는 글과 할 일 셋. 끝들의 이름은 종을 다 짓기 전에는 어디에도 없다 (CM-D)', () => {
  const s = anviled('te-0', { level: 96 });
  const v = mainView(s);
  assert.equal(v.name, '두 번째 약속');
  assert.equal(v.text, MAIN13.text);
  assert.ok(v.text.startsWith('여덟 종은 모두 여기서 났다.') && v.text.endsWith('망치는 그 곁에 그대로 있다.'));
  assert.deepEqual(v.paths.map((p) => [p.name, p.text]), [['망치를 든다', '모루 앞에서. 레벨 95부터'], ['지어지지 않은 종', '끝까지 짓는다'], ['고른다', '무엇을 약속할지']]);
  const shown = JSON.stringify([v, questBook(s), slotsNow(s)]);
  for (const e of Object.values(ANVIL_ENDS)) assert.ok(!shown.includes(e.name), e.name);
  // 레벨 94면 첫 줄이 닫혀 있다
  const low = anviled('te-0b', { level: 94 });
  assert.equal(mainView(low).paths[0].closed, '레벨 95부터');
});

const built = (seed, kinds, extra = () => {}) => { const s = ironed(anviled(seed, { level: 96, kinds })); extra(s); lift(s); s.battle.bellx = 199; s.battle.bell = 99; s.battle.hp = 0; s.battle.open = 5; act(s, 'hammer'); return s; };
const options = (s) => choiceView(s).options.map((o) => [o.label, !!o.disabled]);

test('M22-6 일곱 장 가운데 넷 이상을 고른 쪽의 끝이 열린다. 고를 수 없는 끝은 "???"다 (CM-D6, CM-G3, CM-H2)', () => {
  const hand = built('te-h', 'hhhhfww');
  assert.deepEqual(kindCount(hand), { force: 1, hand: 4, word: 2 });
  assert.deepEqual(options(hand), [['다시 약속한다', false], ['???', true], ['???', true], ['내려간다', false], ['아직 새기지 않는다', false]]);
  const force = built('te-f', 'ffffhww');
  assert.deepEqual(options(force), [['???', true], ['모루를 식힌다', false], ['???', true], ['내려간다', false], ['아직 새기지 않는다', false]]);
  const word = built('te-w', 'wwwwffh');
  assert.deepEqual(options(word), [['???', true], ['???', true], ['나누어 건다', false], ['내려간다', false], ['아직 새기지 않는다', false]]);
  // 고루 푼 사람(셋·둘·둘)은 "내려간다"만 고른다
  const even = built('te-e', 'fffhhww');
  assert.deepEqual(options(even), [['???', true], ['???', true], ['???', true], ['내려간다', false], ['아직 새기지 않는다', false]]);
  // 일곱을 한쪽으로 푼 사람도 한 끝만 열린다
  assert.deepEqual(anvilEndChoices(anviled('te-7', { kinds: 'hhhhhhh' })).map((c) => c.can), [true, false, false, true]);
  // 고를 수 없는 끝의 이름과 조건은 창 어디에도 없다
  const win = JSON.stringify(choiceView(even));
  for (const id of ['again', 'cool', 'share', 'eight']) assert.ok(!win.includes(ANVIL_ENDS[id].name), ANVIL_ENDS[id].name);
  assert.ok(!win.includes('넷') && !win.includes('히든'));
  // 고를 수 없는 끝은 눌러도 되지 않는다
  assert.throws(() => dispatch(even, { type: 'choose', id: 'again' }), /고를 수 없는 끝/);
  assert.throws(() => dispatch(even, { type: 'choose', id: 'eight' }), /고를 수 없는 끝/);
  assert.equal(even.anvil.end, null);
});

test('M22-6 1부에서 숨은 끝("서로 답한다")을 본 사람은 "나누어 건다"를 조건 없이 고른다 (CM-D9)', () => {
  const s = built('te-s', 'fffhhww', (x) => { x.ending = 'hidden'; });
  assert.deepEqual(options(s), [['???', true], ['???', true], ['나누어 건다', false], ['내려간다', false], ['아직 새기지 않는다', false]]);
  dispatch(s, { type: 'choose', id: 'share' });
  assert.equal(s.anvil.end, 'share');
});

test('M22-6 숨은 끝은 선택지에 없다. 조건을 못 채우면 어디에도 나오지 않는다 (CM-D6, CM-G3)', () => {
  const s = built('te-x', 'hhhhfww', (x) => { allHidden(x); x.hq.myding = { status: 'active', step: 'tell', count: 0, day: 1 }; });
  assert.equal(hiddenAnvilEnd(s), false);
  assert.equal(choiceView(s).options.length, 5, '끝 넷과 미루기뿐이다');
  const everything = JSON.stringify([choiceView(s), mainView(s), questBook(s), slotsNow(s), bodyView(s)]) + texts(s) + JSON.stringify([HELP, HELP_MORE]);
  assert.ok(!everything.includes('여덟이 친다'));
  assert.ok(!everything.includes(ANVIL_ENDS.eight.say.slice(0, 12)));
  dispatch(s, { type: 'choose', id: 'again' });
  assert.ok(!JSON.stringify([mainView(s), questBook(s), afterView(s)]).includes('여덟이 친다'));
});

test('M22-6 숨은 끝 "여덟이 친다": 일곱 지역의 히든을 모두 푼 사람은 고르지 않고 그 끝이 된다 (CM-D6, CM-D16, CM-H4)', () => {
  const s = built('te-8', 'fffhhww', (x) => allHidden(x));
  assert.equal(s.choice, null);
  assert.equal(s.anvil.end, 'eight');
  assert.ok(texts(s).includes('정을 대려는데 발소리가 났다. 일곱 사람이었다.') && texts(s).includes('"봤어. 네가 한 거. 이제 네가 쳐."'));
  assert.equal(s.main.called, '여덟 번째로 친 이');
  assert.equal(mainView(s).name, '끝난 뒤: 여덟이 친다');
});

test('M22-6 끝 넷의 글은 시안 그대로다. 한 번 새기면 고칠 수 없다 (CM-D12~D15)', () => {
  const said = {
    again: '마지막 글자를 새기자 종이 울었다. 아래에서, 그 아래에서, 일곱 번 답이 왔다. 얼음 속에서, 장터에서, 대장간에서, 늪에서, 물 밑에서, 구름 위에서, 못가에서. 띠링. 이번에는 내가 한 약속이었다.',
    cool: '종을 다시 가마에 넣었다. 쇳물이 되어 흘렀다. 아무것도 울리지 않았다. 손을 내려다보았다. 굳은살이 있었다. 그것으로 충분했다. 해냈다.',
    share: '큰 종을 쪼개 작은 종 여럿을 지었다. 소리는 멀리 가지 않는다. 옆 사람에게까지만 간다. 산을 내려가며 만나는 사람마다 하나씩 쥐여 주었다. "누가 끝까지 하면, 흔들어 줘요."',
    descend: '종은 모루 위에 두었다. 새기지 않았다. 내려가다 돌아보니 누가 올라오고 있었다. 망치는 제자리에 있다.',
  };
  const kinds = { again: 'hhhhfww', cool: 'ffffhww', share: 'wwwwffh', descend: 'fffhhww' };
  for (const id of ['again', 'cool', 'share', 'descend']) {
    const s = built(`te-say-${id}`, kinds[id]);
    assert.equal(ANVIL_ENDS[id].say, said[id]);
    dispatch(s, { type: 'choose', id });
    assert.ok(texts(s).includes(said[id]), id);
    assert.equal(s.anvil.end, id);
    assert.deepEqual(s.anvil.seen, [id]);
    assert.equal(s.choice, null);
    assert.equal(s.main.chapter, 14);
    assert.equal(s.main.called, ANVIL_ENDS[id].called);
    assert.ok(s.main.done.some((d) => d.chapter === 13 && d.path === id));
    assert.equal(mainView(s).name, `끝난 뒤: ${ANVIL_ENDS[id].name}`);
    assert.ok(s.dings.some((d) => d.title === `끝: ${ANVIL_ENDS[id].name}`) && s.dings.some((d) => d.title.includes("13장 '두 번째 약속'")));
    // 고칠 수 없다
    assert.ok(!labels(s).includes('새긴다') && !labels(s).includes('망치를 든다'));
    assert.throws(() => dispatch(s, { type: 'carve' }), /새길 때가 아닙니다/);
    assert.throws(() => dispatch(s, { type: 'lifthammer' }));
  }
});

test('M22-6 "아직 새기지 않는다"를 고르면 종은 모루 위에서 기다린다. 숨은 이야기를 마저 풀고 돌아오면 숨은 끝이 된다', () => {
  const s = built('te-wait', 'fffhhww');
  dispatch(s, { type: 'choose', id: 'back' });
  assert.equal(s.anvil.end, null);
  assert.ok(texts(s).includes(ANVIL_LINES.wait));
  allHidden(s);
  s.choice = null; s.hq.eighth = { status: 'declined', step: 'build', count: 0, day: 1 }; // 히든 퀘스트를 거절했어도 조건은 일곱 지역의 것이다
  dispatch(s, { type: 'carve' });
  assert.equal(s.anvil.end, 'eight');
});

test('M22-6 끝난 뒤의 띠링 (CM-D6): 또렷해지거나, 사라지고 내 말이 남거나, 사람의 이름이 붙거나, 그대로이거나, 사람이 함께 답한다', async () => {
  const { ding } = await import('../src/core/log.js');
  const ring = (s) => { const ev = []; const d = ding(s, ev, { level: 3, title: '무언가를 끝까지 했습니다' }); return { d, lines: ev.filter((e) => e.type === 'line').map((e) => e.line) }; };
  const base = () => { const s = anviled('ta-ring', { kinds: 'fffhhww' }); s.ending = 'keep'; s.anvil.built = true; return s; };
  // 13장을 끝내기 전: 1부의 끝(맡는다)이 바꾼 규칙 그대로
  let s = base();
  assert.equal(ring(s).d.silent, true);
  // 내려간다: 달라지는 것이 없다
  s = base(); s.anvil.end = 'descend';
  assert.equal(ring(s).d.silent, true);
  // 다시 약속한다: 1부의 규칙이 걷히고 띠링이 또렷해진다
  s = base(); s.anvil.end = 'again';
  let r = ring(s);
  assert.deepEqual([r.d.silent, r.d.clear, r.d.level], [false, true, 3]);
  assert.equal(r.lines[0].text, '띠링! 무언가를 끝까지 했습니다');
  // 모루를 식힌다: 띠링이 사라지고 내 말 한 줄이 남는다. 숙련도가 조금 빨리 오른다
  s = base(); s.anvil.end = 'cool';
  const xpBefore = jobXp(base(), 'strike', false);
  r = ring(s);
  assert.equal(r.d.silent, true);
  assert.deepEqual(r.lines.map((l) => [l.k, l.text]), [['sys', '무언가를 끝까지 했습니다'], ['me', '해냈다.']]);
  assert.ok(!r.lines.some((l) => l.text.includes('띠링')));
  assert.ok(Math.abs(jobXp(s, 'strike', false) / xpBefore - 1.1) < 1e-9);
  // 나누어 건다: 사이가 깊은 사람이 많을수록 자주 이름이 붙는다
  s = base(); s.anvil.end = 'share'; s.people = {};
  const named = (x, n) => { let c = 0; for (let i = 0; i < n; i++) if (ring(x).d.seenBy) c++; return c; };
  assert.equal(named(s, 20), 0, '사이가 깊은 사람이 없으면 이름이 붙지 않는다');
  for (const id of ['daon', 'dallae', 'sol']) s.people[id] = { pts: 40, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  const few = named(s, 40);
  for (const id of ['hansol', 'yugyeom', 'darae', 'yeoul', 'suryeon', 'bori', 'hanbyeol']) s.people[id] = { pts: 40, talked: 0, likes: [], dislikes: [], stats: [], met: true };
  const many = named(s, 40);
  assert.ok(few > 0 && few < many, `셋일 때 ${few}, 열일 때 ${many}`);
  assert.equal(many, 40, '열이면 띠링마다 붙는다');
  r = ring(s);
  assert.match(r.lines[0].text, /^띠링! 무언가를 끝까지 했습니다 \(.+[이가] 보았다\)$/);
  // 여덟이 친다: 종과 사람이 함께 답한다
  s = base(); s.anvil.end = 'eight';
  r = ring(s);
  assert.equal(r.d.clear, true);
  assert.deepEqual(r.lines.map((l) => l.k), ['ding', 'npc']);
  assert.equal(r.lines[1].text, ANVIL_LINES.together);
  assert.ok(TENT_PEOPLE.some((t) => t.name === r.lines[1].who));
});

test('M22-6 "내려간다": 야영지에 내 천막이 남고, 사흘 뒤 가상 유저 하나가 뒤따라 오른다 (CM-D6, CM-E4)', () => {
  const s = built('ta-down', 'fffhhww');
  const before = usersInBand(s, 10);
  dispatch(s, { type: 'choose', id: 'descend' });
  assert.equal(s.anvil.tent, true);
  assert.equal(s.anvil.follow, s.day + 3);
  const f = follower(s);
  assert.ok(f && f.name);
  assert.equal(usersInBand(s, 10), before, '아직 오르는 중이다');
  s.day += 2; s.phase = 2; s.tick = 49;
  fresh(s);
  dispatch(s, { type: 'move', to: 'anvilcamp' });
  assert.ok(texts(s).includes(ANVIL_LINES.myTent));
  assert.equal(s.day, s.anvil.follow);
  assert.ok(s.world.notices.some((n) => n.text === `'${f.name}'님이 처음 모루의 야영지에 올랐습니다`));
  assert.equal(usersInBand(s, 10), before + 1);
  assert.ok(userAt(s, f.i).level >= 91);
});

test('M22-6 스스로 고른 환생: 본 끝은 남는다. 13장을 다시 풀면 모루는 다시 비어 있고 다른 끝을 볼 수 있다 (CM-D10)', async () => {
  const { createGame } = await import('../src/core/game.js');
  const s = built('ta-re', 'hhhhfww');
  dispatch(s, { type: 'choose', id: 'again' });
  const carry = rebirthCarry(s, { chosen: true });
  assert.deepEqual(carry.endsSeen, ['again']);
  assert.equal(carry.anvil.end, 'again');
  const n = createGame({ name: s.name, origin: 'hunter', seed: 're2', carry });
  assert.deepEqual(n.anvil.seen, ['again']);
  assert.equal(n.anvil.end, 'again', '새긴 끝이 바꾼 규칙은 그대로다');
  dispatch(n, { type: 'redo', chapter: 13 });
  assert.deepEqual([n.anvil.end, n.anvil.built, n.main.chapter], [null, false, 13]);
  assert.deepEqual(n.anvil.seen, ['again']);
  // 운으로 다시 태어난 삶도 본 끝은 남는다
  const luck = createGame({ name: s.name, origin: 'hunter', seed: 're3', carry: rebirthCarry(s, {}) });
  assert.deepEqual([luck.anvil.seen, luck.anvil.end], [['again'], null]);
});

// ── M22-7 히든 ──
test('M22-7 히든 "여덟 번째 망치질": 일곱 지역의 숨은 이야기를 모두 푼 사람이 모루 앞에 섰을 때. 조건은 화면과 도움말 어디에도 없다 (LV-E10)', () => {
  const no = fresh(anviled('th-no', { at: 'anvilcamp', level: 96 }));
  allHidden(no); no.hq.noprice.status = 'declined';
  dispatch(no, { type: 'move', to: 'anvilfront' });
  assert.equal(no.hq.eighth, undefined);
  const s = fresh(allHidden(anviled('th-yes', { at: 'anvilcamp', level: 96 })));
  dispatch(s, { type: 'move', to: 'anvilfront' });
  assert.equal(s.hq.eighth.status, 'offered');
  assert.ok(s.dings.at(-1).title.includes('여덟 번째 망치질'));
  dispatch(s, { type: 'choose', id: 'accept' });
  ironed(s); lift(s); s.battle.bellx = 199; s.battle.bell = 99; s.battle.hp = 0; s.battle.open = 5; act(s, 'hammer');
  assert.equal(s.hq.eighth.status, 'done');
  assert.equal(s.anvil.end, 'eight');
  // 조건은 어디에도 적혀 있지 않다
  const help = JSON.stringify([HELP, HELP_MORE]);
  assert.ok(!help.includes('여덟 번째') && !help.includes('히든 퀘스트를 모두'));
  assert.ok(!HIDDENS.eighth.offer.includes('히든') && !HIDDENS.eighth.why.includes('일곱 지역의 히든'));
});

// ── M22-8 100 뒤 ──
test('M22-8 레벨은 100이 끝이다. 그 뒤 경험치는 쌓여 다시 태어날 때 남는 몫에 든다 (CM-E2)', () => {
  const s = anviled('tx-1', { level: 99 });
  s.xp = 0;
  const ups = gainXp(s, xpToNext(99) + 482000);
  assert.equal(ups, 1);
  assert.equal(s.level, LEVEL_MAX);
  assert.equal(s.xp, 482000);
  assert.equal(gainXp(s, 10 ** 9), 0);
  assert.equal(s.level, 100);
  assert.equal(s.xp, 482000 + 10 ** 9);
  const withOver = levelTotal(s);
  s.xp = 0;
  assert.equal(withOver - levelTotal(s), 482000 + 10 ** 9);
});

test('M22-8 "끝난 뒤" 화면의 남은 것 여섯 줄. 13장을 끝내기 전에는 없다. 숨은 이야기는 푼 수만 보인다 (CM-E1, CM-G5)', () => {
  const pre = anviled('tx-2', { level: 100 });
  assert.equal(afterView(pre), null);
  assert.ok(!mainView(pre).after);
  const s = built('tx-3', 'fffhhww');
  assert.equal(afterView(s), null, '종을 지었어도 새기기 전에는 없다');
  dispatch(s, { type: 'choose', id: 'descend' });
  s.level = 100; s.xp = 482000;
  for (const id of ['bellnight', 'noprice', 'cameback', 'mossleaf', 'ungifted']) s.hq[id] = { status: 'done', step: HIDDENS[id].steps.at(-1).id, count: 0, day: 1 };
  s.dex.mon.coldmelt = { seen: 3, won: 3, lost: 0, elite: true };
  notePromo(s, 'ironsword', 4); notePromo(s, 'starmetal_sword', 4); notePromo(s, 'frostiron_sword', 3); notePromo(s, 'ironring', 4);
  const v = afterView(s);
  assert.equal(v.head, '레벨 100. 이 뒤의 경험치 482,000은 다시 태어날 때 남는 몫에 든다.');
  assert.deepEqual(v.rows.map((r) => r.name), ['지역의 숨은 이야기', '이름난 개체', '도감', '걸작으로 지은 승급작', '본 끝', '랭킹']);
  assert.equal(v.rows[0].value, '5 / 8');
  assert.equal(v.rows[1].value, `1 / ${NAMED_MONS.length}`);
  assert.match(v.rows[2].value, /^괴물 \d+ \/ \d+ · 물건 \d+ \/ \d+$/);
  assert.equal(v.rows[3].value, '2 / 9');
  assert.equal(v.rows[4].value, '1 / 5');
  assert.match(v.rows[5].value, /^\d+위/);
  assert.equal(STORY_HIDDENS.length, 8);
  assert.equal(PROMO_WORKS.length, 9);
  assert.equal(mainView(s).after, true);
  // 숨은 이야기의 이름과 조건은 나오지 않는다
  const shown = JSON.stringify([v, mainView(s)]);
  for (const id of STORY_HIDDENS) assert.ok(!shown.includes(HIDDENS[id].name), HIDDENS[id].name);
});

test('M22-8 이름난 놈을 잡으면 도감에 적힌다. 끝없이 세지는 것은 없다 (CM-E3)', () => {
  const s = ironed(anviled('tx-4', { at: 'meltgully' }));
  startBattle(s, [], 'coldmelt');
  s.battle.elite = true; s.battle.intent = 'hit'; s.battle.hp = 1;
  act(s, 'attack');
  assert.equal(s.dex.mon.coldmelt.elite, true);
  startBattle(s, [], 'coldmelt'); s.battle.intent = 'hit'; delete s.battle.elite; s.battle.hp = 1;
  act(s, 'attack');
  assert.equal(s.dex.mon.coldmelt.elite, true, '한 번 적힌 것은 남는다');
  // 구간은 열, 장은 열셋이 끝이다
  assert.equal(BANDS.length, 10);
  assert.equal(MAIN[14], undefined);
  assert.ok(!Object.values(PLACES).some((p) => (p.band || 1) > 10));
});

// ── M22-9 가상 유저의 세계 ──
test('M22-9 가상 유저도 구간을 오른다. 뒤 구간일수록 줄어들고, 처음 모루에는 한둘뿐이다 (LV-M6, CM-E4)', () => {
  const s = anviled('tw-1');
  const at = (day) => { s.day = day; return [3, 4, 5, 6, 7, 8, 9, 10].map((b) => usersInBand(s, b)); };
  assert.deepEqual(at(30), [0, 0, 0, 0, 0, 0, 0, 0], '처음에는 아무도 고개를 넘지 못했다');
  const late = at(600);
  for (let i = 1; i < late.length; i++) assert.ok(late[i] < late[i - 1], `뒤 구간일수록 준다 (${late})`);
  assert.equal(late.at(-1), 2);
  assert.ok(late[0] < USER_COUNT / 2, '절반 넘게는 스무 레벨에 남는다');
  // 날이 갈수록 늘기만 한다
  for (const i of [0, 7, 42, 133, 250]) { let last = 0; for (const d of [1, 40, 90, 150, 220, 400]) { const lv = userAt(s, i, d).level; assert.ok(lv >= last && lv <= 100); last = lv; } }
  // 랭킹의 맨 위는 100을 넘지 않는다
  s.day = 900;
  assert.equal(ranking(s, 'level').top[0].score <= 100, true);
});

test('M22-9 야영지의 유저는 여기까지 온 가상 유저보다 많을 수 없다 (CM-E4)', () => {
  const s = anviled('tw-2', { at: 'anvilcamp' });
  s.day = 40;
  assert.equal(usersInBand(s, 10), 0);
  for (const id of ['anvilcamp', 'seventents', 'anvilfront', 'meltgully']) { s.place = id; for (const ph of [0, 1, 2]) { s.phase = ph; assert.equal(usersHere(s), 0); } }
  assert.equal(ANVIL_LINES.camp(0), '모닥불 곁에 천막이 몇 채 서 있다. 여기까지 온 사람은 아직 나뿐이다.');
  assert.equal(ANVIL_LINES.camp(2), '모닥불 곁에 천막이 몇 채 서 있다. 여기까지 온 사람은 나 말고 둘이다.');
  s.day = 700;
  let max = 0;
  for (const id of ['anvilcamp', 'seventents', 'firstkiln', 'anvilfront', 'meltgully', 'masterroad']) { s.place = id; for (const ph of [0, 1, 2]) { s.phase = ph; max = Math.max(max, usersHere(s)); } }
  assert.ok(max >= 1 && max <= 2, `한둘뿐이다 (${max})`);
});

test('M22-9 새 지역마다 최초 발견이 있다. 안 가 본 지역의 이름은 공지에 나오지 않는다 (LV-M6)', () => {
  const keys = Object.keys(FIRSTS).filter((k) => FIRSTS[k].band);
  assert.deepEqual(keys.map((k) => FIRSTS[k].band), [3, 4, 5, 6, 7, 8, 9]);
  for (const k of keys) assert.ok(MONSTERS[k.split(':')[1]].boss, k);
  const s = ponded('tw-3');
  const n = { day: 90, phase: 0, key: 'boss:bellwarden', who: '밤비노', mine: false };
  assert.ok(noticeText(s, n).includes("우두머리 '잠든 종의 파수꾼'"), '가 본 지역의 것은 이름이 보인다');
  const early = ponded('tw-3b'); early.dex.places = { plaza: true }; early.place = 'plaza';
  assert.equal(noticeText(early, n), "'밤비노'님이 우두머리 '???'를 세계에서 처음 넘었습니다");
  // 내가 먼저 넘으면 내 이름으로 적힌다
  const me = anviled('tw-3c', { at: 'echogate' });
  me.day = 5; me.dmem.starpit = { ...(me.dmem.starpit || {}), keeper: 'beat' };
  fresh(me);
  dispatch(me, { type: 'act', id: 'look' });
  assert.equal(me.world.firsts['boss:lastshard']?.mine, true);
  assert.ok(worldFirst(me, 'boss:lastshard').day >= 188);
});

test('M22-9 소문이 다음 지역을 미리 흘린다: 길이 열렸지만 아직 가 보지 않은 지역만. 그 지역의 이름은 적지 않는다 (LV-M6, CM-G1)', () => {
  const s = answered('tw-4');
  s.dex.places.echogate = true;
  const ahead = () => rumorsView(s).filter((r) => r.id.startsWith('ahead'));
  s.day = 20;
  assert.equal(ahead().length, 1);
  assert.equal(ahead()[0].id, 'ahead-10');
  assert.ok(ahead()[0].text.includes('아직 다녀온 사람이 없대'), '먼저 간 사람이 없으면 그렇게 적힌다');
  s.day = 600;
  assert.match(ahead()[0].text, /^'.+'가 이틀을 올랐대\./);
  assert.ok(!ahead()[0].text.includes('모루'));
  // 가 본 뒤에는 붙지 않는다
  s.dex.places.anvilcamp = true;
  assert.equal(ahead().length, 0);
  // 길이 열리기 전에는 붙지 않는다
  const p = ponded('tw-4b'); p.day = 600;
  assert.ok(!rumorsView(p).some((r) => r.id === 'ahead-10'));
});

// ── 저장 ──
test('M22 20판 저장은 지금 판으로 올라온다: 모루 위에 남긴 종도 새긴 끝도 없이 (저장 판)', () => {
  assert.equal(SAVE_VERSION, 21);
  const s = answered('v20');
  const old = JSON.parse(JSON.stringify(s));
  delete old.anvil; old.v = 20;
  const up = parseSave(JSON.stringify({ v: 20, rev: 1, savedAt: 1, state: old })).state;
  assert.equal(up.v, 21);
  assert.deepEqual(up.anvil, { left: 0, built: false, end: null, endDay: 0, seen: [], tent: false, follow: 0 });
  assert.equal(up.main.chapter, 13);
  assert.equal(mainView(up).name, '두 번째 약속');
  assert.ok(up.opened.includes('anvilroad'));
});

test('M22 마지막 싸움 도중과 끝을 고르는 창에서 저장했다 읽어도 같다. 어긋난 값은 걸러진다', () => {
  const s = ironed(anviled('save-1', { level: 96 }));
  lift(s);
  for (let i = 0; i < 7; i++) act(s, s.battle.intent === 'charge' ? 'defend' : 'hammer');
  const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.deepEqual(back.battle, s.battle);
  assert.deepEqual(temperView(back), temperView(s));
  const c = built('save-2', 'hhhhfww');
  const back2 = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: c })).state;
  assert.deepEqual(back2.choice, { kind: 'anvilend' });
  assert.deepEqual(choiceView(back2), choiceView(c));
  // 모르는 끝은 읽을 때 걷힌다. 범위를 벗어난 종은 망가진 저장이다
  const bad = JSON.parse(JSON.stringify(c)); bad.anvil.end = 'forever';
  assert.equal(parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })).state.anvil.end, null);
  const bad2 = JSON.parse(JSON.stringify(s)); bad2.battle.bell = 101;
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad2 })));
});

test('M22 도움말: 처음 모루에 가 본 뒤에야 벼림의 줄이, 망치를 들어 본 뒤에야 종의 줄이 생긴다', async () => {
  const { helpBody } = await import('../src/ui/help.js');
  const all = (seen) => HELP.flatMap((t) => helpBody(t, seen)).join('\n');
  assert.ok(!all({}).includes('벼림') && !all({}).includes('망치질"로') && !all({}).includes('모루'));
  assert.ok(all({ anvil: true }).includes('벼림') && !all({ anvil: true }).includes('식은 껍질'));
  assert.ok(all({ anvil: true, bell: true }).includes('식은 껍질'));
  void pathsOf; void PEOPLE;
});
