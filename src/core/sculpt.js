// 조각과 작품 (N2, X1, X3-3). 칼질 마흔 번을 손으로. 본 것만 깎는다.
// 등급은 마지막 칼질에서 갈린다. 그 전에는 그림으로도 글로도 알 수 없다.

import { next } from './rng.js?v=fb24485';
import { pushLine, ding } from './log.js?v=fb24485';
import { countOf, takeById } from './inventory.js?v=fb24485';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=fb24485';
import { itemDef } from '../data/items.js?v=fb24485';
import { bondOf, bondBy, addFame } from './social.js?v=fb24485';
import { jobXp } from './jobs.js?v=fb24485';
import { REGULAR, PEOPLE } from '../data/people.js?v=fb24485';
import { placeById } from '../data/places.js?v=fb24485';
import {
  CUTS, WORK_GRADES, WORK_BASE, WORK_PUSH, WORK_NEEDS, SCULPT_DIFFICULTY, CUT_MARKS, CUT_LINES,
  SUBJECTS, SUBJECT_ORDER, ADMIRE, WORK_PRICE, WORK_FAME,
} from '../data/works.js?v=fb24485';
import { iGa, eulReul } from './ko.js?v=fb24485';
import { buffOf, xpBoost } from './buffs.js?v=fb24485';

export { buffOf };

/** 이 주제를 깎을 수 있는가: 만나거나 잡아 본 것만 (N2-4). */
function seen(state, subj) {
  const s = SUBJECTS[subj].seen;
  if (s.mon) return (state.dex.mon[s.mon]?.seen || 0) > 0;
  if (s.animal) return !!state.dex.animals[s.animal];
  if (s.person) return bondOf(state, s.person) >= REGULAR;
  return false;
}

export function workOdds(state) {
  const push = (state.skills.sculpting?.grade || 0) * WORK_PUSH.perSkillGrade + (state.hidden.art?.value || 0) * WORK_PUSH.perArt;
  const w = WORK_BASE.map((b, i) => b * Math.pow(1 + push, i));
  const total = w.reduce((a, x) => a + x, 0);
  return w.map((x) => (x / total) * 100);
}

/** 가방에서 쓸 수 있는 조각칼(닳지 않은 것). 없으면 null. */
export function chiselOf(state) {
  return state.bag.find((x) => x.id === 'carverknife' || x.id === 'oddknife') || state.bag.find((x) => x.id === 'chisel' && x.dur > 0) || null;
}

/** 조각 창이 그릴 것. 못 본 것은 주제에 나오지 않는다. */
export function sculptMenu(state) {
  return {
    needs: WORK_NEEDS.map((n) => ({ name: itemDef(n.id).name, n: n.n, have: countOf(state, n.id) })),
    can: WORK_NEEDS.every((n) => countOf(state, n.id) >= n.n) && !!chiselOf(state),
    chisel: chiselOf(state) ? { dur: chiselOf(state).dur ?? null, name: itemDef(chiselOf(state).id).name } : null,
    subjects: SUBJECT_ORDER.filter((id) => seen(state, id)).map((id) => ({ id, name: SUBJECTS[id].name })),
    odds: workOdds(state), cuts: CUTS,
  };
}

/** 지금 깎고 있는 것. 그림은 칼질 10·22·34·40번째에 바뀐다. 등급은 보이지 않는다. */
export function sculptView(state) {
  const c = state.sculpt;
  if (!c) return null;
  const s = SUBJECTS[c.subject];
  return { subject: c.subject, name: s.name, cuts: c.cuts, total: CUTS, stage: c.cuts >= 34 ? 3 : c.cuts >= 22 ? 2 : c.cuts >= 10 ? 1 : 0, art: s.art || null };
}

export function startSculpt(state, events, subject) {
  if (state.sculpt) throw new Error('이미 깎고 있는 것이 있습니다');
  if (!SUBJECTS[subject]) throw new Error('모르는 주제입니다');
  if (!seen(state, subject)) throw new Error('본 적 없는 것은 깎을 수 없습니다');
  if (!chiselOf(state)) throw new Error('조각칼이 없습니다. 대장간에서 사거나 만들 수 있습니다');
  for (const n of WORK_NEEDS) if (countOf(state, n.id) < n.n) throw new Error(`${iGa(itemDef(n.id).name)} 모자랍니다 (${countOf(state, n.id)} / ${n.n})`);
  for (const n of WORK_NEEDS) takeById(state, n.id, n.n);
  state.sculpt = { subject, cuts: 0 };
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `참나무 가지를 엮어 토막을 만들고 칼을 쥐었다. ${eulReul(SUBJECTS[subject].name)} 떠올린다.` });
  events.push({ type: 'sculpt', phase: 'start' });
  events.push({ type: 'art' });
}

/** 칼질 한 번. 한 번 누르면 한 번. */
export function cut(state, events) {
  const c = state.sculpt;
  if (!c) throw new Error('깎고 있는 것이 없습니다');
  const knife = chiselOf(state);
  if (!knife) throw new Error('조각칼이 없습니다. 대장간에서 사거나 만들 수 있습니다');
  if (knife.id === 'chisel') knife.dur -= 1; // 이름 모를 조각칼(깎는 이의 칼)은 닳지 않는다
  if (knife.id === 'chisel' && knife.dur <= 0) {
    state.bag.splice(state.bag.indexOf(knife), 1);
    pushLine(state, events, { k: 'sys', text: '조각칼의 날이 다 닳아 부러졌다.', tone: 'warn' });
    events.push({ type: 'bag' });
  }
  c.cuts += 1;
  state.counters.act.cut = (state.counters.act.cut || 0) + 1;
  const repeated = state.lastAction === 'cut';
  state.lastAction = 'cut';
  pushLine(state, events, { k: 'me', text: `${CUT_LINES[Math.floor(next(state) * CUT_LINES.length)]} (${c.cuts} / ${CUTS})` });
  if (CUT_MARKS[c.cuts]) { pushLine(state, events, { k: 'room', text: CUT_MARKS[c.cuts] }); events.push({ type: 'art' }); }
  const skill = state.skills.sculpting || (state.skills.sculpting = emptySkill());
  const endure = state.hidden.endure?.value || 0;
  const up = useSkill(skill, SCULPT_DIFFICULTY, (repeated ? 1 + endure * 0.01 : 1) * jobXp(state, 'sculpting', repeated) * xpBoost(state));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.sculpting} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (c.cuts >= CUTS) finish(state, events);
}

export function quitSculpt(state, events) {
  if (!state.sculpt) throw new Error('깎고 있는 것이 없습니다');
  state.sculpt = null;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: '칼을 내려놓았다. 깎다 만 토막은 땔감이 되었다.' });
  events.push({ type: 'sculpt', phase: 'quit' });
  events.push({ type: 'art' });
}

const DING_BY_GRADE = [1, 1, 2, 3, 4];

function finish(state, events) {
  const c = state.sculpt;
  const s = SUBJECTS[c.subject];
  const odds = workOdds(state);
  let roll = next(state) * 100;
  let grade = 0;
  for (let i = 0; i < odds.length; i++) { grade = i; roll -= odds[i]; if (roll < 0) break; }
  state.sculpt = null;
  state.lastAction = null;
  const work = { no: state.works.length + 1, subject: c.subject, grade, day: state.day, where: 'bag', maker: state.name };
  state.works.push(work);
  // 예술의 재료: 작품마다 1
  state.counters.works += 1;
  const name = `${WORK_GRADES[grade]} ${s.name}상`;
  pushLine(state, events, { k: 'room', text: `마지막 칼질에서 얼굴이 갈렸다. ${name}.` });
  ding(state, events, {
    level: DING_BY_GRADE[grade], kind: grade >= 3 ? 'masterwork' : 'work',
    title: `${iGa(WORK_GRADES[grade])} 완성되었습니다: ${s.name}상`, big: name,
    body: grade >= 3 ? '감상하면 하루 동안 힘이 난다. 광장의 빈 받침대에 세울 수도 있다.' : '',
  });
  if (grade >= 3) state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${name}이 나왔다. 칼을 놓고 한참 들여다보았다.`, note: `${WORK_GRADES[grade]}을 깎은 날` });
  events.push({ type: 'sculpt', phase: 'done', grade, subject: c.subject, no: work.no });
  events.push({ type: 'art' });
}

// ── 작품으로 할 수 있는 일 (N2-2) ──

function workOf(state, no) {
  const w = state.works.find((x) => x.no === no);
  if (!w) throw new Error('없는 작품입니다');
  return w;
}
const mustHold = (w) => { if (w.where !== 'bag') throw new Error('가방에 있는 작품만 됩니다'); };
export const workName = (w) => `${WORK_GRADES[w.grade]} ${SUBJECTS[w.subject].name}상`;
const WHERE = { bag: '가방', plaza: '광장의 받침대', sold: '팔림', gift: '선물함', alive: '살아 움직인다', gone: '떠났다' };

/** 스킬 탭과 작품 창이 그릴 것: 작품 목록과 간 곳 (N2-5). */
export function worksView(state) {
  const art = (state.hidden.art?.value || 0) > 0;
  return state.works.map((w) => ({
    no: w.no, name: workName(w), grade: w.grade, gradeName: WORK_GRADES[w.grade], subject: w.subject, subjectName: SUBJECTS[w.subject].name,
    day: w.day, where: w.where, whereName: w.where === 'gift' ? `${PEOPLE[w.to].name}에게 선물함` : WHERE[w.where], held: w.where === 'bag',
    art: SUBJECTS[w.subject].art || null, price: Math.max(1, Math.floor(WORK_PRICE[w.grade] * 0.4)),
    admire: (w.where === 'bag' || w.where === 'plaza') && ADMIRE[w.grade] ? ADMIRE[w.grade].text : '',
    // 생명 부여는 예술이 생긴 뒤에야 이름이 보인다 (N2-3)
    aliveLabel: art ? '생명을 불어넣는다' : '???', canAlive: art && !!SUBJECTS[w.subject].alive && w.grade >= 1,
  }));
}

/** 감상한다. 하루 동안 버프가 붙는다. 졸작은 아무 힘도 주지 않는다. */
export function admire(state, events, no) {
  const w = workOf(state, no);
  if (w.where !== 'bag' && w.where !== 'plaza') throw new Error('곁에 없는 작품입니다');
  if (w.where === 'plaza' && state.place !== 'plaza') throw new Error('광장에 가야 볼 수 있습니다');
  const a = ADMIRE[w.grade];
  pushLine(state, events, { k: 'me', text: `${eulReul(workName(w))} 한참 들여다보았다.` });
  if (!a) { pushLine(state, events, { k: 'sys', text: '어디가 틀렸는지만 보인다.' }); return; }
  state.buffs.admire = { name: a.name, text: a.text, xp: a.xp || 0, hp: a.hp || 0, until: { day: state.day + 1, phase: state.phase } };
  pushLine(state, events, { k: 'sys', text: `'${a.name}'. ${a.text}. 하루 동안 간다.`, tone: 'mint' });
  events.push({ type: 'buff' });
}

/** 광장의 빈 받침대에 세운다. 다음 날부터 구경꾼이 늘고 명성이 오른다 (X3-3). */
export function placeWork(state, events, no) {
  const w = workOf(state, no);
  mustHold(w);
  if (state.place !== 'plaza') throw new Error('광장의 받침대에 세웁니다');
  const old = state.works.find((x) => x.where === 'plaza');
  if (old) { old.where = 'bag'; pushLine(state, events, { k: 'me', text: `받침대에 있던 ${eulReul(workName(old))} 내려 가방에 넣었다.` }); }
  w.where = 'plaza';
  w.placedDay = state.day;
  w.famed = !!w.famed; // 명성은 작품마다 한 번만 오른다
  pushLine(state, events, { k: 'me', text: `분수 옆 빈 받침대에 ${eulReul(workName(w))} 올려놓았다. 지나가던 사람들이 걸음을 늦춘다.` });
  events.push({ type: 'statue' });
  events.push({ type: 'art' });
}

/** 받침대에 선 작품(없으면 null). 장소 띠와 "이 방" 글이 쓴다. */
export function statueOf(state) {
  const w = state.works.find((x) => x.where === 'plaza');
  return w ? { no: w.no, name: workName(w), grade: w.grade, subject: w.subject, art: SUBJECTS[w.subject].art || null, since: w.placedDay } : null;
}

/** 날이 바뀔 때 부른다. 세운 다음 날 한 번 명성이 오른다. */
export function statueDay(state, events) {
  const w = state.works.find((x) => x.where === 'plaza');
  if (!w || w.famed || state.day <= w.placedDay) return;
  w.famed = true;
  const fame = WORK_FAME[w.grade];
  pushLine(state, events, { k: 'room', text: `광장의 ${workName(w)} 앞에 사람들이 모여 있다는 말이 들린다.` });
  if (fame > 0) { pushLine(state, events, { k: 'sys', text: `세운 작품 덕에 마을의 명성 +${fame}.` }); addFame(state, events, fame, '시작 마을'); }
}

export function sellWork(state, events, no) {
  const w = workOf(state, no);
  mustHold(w);
  if (placeById(state.place).wild) throw new Error('마을에서 팔 수 있습니다');
  const price = Math.max(1, Math.floor(WORK_PRICE[w.grade] * 0.4));
  w.where = 'sold';
  state.silver += price;
  pushLine(state, events, { k: 'me', text: `${eulReul(workName(w))} 팔았다. 은화 +${price}.` });
  events.push({ type: 'trade' });
}

/** 사람에게 선물한다. 등급이 높을수록, 그 사람을 깎은 것이면 더 기뻐한다. */
export function giftWork(state, events, no, personId) {
  const w = workOf(state, no);
  mustHold(w);
  const p = PEOPLE[personId];
  if (!p || p.place !== state.place || state.party.some((c) => c.id === personId)) throw new Error('그 사람은 여기에 없습니다');
  const r = state.people[personId] || (state.people[personId] = { pts: 0, talked: 0, likes: [], dislikes: [], stats: [], met: true });
  if (r.gifted === state.day) throw new Error('오늘은 이미 선물했습니다. 선물은 한 사람에게 하루에 한 번입니다');
  r.gifted = state.day;
  w.where = 'gift';
  w.to = personId;
  const own = SUBJECTS[w.subject].seen.person === personId;
  const pts = [1, 4, 10, 25, 60][w.grade] * (own ? 2 : 1);
  pushLine(state, events, { k: 'me', text: `${p.name}에게 ${eulReul(workName(w))} 건넸다.` });
  pushLine(state, events, { k: 'npc', who: p.name, text: own ? '이게… 나야? 허, 이걸 다 보고 있었구먼.' : w.grade >= 3 ? '이런 걸 나한테. 문 앞에 두고 날마다 보겠네.' : '손으로 깎았다고? 고맙네.', tone: own || w.grade >= 3 ? 'mint' : undefined });
  bondBy(state, events, personId, pts);
  events.push({ type: 'social' });
}
