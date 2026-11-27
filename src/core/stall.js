// 가게 (SB-D, LV-K1, LV-K6): 저울 마당의 좌판. 내가 만든 물건을 올려 두면, 내가 일하는 동안 손님이 와서 제값에 사 간다.
// 쉬거나 자는 동안에는 오지 않는다. 띠링은 울리지 않는다. 사기 전에는 어디에도 나오지 않는다 (SB-I3).

import { placeById } from '../data/places.js?v=a3f4e98';
import { itemDef, gradeName } from '../data/items.js?v=a3f4e98';
import { pushLine, ding } from './log.js?v=a3f4e98';
import { worth } from './trade.js?v=a3f4e98';
import { gearName } from './gear.js?v=a3f4e98';
import { fameRank } from './social.js?v=a3f4e98';
import { eulReul } from './ko.js?v=a3f4e98';

/** price: 좌판 값 (LV-L6). slots: 진열 칸. every/best: 손님 하나에 드는 내 일의 수(처음 → 단골이 늘면). per: 일 한 번을 줄이는 데 드는 단골 수. */
export const STALL = { price: 3800, slots: 6, every: 20, best: 8, per: 25, town: '저울목', place: 'scaleyard', owner: 'stallowner' };
export const STALL_EMPTY = '좌판이 비어 있다. 내가 만든 물건을 올려 두면, 내가 일하는 동안 손님이 와서 사 간다. 쉬거나 자는 동안에는 오지 않는다.';

export const stallFields = () => ({ regulars: 0, work: 0, items: [], sold: [], today: [] });
/** 내가 만든 것이거나, 내 공방의 견습이 지은 것 (AN-C1). */
const mine = (state, item) => item.maker === state.name || item.maker === `${state.name}의 공방`;
const atStall = (state) => state.place === STALL.place && !state.dungeon;

/** 손님 하나에 드는 내 일의 수: 스무 번에서 시작해, 판 수(단골)가 늘수록 여덟 번까지 준다. 저울목에서 이름이 날수록 한 번씩 더 준다. */
export function stallEvery(state) {
  const st = state.stall;
  if (!st) return STALL.every;
  return Math.max(STALL.best, STALL.every - Math.floor((st.regulars || 0) / STALL.per) - fameRank(state, STALL.town));
}
/** 좌판에 붙는 값: 제값(가게가 파는 값). 내가 정하지 않는다 (SB-D1). 날마다 바뀌는 시세도 타지 않는다. */
export const stallPrice = (item) => worth(item);
const label = (item) => `${item.grade ? `${gradeName(item.grade)} ` : ''}${gearName(item)}`;

/** 좌판을 살 수 있게 됐는가: 좌판 임자에게 말을 걸어 값을 들은 뒤다 (SB-I3). */
export const stallOffered = (state) => !state.stall && !!state.people?.[STALL.owner]?.met;

export function buyStall(state, events) {
  if (state.stall) throw new Error('이미 좌판이 있습니다');
  if (!atStall(state)) throw new Error('좌판은 저울 마당에 있습니다');
  if (!stallOffered(state)) throw new Error('좌판 임자에게 먼저 물어봐야 합니다');
  if (state.silver < STALL.price) throw new Error(`은화가 모자랍니다 (${state.silver} / ${STALL.price})`);
  state.silver -= STALL.price;
  state.stall = stallFields();
  pushLine(state, events, { k: 'npc', who: '좌판 임자', text: '은화는 맞소. 오늘부터 이 좌판은 당신 것이오. 값은 내가 판에 적힌 대로 붙여 두리다.' });
  ding(state, events, { level: 2, kind: 'stall', title: '가게가 생겼습니다', big: '내 가게', body: '저울 마당의 좌판입니다. 내가 만든 물건을 올려 두면 내가 일하는 동안 손님이 사 갑니다.' });
  events.push({ type: 'trade' });
}

/** 가방의 물건을 진열대에 올린다. 내가 만든 것만 (SB-D4). 묶음은 묶음째 한 칸에 올라간다. */
export function putOnStall(state, events, index) {
  const st = state.stall;
  if (!st) throw new Error('가게가 없습니다');
  if (!atStall(state)) throw new Error('진열대는 저울 마당의 내 좌판에 있습니다');
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (!mine(state, item)) throw new Error('내가 만든 물건만 올릴 수 있습니다');
  if (itemDef(item.id).kind === 'quest' || itemDef(item.id).nosell) throw new Error('팔 수 없는 물건입니다');
  if (st.items.length >= STALL.slots) throw new Error(`진열대가 가득 찼습니다 (${STALL.slots}칸)`);
  state.bag.splice(index, 1);
  st.items.push(item);
  pushLine(state, events, { k: 'me', text: `${eulReul(label(item))}${item.n > 1 ? ` ${item.n}개` : ''} 좌판에 올렸다. 값은 ${stallPrice(item)}${item.n > 1 ? '씩' : ''}.` });
  events.push({ type: 'trade' });
}

/** 진열대의 물건을 도로 가방에 넣는다. */
export function takeFromStall(state, events, i) {
  const st = state.stall;
  if (!st) throw new Error('가게가 없습니다');
  if (!atStall(state)) throw new Error('진열대는 저울 마당의 내 좌판에 있습니다');
  const item = st.items[i];
  if (!item) throw new Error('진열대에 없는 물건입니다');
  st.items.splice(i, 1);
  state.bag.push(item);
  pushLine(state, events, { k: 'me', text: `${eulReul(label(item))} 좌판에서 내렸다.` });
  events.push({ type: 'trade' });
}

/** 손님이 먼저 집는 것: 등급이 높은 것부터, 같으면 비싼 것부터 (SB-D5). */
function pickFor(st) {
  let best = -1;
  st.items.forEach((it, i) => {
    if (best < 0) { best = i; return; }
    const b = st.items[best];
    if ((it.grade || 0) > (b.grade || 0) || ((it.grade || 0) === (b.grade || 0) && stallPrice(it) > stallPrice(b))) best = i;
  });
  return best;
}

/**
 * 내가 "일"을 한 번 했다 (SB-D6). 진열대에 물건이 있을 때만 센다. 찰 때마다 손님이 하나 와서 하나를 사 간다.
 * 어디에 있든 대화방에 한 줄이 뜬다. 띠링은 울리지 않는다 (SB-D3).
 */
export function stallWork(state, events) {
  const st = state.stall;
  if (!st || !st.items.length) return;
  st.work = (st.work || 0) + 1;
  if (st.work < stallEvery(state)) return;
  st.work = 0;
  const i = pickFor(st);
  const item = st.items[i];
  const price = stallPrice(item);
  const one = { ...item, n: 1 };
  if (item.n > 1) item.n -= 1; else st.items.splice(i, 1);
  state.silver += price;
  st.regulars = (st.regulars || 0) + 1;
  st.today.push({ name: label(one), silver: price });
  state.counters.stallSold = (state.counters.stallSold || 0) + 1;
  state.counters.fairSold = (state.counters.fairSold || 0) + 1; // 장터에서 값을 깎지 않고 판 수 (LV-E4)
  pushLine(state, events, { k: 'sys', who: '가게', text: `손님이 ${eulReul(label(one))} 사 갔다. 은화 +${price}.`, tone: 'mint' });
  events.push({ type: 'trade' });
}

/** 날이 바뀌었다: 오늘 팔린 것이 "어제 팔린 것"이 된다. */
export function stallDay(state) {
  const st = state.stall;
  if (!st) return;
  st.sold = st.today || [];
  st.today = [];
}

/** "내 가게" 창이 그릴 것 (SB-D1, SB-D2). 가게가 없으면 null. */
export function stallView(state) {
  const st = state.stall;
  if (!st) return null;
  const every = stallEvery(state);
  return {
    regulars: st.regulars || 0, every, left: st.items.length ? Math.max(1, every - (st.work || 0)) : null,
    slots: STALL.slots, here: atStall(state), empty: STALL_EMPTY,
    items: st.items.map((item, i) => ({ i, name: label(item), n: item.n, each: stallPrice(item) })),
    sold: (st.sold || []).map((x) => ({ ...x })), today: (st.today || []).map((x) => ({ ...x })),
    mine: state.bag.map((item, index) => ({ index, item, name: label(item), n: item.n, each: stallPrice(item) })).filter((x) => mine(state, x.item) && itemDef(x.item.id).kind !== 'quest' && !itemDef(x.item.id).nosell),
  };
}
