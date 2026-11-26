// 경매장 (N6-1 ~ N6-3). 가상 유저가 입찰하고 한마디씩 남긴다.
// 입찰은 씨앗과 날짜로 셈한다. 같은 씨앗이면 같은 값에 팔린다.

import { seedFrom } from './rng.js?v=fb24485';
import { gearName } from './gear.js?v=fb24485';
import { pushLine } from './log.js?v=fb24485';
import { ITEMS, itemDef, gradeName } from '../data/items.js?v=fb24485';
import { addItem, removeAt } from './inventory.js?v=fb24485';
import { worth } from './trade.js?v=fb24485';
import { placeById } from '../data/places.js?v=fb24485';
import { standingOf } from './factions.js?v=fb24485';
import { FACTION_REGULAR } from '../data/factions.js?v=fb24485';
import { userBase } from './world.js?v=fb24485';
import { AUCTION_FEE, AUCTION_DAYS, LOT_TIERS, LOT_SKIP, LOT_ASK, LOT_GEAR_MIN, BID_SAYS, USER_COUNT } from '../data/world.js?v=fb24485';
import { eulReul, iGa, eunNeun } from './ko.js?v=fb24485';

// 끝 글자만 다른 글들도 고르게 흩어지도록 한 번 더 섞는다(전에는 같은 날 물건들의 시작가가 거의 같았다)
const mix = (h) => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return h >>> 0; };
const hash = (...parts) => mix(seedFrom(parts.join('|')));
const unit = (...parts) => hash(...parts) / 4294967296;
const label = (item) => `${item.grade ? `${gradeName(item.grade)} 등급 ` : ''}${gearName(item)}${item.n > 1 ? ` ${item.n}개` : ''}`;
const fairOf = (item) => worth(item) * item.n;

function atAuction(state) {
  if (!placeById(state.place).auction) throw new Error('경매장은 예술협회에 있습니다');
}

/** 수수료: 5%. 상단과 '단골' 이상이면 절반 (N6-3). */
export function feeRate(state) {
  return standingOf(state, 'merchants') >= FACTION_REGULAR ? AUCTION_FEE / 2 : AUCTION_FEE;
}

/** 경매에 나올 수 있는 것과 그 등급. 장비는 어느 등급으로든 나온다. 나머지는 제 등급으로만. */
const lotable = Object.entries(ITEMS).filter(([id, d]) => d.kind !== 'quest' && !d.nosell && !d.unknown && (d.price || 0) > 0 && !LOT_SKIP.includes(id));
export function lotPool(grade) {
  // 중급부터는 값싼 장비(목검·훈련복·짚신 같은 것)를 내놓지 않는다
  return lotable.filter(([, d]) => (d.kind === 'gear' ? (d.grade || 0) <= grade && (grade === 0 || d.price >= LOT_GEAR_MIN) : (d.grade || 0) === grade)).map(([id]) => id);
}

/** 오늘 가상 유저들이 내놓은 물건 (Z66). 하급·중급·상급. 하루 뒤에 끝난다. */
export function lotsToday(state, day = state.day) {
  const out = [];
  for (const t of LOT_TIERS) {
    if (t.chance != null && unit(state.seed, 'tier', t.id, day) >= t.chance) continue; // 상급은 비는 날이 있다
    const taken = new Set();
    for (let k = 0; k < t.n; k++) {
      const grade = t.top && unit(state.seed, 'top', t.id, day, k) < t.top ? t.grade + 1 : t.grade;
      const pool = lotPool(grade).filter((id) => !taken.has(id));
      if (!pool.length) continue;
      const id = pool[hash(state.seed, 'lot', t.id, day, k) % pool.length];
      taken.add(id);
      const def = itemDef(id);
      // 장비와 귀한 것은 하나, 나머지는 은화 20~60어치 한 묶음(12개까지)
      const n = def.kind === 'gear' || def.kind === 'etc' ? 1 : Math.min(12, Math.max(1, Math.round((20 + (hash(state.seed, 'n', t.id, day, k) % 41)) / def.price)));
      const item = { id, grade: def.kind === 'gear' ? grade : def.grade || 0, n };
      const fair = fairOf(item);
      out.push({
        key: `${day}-${t.id}-${k}`, tier: t.id, item, name: label(item), fair,
        seller: userBase(state, hash(state.seed, 'seller', t.id, day, k) % USER_COUNT).name,
        ask: Math.max(1, Math.round(fair * (LOT_ASK.from + unit(state.seed, 'ask', t.id, day, k) * LOT_ASK.span))), ends: day + 1,
      });
    }
  }
  return out;
}

/** 경매에 올릴 수 있는 것은 내가 만든 물건뿐이다 (Z76, 사용자 요청). 상점 물건·주운 것·떨굼은 안 된다. */
export const madeByMe = (state, item) => !!item.maker && item.maker === state.name;

/** 올린다. 시작가와 기간(하루, 사흘)을 정한다 (N6-3). */
export function listItem(state, events, index, start, days) {
  atAuction(state);
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  const def = itemDef(item.id);
  if (def.kind === 'quest') throw new Error('퀘스트 물건은 올릴 수 없습니다');
  if (def.nosell) throw new Error('팔 수 없는 물건입니다');
  if (!madeByMe(state, item)) throw new Error('경매장에는 내가 만든 물건만 올릴 수 있습니다');
  if (!Number.isInteger(start) || start < 1 || start > 100000) throw new Error('시작가는 1 이상의 은화입니다');
  if (!AUCTION_DAYS.includes(days)) throw new Error('기간은 하루 또는 사흘입니다');
  const one = { ...item, n: def.kind === 'gear' ? 1 : item.n };
  removeAt(state, index, one.n);
  const a = state.auction;
  a.mine.push({ no: a.no++, item: one, start, day: state.day, ends: state.day + days, bids: [] });
  pushLine(state, events, { k: 'me', text: `경매장에 ${eulReul(label(one))} 올렸다. 시작가 은화 ${start}, ${days === 1 ? '하루' : '사흘'} 동안.` });
  events.push({ type: 'auction' });
}

/** 가상 유저가 내놓은 물건에 입찰한다. 낸 은화는 묶여 있다가, 지면 돌아온다. */
export function bid(state, events, key, amount) {
  atAuction(state);
  const lot = lotsToday(state).find((l) => l.key === key);
  if (!lot) throw new Error('오늘 나온 물건이 아닙니다');
  const a = state.auction;
  const had = a.bids.find((b) => b.key === key);
  if (!Number.isInteger(amount) || amount < lot.ask) throw new Error(`은화 ${lot.ask} 이상을 불러야 합니다`);
  if (had && amount <= had.amount) throw new Error('먼저 부른 값보다 높아야 합니다');
  const pay = amount - (had ? had.amount : 0);
  if (pay > state.silver) throw new Error(`은화가 모자랍니다 (${state.silver} / ${pay})`);
  state.silver -= pay;
  if (had) had.amount = amount; else a.bids.push({ key, amount, item: lot.item, name: lot.name, fair: lot.fair, ends: lot.ends, seller: lot.seller });
  pushLine(state, events, { k: 'me', text: `${lot.name}에 ${eulReul(`은화 ${amount}`)} 불렀다.` });
  events.push({ type: 'auction' });
}

/** 날이 바뀔 때: 입찰이 붙고, 끝난 것은 팔리거나 돌아온다. */
export function auctionDay(state, events) {
  const a = state.auction;
  const day = state.day;
  for (const m of [...a.mine]) {
    const fair = fairOf(m.item);
    // 그날 붙는 입찰: 시작가가 쌀수록 많이 붙고, 비싸면 안 붙는다
    for (let d = Math.max(m.day + 1, day); d <= day; d++) {
      const top = m.bids.length ? m.bids.at(-1).amount : 0;
      // 이 물건에 사람들이 낼 만한 값: 가게에서 사는 값을 넘지 않는다(사서 올려 남기는 길이 없게)
      const cap = Math.max(1, Math.round(fair * (0.6 + unit(state.seed, 'cap', m.item.id, m.item.grade, m.day) * 0.35)));
      const n = m.start > cap ? 0 : 1 + (hash(state.seed, 'nb', m.no, d) % 3);
      // 싸게 올린 것은 첫 입찰이 낼 만한 값의 절반 넘게 뛴다
      let cur = Math.max(top, m.start - 1, top ? 0 : Math.round(cap * (0.5 + unit(state.seed, 'open', m.no) * 0.2)) - 1);
      for (let k = 0; k < n && cur < cap; k++) {
        cur = Math.min(cap, Math.max(cur + 1, Math.round(cur * (1.06 + unit(state.seed, 'up', m.no, d, k) * 0.14))));
        m.bids.push({ who: userBase(state, hash(state.seed, 'bidder', m.no, d, k) % USER_COUNT).name, amount: cur, say: BID_SAYS[hash(state.seed, 'say', m.no, d, k) % BID_SAYS.length], day: d - 1 });
      }
    }
    if (m.ends > day) continue;
    a.mine.splice(a.mine.indexOf(m), 1);
    if (m.bids.length) {
      const last = m.bids.at(-1);
      const fee = Math.ceil(last.amount * feeRate(state));
      state.silver += last.amount - fee;
      const text = `${iGa(label(m.item))} '${last.who}'님에게 은화 ${last.amount}에 낙찰되었다. ${eulReul(`수수료 ${fee}`)} 떼고 ${iGa(`은화 ${last.amount - fee}`)} 들어왔다. 수수료는 신전으로 가 아픈 이의 약과 빵이 된다.`;
      a.history.push({ day, kind: 'sold', text, amount: last.amount, fee });
      pushLine(state, events, { k: 'sys', who: '경매장', text });
    } else {
      if (itemDef(m.item.id).kind === 'gear') state.bag.push(m.item);
      else addItem(state, m.item.id, m.item.n, { grade: m.item.grade, maker: m.item.maker });
      const text = `${label(m.item)}에 아무도 입찰하지 않았다. 물건이 가방으로 돌아왔다.`;
      a.history.push({ day, kind: 'unsold', text });
      pushLine(state, events, { k: 'sys', who: '경매장', text });
    }
    events.push({ type: 'auction' });
  }
  for (const b of [...a.bids]) {
    if (b.ends > day) continue;
    a.bids.splice(a.bids.indexOf(b), 1);
    const rival = Math.round(b.fair * (0.85 + unit(state.seed, 'rival', b.key) * 0.45)); // 다른 사람이 부른 가장 높은 값
    if (b.amount >= rival) {
      if (itemDef(b.item.id).kind === 'gear') addItem(state, b.item.id, 1, { grade: b.item.grade, maker: b.seller });
      else addItem(state, b.item.id, b.item.n, { grade: b.item.grade });
      const text = `${eulReul(b.name)} 은화 ${b.amount}에 낙찰받았다.`;
      a.history.push({ day, kind: 'won', text, amount: b.amount });
      pushLine(state, events, { k: 'sys', who: '경매장', text });
    } else {
      state.silver += b.amount;
      const text = `${b.name}: 다른 사람이 ${eulReul(`은화 ${rival}`)} 불러 가져갔다. 부른 ${eunNeun(`은화 ${b.amount}`)} 돌아왔다.`;
      a.history.push({ day, kind: 'lost', text });
      pushLine(state, events, { k: 'sys', who: '경매장', text });
    }
    events.push({ type: 'auction' });
  }
  if (a.history.length > 100) { const over = a.history.length - 100; a.history.splice(0, over); state.world.seen.deals = Math.max(0, state.world.seen.deals - over); }
}

/** 경매장 창의 탭 넷이 그릴 것 (N6-1). */
export function auctionView(state) {
  const a = state.auction;
  const rate = feeRate(state);
  return {
    fee: Math.round(rate * 1000) / 10, feeWhy: rate < AUCTION_FEE ? "상단과 '단골'이라 절반" : '',
    mine: a.mine.map((m) => ({ no: m.no, name: label(m.item), start: m.start, left: m.ends - state.day, top: m.bids.at(-1)?.amount || 0, bids: m.bids.slice(-5).map((b) => ({ who: b.who, amount: b.amount, say: b.say })) })),
    tiers: LOT_TIERS.map((t) => ({ id: t.id, name: t.name })),
    lots: lotsToday(state).map((l) => ({ key: l.key, tier: l.tier, name: l.name, seller: l.seller, ask: l.ask, mine: a.bids.find((b) => b.key === l.key)?.amount || 0, desc: itemDef(l.item.id).desc })),
    bids: a.bids.map((b) => ({ key: b.key, name: b.name, amount: b.amount, left: b.ends - state.day })),
    history: a.history.slice(-20).reverse().map((h) => ({ day: h.day, text: h.text })),
    sellable: state.bag.map((item, index) => ({ index, item, name: label({ ...item, n: itemDef(item.id).kind === 'gear' ? 1 : item.n }), fair: fairOf({ ...item, n: itemDef(item.id).kind === 'gear' ? 1 : item.n }) })).filter((x) => itemDef(x.item.id).kind !== 'quest' && !itemDef(x.item.id).nosell && madeByMe(state, x.item)),
  };
}

export function auctionFields() {
  return { auction: { no: 1, mine: [], bids: [], history: [] } };
}
