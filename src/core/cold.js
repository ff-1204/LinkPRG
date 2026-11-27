// 추위 (WM-B): 흰마루에서만 도는 체온 눈금. 흰마루 밖에서는 칸도 이름표도 없다 (WM-F2).
// 들판(눈밭, 언 호수, 종루 안)에서 한 번 움직일 때마다 식고, 마을 안에서는 한 번 움직일 때마다 풀린다.

import { placeById } from '../data/places.js?v=3cfb5a9';
import { DUNGEONS } from '../data/dungeon.js?v=3cfb5a9';
import { itemDef } from '../data/items.js?v=3cfb5a9';
import { restBuff } from './buffs.js?v=3cfb5a9';
import { pushLine } from './log.js?v=3cfb5a9';

export const WARM_MAX = 100;
export const COOL_AT = 60; // 여기까지 내려오면 식은 몸 (시안의 따라가 보기: 40번 움직여 60이면 식은 몸이 된다)
export const FROZEN_AT = 30; // 여기까지 내려오면 언 몸
/** WM-B3의 숫자. day/night: 들판에서 한 번 움직일 때 식는 양. town: 마을에서 한 번 움직일 때 풀리는 양. */
export const COLD = { day: 1, night: 2, town: 5, torch: 0.5, torchMoves: 60, fur: 0.10, furHide: 'whitefur', tire: [1, 1.5, 2], attack: 0.10 };
export const COLD_STAGES = [null, { id: 'cool', name: '식은 몸', text: '피로가 1.5배로 쌓인다' }, { id: 'frozen', name: '언 몸', text: '피로가 2배로 쌓이고 공격력이 10% 줄어든다' }];
export const COLD_LINES = {
  cool: '손가락이 굽지 않는다. 몸이 식었다.',
  frozen: '입술이 움직이지 않는다. 몸이 얼었다.',
  thaw: '손끝에 피가 돈다. 몸이 풀렸다.',
  torchOn: '횃불을 켰다. 손끝이 풀린다.',
  torchOut: '횃불이 다 탔다.',
  fall: '추위를 이기지 못했다.',
};

/** 흰마루에 있는가 (언못의 방들, 눈밭, 언 호수, 얼음 종루). */
export const inWhite = (state) => placeById(state.place).band === 3;
/** 몸이 식는 들판인가: 눈밭, 언 호수, 종루 안. */
export const inField = (state) => inWhite(state) && (!!placeById(state.place).cold || !!(state.dungeon && DUNGEONS[state.dungeon.id]?.cold));
const warmOf = (state) => (Number.isFinite(state.warm) ? state.warm : WARM_MAX);

/** 찬 털옷의 수: 흰털 가죽 장비(장갑, 장화) 하나마다 식는 속도 −10%. 부서진 것은 세지 않는다. */
export function furCount(state) {
  return Object.values(state.equip || {}).filter((it) => it && itemDef(it.id).hideOf === COLD.furHide && !(it.dur != null && it.dur <= 0)).length;
}
/** 지금 들판에서 한 번 움직일 때 식는 양. 화롯불 곁이 붙은 동안은 식지 않는다 (WM-C1). */
export function coolPerMove(state) {
  if (restBuff(state)?.nocold) return 0;
  return (state.phase === 2 ? COLD.night : COLD.day) * ((state.torch || 0) > 0 ? COLD.torch : 1) * Math.max(0, 1 - furCount(state) * COLD.fur);
}
/** 0 멀쩡함, 1 식은 몸, 2 언 몸. 흰마루 밖에서는 늘 0. */
export function coldStage(state) {
  if (!inWhite(state)) return 0;
  const w = warmOf(state);
  return w <= FROZEN_AT ? 2 : w <= COOL_AT ? 1 : 0;
}
/** 피로가 쌓이는 배율: 식은 몸 1.5배, 언 몸 2배. */
export const coldTire = (state) => COLD.tire[coldStage(state)];
/** 언 몸이면 공격력이 깎이는 몫. */
export const coldAttackCut = (state) => (coldStage(state) === 2 ? COLD.attack : 0);

/** 화면이 그릴 것. 흰마루 밖에서는 null (칸이 생기지 않는다). */
export function coldView(state) {
  if (!inWhite(state)) return null;
  const stage = coldStage(state);
  return { warm: Math.round(warmOf(state)), max: WARM_MAX, stage, tag: COLD_STAGES[stage], torch: state.torch || 0, field: inField(state) };
}

/** 한 번 움직였다. 들판이면 식고, 마을 안이면 풀린다. 못 위(얼음 낚시터)는 식지도 풀리지도 않는다. */
export function coldMove(state, events) {
  if ((state.torch || 0) > 0) {
    state.torch -= 1;
    if (state.torch <= 0) { state.torch = 0; pushLine(state, events, { k: 'sys', text: COLD_LINES.torchOut, tone: 'warn' }); }
  }
  if (!inWhite(state)) { state.warm = WARM_MAX; return; }
  const before = warmOf(state);
  const was = coldStage(state);
  const here = placeById(state.place);
  let now = before;
  if (inField(state)) now = Math.max(0, Math.round((before - coolPerMove(state)) * 100) / 100);
  else if (!here.open) now = Math.min(WARM_MAX, before + COLD.town);
  state.warm = now;
  const is = coldStage(state);
  if (is > was) pushLine(state, events, { k: 'sys', text: is === 2 ? COLD_LINES.frozen : COLD_LINES.cool, tone: 'frost' });
  else if (is < was && is === 0) pushLine(state, events, { k: 'sys', text: COLD_LINES.thaw, tone: 'good' });
  if (is !== was) events.push({ type: 'cold', stage: is });
}

/** 횃불을 켠다 (WM-B3): 가방의 횃불 하나를 쓴다. 60번 움직이는 동안 식는 속도가 절반. */
export function lightTorch(state, events, takeById, countOf) {
  if (!inField(state) && !placeById(state.place).cold) throw new Error('횃불은 흰마루의 들판에서 켭니다');
  if ((state.torch || 0) > 0) throw new Error('횃불이 이미 켜져 있습니다');
  if (countOf(state, 'torch') < 1) throw new Error('횃불이 없습니다');
  takeById(state, 'torch', 1);
  state.torch = COLD.torchMoves;
  pushLine(state, events, { k: 'me', text: COLD_LINES.torchOn });
  events.push({ type: 'bag' });
}

/** 뜨거운 음식 (WM-B3): 체온이 오른다. 흰마루 밖에서는 아무 일도 없다. @returns 오른 양 */
export function warmUp(state, n) {
  if (!inWhite(state)) return 0;
  const before = warmOf(state);
  state.warm = Math.min(WARM_MAX, before + n);
  return Math.round(state.warm - before);
}
/** 화롯방 주막에서 자면 가득 찬다. */
export function warmFull(state) { state.warm = WARM_MAX; }
export const coldFields = () => ({ warm: WARM_MAX, torch: 0 });
