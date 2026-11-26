// 환생 (Z32). 쓰러진 뒤 신전에서 눈을 뜨는 대신 다시 태어날 수 있다.
// 몸은 처음부터 다시지만, 종이 기억한 것(히든 스탯, 다시 일어선 몸으로 오른 스탯, 칭호, 도감), 숙련도의 5%, 보관함은 가지고 간다.

import { HIDDEN } from './hidden.js?v=c0f458e';
import { xpNeeded, MAX_GRADE } from './skills.js?v=c0f458e';

export const SKILL_KEEP = 0.05; // 숙련도의 이만큼을 가지고 간다
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
import { JOBS, HIDDEN_JOBS } from '../data/jobs.js?v=c0f458e';
const jobName = (id) => (id ? (JOBS[id] || HIDDEN_JOBS[id])?.name || id : null);

const STATS = ['str', 'agi', 'con', 'wis'];
const dexEntries = (s) => Object.values(s.dex || {}).reduce((n, v) => n + (v && typeof v === 'object' ? Object.keys(v).length : 0), 0);

/** 지금의 삶에서 가지고 갈 것. 상태는 고치지 않는다. */
export function rebirthCarry(state) {
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
    // 보관함은 통째로 남는다 (Z42): 맡긴 은화와 물건
    bank: Object.fromEntries(Object.entries(state.store || {}).filter(([, box]) => (box.silver || 0) > 0 || (box.items || []).length).map(([town, box]) => [town, { silver: box.silver || 0, items: JSON.parse(JSON.stringify(box.items || [])) }])),
    skills: Object.fromEntries(Object.entries(state.skills || {}).map(([id, sk]) => [id, Math.floor(skillTotal(sk) * SKILL_KEEP)]).filter(([, n]) => n > 0)),
    pastLives: [...(state.pastLives || []), { name: state.name, job: jobName(state.job), level: state.level, day: state.day }],
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
  };
}

/** 새로 만든 상태에 지난 삶의 것을 얹는다 (createGame이 부른다). */
export function applyCarry(state, carry) {
  state.lives = carry.lives;
  // 맡긴 은화는 장부에 남아 있다 (Z42). 그 마을 보관함에 들르면 주인이 알아본다
  for (const [town, box] of Object.entries(carry.bank || {})) state.store[town] = { items: JSON.parse(JSON.stringify(box.items || [])), silver: box.silver || 0 };
  if (Object.keys(carry.bank || {}).length) state.flags.pastBank = Object.keys(carry.bank);
  // 숙련도의 5%: 새 출신이 처음부터 가진 숙련도 위에 더한다
  for (const [id, n] of Object.entries(carry.skills || {})) {
    const sk = state.skills[id] || { grade: 0, xp: 0, uses: 0 };
    state.skills[id] = { ...sk, ...fromTotal(skillTotal(sk) + n) };
  }
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
