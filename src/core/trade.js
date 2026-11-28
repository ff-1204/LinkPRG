// 상점과 보관함 (E24, E25, E28, H1-5, H1-6, R2-4).
// 돈은 은화 한 가지. 팔 때는 값의 40%. 등급이 높으면 값도 높다.

import { INTEREST_WORK } from '../data/bands.js?v=d853788';
import { pushLine } from './log.js?v=d853788';
import { itemDef, GRADE_MULT, gradeName } from '../data/items.js?v=d853788';
import { addItem, removeAt, itemWeight } from './inventory.js?v=d853788';
import { SHOPS, DAILY_SWING, MARKET_SWING, MARKET_FLAT, MARKET_GOODS, MARKET_GOODS_AT } from '../data/shops.js?v=d853788';
import { seedFrom } from './rng.js?v=d853788';
import { discountOf as socialDiscount } from './social.js?v=d853788';
import { placeById } from '../data/places.js?v=d853788';
import { guildPerk } from './guild.js?v=d853788';
import { gearName } from './gear.js?v=d853788';
import { eulReul, iGa } from './ko.js?v=d853788';
import { hasTitle } from './titles.js?v=d853788';

export const SELL_RATE = 0.4;
export const APPRAISE_SELL = 0.01;
export const STORE_CAP = 200;
export const STORE_FEE = 2;
export const STORE_RATE = 0.01; // 맡긴 은화의 하루 이자 (Z42)

/** 물건 하나의 값(등급 반영). */
export function worth(item) {
  const def = itemDef(item.id);
  // 적힌 값은 그 물건의 바탕 등급일 때의 값이다. 그보다 높으면 그만큼 비싸다.
  const mult = (GRADE_MULT[item.grade || 0] || 1) / (GRADE_MULT[def.grade || 0] || 1);
  // 강화 하나에 값 +5%, 옵션 하나에 +10%. 강화에 든 것보다는 늘 적게 오른다(강화해 팔아 남기는 길이 없게)
  const extra = 1 + (item.plus || 0) * 0.05 + (item.opt || []).length * 0.1;
  return Math.max(1, Math.round((def.price || 1) * mult * extra));
}

/**
 * 살 때의 값. 깎이는 까닭(명성·친밀도)이 생기면 now가 base보다 작아지고, 화면은 base에 줄을 긋는다 (E25).
 * @returns {{base:number, now:number, why:string}}
 */
export function buyPrice(state, id) {
  // 레벨 따라 값이 오르는 것 (Z77 성수: 레벨 × 6, Z102 깊은 성수 × 9·별빛 성수 × 12). 신전 축복(레벨 × 5)보다 늘 조금 비싸게, 깎아 주지 않는다
  const per = itemDef(id).perLevel;
  if (per) { const v = Math.max(per, (state.level || 1) * per); return { base: v, now: v, why: '' }; }
  let base = worth({ id, grade: itemDef(id).grade || 0 });
  const shop = SHOPS[state.place];
  if (shop?.market) base = Math.max(1, Math.round(base * marketRate(state, id)));
  else if (shop?.daily) base = Math.max(1, Math.round(base * (DAILY_SWING[0] + (seedFrom(`${state.seed}|price|${state.day}|${id}`) / 4294967296) * DAILY_SWING[1])));
  const cut = discountOf(state);
  const rate = cut.rate + guildPerk(state, 'social') + (state.flags.cheapBuy ? 0.05 : 0); // 등불 모임, 가게 집 막내
  return { base, now: rate > 0 && base >= 5 ? Math.max(1, Math.floor(base * (1 - rate))) : base, why: [cut.why, guildPerk(state, 'social') > 0 ? '길드의 덕' : ''].filter(Boolean).join(', ') };
}

/** 값이 깎이는 까닭: 가게 사람과의 사이, 마을의 명성, 단 칭호, 일하는 직업 (E25). */
export function discountOf(state) {
  return socialDiscount(state, SHOPS[state.place]?.keeperId || null);
}

export function sellPrice(item, state = null) {
  if (itemDef(item.id).kind === 'quest' || itemDef(item.id).nosell) return 0; // 거저 받은 것은 팔 수 없다
  // '이름을 새긴 이'는 제 손으로 만든 것을 더 받고 판다
  const mine = state && hasTitle(state, 'maker') && item.maker === state.name ? 1.1 : 1;
  const hide = state && state.flags.hideSeller && /hide/.test(item.id) ? 1.3 : 1; // 무두장이는 가죽 값을 더 받는다
  const eye = state ? 1 + (state.skills?.appraise?.grade || 0) * APPRAISE_SELL : 1; // 감정 (Z62): 등급마다 파는 값이 오른다. 상한 없음
  const market = state && SHOPS[state.place]?.market ? marketRate(state, item.id) : 1; // 저울목: 파는 값도 날마다 바뀐다 (SB-C1)
  const gaze = state ? 1 + (state.hidden?.gaze?.value || 0) * 0.01 : 1; // 안목 (Z119)
  return Math.max(1, Math.floor(worth(item) * SELL_RATE * mine * hide * eye * market * gaze));
}

/** 저울목의 오늘 값 (SB-C1): 제값의 몇 배인가. 나루 어시장과 같은 씨앗을 쓴다. 날이 바뀔 때 새로 붙는다. */
export function marketRate(state, id, day = state.day) {
  const m = MARKET_SWING[0] + (seedFrom(`${state.seed}|price|${day}|${id}`) / 4294967296) * MARKET_SWING[1];
  const r = Math.round(m * 100) / 100;
  return Math.abs(r - 1) < MARKET_FLAT - 0.005 ? 1 : r;
}
/** 시세판 (SB-C2): 오늘 값만 보인다. 비싼 것, 싼 것, 제값인 것 세 묶음. */
export function pricesView(state) {
  const rows = (MARKET_GOODS_AT[state.place] || MARKET_GOODS).map((id) => {
    const base = worth({ id, grade: itemDef(id).grade || 0 }), rate = marketRate(state, id);
    return { id, name: itemDef(id).name, base, now: Math.max(1, Math.round(base * rate)), pct: Math.round((rate - 1) * 100) };
  });
  // 값이 작아 반올림하면 제값과 같은 것은 제값 묶음에 둔다
  return { day: state.day, up: rows.filter((r) => r.now > r.base).sort((a, b) => b.pct - a.pct), down: rows.filter((r) => r.now < r.base).sort((a, b) => a.pct - b.pct), flat: rows.filter((r) => r.now === r.base) };
}
/** 주막의 소문 (SB-C2): 내일 값이 가장 크게 움직일 것 하나. 가끔만 흘린다(이틀에 한 번쯤). 없으면 null. */
export function marketHint(state) {
  if (seedFrom(`${state.seed}|pricehint|${state.day}`) % 2) return null;
  const best = MARKET_GOODS.map((id) => ({ id, rate: marketRate(state, id, state.day + 1) })).filter((r) => r.rate !== 1).sort((a, b) => Math.abs(b.rate - 1) - Math.abs(a.rate - 1))[0];
  if (!best) return null;
  const short = { scorpshell: '껍질', saltsteel: '소금강', wormmeat: '갯지렁이', whitefur: '흰털', frostiron: '서릿쇠' }[best.id] || itemDef(best.id).name;
  return { id: best.id, up: best.rate > 1, text: `내일은 ${short}값이 ${best.rate > 1 ? '뛴다' : '떨어진다'}더라.` };
}

/** 저울목에서 제값보다 싼 날 내다 팔았다: 값을 깎아 판 것이다. 깎지 않고 판 수를 처음부터 다시 센다 (LV-E4, 화면에 내보내지 않는다). */
function cutSale(state, item) {
  if (SHOPS[state.place]?.market && marketRate(state, item.id) < 1 && state.counters.fairSold) state.counters.fairSold = 0;
}

export function shopHere(state) {
  return SHOPS[state.place] || null;
}

/** 상점 창이 그릴 것. */
export function shopView(state) {
  const shop = shopHere(state);
  if (!shop) return null;
  return {
    keeper: shop.keeper, hello: shop.hello, daily: !!shop.daily, market: !!shop.market,
    goods: shop.sells.map((id) => ({ id, name: itemDef(id).name, desc: itemDef(id).desc, ...buyPrice(state, id) })),
    mine: state.bag.map((item, index) => ({ index, item, name: gearName(item), grade: gradeName(item.grade), n: item.n, each: sellPrice(item, state) })).filter((x) => x.each > 0),
  };
}

/** 하나 산다. */
export function buy(state, events, id) {
  const shop = shopHere(state);
  if (!shop || !shop.sells.includes(id)) throw new Error('여기서는 팔지 않는 물건입니다');
  const price = buyPrice(state, id).now;
  if (state.silver < price) throw new Error(`은화가 모자랍니다 (${state.silver} / ${price})`);
  state.silver -= price;
  addItem(state, id, 1);
  pushLine(state, events, { k: 'me', text: `${eulReul(itemDef(id).name)} 샀다. 은화 −${price}.` });
  events.push({ type: 'trade' });
}

/** 가방의 물건을 판다. n을 주지 않으면 하나. */
export function sell(state, events, index, n = 1) {
  if (!shopHere(state)) throw new Error('여기에는 사 줄 사람이 없습니다');
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (!Number.isInteger(n) || n < 1 || n > item.n) throw new Error('그만큼 가지고 있지 않습니다');
  const each = sellPrice(item, state);
  if (each <= 0) throw new Error('퀘스트 물건은 팔 수 없습니다');
  // 메인 1장 '만드는 길': 제 손으로 만든 희귀 등급 이상을 마을 사람에게 판다
  if (item.maker === state.name && item.grade >= 2) state.main.soldRare = true;
  cutSale(state, item);
  const name = gearName(item);
  const grade = item.grade ? `${gradeName(item.grade)} 등급 ` : '';
  removeAt(state, index, n);
  state.silver += each * n;
  pushLine(state, events, { k: 'me', text: `${grade}${name} ${n}개를 팔았다. 은화 +${each * n}.` });
  events.push({ type: 'trade' });
}

/**
 * 고른 것을 한꺼번에 판다 (Z85, 사용자 요청). picks: [{ index, n }]. 하나라도 안 되면 아무것도 팔지 않는다.
 * 가방의 자리가 바뀌지 않게 뒤쪽부터 뺀다.
 */
export function sellMany(state, events, picks) {
  if (!shopHere(state)) throw new Error('여기에는 사 줄 사람이 없습니다');
  if (!Array.isArray(picks) || !picks.length) throw new Error('고른 것이 없습니다');
  const seen = new Set();
  const rows = picks.map((p) => {
    const item = state.bag[p.index];
    if (!item || seen.has(p.index)) throw new Error('가방에 없는 물건입니다');
    seen.add(p.index);
    const n = p.n ?? item.n;
    if (!Number.isInteger(n) || n < 1 || n > item.n) throw new Error('그만큼 가지고 있지 않습니다');
    const each = sellPrice(item, state);
    if (each <= 0) throw new Error(`${gearName(item)}${itemDef(item.id).kind === 'quest' ? '는 퀘스트 물건이라' : '는'} 팔 수 없습니다`);
    return { index: p.index, item, n, each };
  });
  let total = 0;
  const names = [];
  for (const r of rows) cutSale(state, r.item);
  for (const r of [...rows].sort((a, b) => b.index - a.index)) {
    if (r.item.maker === state.name && r.item.grade >= 2) state.main.soldRare = true;
    names.unshift(`${r.item.grade ? `${gradeName(r.item.grade)} 등급 ` : ''}${gearName(r.item)}${r.n > 1 ? ` ${r.n}개` : ''}`);
    removeAt(state, r.index, r.n);
    total += r.each * r.n;
  }
  state.silver += total;
  pushLine(state, events, { k: 'me', text: `${names.join(', ')}. 한꺼번에 팔았다. 은화 +${total}.` });
  events.push({ type: 'trade' });
  return total;
}

// ── 보관함 ──────────────────────────────────────────────

/** 보관함은 마을마다 따로다. 보관함이 있는 곳(주점)에서만 연다. */
const boxOf = (state) => {
  const place = placeById(state.place);
  if (!place.storage) throw new Error('여기에는 보관함이 없습니다');
  return state.store[place.town] || (state.store[place.town] = { items: [], silver: 0 });
};

export function storeWeight(box) {
  return box.items.reduce((a, x) => a + itemWeight(x), 0);
}

const stacks = (a, b) => itemDef(a.id).kind !== 'gear' && a.id === b.id && a.grade === b.grade;

/** 보관함 창이 그릴 것. 가방과 맡긴 것을 나란히 (H1-5). */
export function storeView(state) {
  const box = boxOf(state);
  return {
    items: box.items.map((item, index) => ({ index, item, name: gearName(item), grade: gradeName(item.grade), n: item.n })),
    silver: box.silver, weight: storeWeight(box), cap: STORE_CAP, fee: STORE_FEE, debt: state.storeDebt || 0, rate: STORE_RATE, interest: Math.floor((box.silver || 0) * STORE_RATE), work: state.flags?.dayWork || 0, workNeed: INTEREST_WORK,
    busy: box.items.length > 0 || box.silver > 0,
  };
}

function payDebt(state, events) {
  if (!state.storeDebt) return;
  if (state.silver < state.storeDebt) throw new Error(`밀린 보관 삯 ${eulReul(`은화 ${state.storeDebt}`)} 먼저 치러야 합니다`);
  state.silver -= state.storeDebt;
  pushLine(state, events, { k: 'me', text: `밀린 보관 삯을 치렀다. 은화 −${state.storeDebt}.` });
  state.storeDebt = 0;
}

export function deposit(state, events, index, n = 1) {
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (!Number.isInteger(n) || n < 1 || n > item.n) throw new Error('그만큼 가지고 있지 않습니다');
  if (itemDef(item.id).kind === 'quest') throw new Error('퀘스트 물건은 맡길 수 없습니다');
  const box = boxOf(state);
  const add = itemDef(item.id).weight * n;
  if (storeWeight(box) + add > STORE_CAP) throw new Error(`보관함이 찼습니다 (무게 ${storeWeight(box)} / ${STORE_CAP})`);
  const moved = { ...item, n };
  removeAt(state, index, n);
  const same = box.items.find((x) => stacks(x, moved));
  if (same) same.n += n; else box.items.push(moved);
  pushLine(state, events, { k: 'me', text: `${itemDef(moved.id).name} ${n}개를 맡겼다.` });
  events.push({ type: 'trade' });
}

export function withdraw(state, events, index, n = 1) {
  const box = boxOf(state);
  const item = box.items[index];
  if (!item) throw new Error('맡긴 것 가운데 없는 물건입니다');
  if (!Number.isInteger(n) || n < 1 || n > item.n) throw new Error('그만큼 맡기지 않았습니다');
  payDebt(state, events);
  item.n -= n;
  if (item.n === 0) box.items.splice(index, 1);
  if (itemDef(item.id).kind === 'gear') state.bag.push({ ...item, n: 1 });
  else addItem(state, item.id, n, { grade: item.grade, maker: item.maker });
  pushLine(state, events, { k: 'me', text: `${gearName(item)} ${n}개를 찾았다.` });
  events.push({ type: 'trade' });
}

export function depositSilver(state, events, amount) {
  if (!Number.isInteger(amount) || amount < 1 || amount > state.silver) throw new Error('그만큼의 은화가 없습니다');
  state.silver -= amount;
  boxOf(state).silver += amount;
  pushLine(state, events, { k: 'me', text: `${eulReul(`은화 ${amount}`)} 맡겼다.` });
  events.push({ type: 'trade' });
}

export function withdrawSilver(state, events, amount) {
  const box = boxOf(state);
  if (!Number.isInteger(amount) || amount < 1 || amount > box.silver) throw new Error('그만큼 맡기지 않았습니다');
  // 밀린 삯은 찾은 은화로 치를 수 있다. 모자라면 아무것도 옮기지 않는다.
  if ((state.storeDebt || 0) > state.silver + amount) throw new Error(`밀린 보관 삯 ${eulReul(`은화 ${state.storeDebt}`)} 먼저 치러야 합니다`);
  box.silver -= amount;
  state.silver += amount;
  payDebt(state, events);
  pushLine(state, events, { k: 'me', text: `${eulReul(`은화 ${amount}`)} 찾았다.` });
  events.push({ type: 'trade' });
}

/**
 * 날이 바뀔 때 부른다. 맡긴 은화에는 하루 1% 이자가 붙는다 (Z42). 물건을 맡긴 날만 삯을 낸다 (H1-6). 모자라면 달아 둔다.
 * @param worked 그날 일을 서른 번 이상 했는가 (LV-L9). 아니면 이자가 붙지 않는다. 잠만 자서 날을 넘기는 길을 막는다
 */
export function storeDay(state, events, worked = true) {
  for (const [town, box] of Object.entries(state.store)) {
    const interest = worked ? Math.floor((box.silver || 0) * STORE_RATE) : 0;
    if (interest > 0) {
      box.silver += interest;
      pushLine(state, events, { k: 'sys', tone: 'mint', text: `${town}에 맡긴 은화에 이자가 붙었다. 은화 +${interest}.` });
    }
    if (!box.items.length) continue; // 은화만 맡기면 삯이 없다
    let fee = STORE_FEE;
    const fromBox = Math.min(box.silver, fee); // 맡긴 은화에서 먼저 뗀다
    box.silver -= fromBox; fee -= fromBox;
    const fromHand = Math.min(state.silver, fee);
    state.silver -= fromHand; fee -= fromHand;
    if (fee > 0) state.storeDebt = (state.storeDebt || 0) + fee;
    pushLine(state, events, { k: 'sys', text: fee > 0 ? `보관 삯 은화 ${STORE_FEE}. 모자란 은화 ${fee}만큼은 주점 주인이 달아 두었다.` : `보관 삯으로 ${iGa(`은화 ${STORE_FEE}`)} 나갔다.` });
  }
}
