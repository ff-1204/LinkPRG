// 저장 (G4-1, G4-2). 칸 셋, 저절로 저장, 되감는 저장 없음, 파일로 내보내기.
// 저장소(storage)는 getItem/setItem/removeItem만 있으면 된다. 테스트에서는 가짜를 쓴다.

import { SAVE_VERSION, migrate } from './migrate.js?v=d58cb06';
import { PHASES, PLACES } from '../data/places.js?v=d58cb06';
import { ITEMS } from '../data/items.js?v=d58cb06';
import { MONSTERS } from '../data/monsters.js?v=d58cb06';
import { originById } from '../data/origins.js?v=d58cb06';
import { jobDef, HIDDEN_JOBS, ADVANCED } from '../data/jobs.js?v=d58cb06';
import { RECIPES } from '../data/recipes.js?v=d58cb06';
import { JOBS, SUBS, HIDDENS } from '../data/quests.js?v=d58cb06';
import { INCIDENTS } from '../data/wild.js?v=d58cb06';
import { DUNGEONS } from '../data/dungeon.js?v=d58cb06';
import { FIRSTS } from '../data/world.js?v=d58cb06';
import { COMPANIONS } from '../data/companions.js?v=d58cb06';
import { SUBJECTS } from '../data/works.js?v=d58cb06';
import { PEOPLE } from '../data/people.js?v=d58cb06';

export const SLOT_COUNT = 3;
const KEY = (slot) => `ttiring.save.${slot}`;

function checkSlot(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) throw new Error('저장 칸은 0부터 2까지입니다');
}

/** 다른 창(탭)이 이 칸을 먼저 고쳤을 때 던진다. 옛 상태로 덮어써서 되감는 일을 막는다. */
export class SaveConflict extends Error {
  constructor() {
    super('다른 창에서 이 저장을 먼저 고쳤습니다');
    this.name = 'SaveConflict';
  }
}

/** 그 칸에 몇 번째로 쓴 저장이 들어 있는지. 비었으면 0, 읽을 수 없으면 -1. */
export function revOf(storage, slot) {
  checkSlot(slot);
  const raw = storage.getItem(KEY(slot));
  if (!raw) return 0;
  try {
    const rev = JSON.parse(raw).rev;
    return Number.isInteger(rev) ? rev : 1;
  } catch {
    return -1;
  }
}

/**
 * 상태를 그 칸에 덮어쓴다. 지난 저장은 남기지 않는다(되감기 없음).
 * expectRev를 주면, 칸에 든 저장이 그 번호가 아닐 때 쓰지 않고 SaveConflict를 던진다.
 * @returns {number} 새로 쓴 저장의 번호
 */
export function saveTo(storage, slot, state, now = Date.now(), expectRev = null) {
  checkSlot(slot);
  const cur = revOf(storage, slot);
  if (expectRev !== null && cur !== expectRev) throw new SaveConflict();
  const rev = Math.max(cur, 0) + 1;
  storage.setItem(KEY(slot), JSON.stringify({ v: SAVE_VERSION, rev, savedAt: now, state }));
  return rev;
}

/** 그 칸의 상태. 비었으면 null. 읽을 수 없으면 까닭을 던진다. */
export function loadFrom(storage, slot) {
  checkSlot(slot);
  const raw = storage.getItem(KEY(slot));
  if (!raw) return null;
  return parseSave(raw).state;
}

export function clearSlot(storage, slot) {
  checkSlot(slot);
  storage.removeItem(KEY(slot));
}

/** 저장 글을 읽어 확인한다. */
export function parseSave(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('저장 파일을 읽을 수 없습니다'); }
  if (!data || typeof data !== 'object' || !data.state) throw new Error('저장 파일이 아닙니다');
  if (!Number.isInteger(data.v) || data.v < 1) throw new Error('저장 파일의 판을 알 수 없습니다');
  if (data.v > SAVE_VERSION) throw new Error(`저장 파일의 판(${data.v})이 지금 판(${SAVE_VERSION})보다 새것입니다`);
  const s = data.state;
  if (typeof s.name !== 'string' || !s.stats || !s.counters || !Array.isArray(s.log) || !s.flags || !s.skills) throw new Error('저장 파일이 망가졌습니다');
  // 옛 판의 저장은 읽을 때 지금 꼴로 올린다. 다음에 저장되면 지금 판으로 남는다.
  if (!Number.isInteger(s.v)) s.v = data.v;
  if (s.v !== data.v) throw new Error('저장 파일이 망가졌습니다 (판이 서로 다릅니다)');
  migrate(s);
  checkShape(s);
  data.v = SAVE_VERSION;
  return data;
}

/** 올린 뒤의 꼴이 화면이 그릴 수 있는 것인지 본다. 아니면 망가진 저장이다. */
function checkShape(s) {
  const bad = (why) => { throw new Error(`저장 파일이 망가졌습니다 (${why})`); };
  if (!PLACES[s.place]) bad('모르는 곳');
  if (!Array.isArray(s.bag) || !s.equip || typeof s.equip !== 'object') bad('가방');
  for (const item of [...s.bag, ...Object.values(s.equip)]) {
    if (item === null) continue;
    if (!item || !ITEMS[item.id] || !Number.isInteger(item.n) || item.n < 1) bad('모르는 물건');
  }
  if (s.battle && !MONSTERS[s.battle.mon]) bad('모르는 괴물');
  if (!Array.isArray(s.status) || !Array.isArray(s.dings) || !Array.isArray(s.journal) || !s.hidden || !s.dex?.mon) bad('빠진 칸');
  for (const k of ['hp', 'full', 'xp', 'level', 'silver', 'day', 'phase', 'tick']) if (!Number.isFinite(s[k])) bad(k);
  if (s.phase < 0 || s.phase > 2) bad('때');
  if (!s.store || typeof s.store !== 'object' || Array.isArray(s.store)) bad('보관함');
  for (const box of Object.values(s.store)) {
    if (!box || !Array.isArray(box.items) || !Number.isFinite(box.silver) || box.silver < 0) bad('보관함');
    for (const item of box.items) if (!item || !ITEMS[item.id] || !Number.isInteger(item.n) || item.n < 1) bad('보관함의 물건');
  }
  if (!Number.isFinite(s.storeDebt) || s.storeDebt < 0) bad('보관 삯');
  if (s.craft && !RECIPES[s.craft.recipe]) bad('모르는 설계도');
  if (s.sculpt && !SUBJECTS[s.sculpt.subject]) bad('모르는 주제');
  if (!s.board || !Array.isArray(s.board.gone)) bad('게시판');
  for (const j of s.jobs || []) if (!j || !JOBS[j.id]) bad('모르는 의뢰');
  for (const [id, q] of Object.entries(s.quests || {})) if (!SUBS[id] || !q || !Array.isArray(q.set) || !Array.isArray(q.closed) || !SUBS[id].steps.some((st) => st.id === q.step)) bad('모르는 퀘스트');
  for (const [id, q] of Object.entries(s.hq || {})) if (!HIDDENS[id] || !q || !HIDDENS[id].steps.some((st) => st.id === q.step)) bad('모르는 퀘스트');
  const c = s.choice;
  if (c) {
    const ok = ((c.kind === 'sense' || c.kind === 'hurt') && MONSTERS[c.mon]) || (c.kind === 'incident' && (INCIDENTS[c.place] || []).some((x) => x.id === c.id))
      || (c.kind === 'offer' && c.job === 'smith') || (c.kind === 'hq' && HIDDENS[c.id]) || (c.kind === 'hjob' && HIDDEN_JOBS[c.id]) || ['trap', 'door', 'keeper', 'ending'].includes(c.kind) || (c.kind === 'memory' && c.id === 'debtpaper');
    if (!ok) bad('모르는 선택');
  }
  if (!s.people || !s.fame || !Array.isArray(s.titles) || !Array.isArray(s.jobs) || !s.quests || !s.hq || !s.main || !Array.isArray(s.main.done) || !Array.isArray(s.opened)) bad('퀘스트');
  if (s.job !== null && !jobDef(s.job)) bad('모르는 직업');
  if (!Number.isFinite(s.tired) || s.tired < 0 || s.tired > 100) bad('피로');
  if (!s.hjobs || !s.factions) bad('직업');
  if (s.ending !== null && !['mend', 'free', 'keep', 'hidden'].includes(s.ending)) bad('모르는 끝');
  if (!s.rung || !Array.isArray(s.rung.ks) || !Number.isInteger(s.rung.total)) bad('끝난 뒤');
  if (s.choice && s.choice.kind === 'ending' && (s.ending || s.main.chapter !== 5)) bad('모르는 선택');
  if (s.job2 !== null && (!ADVANCED[s.job2] || ADVANCED[s.job2].from !== s.job)) bad('모르는 2차 전직');
  if (!Array.isArray(s.works) || !Array.isArray(s.party) || !s.buffs || !s.dex.animals || !s.dex.dishes) bad('작품과 동료');
  if (s.party.length > 2 || new Set(s.party.map((c) => c && c.id)).size !== s.party.length) bad('동료');
  for (const c of s.party) if (!c || !COMPANIONS[c.id] || !Number.isFinite(c.hp) || !Number.isFinite(c.crossed) || !Number.isFinite(c.bond)) bad('모르는 동료');
  for (const w of s.works) {
    if (!w || !SUBJECTS[w.subject] || !Number.isInteger(w.grade) || w.grade < 0 || w.grade > 4 || !Number.isInteger(w.no)) bad('모르는 작품');
    if (!['bag', 'plaza', 'sold', 'gift', 'alive', 'gone'].includes(w.where) || (w.where === 'gift' && !PEOPLE[w.to])) bad('작품이 간 곳');
  }
  for (const b of Object.values(s.buffs)) if (!b || !b.until || !Number.isFinite(b.until.day) || !Number.isFinite(b.until.phase) || !b.name) bad('버프');
  if (!Array.isArray(s.cookFails) || !Array.isArray(s.cookHints)) bad('요리');
  if (s.sculpt && !Number.isInteger(s.sculpt.cuts)) bad('조각');
  for (const v of Object.values(s.factions)) if (!Number.isFinite(v)) bad('세력');
  for (const v of Object.values(s.hjobs)) if (!['offered', 'declined', 'taken'].includes(v)) bad('히든 직업');
  if (s.choice && s.choice.kind === 'hjob' && s.hjobs[s.choice.id] !== 'offered') bad('모르는 선택');
  if (s.choice && s.choice.kind === 'hq' && s.hq[s.choice.id]?.status !== 'offered') bad('모르는 선택');
  if (!s.dmem || typeof s.dmem !== 'object') bad('던전');
  const w = s.world;
  if (!w || !Array.isArray(w.notices) || !w.firsts || !w.today || !w.today.acts || !w.streak || !w.seen || !Array.isArray(w.seen.rumors)) bad('세계');
  for (const n of w.notices) if (!n || (!n.text && !FIRSTS[n.key])) bad('세계 공지');
  for (const [k, f] of Object.entries(w.firsts)) if (!FIRSTS[k] || !f || typeof f.who !== 'string') bad('최초 발견');
  const au = s.auction;
  if (!au || !Array.isArray(au.mine) || !Array.isArray(au.bids) || !Array.isArray(au.history) || !Number.isInteger(au.no)) bad('경매장');
  const whole = (x) => Number.isInteger(x) && x >= 1;
  for (const m of au.mine) {
    if (!m || !m.item || !ITEMS[m.item.id] || !whole(m.item.n) || !Array.isArray(m.bids) || !whole(m.start) || !Number.isInteger(m.ends)) bad('경매에 올린 것');
    for (const b of m.bids) if (!b || typeof b.who !== 'string' || !whole(b.amount)) bad('경매에 올린 것');
  }
  for (const b of au.bids) if (!b || !b.item || !ITEMS[b.item.id] || !whole(b.item.n) || !whole(b.amount) || !Number.isFinite(b.fair)) bad('입찰');
  for (const hst of au.history) if (!hst || typeof hst.text !== 'string') bad('지난 거래');
  for (const [id, m] of Object.entries(s.dmem)) if (!DUNGEONS[id] || !m || !Array.isArray(m.seen) || !m.done || m.seen.some((r) => !DUNGEONS[id].rooms[r])) bad('던전의 지도');
  if (s.dungeon && (!DUNGEONS[s.dungeon.id] || !DUNGEONS[s.dungeon.id].rooms[s.dungeon.room] || !s.dungeon.cleared || !s.dungeon.rested)) bad('던전');
  if (c && ['trap', 'door', 'keeper'].includes(c.kind)) {
    const room = s.dungeon && DUNGEONS[s.dungeon.id].rooms[c.room];
    const want = { trap: 'trap', door: 'door', keeper: 'boss' }[c.kind];
    if (!room || room.kind !== want) bad('모르는 선택');
  }
  for (const m of Object.values(s.dmem)) {
    if (m.keeperClosed !== undefined && !Array.isArray(m.keeperClosed)) bad('던전의 지도');
    if (m.nights !== undefined && !Number.isInteger(m.nights)) bad('던전의 지도');
  }
}

/** 저장 칸 셋의 요약 (이어 하기 화면에 보일 것). */
export function listSlots(storage) {
  const out = [];
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const raw = storage.getItem(KEY(slot));
    if (!raw) { out.push({ slot, empty: true }); continue; }
    try {
      const { state, savedAt } = parseSave(raw);
      out.push({
        slot, empty: false, savedAt, name: state.name, level: state.level,
        job: ADVANCED[state.job2]?.name || jobDef(state.job)?.name || '무직', origin: originById(state.origin)?.name || '',
        when: `${state.day}일째 ${PHASES[state.phase]}`, place: state.place,
      });
    } catch (e) {
      out.push({ slot, empty: false, broken: true, error: e.message });
    }
  }
  return out;
}

/** 파일로 내보낼 글. */
export function exportText(storage, slot) {
  checkSlot(slot);
  const raw = storage.getItem(KEY(slot));
  if (!raw) throw new Error('이 칸은 비어 있습니다');
  return raw;
}

/** 파일에서 가져온 글을 그 칸에 넣는다. 확인을 통과해야 들어간다. */
export function importText(storage, slot, raw) {
  checkSlot(slot);
  parseSave(raw);
  storage.setItem(KEY(slot), raw);
}

/** 이 일들이 일어났으면 저절로 저장할 때다: 방을 옮김, 띠링, 때가 바뀜, 싸움의 시작과 끝, 쓰러짐, 정할 것이 생김, 장비를 바꿈. */
export function shouldAutosave(events) {
  return events.some((e) => ['guild', 'stance', 'enhance', 'move', 'ding', 'phase', 'battle', 'fall', 'choice', 'gear', 'craft', 'trade', 'evolve', 'quest', 'social', 'check', 'job', 'sculpt', 'cook', 'party', 'statue', 'buff', 'room', 'world', 'auction', 'ending'].includes(e.type));
}
