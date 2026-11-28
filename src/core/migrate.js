// 저장의 판(버전)과, 옛 저장을 지금 꼴로 올리는 길.
// 저장 형식을 바꾸면 SAVE_VERSION을 올리고 여기에 한 단계를 더한다.

import { makeItem } from './inventory.js?v=472d163';
import { valueOf } from './derived.js?v=472d163';
import { worldFields } from './world.js?v=472d163';
import { auctionFields } from './auction.js?v=472d163';

import { endingFields } from './ending.js?v=472d163';
import { MAIN } from '../data/quests.js?v=472d163';
import { ITEMS } from '../data/items.js?v=472d163';
import { ADVANCED } from '../data/jobs.js?v=472d163';
import { nativeWork } from './work.js?v=472d163';
import { deliverMail } from './mail.js?v=472d163';
import { cidFrom } from './rng.js?v=472d163';
import { guessLvPts } from './statplan.js?v=472d163';
import { tierOfLv } from '../data/bands.js?v=472d163';
import { ashFields } from './heat.js?v=472d163';
import { marshFields } from './marsh.js?v=472d163';
import { sunkenFields, SUNKEN } from './sunken.js?v=472d163';
const ORIGIN_NATIVE = new Proxy({}, { get: (_, id) => nativeWork(id) });

export { worldFields, auctionFields, endingFields };

export const SAVE_VERSION = 21;

/** M2에서 생긴 몸·가방·전투 칸. 새 게임과 옛 저장이 같은 것을 쓴다. */
export function bodyFields() {
  return {
    hp: 0, mp: 0, full: 80, xp: 0, hungerTick: 0,
    bag: [makeItem('riceball', { n: 3 })],
    equip: { weapon: null, off: null, head: null, body: makeItem('trainwear'), hand: null, feet: makeItem('sandals'), ring1: null, ring2: null },
    status: [], battle: null, choice: null,
    shadow: 0, shadowPray: 0, relic: null, falls: 0,
    tension: {}, calm: 0,
    dex: { mon: {}, items: {}, places: {}, animals: {}, dishes: {} },
  };
}

/** M3에서 생긴 제작·진화·일하는 직업·보관함 칸. */
export function makerFields() {
  return { craft: null, made: 0, craftLv: { smith: { lv: 1, xp: 0 }, sew: { lv: 1, xp: 0 }, jewel: { lv: 1, xp: 0 } }, craftTier: { smith: 1, sew: 1, jewel: 1, cook: 1 }, evolve: {}, evolveSeen: {}, work: null, workAsk: 3, store: {}, storeDebt: 0 };
}

/** M4에서 생긴 사람·명성·칭호·퀘스트 칸. */
export function townFields() {
  return {
    people: {}, fame: {}, titles: [], title: null, lean: 0,
    jobs: [], jobsDone: 0, board: { day: 0, gone: [] },
    quests: {}, hq: {}, main: { chapter: 1, done: [], past: [], called: null, soldRare: false }, opened: [],
  };
}

/** M5에서 생긴 직업·세력 칸. */
export function jobFields() {
  return { jobAsked: false, hjobs: {}, quick: null, factions: {}, job2: null };
}

/** M6에서 생긴 조각·요리·동료 칸. */
export function artFields() {
  return { sculpt: null, works: [], buffs: {}, cookHints: [], cookFails: [], party: [] };
}

/** M7에서 생긴 던전 칸. dungeon: 지금 안에 있는 던전. dmem: 나가도 남는 것(지도, 연 문, 챙긴 보물). */
export function dungeonFields() {
  return { dungeon: null, dmem: {} };
}

/** 캐릭터 표 (Z96). 표가 없던 옛 저장은 씨앗·이름·출신으로 낸다. */
export function cidOfState(state) {
  return typeof state.cid === 'string' && state.cid ? state.cid : cidFrom(`${state.seed}|${state.name}|${state.origin}`);
}

const STEPS = {
  // 20 → 21: 처음 모루가 생겼다 (CM-D). 모루 위에 남긴 종도, 새긴 끝도, 본 끝도 없이 시작한다
  20(state) {
    state.anvil = { left: 0, built: false, end: null, endDay: 0, seen: [], tent: false, follow: 0 };
  },
  // 19 → 20: 별못이 생겼다 (BM-D, BM-E). 지켜본 일도, 건 작은 종도 없이 시작한다. 공방의 셋째 자리(hand3)는 들일 때 생긴다: 없으면 빈 자리다
  19(state) {
    state.pond = { who: null, watch: {}, bells: 0 };
  },
  // 18 → 19: 구름다리가 생겼다 (GD-D, GD-E). 상단은 없이, 구름다리에서 올린 기도는 없이 시작한다. 일행이 둘이던 저장은 그대로 둘이다(셋째 자리는 11장을 끝내야 생긴다)
  18(state) {
    state.caravan = null;
    state.cloud = { prayers: 0 };
  },
  // 17 → 18: 잠긴 도성이 생겼다 (JD-B, JD-D). 숨은 가득 찬 채로, 상자는 하나도 열지 않은 채로, 종루에 바친 청동은 없이 시작한다. 공방에는 둘째 자리가 생긴다(빈 채로)
  17(state) {
    state.sunken = sunkenFields().sunken;
    if (state.shop && state.shop.hand2 === undefined) state.shop.hand2 = null;
  },
  // 16 → 17: 안개늪이 생겼다 (AN-B, AN-C). 저주는 없이, 등불은 꺼진 채로, 묶은 끈과 걷은 이끼는 없이, 공방은 없이 시작한다.
  16(state) {
    state.marsh = marshFields().marsh;
    state.shop = null;
  },
  // 15 → 16: 잿골이 생겼다 (AG-B, AG-C). 달궈진 쇠는 식은 채로, 겨루기는 한 번도 서지 않은 채로 시작한다.
  15(state) {
    state.ash = ashFields().ash;
  },
  // 14 → 15: 소금벌이 생겼다 (SB-B, SB-D, SB-E). 물은 가득에서, 찾은 옛 우물은 없이, 가게는 없이, 지난 삶에서 끝낸 장은 없이 시작한다.
  14(state) {
    state.water = 10;
    state.dryStep = 0;
    state.wells = [];
    state.wellTries = {};
    state.stall = null;
    if (state.main) state.main.past = [];
  },
  // 13 → 14: 흰마루의 추위가 생겼다 (WM-B). 체온은 가득에서, 횃불은 꺼진 채로 시작한다.
  13(state) {
    state.warm = 100;
    state.torch = 0;
  },
  // 12 → 13: 제작 단계가 생겼다 (LV-F11). 지금 제작 레벨이 든 단계에서 시작한다. 그날 한 일의 수(이자, LV-L9)도 센다.
  12(state) {
    state.craftTier = {};
    for (const [k, v] of Object.entries(state.craftLv || {})) if (v && Number.isFinite(v.lv)) state.craftTier[k] = tierOfLv(v.lv);
    if (state.flags) state.flags.dayWork = 0;
  },
  // 11 → 12: 캐릭터 표(cid)가 생겼다 (Z96). 옛 캐릭터는 씨앗·이름·출신으로 표를 낸다. 어느 기기에서 올려도 같은 표가 나온다.
  11(state) {
    state.cid = cidOfState(state);
  },
  // 10 → 11: 피로가 생겼다. 조각은 조각칼이 있어야 한다. 이미 깎아 본 사람은 칼을 하나 쥐고 시작한다.
  10(state) {
    state.tired = 0;
    if ((state.works || []).length || state.sculpt) state.bag.push(makeItem('chisel'));
  },
  // 9 → 10: 끝과, 끝난 뒤의 일이 생겼다.
  9(state) {
    Object.assign(state, endingFields());
  },
  // 8 → 9: 2차 전직이 생겼다.
  8(state) {
    state.job2 = null;
  },
  // 7 → 8: 가상 유저의 세계(공지, 최초 발견, 소문)와 경매장이 생겼다.
  7(state) {
    Object.assign(state, worldFields(), auctionFields());
    state.world.today.day = state.day;
  },
  // 6 → 7: 던전, 속성, 우두머리가 생겼다.
  6(state) {
    Object.assign(state, dungeonFields());
    if (state.battle) state.battle.phase = 0;
  },
  // 5 → 6: 조각과 작품, 요리, 버프, 동료가 생겼다.
  5(state) {
    Object.assign(state, artFields());
    state.dex.animals = {};
    state.dex.dishes = {};
  },
  // 4 → 5: 직업 고르기, 히든 직업, 세력이 생겼다.
  4(state) {
    Object.assign(state, jobFields());
    if (state.flags.templeKnown) state.factions.temple = 10;
  },
  // 3 → 4: 사람들과의 사이, 명성, 칭호, 퀘스트 네 갈래, 도감이 생겼다.
  3(state) {
    Object.assign(state, townFields());
    state.dex.items = {};
    state.dex.places = {};
  },
  // 2 → 3: 제작, 스킬 진화, 일하는 직업, 보관함이 생겼다.
  2(state) {
    Object.assign(state, makerFields());
  },
  // 1 → 2: 몸 상태, 가방, 장비, 전투가 생겼다.
  1(state) {
    Object.assign(state, bodyFields());
    if ((state.counters?.act?.strike || 0) > 0) {
      state.equip.weapon = makeItem('woodsword');
      state.flags.gotSword = true;
    }
    state.hp = valueOf(state, 'maxHp');
    state.mp = valueOf(state, 'maxMp');
  },
};

/** 옛 상태를 지금 판으로 올린다. 이미 지금 판이면 그대로다. */
/** 판이 같아도 어긋날 수 있는 것을 바로잡는다. 여러 번 돌려도 같다. */
function mend(state) {
  // 스탯 다시 찍기 (Z116): 찍은 자리가 없던 저장은 짐작하고, 직업이 있으면 한 번 다시 찍게 한다
  if (!state.lvPts && state.stats) state.lvPts = guessLvPts(state);
  if (state.respec === undefined) state.respec = state.job ? 'open' : null;
  // 잡화점은 예술협회로 옮겨 갔다 (Z82)
  if (state.place === 'store') state.place = 'artguild';
  // 제작 레벨 (Z79): 없던 저장은 지금까지 만든 수로 처음 레벨을 정한다. 철검을 만들던 사람이 못 만들게 되지 않게 대장은 하나라도 만들었으면 3부터
  if (!state.craftLv) {
    const lvOf = (xp) => { let lv = 1; while (xp >= lv * 10) { xp -= lv * 10; lv += 1; } return { lv, xp }; };
    const made = state.made || 0, sewn = state.counters?.sewn || 0;
    const smith = lvOf(made * 2), sew = lvOf(sewn * 2);
    state.craftLv = { smith: made > 0 && smith.lv < 3 ? { lv: 3, xp: 0 } : smith, sew: sewn > 0 && sew.lv < 2 ? { lv: 2, xp: 0 } : sew, jewel: { lv: 1, xp: 0 } };
  }
  // 제작 단계 (LV-F11): 제작 레벨이 위에서 막 생긴 옛 저장도 제 단계를 갖는다
  if (!state.craftTier || typeof state.craftTier !== 'object') state.craftTier = {};
  for (const [k, v] of Object.entries(state.craftLv || {})) if (!Number.isInteger(state.craftTier[k]) && v && Number.isFinite(v.lv)) state.craftTier[k] = tierOfLv(v.lv);
  // 끝낸 장이 여는 길: 그 장을 끝낸 뒤에 길이 생긴 경우(2장 → 나루)가 있다
  if (state.main && Array.isArray(state.main.done) && Array.isArray(state.opened)) {
    for (const d of state.main.done) for (const id of [...(MAIN[d && d.chapter]?.opens || []), ...(MAIN[d && d.chapter]?.roads || [])]) if (!state.opened.includes(id)) state.opened.push(id);
  }
  // 흰마루로 가는 길 (WM-A1): 끝을 본 밤에 열린다. 그 밤이 이미 지난 옛 저장은 읽을 때 연다
  if (state.ending && Array.isArray(state.opened) && !state.opened.includes('icegate') && (state.endDay || 0) < state.day) state.opened.push('icegate');
  if (state.counters && !Number.isFinite(state.counters.tiredWork)) state.counters.tiredWork = 0;
  if (!['hold', 'clash', 'dodge', 'focus'].includes(state.stance)) state.stance = 'hold';
  if (state.guild === undefined) state.guild = null;
  if (!Number.isFinite(state.warm) || state.warm < 0 || state.warm > 100) state.warm = 100;
  if (!Number.isInteger(state.torch) || state.torch < 0) state.torch = 0;
  if (!Number.isFinite(state.water) || state.water < 0 || state.water > 10) state.water = 10;
  if (!Number.isInteger(state.dryStep) || state.dryStep < 0) state.dryStep = 0;
  if (!Array.isArray(state.wells)) state.wells = [];
  if (!state.wellTries || typeof state.wellTries !== 'object') state.wellTries = {};
  if (state.stall === undefined) state.stall = null;
  // 잿골의 칸 (AG-B, AG-C): 빠졌거나 어긋난 것은 처음 값으로
  {
    const fresh = ashFields().ash;
    if (!state.ash || typeof state.ash !== 'object' || Array.isArray(state.ash)) state.ash = fresh;
    const a = state.ash;
    for (const k of ['hot', 'hotNo', 'pumps', 'ember']) if (!Number.isInteger(a[k]) || a[k] < 0) a[k] = fresh[k];
    if (a.hot > 30) a.hot = 30;
    if (!a.half || typeof a.half !== 'object') a.half = {};
    if (!a.duel || typeof a.duel !== 'object') a.duel = fresh.duel;
    for (const k of ['day', 'wins', 'pumps', 'told', 'seenDay']) if (!Number.isInteger(a.duel[k]) || a.duel[k] < 0) a.duel[k] = 0;
    a.duel.lost = !!a.duel.lost;
    if (!Array.isArray(a.duel.seen)) a.duel.seen = [];
  }
  // 미루를 동료로 들인 적이 있는가 (GD-G5): 옛 저장은 지금 곁에 있거나, 따라나선 날이 일지에 남아 있으면 그렇다고 본다
  if (state.flags && !state.flags.hadMiru && ((state.party || []).some((c) => c && c.id === 'miru') || (state.journal || []).some((j) => j && j.note === '미루와 함께한 날'))) state.flags.hadMiru = true;
  // 처음 모루의 칸 (CM-D): 빠졌거나 어긋난 것은 처음 값으로
  {
    const ENDS = ['again', 'cool', 'share', 'descend', 'eight'];
    if (!state.anvil || typeof state.anvil !== 'object' || Array.isArray(state.anvil)) state.anvil = { left: 0, built: false, end: null, endDay: 0, seen: [], tent: false, follow: 0 };
    const a = state.anvil;
    if (!Number.isInteger(a.left) || a.left < 0) a.left = 0;
    if (a.left > 100) a.left = 100;
    a.built = !!a.built; a.tent = !!a.tent;
    if (!ENDS.includes(a.end)) a.end = null;
    if (a.end) a.built = true;
    if (!Number.isInteger(a.endDay) || a.endDay < 0) a.endDay = 0;
    a.seen = Array.isArray(a.seen) ? [...new Set(a.seen.filter((x) => ENDS.includes(x)))] : [];
    if (a.end && !a.seen.includes(a.end)) a.seen.push(a.end);
    if (!Number.isInteger(a.follow) || a.follow < 0) a.follow = 0;
  }
  // 별못의 칸 (BM-D, BM-E): 빠졌거나 어긋난 것은 처음 값으로
  {
    if (!state.pond || typeof state.pond !== 'object' || Array.isArray(state.pond)) state.pond = { who: null, watch: {}, bells: 0 };
    const p = state.pond;
    if (!p.watch || typeof p.watch !== 'object' || Array.isArray(p.watch)) p.watch = {};
    for (const [id, w] of Object.entries(p.watch)) {
      if (!w || typeof w !== 'object') { delete p.watch[id]; continue; }
      if (!Number.isInteger(w.n) || w.n < 0) w.n = 0;
      if (w.n > 30) w.n = 30;
      if (!Number.isInteger(w.done) || w.done < 0) w.done = 0;
      if (w.done > 3) w.done = 3;
      w.ready = w.done < 3 && w.n >= 30;
    }
    if (typeof p.who !== 'string') p.who = null;
    if (!Number.isInteger(p.bells) || p.bells < 0) p.bells = 0;
    if (p.bells > 7) p.bells = 7;
  }
  // 구름다리의 칸 (GD-D, GD-E): 빠졌거나 어긋난 것은 처음 값으로
  if (state.caravan === undefined) state.caravan = null;
  if (state.caravan) { const c = state.caravan; if (!Array.isArray(c.past)) c.past = []; if (!c.heard || typeof c.heard !== 'object') c.heard = {}; if (!Number.isInteger(c.sent)) c.sent = 0; if (c.load === undefined) c.load = null; }
  if (!state.cloud || typeof state.cloud !== 'object' || Array.isArray(state.cloud)) state.cloud = { prayers: 0 };
  if (!Number.isInteger(state.cloud.prayers) || state.cloud.prayers < 0) state.cloud.prayers = 0;
  // 잠긴 도성의 칸 (JD-B, JD-D): 빠졌거나 어긋난 것은 처음 값으로
  {
    const fresh = sunkenFields().sunken;
    if (!state.sunken || typeof state.sunken !== 'object' || Array.isArray(state.sunken)) state.sunken = fresh;
    const a = state.sunken;
    if (!Number.isInteger(a.breath) || a.breath < 0) a.breath = SUNKEN.max;
    if (!Number.isInteger(a.bronze) || a.bronze < 0) a.bronze = 0;
    if (!a.boxes || typeof a.boxes !== 'object' || Array.isArray(a.boxes)) a.boxes = {};
    if (state.shop && state.shop.hand2 === undefined) state.shop.hand2 = null;
  }
  // 안개늪의 칸 (AN-B, AN-C): 빠졌거나 어긋난 것은 처음 값으로
  {
    const fresh = marshFields().marsh;
    if (!state.marsh || typeof state.marsh !== 'object' || Array.isArray(state.marsh)) state.marsh = fresh;
    const a = state.marsh;
    for (const k of ['curse', 'pray', 'lamp', 'moss']) if (!Number.isInteger(a[k]) || a[k] < 0) a[k] = 0;
    if (a.curse > 5) a.curse = 5;
    if (a.lamp > 60) a.lamp = 60;
    if (!a.knots || typeof a.knots !== 'object' || Array.isArray(a.knots)) a.knots = {};
    if (state.shop === undefined) state.shop = null;
  }
  if (state.main && !Array.isArray(state.main.past)) state.main.past = [];
  if (!state.lore || !Array.isArray(state.lore.hints)) state.lore = { hints: [] };
  if (!state.tough) state.tough = { str: 0, agi: 0, con: 0, wis: 0 };
  if (!state.toughGained) state.toughGained = { str: 0, agi: 0, con: 0, wis: 0 };
  if (state.auction && !Array.isArray(state.auction.bought)) state.auction.bought = []; // 암시장으로 넘어간 오늘 물건 (Z104)
  if (!state.toilGained) state.toilGained = { str: 0, agi: 0, con: 0, wis: 0 }; // 이 칸이 생기기 전에 오른 것은 세어 두지 않아 알 수 없다 (Z101)
  // 하루 쇠약은 죽음의 그림자가 되었다 (Z31): 아직 쇠약하던 사람은 한 겹을 안고 온다
  if (!Number.isInteger(state.shadow)) {
    const w = state.weak;
    state.shadow = w && !(state.day > w.day || (state.day === w.day && state.phase >= w.phase)) ? 1 : 0;
    state.shadowPray = 0;
  }
  delete state.weak;
  if (!Number.isInteger(state.lives)) state.lives = 1;
  if (!Array.isArray(state.pastLives)) state.pastLives = [];
  if (!state.pastHidden) state.pastHidden = {};
  deliverMail(state); // 우편함 (Z59): 이미 하던 캐릭터에게도 한 번
  if (!state.scent || typeof state.scent !== 'object') state.scent = {}; // 먹잇감 냄새 (Z64)
  if (!Array.isArray(state.learned)) {
    // 배우는 규칙이 생기기 전에 이미 해 본 일은 아는 일로 친다
    state.learned = ['bellows', 'gut', 'rowing', 'haul', 'plane', 'spar'].filter((id) => (state.counters?.act?.[id] || 0) > 0);
    for (const id of ORIGIN_NATIVE[state.origin] || []) if (!state.learned.includes(id)) state.learned.push(id);
  }
  if (state.guild && (!['fang', 'anvil', 'lantern'].includes(state.guild.id) || !Number.isFinite(state.guild.contrib))) state.guild = null;
  // 만들 때 내구도가 늘어난 옛 장비: 그 값이 최대치다
  const gear = [...(state.bag || []), ...Object.values(state.equip || {})];
  for (const it of gear) if (it && it.dur != null && it.max == null && ITEMS[it.id] && it.dur > (ITEMS[it.id].dur || 0)) it.max = it.dur;
  // 히든 직업으로 갈아탄 뒤에 남은 2차 전직
  if (state.job2 && ADVANCED[state.job2] && ADVANCED[state.job2].from !== state.job) state.job2 = null;
}

export function migrate(state) {
  let v = Number.isInteger(state.v) ? state.v : 1;
  if (v > SAVE_VERSION) throw new Error(`저장 파일의 판(${v})이 지금 판(${SAVE_VERSION})보다 새것입니다`);
  while (v < SAVE_VERSION) {
    STEPS[v](state);
    v += 1;
    state.v = v;
  }
  mend(state);
  return state;
}
