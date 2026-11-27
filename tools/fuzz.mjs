// 무작위 플레이 검증: node tools/fuzz.mjs [판 수] [판마다 걸음 수]
// 화면이 보여 주는 단축 칸과 창의 행동을 아무렇게나 눌러 본다. 규칙이 "안 됩니다"라고 던지는 것은 정상이고,
// 그 밖의 오류(TypeError 같은 것)나 망가진 상태(NaN, 음수, 저장했다 읽으면 달라짐)를 찾는다.
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';
import { ORIGINS, rollDice } from '../src/data/origins.js';
import { PLACES } from '../src/data/places.js';
import { ITEMS } from '../src/data/items.js';
import { RECIPES } from '../src/data/recipes.js';
import { SHOPS } from '../src/data/shops.js';
import { GUILDS } from '../src/core/guild.js';
import { STANCES } from '../src/core/battle.js';
import { PEOPLE } from '../src/data/people.js';
import { derived } from '../src/core/derived.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { HIDDENS } from '../src/data/quests.js';

const RUNS = Number(process.argv[2] || 40), STEPS = Number(process.argv[3] || 1500);
const MAIN_PATH = { 1: 'fight', 2: 'tell', 3: 'both', 4: 'archive' };
let seed = 12345;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

/** 창에서 하는 일들: 아무 값이나 넣어 본다. 대부분은 규칙이 거절한다. */
function wild(s) {
  const bagIndex = Math.floor(rnd() * (s.bag.length + 1));
  const slot = pick(Object.keys(s.equip));
  return pick([
    { type: 'move', to: pick(Object.keys(PLACES)) }, { type: 'move', to: pick(Object.values(PLACES).filter((p) => p.town === PLACES[s.place].town).map((p) => p.id)) }, // 둘째: 지금 마을 안의 방으로
    { type: 'travel', to: pick(Object.keys(PLACES)) },
    { type: 'equip', index: bagIndex }, { type: 'unequip', slot }, { type: 'use', index: bagIndex },
    { type: 'discard', index: bagIndex, n: 1 },
    { type: 'buy', id: pick(Object.values(SHOPS).flatMap((x) => x.sells)) }, { type: 'sell', index: bagIndex, n: 1 },
    { type: 'craft', recipe: pick(Object.keys(RECIPES)) }, { type: 'hammer' }, { type: 'reheat' },
    { type: 'repair', index: bagIndex }, { type: 'repair', slot }, { type: 'enhance', index: bagIndex }, { type: 'enhance', slot },
    { type: 'guild', op: 'join', id: pick(Object.keys(GUILDS)) }, { type: 'guild', op: 'donate' }, { type: 'guild', op: 'leave' },
    { type: 'stance', id: pick(Object.keys(STANCES)) },
    { type: 'greet', npc: pick(Object.keys(PEOPLE)) }, { type: 'talk', npc: pick(Object.keys(PEOPLE)) }, { type: 'gift', npc: pick(Object.keys(PEOPLE)), index: bagIndex },
    { type: 'sculpt', subject: 'rabbit' }, { type: 'cut' }, { type: 'spend', stat: pick(['str', 'agi', 'con', 'wis']) },
    { type: 'battle', choice: pick(['attack', 'defend', 'flee', 'item']), index: bagIndex },
    { type: 'deposit', index: bagIndex, n: 1 }, { type: 'withdraw', index: 0, n: 1 },
    { type: 'persuade' }, { type: 'act', id: 'torch' }, { type: 'dungeon', op: 'enter', id: pick(['ruins', 'ship', 'icetower', 'shardhouse']) }, { type: 'shard' }, { type: 'turn' }, // 흰마루 (M15), 소금벌 (M16)
    { type: 'stall', op: pick(['buy', 'put', 'take']), index: bagIndex }, { type: 'act', id: pick(['drink', 'well']) }, { type: 'greet', npc: 'stallowner' }, // 소금벌 (M16)
    { type: 'workshop', op: pick(['buy', 'hire', 'put', 'take']), index: bagIndex, n: 1 }, { type: 'workshop', op: 'job', job: pick([{ kind: 'gather', item: pick(['saltsteel', 'frostiron', 'ashiron']) }, { kind: 'make', recipe: pick(Object.keys(RECIPES)) }]) }, { type: 'moss' }, { type: 'bellman' }, { type: 'act', id: pick(['lamp', 'knot', 'holy']) }, { type: 'dungeon', op: 'enter', id: pick(['kiln', 'sunkenpath', 'sunkenpalace']) }, // 안개늪 (M18)
    { type: 'surface' }, { type: 'airbag' }, { type: 'chest' }, { type: 'bronze' }, { type: 'patrol' }, { type: 'act', id: pick(['surface', 'airbag', 'dig']) }, { type: 'party', op: 'hire', id: pick(['parang', 'irang', 'neoul', 'solgae', 'gaon']) }, { type: 'workshop', op: 'job', who: 'sora', job: { kind: 'gather', item: 'saltsteel' } }, // 잠긴 도성 (M19)
    { type: 'act', id: pick(['flag', 'pray', 'dig']) }, { type: 'herd' }, { type: 'opendoor' }, { type: 'caravan', op: 'buy' }, { type: 'caravan', op: 'send', to: pick([3, 4, 5, 6, 7, 8]), picks: [{ from: pick(['bag', 'box']), index: bagIndex, n: pick([1, 2, 5]) }], escort: pick([null, 'seori', 'bawi', 'drummaru']) }, { type: 'party', op: 'hire', id: pick(['seori', 'suri', 'bawi', 'drummaru']) }, { type: 'party', op: 'dismiss', id: pick(['seori', 'bawi', 'drummaru']) }, { type: 'dungeon', op: 'enter', id: 'skytemple' }, { type: 'rumor' }, { type: 'talk', npc: pick(['marketelder', 'novice', 'bridgeman']) }, { type: 'quest', op: 'accept', id: pick(['bridgemenders', 'novicedoubt']) }, { type: 'quest', op: 'choose', id: pick(['bridgemenders', 'novicedoubt']), choice: pick(['give', 'none', 'done']) }, { type: 'mail', op: 'take', id: pick(['sent-1', 'sent-2', 'welcome']) }, // 구름다리 (M20)
    { type: 'lifthammer' }, { type: 'carve' }, { type: 'battle', choice: 'hammer' }, { type: 'choose', id: pick(['again', 'cool', 'share', 'descend', 'eight', 'back']) }, { type: 'party', op: 'hire', id: pick(['tent6f', 'tent7f', 'tent8h', 'tent9w', 'tent10f', 'tent11w', 'tent12f', 'tent12w']) }, { type: 'greet', npc: pick(['tent6f', 'tent6w', 'tent7f', 'tent11w', 'tent12w']) }, { type: 'redo', chapter: 13 }, // 처음 모루 (M22)
    { type: 'act', id: 'witness' }, { type: 'saw' }, { type: 'hangbell' }, { type: 'guardkid' }, { type: 'battle', choice: 'stance', index: pick(['hold', 'clash', 'dodge', 'focus']) }, { type: 'greet', npc: pick(['daon', 'sol', 'dallae', 'hangyeol', 'danbi', 'seulgi', 'eunsol', 'hanui', 'boram', 'starsmith', 'silkhost', 'pondpriest', 'pondhost']) }, { type: 'party', op: 'hire', id: pick(['hanmoe', 'nari', 'doran', 'drumsodam']) }, { type: 'dungeon', op: 'enter', id: 'starpit' }, { type: 'quest', op: 'accept', id: pick(['relay', 'shardkid']) }, { type: 'quest', op: 'choose', id: pick(['relay', 'shardkid']), choice: 'done' }, { type: 'craft', recipe: 'smallbell' }, { type: 'workshop', op: 'job', who: 'iseul', job: { kind: 'gather', item: 'saltsteel' } }, // 별못 (M21)
    { type: 'quest', op: 'accept', id: pick(['lostlamps', 'herbledger']) }, { type: 'quest', op: 'choose', id: pick(['lostlamps', 'herbledger']), choice: pick(['light', 'fill', 'none']) },
    { type: 'quest', op: 'accept', id: pick(['icehole', 'winter']) }, { type: 'quest', op: 'choose', id: pick(['icehole', 'winter']), choice: pick(['judge', 'bigfish', 'none', 'give', 'sell']) },
  ]);
}

const bad = [];
const note = (run, step, what, action) => { if (bad.length < 25) bad.push(`판 ${run} 걸음 ${step}: ${what} ← ${JSON.stringify(action)}`); };
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

function check(s, run, step, action) {
  for (const k of ['hp', 'mp', 'full', 'silver', 'xp', 'level', 'day', 'phase', 'tick', 'tired', 'unspent']) if (!finite(s[k])) return note(run, step, `${k}가 수가 아님: ${s[k]}`, action);
  if (s.silver < 0) note(run, step, `은화가 음수: ${s.silver}`, action);
  if (s.hp < 0 || s.mp < 0 || s.full < 0 || s.tired < 0 || s.tired > 100) note(run, step, `몸 값이 범위 밖: hp ${s.hp} mp ${s.mp} full ${s.full} tired ${s.tired}`, action);
  for (const v of Object.values(s.stats)) if (!finite(v)) note(run, step, '스탯이 수가 아님', action);
  for (const d of derived(s)) if (!finite(d.value)) note(run, step, `${d.name}이 수가 아님`, action);
  for (const it of [...s.bag, ...Object.values(s.equip).filter(Boolean)]) {
    if (!ITEMS[it.id]) note(run, step, `모르는 물건 ${it.id}`, action);
    if (!Number.isInteger(it.n) || it.n < 1) note(run, step, `물건 개수 ${it.id} ${it.n}`, action);
    if (it.dur != null && (!finite(it.dur) || it.dur < 0)) note(run, step, `내구도 ${it.id} ${it.dur}`, action);
    if (it.plus != null && (!Number.isInteger(it.plus) || it.plus < 0 || it.plus > 10)) note(run, step, `강화 ${it.id} ${it.plus}`, action);
  }
  for (const [id, sk] of Object.entries(s.skills)) if (!finite(sk.grade) || !finite(sk.xp)) note(run, step, `숙련도 ${id}`, action);
  if (s.battle && !finite(s.battle.hp)) note(run, step, '적 생명력이 수가 아님', action);
  if (s.guild && !finite(s.guild.contrib)) note(run, step, '기여도가 수가 아님', action);
  if (!finite(s.warm) || s.warm < 0 || s.warm > 100) note(run, step, `체온이 범위 밖: ${s.warm}`, action);
  if (!Number.isInteger(s.torch) || s.torch < 0 || s.torch > 60) note(run, step, `횃불이 범위 밖: ${s.torch}`, action);
  if (!finite(s.water) || s.water < 0 || s.water > 10) note(run, step, `물이 범위 밖: ${s.water}`, action);
  if (!s.ash || !Number.isInteger(s.ash.hot) || s.ash.hot < 0 || s.ash.hot > 30 || !Number.isInteger(s.ash.duel.wins) || !Number.isInteger(s.ash.pumps) || s.ash.ember < 0 || s.ash.ember > 15) note(run, step, `잿골의 칸이 범위 밖: ${JSON.stringify(s.ash)}`, action);
  if (!s.marsh || !Number.isInteger(s.marsh.curse) || s.marsh.curse < 0 || s.marsh.curse > 5 || !Number.isInteger(s.marsh.lamp) || s.marsh.lamp < 0 || s.marsh.lamp > 60 || !Number.isInteger(s.marsh.moss) || s.marsh.moss < 0 || Object.values(s.marsh.knots).some((n) => !Number.isInteger(n) || n < 0 || n > 10)) note(run, step, `안개늪의 칸이 범위 밖: ${JSON.stringify(s.marsh)}`, action);
  if (!s.sunken || !Number.isInteger(s.sunken.breath) || s.sunken.breath < 0 || s.sunken.breath > 24 || !Number.isInteger(s.sunken.bronze) || s.sunken.bronze < 0 || s.sunken.bronze > 200 || Object.entries(s.sunken.boxes).some(([k, n]) => !Number.isInteger(n) || n < 0 || n > ({ sunkenstreet: 4, palaceyard: 4, vault: 3 }[k] ?? 0))) note(run, step, `잠긴 도성의 칸이 범위 밖: ${JSON.stringify(s.sunken)}`, action);
  // 일행은 둘까지, 11장을 끝낸 사람만 셋까지 (GD-H6)
  const seats = [...s.main.done, ...(s.main.past || [])].some((d) => d.chapter === 11) ? 3 : 2;
  if (s.party.length > seats || s.party.some((c) => !Number.isFinite(c.hp) || c.hp < 0)) note(run, step, `일행이 망가짐: ${JSON.stringify(s.party)}`, action);
  if (!s.cloud || !Number.isInteger(s.cloud.prayers) || s.cloud.prayers < 0) note(run, step, `구름다리의 칸이 범위 밖: ${JSON.stringify(s.cloud)}`, action);
  // 별못의 칸 (BM-B, BM-D, BM-E): 지켜본 수는 서른까지, 답해 준 일은 셋까지, 건 종은 일곱까지. 읽힘은 0~100이고 읽히지 않는 곳의 싸움에는 없다
  if (!s.pond || !Number.isInteger(s.pond.bells) || s.pond.bells < 0 || s.pond.bells > 7 || Object.values(s.pond.watch).some((w) => !Number.isInteger(w.n) || w.n < 0 || w.n > 30 || !Number.isInteger(w.done) || w.done < 0 || w.done > 3 || (w.ready && w.n !== 30))) note(run, step, `별못의 칸이 범위 밖: ${JSON.stringify(s.pond)}`, action);
  if (s.battle && s.battle.read != null && (!Number.isInteger(s.battle.read) || s.battle.read < 0 || s.battle.read > 100 || !PLACES[s.place].mirror)) note(run, step, `읽힘이 범위 밖: ${s.battle.read} (${s.place})`, action);
  // 처음 모루의 칸 (CM-B, CM-D): 벼림은 0~12이고 벼리는 곳의 싸움에만 있다. 종은 0~100이고 지어지지 않은 종과의 싸움에만 있다. 새긴 끝은 다 지은 뒤에만 있다
  if (!s.anvil || !Number.isInteger(s.anvil.left) || s.anvil.left < 0 || s.anvil.left > 100 || (s.anvil.end && !s.anvil.built) || !Array.isArray(s.anvil.seen) || s.anvil.seen.length > 5) note(run, step, `처음 모루의 칸이 범위 밖: ${JSON.stringify(s.anvil)}`, action);
  if (s.battle && s.battle.temper != null && (!Number.isInteger(s.battle.temper) || s.battle.temper < 0 || s.battle.temper > 12 || !PLACES[s.place].forge)) note(run, step, `벼림이 범위 밖: ${s.battle.temper} (${s.place})`, action);
  if (s.battle && s.battle.bell != null && (!Number.isInteger(s.battle.bell) || s.battle.bell < 0 || s.battle.bell >= 100 || s.battle.mon !== 'unbuiltbell' || s.place !== 'anvilfront' || s.battle.hp < 0)) note(run, step, `종이 범위 밖: ${JSON.stringify(s.battle)}`, action);
  if (s.level > 100) note(run, step, `레벨이 100을 넘었다: ${s.level}`, action);
  if (s.battle?.mirror && (!finite(s.battle.mirror.attack) || !finite(s.battle.mirror.defense) || !finite(s.battle.mirror.xp))) note(run, step, '거울상이 망가짐', action);
  if (s.caravan && (!Array.isArray(s.caravan.past) || s.caravan.past.length > 5 || (s.caravan.load && (!s.caravan.load.items.length || s.caravan.load.items.some((it) => !ITEMS[it.id] || !Number.isInteger(it.n) || it.n < 1) || s.caravan.load.work < 0 || s.caravan.load.work >= 30 || s.caravan.load.hop < 0 || s.caravan.load.hop >= 8 - s.caravan.load.to || (s.caravan.load.escort && s.party.some((c) => c.id === s.caravan.load.escort.id)))))) note(run, step, `상단이 망가짐: ${JSON.stringify(s.caravan)}`, action);
  if (s.shop && (s.shop.shelf.some((it) => !ITEMS[it.id] || !Number.isInteger(it.n) || it.n < 1) || (s.shop.hand && (!Number.isInteger(s.shop.hand.pts) || s.shop.hand.pts < 0 || !Number.isInteger(s.shop.hand.work) || s.shop.hand.work < 0 || s.shop.hand.work > 10)))) note(run, step, '공방이 망가짐', action);
  if (s.stall && (s.stall.items.length > 6 || s.stall.items.some((it) => !ITEMS[it.id] || !Number.isInteger(it.n) || it.n < 1))) note(run, step, '가게의 진열대가 망가짐', action);
}

let steps = 0, refused = 0, done = 0;
const seen = { places: new Set(), elites: 0, enhance: 0, guild: 0, days: 0, works: 0, falls: 0, skills: new Set(), hidden: new Set(), dungeon: 0, reborn: 0 };
for (let run = 1; run <= RUNS; run++) {
  let s = createGame({ name: `검증${run}`, origin: pick(ORIGINS).id, rolled: rollDice(`fuzz|${run}`), seed: `fuzz-${run}` });
  s.silver = 300; // 가게·강화·방 빌리기까지 닿게
  if (run % 2 === 0) {
    // 짝수 판은 멀리 간 사람: 길이 다 열려 있고, 직업과 길드와 장비가 있다. 뒤쪽 시스템까지 닿게
    s.level = 14; s.silver = 5000; s.opened = ['ruins', 'dock', 'bigmarket']; s.hp = 200;
    try { dispatch(s, { type: 'career', op: 'choose', id: pick(['warrior', 'archer', 'mage', 'priest', 'thief']) }); } catch { /* 고를 수 없으면 무직으로 */ }
    try { dispatch(s, { type: 'guild', op: 'join', id: pick(Object.keys(GUILDS)) }); } catch { /* 무소속으로 */ }
    for (const id of ['ironsword', 'ironore', 'boarhide', 'oakbranch', 'chisel', 'redpotion', 'riceball']) s.bag.push({ id, grade: 0, n: ITEMS[id].kind === 'gear' ? 1 : 30, ...(ITEMS[id].dur ? { dur: ITEMS[id].dur } : {}) });
    s.dex.animals.rabbit = true;
    for (const m of ['rat', 'wolf', 'boar']) s.dex.mon[m] = { seen: 60, won: 60, lost: 0 };
  }
  if (run % 4 === 0) {
    // 넷에 한 판은 1부의 끝을 본 사람: 흰마루의 언못에서 시작한다 (M15). 추위, 얼음 낚시, 얼음 종루, 6장까지 닿게
    s.level = 26; s.hp = 400; s.ending = 'mend'; s.endDay = 1; s.main.chapter = 6;
    s.main.done = [1, 2, 3, 4, 5].map((chapter) => ({ chapter, path: chapter === 5 ? 'mend' : MAIN_PATH[chapter], day: 1 }));
    s.opened.push('icegate'); s.place = 'icegate';
    for (const id of ['torch', 'frostiron', 'whitefur', 'icemeat', 'dish_snowpot', 'silverfish']) s.bag.push({ id, grade: 0, n: 12 });
    s.bag.push({ id: 'icekey', grade: 0, n: 2 });
  }
  if (run % 8 === 0) {
    // 여덟에 한 판은 6장을 끝낸 사람: 소금벌의 저울목에서 시작한다 (M16). 갈증, 시세, 가게, 종 조각 창고, 7장까지 닿게
    s.level = 36; s.hp = 600; s.main.chapter = 7; s.main.done.push({ chapter: 6, path: 'beat', day: 2 });
    s.opened.push('saltflat'); s.place = 'saltgate'; s.silver = 9000;
    for (const id of ['waterpouch', 'saltsteel', 'scorpshell', 'wormmeat', 'dish_saltgrill']) s.bag.push({ id, grade: 0, n: 12 });
    for (const id of ['frostiron_helm', 'frostiron_sword']) s.bag.push({ id, grade: 1, n: 1, maker: s.name, dur: ITEMS[id].dur });
    s.bag.push({ id: 'dish_snowpot', grade: 0, n: 5, maker: s.name });
  }
  if (run % 16 === 3 || run % 16 === 11) {
    // 열여섯에 두 판은 7장을 끝낸 사람: 잿골의 가마골과 쇳물 내에서 시작한다 (M17). 열기, 숫돌, 겨루기, 풀무질, 식지 않는 가마, 8장까지 닿게
    s.level = 46; s.hp = 800; s.silver = 9000; s.ending = s.ending || 'mend'; s.endDay = 1;
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], [6, 'beat'], [7, 'raid']]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 8;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad']) if (!s.opened.includes(id)) s.opened.push(id);
    s.place = run % 16 === 11 ? 'moltenbrook' : 'kilngate';
    for (const id of ['whetstone', 'ashiron', 'lizardscale', 'crabmeat', 'dish_embercrab', 'ironore', 'redpotion']) s.bag.push({ id, grade: 0, n: 12 });
    s.bag.push({ id: 'kilnkey', grade: 0, n: 2 });
    s.equip.weapon = { id: 'saltsteel_sword', grade: 0, n: 1, dur: ITEMS.saltsteel_sword.dur };
    s.bag.push({ id: 'ashiron_sword', grade: 3, n: 1, maker: s.name, dur: ITEMS.ashiron_sword.dur });
    s.learned = [...new Set([...(s.learned || []), 'bellows'])];
  }
  if (run % 16 === 5 || run % 16 === 13) {
    // 열여섯에 두 판은 8장을 끝낸 사람: 안개늪의 뜬마을과 이끼 밭에서 시작한다 (M18). 저주, 안개, 등불과 끈, 공방과 견습, 가라앉는 오솔길, 9장까지 닿게
    s.level = 56; s.hp = 1000; s.silver = 30000; s.ending = s.ending || 'mend'; s.endDay = 1;
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], [6, 'beat'], [7, 'raid'], [8, 'beat']]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 9;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad', 'marshroad']) if (!s.opened.includes(id)) s.opened.push(id);
    s.place = run % 16 === 13 ? 'mossfield' : 'floatgate';
    for (const id of ['lamp', 'marker', 'holywater', 'mossiron', 'mistthread', 'toadleg', 'dish_marshbrew', 'ashiron', 'redpotion']) s.bag.push({ id, grade: 0, n: 12 });
    s.bag.push({ id: 'mosskey', grade: 0, n: 2 });
    s.equip.weapon = { id: 'ashiron_sword', grade: 0, n: 1, dur: ITEMS.ashiron_sword.dur };
    s.flags.sawShop = true; s.craftTier.smith = 6;
    if (run % 32 >= 16) s.shop = { hand: { id: 'bori', pts: 8, job: { kind: 'gather', item: 'saltsteel' }, work: 0, idle: false, paidDay: s.day }, hand2: null, shelf: [{ id: 'ashiron', grade: 0, n: 40 }], today: [], left: {} }; // 절반은 공방에 견습을 둔 사람
  }
  if (run % 16 === 7 || run % 16 === 15) {
    // 열여섯에 두 판은 9장을 끝낸 사람: 잠긴 도성의 지붕마을과 잠긴 거리에서 시작한다 (M19). 숨, 짝, 호위받는 채집, 구간 용병, 잠긴 궁, 10장까지 닿게
    s.level = 66; s.hp = 1200; s.silver = 40000; s.ending = s.ending || 'mend'; s.endDay = 1;
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], [6, 'beat'], [7, 'raid'], [8, 'beat'], [9, 'rest']]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 10;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad', 'marshroad', 'sunkenroad']) if (!s.opened.includes(id)) s.opened.push(id);
    s.place = run % 16 === 15 ? 'sunkenstreet' : 'roofgate';
    for (const id of ['airbag', 'deepholy', 'oldbronze', 'scalehide', 'jellycurd', 'dish_scalesteam', 'redpotion']) s.bag.push({ id, grade: 0, n: 12 });
    s.bag.push({ id: 'palacekey', grade: 0, n: 2 });
    s.equip.weapon = { id: 'oldbronze_sword', grade: 0, n: 1, dur: ITEMS.oldbronze_sword.dur };
    s.bag.push({ id: 'oldbronze_sword', grade: 1, n: 1, maker: s.name, dur: ITEMS.oldbronze_sword.dur });
    if (run % 32 >= 16) for (const [id, hp] of [['parang', 1400], ['neoul', 2000]]) s.party.push({ id, hp, row: 'front', plan: id === 'neoul' ? 'mefirst' : 'together', crossed: 0, bond: 0, down: false, day: s.day, paidDay: s.day }); // 절반은 용병 둘을 데리고
  }
  if (run % 16 === 5 || run % 16 === 13) {
    // 열여섯에 두 판은 10장을 끝낸 사람: 구름다리의 다릿목과 벼랑길에서 시작한다 (M20). 바람, 북 치는 이, 상단, 하늘 신전, 11장, 일행 셋까지 닿게
    s.level = 76; s.hp = 1500; s.silver = 90000; s.ending = s.ending || 'mend'; s.endDay = 1;
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], [6, 'beat'], [7, 'raid'], [8, 'beat'], [9, 'rest'], [10, 'quiet']]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 11;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad', 'marshroad', 'sunkenroad', 'cloudroad']) if (!s.opened.includes(id)) s.opened.push(id);
    for (const id of ['icegate', 'saltgate', 'kilngate', 'floatgate', 'roofgate']) s.dex.places[id] = true;
    s.place = run % 16 === 13 ? 'cliffroad' : pick(['bridgegate', 'bridgemarket', 'goathut', 'templedoor']);
    for (const id of ['deepholy', 'cloudsilver', 'goatwool', 'goatmeat', 'dish_goatporridge', 'redpotion']) s.bag.push({ id, grade: 0, n: 12 });
    s.bag.push({ id: 'templekey', grade: 0, n: 2 });
    s.equip.weapon = { id: 'cloudsilver_sword', grade: 0, n: 1, dur: ITEMS.cloudsilver_sword.dur };
    s.people.marketelder = { pts: 0, talked: 0, likes: [], dislikes: [], stats: [], met: true };
    if (run % 32 >= 16) { s.caravan = { load: null, past: [], heard: {}, sent: 0 }; for (const [id, hp] of [['seori', 1900], ['drummaru', 1500]]) s.party.push({ id, hp, row: id === 'seori' ? 'front' : 'back', plan: id === 'seori' ? 'together' : 'drum', crossed: 0, bond: 0, down: false, day: s.day, paidDay: s.day }); } // 절반은 상단을 가진 채, 용병 하나와 북 치는 이를 데리고
    if (run % 64 >= 32) { s.main.done.push({ chapter: 11, path: 'beat', day: 1 }); s.main.chapter = 12; s.opened.push('pondroad'); } // 그 절반은 11장까지 끝낸 사람(일행 셋)
  }
  if (run % 16 === 1 || run % 16 === 9) {
    // 열여섯에 두 판은 11장을 끝낸 사람: 별못의 맞울과 못 둘레에서 시작한다 (M21). 읽힘, 거울상, 지켜보기, 일행 셋, 별 떨어진 자리, 12장까지 닿게
    s.level = 86; s.hp = 1800; s.silver = 90000; s.ending = s.ending || 'mend'; s.endDay = 1;
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], [6, 'beat'], [7, 'raid'], [8, 'beat'], [9, 'rest'], [10, 'quiet'], [11, 'beat']]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 12;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad', 'marshroad', 'sunkenroad', 'cloudroad', 'pondroad']) if (!s.opened.includes(id)) s.opened.push(id);
    s.place = run % 16 === 9 ? pick(['pondside', 'starfield']) : pick(['echogate', 'answeryard', 'silkhouse', 'pondshrine']);
    for (const id of ['starholy', 'starmetal', 'mothsilk', 'stardust', 'dish_starcake', 'redpotion', 'bellshard', 'smallbell']) s.bag.push({ id, grade: 0, n: 12 });
    s.equip.weapon = { id: 'starmetal_sword', grade: 0, n: 1, dur: ITEMS.starmetal_sword.dur };
    s.equip.body = { id: 'starmetal_armor', grade: 0, n: 1, dur: ITEMS.starmetal_armor.dur };
    s.craftLv.jewel = { lv: 33, xp: 0 }; s.craftTier.jewel = 9;
    if (run % 32 >= 16) for (const [id, hp] of [['hanmoe', 2600], ['doran', 3700], ['drumsodam', 2000]]) s.party.push({ id, hp, row: id === 'drumsodam' ? 'back' : 'front', plan: id === 'doran' ? 'mefirst' : id === 'hanmoe' ? 'together' : 'drum', crossed: 0, bond: 0, down: false, day: s.day, paidDay: s.day }); // 절반은 일행 셋을 데리고
    if (run % 64 >= 32) s.pond.watch = Object.fromEntries(['dallae', 'hangyeol', 'danbi', 'seulgi', 'eunsol', 'hanui'].map((id) => [id, { n: 0, done: 3, ready: false }])); // 그 절반은 마당의 일을 거의 다 본 사람
  }
  if (run % 16 === 2 || run % 16 === 10 || run % 16 === 6) {
    // 열여섯에 세 판은 12장을 끝낸 사람: 처음 모루의 야영지와 쇳물 골·장인의 길, 모루 앞에서 시작한다 (M22). 벼림, 일곱 천막, 마지막 싸움, 끝 다섯까지 닿게
    s.level = run % 16 === 6 ? 97 : 93; s.hp = 2200; s.silver = 90000; s.ending = s.ending || pick(['mend', 'free', 'keep', 'hidden']); s.endDay = 1;
    const kinds = pick([['beat', 'raid', 'beat', 'rest', 'quiet', 'beat', 'gather'], ['fish', 'buy', 'forge', 'peel', 'rebuild', 'hear', 'share'], ['talk', 'turn', 'quench', 'teach', 'relieve', 'open', 'leave'], ['beat', 'buy', 'quench', 'rest', 'rebuild', 'open', 'gather']]);
    for (const [chapter, path] of [[1, 'fight'], [2, 'tell'], [3, 'both'], [4, 'archive'], [5, 'mend'], ...kinds.map((p, i) => [6 + i, p])]) if (!s.main.done.some((d) => d.chapter === chapter)) s.main.done.push({ chapter, path, day: 1 });
    s.main.chapter = 13;
    for (const id of ['ruins', 'dock', 'bigmarket', 'icegate', 'saltflat', 'ashroad', 'marshroad', 'sunkenroad', 'cloudroad', 'pondroad', 'anvilroad']) if (!s.opened.includes(id)) s.opened.push(id);
    s.place = run % 16 === 10 ? pick(['meltgully', 'masterroad']) : run % 16 === 6 ? 'anvilfront' : pick(['anvilcamp', 'seventents', 'firstkiln', 'anvilfront']);
    for (const id of ['starholy', 'firstiron', 'shadowhide', 'anvilsalt', 'dish_anviltable', 'redpotion']) s.bag.push({ id, grade: 0, n: 12 });
    s.equip.weapon = { id: 'firstiron_sword', grade: 0, n: 1, dur: ITEMS.firstiron_sword.dur };
    s.equip.body = { id: 'firstiron_armor', grade: 0, n: 1, dur: ITEMS.firstiron_armor.dur };
    if (run % 32 >= 16) { s.craftLv.smith = { lv: 37, xp: 0 }; s.craftTier.smith = 10; } // 절반은 대장 레벨이 높은 사람
    if (run % 64 >= 32) for (const id of ['bellnight', 'noprice', 'cameback', 'mossleaf', 'ungifted', 'unheard', 'myding']) s.hq[id] = { status: 'done', step: HIDDENS[id].steps.at(-1).id, count: 0, day: 1 }; // 그 절반은 숨은 이야기를 모두 푼 사람
    if (run % 16 === 6) { try { dispatch(s, { type: 'lifthammer' }); s.battle.bellx = 199; s.battle.bell = 99; } catch { /* 망치를 들지 못하면 그대로 둔다 */ } } // 종을 거의 다 지은 채 싸우는 사람: 끝을 고르는 데까지 닿게
  }
  for (let step = 1; step <= STEPS; step++) {
    // 운이 다시 태어나라 하면 다시 태어난다 (Z32)
    if (s.flags.mustRebirth) {
      s = createGame({ name: `환생${run}`, origin: pick(ORIGINS).id, rolled: rollDice(`fuzz|${run}|${step}`), seed: `fuzz-${run}-${step}`, carry: rebirthCarry(s) });
      seen.reborn++;
    }
    const slots = slotsNow(s).filter((x) => x && x.action && !x.disabled);
    const action = slots.length && rnd() < 0.7 ? pick(slots).action : wild(s);
    steps++;
    try { const ev = dispatch(s, action); done++; seen.places.add(s.place); if (s.dungeon) seen.dungeon++; for (const e of ev) { if (e.type === 'temper') seen.temper = (seen.temper || 0) + 1; if (e.type === 'bellbuilt') seen.built = (seen.built || 0) + 1; if (e.type === 'ending2') (seen.ends || (seen.ends = new Set())).add(e.id); } } catch (e) {
      if (e.constructor !== Error) { note(run, step, `${e.constructor.name}: ${e.message}`, action); break; }
      refused++;
    }
    check(s, run, step, action);
    if (step % 250 === 0) {
      // 저장했다 읽어도 같은가
      try {
        const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
        if (JSON.stringify(back) !== JSON.stringify(s)) { if (process.env.FUZZ_DIFF) { for (const k of new Set([...Object.keys(back), ...Object.keys(s)])) if (JSON.stringify(back[k]) !== JSON.stringify(s[k])) console.log('DIFF', k, JSON.stringify(s[k]).slice(0, 300), '=>', JSON.stringify(back[k]).slice(0, 300)); } note(run, step, '저장했다 읽으니 달라짐', action); }
      } catch (e) { note(run, step, `저장을 못 읽음: ${e.message}`, action); }
    }
  }
  seen.elites += s.counters.elites || 0; seen.enhance += s.counters.act.enhance || 0; seen.guild += s.guild?.contrib || 0; seen.days += s.day; seen.works += s.works.length; seen.falls += s.falls;
  for (const k of Object.keys(s.skills)) seen.skills.add(k);
  for (const [k, v] of Object.entries(s.hidden)) if (v.value > 0) seen.hidden.add(k);
}
console.log(`닿은 곳 ${seen.places.size} / ${Object.keys(PLACES).length}, 던전 안 걸음 ${seen.dungeon}, 이름난 개체 ${seen.elites}, 강화 시도 ${seen.enhance}, 길드 기여 ${seen.guild}, 지난 날 ${seen.days}, 작품 ${seen.works}, 쓰러짐 ${seen.falls}, 다시 태어남 ${seen.reborn}, 오른 숙련도 ${seen.skills.size}가지, 얻은 히든 ${[...seen.hidden].join(',') || '없음'}`);
console.log(`소금벌에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 4).join(', ') || '없음'}`);
console.log(`잿골에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 5).join(', ') || '없음'}`);
console.log(`안개늪에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 6).join(', ') || '없음'}`);
console.log(`잠긴 도성에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 7).join(', ') || '없음'}`);
console.log(`구름다리에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 8).join(', ') || '없음'}`);
console.log(`별못에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 9).join(', ') || '없음'}`);
console.log(`처음 모루에서 닿은 곳: ${[...seen.places].filter((id) => PLACES[id].band === 10).join(', ') || '없음'} · 벼림을 올린 턴 ${seen.temper || 0}, 종을 다 지은 판 ${seen.built || 0}, 본 끝 ${[...(seen.ends || [])].join(', ') || '없음'}`);
console.log(`걸음 ${steps}, 된 것 ${done}, 규칙이 거절한 것 ${refused}`);
console.log(bad.length ? `문제 ${bad.length}건\n` + bad.join('\n') : '문제 없음');
if (bad.length) process.exitCode = 1;

// ── 겨냥한 검증: 무작위로는 잘 닿지 않는 곳을 일부러 거듭 돈다 ──
{
  const { MONSTERS } = await import('../src/data/monsters.js');
  const extra = [];
  const safe = (label, s, action) => { try { dispatch(s, action); } catch (e) { if (e.constructor !== Error) extra.push(`${label}: ${e.constructor.name}: ${e.message} ← ${JSON.stringify(action)}`); return false; } const n = bad.length; check(s, label, 0, action); if (bad.length > n) extra.push(bad.pop()); return true; };
  let fights = 0, eliteWins = 0, tries = 0, plusTen = 0, works = 0;
  // 1. 모든 괴물과, 이름난 개체로도, 태세 넷으로 끝까지 싸운다
  for (const mon of Object.keys(MONSTERS)) for (const elite of [false, true]) for (const stance of Object.keys(STANCES)) {
    const s = createGame({ name: '싸움', origin: 'hunter', rolled: rollDice(`f|${mon}|${stance}`), seed: `d-${mon}-${stance}-${elite}` });
    s.level = 12; s.stats.str = 30; s.stats.agi = 20; s.stats.con = 25; s.stats.wis = 20; s.hp = 300; s.mp = 60; s.place = 'forest';
    try { dispatch(s, { type: 'career', op: 'choose', id: pick(['warrior', 'mage', 'priest']) }); } catch { /* 무직 */ }
    dispatch(s, { type: 'stance', id: stance });
    const m = MONSTERS[mon];
    s.battle = { mon, hp: m.hp, turn: 1, intent: null, stun: 0, weak: null, burn: 0, ward: null, streak: 0, phase: 0 };
    if (elite && !m.boss && !m.phases) { s.battle.elite = true; s.battle.hp = Math.round(m.hp * 2.5); }
    fights++;
    for (let t = 0; t < 400 && s.battle; t++) {
      const sl = slotsNow(s).filter((x) => x && x.action && !x.disabled && !/도망/.test(x.label));
      if (!sl.length) break;
      if (!safe(`싸움 ${mon}`, s, rnd() < 0.5 ? { type: 'battle', choice: 'defend' } : pick(sl).action)) continue;
      if (s.hp < 80) s.hp = 300;
    }
    if (!s.battle && s.counters.elites) eliteWins++;
  }
  // 2. 강화를 끝까지: 무기와 방어구, +10이 될 때까지(또는 3000번)
  for (const id of ['ironsword', 'woodsword', 'trainwear']) {
    const s = createGame({ name: '강화', origin: 'smithboy', rolled: rollDice(`e|${id}`), seed: `plus-${id}` });
    s.place = 'forge'; s.silver = 1e7;
    for (const mat of ['ironore', 'boarhide']) s.bag.push({ id: mat, grade: 0, n: 100000 });
    s.bag.push({ id, grade: 2, n: 1, dur: ITEMS[id].dur });
    const item = s.bag.at(-1);
    for (let t = 0; t < 3000 && (item.plus || 0) < 10; t++) {
      if (item.dur <= ITEMS[id].dur * 0.3) safe('수리', s, { type: 'repair', index: s.bag.indexOf(item) });
      safe(`강화 ${id}`, s, { type: 'enhance', index: s.bag.indexOf(item) });
      tries++; s.tired = 0; s.full = 80; s.phase = 0;
    }
    if (item.plus === 10) plusTen++;
  }
  // 3. 조각을 끝까지 다섯 점
  {
    const s = createGame({ name: '조각', origin: 'farmer', rolled: rollDice('w'), seed: 'works' });
    s.place = 'artguild'; // 조각은 예술협회에서 (Z80)
    s.dex.animals.rabbit = true; s.bag.push({ id: 'oakbranch', grade: 0, n: 100 }, { id: 'chisel', grade: 0, n: 1, dur: 120 }, { id: 'chisel', grade: 0, n: 1, dur: 120 });
    for (let w = 0; w < 5; w++) { if (!safe('조각 시작', s, { type: 'sculpt', subject: 'rabbit' })) break; for (let t = 0; t < 60 && s.sculpt; t++) { safe('칼질', s, { type: 'cut' }); s.tired = 0; s.full = 80; s.phase = 0; } }
    works = s.works.length;
  }
  console.log(`겨냥: 싸움 ${fights}판(이름난 개체를 이긴 판 ${eliteWins}), 강화 시도 ${tries}번(+10까지 간 장비 ${plusTen}/3), 작품 ${works}점`);
  console.log(extra.length ? `겨냥한 검증에서 문제 ${extra.length}건\n` + extra.slice(0, 20).join('\n') : '겨냥한 검증: 문제 없음');
  if (extra.length) process.exitCode = 1;
}
