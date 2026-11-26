// 가상 유저의 세계: 명단, 날마다 자람, 세계 공지, 최초 발견, 랭킹, 소문 (N6-4 ~ N6-6, Q1-4, F08).
// 가상 유저는 저장하지 않고 씨앗과 날짜로 셈한다. 같은 씨앗·같은 날이면 늘 같다.

import { seedFrom } from './rng.js';
import { pushLine, ding } from './log.js';
import {
  NAME_HEAD, NAME_TAIL, USER_COUNT, STYLES, STYLE_ORDER, RANKS, RANK_AROUND, FIRSTS, DAILY_NEWS,
  RUMORS_ABOUT_ME, RUMORS_HINT, RUMORS_WORLD,
} from '../data/world.js';
import { fameTotal } from './social.js';
import { foundCount } from './hidden.js';
import { iGa } from './ko.js';

const hash = (...parts) => seedFrom(parts.join('|'));
const unit = (...parts) => hash(...parts) / 4294967296;

/** i번째 가상 유저의 이름과 성향. */
export function userBase(state, i) {
  const name = NAME_HEAD[i % NAME_HEAD.length] + NAME_TAIL[Math.floor(i / NAME_HEAD.length) % NAME_TAIL.length];
  const style = STYLE_ORDER[hash(state.seed, 'style', i) % STYLE_ORDER.length];
  return { i, name, style };
}

/** 그 유저가 그날까지 쌓은 것. 날이 갈수록 늘기만 한다 (M8-1). */
export function userAt(state, i, day = state.day) {
  const u = userBase(state, i);
  const st = STYLES[u.style];
  const talent = 0.6 + unit(state.seed, 'talent', i) * 0.9; // 사람마다 빠르기가 다르다
  const head = Math.floor(unit(state.seed, 'head', i) * 6); // 먼저 시작한 사람도 있다
  const d = day + head;
  return {
    ...u, styleName: st.name,
    level: 1 + Math.floor(Math.sqrt(d * st.level * talent * 6)),
    craft: Math.floor(d * st.craft * talent),
    art: Math.floor(d * st.art * talent),
    fame: Math.floor(d * st.fame * talent * 2),
  };
}

// ── 최초 발견 ──

/** 가상 유저가 이것을 스스로 찾아내는 날과 그 사람. */
export function worldFirst(state, key) {
  const f = FIRSTS[key];
  if (!f) return null;
  const day = f.by[0] + (hash(state.seed, 'first', key) % (f.by[1] - f.by[0] + 1));
  return { day, who: userBase(state, hash(state.seed, 'who', key) % USER_COUNT).name };
}

/** 내가 무언가를 찾았다. 세계에서 처음이면 세계 공지에 내 이름이 뜬다. */
export function claim(state, events, key) {
  if (!FIRSTS[key] || state.world.firsts[key]) return false;
  const w = worldFirst(state, key);
  if (w.day < state.day) {
    // 누가 먼저 찾았다. 그 공지는 그날 이미 떴다.
    state.world.firsts[key] = { who: w.who, day: w.day, mine: false };
    return false;
  }
  state.world.firsts[key] = { who: state.name, day: state.day, mine: true };
  state.world.notices.push({ day: state.day, phase: state.phase, key, who: state.name, mine: true });
  const f = FIRSTS[key];
  ding(state, events, { level: 5, kind: 'first', title: `세계 최초: ${f.what ? `${f.what} '${f.name}'` : f.verb.replace('세계에서 처음 ', '')}`, big: '세계 최초', body: '세계 공지에 이름이 떴습니다. 랭킹의 최초 발견에 적힙니다.' });
  events.push({ type: 'world' });
  return true;
}

/** 내가 이미 이룬 것인가(아직 적히지 않았더라도). */
function mineAlready(state, key) {
  const [kind, id] = key.split(':');
  if (kind === 'stat') return (state.hidden[id]?.value || 0) > 0;
  if (kind === 'hq') return !!state.hq[id];
  if (kind === 'job') return state.hjobs[id] === 'taken';
  if (kind === 'boss') return !!state.dmem.ruins?.keeper;
  return false;
}

/** 이 열쇠가 가리키는 히든을 내가 알고 있는가(공지에서 이름을 가릴지 정한다). */
function known(state, key) {
  const [kind, id] = key.split(':');
  if (kind === 'stat') return (state.hidden[id]?.value || 0) > 0;
  if (kind === 'hq') return !!state.hq[id];
  if (kind === 'job') return !!state.hjobs[id];
  return true;
}

/** 공지 한 줄의 글. 내가 아직 못 찾은 히든의 이름은 '???'로 가린다. */
export function noticeText(state, n) {
  if (n.text) return n.text;
  const f = FIRSTS[n.key];
  const name = f.name ? (known(state, n.key) ? f.name : '???') : '';
  return `'${n.who}'님이 ${f.what ? `${f.what} '${name}'${name === '???' ? '를' : josaEul(name)} ` : ''}${f.verb}`;
}
function josaEul(word) {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '을' : '를';
}

/** 날이 바뀔 때: 가상 유저들의 그날 일이 공지에 쌓인다. 누가 무언가를 처음 찾는 날이면 그것도. */
export function worldDay(state, events) {
  const day = state.day;
  for (const key of Object.keys(FIRSTS)) {
    if (state.world.firsts[key]) continue;
    const w = worldFirst(state, key);
    if (w.day !== day) continue;
    if (mineAlready(state, key)) continue; // 날이 넘어가는 바로 그 행동으로 내가 찾았다. 이 행동의 끝에 내 것으로 적힌다
    state.world.firsts[key] = { who: w.who, day, mine: false };
    const n = { day, phase: 0, key, who: w.who, mine: false };
    state.world.notices.push(n);
    pushLine(state, events, { k: 'sys', who: '세계 공지', text: noticeText(state, n) });
  }
  const count = 1 + (hash(state.seed, 'news', day) % 2);
  for (let k = 0; k < count; k++) {
    const u = userAt(state, hash(state.seed, 'newswho', day, k) % USER_COUNT, day);
    const tpl = DAILY_NEWS[hash(state.seed, 'newstpl', day, k) % DAILY_NEWS.length];
    state.world.notices.push({ day, phase: 0, who: u.name, mine: false, text: tpl.replace('{who}', u.name).replace('레벨 {n}이', iGa(`레벨 ${u.level}`)).replace('{n}', 3 + (hash(state.seed, 'n', day, k) % 9)) });
  }
  const over = state.world.notices.length - 200;
  if (over > 0) { state.world.notices.splice(0, over); state.world.seen.notices = Math.max(0, state.world.seen.notices - over); }
  pushLine(state, events, { k: 'sys', who: '세계 공지', text: noticeText(state, state.world.notices.at(-1)) });
  events.push({ type: 'world' });
}

/** 세계 공지 창이 그릴 것: 새것부터. */
export function noticesView(state, limit = 40) {
  return state.world.notices.slice(-limit).reverse().map((n) => ({ day: n.day, text: noticeText(state, n), mine: !!n.mine, first: !!n.key }));
}

// ── 랭킹 (N6-4, N6-5) ──

function myScore(state, id) {
  if (id === 'level') return state.level;
  if (id === 'craft') return state.made || 0;
  if (id === 'art') return state.works.length;
  if (id === 'fame') return fameTotal(state);
  return Object.values(state.world.firsts).filter((f) => f.mine).length;
}
function userScore(state, u, id, firstsBy) {
  if (id === 'first') return firstsBy[u.name] || 0;
  return u[id];
}

/** 랭킹 하나: 맨 위 셋과, 내 순위 위아래. */
export function ranking(state, id) {
  if (!RANKS.some((r) => r.id === id)) throw new Error('모르는 랭킹입니다');
  const firstsBy = {};
  for (const f of Object.values(state.world.firsts)) if (!f.mine) firstsBy[f.who] = (firstsBy[f.who] || 0) + 1;
  const rows = [];
  for (let i = 0; i < USER_COUNT; i++) { const u = userAt(state, i); rows.push({ name: u.name, score: userScore(state, u, id, firstsBy), me: false }); }
  rows.push({ name: state.name, score: myScore(state, id), me: true });
  rows.sort((a, b) => b.score - a.score || (a.me ? -1 : b.me ? 1 : a.name.localeCompare(b.name, 'ko')));
  rows.forEach((r, i) => { r.rank = i + 1; });
  const mine = rows.findIndex((r) => r.me);
  const top = rows.slice(0, 3);
  const around = rows.slice(Math.max(0, mine - RANK_AROUND), mine + RANK_AROUND + 1);
  return { id, name: RANKS.find((r) => r.id === id).name, total: rows.length, myRank: mine + 1, top, around };
}

// ── 소문 (F08-03, Q4-5) ──

/** 하루하루 무엇을 했는지 적는다(소문의 재료). dispatch가 끝날 때 부른다. */
export function trackDay(state, action) {
  const w = state.world;
  if (w.today.day !== state.day) {
    // 어제 한 일로 며칠째 이어 했는지를 고친다
    for (const act of new Set([...Object.keys(w.streak), ...Object.keys(w.today.acts)])) w.streak[act] = w.today.acts[act] ? (w.streak[act] || 0) + 1 : 0;
    w.today = { day: state.day, acts: {} };
  }
  const id = action.type === 'act' ? action.id : action.type === 'hammer' || action.type === 'cut' ? action.type : null;
  if (id) w.today.acts[id] = (w.today.acts[id] || 0) + 1;
}

function rumorTrue(state, when) {
  if (when.streak) return (state.world.streak[when.streak[0]] || 0) + (state.world.today.acts[when.streak[0]] ? 1 : 0) >= when.streak[1];
  if (when.act) return (state.counters.act[when.act[0]] || 0) >= when.act[1];
  if (when.statue) return state.works.some((x) => x.where === 'plaza');
  if (when.first) return !!state.world.firsts[when.first]?.mine;
  if (when.falls) return state.falls >= when.falls;
  if (when.keeper) return !!state.dmem.ruins?.keeper;
  if (when.hitRun) return !!state.flags.hitRun;
  return false;
}

/** 소문 게시판이 그릴 것: 나에 대한 소문, 오늘의 귀띔 둘, 세상 이야기 하나. */
export function rumorsView(state) {
  const mine = RUMORS_ABOUT_ME.filter((r) => rumorTrue(state, r.when)).map((r) => ({ id: r.id, text: r.text.replace('{name}', state.name), about: 'me' }));
  const day = state.day;
  const a = hash(state.seed, 'rumor', day) % RUMORS_HINT.length;
  const b = (a + 1 + (hash(state.seed, 'rumor2', day) % (RUMORS_HINT.length - 1))) % RUMORS_HINT.length;
  const hints = [RUMORS_HINT[a], RUMORS_HINT[b]].map((r) => ({ id: `hint-${r.stat}`, text: r.text, about: 'hint', stat: r.stat }));
  const world = [{ id: 'world', text: RUMORS_WORLD[hash(state.seed, 'rumorw', day) % RUMORS_WORLD.length], about: 'world' }];
  return [...mine, ...hints, ...world];
}

/** 게시판을 읽는다: 귀띔은 상태창의 그 칸에 적힌다(이름은 여전히 모른다). */
export function readRumors(state, events) {
  const list = rumorsView(state);
  for (const r of list) {
    if (r.about !== 'hint') continue;
    const hints = state.hints[r.stat] || (state.hints[r.stat] = []);
    if (!hints.includes(r.text)) { hints.push(r.text); state.memo = r.text; }
  }
  if (state.flags.extraRumor) { // 떠돌이 악사는 소문을 하나 더 듣는다
    const extra = RUMORS_HINT[(hash(state.seed, 'rumor3', state.day)) % RUMORS_HINT.length];
    const hints = state.hints[extra.stat] || (state.hints[extra.stat] = []);
    if (!hints.includes(extra.text)) hints.push(extra.text);
  }
  state.world.rumorDay = state.day;
  pushLine(state, events, { k: 'me', text: '소문 게시판을 읽었다.' });
  events.push({ type: 'world' });
  return list;
}

// ── 지난번 이후 (F09-03) ──

/** 이어 할 때 먼저 보이는 요약: 하던 일과, 지난번에 본 뒤로 생긴 일. */
export function sinceLast(state) {
  const w = state.world;
  const notices = w.notices.slice(w.seen.notices).filter((n) => n.key || n.mine).map((n) => noticeText(state, n));
  const deals = (state.auction?.history || []).slice(w.seen.deals).map((d) => d.text);
  const rumors = RUMORS_ABOUT_ME.filter((r) => rumorTrue(state, r.when) && !w.seen.rumors.includes(r.id)).map((r) => r.text.replace('{name}', state.name));
  return { notices, deals, rumors, found: foundCount(state) };
}

/** 요약을 보았다. 다음에는 그 뒤의 일만 보인다. */
export function markSeen(state) {
  const w = state.world;
  w.seen.notices = w.notices.length;
  w.seen.deals = (state.auction?.history || []).length;
  for (const r of RUMORS_ABOUT_ME) if (rumorTrue(state, r.when) && !w.seen.rumors.includes(r.id)) w.seen.rumors.push(r.id);
}

export function worldFields() {
  return { world: { notices: [], firsts: {}, today: { day: 1, acts: {} }, streak: {}, rumorDay: 0, seen: { notices: 0, deals: 0, rumors: [] } } };
}
