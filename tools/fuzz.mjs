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

const RUNS = Number(process.argv[2] || 40), STEPS = Number(process.argv[3] || 1500);
let seed = 12345;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

/** 창에서 하는 일들: 아무 값이나 넣어 본다. 대부분은 규칙이 거절한다. */
function wild(s) {
  const bagIndex = Math.floor(rnd() * (s.bag.length + 1));
  const slot = pick(Object.keys(s.equip));
  return pick([
    { type: 'move', to: pick(Object.keys(PLACES)) },
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
  for (let step = 1; step <= STEPS; step++) {
    // 운이 다시 태어나라 하면 다시 태어난다 (Z32)
    if (s.flags.mustRebirth) {
      s = createGame({ name: `환생${run}`, origin: pick(ORIGINS).id, rolled: rollDice(`fuzz|${run}|${step}`), seed: `fuzz-${run}-${step}`, carry: rebirthCarry(s) });
      seen.reborn++;
    }
    const slots = slotsNow(s).filter((x) => x && x.action && !x.disabled);
    const action = slots.length && rnd() < 0.7 ? pick(slots).action : wild(s);
    steps++;
    try { dispatch(s, action); done++; seen.places.add(s.place); if (s.dungeon) seen.dungeon++; } catch (e) {
      if (e.constructor !== Error) { note(run, step, `${e.constructor.name}: ${e.message}`, action); break; }
      refused++;
    }
    check(s, run, step, action);
    if (step % 250 === 0) {
      // 저장했다 읽어도 같은가
      try {
        const back = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
        if (JSON.stringify(back) !== JSON.stringify(s)) note(run, step, '저장했다 읽으니 달라짐', action);
      } catch (e) { note(run, step, `저장을 못 읽음: ${e.message}`, action); }
    }
  }
  seen.elites += s.counters.elites || 0; seen.enhance += s.counters.act.enhance || 0; seen.guild += s.guild?.contrib || 0; seen.days += s.day; seen.works += s.works.length; seen.falls += s.falls;
  for (const k of Object.keys(s.skills)) seen.skills.add(k);
  for (const [k, v] of Object.entries(s.hidden)) if (v.value > 0) seen.hidden.add(k);
}
console.log(`닿은 곳 ${seen.places.size} / ${Object.keys(PLACES).length}, 던전 안 걸음 ${seen.dungeon}, 이름난 개체 ${seen.elites}, 강화 시도 ${seen.enhance}, 길드 기여 ${seen.guild}, 지난 날 ${seen.days}, 작품 ${seen.works}, 쓰러짐 ${seen.falls}, 다시 태어남 ${seen.reborn}, 오른 숙련도 ${seen.skills.size}가지, 얻은 히든 ${[...seen.hidden].join(',') || '없음'}`);
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
    s.dex.animals.rabbit = true; s.bag.push({ id: 'oakbranch', grade: 0, n: 100 }, { id: 'chisel', grade: 0, n: 1, dur: 120 }, { id: 'chisel', grade: 0, n: 1, dur: 120 });
    for (let w = 0; w < 5; w++) { if (!safe('조각 시작', s, { type: 'sculpt', subject: 'rabbit' })) break; for (let t = 0; t < 60 && s.sculpt; t++) { safe('칼질', s, { type: 'cut' }); s.tired = 0; s.full = 80; s.phase = 0; } }
    works = s.works.length;
  }
  console.log(`겨냥: 싸움 ${fights}판(이름난 개체를 이긴 판 ${eliteWins}), 강화 시도 ${tries}번(+10까지 간 장비 ${plusTen}/3), 작품 ${works}점`);
  console.log(extra.length ? `겨냥한 검증에서 문제 ${extra.length}건\n` + extra.slice(0, 20).join('\n') : '겨냥한 검증: 문제 없음');
  if (extra.length) process.exitCode = 1;
}
