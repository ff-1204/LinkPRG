// 열기 (AG-B): 잿골에서만 도는 규칙. 몸이 아니라 쇠가 버티지 못한다. 잿골 밖에서는 칸도 이름표도 없다 (AG-F2).
// 들판(재 비탈, 쇳물 내, 가마 안)에서 쇠 장비는 두 배로 닳고, 도마뱀 비늘 장비는 절반만 닳고, 잿쇠 장비는 보통으로 닳는다.
// 들판의 싸움을 이기면 든 무기가 달아, 식기 전에 큰 대장간에서 강화하면 잘 먹는다.

import { placeById } from '../data/places.js?v=f30e95b';
import { DUNGEONS } from '../data/dungeon.js?v=f30e95b';
import { itemDef } from '../data/items.js?v=f30e95b';
import { pushLine } from './log.js?v=f30e95b';
import { usable, countOf, takeById } from './inventory.js?v=f30e95b';
import { iGa, eulReul } from './ko.js?v=f30e95b';

/** AG-B3의 숫자. iron: 쇠 장비가 닳는 배수. scale: 비늘 장비가 닳는 배수. soft: 무른 쇠가 되는 몫. whet: 숫돌 하나가 되살리는 내구도. hotMoves: 달궈진 쇠가 가는 걸음. plus: 강화 확률에 더하는 몫. repair: 고치는 값에 곱하는 몫. */
export const HEAT = { iron: 2, scale: 0.5, soft: 0.2, whet: 20, hotMoves: 30, plus: 0.10, repair: 0.5, band: 5, scaleHide: 'lizardscale', forge: 'bigforge', stone: 'whetstone' };
export const SOFT_NAME = '무른 쇠';
export const HOT_NAME = '달궈진 쇠';
export const HEAT_LINES = {
  first: ['소금이 끝나자 재가 시작됐다. 산이 낮게 으르렁거리고, 골짜기 아래에서 쇠 치는 소리와 함성이 번갈아 올라온다. 함성이 터질 때마다 무언가 길게 운다. 종소리와 닮았는데, 날이 서 있다.', '손에 쥔 쇠가 따뜻하다. 들판에 나가면 쇠 장비가 빨리 닳는다.'],
  cooled: '달았던 쇠가 식었다.',
};

/** 1·2단계의 쇠 장비. 3단계부터는 가죽으로 지은 것(hideOf)이 아니면 쇠다. 나무·가죽·천으로 된 것은 쇠가 아니다. */
const IRON_BASE = ['coppersword', 'ironsword', 'ironhelm', 'thinknife', 'copperring', 'fangring', 'ironring', 'steelsword', 'steelknife', 'steelwand', 'steelshield', 'steelhelm', 'steelarmor', 'steelring'];

/** 열기 앞에서 이 장비가 무엇인가: iron 쇠(두 배) · ash 잿쇠(보통) · scale 도마뱀 비늘(절반) · other 그 밖(보통). */
export function heatKind(item) {
  const def = item && itemDef(item.id);
  if (!def || def.kind !== 'gear' || def.tool) return 'other';
  if (def.hideOf) return def.hideOf === HEAT.scaleHide ? 'scale' : 'other';
  if ((def.tier || 1) >= 3) return def.tier === HEAT.band ? 'ash' : 'iron';
  return IRON_BASE.includes(item.id) ? 'iron' : 'other';
}
/** 쇠로 지은 것인가(잿쇠도 쇠다). 장비 칸과 숫돌이 이것을 본다. */
export const isMetal = (item) => ['iron', 'ash'].includes(heatKind(item));
const maxOf = (item) => Math.max(item.max ?? itemDef(item.id).dur ?? 0, item.dur ?? 0);
const ratioOf = (item) => { const max = maxOf(item); return max > 0 ? item.dur / max : 1; };

export const ashFields = () => ({ ash: { hot: 0, hotNo: 0, half: {}, pumps: 0, duel: { day: 0, wins: 0, lost: false, pumps: 0, told: 0, seenDay: 0, seen: [] }, ember: 0 } });
/** 잿골의 칸. 없던 저장에서도 그 자리에서 생긴다. */
export function ashOf(state) {
  if (!state.ash || typeof state.ash !== 'object') state.ash = ashFields().ash;
  return state.ash;
}

/** 잿골에 있는가 (가마골의 방들, 재 비탈, 쇳물 내, 식지 않는 가마). */
export const inAsh = (state) => placeById(state.place).band === HEAT.band;
/** 열기가 듣는 들판인가: 재 비탈, 쇳물 내, 가마 안. */
export const inHotField = (state) => inAsh(state) && (state.dungeon ? !!DUNGEONS[state.dungeon.id]?.hot : !!placeById(state.place).hot);

/**
 * 장비가 한 번 닳는다(무기는 칠 때, 갑옷은 맞을 때). 들판 밖에서는 지금처럼 1이다.
 * @returns 이번에 못 쓰게 되었으면 true
 */
export function wear(state, events, item, slot) {
  if (!usable(item) || item.dur == null) return false;
  const kind = inHotField(state) ? heatKind(item) : 'other';
  let n = 1;
  if (kind === 'iron') n = HEAT.iron;
  else if (kind === 'scale') {
    const a = ashOf(state);
    a.half[slot] = (a.half[slot] || 0) + HEAT.scale;
    n = Math.floor(a.half[slot]);
    a.half[slot] -= n;
  }
  if (n < 1) return false;
  const max = maxOf(item), before = item.dur;
  item.dur = Math.max(0, before - n);
  // 무른 쇠 (AG-B2): 20% 아래로 내려서는 그때 한 줄
  if (kind === 'iron' && max > 0 && before / max >= HEAT.soft && item.dur / max < HEAT.soft && item.dur > 0) {
    pushLine(state, events, { k: 'sys', text: `${itemDef(item.id).name}의 내구도가 ${Math.round((item.dur / max) * 100)}%다. 열기에 쇠가 무르다.`, tone: 'frost' });
    events.push({ type: 'heat', soft: true });
  }
  return item.dur === 0 && before > 0;
}

/** 찬 쇠 장비들 [칸, 물건]. */
const wornMetal = (state) => Object.entries(state.equip || {}).filter(([, it]) => it && it.dur != null && isMetal(it));
/** 지금 달아 있는 무기인가. */
export const isHot = (state, item) => !!item && (state.ash?.hot || 0) > 0 && item.hot === state.ash.hotNo;
/** 달궈진 쇠가 듣는 자리인가: 달아 있는 그 무기를, 큰 대장간에서 (AG-B3). */
export const hotAtForge = (state, item) => state.place === HEAT.forge && isHot(state, item);

/** 화면이 그릴 것. 잿골 밖에서는 null (칸이 생기지 않는다). */
export function heatView(state) {
  if (!inAsh(state)) return null;
  const worn = wornMetal(state).map(([, it]) => it);
  const worst = worn.length ? worn.reduce((a, b) => (ratioOf(b) < ratioOf(a) ? b : a)) : null;
  const softs = worn.filter((it) => heatKind(it) === 'iron' && ratioOf(it) < HEAT.soft);
  const soft = softs.length ? softs.reduce((a, b) => (ratioOf(b) < ratioOf(a) ? b : a)) : null;
  const left = state.ash?.hot || 0;
  return {
    pct: worst ? Math.round(ratioOf(worst) * 100) : null, name: worst ? itemDef(worst.id).name : '',
    soft: !!soft, tag: soft ? { id: 'soft', name: SOFT_NAME, text: `${iGa(itemDef(soft.id).name)} ${soft.dur > 0 ? '곧 부러진다' : '부서졌다'}` } : null,
    hot: left > 0 ? { id: 'hot', name: HOT_NAME, text: `강화 +${Math.round(HEAT.plus * 100)}%p (${left}번 남음)`, left } : null,
    field: inHotField(state),
  };
}

function cool(state) {
  const a = ashOf(state);
  a.hot = 0;
  for (const it of [...(state.bag || []), ...Object.values(state.equip || {})]) if (it && it.hot != null) delete it.hot;
}

/** 한 번 움직였다. 달궈진 쇠는 서른 번 움직이는 동안만 달아 있다. 잿골을 벗어나면 바로 식는다. */
export function heatMove(state, events) {
  const a = state.ash;
  if (!a || !(a.hot > 0)) return;
  if (!inAsh(state)) { cool(state); return; }
  a.hot -= 1;
  if (a.hot <= 0) { cool(state); pushLine(state, events, { k: 'sys', text: HEAT_LINES.cooled }); events.push({ type: 'heat' }); }
}

/** 들판의 싸움을 이겼다 (AG-B3): 든 무기가 단다. 처음 달았을 때 대화방 한 줄로 알린다 (AG-F3). */
export function heatWin(state, events) {
  if (!inHotField(state)) return;
  const w = state.equip?.weapon;
  if (!usable(w)) return;
  const a = ashOf(state);
  const was = isHot(state, w);
  if (!was) { cool(state); a.hotNo = (a.hotNo || 0) + 1; w.hot = a.hotNo; }
  a.hot = HEAT.hotMoves;
  state.flags.sawHot = true;
  if (!was) pushLine(state, events, { k: 'sys', text: `${iGa(itemDef(w.id).name)} 벌겋게 달았다. 식기 전에 모루에 올리면 잘 먹는다.`, tone: 'mint' });
  events.push({ type: 'heat', hot: true });
}

/** 숫돌이 갈 것: 찬 쇠 장비 가운데 가장 많이 닳은 것. 부서진 것은 대장간에서 고쳐야 한다. */
export function whetTarget(state) {
  const list = wornMetal(state).map(([, it]) => it).filter((it) => it.dur > 0 && it.dur < maxOf(it));
  return list.length ? list.reduce((a, b) => (ratioOf(b) < ratioOf(a) ? b : a)) : null;
}

/** 숫돌을 쓴다 (AG-B3): 쇠 장비 하나의 내구도 +20. 한 번 쓰면 없어진다. 잿골 밖에서도 가방에서 쓸 수는 있다 (AG-F2). */
export function useWhetstone(state, events) {
  if (countOf(state, HEAT.stone) < 1) throw new Error('숫돌이 없습니다');
  const it = whetTarget(state);
  if (!it) throw new Error('숫돌로 갈 쇠 장비가 없습니다');
  takeById(state, HEAT.stone, 1);
  const max = maxOf(it), before = it.dur;
  it.dur = Math.min(max, before + HEAT.whet);
  pushLine(state, events, { k: 'me', text: `숫돌로 ${eulReul(itemDef(it.id).name)} 갈았다. 내구도 +${it.dur - before} (${it.dur} / ${max}).` });
  events.push({ type: 'gear' }); events.push({ type: 'bag' });
}
