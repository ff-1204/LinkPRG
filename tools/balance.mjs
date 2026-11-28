// 구간별 균형 계산 (LV-I5): node tools/balance.mjs [구간 번호…] [--runs=40] [--check]
// 그 구간 가운데 레벨의 사람을 직업 다섯으로 만들어, 그 구간 장비와 준비물을 갖춰 그 구간 몬스터와 실제 규칙으로 싸워 본다.
// 한 판에 잃는 생명력과 걸리는 턴을 내고, 시안의 표(src/data/bands.js)와 견준다. --check면 10%p 넘게 벗어난 줄이 있을 때 실패로 끝난다.
// 자료(몬스터, 그 단계 장비)가 아직 없는 구간은 "자료 없음"으로 적는다.
// 용병 (LV-H3, M19-2): 그 구간의 용병이 있는 구간은 "용병 없이 · 용병 하나(때리는 이) · 용병 둘(때리는 이와 막는 이)" 세 줄을 같이 낸다. --mercs=0|1|2면 그 줄만 낸다.
// 잠긴 도성(7)은 물 아래라 짝이 온다(연달아 두 판). 그 구간의 턴은 한 짝을 다 잡는 데 든 턴이다.
// 북 치는 이 (LV-H4, M20-2): 그 구간에 북 치는 이가 있으면 "용병 하나에 북 치는 이" 줄을 하나 더 낸다. --bard면 그 줄만 낸다.
// 읽힘 (BM-B, M21-3): 별못(9)은 읽히는 곳(못 둘레)에서 잰다. 줄 끝에 읽힌 판의 수와, 읽힌 판에서 처음 읽히기까지의 턴을 적는다.
// 안 막는 사람 (M23-1): --noguard면 모아 치기를 한 번도 막지 않는 싸움법으로 잰다. --kit=bare|food|holy면 그 준비물까지만 갖추고 잰다(용병은 --mercs로).
// 우두머리 (M23-1): --boss면 그 구간의 우두머리를, 우두머리와 같은 레벨의 사람으로 잰다(쓰러뜨리는 싸움만. 처음 모루의 종은 --bell).
// 겨루기 (AG-C, M23-4): --arena면 잿골의 겨루기 마당을 직업 다섯으로 잰다(상대 여섯 × 레벨 넷, 물약 없이). 줄마다 이긴 판의 수.
// 바람 (GD-B, M20-2): --wind면 바람이 부는 사냥터에서, 판마다 날과 때를 바꿔 가며 잰다(구름다리). 안 주면 바람이 없는 데서 잰다.
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { startBattle, intentOf } from '../src/core/battle.js';
import { rollDice } from '../src/data/origins.js';
import { MONSTERS } from '../src/data/monsters.js';
import { ITEMS } from '../src/data/items.js';
import { BANDS, bandByNo, foodRate, holyRate } from '../src/data/bands.js';
import { giveGrace } from '../src/core/buffs.js';
import { derived } from '../src/core/derived.js';
import { WILDS } from '../src/data/wild.js';
import { COMPANIONS, BAND_MERCS, MERC_ORDER, PLANS, bardOfBand } from '../src/data/companions.js';
import { PLACES } from '../src/data/places.js';
import { ARENA_FOES } from '../src/data/arena.js';

const args = process.argv.slice(2);
const RUNS = Number((args.find((a) => a.startsWith('--runs=')) || '--runs=40').slice(7));
const CHECK = args.includes('--check');
const MERCS = args.find((a) => a.startsWith('--mercs='));
const BARD = args.includes('--bard');
const WIND = args.includes('--wind');
const NOGUARD = args.includes('--noguard');
const BOSS = args.includes('--boss');
const KIT = (args.find((a) => a.startsWith('--kit=')) || '').slice(6) || null;
const only = args.filter((a) => /^\d+$/.test(a)).map(Number);

export const JOBS = { warrior: 'str', archer: 'agi', mage: 'wis', priest: 'wis', rogue: 'agi' };
/** 시안이 약속한 값: 갖출 것을 갖췄을 때 한 판에 잃는 생명력(%)과 턴 (LV-I 표). */
export const TARGET = { 1: [31, 5], 2: [32, 6], 3: [38, 7], 4: [38, 8], 5: [42, 9], 6: [42, 10], 7: [42, 11], 8: [42, 12], 9: [42, 13], 10: [48, 14] };
const KITS = ['bare', 'food', 'holy', 'merc', 'merc2', 'bard'];

let seed = 20261127;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };

/** 그 구간의 보통 몬스터: 사냥터에 나오는 것 가운데 레벨이 구간 안인 것. */
export function monstersOf(band) {
  const wild = new Set(Object.values(WILDS).flatMap((w) => (w.monsters || []).map((m) => m.id)));
  return Object.entries(MONSTERS).filter(([id, m]) => (wild.has(id) || m.band === band.n) && !m.boss && m.level >= band.from && m.level <= band.to).map(([id]) => id);
}
/** 그 구간의 우두머리(쓰러뜨리는 것만). 없으면 null. */
export const bossOf = (band) => Object.entries(MONSTERS).find(([, m]) => m.boss && m.band === band.n && !m.build)?.[0] || null;
/** 그 단계의 장비: 자리마다 가장 좋은 것 하나. 물건에 tier가 적혀 있으면 그것을, 없으면 지금 물건(1단계)으로 본다. */
export function gearOf(tier, main, job) {
  const of = (slot, score) => Object.entries(ITEMS)
    .filter(([, d]) => d.kind === 'gear' && !d.tool && !d.job && d.slot === slot && (d.tier || 1) === tier)
    .sort((a, b) => score(b[1]) - score(a[1]))[0]?.[0];
  const atk = (d) => (d.attack || 0) * 10 + (d.defense || 0), def = (d) => (d.defense || 0) * 10 + (d.attack || 0);
  // 직업 무기 (SB-G1): 궁수는 활, 도적은 단검, 마법사는 지팡이를 든다. 사제의 직업 무기는 기도 구슬(반지 자리, 1단계뿐)이라 무기는 가장 센 것을 든다
  const mine = (slot) => Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && d.job === job && d.slot === slot).sort((a, b) => Math.abs((a[1].tier || 1) - tier) - Math.abs((b[1].tier || 1) - tier))[0];
  const jobWeapon = job && job !== 'warrior' ? mine('weapon') : null;
  const weapon = jobWeapon && (jobWeapon[1].tier || 1) === tier ? jobWeapon[0] : of('weapon', atk);
  const beads = job === 'priest' ? mine('ring')?.[0] : null;
  const gear = { weapon, off: of('off', def), head: of('head', def), body: of('body', def), hand: of('hand', def), feet: of('feet', def), ring1: of('ring', def), ring2: beads || of('ring', atk) };
  return Object.values(gear).some(Boolean) ? gear : null;
}

/** 그 구간 가운데 레벨의 사람. 스탯 점수의 절반을 주 스탯에, 40%를 체력에 넣는다 (시안의 기준). */
export function buildPlayer(band, job, tierGear, level = band.n * 10 - 5) {
  const L = level;
  const s = createGame({ name: '저울', origin: 'farmer', rolled: rollDice('balance'), seed: `bal-${band.n}-${job}` });
  s.level = L;
  const pts = 3 * (L - 1), main = JOBS[job];
  s.stats[main] += Math.round(pts * 0.5);
  s.stats.con += Math.round(pts * 0.4);
  s.unspent = 0;
  if (job === 'priest') s.hidden.luck = { value: 1, half: true }; // 사제는 행운을 찾은 사람만 고른다 (Z116)
  if (L >= 5) { try { dispatch(s, { type: 'career', op: 'choose', id: job }); } catch { /* 고를 수 없으면 무직으로 싸운다 */ } }
  for (const [slot, id] of Object.entries(tierGear || {})) s.equip[slot] = id ? { id, grade: 0, n: 1, ...(ITEMS[id].dur ? { dur: ITEMS[id].dur, max: ITEMS[id].dur } : {}) } : null;
  s.place = 'forest'; s.silver = 0;
  return s;
}
/** 그 구간의 용병: [때리는 이, 막는 이]. 1~20은 지금 용병(가온, 돌방패). 그 구간 용병이 아직 없으면 null. */
export function mercsOf(band) {
  if (band.n <= 2) return [MERC_ORDER[0], MERC_ORDER[2]];
  const g = BAND_MERCS[band.n];
  if (g?.tents) return TENT_KIT.slice(0, 2); // 처음 모루: 일곱 천막의 창 든 이(소금벌)와 방패 든 이(흰마루) (CM-C)
  return g ? [g.order[0], g.order[2]] : null;
}
/** 처음 모루의 일행 셋 (CM-C): 창 든 이, 방패 든 이, 곁에서 보는 이(북돋는 이). 누가 와 있든 맡는 자리와 숫자는 같다. */
export const TENT_KIT = ['tent7f', 'tent6f', 'tent12f'];
/** 그 구간에서 북돋는 이. */
export const bardFor = (n) => (BAND_MERCS[n]?.tents ? TENT_KIT[2] : bardOfBand(n));
/** 그 준비물이 뜻하는 용병 수 (LV-A): merc 하나, merc2와 bard 둘. bard는 거기에 북 치는 이까지다(일행 셋). */
export const mercsOfKit = (kit) => (kit === 'merc' ? 1 : kit === 'merc2' || kit === 'bard' ? 2 : 0);
/** 그 준비물에 북 치는 이가 드는가. */
export const bardOfKit = (kit) => kit === 'bard';
/** 준비물을 건다. mercs: 데리고 갈 용병 수(0~2). bard: 북 치는 이를 데려가는가. 그 구간 용병이 없으면 넣지 못하고 그렇게 적는다. */
export function applyKit(s, band, kit, mercs = mercsOfKit(kit), bard = bardOfKit(kit)) {
  const i = KITS.indexOf(kit);
  const far = { day: s.day + 99, phase: 0 };
  if (i >= 1 && foodRate(band.n)) s.buffs.food = { name: '구간 음식', text: '', attack: 0, defense: 0, hp: 0, xp: 0, rate: foodRate(band.n), until: far };
  if (i >= 2) { giveGrace(s, holyRate(band.n)); s.buffs.grace.until = far; }
  if (!mercs && !bard) return null;
  const ids = mercsOf(band);
  if (!ids) return '이 구간의 용병은 아직 없다';
  const drummer = bard ? bardFor(band.n) : null;
  if (bard && !drummer) return '이 구간의 북 치는 이는 아직 없다';
  for (const id of [...ids.slice(0, mercs), ...(drummer ? [drummer] : [])]) { const d = COMPANIONS[id]; s.party.push({ id, hp: d.hp, row: d.row, plan: PLANS[d.role][0].id, crossed: 0, bond: 0, down: false, day: s.day }); }
  return null;
}
/** 그 구간에서 싸우는 곳: 물 아래(짝이 오는 곳)나 읽히는 곳(별못)이 있으면 거기서 잰다. wind면 바람이 부는 곳에서. */
export const fieldOf = (band, wind = false) => Object.values(PLACES).find((p) => p.wild && p.band === band.n && (p.under || p.mirror || p.forge || (wind && p.windy)))?.id || 'forest';

function fightOnce(base, mon, temper = 0, guards = true) {
  const s = JSON.parse(JSON.stringify(base));
  s.rng = Math.floor(rnd() * 4294967296) >>> 0;
  if (PLACES[s.place].windy) { s.day = 1 + Math.floor(rnd() * 9); s.phase = Math.floor(rnd() * 3); } // 판마다 다른 바람 (GD-B3). 날을 멀리 넘기지 않는다(사나움이 따라 오르지 않게)
  const maxHp = derived(s).find((d) => d.id === 'maxHp').value;
  s.hp = maxHp; s.mp = derived(s).find((d) => d.id === 'maxMp').value;
  startBattle(s, [], mon);
  let turns = 0, readAt = 0;
  while (s.battle && turns < 400) {
    if (s.sunken) s.sunken.breath = 99; // 숨은 따로 잰다. 여기서는 한 짝에 드는 턴과 잃는 생명력만 본다
    const slots = slotsNow(s).filter((x) => x && x.action && !x.disabled && x.action.type === 'battle' && !/도망/.test(x.label) && x.action.choice !== 'item' && x.action.choice !== 'flee');
    if (!slots.length) break;
    // 스킬을 쓸 수 있으면 절반은 스킬, 나머지는 그냥 친다
    const skills = slots.filter((x) => x.action.choice === 'skill');
    const hit = slots.find((x) => x.action.choice === 'attack') || slots[0];
    // 적이 크게 모으는 낌새(모아 치기)를 보이면 막는다. 이 게임에서 누구나 배우는 첫 요령이다
    const guard = guards && intentOf(s)?.kind === 'charge' ? slots.find((x) => x.action.choice === 'defend') : null;
    // 벼림을 쓰는 싸움법 (CM-B3): 큰 공격이 오지 않는 틈에, 벼림이 그만큼 찰 때까지 먼저 두드린다
    const hammer = temper && (s.battle.temper || 0) < temper ? slots.find((x) => x.action.choice === 'hammer') : null;
    const pick = guard || hammer || (skills.length && rnd() < 0.5 ? skills[Math.floor(rnd() * skills.length)] : hit);
    s.tired = 0; s.full = 80;
    try { dispatch(s, pick.action); } catch { try { dispatch(s, hit.action); } catch { break; } }
    turns++;
    if (!readAt && s.battle?.wasRead) readAt = turns; // 처음 읽힌 턴 (BM-B3)
  }
  const lost = s.flags.mustRebirth || s.battle || s.hp <= 0 || s.place !== base.place || (s.falls || 0) > (base.falls || 0);
  return { loss: lost ? 1 : Math.max(0, (maxHp - s.hp) / maxHp), turns, lost, readAt };
}

export function measure(bandNo, { runs = RUNS, kit, mercs, bard, wind = false, temper = 0, guard = true, boss = false } = {}) {
  const band = bandByNo(bandNo);
  const mons = boss ? [bossOf(band)].filter(Boolean) : monstersOf(band);
  const rows = [];
  for (const job of Object.keys(JOBS)) {
    const gear = gearOf(band.n, JOBS[job], job) || (band.n === 2 ? gearOf(1, JOBS[job], job) : null); // 2구간 장비(강철)가 생기기 전에는 1단계 장비로 잰다
    if (!mons.length || !gear) { rows.push({ band: band.n, job, missing: !mons.length ? '몬스터' : '장비' }); continue; }
    const base = buildPlayer(band, job, gear, boss ? MONSTERS[mons[0]].level : undefined);
    base.place = fieldOf(band, wind);
    const note = applyKit(base, band, kit || band.need, mercs, bard);
    let loss = 0, turns = 0, falls = 0, reads = 0, readTurns = 0;
    for (let i = 0; i < runs; i++) { const f = fightOnce(base, mons[i % mons.length], temper, guard); loss += f.loss; turns += f.turns; falls += f.lost ? 1 : 0; if (f.readAt) { reads++; readTurns += f.readAt; } }
    const [tl, tt] = TARGET[band.n];
    const got = Math.round((loss / runs) * 100);
    rows.push({ band: band.n, job, loss: got, turns: Math.round((turns / runs) * 10) / 10, falls, target: tl, targetTurns: tt, ok: Math.abs(got - tl) <= 10, note, ...(PLACES[base.place].mirror ? { reads, readAt: reads ? Math.round((readTurns / reads) * 10) / 10 : null } : {}) });
  }
  return rows;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/balance.mjs')) {
  let off = 0;
  const MERC_NAMES = ['용병 없이', '용병 하나', '용병 둘'];
  const nameOf = (t) => `${MERC_NAMES[t.mercs]}${t.bard ? '에 북 치는 이' : ''}`;
  for (const b of BANDS) {
    if (only.length && !only.includes(b.n)) continue;
    const need = mercsOfKit(b.need);
    const windy = WIND && fieldOf(b, true) !== fieldOf(b);
    console.log(`\n${b.from}~${b.to} ${b.name} (갖출 것: ${b.need}, 약속: ${TARGET[b.n][0]}% / ${TARGET[b.n][1]}턴${PLACES[fieldOf(b)].under ? ', 턴은 한 짝' : ''}${PLACES[fieldOf(b)].mirror ? ', 읽히는 데서' : ''}${windy ? ', 바람 부는 데서' : ''}${NOGUARD ? ', 모아 치기를 안 막고' : ''}${BOSS ? `, 우두머리 ${MONSTERS[bossOf(b)]?.name || '없음'}` : ''})`);
    // 그 구간의 용병이 있으면 세 줄(없이·하나·둘)을 다 낸다. 약속과 견주는 것은 그 구간이 갖출 것으로 꼽은 줄뿐이다
    // 북 치는 이가 있는 구간은 "용병 하나에 북 치는 이"(일행 둘 가운데 한 자리를 북 치는 이에게, GD-C1)를 한 줄 더 낸다
    const wantBard = bardOfKit(b.need) && !!bardFor(b.n);
    const temperOn = !!PLACES[fieldOf(b)].forge; // 벼리는 구간은 벼림을 쓰는 싸움법으로도 잰다 (CM-B3)
    const tries = BARD ? [{ mercs: MERCS ? Number(MERCS.slice(8)) : 1, bard: true }] : MERCS ? [{ mercs: Number(MERCS.slice(8)), bard: false }] : mercsOf(b) ? [...[0, 1, 2].map((n) => ({ mercs: n, bard: false })), ...(bardFor(b.n) ? [{ mercs: 1, bard: true }, ...(wantBard ? [{ mercs: 2, bard: true }] : [])] : [])] : [{ mercs: need, bard: false }];
    if (temperOn) for (const t of [...tries]) if (t.mercs === need && t.bard === wantBard) tries.push({ ...t, temper: 6 }, { ...t, temper: 12 });
    for (const t of tries) {
      const n = t.mercs;
      const rows = measure(b.n, { mercs: n, bard: t.bard, wind: WIND, temper: t.temper || 0, guard: !NOGUARD, boss: BOSS, ...(KIT ? { kit: KIT } : {}) });
      const mine = (n === need && t.bard === wantBard && !t.temper) || !mercsOf(b);
      if (tries.length > 1 || MERCS || BARD) console.log(` ${nameOf(t)}${t.temper ? `, 벼림 ${t.temper}까지 먼저 두드리고` : temperOn ? ', 벼림 없이' : ''}${mine ? ' (이 구간이 갖출 것)' : ''}`);
      for (const r of rows) {
        if (r.missing) { console.log(`  ${r.job.padEnd(8)} 자료 없음 (${r.missing})`); continue; }
        const kept = b.n <= 2; // 1~20은 지금 몬스터를 그대로 둔다 (LV-B1, LV-I1). 재기만 하고 약속과 견주지 않는다
        if (!r.ok && !kept && mine) off++;
        console.log(`  ${r.job.padEnd(8)} 잃는 생명력 ${String(r.loss).padStart(3)}%  턴 ${String(r.turns).padStart(5)}  쓰러짐 ${r.falls}/${RUNS}  ${kept ? '지금 그대로 둠' : !mine ? '' : r.ok ? '맞음' : '벗어남'}${r.reads != null ? `  읽힌 판 ${r.reads}/${RUNS}${r.readAt ? ` (처음 읽히는 턴 ${r.readAt})` : ''}` : ''}${r.note ? `  (${r.note})` : ''}`);
      }
    }
  }
  console.log(off ? `\n약속에서 10%p 넘게 벗어난 줄 ${off}개` : '\n모든 줄이 약속의 10%p 안');
  if (CHECK && off) process.exitCode = 1;
}

// ── 마지막 싸움 "지어지지 않은 종" (CM-D, M22-4): 직업 다섯으로 따로 돌린다 ──
// 싸움법 둘: hammer(껍질을 두고 두드리기만 한다) · break(틈마다 쳐서 껍질을 깨고, 깨진 동안 두드린다). 큰 공격은 늘 막는다.
// smith: 대장 레벨(33을 넘으면 망치질 한 번이 둘이다). cap: 한 번 올라 버티는 턴(그 뒤에는 망치를 내려놓고 내려온다. 다시 오르면 절반에서 시작한다).
export function bellRun(job, { smith = 1, strat = 'hammer', cap = 0, level = 97 } = {}) {
  const band = bandByNo(10);
  const base = buildPlayer(band, job, gearOf(10, JOBS[job], job));
  base.level = level;
  const more = 3 * (level - 95); base.stats[JOBS[job]] += Math.round(more * 0.5); base.stats.con += Math.round(more * 0.4);
  applyKit(base, band, 'bard');
  base.craftLv = { ...(base.craftLv || {}), smith: { lv: smith, xp: 0 } };
  base.main.chapter = 13; base.place = 'anvilfront';
  const s = JSON.parse(JSON.stringify(base));
  s.rng = Math.floor(rnd() * 4294967296) >>> 0;
  let turns = 0, climbs = 0, hurt = 0;
  while (!s.anvil.built && climbs < 40) {
    climbs++;
    s.hp = derived(s).find((d) => d.id === 'maxHp').value; s.mp = derived(s).find((d) => d.id === 'maxMp').value;
    dispatch(s, { type: 'lifthammer' });
    let n = 0;
    while (s.battle) {
      s.tired = 0; s.full = 80;
      if (cap && n >= cap) { dispatch(s, { type: 'battle', choice: 'flee' }); break; }
      const big = s.battle.intent === 'charge';
      const open = s.battle.hp <= 0;
      const before = s.hp;
      const choice = big ? 'defend' : strat === 'break' && !open ? 'attack' : 'hammer';
      dispatch(s, { type: 'battle', choice });
      hurt += Math.max(0, before - s.hp);
      n++; turns++;
      if (s.hp <= 0 || s.place !== 'anvilfront') break;
    }
    if (s.choice) dispatch(s, { type: 'choose', id: 'back' });
    if (s.place !== 'anvilfront') { s.place = 'anvilfront'; s.flags.mustRebirth = false; }
  }
  return { turns, climbs, built: !!s.anvil.built, hurt };
}
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/balance.mjs') && process.argv.includes('--bell')) {
  console.log('\n마지막 싸움 "지어지지 않은 종" (레벨 97, 첫쇠 한 벌, 음식과 성수, 일곱 천막의 셋). 턴 / 오른 횟수');
  for (const cap of [0, 140]) {
    console.log(cap ? ` 한 번 오르면 ${cap}턴만 버티고 내려온다(다시 오르면 절반에서)` : ' 지치지 않는다고 치고 한 번에');
    for (const job of Object.keys(JOBS)) {
      const cell = (smith, strat) => { const r = bellRun(job, { smith, strat, cap }); return `${r.built ? '' : '못 지음 '}${r.turns}턴 / ${r.climbs}번`; };
      console.log(`  ${job.padEnd(8)} 대장 1: 두드리기만 ${cell(1, 'hammer')} · 껍질을 깨며 ${cell(1, 'break')}   대장 34: 두드리기만 ${cell(34, 'hammer')} · 껍질을 깨며 ${cell(34, 'break')}`);
    }
  }
}

// ── 잿골의 겨루기 마당 (AG-C, M23-4): 레벨 45, 잿쇠 한 벌, 물약 없이. 상대 여섯을 레벨 44~47로 돌아가며 만난다 ──
// guard: 큰 공격(내려치기)을 막는가. potions: 들고 선 붉은 물약의 수(생명력이 40% 아래면 마신다).
export function arenaRun(job, { guard = true, runs = 120, kit = 'bare', potions = 0 } = {}) {
  const band = bandByNo(5);
  const base = buildPlayer(band, job, gearOf(5, JOBS[job], job));
  applyKit(base, band, kit, 0, false);
  base.place = 'arena';
  if (potions) base.bag.push({ id: 'redpotion', grade: 0, n: potions });
  let wins = 0, turns = 0, left = 0;
  for (let i = 0; i < runs; i++) {
    const s = JSON.parse(JSON.stringify(base));
    s.rng = Math.floor(rnd() * 4294967296) >>> 0;
    const maxHp = derived(s).find((d) => d.id === 'maxHp').value;
    s.hp = maxHp; s.mp = derived(s).find((d) => d.id === 'maxMp').value;
    const foe = ARENA_FOES[i % ARENA_FOES.length];
    startBattle(s, [], 'ashblade', { arena: { foe: foe.id, name: foe.name, level: s.level - 1 + (Math.floor(i / ARENA_FOES.length) % 4), last: null, rested: false } });
    let won = false, n = 0;
    while (s.battle && n < 400) {
      const slots = slotsNow(s).filter((x) => x && x.action && !x.disabled && x.action.type === 'battle' && x.action.choice !== 'item' && x.action.choice !== 'flee');
      const skills = slots.filter((x) => x.action.choice === 'skill');
      const hit = slots.find((x) => x.action.choice === 'attack') || slots[0];
      const block = guard && intentOf(s)?.kind === 'charge' ? slots.find((x) => x.action.choice === 'defend') : null;
      const pick = block || (skills.length && rnd() < 0.5 ? skills[Math.floor(rnd() * skills.length)] : hit);
      s.tired = 0; s.full = 80;
      const pot = !block && s.hp < maxHp * 0.4 ? s.bag.findIndex((x) => x.id === 'redpotion') : -1; // 아프면 물약(생명력 40% 아래)
      let ev;
      if (pot >= 0) ev = dispatch(s, { type: 'use', index: pot });
      else try { ev = dispatch(s, pick.action); } catch { ev = dispatch(s, hit.action); }
      if (ev.some((e) => e.type === 'battle' && e.arena?.won)) won = true;
      n++;
    }
    if (won) { wins++; left += s.hp / maxHp; }
    turns += n;
  }
  return { wins, runs, turns: Math.round((turns / runs) * 10) / 10, left: wins ? Math.round((left / wins) * 100) : 0 };
}
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/balance.mjs') && process.argv.includes('--arena')) {
  console.log('\n잿골의 겨루기 마당 (레벨 45, 잿쇠 한 벌, 물약 없이, 상대 여섯 × 레벨 44~47). 이긴 판 / 판 (턴, 이겼을 때 남은 생명력)');
  const POTIONS = 5;
  for (const kit of ['bare', 'food']) {
    console.log(kit === 'bare' ? ' 음식 없이' : ' 잿불 게 구이를 먹고');
    for (const job of Object.keys(JOBS)) {
      const cell = (guard, potions = 0) => { const r = arenaRun(job, { guard, potions, runs: RUNS < 120 ? 120 : RUNS, kit }); return `${r.wins}/${r.runs} (${r.turns}턴, ${r.left}%)`; };
      console.log(`  ${job.padEnd(8)} 안 막고 ${cell(false)} · 큰 공격을 막고 ${cell(true)} · 막고 물약 ${POTIONS}병을 들고 ${cell(true, POTIONS)}`);
    }
  }
}
