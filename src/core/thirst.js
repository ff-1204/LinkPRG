// 갈증 (SB-B): 소금벌에서만 도는 물 눈금. 소금벌 밖에서는 칸도 이름표도 없다 (SB-I2).
// 들판(소금 바닥, 마른 뱃길)에서 열 번 움직일 때마다 한 모금이 준다. 0 모금이면 움직일 때마다 생명력이 깎인다.

import { placeById } from '../data/places.js?v=d853788';
import { WILDS } from '../data/wild.js?v=d853788';
import { pushLine } from './log.js?v=d853788';
import { addItem, takeById, countOf } from './inventory.js?v=d853788';
import { valueOf } from './derived.js?v=d853788';
import { roll01 } from './rng.js?v=d853788';

export const WATER_MAX = 10;
/** SB-B3의 숫자. per: 한 모금이 주는 걸음 수. dry: 마른 목일 때 한 번에 깎이는 몫. pouch: 물 주머니 하나의 모금. fee: 우물 값. */
export const THIRST = { per: 10, dry: 0.02, pouch: 5, fee: 5, salty: 1, wellChance: 0.05, wellBy: 40 };
export const DRY_TAG = { id: 'dry', name: '마른 목', text: '움직일 때마다 생명력이 깎인다' };
export const THIRST_LINES = {
  out: '물이 떨어졌다. 혀가 입천장에 붙는다.',
  sip: '물 한 모금을 마셨다.',
  well: '두레박을 올려 물을 가득 채웠다.',
  oldWell: '옛 우물에서 물을 길어 가득 채웠다.',
  fall: '목마름을 이기지 못했다.',
};

/** 소금벌에 있는가 (저울목의 방들, 소금 바닥, 마른 뱃길, 종 조각 창고). */
export const inSalt = (state) => placeById(state.place).band === 4;
/** 목이 마르는 들판인가: 소금 바닥, 마른 뱃길. 던전(창고 안)은 들판이 아니다. */
export const inDryField = (state) => inSalt(state) && !!placeById(state.place).dry && !state.dungeon;
const waterOf = (state) => (Number.isFinite(state.water) ? state.water : WATER_MAX);
export const isDry = (state) => inSalt(state) && waterOf(state) <= 0;
/** 이곳의 옛 우물을 찾았는가. */
export const wellFound = (state, place = state.place) => (state.wells || []).includes(place);

/** 화면이 그릴 것. 소금벌 밖에서는 null (칸이 생기지 않는다). */
export function thirstView(state) {
  if (!inSalt(state)) return null;
  const water = waterOf(state);
  return { water, max: WATER_MAX, dry: water <= 0, tag: water <= 0 ? DRY_TAG : null, field: inDryField(state) };
}

/** 한 번 움직였다. 들판이면 걸음을 세어 열 번마다 한 모금이 준다. 0 모금이면 생명력이 깎인다. */
export function thirstMove(state, events) {
  if (!inSalt(state)) { state.water = WATER_MAX; state.dryStep = 0; return; }
  if (!inDryField(state)) return;
  const before = waterOf(state);
  if (before <= 0) {
    const cut = Math.max(1, Math.round(valueOf(state, 'maxHp') * THIRST.dry));
    const hpBefore = state.hp;
    // 싸우는 중에는 목마름만으로 숨이 끊어지지 않는다. 싸움 밖에서 0이 되면 쓰러진다
    state.hp = Math.max(state.battle ? 1 : 0, state.hp - cut);
    if (hpBefore > state.hp) pushLine(state, events, { k: 'sys', text: `목이 탄다. 생명력 −${hpBefore - state.hp}.`, tone: 'warn' });
    if (state.hp <= 0) state.flags.parched = true;
    return;
  }
  state.dryStep = (state.dryStep || 0) + 1;
  if (state.dryStep < THIRST.per) return;
  state.dryStep = 0;
  state.water = before - 1;
  if (state.water <= 0) { pushLine(state, events, { k: 'sys', text: THIRST_LINES.out, tone: 'frost' }); events.push({ type: 'thirst', dry: true }); }
}

/** 물이 준다(짠 음식, 나눠 준 한 모금). 소금벌 밖에서는 아무 일도 없다. @returns 준 양 */
export function loseWater(state, events, n) {
  if (!inSalt(state)) return 0;
  const before = waterOf(state);
  state.water = Math.max(0, before - n);
  if (before > 0 && state.water <= 0) { pushLine(state, events, { k: 'sys', text: THIRST_LINES.out, tone: 'frost' }); events.push({ type: 'thirst', dry: true }); }
  return before - state.water;
}

/** 빈 물 주머니를 모두 채운다. @returns 채운 수 */
function refillPouches(state) {
  const n = countOf(state, 'emptypouch');
  if (n > 0) { takeById(state, 'emptypouch', n); addItem(state, 'waterpouch', n); }
  return n;
}
function fillUp(state, events, line) {
  state.water = WATER_MAX; state.dryStep = 0;
  const n = refillPouches(state);
  pushLine(state, events, { k: 'me', text: `${line}${n ? ` 빈 물 주머니 ${n}개도 채웠다.` : ''}` });
  events.push({ type: 'bag' });
}

/** 우물가 주막의 우물 (SB-B3): 은화 5에 가득. 물 주머니도 채운다. */
export function useWell(state, events) {
  if (!placeById(state.place).actions.includes('well')) throw new Error('여기에는 우물이 없습니다');
  if (waterOf(state) >= WATER_MAX && countOf(state, 'emptypouch') < 1) throw new Error('물은 가득하고 빈 주머니도 없습니다');
  if (state.silver < THIRST.fee) throw new Error(`물값 은화 ${THIRST.fee}이 모자랍니다`);
  state.silver -= THIRST.fee;
  fillUp(state, events, `은화 ${THIRST.fee}을 돈 통에 넣었다. ${THIRST_LINES.well}`);
}

/** 들판의 "물 마시기": 옛 우물을 찾은 곳이면 값없이 가득 채우고, 아니면 물 주머니 하나로 다섯 모금을 채운다. */
export function drink(state, events) {
  if (!inDryField(state)) throw new Error('물은 소금벌의 들판에서 마십니다');
  if (wellFound(state)) {
    if (waterOf(state) >= WATER_MAX && countOf(state, 'emptypouch') < 1) throw new Error('물은 가득하고 빈 주머니도 없습니다');
    return fillUp(state, events, THIRST_LINES.oldWell);
  }
  if (waterOf(state) >= WATER_MAX) throw new Error('목이 마르지 않습니다');
  if (countOf(state, 'waterpouch') < 1) throw new Error('물 주머니가 없습니다');
  takeById(state, 'waterpouch', 1);
  addItem(state, 'emptypouch', 1);
  state.water = Math.min(WATER_MAX, waterOf(state) + THIRST.pouch);
  pushLine(state, events, { k: 'me', text: THIRST_LINES.sip });
  events.push({ type: 'bag' });
}

/**
 * 탐색하다 옛 우물을 찾는다 (SB-B2, SB-I5). 사냥터마다 하나. 탐색 한 번에 5%, 마흔 번째에는 반드시.
 * @returns 찾았으면 true
 */
export function seekWell(state, events) {
  const place = state.place;
  const w = WILDS[place]?.well;
  if (!w || wellFound(state, place)) return false;
  if (!state.wellTries) state.wellTries = {};
  const n = (state.wellTries[place] = (state.wellTries[place] || 0) + 1);
  if (n < THIRST.wellBy && roll01(`${state.seed}|well|${place}|${n}`) >= THIRST.wellChance) return false;
  state.wells = [...(state.wells || []), place];
  delete state.wellTries[place];
  pushLine(state, events, { k: 'sys', who: '발견', text: w.say, tone: 'mint' });
  events.push({ type: 'well', place });
  return true;
}

export const thirstFields = () => ({ water: WATER_MAX, dryStep: 0, wells: [], wellTries: {}, stall: null });
