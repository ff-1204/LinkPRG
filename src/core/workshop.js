// 공방과 견습 (AN-C, LV-K2, LV-K4, LV-K10, LV-M5): 뜬마을의 빈 공방. 견습은 내가 일한 수에 비례해서만 돈다.
// 내가 "일"(SB-D6)을 한 번 할 때마다 견습의 일이 한 칸 찬다. 쉬기, 잠, 길 가기, 사고팔기, 둘러보기로는 차지 않는다. 꺼 두면 아무것도 쌓이지 않는다.
// 견습이 만든 것에는 띠링이 울리지 않고, 내 숙련도·제작 레벨·경험치도 오르지 않는다 (AN-C7). 사기 전에는 어디에도 나오지 않는다 (AN-F3).

import { placeById, PLACES } from '../data/places.js?v=8bcdbdb';
import { itemDef } from '../data/items.js?v=8bcdbdb';
import { RECIPES } from '../data/recipes.js?v=8bcdbdb';
import { TIERS } from '../data/tiers.js?v=8bcdbdb';
import { tierOfLv, reachedBand } from '../data/bands.js?v=8bcdbdb';
import { PEOPLE } from '../data/people.js?v=8bcdbdb';
import { pushLine, ding } from './log.js?v=8bcdbdb';
import { makeItem } from './inventory.js?v=8bcdbdb';
import { craftTierOf, branchOfRecipe } from './craft.js?v=8bcdbdb';
import { gearName } from './gear.js?v=8bcdbdb';
import { STALL } from './stall.js?v=8bcdbdb';
import { iGa } from './ko.js?v=8bcdbdb';

/**
 * price: 빈 공방의 값 (LV-L6). wage: 견습의 하루 삯 (AN-C4). seats: 처음의 견습 자리. second·third: 둘째·셋째 자리가 생기는 레벨 (AN-C8, LV-K2: 61에 둘, 81에 셋). hands: 들일 수 있는 사람들(차례대로).
 * every: 손 단계마다 하나를 짓는 데 드는 내 일의 수 (AN-C5). gather: 모으기는 늘 열 번에 하나 (LV-M5). stages: 그 단계가 되는 손(만든 수).
 */
export const SHOP = { price: 13000, place: 'emptyshop', inn: 'floatinn', wage: 100, seats: 1, every: [10, 9, 8, 6, 5], gather: 10, stages: [0, 10, 25, 45, 70], hand: 'bori', hands: ['bori', 'sora', 'iseul'], second: 61, third: 81, branches: ['smith', 'sew', 'jewel'], gatherBelow: 2 };
export const SHOP_LINES = {
  price: '문설주에 팻말이 걸려 있다. "모루째, 물레째. 은화 13,000. 하다 만 것은 그대로 둠."',
  bought: '팻말을 떼어 냈다. 모루 위의 식은 쇠를 치우고 화덕에 불을 넣었다. 이제 여기는 내 공방이다.',
  empty: '모루도 물레도 식어 있다. 일할 사람을 들이면, 내가 일하는 동안 곁에서 같이 만든다. 내가 쉬면 견습도 쉰다.',
  seat: '물 위 주막에서 사람을 찾는다',
};

const atShop = (state) => state.place === SHOP.place && !state.dungeon;
const handName = (id) => PEOPLE[id].name;
/** 손의 단계 1~5: 만든 수만큼 오른다. */
export const handStage = (pts) => { let s = 1; for (let i = 1; i < SHOP.stages.length; i++) if ((pts || 0) >= SHOP.stages[i]) s = i + 1; return s; };
/** 견습의 자리 셋: 첫째(hand), 둘째(hand2, 61부터), 셋째(hand3, 81부터). 셋째 칸은 옛 저장에 없을 수 있다(없으면 빈 자리다). */
export const SEATS = ['hand', 'hand2', 'hand3'];
/** 공방의 견습들. */
export const handsOf = (sh) => (sh ? SEATS.map((k) => sh[k]).filter(Boolean) : []);
/** 견습 자리의 수 (AN-C8, LV-K2): 61부터 둘, 81부터 셋. 그 전에는 그 자리가 어디에도 나오지 않는다 (AN-F4). */
export const seatsOf = (state) => ((state.level || 1) >= SHOP.third ? 3 : (state.level || 1) >= SHOP.second ? 2 : SHOP.seats);
/** 지금 들일 수 있는 사람: 빈 자리가 있고 아직 들이지 않은 사람이 있으면 그 사람의 id, 아니면 null. */
export function hireOffer(state) {
  const sh = state.shop;
  if (!sh || handsOf(sh).length >= seatsOf(state)) return null;
  return SHOP.hands.find((id) => !handsOf(sh).some((h) => h.id === id)) || null;
}
/** 지금 견습의 손 단계(둘이면 더 익은 쪽). 견습이 없으면 0. */
export const stageNow = (state) => Math.max(0, ...handsOf(state.shop).map((h) => handStage(h.pts)));
/** 하나에 드는 내 일의 수. 짓기는 손 단계가 오를수록 줄고(열 번 → 다섯 번), 모으기는 늘 열 번이다. */
export const everyOf = (hand) => (hand.job?.kind === 'gather' ? SHOP.gather : SHOP.every[handStage(hand.pts) - 1]);

const same = (a, b) => a.id === b.id && (a.grade || 0) === (b.grade || 0) && (a.maker || '') === (b.maker || '');
function shelfAdd(shelf, item) {
  if (itemDef(item.id).kind !== 'gear') { const f = shelf.find((x) => same(x, item)); if (f) { f.n += item.n; return; } }
  shelf.push(item);
}
const shelfCount = (shelf, id) => shelf.filter((x) => x.id === id).reduce((a, x) => a + x.n, 0);
function shelfTake(shelf, id, n) {
  for (let i = shelf.length - 1; i >= 0 && n > 0; i--) {
    if (shelf[i].id !== id) continue;
    const t = Math.min(n, shelf[i].n);
    shelf[i].n -= t; n -= t;
    if (shelf[i].n < 1) shelf.splice(i, 1);
  }
}

/** 값을 알았는가: 빈 공방을 한 번 둘러본 뒤다 (AN-F3). */
export const shopOffered = (state) => !state.shop && !!state.flags?.sawShop;
/** 빈 공방을 둘러보았다: 처음이면 값이 적힌 팻말을 본다. */
export function lookShop(state, events) {
  if (state.place !== SHOP.place || state.shop || state.flags.sawShop) return;
  state.flags.sawShop = true;
  pushLine(state, events, { k: 'room', text: SHOP_LINES.price });
}

export function buyShop(state, events) {
  if (state.shop) throw new Error('이미 공방이 있습니다');
  if (!atShop(state)) throw new Error('빈 공방은 뜬마을에 있습니다');
  if (!shopOffered(state)) throw new Error('먼저 빈 공방을 둘러봐야 합니다');
  if (state.silver < SHOP.price) throw new Error(`은화가 모자랍니다 (${state.silver} / ${SHOP.price})`);
  state.silver -= SHOP.price;
  state.shop = { hand: null, hand2: null, shelf: [], today: [], left: {} };
  pushLine(state, events, { k: 'me', text: SHOP_LINES.bought });
  ding(state, events, { level: 2, kind: 'shop', title: '공방이 생겼습니다', big: '내 공방', body: '뜬마을의 빈 공방입니다. 견습을 들이면 내가 일하는 동안 곁에서 같이 만듭니다.' });
  events.push({ type: 'trade' });
}

/** 견습을 들인다 (AN-C4): 물 위 주막에서. 첫날 삯은 들일 때 낸다. 떠났던 견습은 익힌 손 그대로 돌아온다. */
export function hireHand(state, events) {
  const sh = state.shop;
  if (!sh) throw new Error('공방이 없습니다');
  if (state.place !== SHOP.inn || state.dungeon) throw new Error('견습은 물 위 주막에서 찾습니다');
  const id = hireOffer(state);
  if (!id) throw new Error('견습 자리가 찼습니다');
  if (state.silver < SHOP.wage) throw new Error(`첫날 삯 은화 ${SHOP.wage}은 있어야 합니다`);
  state.silver -= SHOP.wage;
  const p = PEOPLE[id];
  sh[SEATS.find((k) => !sh[k])] = { id, pts: sh.left?.[id] || 0, job: null, work: 0, idle: false, paidDay: state.day };
  pushLine(state, events, { k: 'npc', who: p.name, text: p.join });
  pushLine(state, events, { k: 'sys', text: `${iGa(p.name)} 견습으로 들어왔다. 하루 삯 은화 ${SHOP.wage}. 공방에서 일을 맡긴다.` });
  events.push({ type: 'trade' });
}

/** 맡길 수 있는 일 (AN-C3): 짓기는 내 단계보다 한 단계 아래의 설계도, 모으기는 두 단계 아래까지의 재료. */
export function jobChoices(state) {
  const make = [];
  for (const branch of SHOP.branches) {
    const tier = craftTierOf(state, branch) - 1;
    if (tier < 1) continue;
    for (const r of Object.values(RECIPES)) {
      if (branchOfRecipe(r) !== branch || r.cook || tierOfLv(r.lv || 1) !== tier || itemDef(r.makes).kind !== 'gear') continue;
      make.push({ kind: 'make', recipe: r.id, name: r.name, needs: r.needs.map((n) => `${itemDef(n.id).name} ${n.n}`).join(', ') });
    }
  }
  const top = reachedBand(state, PLACES) - SHOP.gatherBelow;
  const gather = [];
  for (const t of TIERS.filter((x) => x.n <= top).reverse()) for (const k of ['metal', 'hide', 'meat']) gather.push({ kind: 'gather', item: t[k][0], name: `${t[k][1]} 모으기`, needs: `내 ${SHOP.gather}번에 하나` });
  return { make, gather };
}
const jobLabel = (job) => (!job ? '' : job.kind === 'gather' ? `${itemDef(job.item).name} 모으기` : `${RECIPES[job.recipe].name} 짓기`);

/** 일을 맡긴다. 견습 하나에 일 하나다. 일을 바꾸면 차던 칸은 처음부터다. who: 맡길 견습(안 주면 첫째). */
export function setJob(state, events, job, who) {
  const sh = state.shop;
  const hd = handsOf(sh).find((h) => !who || h.id === who);
  if (!sh || !hd) throw new Error('일을 맡길 견습이 없습니다');
  if (!atShop(state)) throw new Error('일은 공방에서 맡깁니다');
  const c = jobChoices(state);
  const ok = job && (job.kind === 'gather' ? c.gather.find((x) => x.item === job.item) : c.make.find((x) => x.recipe === job.recipe));
  if (!ok) throw new Error('맡길 수 없는 일입니다');
  hd.job = job.kind === 'gather' ? { kind: 'gather', item: job.item } : { kind: 'make', recipe: job.recipe };
  hd.work = 0; hd.idle = false;
  pushLine(state, events, { k: 'me', text: `${handName(hd.id)}에게 일을 맡겼다: ${jobLabel(hd.job)}.` });
  events.push({ type: 'trade' });
}

/** 가방의 재료를 공방 선반에 넣는다. */
export function putOnShelf(state, events, index, n) {
  const sh = state.shop;
  if (!sh) throw new Error('공방이 없습니다');
  if (!atShop(state)) throw new Error('선반은 내 공방에 있습니다');
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  if (itemDef(item.id).kind !== 'material') throw new Error('선반에는 재료만 넣습니다');
  const k = Math.min(item.n, Number.isInteger(n) && n > 0 ? n : item.n);
  shelfAdd(sh.shelf, { ...item, n: k });
  if (k >= item.n) state.bag.splice(index, 1); else item.n -= k;
  for (const h of handsOf(sh)) h.idle = false;
  pushLine(state, events, { k: 'me', text: `${itemDef(item.id).name} ${k}개를 공방 선반에 넣었다.` });
  events.push({ type: 'bag' });
}
/** 선반의 것을 가방으로 꺼낸다(남은 재료도, 견습이 만든 것도). */
export function takeFromShelf(state, events, i, n) {
  const sh = state.shop;
  if (!sh) throw new Error('공방이 없습니다');
  if (!atShop(state)) throw new Error('선반은 내 공방에 있습니다');
  const item = sh.shelf[i];
  if (!item) throw new Error('선반에 없는 물건입니다');
  const k = Math.min(item.n, Number.isInteger(n) && n > 0 ? n : item.n);
  const out = { ...item, n: k };
  if (k >= item.n) sh.shelf.splice(i, 1); else item.n -= k;
  if (itemDef(out.id).kind === 'gear') state.bag.push(out);
  else { const f = state.bag.find((x) => same(x, out) && itemDef(x.id).kind !== 'gear'); if (f) f.n += k; else state.bag.push(out); }
  pushLine(state, events, { k: 'me', text: `공방 선반에서 꺼냈다: ${itemDef(out.id).kind === 'gear' ? gearName(out) : itemDef(out.id).name}${k > 1 ? ` ${k}개` : ''}.` });
  events.push({ type: 'bag' });
}

/** 내 공방의 것인가: 견습이 지은 것은 좌판에 올릴 수 있다 (AN-C1). */
export const shopMaker = (state) => `${state.name}의 공방`;

function note(sh, name, where) {
  let row = sh.today.find((x) => x.name === name);
  if (!row) { row = { name, n: 0, stall: 0, shelf: 0 }; sh.today.push(row); }
  row.n += 1; row[where] += 1;
}

/**
 * 내가 "일"을 한 번 했다 (SB-D6, LV-K9). 견습이 있고 맡긴 일이 있을 때만 센다. 찰 때마다 견습이 하나를 짓거나 모은다.
 * 띠링도, 내 숙련도·제작 레벨·경험치도 없다. beside: 방금 내가 공방에서 두드린 설계도(같은 것이면 손이 두 배로 는다, AN-C5).
 */
export function shopWork(state, events, { beside = null } = {}) {
  for (const hd of handsOf(state.shop)) handWork(state, events, hd, beside); // 둘이면 저마다 맡은 일을 한다 (AN-C8)
}
function handWork(state, events, hd, beside) {
  const sh = state.shop;
  if (!hd || !hd.job) return;
  const need = everyOf(hd);
  hd.work = Math.min(need, (hd.work || 0) + 1);
  if (hd.work < need) return;
  const who = handName(hd.id);
  if (hd.job.kind === 'gather') {
    shelfAdd(sh.shelf, makeItem(hd.job.item));
    note(sh, itemDef(hd.job.item).name, 'shelf');
    hd.work = 0;
    return;
  }
  const r = RECIPES[hd.job.recipe];
  const short = r.needs.find((n) => shelfCount(sh.shelf, n.id) < n.n);
  if (short) {
    // 재료가 떨어지면 한 줄을 남기고 쉰다. 삯은 그대로 나간다 (AN-C6)
    if (!hd.idle) { hd.idle = true; pushLine(state, events, { k: 'sys', who: '공방', text: `${iGa(who)} 손을 놓았다. ${iGa(itemDef(short.id).name)} 떨어졌다.`, tone: 'warn' }); }
    return;
  }
  for (const n of r.needs) shelfTake(sh.shelf, n.id, n.n);
  hd.idle = false; hd.work = 0;
  const item = makeItem(r.makes, { grade: 0, maker: shopMaker(state) });
  const st = state.stall;
  if (st && st.items.length < STALL.slots) { st.items.push(item); note(sh, r.name, 'stall'); } // 가게 진열대의 빈 칸으로 먼저 (AN-C1)
  else { sh.shelf.push(item); note(sh, r.name, 'shelf'); }
  const before = handStage(hd.pts);
  hd.pts += beside && beside === r.id && state.place === SHOP.place ? 2 : 1;
  const now = handStage(hd.pts);
  if (now > before) pushLine(state, events, { k: 'sys', who: '공방', text: `${who}의 손이 늘었다. 손 ${now}단계.`, tone: 'mint' });
  events.push({ type: 'shopmade' });
}

/** 날이 바뀌었다: 오늘 만든 것이 비워지고, 견습의 하루 삯이 나간다. 못 주면 떠난다 (AN-C4). */
export function shopDay(state, events) {
  const sh = state.shop;
  if (!sh) return;
  sh.today = [];
  // 견습마다 저마다 삯을 받는다. 못 받은 사람만 떠난다
  for (const seat of SEATS) {
    const hd = sh[seat];
    if (!hd || state.day <= hd.paidDay) continue;
    const who = handName(hd.id);
    if (state.silver >= SHOP.wage) {
      state.silver -= SHOP.wage; hd.paidDay = state.day;
      pushLine(state, events, { k: 'sys', text: `${who}에게 하루 삯 은화 ${SHOP.wage}을 냈다.` });
    } else {
      sh.left = { ...(sh.left || {}), [hd.id]: hd.pts };
      sh[seat] = null;
      pushLine(state, events, { k: 'sys', text: `삯을 주지 못했다. ${iGa(who)} 연장을 내려놓고 주막으로 돌아갔다.`, tone: 'warn' });
    }
  }
}

/** 다시 태어나면 공방은 남고 견습은 떠난다 (LV-K11). 선반의 것은 그대로다. */
export function shopCarry(state) {
  return state.shop ? { hand: null, hand2: null, shelf: JSON.parse(JSON.stringify(state.shop.shelf || [])), today: [], left: {} } : null;
}

/** "내 공방" 창이 그릴 것 (AN-C1 ~ AN-C3). 공방이 없으면 null. 둘째·셋째 자리는 어디에도 내보내지 않는다 (AN-F4). */
export function workshopView(state) {
  const sh = state.shop;
  if (!sh) return null;
  const all = handsOf(sh), hd = all[0] || null;
  const label = (it) => (itemDef(it.id).kind === 'gear' ? gearName(it) : itemDef(it.id).name);
  const r = hd?.job?.kind === 'make' ? RECIPES[hd.job.recipe] : null;
  const one = (h) => ({ id: h.id, name: handName(h.id), stage: handStage(h.pts), every: everyOf(h), job: jobLabel(h.job), left: h.job ? Math.max(1, everyOf(h) - (h.work || 0)) : null, idle: !!h.idle });
  return {
    here: atShop(state), seats: seatsOf(state), hands: all.length, empty: SHOP_LINES.empty, seat: SHOP_LINES.seat, wage: SHOP.wage,
    hand: hd ? one(hd) : null, list: all.map(one), // list: 견습 모두(61부터 둘, 81부터 셋까지). hand는 그 첫째다
    shelf: sh.shelf.map((it, i) => ({ i, id: it.id, name: label(it), n: it.n, gear: itemDef(it.id).kind === 'gear', per: r?.needs.find((n) => n.id === it.id) ? `${r.name.replace(/^\S+ /, '')} ${Math.floor(it.n / r.needs.find((n) => n.id === it.id).n)}개 치` : '' })),
    today: sh.today.map((x) => ({ ...x })),
    jobs: all.length ? jobChoices(state) : { make: [], gather: [] },
    mine: state.bag.map((item, index) => ({ index, item, name: itemDef(item.id).name, n: item.n })).filter((x) => itemDef(x.item.id).kind === 'material'),
    place: placeById(SHOP.place).name,
  };
}
