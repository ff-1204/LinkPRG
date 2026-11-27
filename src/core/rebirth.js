// 환생 (Z32). 쓰러진 뒤 신전에서 눈을 뜨는 대신 다시 태어날 수 있다.
// 몸은 처음부터 다시지만, 종이 기억한 것(히든 스탯, 다시 일어선 몸으로 오른 스탯, 칭호, 도감), 보관함은 가지고 간다.
// 손에 익은 것도 남는다 (Z98, 사용자 결정): 숙련도 전부, 제작 레벨, 던전 지도, 그리고 쌓은 경험치의 1%(그만큼 레벨과 스탯 점수가 다시 붙는다).

import { shopCarry } from './workshop.js?v=6ec1303';
import { HIDDEN } from './hidden.js?v=6ec1303';
import { xpNeeded, MAX_GRADE } from './skills.js?v=6ec1303';
import { xpToNext, gainXp } from './level.js?v=6ec1303';

export const SKILL_KEEP = 1; // 숙련도의 이만큼을 가지고 간다 (Z98: 5% → 전부)
export const XP_KEEP = 0.01; // 레벨에 쌓은 경험치의 이만큼을 가지고 간다 (Z98)
/** 스스로 고르는 환생 (LV-M3, SB-E): 끝낸 메인 장 하나마다 남는 경험치가 0.5%p씩 늘고, 출신 패를 한 장 더 뒤집는다. */
export const CHOSEN = { perChapter: 0.005, cards: 1 };
export const ORIGIN_CARDS = 5;
/** 이번 삶과 지난 삶들에서 끝낸 메인 장 (장 번호마다 하나, 이번 삶의 것이 먼저). */
export function chaptersDone(state) {
  const out = [];
  for (const d of [...(state.main?.done || []), ...(state.main?.past || [])]) if (d && !out.some((x) => x.chapter === d.chapter)) out.push({ chapter: d.chapter, path: d.path });
  return out.sort((a, b) => a.chapter - b.chapter);
}
/** 가지고 가는 경험치의 몫: 운으로 태어나면 1%, 스스로 고르면 끝낸 장마다 0.5%p 더. */
export const xpKeepOf = (state, chosen) => XP_KEEP + (chosen ? CHOSEN.perChapter * chaptersDone(state).length : 0);
/** 지금 레벨까지 쌓은 경험치 전부. */
export function levelTotal(state) {
  let t = state.xp || 0;
  for (let l = 1; l < (state.level || 1); l++) t += xpToNext(l);
  return t;
}
/** 숙련도에 쌓인 경험치 전부. */
export function skillTotal(sk) {
  let t = sk.xp || 0;
  for (let g = 0; g < (sk.grade || 0); g++) t += xpNeeded(g);
  return t;
}
/** 쌓인 경험치를 등급과 남은 경험치로 되돌린다. */
function fromTotal(total) {
  let grade = 0, xp = Math.floor(total);
  while (grade < MAX_GRADE && xp >= xpNeeded(grade)) { xp -= xpNeeded(grade); grade++; }
  return { grade, xp };
}
import { JOBS, HIDDEN_JOBS } from '../data/jobs.js?v=6ec1303';
const jobName = (id) => (id ? (JOBS[id] || HIDDEN_JOBS[id])?.name || id : null);

const STATS = ['str', 'agi', 'con', 'wis'];
const dexEntries = (s) => Object.values(s.dex || {}).reduce((n, v) => n + (v && typeof v === 'object' ? Object.keys(v).length : 0), 0);

/**
 * 지금의 삶에서 가지고 갈 것. 상태는 고치지 않는다.
 * chosen: 사당에서 스스로 고른 환생 (SB-E). 덤이 붙고, 끝낸 장과 열린 길을 안고 간다. 쓰러져 운으로 태어나는 것(Z32)은 지금 그대로다.
 */
export function rebirthCarry(state, { chosen = false } = {}) {
  const pastHidden = {};
  for (const def of HIDDEN) {
    let n = def.count(state) + (state.pastHidden?.[def.id] || 0);
    // 통찰은 도감 칸 수로도 센다. 도감은 가지고 가니 그 몫은 빼 두어야 두 번 세지 않는다
    if (def.id === 'insight') n = Math.max(0, n - Math.floor(dexEntries(state) * 0.6));
    if (n > 0) pastHidden[def.id] = n;
  }
  const hidden = {};
  for (const [id, slot] of Object.entries(state.hidden || {})) if (slot && slot.value > 0) hidden[id] = { value: slot.value, half: true };
  const toughGained = Object.fromEntries(STATS.map((k) => [k, state.toughGained?.[k] || 0]));
  return {
    lives: (state.lives || 1) + 1,
    cid: state.cid || null, // 같은 캐릭터의 다음 삶이다 (Z96)
    // 보관함은 통째로 남는다 (Z42): 맡긴 은화와 물건
    bank: Object.fromEntries(Object.entries(state.store || {}).filter(([, box]) => (box.silver || 0) > 0 || (box.items || []).length).map(([town, box]) => [town, { silver: box.silver || 0, items: JSON.parse(JSON.stringify(box.items || [])) }])),
    skills: Object.fromEntries(Object.entries(state.skills || {}).map(([id, sk]) => [id, Math.floor(skillTotal(sk) * SKILL_KEEP)]).filter(([, n]) => n > 0)),
    xp: Math.floor(levelTotal(state) * xpKeepOf(state, chosen)),
    xpRate: xpKeepOf(state, chosen),
    // 가게는 남는다 (LV-K11, SB-E2). 찾은 옛 우물도 지도와 함께 남는다
    stall: state.stall ? JSON.parse(JSON.stringify(state.stall)) : null,
    caravan: !!state.caravan, // 상단 깃발도 남는다. 가던 짐과 들은 소문은 지난 삶의 것이다 (GD-D)
    shop: shopCarry(state), // 공방은 남고 견습은 떠난다 (LV-K11)
    wells: [...(state.wells || [])],
    chosen,
    cards: ORIGIN_CARDS + (chosen ? CHOSEN.cards : 0),
    // 스스로 고른 삶은 끝낸 장을 건너뛰거나 다른 길로 다시 푼다 (SB-E3). 열린 길은 그대로 다닌다. 고른 끝이 바꾼 규칙도 그대로다
    ...(chosen ? {
      mainPast: chaptersDone(state),
      opened: [...(state.opened || [])],
      ending: state.ending ? { id: state.ending, endDay: state.endDay || 0, rung: JSON.parse(JSON.stringify(state.rung || { day: 0, ks: [], total: 0 })) } : null,
      lode: state.flags?.lode ?? null,
      // 13장에서 새긴 끝이 바꾼 규칙도 그대로다 (CM-D10). 다시 풀면 걷힌다
      anvil: state.anvil?.end ? { end: state.anvil.end, endDay: state.anvil.endDay || 0, tent: !!state.anvil.tent } : null,
    } : {}),
    promoBest: [...(state.promoBest || [])], // 걸작으로 지은 승급작도 남는다 (CM-E)
    endsSeen: [...(state.anvil?.seen || [])], // 본 끝들은 삶을 넘어 남는다 (CM-E)
    craftLv: JSON.parse(JSON.stringify(state.craftLv || {})),
    craftTier: { ...(state.craftTier || {}) },
    // 던전은 지도(본 방)만 남는다. 연 문, 챙긴 보물, 문지기와의 일은 새 삶에서 다시 한다
    maps: Object.fromEntries(Object.entries(state.dmem || {}).filter(([, m]) => m && (m.seen || []).length).map(([id, m]) => [id, [...m.seen]])),
    pastLives: [...(state.pastLives || []), { name: state.name, job: jobName(state.job), level: state.level, day: state.day, ...(chosen ? { chose: true } : {}) }],
    pastHidden,
    hidden,
    toughGained,
    tough: Object.fromEntries(STATS.map((k) => [k, state.tough?.[k] || 0])),
    titles: (state.titles || []).map((t) => ({ ...t })),
    title: state.title || null,
    world: JSON.parse(JSON.stringify(state.world)),
    mail: JSON.parse(JSON.stringify(state.mail || { got: [] })), // 우편함은 이어받는다: 같은 편지가 다시 오지 않는다 (Z59)
    dex: JSON.parse(JSON.stringify(state.dex || {})),
    day: state.day,
    phase: state.phase,
  };
}

/** 내려놓는 것 (확인 창에 보인다). */
export function rebirthLoss(state) {
  return {
    level: state.level,
    skills: Object.keys(state.skills || {}).length,
    job: jobName(state.job),
    silver: state.silver,
    chapter: state.main?.chapter || 1,
    people: Object.keys(state.people || {}).length,
    guild: !!state.guild,
    stall: !!state.stall,
    shop: !!state.shop, hand: !!state.shop?.hand,
    chapters: chaptersDone(state).length,
  };
}

/** 새로 만든 상태에 지난 삶의 것을 얹는다 (createGame이 부른다). */
export function applyCarry(state, carry) {
  state.lives = carry.lives;
  if (state.anvil && Array.isArray(carry.endsSeen)) state.anvil.seen = [...carry.endsSeen];
  if (Array.isArray(carry.promoBest) && carry.promoBest.length) state.promoBest = [...carry.promoBest];
  if (carry.stall) state.stall = JSON.parse(JSON.stringify(carry.stall));
  if (carry.caravan) state.caravan = { load: null, past: [], heard: {}, sent: 0 };
  if (carry.shop) state.shop = JSON.parse(JSON.stringify(carry.shop));
  if (carry.wells) state.wells = [...carry.wells];
  if (carry.chosen) {
    state.main.past = (carry.mainPast || []).map((x) => ({ ...x }));
    state.opened = [...new Set([...(state.opened || []), ...(carry.opened || [])])];
    let ch = 1;
    while (state.main.past.some((x) => x.chapter === ch)) ch += 1;
    state.main.chapter = ch;
    if (carry.ending) { state.ending = carry.ending.id; state.endDay = carry.ending.endDay; state.rung = JSON.parse(JSON.stringify(carry.ending.rung)); state.dingsAtEnd = 0; }
    // 지난 삶의 길이 남긴 것: 폐허의 문지기가 살아 있는가(2장), 광맥을 어떻게 했는가(3장)
    const ch2 = state.main.past.find((x) => x.chapter === 2);
    if (ch2) state.flags.keeperAlive = ch2.path !== 'beat';
    if (carry.lode != null) state.flags.lode = carry.lode;
    if (carry.anvil && state.anvil && state.main.past.some((x) => x.chapter === 13)) Object.assign(state.anvil, { end: carry.anvil.end, endDay: carry.anvil.endDay, built: true, tent: !!carry.anvil.tent });
  }
  // 맡긴 은화는 장부에 남아 있다 (Z42). 그 마을 보관함에 들르면 주인이 알아본다
  for (const [town, box] of Object.entries(carry.bank || {})) state.store[town] = { items: JSON.parse(JSON.stringify(box.items || [])), silver: box.silver || 0 };
  if (Object.keys(carry.bank || {}).length) state.flags.pastBank = Object.keys(carry.bank);
  // 숙련도의 5%: 새 출신이 처음부터 가진 숙련도 위에 더한다
  for (const [id, n] of Object.entries(carry.skills || {})) {
    const sk = state.skills[id] || { grade: 0, xp: 0, uses: 0 };
    state.skills[id] = { ...sk, ...fromTotal(skillTotal(sk) + n) };
  }
  // 경험치의 1%: 그만큼 레벨이 오르고, 오른 레벨만큼 스탯 점수가 붙는다 (Z98)
  if (carry.xp > 0) gainXp(state, carry.xp);
  // 제작 레벨은 그대로 (새 출신이 더 높으면 높은 쪽)
  for (const [k, v] of Object.entries(carry.craftLv || {})) {
    const mine = state.craftLv[k];
    if (v && Number.isFinite(v.lv) && (!mine || v.lv > mine.lv || (v.lv === mine.lv && (v.xp || 0) > (mine.xp || 0)))) state.craftLv[k] = { lv: v.lv, xp: v.xp || 0 };
  }
  for (const [k, v] of Object.entries(carry.craftTier || {})) if (Number.isInteger(v) && v > (state.craftTier[k] || 1)) state.craftTier[k] = v;
  for (const [id, seen] of Object.entries(carry.maps || {})) state.dmem[id] = { seen: [...seen], done: {}, nights: 0, keeper: null };
  state.pastLives = carry.pastLives.map((x) => ({ ...x }));
  state.pastHidden = { ...carry.pastHidden };
  state.hidden = Object.fromEntries(Object.entries(carry.hidden).map(([id, s]) => [id, { ...s }]));
  state.toughGained = { ...carry.toughGained };
  state.tough = { ...carry.tough };
  for (const k of STATS) state.stats[k] += carry.toughGained[k] || 0;
  state.titles = carry.titles.map((t) => ({ ...t }));
  state.title = carry.title && state.titles.some((t) => t.id === carry.title) ? carry.title : null;
  state.world = JSON.parse(JSON.stringify(carry.world));
  if (carry.mail) state.mail = JSON.parse(JSON.stringify(carry.mail));
  // 도감(본 괴물·물건·곳·짐승·요리)은 남는다. 새 출신이 처음부터 아는 것도 더한다
  for (const [k, v] of Object.entries(carry.dex || {})) state.dex[k] = { ...(state.dex[k] || {}), ...JSON.parse(JSON.stringify(v)) };
  // 날짜는 이어 센다: 같은 날 다시 일어선 몸을 또 쌓지 못한다
  state.day = carry.day;
  state.phase = carry.phase;
  state.flags.toughDay = carry.day;
}
