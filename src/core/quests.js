// 퀘스트 네 갈래를 굴린다 (Q1~Q4, E19~E23, S1).
// 의뢰(게시판) · 서브(사람이 준다, 선택으로 갈린다) · 히든(조건을 채우면 나타난다) · 메인(장마다 길 여럿)

import { seedFrom, next, chance } from './rng.js?v=a145911';
import { pushLine, ding } from './log.js?v=a145911';
import { JOBS, JOB_LIMIT, JOB_DAYS, BOARD_SIZE, SUBS, SUB_ORDER, STAT_CHECKS, HIDDENS, HIDDEN_ORDER, MAIN, SALT_ROAD, SALT_ROAD_SAY, PERSUADE_SAY, BELL_NIGHTS, FAIR_SALES, ASH_ROAD, ASH_ROAD_SAY, SHARD, SHARD_SAY, TURN_SAY, MARSH_ROAD, MARSH_ROAD_SAY, SUNKEN_ROAD, SUNKEN_ROAD_SAY, CLOUD_ROAD, CLOUD_ROAD_SAY, POND_ROAD, POND_ROAD_SAY, ANVIL_ROAD, SHARDS, PRIEST, PRIEST_LINES, ECHO, ECHO_LINES, MOSS, QUENCH_PUMPS, HANG, HANG_SAY, QUENCH_SAY, BOSS_LOSSES, EMBER, EMBER_LINES } from '../data/quests.js?v=a145911';
import { WEIGHERS, BELLOWERS } from '../data/people.js?v=a145911';
import { rollOptions, gearName } from './gear.js?v=a145911';
import { ARENA } from './arena.js?v=a145911';
import { stageNow, SHOP } from './workshop.js?v=a145911';
import { relievedPosts } from './dungeon.js?v=a145911';
import { underwater } from './sunken.js?v=a145911';
import { YARD, answeredPeople, answeredAll, bellsHung } from './pond.js?v=a145911';
import { ANVIL, ANVIL_ENDS, anvilAfterText, hiddenAnvilEnd, stepsView } from './anvil.js?v=a145911';
import { PEOPLE, REGULAR, PEOPLE_ORDER, BONDS } from '../data/people.js?v=a145911';
import { itemDef } from '../data/items.js?v=a145911';
import { monsterDef } from '../data/monsters.js?v=a145911';
import { placeById, PLACES } from '../data/places.js?v=a145911';
import { countOf, takeById, addItem } from './inventory.js?v=a145911';
import { grantXp } from './reward.js?v=a145911';
import { bondOf, bondBy, addFame, fameOf, grantTitle, checkChance, rollCheck, CHECKS } from './social.js?v=a145911';
import { SKILL_NAMES, gradeLabel } from './skills.js?v=a145911';
import { addStanding, standingOf, previewEffects } from './factions.js?v=a145911';
import { offerHiddenJob } from './jobs.js?v=a145911';
import { cross } from './party.js?v=a145911';
import { SEARCH_NEED } from '../data/lines.js?v=a145911';
import { endingChoices, afterText, ENDINGS, MASTER_GRADE } from './ending.js?v=a145911';
import { HIDDEN_JOBS } from '../data/jobs.js?v=a145911';
import { iGa, eulReul } from './ko.js?v=a145911';
import { WILDS } from '../data/wild.js?v=a145911';
import { rootOf } from '../data/origins.js?v=a145911';
import { MONSTERS } from '../data/monsters.js?v=a145911';
import { SHOPS } from '../data/shops.js?v=a145911';
import { hasTitle } from './titles.js?v=a145911';

const FAVOR_STRIKES = 300;
const FAMILY = 4; // '가족 같은 사이'
const WHITE_GATE = 'icegate'; // 흰마루로 가는 길 (WM-A1)
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
  if (a.duelWins && (state.ash?.duel?.wins || 0) < a.duelWins) return false; // 겨루기에서 이긴 수 (AG-C3)
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
  if (goal.pumpDays) return `${Math.min(goal.pumpDays[0], st.count || 0)} / ${goal.pumpDays[0]}일 (오늘 ${st.pday === state.day ? Math.min(goal.pumpDays[1], st.pn || 0) : 0} / ${goal.pumpDays[1]}번)`;
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
  if (fx.flag) state.flags[fx.flag] = true;
  // 큰 대장간의 주인이 지어 준 무기 (AG-C3): 내 직업의 잿쇠 무기. 내가 지은 것이 아니라서 좌판에 올리거나 대에 걸 수는 없다
  if (fx.blade != null) {
    const key = { archer: 'bow', rogue: 'knife', mage: 'wand' }[state.job] || 'sword';
    const item = rollOptions(state, addItem(state, `ashiron_${key}`, 1, { grade: fx.blade, maker: '큰 대장간 주인' }), `ownblade|${state.day}`);
    pushLine(state, events, { k: 'sys', text: `받은 것: ${gearName(item)}.`, tone: 'mint' });
    events.push({ type: 'bag' });
  }
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
  // 종루 앞에서 밤을 새운 수 (LV-E3). 새운 그 아침, 종루 아래에서
  if (id === 'bellnight') return state.place === 'underbell' && (state.flags.bellNights || 0) >= BELL_NIGHTS;
  // 장터에서 깎지 않고 판 수 (LV-E4). 저울 마당에 들어섰을 때
  if (id === 'noprice') return state.place === 'scaleyard' && (state.counters.fairSold || 0) >= FAIR_SALES;
  // 같은 우두머리에게 진 수 (LV-E5). 가마 아가리가 보이는 쇳물 내에 다시 섰을 때
  // 답하는 마당의 일을 모두 보고 답해 주었는가 (LV-E9). 마지막으로 답해 준 그 마당에서
  if (id === 'myding') return state.place === YARD && answeredAll(state);
  // 일곱 지역의 숨은 이야기를 모두 풀었는가 (LV-E10). 모루 앞에 섰을 때
  if (id === 'eighth') return state.place === ANVIL.front && !state.anvil?.built && hiddenAnvilEnd(state); // 종을 다 지은 뒤에는 나타나지 않는다
  // 구름다리에서 올린 답 없는 기도의 수 (LV-E8). 기도를 올린 그 자리에서
  if (id === 'unheard') return PRIEST.prayAt.includes(state.place) && (state.cloud?.prayers || 0) >= PRIEST.prayers;
  if (id === 'cameback') return state.place === EMBER.place && Object.entries(state.dex.mon || {}).some(([mon, d]) => MONSTERS[mon]?.boss && (d.lost || 0) >= BOSS_LOSSES);
  return false;
}

/** 찾았다. 가장 큰 띠링과 찾은 까닭, 그리고 받을지 묻는다 (Q4-1, Q4-2). */
export function offerHidden(state, events, id) {
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
  if (chapter === 12) {
    if (id === 'gather') return [state.dmem[SHARDS.dungeon]?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'share') return [Math.min(SHARDS.bells, bellsHung(state)), SHARDS.bells];
    if (id === 'leave') return [Math.min(SHARDS.people, answeredPeople(state)), SHARDS.people];
    return [0, 1];
  }
  if (chapter === 11) {
    if (id === 'beat') return [state.dmem[PRIEST.dungeon]?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'hear') return [Math.min(MASTER_GRADE, state.skills.pray?.grade || 0), MASTER_GRADE];
    // 미루가 곁에 있을 때만 사이가 칸으로 찬다
    if (id === 'open') return [withMiru(state) ? Math.min(FAMILY, bondOf(state, PRIEST.with)) : 0, FAMILY];
    return [0, 1];
  }
  if (chapter === 10) {
    if (id === 'quiet') return [state.dmem[ECHO.dungeon]?.keeper === 'beat' ? 1 : 0, 1];
    // 칸 이백하나: 청동 한 덩이에 한 칸, 내 손으로 지은 창에 한 칸
    if (id === 'rebuild') return [Math.min(ECHO.bronze, state.sunken?.bronze || 0) + (mySpear(state) ? 1 : 0), ECHO.bronze + 1];
    if (id === 'relieve') return [Math.min(ECHO.posts, relievedPosts(state)), ECHO.posts];
    return [0, 1];
  }
  if (chapter === 9) {
    if (id === 'rest') return [state.dmem[MOSS.dungeon]?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'peel') return [Math.min(MOSS.peel, state.marsh?.moss || 0), MOSS.peel];
    if (id === 'teach') return [stageNow(state), SHOP.every.length];
    return [0, 1];
  }
  if (chapter === 8) {
    if (id === 'beat') return [state.dmem.kiln?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'forge') return [hangable(state) ? 1 : 0, 1];
    // 칸 열: 단골이 된 풀무꾼 한 사람에 한 칸, 풀무질 예순 번에 한 칸
    if (id === 'quench') return [friendBellowers(state) + Math.floor(Math.min(QUENCH_PUMPS, state.ash?.pumps || 0) / (QUENCH_PUMPS / BELLOWERS.length)), BELLOWERS.length * 2];
    return [0, 1];
  }
  if (chapter === 7) {
    if (id === 'raid') return [state.dmem.shardhouse?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'buy') return [Math.min(SHARD.n, state.flags.shards || 0), SHARD.n];
    if (id === 'turn') return [turnedWeighers(state), WEIGHERS.length];
    return [0, 1];
  }
  if (chapter === 6) {
    if (id === 'beat') return [state.dmem.icetower?.keeper === 'beat' ? 1 : 0, 1];
    if (id === 'fish') return [Math.min(MASTER_GRADE, state.skills.fishing?.grade || 0), MASTER_GRADE];
    if (id === 'talk') return [Math.min(FAMILY, bondOf(state, 'hansol')), FAMILY];
    return [0, 1];
  }
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

/** 다음에 풀 장: 이번 삶에서도 지난 삶에서도 끝내지 않은 가장 앞의 장 (SB-E3). */
export function nextChapter(state) {
  let ch = 1;
  while (state.main.done.some((d) => d.chapter === ch) || (state.main.past || []).some((d) => d.chapter === ch)) ch += 1;
  return ch;
}
const pathNameOf = (d) => [...MAIN[d.chapter].paths, MAIN[d.chapter].hidden].filter(Boolean).find((p) => p.id === d.path)?.name || '';
/** 지난 삶에서 끝낸 장들 (SB-E3): 퀘스트 창에 "지난 삶에서 끝냄"으로 보이고, 다른 길로 다시 풀 수 있다. */
const pastChapters = (state) => (state.main.past || []).filter((d) => MAIN[d.chapter]).map((d) => ({ ...d, name: MAIN[d.chapter].name, pathName: pathNameOf(d) }));
/** 지난 삶에서 끝낸 장을 다른 길로 다시 푼다 (SB-E3): 그 장이 처음부터 열린다. 누르지 않으면 건너뛴 채다. */
export function redoChapter(state, events, chapter) {
  const i = (state.main.past || []).findIndex((d) => d.chapter === chapter);
  if (i < 0 || !MAIN[chapter]) throw new Error('지난 삶에서 끝낸 장이 아닙니다');
  if (state.battle || state.dungeon || state.choice) throw new Error('지금은 할 수 없습니다');
  state.main.past.splice(i, 1);
  state.main.chapter = chapter;
  // 5장을 다시 풀면 종은 다시 멈추기 전이다: 고른 끝이 바꾼 규칙이 걷힌다
  if (chapter === 5) { state.ending = null; state.endDay = 0; }
  // 13장을 다시 풀면 모루는 다시 비어 있다: 새긴 끝이 바꾼 규칙이 걷힌다. 본 끝들은 남는다
  if (chapter === 13 && state.anvil) { state.anvil.end = null; state.anvil.endDay = 0; state.anvil.built = false; state.anvil.left = 0; }
  pushLine(state, events, { k: 'sys', who: '메인 퀘스트', text: `${chapter}장 '${MAIN[chapter].name}'을 처음부터 다시 푼다. 지난 삶과 다른 길로 갈 수 있다.`, tone: 'mint' });
  events.push({ type: 'quest' });
}

/** 끝낸 장들: 장의 이름과 푼 길의 이름. */
const doneChapters = (state) => state.main.done.map((d) => ({ ...d, name: MAIN[d.chapter].name, pathName: [...MAIN[d.chapter].paths, MAIN[d.chapter].hidden].filter(Boolean).find((p) => p.id === d.path)?.name || '' }));

/** 일지 맨 위와 퀘스트 창이 그릴 것 (Q2-3, Q3-4). 숨은 길은 끝내기 전에는 보이지 않는다. */
export function mainView(state) {
  const ch = state.main.chapter;
  // 6장은 끝을 본 밤, 고개 너머의 소리를 들은 뒤에야 보인다 (WM-F1)
  const m = ch === 6 && !state.opened.includes(WHITE_GATE) ? null : MAIN[ch];
  // 길만 열리고 그 지역이 아직 없을 때 덧붙는 말. 소금벌은 났으니(M16) 이제 잿골 길만 그렇다
  // 길만 열리고 그 지역이 아직 없을 때 덧붙는 말. 잿골까지 났으니(M17) 이제 안개늪 길만 그렇다
  // 별못까지 났으니(M21) 이제 처음 모루로 가는 길만 그렇다
  const road = '';
  void ANVIL_ROAD; void POND_ROAD; void POND_ROAD_SAY; void CLOUD_ROAD; void CLOUD_ROAD_SAY; void SALT_ROAD; void SALT_ROAD_SAY; void ASH_ROAD; void ASH_ROAD_SAY; void MARSH_ROAD; void MARSH_ROAD_SAY; void SUNKEN_ROAD; void SUNKEN_ROAD_SAY;
  // 13장을 끝낸 뒤 (CM-E): 새긴 끝과 그 뒤의 세계
  if (!m && state.anvil?.end) return { chapter: ch, name: `끝난 뒤: ${ANVIL_ENDS[state.anvil.end].name}`, text: anvilAfterText(state), paths: [], nearest: null, done: doneChapters(state), past: pastChapters(state), called: state.main.called, after: true };
  // 13장은 푸는 길 대신 할 일 셋이 보인다 (CM-D). 끝들의 이름은 종을 다 짓기 전에는 어디에도 없다
  if (m?.steps) { const steps = stepsView(state); return { chapter: ch, name: m.name, text: m.text, paths: steps, nearest: steps.find((p) => !p.closed && p.have < p.need) || null, done: doneChapters(state), past: pastChapters(state), called: state.main.called, steps: true }; }
  if (!m) return { chapter: ch, name: state.ending ? `끝난 뒤: ${ENDINGS[state.ending].name}` : '', text: state.ending ? `${afterText(state)}${road}` : `다음 장은 아직 쓰이지 않았다.${road}`, paths: [], nearest: null, done: doneChapters(state), past: pastChapters(state), called: state.main.called };
  const paths = m.paths.map((p) => {
    // 아직 모르는 길 (GD-G5): 그 동료를 들인 적이 없으면 이름도 조건도 보이지 않는다
    if (p.unknown && !state.flags[p.unknown]) return { id: p.id, name: '???', text: '', have: 0, need: 1, closed: '아직 모르는 길', ratio: -1, unknown: true };
    const [have, need] = pathProgress(state, ch, p.id);
    return { id: p.id, name: p.name, text: p.text, have, need, closed: p.closed || '', ratio: p.closed ? -1 : have / need };
  });
  const open = paths.filter((p) => !p.closed);
  const nearest = open.length ? open.reduce((a, b) => (b.ratio > a.ratio ? b : a)) : null;
  return { chapter: ch, name: m.name, text: m.text, paths, nearest, done: doneChapters(state), past: pastChapters(state), called: state.main.called };
}

export function finishMain(state, events, pathId) {
  const ch = state.main.chapter;
  const m = MAIN[ch];
  const path = [...m.paths, m.hidden].filter(Boolean).find((p) => p.id === pathId);
  if (!path) throw new Error('모르는 길입니다');
  state.main.done.push({ chapter: ch, path: pathId, day: state.day });
  state.main.called = path.called;
  state.main.chapter = nextChapter(state); // 지난 삶에서 끝낸 장은 건너뛴다 (SB-E3)
  for (const id of [...m.opens, ...(m.roads || [])]) if (!state.opened.includes(id)) state.opened.push(id);
  pushLine(state, events, { k: 'room', text: path.done || m.done }); // 길마다 끝 글이 다른 장이 있다 (6장)
  ding(state, events, {
    level: 4, kind: 'main', title: `메인 퀘스트 ${ch}장 ${eulReul(`'${m.name}'`)} 끝냈습니다`, big: `${ch}장 끝: ${path.name}`,
    body: `이제 사람들은 당신을 '${path.called}'${rago(path.called)} 부릅니다.${m.opens.length ? ` 지도에 새 길이 났습니다: ${m.opens.map((id) => PLACES[id].name).join(', ')}.` : ''}${m.roadSay ? ` ${m.roadSay}` : ''}`,
    reason: path.text,
  });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${m.name}. ${path.name}로 끝냈다. 사람들이 나를 '${path.called}'${rago(path.called)} 부른다.`, note: `${ch}장을 끝낸 날` });
  if (pathId === 'friend' && ch === 1) grantTitle(state, events, 'neighbor', '마을 사람 셋과 단골이 되었습니다');
  grantXp(state, events, m.xp);
  events.push({ type: 'quest' });
}

// ── 11장 모신 종 (GD-E) ──
/** 미루가 곁에 서 있는가. */
const withMiru = (state) => (state.party || []).some((c) => c.id === PRIEST.with && !c.down && c.out !== state.day);
/** 함께 여는 길 (GD-E5): 미루를 동료로 데려와, '가족 같은' 사이로 금칠한 문 앞에 선다. */
export function standAtDoor(state, events) {
  if (state.main.chapter !== 11) throw new Error('지금은 설 문이 없습니다');
  if (state.place !== PRIEST.door || state.dungeon) throw new Error('금칠한 문은 신전 문 앞에 있습니다');
  if (!withMiru(state)) throw new Error('미루가 곁에 있어야 합니다');
  if (bondOf(state, PRIEST.with) < FAMILY) throw new Error("미루와 '가족 같은' 사이여야 합니다");
  pushLine(state, events, { k: 'me', text: PRIEST_LINES.stand });
  finishMain(state, events, 'open');
}
const herdOn = (state) => { const st = state.quests[PRIEST.herdQuest]; return !!st && !st.done && st.step === 'herd'; };
/** 서브 "견습 사제의 의심" (GD-E7): 염소치기 움막에서 새벽과 함께 염소를 한 번 친다. 한 번 누르면 한 번이다. 쉰 번이면 끝이다. */
export function herdStep(state, events) {
  if (!herdOn(state)) throw new Error('지금은 칠 염소가 없습니다');
  if (state.place !== PRIEST.herdAt || state.dungeon) throw new Error('염소는 염소치기 움막에서 칩니다');
  const q = SUBS[PRIEST.herdQuest], st = state.quests[PRIEST.herdQuest];
  st.count = (st.count || 0) + 1;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `${PRIEST_LINES.herd[st.count % PRIEST_LINES.herd.length]} (${st.count} / ${PRIEST.herd})` });
  if (st.count === PRIEST.herd / 2) pushLine(state, events, { k: 'room', text: PRIEST_LINES.herdHalf });
  if (st.count >= PRIEST.herd) {
    st.step = q.steps[1].id; st.count = 0;
    pushLine(state, events, { k: 'room', text: PRIEST_LINES.herdDone });
    pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${q.steps[1].text}` });
  }
  events.push({ type: 'quest' });
}
/** 구름다리에서 기도를 한 번 올렸다 (LV-E8): 스스로 듣는 길로 11장을 끝내기 전의 기도만 센다. 화면에 내보내지 않는다. */
export function countPrayer(state) {
  if (state.dungeon || !PRIEST.prayAt.includes(state.place)) return;
  if ([...(state.main.done || []), ...(state.main.past || [])].some((d) => d.chapter === 11 && d.path === 'hear')) return;
  if (!state.cloud) state.cloud = { prayers: 0 };
  state.cloud.prayers = (state.cloud.prayers || 0) + 1;
}
/** 구름다리의 칸: 신전 문 앞의 "문 앞에 선다"(11장, 미루가 곁에 있을 때), 염소치기 움막의 "염소 치기"(서브). 할 수 있게 된 때에만 나온다. */
export function cloudSlots(state) {
  if (state.dungeon) return [];
  if (state.main.chapter === 11 && state.place === PRIEST.door && withMiru(state)) {
    const ok = bondOf(state, PRIEST.with) >= FAMILY;
    return [{ label: '문 앞에 선다', sub: '미루와 함께', action: { type: 'opendoor' }, disabled: !ok, why: ok ? '' : "미루와 '가족 같은' 사이여야 한다" }];
  }
  if (state.place === PRIEST.herdAt && herdOn(state)) return [{ label: '염소 치기', sub: `${state.quests[PRIEST.herdQuest].count || 0} / ${PRIEST.herd}`, action: { type: 'herd' } }];
  return [];
}

// ── 10장 늘 울리던 종 (JD-D) ──
/** 종루에 바칠 창: 내 손으로 지은 근위병의 창. 가방에 든 것 가운데 등급이 가장 낮은 것부터 바친다. */
export function mySpear(state) {
  const list = (state.bag || []).filter((it) => it.id === ECHO.spear && it.maker === state.name);
  return list.length ? list.reduce((a, b) => ((b.grade || 0) < (a.grade || 0) ? b : a)) : null;
}
const atAltar = (state) => state.place === ECHO.altar && !state.dungeon;
/**
 * 다시 짓는 길: 종루 꼭대기에 옛 청동 덩이 이백을 쌓고, 내 손으로 지은 근위병의 창을 얹는다. 바친 것은 돌아오지 않는다.
 * 청동이 모자란 동안은 가방의 청동을 있는 대로 쌓는다. 이백이 차면 창을 얹고 장이 끝난다.
 */
export function offerBronze(state, events) {
  if (state.main.chapter !== 10) throw new Error('지금은 바칠 수 없습니다');
  if (!atAltar(state)) throw new Error('빈 고리는 종루 꼭대기에 있습니다');
  const a = state.sunken;
  const left = ECHO.bronze - (a.bronze || 0);
  if (left > 0) {
    const have = countOf(state, ECHO.metal);
    if (have < 1) throw new Error('옛 청동 덩이가 없습니다');
    const n = Math.min(left, have);
    takeById(state, ECHO.metal, n);
    a.bronze = (a.bronze || 0) + n;
    pushLine(state, events, { k: 'me', text: `${ECHO_LINES.bronze} ${n}개. (${a.bronze} / ${ECHO.bronze})` });
    events.push({ type: 'bag' }); events.push({ type: 'quest' });
    return;
  }
  const spear = mySpear(state);
  if (!spear) throw new Error('내 손으로 지은 근위병의 창이 가방에 있어야 합니다');
  state.bag.splice(state.bag.indexOf(spear), 1);
  pushLine(state, events, { k: 'me', text: `${ECHO_LINES.spear} (${gearName(spear)})` });
  events.push({ type: 'bag' });
  finishMain(state, events, 'rebuild');
}
const patrolOn = (state) => { const st = state.quests[ECHO.patrolQuest]; return !!st && !st.done && st.step === 'walk'; };
/**
 * 서브 "근위병의 마지막 순찰" (JD-D7): 밤에 파랑과 함께 잠긴 거리를 한 걸음 돈다. 한 번 누르면 한 걸음이다. 숨은 그대로 닳는다.
 * 예순 걸음이면 한 바퀴다. 올라가 숨을 쉬고 와도 걸은 데부터 잇는다.
 */
export function patrolStep(state, events) {
  if (!patrolOn(state)) throw new Error('지금은 돌 길이 없습니다');
  if (state.place !== ECHO.patrolAt || state.dungeon) throw new Error('순찰 길은 잠긴 거리에 있습니다');
  if (state.phase !== 2) throw new Error('순찰은 밤에 돕니다');
  if (!state.party.some((c) => c.id === ECHO.patrolWith && !c.down && c.out !== state.day)) throw new Error('파랑이 곁에 있어야 합니다');
  const q = SUBS[ECHO.patrolQuest], st = state.quests[ECHO.patrolQuest];
  st.count = (st.count || 0) + 1;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `${ECHO_LINES.patrol[st.count % ECHO_LINES.patrol.length]} (${st.count} / ${ECHO.patrol})` });
  if (st.count === ECHO.patrol / 2) pushLine(state, events, { k: 'room', text: ECHO_LINES.patrolHalf });
  if (st.count >= ECHO.patrol) {
    st.step = q.steps[1].id; st.count = 0;
    pushLine(state, events, { k: 'room', text: ECHO_LINES.patrolDone });
    pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${q.steps[1].text}` });
  }
  events.push({ type: 'quest' });
}
/** 서브 "젖은 족보" (JD-D6): 퀘스트를 하는 동안 잠긴 거리에서 캐면 가끔 궤가 나온다. 다섯 권까지. */
export function ledgerScoop(state, events) {
  const st = state.quests[ECHO.ledgerQuest];
  if (state.place !== ECHO.ledgerAt || !st || st.done || countOf(state, ECHO.ledger) >= ECHO.ledgers) return;
  if (!chance(state, ECHO.ledgerRate)) return;
  addItem(state, ECHO.ledger, 1);
  pushLine(state, events, { k: 'sys', text: `${ECHO_LINES.ledger} (${countOf(state, ECHO.ledger)} / ${ECHO.ledgers})` });
  events.push({ type: 'bag' });
}
/** 잠긴 도성의 칸: 종루 꼭대기의 "청동을 바친다"·"창을 바친다"(10장), 잠긴 거리의 "순찰"(서브). 할 수 있게 된 때에만 나온다. */
export function sunkenSlots(state) {
  if (state.dungeon) return [];
  if (state.main.chapter === 10 && atAltar(state)) {
    const given = state.sunken?.bronze || 0;
    if (given < ECHO.bronze) {
      const have = countOf(state, ECHO.metal);
      return have > 0 || given > 0 ? [{ label: '청동을 바친다', sub: `${given} / ${ECHO.bronze}`, action: { type: 'bronze' }, disabled: have < 1, why: have < 1 ? '옛 청동 덩이가 없다' : '' }] : [];
    }
    const spear = mySpear(state);
    return [{ label: '창을 바친다', sub: spear ? gearName(spear) : '내 손으로 지은 근위병의 창', action: { type: 'bronze' }, disabled: !spear, why: spear ? '' : '내 손으로 지은 근위병의 창이 없다', ...(spear ? { confirm: `${gearName(spear)}. 종루에 바친 것은 돌아오지 않습니다.`, ask: { title: '창을 바칠까요?', no: '그만둔다', yes: '바친다' } } : {}) }];
  }
  if (state.place === ECHO.patrolAt && patrolOn(state)) {
    const st = state.quests[ECHO.patrolQuest];
    const with_ = state.party.some((c) => c.id === ECHO.patrolWith && !c.down && c.out !== state.day);
    const why = state.phase !== 2 ? '밤에 돈다' : !with_ ? '파랑이 곁에 있어야 한다' : '';
    return [{ label: '순찰', sub: `${st.count || 0} / ${ECHO.patrol}`, action: { type: 'patrol' }, disabled: !!why, why }];
  }
  return [];
}
void underwater;

// ── 8장 벼린 종 (AG-D) ──
/** '단골' 사이가 된 풀무꾼의 수. */
export const friendBellowers = (state) => BELLOWERS.filter((id) => bondOf(state, id) >= REGULAR).length;
/** 대에 걸 수 있는 것: 내 손으로 지은 영웅 등급 이상의 잿쇠 무기. 가방에 든 것 가운데 등급이 가장 낮은 것부터 건다(더 좋은 것은 남긴다). */
export function hangable(state) {
  const list = (state.bag || []).filter((it) => { const d = itemDef(it.id); return d.kind === 'gear' && d.slot === 'weapon' && d.tier === HANG.tier && !d.hideOf && (it.grade || 0) >= HANG.grade && it.maker === state.name; });
  return list.length ? list.reduce((a, b) => ((b.grade || 0) < (a.grade || 0) ? b : a)) : null;
}
const atArena = (state) => state.place === ARENA.place;
const atRow = (state) => state.place === ARENA.row;

/** 지어 보이는 길: 내가 지은 영웅 등급 이상의 잿쇠 무기를 마당의 대에 건다. 건 것은 돌아오지 않는다. */
export function hangBlade(state, events) {
  if (state.main.chapter !== 8) throw new Error('지금은 걸 수 없습니다');
  if (!atArena(state)) throw new Error('대는 겨루기 마당에 있습니다');
  const item = hangable(state);
  if (!item) throw new Error('내 손으로 지은 영웅 등급 이상의 잿쇠 무기가 가방에 있어야 합니다');
  state.bag.splice(state.bag.indexOf(item), 1);
  pushLine(state, events, { k: 'me', text: `${HANG_SAY} (${gearName(item)})` });
  events.push({ type: 'bag' });
  finishMain(state, events, 'forge');
}
/** 불을 끄는 길: 풀무꾼 다섯이 모두 '단골'이고 풀무 골목에서 삼백 번을 밀었으면, 골목의 풀무를 멈춘다. */
export function quenchFire(state, events) {
  if (state.main.chapter !== 8) throw new Error('지금은 할 일이 아닙니다');
  if (!atRow(state)) throw new Error('풀무 골목에서 할 일입니다');
  if (friendBellowers(state) < BELLOWERS.length) throw new Error("풀무꾼 다섯 모두와 '단골' 사이여야 합니다");
  if ((state.ash?.pumps || 0) < QUENCH_PUMPS) throw new Error(`풀무 골목에서 풀무질을 ${QUENCH_PUMPS}번 해야 합니다 (${state.ash?.pumps || 0} / ${QUENCH_PUMPS})`);
  pushLine(state, events, { k: 'me', text: QUENCH_SAY });
  finishMain(state, events, 'quench');
}
/** 8장의 칸: 마당의 "대에 건다", 풀무 골목의 "풀무를 멈춘다". 시안의 단축 칸에 없는 칸이라, 할 수 있게 된 때에만 나온다(얼마나 남았는지는 퀘스트 창의 길에 보인다). */
export function ashSlots(state) {
  if (state.main.chapter !== 8 || state.dungeon) return [];
  if (atArena(state)) {
    const item = hangable(state);
    return item ? [{ label: '대에 건다', sub: gearName(item), action: { type: 'hang' }, confirm: `${gearName(item)}. 대에 건 것은 돌아오지 않습니다.`, ask: { title: '대에 걸까요?', no: '그만둔다', yes: '건다' } }] : [];
  }
  if (atRow(state) && state.flags.metDarae) {
    const n = friendBellowers(state), p = Math.min(QUENCH_PUMPS, state.ash?.pumps || 0), ok = n >= BELLOWERS.length && p >= QUENCH_PUMPS;
    return ok ? [{ label: '풀무를 멈춘다', sub: `단골 ${n} / ${BELLOWERS.length} · 풀무질 ${p} / ${QUENCH_PUMPS}`, action: { type: 'quench' } }] : [];
  }
  return [];
}

// ── 잿골의 서브가 세는 것 (AG-D6, AG-D7) ──
/** 풀무 골목에서 풀무를 한 번 밀었다: "풀무꾼의 팔"은 하루 서른 번을 채운 날을 센다. */
export function pumpGoal(state, events) {
  if (!atRow(state)) return;
  for (const id of SUB_ORDER) {
    const st = state.quests[id];
    if (!st || st.done) continue;
    const q = SUBS[id], step = stepOf(q, st), g = step.goal?.pumpDays;
    if (!g) continue;
    if (st.pday !== state.day) { st.pday = state.day; st.pn = 0; }
    st.pn += 1;
    if (st.pn !== g[1]) continue;
    st.count = (st.count || 0) + 1;
    if (st.count >= g[0]) {
      st.step = q.steps[q.steps.indexOf(step) + 1].id;
      pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${stepOf(q, st).text}` });
    } else pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': 오늘 몫을 채웠다. (${st.count} / ${g[0]}일)` });
    events.push({ type: 'quest' });
  }
}
const emberOn = (state) => !!state.quests[EMBER.quest] && !state.quests[EMBER.quest].done;
/** 쇳물 내에서 캐기를 한 번 했다: "식은 가마"를 하는 동안은 식지 않은 재 한 줌을 같이 퍼 담는다. 첫 줌부터 식기 시작한다. */
export function emberScoop(state, events) {
  if (state.place !== EMBER.place || !emberOn(state) || countOf(state, EMBER.item) >= EMBER.n) return;
  if (countOf(state, EMBER.item) < 1) state.ash.ember = EMBER.moves;
  addItem(state, EMBER.item, 1);
  pushLine(state, events, { k: 'sys', text: `${EMBER_LINES.scoop} (${countOf(state, EMBER.item)} / ${EMBER.n})` });
  events.push({ type: 'bag' });
}
/** 한 번 움직였다: 퍼 담은 재는 열다섯 번 움직이는 동안만 붉다. 식으면 처음부터다. 퀘스트가 끝났으면 남은 재는 버려진다. */
export function emberMove(state, events) {
  const have = countOf(state, EMBER.item);
  if (!have) { if (state.ash) state.ash.ember = 0; return; }
  if (!emberOn(state)) { takeById(state, EMBER.item, have); state.ash.ember = 0; return; }
  state.ash.ember = Math.max(0, (state.ash.ember || 0) - 1);
  if (state.ash.ember > 0) return;
  takeById(state, EMBER.item, have);
  pushLine(state, events, { k: 'sys', text: EMBER_LINES.cold, tone: 'warn' });
  events.push({ type: 'bag' });
}

// ── 7장 팔린 종 (SB-F) ──
/** '단골' 사이가 된 저울꾼의 수. */
export const turnedWeighers = (state) => WEIGHERS.filter((id) => bondOf(state, id) >= REGULAR).length;
const atWarehouse = (state) => state.place === 'warehouse' && !state.dungeon;

/** 사 모으는 길: 조각 하나를 제값에 산다. 일곱째를 사면 장이 끝난다. 쥐면 울리지만 그 띠링은 기록에 남지 않는다. */
export function buyShard(state, events) {
  if (state.main.chapter !== 7) throw new Error('지금은 살 수 없습니다');
  if (!atWarehouse(state) || !state.flags.metYugyeom) throw new Error('조각은 상단 창고 앞의 대리인이 팝니다');
  if (state.silver < SHARD.price) throw new Error(`은화가 모자랍니다 (${state.silver} / ${SHARD.price})`);
  state.silver -= SHARD.price;
  state.flags.shards = (state.flags.shards || 0) + 1;
  pushLine(state, events, { k: 'me', text: `${SHARD_SAY} 은화 −${SHARD.price}. (${state.flags.shards} / ${SHARD.n})` });
  events.push({ type: 'trade' });
  if (state.flags.shards >= SHARD.n) finishMain(state, events, 'buy');
}
/** 돌려세우는 길: 저울꾼 다섯이 모두 '단골'이면 창고 앞에서 저울을 내려놓게 한다. */
export function turnWeighers(state, events) {
  if (state.main.chapter !== 7) throw new Error('지금은 할 말이 없습니다');
  if (!atWarehouse(state)) throw new Error('창고 앞에서 할 일입니다');
  if (turnedWeighers(state) < WEIGHERS.length) throw new Error("저울꾼 다섯 모두와 '단골' 사이여야 합니다");
  pushLine(state, events, { k: 'me', text: TURN_SAY });
  finishMain(state, events, 'turn');
}
/** 상단 창고 앞의 단축 칸에 놓일 7장의 칸 둘. 대리인을 만난 뒤에만 보인다. */
export function shardSlots(state) {
  if (state.main.chapter !== 7 || !atWarehouse(state) || !state.flags.metYugyeom) return [];
  const n = turnedWeighers(state), all = n >= WEIGHERS.length, short = state.silver < SHARD.price;
  return [
    { label: `조각 사기 (은화 ${SHARD.price.toLocaleString('en-US')})`, sub: `${state.flags.shards || 0} / ${SHARD.n}`, action: { type: 'shard' }, disabled: short, why: short ? '은화가 모자란다' : '', confirm: `은화 ${SHARD.price.toLocaleString('en-US')}을 내고 조각 하나를 삽니다.`, ask: { title: '조각을 살까요?', no: '그만둔다', yes: '산다' } },
    { label: '저울꾼을 돌려세운다', sub: `단골 ${n} / ${WEIGHERS.length}`, action: { type: 'turn' }, disabled: !all, why: all ? '' : "다섯 모두와 '단골' 사이여야 한다" },
  ];
}

/** 6장 말하는 길: 종루 아래에서 종지기를 설득한다. '가족 같은' 사이여야 한다 (WM-D5). */
export function persuadeHansol(state, events) {
  if (state.main.chapter !== 6) throw new Error('지금은 할 말이 없습니다');
  if (state.place !== 'underbell' || state.dungeon) throw new Error('종지기는 종루 아래에 있습니다');
  if (bondOf(state, 'hansol') < FAMILY) throw new Error("종지기와 '가족 같은 사이'여야 합니다");
  pushLine(state, events, { k: 'me', text: PERSUADE_SAY });
  finishMain(state, events, 'talk');
}
/** 종루 아래의 단축 칸에 놓일 설득 칸. 종지기를 만난 뒤에만 보인다. */
export function persuadeSlot(state) {
  if (state.main.chapter !== 6 || state.place !== 'underbell' || !state.flags.metHansol) return null;
  const ok = bondOf(state, 'hansol') >= FAMILY;
  return { label: '한솔을 설득한다', action: { type: 'persuade' }, disabled: !ok, why: ok ? '' : "'가족 같은 사이'여야 한다" };
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

  if (action.type === 'act' && action.id === 'pray') countPrayer(state); // 구름다리에서 올린 기도 (LV-E8)
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
  if (gathered && gathered.action === 'fish' && state.place === 'river' && rod && !rod.done && rod.step === 'find' && countOf(state, 'oldrod') < 1 && chance(state, 0.2)) {
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

  // 메인 6장: 끝까지 하는 길. 얼음 구멍에서 낚시를 달인까지 올리면 종이 스스로 깬다 (WM-D4)
  // 메인 11장: 스스로 듣는 길. 신전 문 앞에서 기도를 달인까지 올리면 문밖에서 종이 답한다 (GD-E4)
  if (state.main.chapter === 11 && action.type === 'act' && action.id === 'pray' && state.place === PRIEST.door && !state.dungeon && (state.skills.pray?.grade || 0) >= MASTER_GRADE && !state.battle && !state.choice) finishMain(state, events, 'hear');
  if (state.main.chapter === 6 && gathered?.action === 'fish' && state.place === 'icehole' && (state.skills.fishing?.grade || 0) >= MASTER_GRADE && !state.battle && !state.choice) finishMain(state, events, 'fish');

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
