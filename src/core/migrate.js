// 저장의 판(버전)과, 옛 저장을 지금 꼴로 올리는 길.
// 저장 형식을 바꾸면 SAVE_VERSION을 올리고 여기에 한 단계를 더한다.

import { makeItem } from './inventory.js?v=c0f458e';
import { valueOf } from './derived.js?v=c0f458e';
import { worldFields } from './world.js?v=c0f458e';
import { auctionFields } from './auction.js?v=c0f458e';

import { endingFields } from './ending.js?v=c0f458e';
import { MAIN } from '../data/quests.js?v=c0f458e';
import { ITEMS } from '../data/items.js?v=c0f458e';
import { ADVANCED } from '../data/jobs.js?v=c0f458e';
import { nativeWork } from './work.js?v=c0f458e';
import { deliverMail } from './mail.js?v=c0f458e';
const ORIGIN_NATIVE = new Proxy({}, { get: (_, id) => nativeWork(id) });

export { worldFields, auctionFields, endingFields };

export const SAVE_VERSION = 11;

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
  return { craft: null, made: 0, craftLv: { smith: { lv: 1, xp: 0 }, sew: { lv: 1, xp: 0 }, jewel: { lv: 1, xp: 0 } }, evolve: {}, evolveSeen: {}, work: null, workAsk: 3, store: {}, storeDebt: 0 };
}

/** M4에서 생긴 사람·명성·칭호·퀘스트 칸. */
export function townFields() {
  return {
    people: {}, fame: {}, titles: [], title: null, lean: 0,
    jobs: [], jobsDone: 0, board: { day: 0, gone: [] },
    quests: {}, hq: {}, main: { chapter: 1, done: [], called: null, soldRare: false }, opened: [],
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

const STEPS = {
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
  // 잡화점은 예술협회로 옮겨 갔다 (Z82)
  if (state.place === 'store') state.place = 'artguild';
  // 제작 레벨 (Z79): 없던 저장은 지금까지 만든 수로 처음 레벨을 정한다. 철검을 만들던 사람이 못 만들게 되지 않게 대장은 하나라도 만들었으면 3부터
  if (!state.craftLv) {
    const lvOf = (xp) => { let lv = 1; while (xp >= lv * 10) { xp -= lv * 10; lv += 1; } return { lv, xp }; };
    const made = state.made || 0, sewn = state.counters?.sewn || 0;
    const smith = lvOf(made * 2), sew = lvOf(sewn * 2);
    state.craftLv = { smith: made > 0 && smith.lv < 3 ? { lv: 3, xp: 0 } : smith, sew: sewn > 0 && sew.lv < 2 ? { lv: 2, xp: 0 } : sew, jewel: { lv: 1, xp: 0 } };
  }
  // 끝낸 장이 여는 길: 그 장을 끝낸 뒤에 길이 생긴 경우(2장 → 나루)가 있다
  if (state.main && Array.isArray(state.main.done) && Array.isArray(state.opened)) {
    for (const d of state.main.done) for (const id of (MAIN[d && d.chapter]?.opens || [])) if (!state.opened.includes(id)) state.opened.push(id);
  }
  if (state.counters && !Number.isFinite(state.counters.tiredWork)) state.counters.tiredWork = 0;
  if (!['hold', 'clash', 'dodge', 'focus'].includes(state.stance)) state.stance = 'hold';
  if (state.guild === undefined) state.guild = null;
  if (!state.lore || !Array.isArray(state.lore.hints)) state.lore = { hints: [] };
  if (!state.tough) state.tough = { str: 0, agi: 0, con: 0, wis: 0 };
  if (!state.toughGained) state.toughGained = { str: 0, agi: 0, con: 0, wis: 0 };
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
