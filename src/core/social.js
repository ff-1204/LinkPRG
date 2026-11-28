// 사람들과의 사이, 명성, 칭호, 대화 판정 (E25~E28, G3-1, T10~T14).

import { tentHere } from '../data/anvil.js?v=0cf2820';

import { next, pick, roll01 } from './rng.js?v=0cf2820';
import { pushLine, ding } from './log.js?v=0cf2820';
import { PEOPLE, PEOPLE_ORDER, BONDS, GIFT, TALK_POINT, FAME, TITLES, personById, REGULAR, CALLS } from '../data/people.js?v=0cf2820';
import { itemDef } from '../data/items.js?v=0cf2820';
import { removeAt } from './inventory.js?v=0cf2820';
import { placeById, ACTIONS } from '../data/places.js?v=0cf2820';
import { ROLE_BONUS, fullRoles } from '../data/companions.js?v=0cf2820';
import { iGa, eulReul, ro, eunNeun } from './ko.js?v=0cf2820';
import { TALKS } from '../data/talks.js?v=0cf2820';
import { rootOf } from '../data/origins.js?v=0cf2820';
import { smithMemory } from './memories.js?v=0cf2820';
import { hasTitle } from './titles.js?v=0cf2820';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function rec(state, id) {
  return state.people[id] || (state.people[id] = { pts: 0, talked: 0, likes: [], dislikes: [], stats: [], met: false });
}

/** 사이의 단계 번호 0~4. */
export function bondOf(state, id) {
  const pts = state.people[id]?.pts || 0;
  let i = 0;
  for (let k = 0; k < BONDS.length; k++) if (pts >= BONDS[k].at) i = k;
  return i;
}
export const bondName = (state, id) => BONDS[bondOf(state, id)].name;

/** 이 곳에 있는 사람들. */
export function peopleHere(state) {
  // 일곱 천막에는 내가 푼 길의 사람만 와 있다 (CM-C)
  return PEOPLE_ORDER.filter((id) => PEOPLE[id].place === state.place && !(PEOPLE[id].tent && !tentHere(state, id)) && !(PEOPLE[id].until && state.quests[PEOPLE[id].until]?.done) && !(state.party || []).some((c) => c.id === id)).map((id) => PEOPLE[id]);
}

function mustBeHere(state, id) {
  const p = personById(id);
  if (p.place !== state.place || (p.tent && !tentHere(state, id)) || (p.until && state.quests[p.until]?.done) || (state.party || []).some((c) => c.id === id)) throw new Error(`${eunNeun(p.name)} 여기에 없습니다`);
  return p;
}

export function addPoints(state, events, id, n) {
  const p = personById(id);
  const r = rec(state, id);
  const before = bondOf(state, id);
  r.pts = Math.max(0, r.pts + n);
  const after = bondOf(state, id);
  if (after > before) {
    ding(state, events, {
      level: after >= 3 ? 3 : 2, kind: 'bond', title: `${p.name}${josaWa(p.name)} ${iGa(`'${BONDS[after].name}'`)} 되었습니다`,
      big: BONDS[after].name, body: `${p.name}의 말투가 달라집니다.${['smith', 'granny'].includes(id) ? ` 이 사람에게 사는 값이 ${Math.round(BONDS[after].cut * 100)}% 깎입니다.` : ''}`,
    });
  } else if (after < before) {
    pushLine(state, events, { k: 'sys', text: `${p.name}${josaWa(p.name)} 사이가 ${ro(`'${BONDS[after].name}'`)} 내려갔다.`, tone: 'warn' });
  }
  return after;
}

function josaWa(word) {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '과' : '와';
}

/** 첫마디: 사이, 명성, 메인 퀘스트로 얻은 부르는 말에 따라 달라진다 (Q2-2). */
export function helloOf(state, id) {
  const p = personById(id);
  const b = bondOf(state, id);
  const fame = FAME[fameRank(state)];
  const called = state.main?.called;
  let text = p.hello[b];
  if (b === 0 && fame.hello) text = `${fame.hello} ${text}`;
  // 이름을 부른다 (Z39): 낯익은 사이는 별명이 있으면 별명으로, 단골부터는 이름으로
  if (b === 1 && called) text = `${called}, ${text}`;
  else if (b >= 1) text = withName(state, id, text);
  return text;
}

/** 이름 끝 받침이 있는가. 한글이 아니면 null. */
function nameJong(name) {
  const code = name.codePointAt(name.length - 1);
  return code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 > 0 : null;
}

/** 이 사람이 내 이름을 부르는 말. 사이가 벗부터면 정다운 꼴이다. 남이면 null. */
export function callName(state, id) {
  const b = bondOf(state, id);
  const forms = CALLS[id];
  if (b < 1 || !forms) return null;
  const n = state.name;
  const j = nameJong(n);
  const ya = j === null ? `${n},` : `${n}${j ? '아' : '야'},`;
  const yadot = j === null ? `${n}.` : `${n}${j ? '아' : '야'}.`;
  const form = forms[b >= 3 ? 1 : 0];
  return { dot: `${n}.`, comma: `${n},`, ya, yadot, ssi: `${n} 씨,`, 'ssi!': `${n} 씨!`, nim: `${n} 님,`, yangban: `${n} 양반,`, jane: `${n} 자네,`, uri: `우리 ${n},` }[form];
}

/** 말 앞에 이름을 붙인다. */
export function withName(state, id, text) {
  const call = callName(state, id);
  return call ? `${call} ${text}` : text;
}

/** 이야기 중에 이름을 부르는가: 단골은 셋에 하나, 벗부터는 둘에 하나쯤. */
export function callsInTalk(state, id) {
  const b = bondOf(state, id);
  if (b < 2) return false;
  const r = roll01(`${state.seed}|call|${id}|${state.day}|${state.people[id]?.talked || 0}|${state.tick}`);
  return r < (b >= 3 ? 0.5 : 1 / 3);
}

/** 말을 건다. 첫마디를 듣는다. 만난 사람으로 적힌다(매력의 재료). */
export function greet(state, events, id) {
  const p = mustBeHere(state, id);
  const r = rec(state, id);
  r.met = true;
  if (spokeToday(state, id) && !state.counters.npcs.includes(id)) state.counters.npcs.push(id);
  // 먼저 말을 걸어오지 않은 사람은 아직 대꾸하지 않는다
  if (spokeToday(state, id)) pushLine(state, events, { k: 'npc', who: p.name, text: helloOf(state, id) });
  else pushLine(state, events, { k: 'room', text: `${eunNeun(p.name)} 힐끗 보고는 하던 일로 돌아간다.` });
}

/** 먼저 말을 걸 확률: 사이가 가까울수록 높고, 그날 그곳에서 일한 만큼 오른다. */
export const SPEAK_BASE = [0.05, 0.15, 0.30]; // 남, 낯익은 사이, 단골. 벗부터는 들어서면 바로 말을 건다
export const SPEAK_STEP = 0.03; // 그곳에 맞는 일을 한 번 할 때마다
export const WORK_PER_POINT = 10; // 그곳에 맞는 일 열 번에 친밀도 +1 (그날 다음 것은 스무 번 더, 서른 번 더…)
/** 오늘 이곳에서 n번 일했을 때까지 일로 오른 친밀도. 열 번에 하나, 다음은 스무 번 더, 그다음은 서른 번 더. 상한은 없다. */
export function workPoints(n) {
  let k = 0;
  while (WORK_PER_POINT * (k + 1) * (k + 2) / 2 <= n) k += 1;
  return k;
}
const FRIEND = 3; // '벗'의 번호

/** 오늘 그 사람이 먼저 말을 걸어왔는가. 그래야 이야기를 들을 수 있다. */
export function spokeToday(state, id) {
  return !!state.flags.spoke && state.flags.spoke[id] === state.day;
}

function speak(state, events, p) {
  if (!state.flags.spoke) state.flags.spoke = {};
  state.flags.spoke[p.id] = state.day;
  pushLine(state, events, { k: 'room', text: `${iGa(p.name)} 이쪽을 보더니 먼저 말을 건다.` });
  pushLine(state, events, { k: 'npc', who: p.name, text: helloOf(state, p.id) });
  events.push({ type: 'people' });
}

/** 지금 그 사람이 말을 걸 확률(화면에는 보이지 않는다). n: 오늘 이곳에서 한, 이곳에 맞는 일의 수. */
const SMITHS = ['smith', 'master', 'shipwright'];
export function speakChance(state, id, n) {
  const b = bondOf(state, id);
  if (b >= FRIEND) return 1;
  const root = rootOf(state.origin);
  let c = SPEAK_BASE[b] + SPEAK_STEP * Math.max(0, n - 1);
  if (root === 'farmer' && placeById(state.place).town === '시작 마을') c += 0.10; // 땅의 사람: 마을 사람들이 편하게 대한다
  if (root === 'fallen' && ['eye', 'elder'].includes(id) && state.day <= 30) c *= 0.5; // 이름 있는 사람: 나쁘게 아는 사람도 있다
  return Math.min(1, c);
}

/**
 * 사람들은 제 자리에서 제 일을 하는 이를 본다 (Z8).
 * kind 'enter': 그곳에 들어섰다. 벗 이상이거나, 일할 거리가 없는 곳(가게, 회관, 종루)이면 바로 말을 건다.
 * kind 'fit': 그곳에 맞는 일(치기, 망치질, 칼질, 사고팔기 같은 것)을 한 번 했다. 할수록 말을 걸 확률이 오르고, 열 번마다 친밀도가 1 오른다.
 * 주사위는 씨앗·날·곳·횟수로만 정해져, 다른 난수의 흐름을 건드리지 않는다.
 */
export function workedHere(state, events, kind = 'fit') {
  const here = peopleHere(state);
  if (!here.length) return;
  const w = state.flags.workHere;
  if (!w || w.place !== state.place || w.day !== state.day) state.flags.workHere = { place: state.place, day: state.day, n: 0 };
  const x = state.flags.workHere;
  const idle = !placeById(state.place).actions.some((act) => !ACTIONS[act].open && !ACTIONS[act].rest && !ACTIONS[act].service && !ACTIONS[act].chore);
  if (kind === 'enter') {
    const smithy = rootOf(state.origin) === 'smithboy';
    for (const p of here) if (!spokeToday(state, p.id) && (idle || bondOf(state, p.id) >= FRIEND || (smithy && SMITHS.includes(p.id)))) speak(state, events, p);
    return;
  }
  x.n += 1;
  // 일하는 모습이 쌓여 사이가 가까워진다. 선물과 이야기보다는 느리다
  if (workPoints(x.n) > workPoints(x.n - 1)) {
    for (const p of here) {
      rec(state, p.id).met = true;
      addPoints(state, events, p.id, 1);
    }
  }
  for (const p of here) {
    if (spokeToday(state, p.id)) continue;
    const roll = roll01(`${state.seed}|speak|${state.day}|${state.place}|${p.id}|${x.n}`);
    if (roll < speakChance(state, p.id, x.n)) { speak(state, events, p); break; } // 한 번에 한 사람만
  }
}

/** 들은 힌트를 모아 둔다(퀘스트 창의 "들은 말"). 같은 말은 한 번만. */
export function rememberHint(state, who, text, chapter) {
  if (!state.lore) state.lore = { hints: [] };
  if (state.lore.hints.some((h) => h.text === text)) return;
  state.lore.hints.push({ who, text, ch: chapter, day: state.day });
}

/**
 * 이야기 한 줄을 고른다 (Z26). 처음에는 내 뿌리를 알아보는 말. 그다음은
 * 아직 안 들은 이번 장의 힌트 → 아직 안 들은 상식 → 나머지(잡담·속마음·때·출신)를 섞어서. 같은 줄은 연달아 나오지 않는다.
 */
export function talkLine(state, id) {
  const p = personById(id);
  const t = TALKS[id];
  if (!t) return { kind: 'chat', text: pick(state, p.talk) };
  const r = rec(state, id);
  if (!Array.isArray(r.heard)) r.heard = [];
  const root = rootOf(state.origin);
  const ch = Math.min(5, state.ending ? 5 : state.main?.chapter || 1);
  const bond = bondOf(state, id);
  const night = state.phase === 2;
  const all = [];
  t.chat.forEach((x, i) => all.push({ kind: 'chat', key: `c${i}`, text: x }));
  t.tip.forEach((x, i) => all.push({ kind: 'tip', key: `t${i}`, text: x }));
  (t.hint[ch] || []).forEach((x, i) => all.push({ kind: 'hint', key: `h${ch}-${i}`, text: x }));
  if (bond >= REGULAR) t.close.forEach((x, i) => all.push({ kind: 'close', key: `s${i}`, text: x }));
  (t.time[night ? 'night' : 'day'] || []).forEach((x, i) => all.push({ kind: 'time', key: `${night ? 'n' : 'd'}${i}`, text: x }));
  if (t.root[root]) all.push({ kind: 'root', key: 'r', text: t.root[root] });
  let line = null;
  if (!r.heard.includes('r') && t.root[root]) line = all.find((x) => x.kind === 'root');
  const fresh = (k) => all.filter((x) => x.kind === k && !r.heard.includes(x.key));
  if (!line) line = fresh('hint')[0] || fresh('tip')[0];
  if (!line) {
    const rest = all.filter((x) => x.kind !== 'hint' && x.kind !== 'tip' && x.key !== r.lastLine);
    line = pick(state, rest.length ? rest : all);
  }
  if (!r.heard.includes(line.key)) r.heard.push(line.key);
  r.lastLine = line.key;
  if (line.kind === 'hint') rememberHint(state, p.name, line.text, ch);
  return line;
}

/** 이야기를 듣는다. 하루에 한 번은 사이가 조금 가까워진다. 그 사람이 먼저 말을 걸어온 날에만 된다. */
export function talk(state, events, id) {
  const p = mustBeHere(state, id);
  if (!spokeToday(state, id)) throw new Error(`${iGa(p.name)} 아직 말을 걸어오지 않았습니다. 이곳에서 할 일을 하다 보면 먼저 말을 겁니다`);
  const r = rec(state, id);
  r.met = true;
  if (!state.counters.npcs.includes(id)) state.counters.npcs.push(id);
  if (smithMemory(state, events, id)) { events.push({ type: 'social' }); return; } // 옛 인연: 정을 돌려드렸다
  pushLine(state, events, { k: 'me', text: `${p.name}의 이야기를 들었다.` });
  const line = talkLine(state, id);
  pushLine(state, events, { k: 'npc', who: p.name, text: callsInTalk(state, id) ? withName(state, id, line.text) : line.text, tone: line.kind === 'hint' || line.kind === 'close' ? 'mint' : undefined });
  if (r.talked !== state.day) {
    r.talked = state.day;
    addPoints(state, events, id, TALK_POINT + (hasTitle(state, 'neighbor') ? 1 : 0));
  }
  events.push({ type: 'social' });
}

export const DRINK_HOSTS = ['keeper', 'innkeeper', 'hostess'];
/** 길의 사람: 주점·주막·여인숙에서 하루 한 번 한 잔 얻어 마신다. 포만감 +10, 피로 −10, 이야기 한 줄. */
export function drink(state, events, id) {
  const p = mustBeHere(state, id);
  if (rootOf(state.origin) !== 'bard') throw new Error('얻어 마실 사이가 아닙니다');
  if (!DRINK_HOSTS.includes(id)) throw new Error('술을 파는 곳이 아닙니다');
  if (state.flags.drinkDay === state.day) throw new Error('오늘은 이미 한 잔 얻어 마셨습니다');
  state.flags.drinkDay = state.day;
  state.full = Math.min(100, state.full + 10);
  state.tired = Math.max(0, (state.tired || 0) - 10);
  pushLine(state, events, { k: 'npc', who: p.name, text: '떠도는 사람 목은 늘 마르지. 이건 내가 사네.' });
  pushLine(state, events, { k: 'sys', text: '한 잔 얻어 마셨다. 포만감 +10, 피로 −10.' });
  const line = talkLine(state, id);
  pushLine(state, events, { k: 'npc', who: p.name, text: line.text, tone: line.kind === 'hint' ? 'mint' : undefined });
  events.push({ type: 'social' });
}

/** 선물한다. 좋아하는지 싫어하는지는 줘 봐야 안다 (E27). */
export function gift(state, events, id, index) {
  const p = mustBeHere(state, id);
  const item = state.bag[index];
  if (!item) throw new Error('가방에 없는 물건입니다');
  const def = itemDef(item.id);
  if (def.kind === 'quest') throw new Error('퀘스트 물건은 줄 수 없습니다');
  const r = rec(state, id);
  if (r.gifted === state.day) throw new Error('오늘은 이미 선물했습니다. 선물은 한 사람에게 하루에 한 번입니다');
  r.gifted = state.day;
  r.met = true;
  if (!state.counters.npcs.includes(id)) state.counters.npcs.push(id);
  removeAt(state, index, 1);
  // 바티루스의 눈물 (Z105): 좋아하고 싫어하고를 가리지 않고 정해진 만큼 가까워진다
  if (def.charm) {
    pushLine(state, events, { k: 'me', text: `${p.name}에게 ${eulReul(def.name)} 건넸다.` });
    pushLine(state, events, { k: 'npc', who: p.name, text: '…이상하군. 자네가 오늘따라 반갑네.', tone: 'mint' });
    addPoints(state, events, id, def.charm);
    events.push({ type: 'social' });
    return { like: false, dislike: false, charm: true };
  }
  const like = p.likes.includes(item.id);
  const dislike = p.dislikes.includes(item.id);
  pushLine(state, events, { k: 'me', text: `${p.name}에게 ${eulReul(def.name)} 건넸다.` });
  if (like) {
    if (!r.likes.includes(item.id)) r.likes.push(item.id);
    pushLine(state, events, { k: 'npc', who: p.name, text: `${def.name}! 이걸 어떻게 알고.`, tone: 'mint' });
  } else if (dislike) {
    if (!r.dislikes.includes(item.id)) r.dislikes.push(item.id);
    pushLine(state, events, { k: 'npc', who: p.name, text: `…${eulReul(def.name)} 왜 나한테.` });
  } else {
    pushLine(state, events, { k: 'npc', who: p.name, text: '고맙네. 잘 쓰지.' });
  }
  const charm = state.hidden.charm?.value || 0;
  const base = like ? GIFT.like : dislike ? GIFT.dislike : GIFT.plain;
  addPoints(state, events, id, base > 0 ? Math.round(base * (1 + charm * 0.02)) : base);
  events.push({ type: 'social' });
  return { like, dislike };
}

/** 퀘스트 같은 데서 사이를 올리거나 내린다. */
export function bondBy(state, events, id, n) {
  rec(state, id).met = true;
  return addPoints(state, events, id, n);
}

// ── 명성 ──

/** 지금 있는 마을. 마을 밖이면 그 곳이 딸린 마을(없으면 시작 마을). */
export function townOf(state) {
  const p = placeById(state.place);
  return p.wild ? p.near || '시작 마을' : p.town;
}
export function fameOf(state, town = townOf(state)) {
  return state.fame[town] || 0;
}
export function fameRank(state, town = townOf(state)) {
  const f = fameOf(state, town);
  let i = 0;
  for (let k = 0; k < FAME.length; k++) if (f >= FAME[k].at) i = k;
  return i;
}
export function fameTotal(state) {
  return Object.values(state.fame).reduce((a, x) => a + x, 0);
}
export function addFame(state, events, n, town = townOf(state)) {
  const before = fameRank(state, town);
  state.fame[town] = Math.max(0, fameOf(state, town) + n);
  const after = fameRank(state, town);
  if (after > before) ding(state, events, { level: 2, kind: 'fame', title: `${town}에서 ${iGa(`'${FAME[after].name}'`)} 되었습니다`, big: FAME[after].name, body: `이 마을에서 사는 값이 ${Math.round(FAME[after].cut * 100)}% 깎이고, 사람들의 첫마디가 달라집니다.` });
}

// ── 칭호 ──

export function grantTitle(state, events, id, why) {
  const t = TITLES[id];
  if (!t) throw new Error('모르는 칭호: ' + id);
  if (state.titles.some((x) => x.id === id)) return false;
  state.titles.push({ id, day: state.day, why });
  ding(state, events, { level: 3, kind: 'title', title: `칭호 ${iGa(`'${t.name}'`)} 생겼습니다`, big: t.name, body: `${t.effect}. 칭호는 하나만 달 수 있고, 마을에서만 바꿉니다.`, reason: why });
  return true;
}

/** 칭호를 단다(null이면 뗀다). 마을에서만 바꾼다 (G3-1). */
export function wearTitle(state, events, id) {
  if (placeById(state.place).wild) throw new Error('칭호는 마을에서만 바꿀 수 있습니다');
  if (id !== null && !state.titles.some((x) => x.id === id)) throw new Error('얻지 못한 칭호입니다');
  state.title = id;
  pushLine(state, events, { k: 'me', text: id ? `칭호 ${eulReul(`'${TITLES[id].name}'`)} 달았다.` : '칭호를 뗐다.' });
  events.push({ type: 'social' });
}

/** 칭호창이 그릴 것. 못 얻은 것은 "???"와 귀띔만 (G3-2). */
export function titleView(state) {
  return Object.entries(TITLES).map(([id, t]) => {
    const got = state.titles.find((x) => x.id === id);
    return got ? { id, got: true, name: t.name, effect: t.effect, why: got.why, day: got.day, worn: state.title === id } : { id, got: false, hint: t.hint };
  });
}

// ── 값 ──

/** 이 곳에서 살 때 값이 깎이는 몫과 그 까닭들 (E25). */
export function discountOf(state, keeperId = null) {
  const why = [];
  let rate = 0;
  const place = placeById(state.place);
  if (keeperId && bondOf(state, keeperId) > 0) { const b = BONDS[bondOf(state, keeperId)]; rate += b.cut; why.push(b.name); }
  const fame = FAME[fameRank(state, townOf(state))];
  if (fame.cut) { rate += fame.cut; why.push(fame.name); }
  for (const t of state.titles || []) { const title = TITLES[t.id]; if (title?.cut && place.town === '시작 마을') { rate += title.cut; why.push(title.name); } }
  if (state.work === 'smith' && state.place === 'forge') { rate += 0.1; why.push('대장간 식구'); }
  if (state.work === 'tailor' && state.place === 'tailor') { rate += 0.1; why.push('의류점 식구'); }
  if (state.work === 'chef' && state.place === 'kitchen') { rate += 0.1; why.push('주방 식구'); }
  return { rate: Math.min(0.5, rate), why: why.join(', ') };
}

// ── 대화 판정 (T10~T14) ──

export const CHECKS = {
  persuade: { name: '설득', mine: '매력', theirs: 'will', theirName: '고집' },
  threat: { name: '위협', mine: '힘', theirs: 'guts', theirName: '배짱' },
  trick: { name: '속임', mine: '지혜', theirs: 'eye', theirName: '눈썰미' },
};

function myScore(state, kind) {
  if (kind === 'persuade') return 10 + (state.hidden.charm?.value || 0) * 2;
  if (kind === 'threat') return state.stats.str;
  return state.stats.wis + 3; // 지혜는 바탕이 낮아 조금 보탠다
}

/** 막는 사람·때리는 사람·고치는 사람이 고루 있으면 모든 판정 +5% (T26). */
function teamBonus(state) {
  return fullRoles(state.job, state.party) ? ROLE_BONUS : 0; // 고루 갖춘 일행 (T26, BM-C2)
}

/** 성공 확률. 고르기 전에 보인다 (T13). 50% + 차이 × 5%. */
export function checkChance(state, kind, npcId) {
  const c = CHECKS[kind];
  if (!c) throw new Error('모르는 판정: ' + kind);
  const p = personById(npcId);
  let chance = 0.5 + (myScore(state, kind) - p.stats[c.theirs]) * 0.05 + teamBonus(state);
  if (kind === 'persuade') {
    if (state.flags.persuade10) chance += 0.10;
    if (hasTitle(state, 'helper')) chance += 0.05;
  }
  if (kind === 'threat') chance += (state.hidden.nerve?.value || 0) * 0.01;
  if (kind === 'trick' && state.flags.trick10) chance += 0.10; // 약장수의 조수
  return clamp(chance, 0.05, 0.95);
}

/**
 * 판정을 굴린다. 주사위(1~100)가 필요한 값 이하면 성공. 결과와 주사위 값을 보여 준다 (T10).
 * 겪어 본 상대의 스탯은 도감에 적힌다 (T14).
 */
export function rollCheck(state, events, kind, npcId) {
  const c = CHECKS[kind];
  const p = personById(npcId);
  const need = Math.round(checkChance(state, kind, npcId) * 100);
  const roll = 1 + Math.floor(next(state) * 100);
  const ok = roll <= need;
  const r = rec(state, npcId);
  if (!r.stats.includes(c.theirs)) r.stats.push(c.theirs);
  pushLine(state, events, { k: 'sys', who: '판정', text: `${c.name} ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공. (${p.name}의 ${c.theirName} ${p.stats[c.theirs]})` });
  events.push({ type: 'check', kind, ok, roll, need });
  return { ok, roll, need };
}

/** 도감의 사람 갈래: 겪은 만큼만 (G3-5, E27, T14). */
export function peopleDex(state) {
  return PEOPLE_ORDER.filter((id) => state.people[id]?.met).map((id) => {
    const p = PEOPLE[id];
    const r = state.people[id];
    return {
      id, name: p.name, place: placeById(p.place).name, bond: BONDS[bondOf(state, id)].name,
      likes: r.likes.map((x) => itemDef(x).name), dislikes: r.dislikes.map((x) => itemDef(x).name),
      stats: Object.values(CHECKS).filter((c) => r.stats.includes(c.theirs)).map((c) => `${c.theirName} ${p.stats[c.theirs]}`),
    };
  });
}

