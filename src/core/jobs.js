// 직업과 히든 직업 (T4~T9, N4-3, N4-4, N5).

import { pushLine, ding } from './log.js?v=e3b52b1';
import { JOBS, JOB_ORDER, HIDDEN_JOBS, HIDDEN_JOB_ORDER, JOB_LEVEL, JOB_XP, SKILL_LEVELS, NAMELESS_LEVEL, jobDef, ADVANCED, ADVANCE_LEVEL, TIER3, TIER4, TIER_LEVEL, SKILL_SLOTS } from '../data/jobs.js?v=e3b52b1';
import { placeById } from '../data/places.js?v=e3b52b1';
import { guildPerk } from './guild.js?v=e3b52b1';
import { SKILL_NAMES, gradeLabel } from './skills.js?v=e3b52b1';
import { itemDef } from '../data/items.js?v=e3b52b1';
import { addItem } from './inventory.js?v=e3b52b1';
import { eulReul, iGa } from './ko.js?v=e3b52b1';
import { xpBoost } from './buffs.js?v=e3b52b1';
import { priestOpen, PRIEST_LUCK, bondFx, foundLuck } from './statplan.js?v=e3b52b1';
import { PRIEST_LOCK } from '../data/statinfo.js?v=e3b52b1';
import { originById } from '../data/origins.js?v=e3b52b1';

/** 보이는 직업 이름. */
export function jobName(state) {
  if (state.job2 && state.job4) return TIER4[state.job2].name; // 3·4차 (Z126)
  if (state.job2 && state.job3) return TIER3[state.job2].name;
  return ADVANCED[state.job2]?.name || jobDef(state.job)?.name || '무직';
}

/** 2차 전직의 효과(없으면 빈 것). */
export function adv(state) {
  const a = ADVANCED[state.job2];
  if (!a) return {};
  const p = state.job3 ? TIER3[state.job2]?.pas : null; // 3차의 늘 붙는 효과 (Z126)
  if (!p) return a;
  const out = { ...a };
  for (const k of ['hp', 'guard', 'sense', 'wardCut']) if (p[k]) out[k] = (out[k] || 0) + p[k];
  for (const k of ['rage', 'friend', 'heal', 'first', 'dropUp']) if (p[k]) out[k] = (out[k] || 1) * p[k];
  if (p.weak) out.weak = (out.weak || 1.5) + p.weak;
  if (p.critMult) out.critMult = p.critMult;
  return out;
}

/** 3·4차 전직 창이 그릴 것 (Z126): 다음 단계, 열리는 레벨, 할 수 있는가. */
export function promoteView(state) {
  const tier = state.job4 ? null : state.job3 ? 4 : state.job2 ? 3 : null;
  if (!tier) return null;
  const t = (tier === 3 ? TIER3 : TIER4)[state.job2];
  const why = state.level < TIER_LEVEL[tier] ? `레벨 ${TIER_LEVEL[tier]}부터` : !placeById(state.place).actions.includes('advance') ? '장인 거리에서 한다' : '';
  return { tier, name: t.name, level: TIER_LEVEL[tier], can: !why, why, skills: t.skills.map((s) => ({ name: s.name, kind: s.kind, text: s.text })), pas: t.pasName ? { name: t.pasName, text: t.pasText } : null };
}

/** 3·4차 전직 (Z126): 고를 것이 없어 바로 된다. 2차를 한 장인 거리에서. */
export function promote(state, events) {
  const v = promoteView(state);
  if (!v) throw new Error(state.job4 ? '이미 마지막 전직입니다' : '2차 전직부터 해야 합니다');
  if (!v.can) throw new Error(v.why === '장인 거리에서 한다' ? '전직은 소리재의 장인 거리에서 합니다' : `${v.tier}차 전직은 ${v.why} 할 수 있습니다`);
  if (v.tier === 3) state.job3 = true; else state.job4 = true;
  if (v.tier === 3 && TIER3[state.job2].pas?.hp) state.hp += TIER3[state.job2].pas.hp;
  ding(state, events, { level: 3, kind: 'job', title: `${iGa(`'${v.name}'`)} 되었습니다`, big: v.name, body: `${v.tier}차 전직. ${v.skills.map((s) => s.name).join(', ')}${v.pas ? `, ${v.pas.name}` : ''}.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `장인 거리에서 ${iGa(v.name)} 되었다.`, note: `${iGa(v.name)} 된 날` });
  events.push({ type: 'job' });
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
  const fx = bondFx(state) || {}; // 직업의 인연 (Z120)
  // 2차는 공격 스킬이 레벨 20(전직한 때), 직업 스킬이 레벨 30. 3차는 50, 4차는 80 (Z126)
  const a2 = ADVANCED[state.job2];
  const more = [
    ...(a2?.skills || []).map((sk, i) => ({ sk, at: i === 0 ? ADVANCE_LEVEL : 30 })),
    ...(state.job3 ? TIER3[state.job2].skills.map((sk) => ({ sk, at: TIER_LEVEL[3] })) : []),
    ...(state.job4 ? TIER4[state.job2].skills.map((sk) => ({ sk, at: TIER_LEVEL[4] })) : []),
  ];
  const list = [...def.skills.map((sk, i) => ({ sk, at: SKILL_LEVELS[i] })), ...(state.job === a2?.from ? more : [])];
  return list.map(({ sk, at }) => {
    const out = { ...sk, at, open: state.level >= at || !!fx.open?.includes(sk.id) };
    if (fx.mp?.[sk.id]) out.mp = Math.max(1, sk.mp + fx.mp[sk.id]);
    if (fx.skillCrit?.[sk.id]) out.crit = (sk.crit || 0) + fx.skillCrit[sk.id];
    if (fx.weaken?.[sk.id] && sk.weaken) out.weaken = { ...sk.weaken, cut: fx.weaken[sk.id] };
    if (fx.ward?.[sk.id] && sk.ward) out.ward = { ...sk.ward, turns: sk.ward.turns + fx.ward[sk.id] };
    if (fx.guard?.[sk.id] && sk.guard) out.guard = sk.guard + fx.guard[sk.id];
    if (fx.heal?.[sk.id] && sk.heal) out.heal = sk.heal * fx.heal[sk.id];
    return out;
  });
}

// ── 스킬 장착 (Z127): 익힌 스킬 가운데 셋만 싸움에 가져간다. 싸우는 동안에는 바꿀 수 없다 ──

/** 장착한 스킬 id들. 없던 저장은 열린 차례대로 앞의 셋. */
export function loadoutOf(state) {
  const open = skillsNow(state).filter((x) => x.open).map((x) => x.id);
  if (!Array.isArray(state.loadout)) return open.slice(0, SKILL_SLOTS);
  const out = state.loadout.filter((id) => open.includes(id)).slice(0, SKILL_SLOTS);
  // 막 열려 아직 살피지 않은 스킬은 빈 칸에 들어간 것으로 본다 (다음 한 일에서 적힌다)
  for (const id of open) if (out.length < SKILL_SLOTS && !out.includes(id) && !(state.skillSeen || []).includes(id)) out.push(id);
  return out;
}
/** 새로 열린 스킬을 살핀다: 빈 칸이 있으면 저절로 장착하고, 없으면 알린다. 한 일마다 부른다. */
export function syncLoadout(state, events) {
  const open = skillsNow(state).filter((x) => x.open);
  if (!open.length) return;
  if (!Array.isArray(state.loadout)) state.loadout = open.slice(0, SKILL_SLOTS).map((x) => x.id);
  if (!Array.isArray(state.skillSeen)) state.skillSeen = open.map((x) => x.id);
  for (const sk of open) {
    if (state.skillSeen.includes(sk.id)) continue;
    state.skillSeen.push(sk.id);
    if (state.loadout.length < SKILL_SLOTS) state.loadout.push(sk.id);
    else pushLine(state, events, { k: 'sys', tone: 'good', text: `새 스킬 '${sk.name}'이 열렸다. 스킬 창에서 장착할 수 있다.` });
  }
}
/** 장착하거나 뺀다. 싸우는 동안에는 바꿀 수 없다. */
export function setLoadout(state, events, op, id) {
  if (state.battle) throw new Error('싸우는 중에는 바꿀 수 없습니다');
  const sk = skillsNow(state).find((x) => x.id === id && x.open);
  if (!sk) throw new Error('쓸 수 없는 스킬입니다');
  const now = loadoutOf(state);
  if (op === 'add') {
    if (now.includes(id)) return;
    if (now.length >= SKILL_SLOTS) throw new Error(`스킬은 ${SKILL_SLOTS}개까지 장착합니다. 하나를 빼야 합니다`);
    state.loadout = [...now, id];
  } else if (op === 'remove') state.loadout = now.filter((x) => x !== id);
  else throw new Error('모르는 장착 행동입니다');
  events.push({ type: 'job' });
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
  if (skillId === 'smithing') m *= 1 + (state.hidden?.blaze?.value || 0) * 0.01; // 불심 (Z119)
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
      // 사제는 행운을 찾은 사람만 고른다 (Z116). 못 찾은 사람에게는 행운이라는 말 없이 귀띔만
      // 내 출신과 맞는 직업 (Z128): 출신의 어울리는 직업. 인연이 있으면 그 글도
      origin: originById(state.origin)?.job === id,
      bond: originById(state.origin)?.job === id ? originById(state.origin)?.bond?.text || '' : '',
      lock: id === 'priest' && !priestOpen(state) ? PRIEST_LOCK : '',
      // 행운을 찾기 전에는 행운이라는 말을 내지 않는다 (Z131). 고른 뒤 행운 +10을 받으며 처음 드러난다
      perk: id === 'priest' && priestOpen(state) ? (foundLuck(state) >= 1 ? `고르면: 행운 +${PRIEST_LUCK}, 버프 "신의 은총"` : '고르면: 버프 "신의 은총"') : '',
      rang: id === 'priest' && priestOpen(state),
      mains: id === 'priest' ? (priestOpen(state) && foundLuck(state) >= 1 ? '지혜, 행운' : '지혜') : { warrior: '힘', archer: '민첩', mage: '지혜', rogue: '민첩' }[id],
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
  if (id === 'priest' && !priestOpen(state)) throw new Error('아직 고를 수 없는 직업입니다');
  state.job = id;
  if (state.respec !== 'done') state.respec = 'open'; // 고른 직업에 맞춰 스탯을 한 번 다시 찍는다 (Z116)
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
  if (state.respec !== 'done') state.respec = 'open'; // (Z116)
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
