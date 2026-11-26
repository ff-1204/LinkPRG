// 우편함 (Z59): 편지가 오고, 읽고, 붙은 것을 받는다.
import { MAILS, mailById } from '../data/mail.js?v=9c14cbd';
import { pushLine } from './log.js?v=9c14cbd';
import { addItem } from './inventory.js?v=9c14cbd';
import { itemDef } from '../data/items.js?v=9c14cbd';

export function mailFields() {
  return { mail: { got: [] } };
}

/** 아직 오지 않은 편지를 우편함에 넣는다. 캐릭터마다 한 번. 새로 온 것의 수를 돌려준다. */
export function deliverMail(state, events = null) {
  if (!state.mail || !Array.isArray(state.mail.got)) state.mail = { got: [] };
  let n = 0;
  for (const m of MAILS) {
    if (state.mail.got.some((x) => x.id === m.id)) continue;
    state.mail.got.push({ id: m.id, day: state.day || 1, read: false, taken: !m.gift });
    n++;
  }
  if (n && events) pushLine(state, events, { k: 'sys', text: '우편함에 편지가 왔다.' });
  return n;
}

export function unreadMail(state) {
  return (state.mail?.got || []).filter((x) => !x.read || !x.taken).length;
}

/** 우편함 창이 그릴 것: 새것부터. */
export function mailView(state) {
  return (state.mail?.got || []).slice().reverse().map((x) => {
    const m = mailById(x.id);
    if (!m) return null;
    const gift = m.gift ? [m.gift.silver ? `은화 ${m.gift.silver}` : null, ...(m.gift.items || []).map(([id, n]) => `${itemDef(id).name} ${n}`)].filter(Boolean).join(', ') : '';
    return { id: x.id, from: m.from, title: m.title, body: m.body, day: x.day, read: x.read, taken: x.taken, gift };
  }).filter(Boolean);
}

export function readMail(state, id) {
  const x = state.mail?.got.find((y) => y.id === id);
  if (!x) throw new Error('우편함에 없는 편지입니다');
  x.read = true;
}

/** 붙은 것을 받는다. 한 번만. */
export function takeMail(state, events, id) {
  const x = state.mail?.got.find((y) => y.id === id);
  const m = mailById(id);
  if (!x || !m) throw new Error('우편함에 없는 편지입니다');
  if (!m.gift) throw new Error('붙은 것이 없습니다');
  if (x.taken) throw new Error('이미 받았습니다');
  x.read = true;
  x.taken = true;
  const parts = [];
  if (m.gift.silver) { state.silver += m.gift.silver; parts.push(`은화 ${m.gift.silver}`); }
  for (const [itemId, n] of m.gift.items || []) { addItem(state, itemId, n); parts.push(`${itemDef(itemId).name} ${n}`); }
  pushLine(state, events, { k: 'sys', tone: 'good', text: `${m.from}의 편지에서 ${parts.join(', ')}을 받았다.` });
  events.push({ type: 'mail' });
}
