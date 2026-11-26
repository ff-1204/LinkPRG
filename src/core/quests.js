// 퀘스트 네 갈래를 굴린다 (Q1~Q4, E19~E23, S1).
// 의뢰(게시판) · 서브(사람이 준다, 선택으로 갈린다) · 히든(조건을 채우면 나타난다) · 메인(장마다 길 여럿)

import { seedFrom, next, chance } from './rng.js?v=c0f458e';
import { pushLine, ding } from './log.js?v=c0f458e';
import { JOBS, JOB_LIMIT, JOB_DAYS, BOARD_SIZE, SUBS, SUB_ORDER, STAT_CHECKS, HIDDENS, HIDDEN_ORDER, MAIN } from '../data/quests.js?v=c0f458e';
import { PEOPLE, REGULAR, PEOPLE_ORDER, BONDS } from '../data/people.js?v=c0f458e';
import { itemDef } from '../data/items.js?v=c0f458e';
import { monsterDef } from '../data/monsters.js?v=c0f458e';
import { placeById, PLACES } from '../data/places.js?v=c0f458e';
import { countOf, takeById, addItem } from './inventory.js?v=c0f458e';
import { grantXp } from './reward.js?v=c0f458e';
import { bondOf, bondBy, addFame, fameOf, grantTitle, checkChance, rollCheck, CHECKS } from './social.js?v=c0f458e';
import { SKILL_NAMES, gradeLabel } from './skills.js?v=c0f458e';
import { addStanding, standingOf, previewEffects } from './factions.js?v=c0f458e';
import { offerHiddenJob } from './jobs.js?v=c0f458e';
import { cross } from './party.js?v=c0f458e';
import { SEARCH_NEED } from '../data/lines.js?v=c0f458e';
import { endingChoices, afterText, ENDINGS } from './ending.js?v=c0f458e';
import { HIDDEN_JOBS } from '../data/jobs.js?v=c0f458e';
import { iGa, eulReul } from './ko.js?v=c0f458e';
import { WILDS } from '../data/wild.js?v=c0f458e';
import { rootOf } from '../data/origins.js?v=c0f458e';
import { MONSTERS } from '../data/monsters.js?v=c0f458e';
import { SHOPS } from '../data/shops.js?v=c0f458e';
import { hasTitle } from './titles.js?v=c0f458e';

const FAVOR_STRIKES = 300;
/** '이웃'이라고 / '깎는 이'라고 */
const rago = (w) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '이라고' : '라고'; };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// ── 의뢰 ────────────────────────────────────────────────

/** 오늘 게시판에 붙은 의뢰들. 날마다 달라지고, 같은 날에는 같다(씨앗과 날로 정한다). */
export function boardToday(state) {
  const at = typeof placeById(state.place).board === 'string' ? placeById(state.place).board : 'plaza';
  const ids = Object.keys(JOBS).filter((id) => (JOBS[id].at || 'plaza') === at);
  const daily = ids.filter((id) => JOBS[id].daily);
  const rest = ids.filter((id) => !JOBS[id].daily);
  let h = seedFrom(`${state.seed}-board-${at}-${state.day}`);
  const pickFrom = [...rest];
  const out = [...daily];
  while (out.length < daily.length + BOARD_SIZE && pickFrom.length) {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    out.push(pickFrom.splice(h % pickFrom.length, 1)[0]);
  }
  return out;
}

function jobProgress(state, job) {
  const def = JOBS[job.id];
  return def.kind === 'bring' ? Math.min(def.n, countOf(state, def.item)) : Math.min(def.n, job.have || 0);
}

/** 게시판 창이 그릴 것 (E19, E20). 조건이 모자란 것은 흐리게, 까닭과 함께. */
export function boardView(state) {
  if (state.board.day !== state.day) state.board = { day: state.day, gone: [] };
  const mine = state.jobs.map((j) => j.id);
  return boardToday(state).filter((id) => !state.board.gone.includes(id) && !mine.includes(id)).map((id) => {
    const d = JOBS[id];
    const short = state.level < d.minLevel ? `레벨 ${d.minLevel}부터` : state.jobs.length >= JOB_LIMIT ? `의뢰는 ${JOB_LIMIT}개까지` : '';
    return { id, rank: d.rank, name: d.name, by: d.by, say: d.say, silver: d.silver, xp: d.xp, fame: d.fame, daily: !!d.daily, can: !short, why: short, where: whereOf(d, state), go: goPlaces(d, state) };
  });
}

/** 의뢰를 어디서 하면 되는지. 사냥감이 사는 곳, 물건이 나는 곳(모으기·탐색·사냥·가게)을 둘까지 적는다. */
export function whereOf(d, state = null) {
  return d.where || wherePlaces(d, state).map((x) => x.text).join(', ');
}
/** 의뢰의 바로가기 (Z67): 어디서에 적힌 들판으로 가는 길. */
export function goPlaces(d, state = null) {
  if (d.where) return [];
  const ids = [];
  for (const x of wherePlaces(d, state)) if (x.wild && !ids.includes(x.id)) ids.push(x.id);
  return ids.map((id) => ({ id, name: PLACES[id].name }));
}
function wherePlaces(d, state = null) {
  const out = [];
  const add = (text, id, wild = true) => { if (!out.some((x) => x.text === text)) out.push({ text, id, wild }); };
  // 아직 길을 모르는 곳은 적지 않는다
  const known = (id) => !!PLACES[id] && !(state && PLACES[id].locked && !state.opened.includes(PLACES[id].opensWith || id));
  const wilds = Object.entries(WILDS).filter(([id]) => known(id));
  if (d.kind === 'hunt') {
    for (const [id, w] of wilds) if (w.monsters?.some((m) => m.id === d.mon)) add(`${PLACES[id].name}에서 사냥`, id);
  } else if (d.kind === 'bring') {
    for (const [id, w] of wilds) if (w.gather?.drops.some((x) => x.id === d.item)) add(`${PLACES[id].name}에서 ${w.gather.label}`, id);
    for (const [id, w] of wilds) if (w.finds?.some((x) => x.id === d.item)) add(`${PLACES[id].name}에서 탐색`, id);
    for (const [id, w] of wilds) for (const m of w.monsters || []) if (MONSTERS[m.id]?.drops?.some((x) => x.id === d.item)) add(`${PLACES[id].name}의 ${MONSTERS[m.id].name} 사냥`, id);
    for (const [id, sh] of Object.entries(SHOPS)) if (sh.sells.includes(d.item) && known(id)) add(`${PLACES[id].name}에서 구매`, id, false);
  }
  return out.slice(0, 2);
}

/** 하고 있는 의뢰 (E21). */
export function jobsView(state) {
  return state.jobs.map((j) => {
    const d = JOBS[j.id];
    const have = jobProgress(state, j);
    return { id: j.id, where: whereOf(d, state), go: goPlaces(d, state), rank: d.rank, name: d.name, by: d.by, have, n: d.n, ready: have >= d.n, due: j.due, left: j.due - state.day, silver: d.silver, xp: d.xp, fame: d.fame, what: d.kind === 'bring' ? `${eulReul(itemDef(d.item).name)} 모아 게시판에 낸다` : `${eulReul(monsterDef(d.mon).name)} 잡고 게시판에 알린다` };
  });
}

function atBoard(state) {
  if (!placeById(state.place).board) throw new Error('게시판은 광장과 모험가 회관에 있습니다');
}

export function acceptJob(state, events, id) {
  atBoard(state);
  const d = JOBS[id];
  if (!d || !boardToday(state).includes(id)) throw new Error('오늘 게시판에 없는 의뢰입니다');
  if (state.board.day !== state.day) state.board = { day: state.day, gone: [] };
  if (state.board.gone.includes(id) || state.jobs.some((j) => j.id === id)) throw new Error('이미 받은 의뢰입니다');
  if (state.jobs.length >= JOB_LIMIT) throw new Error(`의뢰는 ${JOB_LIMIT}개까지 받을 수 있습니다`);
  if (state.level < d.minLevel) throw new Error(`레벨 ${d.minLevel}부터 받을 수 있습니다`);
  state.jobs.push({ id, have: 0, due: state.day + JOB_DAYS });
  state.board.gone.push(id);
  pushLine(state, events, { k: 'me', text: `게시판에서 의뢰 '${d.name}'의 쪽지를 떼었다. ${JOB_DAYS}일 안에 끝내야 한다.` });
  events.push({ type: 'quest' });
}

export function finishJob(state, events, id) {
  atBoard(state);
  const i = state.jobs.findIndex((j) => j.id === id);
  if (i < 0) throw new Error('받지 않은 의뢰입니다');
  const d = JOBS[id];
  if (jobProgress(state, state.jobs[i]) < d.n) throw new Error('아직 다 채우지 못했습니다');
  if ((d.at || 'plaza') !== placeById(state.place).board) throw new Error('이 의뢰는 받은 게시판에서 끝냅니다');
  if (d.kind === 'bring') takeById(state, d.item, d.n);
  state.jobs.splice(i, 1);
  state.jobsDone += 1;
  events.push({ type: 'jobdone', id });
  state.silver += d.silver;
  pushLine(state, events, { k: 'me', text: `의뢰 ${eulReul(`'${d.name}'`)} 끝냈다. 은화 +${d.silver}, 경험치 +${d.xp}, 명성 +${d.fame}.` });
  grantXp(state, events, d.xp);
  addFame(state, events, d.fame);
  if (d.faction) addStanding(state, events, d.faction[0], d.faction[1]);
  events.push({ type: 'quest' });
}

export function dropJob(state, events, id) {
  const i = state.jobs.findIndex((j) => j.id === id);
  if (i < 0) throw new Error('받지 않은 의뢰입니다');
  state.jobs.splice(i, 1);
  pushLine(state, events, { k: 'me', text: `의뢰 ${eulReul(`'${JOBS[id].name}'`)} 그만두었다.` });
  events.push({ type: 'quest' });
}

// ── 서브 퀘스트 ──────────────────────────────────────────

function appears(state, q) {
  const a = q.appear || {};
  if (a.bond && bondOf(state, a.bond[0]) < a.bond[1]) return false;
  if (a.fame && fameOf(state) < a.fame) return false;
  if (a.main && !state.main.done.some((d) => d.chapter === a.main)) return false;
  if (a.level && state.level < a.level) return false;
  return true;
}

/** 이 사람이 지금 줄 수 있는 서브 퀘스트들 (Q3-6: 이름 옆 숫자). */
export function offersOf(state, personId) {
  return SUB_ORDER.filter((id) => SUBS[id].giver === personId && !state.quests[id] && appears(state, SUBS[id]));
}

const stepOf = (q, st) => q.steps.find((s) => s.id === st.step);

function needOk(state, need) {
  if (!need) return true;
  if (need.silver && state.silver < need.silver) return false;
  for (const [id, n] of need.items || []) if (countOf(state, id) < n) return false;
  if (need.skill && (state.skills[need.skill[0]]?.grade || 0) < need.skill[1]) return false;
  for (const [id, stage] of need.factions || []) if (standingOf(state, id) < stage) return false;
  return true;
}

function choiceChance(state, c) {
  if (!c.check) return null;
  if (STAT_CHECKS[c.check.kind]) return clamp(0.5 + (state.stats[STAT_CHECKS[c.check.kind].stat] - c.check.need) * 0.05, 0.05, 0.95);
  return checkChance(state, c.check.kind, c.check.npc);
}

/** 한 단계의 선택지와, 고를 수 있는지·확률·조건 (Q3-2, T12, T13). */
function choicesOf(state, q, st, step) {
  return (step.choices || []).filter((c) => !c.when || st.set.includes(c.when)).map((c) => {
    const closed = st.closed.includes(c.id);
    const freeOk = c.free ? (c.free.origin ? rootOf(state.origin) === c.free.origin : c.free.item ? countOf(state, c.free.item) > 0 : hasTitle(state, c.free.title)) : true;
    const ok = needOk(state, c.need);
    const p = choiceChance(state, c);
    return {
      id: c.id, label: c.label, end: c.end || null,
      need: c.needSay || '', free: c.free ? c.free.why : '', check: c.check ? (STAT_CHECKS[c.check.kind]?.name || CHECKS[c.check.kind].name) : '',
      chance: p == null ? null : Math.round(p * 100),
      fx: previewEffects(c.ok), // 고르기 전에 보이는 결과 (T30)
      can: !closed && ok && freeOk,
      why: closed ? '이미 통하지 않았다' : !freeOk ? `${c.free.why}이어야 한다` : !ok ? `있어야 하는 것: ${c.needSay}` : '',
      hide: !!c.free && !freeOk, // 출신·칭호가 여는 대답은 그 사람에게만 보인다
    };
  }).filter((c) => !c.hide);
}

/** 퀘스트 창과 대화 창이 그릴 것. */
export function subView(state, id) {
  const q = SUBS[id];
  const st = state.quests[id];
  if (!st) return null;
  const step = st.done ? null : stepOf(q, st);
  const last = q.steps[q.steps.length - 1];
  return {
    id, name: q.name, giver: PEOPLE[q.giver].name, done: st.done, ending: st.ending || null, more: !!q.more && !st.done,
    step: step ? { id: step.id, text: step.text, at: step.at ? placeById(step.at).name : '', here: !step.at || step.at === state.place, goal: goalText(state, step.goal, st), choices: choicesOf(state, q, st, step) } : null,
    // 마지막 갈림은 미리 보인다 (Q3-2)
    ends: st.done ? [] : (last.choices || []).filter((c) => c.end && !c.when).map((c) => ({ label: c.label, need: c.needSay || (c.check ? `${STAT_CHECKS[c.check.kind]?.name || CHECKS[c.check.kind].name} 판정` : ''), free: c.free?.why || '' })),
  };
}

function goalText(state, goal, st) {
  if (!goal) return '';
  if (goal.item) return `${itemDef(goal.item).name} ${countOf(state, goal.item)} / 1`;
  if (goal.win) return `${monsterDef(goal.win[0]).name} ${Math.min(goal.win[1], st.count || 0)} / ${goal.win[1]}`;
  if (goal.count) return `${Math.min(goal.count[1], st.count || 0)} / ${goal.count[1]}`;
  if (goal.talk) return `${PEOPLE[goal.talk].name}에게 말을 건다`;
  return '';
}

export function acceptSub(state, events, id) {
  const q = SUBS[id];
  if (!q) throw new Error('모르는 퀘스트입니다');
  if (state.quests[id]) throw new Error('이미 받은 퀘스트입니다');
  if (PEOPLE[q.giver].place !== state.place) throw new Error(`${iGa(PEOPLE[q.giver].name)} 있는 곳에서 받습니다`);
  if (!appears(state, q)) throw new Error('아직 받을 수 없습니다');
  state.quests[id] = { step: q.steps[0].id, set: [], closed: [], count: 0, done: false, ending: null, day: state.day };
  pushLine(state, events, { k: 'npc', who: PEOPLE[q.giver].name, text: q.offer });
  pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `${eulReul(`'${q.name}'`)} 받았다.` });
  events.push({ type: 'quest' });
  advanceGoals(state, events);
}

function applyEffects(state, events, fx) {
  if (!fx) return;
  for (const [id, n] of fx.take || []) takeById(state, id, n);
  for (const [id, n] of fx.give || []) addItem(state, id, n);
  if (fx.silver) state.silver = Math.max(0, state.silver + fx.silver);
  if (fx.hp) state.hp = Math.max(1, state.hp + fx.hp);
  if (fx.lean) state.lean += fx.lean;
  if (fx.lean < 0 && state.party.length) cross(state, events, 'greed');
  for (const [id, n] of fx.faction || []) {
    addStanding(state, events, id, n, !!fx.flat); // 둘을 한자리에: 맞수가 내리지 않는다
  }
  for (const [id, n] of fx.bond || []) bondBy(state, events, id, n);
  if (fx.fame) addFame(state, events, fx.fame);
  if (fx.xp) grantXp(state, events, fx.xp);
  if (fx.title) grantTitle(state, events, fx.title[0], fx.title[1]);
  // 메인 퀘스트의 갈림을 맺는 선택 (3장)
  if (fx.main && state.main.chapter === 3) { state.flags.lode = fx.main; finishMain(state, events, fx.main); }
}

/** 선택지 하나를 고른다. 판정에 실패하면 그 대답만 닫히고 다른 대답은 남는다 (T10~T13). */
export function chooseSub(state, events, id, choiceId) {
  const q = SUBS[id];
  const st = state.quests[id];
  if (!q || !st || st.done) throw new Error('하고 있는 퀘스트가 아닙니다');
  const step = stepOf(q, st);
  if (step.at && step.at !== state.place) throw new Error(`${placeById(step.at).name}에서 할 수 있습니다`);
  const c = (step.choices || []).find((x) => x.id === choiceId);
  const view = choicesOf(state, q, st, step).find((x) => x.id === choiceId);
  if (!c || !view) throw new Error('고를 수 없는 것입니다');
  if (!view.can) throw new Error(view.why || '고를 수 없는 것입니다');
  // 내놓을 것이 없으면 글도 주사위도 쓰기 전에 거절한다
  for (const [itemId, n] of c.ok?.take || []) if (countOf(state, itemId) < n) throw new Error(`${iGa(itemDef(itemId).name)} 있어야 합니다`);
  pushLine(state, events, { k: 'me', text: `${c.label}.` });
  if (c.check) {
    let ok;
    if (STAT_CHECKS[c.check.kind]) {
      const need = Math.round(choiceChance(state, c) * 100);
      const roll = 1 + Math.floor(next(state) * 100);
      ok = roll <= need;
      pushLine(state, events, { k: 'sys', who: '판정', text: `${STAT_CHECKS[c.check.kind].name} ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공.` });
      events.push({ type: 'check', kind: c.check.kind, ok, roll, need });
    } else ok = rollCheck(state, events, c.check.kind, c.check.npc).ok;
    if (!ok) {
      st.closed.push(c.id);
      pushLine(state, events, { k: 'room', text: c.failSay });
      applyEffects(state, events, c.fail);
      events.push({ type: 'quest' });
      return { ok: false };
    }
  }
  pushLine(state, events, { k: 'room', text: c.say });
  if (c.ok?.set) st.set.push(c.ok.set);
  applyEffects(state, events, c.ok);
  const i = q.steps.indexOf(step);
  if (c.end || i === q.steps.length - 1) {
    st.done = true;
    st.ending = c.end || '끝냈다';
    pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `${iGa(`'${q.name}'`)} 끝났다: ${st.ending}.` });
    state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${q.name}. ${st.ending}.`, note: null });
  } else {
    st.step = q.steps[i + 1].id;
    st.closed = [];
  }
  events.push({ type: 'quest' });
  return { ok: true };
}

// ── 히든 퀘스트 ──────────────────────────────────────────

function hiddenFound(state, id, ctx) {
  // 인내가 생겼어도, 허수아비 앞에서 생긴 것이어야 한다
  if (id === 'favor') return ctx.talk === 'instructor' && (state.hidden.endure?.value || 0) >= 1 && (state.counters.act.strike || 0) >= FAVOR_STRIKES;
  if (id === 'riverbed') return ctx.gather === 'fish' && state.place === 'river' && ctx.phase === 0 && state.quests.rod?.done && state.quests.rod.set.includes('mended');
  return false;
}

/** 찾았다. 가장 큰 띠링과 찾은 까닭, 그리고 받을지 묻는다 (Q4-1, Q4-2). */
function offerHidden(state, events, id) {
  const q = HIDDENS[id];
  state.hq[id] = { status: 'offered', step: q.steps[0].id, count: 0, day: state.day };
  pushLine(state, events, { k: 'room', text: q.offer });
  ding(state, events, { level: 4, kind: 'hiddenquest', title: `히든 퀘스트를 찾았습니다: ${q.name}`, big: q.name, body: '받을지 말지 고릅니다. 거절해도 벌은 없지만 다시 나타나지 않습니다.', reason: q.why });
  state.choice = { kind: 'hq', id };
  events.push({ type: 'choice' });
}

export function answerHidden(state, events, id, accept) {
  const q = HIDDENS[id];
  const st = state.hq[id];
  if (!q || !st || st.status !== 'offered') throw new Error('고를 수 없는 것입니다');
  state.choice = null;
  if (!accept) {
    st.status = 'declined';
    pushLine(state, events, { k: 'me', text: '고개를 저었다. 그 일은 다시 오지 않을 것이다.' });
  } else {
    st.status = 'active';
    pushLine(state, events, { k: 'sys', who: '히든 퀘스트', text: `${eulReul(`'${q.name}'`)} 받았다.`, tone: 'mint' });
  }
  events.push({ type: 'quest' });
}

export function hiddenView(state) {
  return HIDDEN_ORDER.filter((id) => state.hq[id]).map((id) => {
    const q = HIDDENS[id];
    const st = state.hq[id];
    const step = st.status === 'active' ? q.steps.find((s) => s.id === st.step) : null;
    return { id, name: q.name, kind: q.kind, status: st.status, why: q.why, step: step ? { text: step.text, goal: goalText(state, step.goal, st) } : null };
  });
}

function finishHidden(state, events, id) {
  const q = HIDDENS[id];
  const st = state.hq[id];
  st.status = 'done';
  pushLine(state, events, { k: 'room', text: q.done });
  ding(state, events, { level: 4, kind: 'hiddenquest', title: `히든 퀘스트를 끝냈습니다: ${q.name}`, big: q.name, body: '' });
  applyEffects(state, events, q.reward);
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${eulReul(q.name)} 끝냈다. 아무도 시키지 않은 일이었다.`, note: '히든 퀘스트를 끝낸 날' });
  if (q.reward.main && state.main.chapter === 1) finishMain(state, events, q.reward.main);
}

// ── 메인 퀘스트 ──────────────────────────────────────────

function pathProgress(state, chapter, id) {
  if (chapter === 2) return [state.dmem.ruins?.keeper === id ? 1 : 0, 1];
  if (chapter === 5) return [endingChoices(state).find((c) => c.id === id)?.can ? 1 : 0, 1];
  if (chapter === 4) {
    if (id === 'archive') return [Math.min(SEARCH_NEED, state.flags.archive || 0), SEARCH_NEED];
    if (id === 'heir') return [Math.min(REGULAR, bondOf(state, 'heir')), REGULAR];
    if (id === 'keeper') return [state.flags.askedKeeper ? 1 : 0, 1];
    if (id === 'bell') return [state.flags.askedBell ? 1 : 0, 1];
    return [0, 1];
  }
  if (chapter === 3) {
    const st = (f) => Math.min(3, standingOf(state, f));
    if (id === 'miners') return [st('miners'), 3];
    if (id === 'merchants') return [st('merchants'), 3];
    if (id === 'both') return [st('miners') + st('merchants'), 6];
    if (id === 'buy') return [Math.min(3000, state.silver), 3000];
    return [0, 1];
  }
  if (chapter !== 1) return [0, 1];
  if (id === 'fight') return [Math.min(5, state.level) + (state.job ? 1 : 0), 6];
  if (id === 'craft') return [state.main.soldRare ? 1 : 0, 1];
  if (id === 'sculpt') return [state.works.some((w) => w.where === 'plaza' && w.grade >= 3) ? 1 : 0, 1];
  if (id === 'friend') return [Math.min(3, PEOPLE_ORDER.filter((p) => bondOf(state, p) >= REGULAR).length), 3];
  if (id === 'work') return [Math.min(10, state.jobsDone), 10];
  return [0, 1];
}

/** 일지 맨 위와 퀘스트 창이 그릴 것 (Q2-3, Q3-4). 숨은 길은 끝내기 전에는 보이지 않는다. */
export function mainView(state) {
  const ch = state.main.chapter;
  const m = MAIN[ch];
  if (!m) return { chapter: ch, name: state.ending ? `끝난 뒤: ${ENDINGS[state.ending].name}` : '', text: state.ending ? afterText(state) : '다음 장은 아직 쓰이지 않았다.', paths: [], nearest: null, done: state.main.done, called: state.main.called };
  const paths = m.paths.map((p) => {
    const [have, need] = pathProgress(state, ch, p.id);
    return { id: p.id, name: p.name, text: p.text, have, need, closed: p.closed || '', ratio: p.closed ? -1 : have / need };
  });
  const open = paths.filter((p) => !p.closed);
  const nearest = open.length ? open.reduce((a, b) => (b.ratio > a.ratio ? b : a)) : null;
  return { chapter: ch, name: m.name, text: m.text, paths, nearest, done: state.main.done.map((d) => ({ ...d, name: MAIN[d.chapter].name, pathName: [...MAIN[d.chapter].paths, MAIN[d.chapter].hidden].find((p) => p.id === d.path)?.name || '' })), called: state.main.called };
}

export function finishMain(state, events, pathId) {
  const ch = state.main.chapter;
  const m = MAIN[ch];
  const path = [...m.paths, m.hidden].find((p) => p.id === pathId);
  state.main.done.push({ chapter: ch, path: pathId, day: state.day });
  state.main.called = path.called;
  state.main.chapter = ch + 1;
  for (const id of m.opens) if (!state.opened.includes(id)) state.opened.push(id);
  pushLine(state, events, { k: 'room', text: m.done });
  ding(state, events, {
    level: 4, kind: 'main', title: `메인 퀘스트 ${ch}장 ${eulReul(`'${m.name}'`)} 끝냈습니다`, big: `${ch}장 끝: ${path.name}`,
    body: `이제 사람들은 당신을 '${path.called}'${rago(path.called)} 부릅니다.${m.opens.length ? ` 지도에 새 길이 났습니다: ${m.opens.map((id) => PLACES[id].name).join(', ')}.` : ''}`,
    reason: path.text,
  });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${m.name}. ${path.name}로 끝냈다. 사람들이 나를 '${path.called}'${rago(path.called)} 부른다.`, note: `${ch}장을 끝낸 날` });
  if (pathId === 'friend' && ch === 1) grantTitle(state, events, 'neighbor', '마을 사람 셋과 단골이 되었습니다');
  grantXp(state, events, m.xp);
  events.push({ type: 'quest' });
}

// ── 한 일마다 부르는 것 ───────────────────────────────────

function advanceGoals(state, events) {
  for (const id of SUB_ORDER) {
    const st = state.quests[id];
    if (!st || st.done) continue;
    const q = SUBS[id];
    const step = stepOf(q, st);
    if (step.goal?.item && countOf(state, step.goal.item) >= 1) {
      st.step = q.steps[q.steps.indexOf(step) + 1].id;
      pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${stepOf(q, st).text}` });
      events.push({ type: 'quest' });
    }
  }
}

/**
 * dispatch가 끝날 때마다 부른다. 일어난 일(events)과 방금 한 행동(action)을 보고 퀘스트를 나아가게 한다.
 */
export function questHook(state, events, action) {
  // 도감: 가 본 곳, 가져 본 물건
  state.dex.places[state.place] = true;
  for (const item of state.bag) state.dex.items[item.id] = true;
  for (const item of Object.values(state.equip)) if (item) state.dex.items[item.id] = true;

  const wins = events.filter((e) => e.type === 'battle' && e.phase === 'win').map((e) => e.mon);
  const gathered = events.find((e) => e.type === 'gather');
  const phaseAtAct = gathered ? gathered.phase : state.phase;

  // 의뢰: 잡은 수
  for (const mon of wins) for (const j of state.jobs) if (JOBS[j.id].kind === 'hunt' && JOBS[j.id].mon === mon) j.have = (j.have || 0) + 1;
  // 의뢰: 기한
  if (events.some((e) => e.type === 'phase')) {
    for (let i = state.jobs.length - 1; i >= 0; i--) {
      if (state.day > state.jobs[i].due) {
        pushLine(state, events, { k: 'sys', text: `의뢰 '${JOBS[state.jobs[i].id].name}'의 기한이 지났다. 쪽지는 게시판으로 돌아갔다.`, tone: 'warn' });
        state.jobs.splice(i, 1);
      }
    }
  }

  // 요리의 귀띔은 사람들 말에서 듣는다 (N3-4)
  const HEAR = { granny: 'saltfish', keeper: 'boarstew', priest: 'herbfish', miru: 'berryrice' };
  if (action.type === 'talk' && HEAR[action.npc] && !state.cookHints.includes(HEAR[action.npc])) state.cookHints.push(HEAR[action.npc]);

  // 서브: 낚싯대는 낚시하다 걸려 올라온다
  const rod = state.quests.rod;
  if (gathered && gathered.action === 'fish' && rod && !rod.done && rod.step === 'find' && countOf(state, 'oldrod') < 1 && chance(state, 0.2)) {
    addItem(state, 'oldrod', 1);
    pushLine(state, events, { k: 'room', text: '줄이 묵직하다. 물고기가 아니다. 진흙투성이 낚싯대 하나가 끌려 올라온다. 손잡이 마디에 실이 곱게 감겨 있다.' });
  }
  advanceGoals(state, events);

  // 히든: 하고 있는 것의 진행
  for (const id of HIDDEN_ORDER) {
    const st = state.hq[id];
    if (!st || st.status !== 'active') continue;
    const q = HIDDENS[id];
    const i = q.steps.findIndex((s) => s.id === st.step);
    const g = q.steps[i].goal;
    let met = false;
    if (g.win) { st.count += wins.filter((m) => m === g.win[0]).length; met = st.count >= g.win[1]; }
    if (g.count && gathered && gathered.action === 'fish' && state.place === 'river' && phaseAtAct === 0) { st.count += 1; met = st.count >= g.count[1]; }
    if (g.talk) met = (action.type === 'greet' || action.type === 'talk') && action.npc === g.talk;
    if (!met) continue;
    if (i === q.steps.length - 1) finishHidden(state, events, id);
    else { st.step = q.steps[i + 1].id; st.count = 0; pushLine(state, events, { k: 'sys', who: '히든 퀘스트', text: `'${q.name}': ${q.steps[i + 1].text}`, tone: 'mint' }); events.push({ type: 'quest' }); }
  }

  // 히든: 새로 찾음 (싸우는 중이거나 정할 것이 있으면 다음에)
  if (!state.battle && !state.choice && !state.craft && !state.sculpt && !state.dungeon) {
    const ctx = { talk: action.type === 'greet' || action.type === 'talk' ? action.npc : null, gather: gathered?.action || null, phase: phaseAtAct };
    for (const id of HIDDEN_ORDER) {
      if (state.hq[id] || !hiddenFound(state, id, ctx)) continue;
      offerHidden(state, events, id);
      break;
    }
  }

  // 칭호
  if (state.falls >= 3) grantTitle(state, events, 'survivor', '세 번 쓰러지고 세 번 일어났습니다');
  const made = events.find((e) => e.type === 'craft' && e.phase === 'done' && e.grade >= 2);
  if (made) grantTitle(state, events, 'maker', '희귀 등급 이상을 손으로 만들었습니다');

  // 히든 직업: 조건을 채웠으면 한 번 제안한다
  offerHiddenJob(state, events);

  // 메인 4장: 길 하나가 끝났는지. 문지기의 길과 종의 길은 물어야 끝난다
  if (state.main.chapter === 4 && !state.battle && !state.craft && !state.choice && !state.sculpt) {
    const v4 = mainView(state);
    const done4 = state.flags.bellSpoke ? { id: 'hidden' } : v4.paths.find((p) => !p.closed && p.have >= p.need);
    if (done4) finishMain(state, events, done4.id);
  }

  // 메인 1장: 길 하나가 끝났는지
  if (state.main.chapter === 1 && !state.battle && !state.craft && !state.choice && !state.sculpt) {
    const v = mainView(state);
    const doneP = v.paths.find((p) => !p.closed && p.have >= p.need);
    if (doneP) finishMain(state, events, doneP.id);
  }
}

/** 퀘스트 창의 탭 다섯이 그릴 것 (Q3-1). */
export function questBook(state) {
  const subs = SUB_ORDER.filter((id) => state.quests[id]).map((id) => subView(state, id));
  return {
    main: mainView(state),
    subs: subs.filter((s) => !s.done),
    jobs: jobsView(state),
    hidden: hiddenView(state).filter((h) => h.status === 'active' || h.status === 'offered'),
    done: [
      ...state.main.done.map((d) => ({ kind: '메인', name: `${d.chapter}장 ${MAIN[d.chapter].name}`, how: [...MAIN[d.chapter].paths, MAIN[d.chapter].hidden].find((p) => p.id === d.path)?.name || '' })),
      ...subs.filter((s) => s.done).map((s) => ({ kind: '서브', name: s.name, how: s.ending })),
      ...hiddenView(state).filter((h) => h.status === 'done').map((h) => ({ kind: '히든', name: h.name, how: '끝냈다', mint: true })),
      ...hiddenView(state).filter((h) => h.status === 'declined').map((h) => ({ kind: '히든', name: h.name, how: '거절했다. 다시 오지 않는다', mint: true })),
    ],
    jobsDone: state.jobsDone,
  };
}

export { SKILL_NAMES, gradeLabel, BONDS };
