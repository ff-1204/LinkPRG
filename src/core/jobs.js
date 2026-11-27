// 직업과 히든 직업 (T4~T9, N4-3, N4-4, N5).

import { pushLine, ding } from './log.js?v=3174526';
import { JOBS, JOB_ORDER, HIDDEN_JOBS, HIDDEN_JOB_ORDER, JOB_LEVEL, JOB_XP, SKILL_LEVELS, NAMELESS_LEVEL, jobDef, ADVANCED, ADVANCE_LEVEL } from '../data/jobs.js?v=3174526';
import { placeById } from '../data/places.js?v=3174526';
import { guildPerk } from './guild.js?v=3174526';
import { SKILL_NAMES, gradeLabel } from './skills.js?v=3174526';
import { itemDef } from '../data/items.js?v=3174526';
import { addItem } from './inventory.js?v=3174526';
import { eulReul, iGa } from './ko.js?v=3174526';
import { xpBoost } from './buffs.js?v=3174526';

/** 보이는 직업 이름. */
export function jobName(state) {
  return ADVANCED[state.job2]?.name || jobDef(state.job)?.name || '무직';
}

/** 2차 전직의 효과(없으면 빈 것). */
export function adv(state) {
  return ADVANCED[state.job2] || {};
}

/** 2차 전직 창이 그릴 것: 내 직업에서 갈라지는 둘. */
export function advanceView(state) {
  const list = Object.entries(ADVANCED).filter(([, a]) => a.from === state.job).map(([id, a]) => ({ id, name: a.name, text: a.text }));
  const why = state.job2 ? '이미 골랐습니다' : !JOBS[state.job] ? '기본 직업이 있어야 합니다' : state.level < ADVANCE_LEVEL ? `레벨 ${ADVANCE_LEVEL}부터 고를 수 있습니다` : '';
  return { list, can: !why, why, level: ADVANCE_LEVEL, chosen: state.job2 ? ADVANCED[state.job2].name : '' };
}

export function chooseAdvance(state, events, id) {
  const a = ADVANCED[id];
  if (!a) throw new Error('모르는 갈림입니다');
  if (!placeById(state.place).actions.includes('advance')) throw new Error('2차 전직은 소리재의 장인 거리에서 합니다');
  if (state.job2) throw new Error('2차 전직은 한 번뿐입니다');
  if (a.from !== state.job) throw new Error('내 직업에서 갈라지는 길이 아닙니다');
  if (state.level < ADVANCE_LEVEL) throw new Error(`레벨 ${ADVANCE_LEVEL}부터 고를 수 있습니다`);
  state.job2 = id;
  if (a.hp) state.hp += a.hp;
  ding(state, events, { level: 3, kind: 'job', title: `${iGa(`'${a.name}'`)} 되었습니다`, big: a.name, body: `${a.text}. 되돌릴 수 없습니다.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `장인 거리에서 ${eulReul(a.name)} 골랐다. 다른 쪽 길은 이제 없다.`, note: `${iGa(a.name)} 된 날` });
  events.push({ type: 'job' });
}

/** 지금 쓸 수 있는 직업 스킬 (레벨 5, 10, 15, 20에 하나씩 열린다). */
export function skillsNow(state) {
  const def = jobDef(state.job);
  if (!def) return [];
  return def.skills.map((sk, i) => ({ ...sk, at: SKILL_LEVELS[i], open: state.level >= SKILL_LEVELS[i] }));
}

/** 피로 80 이상에서 일하면 숙련도가 1.5배로 오른다 (Z75, 사용자 요청). 싸우는 중은 일이 아니다. */
export const TIRED_PUSH = { at: 80, xp: 1.5 };
export const tiredPush = (state) => (state.tired || 0) >= TIRED_PUSH.at && !state.battle;

/** 그 숙련도가 직업 덕에 얼마나 빨리 오르는지 (T5). */
export function jobXp(state, skillId, repeated = false) {
  const def = jobDef(state.job);
  let m = state.buffs ? xpBoost(state) : 1; // 감상·음식의 힘도 여기서 곱한다
  if (['smithing', 'sculpting', 'cooking'].includes(skillId)) m *= 1 + guildPerk(state, 'craft'); // 모루회
  if (state.flags?.allSkill5) m *= 1.05; // 종지기의 아이
  if (state.anvil?.end === 'cool') m *= 1.1; // 모루를 식힌 뒤: 모든 숙련도가 조금 빨리 오른다 (CM-D6)
  if (state.ending === 'free') m *= 1.1; // 푼 뒤: 재주는 다시 사람의 것. 모든 숙련도가 조금 빨리 오른다
  if (state.ending === 'mend') m *= 1 + (state.hidden?.echo?.value || 0) * 0.01;
  if (tiredPush(state)) m *= TIRED_PUSH.xp; // 피로 80 이상에서 하는 일 (Z75): 숙련도 1.5배. 싸움은 빼고
  if (!def) return m;
  if (def.fast?.includes(skillId)) m *= JOB_XP;
  if (def.fastAll && (def.id !== 'oneway' || repeated)) m *= def.fastAll;
  return m;
}

/** 직업 고르기 창이 그릴 것 (N4-3). 내 숙련도와 맞는 직업을 알려 준다. */
export function jobChoices(state) {
  const best = Math.max(0, ...Object.values(state.skills).map((s) => s.grade));
  return JOB_ORDER.map((id) => {
    const j = JOBS[id];
    const mine = Math.max(0, ...j.fast.map((f) => state.skills[f]?.grade || 0));
    return {
      id, name: j.name, role: j.role, next: j.next,
      first: { name: j.skills[0].name, text: j.skills[0].text },
      fast: j.fast.map((f) => SKILL_NAMES[f] || f), fastNow: j.fast.map((f) => `${SKILL_NAMES[f] || f} ${state.skills[f] ? gradeLabel(state.skills[f].grade) : '안 해 봄'}`),
      match: mine > 0 && mine >= best,
      gear: itemDef(j.gear).name,
    };
  });
}

export function canChooseJob(state) {
  return state.level >= JOB_LEVEL && !state.job;
}

export function chooseJob(state, events, id) {
  const j = JOBS[id];
  if (!j) throw new Error('모르는 직업입니다');
  if (state.job) throw new Error('직업은 한 번만 고를 수 있습니다');
  if (state.level < JOB_LEVEL) throw new Error(`직업은 레벨 ${JOB_LEVEL}에 고릅니다`);
  state.job = id;
  state.jobAsked = true;
  addItem(state, j.gear, 1);
  ding(state, events, { level: 3, kind: 'job', title: `직업 ${eulReul(`'${j.name}'`)} 얻었습니다`, big: j.name, body: `첫 스킬: ${j.skills[0].name}. ${j.fast.map((f) => SKILL_NAMES[f] || f).join(', ')} 숙련도가 1.5배로 오릅니다. ${itemDef(j.gear).name} 하나를 받았습니다.`, });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${eulReul(j.name)} 골랐다. ${j.role}. 이제 물릴 수 없다.`, note: `${iGa(j.name)} 된 날` });
  events.push({ type: 'job' });
}

/** "아직 고르지 않는다". 일지에서 다시 열 수 있다 (N4-4). */
export function skipJob(state, events) {
  state.jobAsked = true;
  pushLine(state, events, { k: 'me', text: '아직 고르지 않기로 했다. 고르지 않고 가는 길도 길이라고, 누가 그랬다.' });
  events.push({ type: 'job' });
}

// ── 히든 직업 ──

function hiddenJobFound(state, id) {
  if (id === 'oneway') return (state.hidden.endure?.value || 0) >= 1 && state.hq.favor?.status === 'done';
  if (id === 'handlight') return (state.hidden.art?.value || 0) >= 1 && (state.hidden.craft?.value || 0) >= 1 && !!state.flags.readAnvil;
  if (id === 'nameless') return state.level >= NAMELESS_LEVEL && !state.job;
  return false;
}

/** 조건을 채운 히든 직업이 있으면 제안한다. 가장 큰 띠링과 찾은 까닭 (N5-1). */
export function offerHiddenJob(state, events) {
  if (state.battle || state.choice || state.craft || state.sculpt || state.dungeon) return false;
  if (state.job && HIDDEN_JOBS[state.job]) return false;
  for (const id of HIDDEN_JOB_ORDER) {
    if (state.hjobs[id] || !hiddenJobFound(state, id)) continue;
    const j = HIDDEN_JOBS[id];
    state.hjobs[id] = 'offered';
    pushLine(state, events, { k: 'room', text: j.offer });
    ding(state, events, { level: 4, kind: 'hiddenjob', title: `히든 직업을 찾았습니다: ${j.name}`, big: j.name, body: `얻는 것: ${j.gain}. 잃는 것: ${j.lose}.`, reason: j.why });
    state.choice = { kind: 'hjob', id };
    events.push({ type: 'choice' });
    return true;
  }
  return false;
}

export function hiddenJobView(state, id) {
  const j = HIDDEN_JOBS[id];
  return { id, name: j.name, why: j.why, gain: j.gain, lose: j.lose, text: j.offer, had: state.job ? jobName(state) : '' };
}

/** 받거나 거절한다. 거절해도 벌은 없지만 다시 오지 않는다 (N5-3). */
export function answerHiddenJob(state, events, id, accept) {
  const j = HIDDEN_JOBS[id];
  if (!j || state.hjobs[id] !== 'offered') throw new Error('고를 수 없는 것입니다');
  state.choice = null;
  if (!accept) {
    state.hjobs[id] = 'declined';
    pushLine(state, events, { k: 'me', text: '고개를 저었다. 그 길은 다시 열리지 않을 것이다.' });
    events.push({ type: 'job' });
    return;
  }
  const had = state.job ? jobName(state) : '';
  state.hjobs[id] = 'taken';
  state.job = id;
  state.job2 = null; // 2차 전직은 내려놓은 직업의 것이다. 같이 내려놓는다 (T8)
  for (const [slot, item] of Object.entries(state.equip)) {
    if (!item || !itemDef(item.id).job) continue;
    state.equip[slot] = null;
    state.bag.push(item);
    pushLine(state, events, { k: 'sys', text: `${eulReul(itemDef(item.id).name)} 벗었다. 이제는 쓸 수 없는 물건이다.` });
  }
  // 가상 유저도 본다 (N5-4)
  pushLine(state, events, { k: 'user', who: "지나가던 유저 '밤비노'", text: '어 방금 뭐임? 계통도에 없는 직업인데?' });
  state.jobAsked = true;
  ding(state, events, { level: 4, kind: 'hiddenjob', title: `히든 직업 ${eulReul(`'${j.name}'`)} 얻었습니다`, big: j.name, body: j.gain, reason: j.why });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${had ? `${eulReul(had)} 내려놓고 ` : ''}${j.name}이 되었다. 계통도 어디에도 없는 이름이다.`, note: `${j.name}이 된 날` });
  events.push({ type: 'job' });
}

/** 도감의 직업 갈래: 찾은 것과 놓친 것. */
export function hiddenJobTraces(state) {
  return HIDDEN_JOB_ORDER.filter((id) => state.hjobs[id]).map((id) => ({ id, name: HIDDEN_JOBS[id].name, status: state.hjobs[id], why: HIDDEN_JOBS[id].why }));
}
