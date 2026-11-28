// 상단 (GD-D, LV-K3): 다리 장터에서 상단 깃발을 사면, 짐꾼이 내 짐을 다른 거점으로 져다 판다.
// 짐은 내가 서른 번 "일"할 때마다 거점 하나를 간다. 쉬거나 자는 동안에는 가지 않는다 (GD-D3, LV-K9).
// 닿으면 그곳의 그날 값으로 팔리고 은화가 우편함으로 온다. 가는 길에 잃을 수 있다 (GD-D5).
// 그곳 값은 숫자로 보이지 않고 들은 소문만 적힌다 (GD-D7). 띠링은 울리지 않는다. 사기 전에는 어디에도 나오지 않는다 (GD-G3).

import { PLACES, TOWNS } from '../data/places.js?v=472d163';
import { BANDS } from '../data/bands.js?v=472d163';
import { itemDef, gradeName } from '../data/items.js?v=472d163';
import { COMPANIONS, partyMax } from '../data/companions.js?v=472d163';
import { MARKET_SWING, MARKET_FLAT } from '../data/shops.js?v=472d163';
import { pushLine, ding } from './log.js?v=472d163';
import { roll01 } from './rng.js?v=472d163';
import { worth, SELL_RATE } from './trade.js?v=472d163';
import { gearName } from './gear.js?v=472d163';
import { sendMail } from './mail.js?v=472d163';
import { iGa, eulReul, eunNeun } from './ko.js?v=472d163';

/**
 * price: 깃발 값 (LV-L6). fee: 짐꾼 삯 (GD-H7). weight: 짐 하나의 무게 (GD-D2). every: 거점 하나에 드는 내 일의 수 (GD-D3).
 * cheap/dear/far: 그곳에서 나는 것은 30% 싸고, 두 지역 넘게 떨어진 곳의 것은 40% 비싸다 (GD-D4).
 * risk: 그 지역을 지나갈 때 짐을 잃을 위험 (GD-D5). 잠긴 도성·잿골·소금벌은 시안의 숫자이고 안개늪·흰마루는 처음 값이다.
 * escort: 호위를 붙였을 때의 몫. loads: 한 번에 가는 짐의 수 (GD-D6). past: 창에 남는 지난 짐의 수.
 */
export const CARAVAN = { price: 42000, fee: 350, weight: 60, every: 30, place: 'bridgemarket', town: '다릿목', band: 8, owner: 'marketelder', cheap: 0.7, dear: 1.4, far: 2, risk: { 3: 0.05, 4: 0.08, 5: 0.12, 6: 0.13, 7: 0.15 }, escort: 0.5, loads: 1, past: 5, rare: 1.15, common: 0.85 };
export const CARAVAN_LINES = {
  bought: '은화는 맞네. 이 깃발을 등짐에 꽂으면 내 짐꾼들이 임자 짐을 져. 임자가 일하는 만큼만 걷는다는 것, 잊지 말게.',
  packed: '짐을 꾸려 짐꾼에게 넘겼다.',
  hop: '짐꾼이 고개 하나를 넘었다.',
  lost: '길에서 짐을 잃었다. 짐꾼은 빈 지게로 돌아왔다.',
  sold: '짐이 닿아 그날 값에 팔렸다.',
  back: '돌아와 곁에 섰다.',
  noSeat: '곁에 자리가 없어 제 거점으로 돌아갔다.',
  unpaid: '삯을 받지 못해 짐 곁을 떠났다.',
  none: '소문 없음',
};

export const caravanFields = () => ({ load: null, past: [], heard: {}, sent: 0 });
const atMarket = (state) => state.place === CARAVAN.place && !state.dungeon;
const label = (item) => `${item.grade ? `${gradeName(item.grade)} ` : ''}${gearName(item)}`;
const short = (id) => itemDef(id).name.replace(/ 덩이$/, '');

/** 짐을 보낼 수 있는 거점: 구름다리보다 앞 구간의 거점 마을. 산길을 따라 가까운 데부터. */
export function towns() {
  const out = [];
  for (let n = CARAVAN.band - 1; n >= 3; n--) {
    const name = Object.keys(TOWNS).find((t) => PLACES[TOWNS[t].gate].band === n);
    if (name) out.push({ band: n, town: name, gate: TOWNS[name].gate, region: BANDS[n - 1].name, hops: CARAVAN.band - n });
  }
  return out;
}
const townOf = (band) => towns().find((t) => t.band === band);
/** 그 거점까지 가는 길에 지나는 지역의 위험도 합 (GD-D5). from: 이미 지난 거점의 수. */
export function riskTo(band, { escort = false, from = 0 } = {}) {
  let sum = 0;
  for (let n = CARAVAN.band - 1 - from; n >= band; n--) sum += CARAVAN.risk[n] || 0;
  return sum * (escort ? CARAVAN.escort : 1);
}
/** 그 물건이 나는 지역(구간). 단계가 적히지 않은 것은 시작 마을의 것이다. */
const homeOf = (id) => itemDef(id).tier || 1;
/** 그곳의 그날 값이 제값의 몇 배인가 (GD-D4): 지역마다의 몫 위에 날마다 바뀌는 값이 얹힌다. 거점마다 따로 움직인다. */
export function townRate(state, id, band, day = state.day) {
  const home = homeOf(id);
  const place = home === band ? CARAVAN.cheap : Math.abs(home - band) > CARAVAN.far ? CARAVAN.dear : 1;
  const m = MARKET_SWING[0] + roll01(`${state.seed}|price|${day}|${id}|${band}`) * MARKET_SWING[1];
  const r = Math.round(m * 100) / 100;
  return place * (Math.abs(r - 1) < MARKET_FLAT - 0.005 ? 1 : r);
}
/** 그 물건 하나가 그곳에서 그날 팔리는 값: 가게에 파는 값(제값의 40%)에 그곳의 몫이 붙는다. */
export const townPrice = (state, item, band, day = state.day) => Math.max(1, Math.floor(worth(item) * SELL_RATE * townRate(state, item.id, band, day)));
const sellable = (item) => { const d = itemDef(item.id); return d.kind !== 'quest' && !d.nosell && !!d.price; };
const weightOf = (item, n = item.n || 1) => (itemDef(item.id).weight || 0) * n;

/** 깃발을 살 수 있게 됐는가: 장터 어른에게 말을 걸어 값을 들은 뒤다 (GD-G3). */
export const caravanOffered = (state) => !state.caravan && !!state.people?.[CARAVAN.owner]?.met;

export function buyCaravan(state, events) {
  if (state.caravan) throw new Error('이미 상단 깃발이 있습니다');
  if (!atMarket(state)) throw new Error('상단 깃발은 다리 장터에서 삽니다');
  if (!caravanOffered(state)) throw new Error('장터 어른에게 먼저 물어봐야 합니다');
  if (state.silver < CARAVAN.price) throw new Error(`은화가 모자랍니다 (${state.silver} / ${CARAVAN.price})`);
  state.silver -= CARAVAN.price;
  state.caravan = caravanFields();
  pushLine(state, events, { k: 'npc', who: '장터 어른', text: CARAVAN_LINES.bought });
  ding(state, events, { level: 2, kind: 'caravan', title: '상단이 생겼습니다', big: '내 상단', body: '다리 장터의 짐꾼이 내 짐을 다른 거점으로 져다 팝니다. 짐은 내가 일하는 동안에만 갑니다.' });
  events.push({ type: 'trade' });
}

/** 호위로 붙일 수 있는 이: 곁에 서 있는, 싸우는 용병 (GD-D5). 북 치는 이는 싸우지 않는다. */
export const escortsFor = (state) => (state.party || []).filter((c) => COMPANIONS[c.id].way === 'merc' && COMPANIONS[c.id].role !== 'bard' && !c.down && c.out !== state.day);

/**
 * 짐을 꾸려 보낸다 (GD-D2). picks: [{ from: 'bag' | 'box', index, n }] 가방과 다릿목 보관함에서. escort: 호위로 붙일 용병의 id(없으면 붙이지 않는다).
 * 짐꾼 삯은 먼저 낸다. 짐은 한 번에 하나다 (GD-D6).
 */
export function sendLoad(state, events, to, picks, escort = null) {
  const cv = state.caravan;
  if (!cv) throw new Error('상단이 없습니다');
  if (!atMarket(state)) throw new Error('짐은 다리 장터에서 꾸립니다');
  if (cv.load) throw new Error(`짐은 한 번에 ${CARAVAN.loads === 1 ? '하나' : CARAVAN.loads}입니다`);
  const dest = townOf(to);
  if (!dest || !state.dex?.places?.[dest.gate]) throw new Error('짐을 보낼 수 없는 곳입니다');
  if (!Array.isArray(picks) || !picks.length) throw new Error('보낼 물건을 골라야 합니다');
  const box = state.store[CARAVAN.town] || (state.store[CARAVAN.town] = { items: [], silver: 0 }); // 다릿목의 보관함(순례자 숙소)
  const src = { bag: state.bag, box: box.items };
  const seen = new Set();
  let weight = 0;
  for (const p of picks) {
    const item = src[p.from]?.[p.index];
    if (!item) throw new Error('없는 물건입니다');
    if (seen.has(`${p.from}:${p.index}`)) throw new Error('같은 물건을 두 번 골랐습니다');
    seen.add(`${p.from}:${p.index}`);
    if (!Number.isInteger(p.n) || p.n < 1 || p.n > (item.n || 1)) throw new Error('수가 맞지 않습니다');
    if (!sellable(item)) throw new Error('팔 수 없는 물건은 보낼 수 없습니다');
    weight += weightOf(item, p.n);
  }
  if (weight > CARAVAN.weight) throw new Error(`짐이 너무 무겁습니다 (${weight} / ${CARAVAN.weight})`);
  if (state.silver < CARAVAN.fee) throw new Error(`짐꾼 삯 은화 ${CARAVAN.fee}은 있어야 합니다`);
  let guard = null;
  if (escort) {
    guard = escortsFor(state).find((c) => c.id === escort);
    if (!guard) throw new Error('호위로 붙일 수 있는 용병이 곁에 없습니다');
  }
  // 뒤에서부터 꺼낸다(앞 자리가 밀리지 않게)
  const items = [];
  for (const p of [...picks].sort((a, b) => b.index - a.index)) {
    const list = src[p.from], item = list[p.index];
    if ((item.n || 1) > p.n) { item.n -= p.n; items.unshift({ ...JSON.parse(JSON.stringify(item)), n: p.n }); }
    else items.unshift(list.splice(p.index, 1)[0]);
  }
  state.silver -= CARAVAN.fee;
  if (guard) state.party.splice(state.party.indexOf(guard), 1);
  cv.sent = (cv.sent || 0) + 1;
  cv.load = { no: cv.sent, to, items, hop: 0, work: 0, escort: guard, day: state.day };
  pushLine(state, events, { k: 'me', text: `${CARAVAN_LINES.packed} ${CARAVAN.town} → ${dest.town}. 짐꾼 삯 은화 ${CARAVAN.fee}.` });
  if (guard) pushLine(state, events, { k: 'room', text: `${iGa(COMPANIONS[guard.id].name)} 짐꾼 뒤를 따라 내려간다. 닿을 때까지 곁에 없다.` });
  events.push({ type: 'trade' }); events.push({ type: 'bag' }); events.push({ type: 'party' });
}

/** 호위가 돌아온다: 자리가 있으면 곁에 서고, 없으면 제 거점으로 돌아간다. */
function escortBack(state, events, load) {
  const c = load.escort;
  if (!c) return;
  load.escort = null;
  const name = COMPANIONS[c.id].name;
  if (state.party.length < partyMax(state) && !state.party.some((x) => x.id === c.id)) { state.party.push(c); pushLine(state, events, { k: 'room', text: `${iGa(name)} ${CARAVAN_LINES.back}` }); }
  else pushLine(state, events, { k: 'room', text: `${eunNeun(name)} ${CARAVAN_LINES.noSeat}` });
  events.push({ type: 'party' });
}
function closeLoad(state, events, row) {
  const cv = state.caravan;
  escortBack(state, events, cv.load);
  cv.load = null;
  cv.past.unshift(row);
  cv.past = cv.past.slice(0, CARAVAN.past);
  events.push({ type: 'trade' });
}

/**
 * 내가 "일"을 한 번 했다 (GD-D3, LV-K9). 가는 짐이 있을 때만 센다. 서른 번이 찰 때마다 짐이 거점 하나를 간다.
 * 거점을 하나 지날 때마다 그 지역의 위험도만큼 짐을 잃을 수 있다(호위가 있으면 절반). 끝 거점에 닿으면 그날 값으로 팔린다.
 */
export function caravanWork(state, events) {
  const cv = state.caravan, load = cv?.load;
  if (!load) return;
  load.work = (load.work || 0) + 1;
  if (load.work < CARAVAN.every) return;
  load.work = 0;
  load.hop += 1;
  const dest = townOf(load.to), here = CARAVAN.band - load.hop, region = BANDS[here - 1].name;
  const risk = (CARAVAN.risk[here] || 0) * (load.escort ? CARAVAN.escort : 1);
  if (roll01(`${state.seed}|caravan|${load.no}|${load.hop}`) < risk) {
    pushLine(state, events, { k: 'sys', who: '상단', text: `${region}의 ${CARAVAN_LINES.lost}`, tone: 'warn' });
    return closeLoad(state, events, { to: load.to, lost: true, day: state.day });
  }
  if (load.hop < dest.hops) { pushLine(state, events, { k: 'sys', who: '상단', text: `${CARAVAN_LINES.hop} 지금 ${region}. ${dest.town}까지 내 일 ${(dest.hops - load.hop) * CARAVAN.every}번.` }); events.push({ type: 'trade' }); return; }
  // 닿았다: 그곳의 그날 값으로 팔리고, 은화는 우편함으로 온다 (GD-D3, GD-H4)
  let silver = 0;
  for (const item of load.items) silver += townPrice(state, item, load.to) * (item.n || 1);
  sendMail(state, { from: `${dest.town}의 짐꾼`, title: `${CARAVAN.town} → ${dest.town} 짐이 팔렸습니다`, body: `${load.items.map((it) => `${label(it)}${(it.n || 1) > 1 ? ` ${it.n}` : ''}`).join(', ')}. ${state.day}일째 값으로 넘겼습니다. 판 값을 부칩니다.`, gift: { silver } });
  pushLine(state, events, { k: 'sys', who: '상단', text: `${dest.town}에 ${CARAVAN_LINES.sold} 은화 ${silver.toLocaleString('en-US')}이 우편함으로 왔다.`, tone: 'mint' });
  events.push({ type: 'mail' });
  closeLoad(state, events, { to: load.to, silver, day: state.day });
}

/** 날이 바뀌었다: 호위로 나간 용병도 하루 삯을 받는다. 못 주면 짐 곁을 떠난다(그 뒤로는 호위 없이 간다). */
export function caravanDay(state, events) {
  const load = state.caravan?.load;
  if (!load?.escort) return;
  if (load.escort.paidDay != null && state.day <= load.escort.paidDay + 1) return; // 첫날 삯은 구할 때 냈다
  const d = COMPANIONS[load.escort.id], fee = d.fee || 0;
  if (state.silver >= fee) { state.silver -= fee; pushLine(state, events, { k: 'sys', text: `호위로 나간 ${d.name}에게 하루 삯 은화 ${fee}을 냈다.` }); return; }
  load.escort = null;
  pushLine(state, events, { k: 'room', text: `${eunNeun(d.name)} ${CARAVAN_LINES.unpaid}` });
}

/**
 * 소문을 듣는다 (GD-D7): 다리 장터와 순례자 숙소에서 주워듣는 그곳의 한 품목. 값은 듣지 못한다. 상단이 없으면 아무 말도 없다.
 * @returns {string|null} 들은 말
 */
export function hearRumor(state) {
  const cv = state.caravan;
  if (!cv) return null;
  const ts = towns().filter((t) => state.dex?.places?.[t.gate]);
  if (!ts.length) return null;
  cv.rumors = (cv.rumors || 0) + 1;
  const t = ts[Math.floor(roll01(`${state.seed}|rumor|town|${state.day}|${cv.rumors}`) * ts.length)];
  // 들리는 것은 구름다리에서 나는 것과, 지금 내가 지닌 팔 만한 것
  const pool = [...new Set(['cloudsilver', 'goatwool', 'goatmeat', ...state.bag.filter(sellable).map((it) => it.id)])];
  const id = pool[Math.floor(roll01(`${state.seed}|rumor|item|${state.day}|${cv.rumors}`) * pool.length)];
  const rate = townRate(state, id, t.band);
  const tone = rate >= CARAVAN.rare ? 'rare' : rate <= CARAVAN.common ? 'common' : 'flat';
  cv.heard[t.band] = { id, tone, day: state.day };
  return `짐꾼들이 그러는데, ${t.town}에서는 ${iGa(short(id))} ${tone === 'rare' ? '귀하다' : tone === 'common' ? '흔하다' : '제값이라'}더라.`;
}
const heardText = (h) => (h ? `${iGa(short(h.id))} ${h.tone === 'rare' ? '귀하다' : h.tone === 'common' ? '흔하다' : '제값이라'}고 들었다` : CARAVAN_LINES.none);

/** "내 상단" 창이 그릴 것 (GD-D1, GD-D2). 상단이 없으면 null. 그곳 값의 숫자는 어디에도 싣지 않는다. */
export function caravanView(state) {
  const cv = state.caravan;
  if (!cv) return null;
  const load = cv.load, dest = load ? townOf(load.to) : null;
  const box = state.store?.[CARAVAN.town]?.items || [];
  const row = (from) => (item, index) => ({ from, index, item, name: label(item), n: item.n || 1, weight: weightOf(item, 1) });
  return {
    here: atMarket(state), loads: CARAVAN.loads, n: load ? 1 : 0, every: CARAVAN.every, weight: CARAVAN.weight, fee: CARAVAN.fee, canPay: state.silver >= CARAVAN.fee,
    load: load ? {
      from: CARAVAN.town, to: dest.town, left: (dest.hops - load.hop) * CARAVAN.every - (load.work || 0),
      items: load.items.map((it) => `${label(it)}${(it.n || 1) > 1 ? ` ${it.n}` : ''}`).join(', '),
      escort: load.escort ? `${COMPANIONS[load.escort.id].title ? `${COMPANIONS[load.escort.id].title} ` : ''}${COMPANIONS[load.escort.id].name}` : '',
      risk: Math.round(riskTo(load.to, { escort: !!load.escort, from: load.hop }) * 100),
    } : null,
    past: cv.past.map((p) => ({ from: CARAVAN.town, to: townOf(p.to).town, lost: !!p.lost, silver: p.silver || 0 })),
    dests: towns().filter((t) => state.dex?.places?.[t.gate]).map((t) => ({ band: t.band, town: t.town, region: t.region, works: t.hops * CARAVAN.every, risk: Math.round(riskTo(t.band) * 100), riskEscort: Math.round(riskTo(t.band, { escort: true }) * 100), heard: heardText(cv.heard[t.band]) })),
    goods: [...state.bag.map(row('bag')), ...box.map(row('box'))].filter((x) => sellable(x.item)),
    escorts: escortsFor(state).map((c) => ({ id: c.id, name: `${COMPANIONS[c.id].title ? `${COMPANIONS[c.id].title} ` : ''}${COMPANIONS[c.id].name}` })),
  };
}
void eulReul;
