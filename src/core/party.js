// 동료와 파티 (T20, T21, T25~T28, H1-1~H1-4). 파티는 나와 동료 둘까지.

import { chance } from './rng.js?v=9b73294';
import { pushLine, ding } from './log.js?v=9b73294';
import { COMPANIONS, PARTY_MAX, CROSS_LIMIT, MERC_FEE, ROLE_BONUS, GUARD_RATE, ROLES, ROWS, PLANS } from '../data/companions.js?v=9b73294';
import { SUBJECTS, ALIVE_COST } from '../data/works.js?v=9b73294';
import { REGULAR, PEOPLE } from '../data/people.js?v=9b73294';
import { bondOf } from './social.js?v=9b73294';
import { placeById } from '../data/places.js?v=9b73294';
import { workName } from './sculpt.js?v=9b73294';
import { iGa, eulReul, waGwa } from './ko.js?v=9b73294';

const def = (c) => COMPANIONS[c.id];

function join(state, events, id, extra = {}) {
  if (state.party.length >= PARTY_MAX) throw new Error(`동료는 ${PARTY_MAX}명까지입니다`);
  if (state.party.some((c) => c.id === id)) throw new Error('이미 함께 있습니다');
  const d = COMPANIONS[id];
  const c = { id, hp: d.hp, row: d.row, plan: PLANS[d.role][0].id, crossed: 0, bond: 0, down: false, day: state.day, ...extra };
  state.party.push(c);
  pushLine(state, events, { k: 'room', text: d.join });
  ding(state, events, { level: 3, kind: 'companion', title: `동료 ${iGa(`'${d.name}'`)} 생겼습니다`, big: d.name, body: `${d.what}. ${ROLES[d.role]}, ${ROWS[d.row]}. 바라는 것: ${d.wants}.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${iGa(d.name)} 따라나섰다. 이제 혼자 걷지 않는다.`, note: `${d.name}${waGwa(d.name)} 함께한 날` });
  events.push({ type: 'party' });
  return c;
}

/** 사이가 '단골' 이상인 사람에게 같이 가자고 청한다 (T28). */
export function askToJoin(state, events, personId) {
  const d = Object.values(COMPANIONS).find((x) => x.way === 'person' && x.person === personId);
  if (!d) throw new Error('같이 갈 사람이 아닙니다');
  if (PEOPLE[personId].place !== state.place) throw new Error('그 사람은 여기에 없습니다');
  if (bondOf(state, personId) < REGULAR) throw new Error("사이가 '단골' 이상이어야 청할 수 있습니다");
  return join(state, events, d.id);
}

/** 용병을 고용한다. 하루 은화 60. 날이 바뀔 때 낸다 (T28). */
export function hireMerc(state, events) {
  if (!placeById(state.place).merc) throw new Error('용병은 주점이나 모험가 회관에서 구합니다');
  if (state.silver < MERC_FEE) throw new Error(`하루 삯 은화 ${MERC_FEE}은 가지고 있어야 합니다`);
  if (state.party.length >= PARTY_MAX) throw new Error(`동료는 ${PARTY_MAX}명까지입니다`);
  if (state.party.some((c) => c.id === 'gaon')) throw new Error('이미 함께 있습니다');
  state.silver -= MERC_FEE; // 첫날 삯은 먼저 낸다. 그날 헤어져도 돌려받지 못한다
  pushLine(state, events, { k: 'me', text: `첫날 삯 은화 ${MERC_FEE}을 건넸다.` });
  return join(state, events, 'gaon', { paidDay: state.day });
}

/** 작품에 생명을 불어넣는다. 예술을 조금 잃는다 (N2-3, T28). */
export function giveLife(state, events, no) {
  const w = state.works.find((x) => x.no === no);
  if (!w || w.where !== 'bag') throw new Error('가방에 있는 작품만 됩니다');
  if ((state.hidden.art?.value || 0) < 1) throw new Error('아직 할 수 없는 일입니다');
  const id = SUBJECTS[w.subject].alive;
  if (!id) throw new Error('이 작품은 깨어나지 않습니다');
  if (w.grade < 1) throw new Error('졸작은 깨어나지 않습니다');
  if (state.party.length >= PARTY_MAX) throw new Error(`동료는 ${PARTY_MAX}명까지입니다`);
  if (state.party.some((c) => c.id === id)) throw new Error('같은 것이 이미 곁에 있습니다');
  pushLine(state, events, { k: 'me', text: `${workName(w)}에 두 손을 얹고 숨을 불어넣었다. 손끝에서 무언가 빠져나간다.` });
  w.where = 'alive';
  state.counters.works = Math.max(0, state.counters.works - ALIVE_COST);
  // 걸작 이상은 더 튼튼하게 깨어난다
  const c = join(state, events, id, { work: no, grade: w.grade });
  c.hp = maxHpOf(c);
  return c;
}

export function maxHpOf(c) {
  const grade = c.work != null ? (c.grade ?? 0) : 0;
  return def(c).hp + grade * 10 + (c.bond >= 20 ? 10 : 0);
}

export function dismiss(state, events, id) {
  const i = state.party.findIndex((c) => c.id === id);
  if (i < 0) throw new Error('함께 있지 않습니다');
  const [c] = state.party.splice(i, 1);
  pushLine(state, events, { k: 'me', text: `${def(c).name}에게 여기서 헤어지자고 했다.` });
  if (c.work != null) { const w = state.works.find((x) => x.no === c.work); if (w) w.where = 'gone'; }
  events.push({ type: 'party' });
}

export function setPlan(state, events, id, plan) {
  const c = state.party.find((x) => x.id === id);
  if (!c) throw new Error('함께 있지 않습니다');
  const p = PLANS[def(c).role].find((x) => x.id === plan);
  if (!p) throw new Error('이 동료에게는 없는 방침입니다');
  c.plan = plan;
  pushLine(state, events, { k: 'me', text: `${def(c).name}에게 일렀다: ${p.name}.` });
  events.push({ type: 'party' });
}

/** 줄을 바꾼다. 뒷줄에는 고치는 사람만 선다 (T20). */
export function setRow(state, events, id, row) {
  const c = state.party.find((x) => x.id === id);
  if (!c) throw new Error('함께 있지 않습니다');
  if (!ROWS[row]) throw new Error('모르는 줄입니다');
  if (row === 'back' && def(c).role !== 'healer') throw new Error('뒷줄에는 활·마법·치유를 하는 이만 섭니다');
  c.row = row;
  pushLine(state, events, { k: 'me', text: `${eulReul(def(c).name)} ${ROWS[row]}에 세웠다.` });
  events.push({ type: 'party' });
}

/** 동료 창이 그릴 것 (H1-1). */
export function partyView(state) {
  return state.party.map((c) => {
    const d = def(c);
    return {
      id: c.id, name: d.name, what: d.what, role: ROLES[d.role], row: c.row, rowName: ROWS[c.row], element: d.element,
      hp: c.hp, maxHp: maxHpOf(c), down: c.down, attack: d.attack, heal: d.heal || 0,
      plan: c.plan, plans: PLANS[d.role], wants: d.wants, crossed: c.crossed, limit: CROSS_LIMIT,
      bond: c.bond, bondName: c.bond >= 40 ? '믿는 사이' : c.bond >= 15 ? '익숙한 사이' : '서먹한 사이',
      canBack: d.role === 'healer', fee: d.way === 'merc' ? MERC_FEE : 0,
    };
  });
}

/** 막는 사람·때리는 사람·고치는 사람이 고루 있으면 모든 판정 +5% (T26). 나는 직업에 따라 센다. */
export function roleBonus(state) {
  const mine = state.job === 'priest' ? 'healer' : state.job === 'warrior' ? 'guard' : 'striker';
  const roles = new Set([mine, ...state.party.map((c) => def(c).role)]);
  return roles.size >= 3 ? ROLE_BONUS : 0;
}

/** 바라는 것을 거슬렀다. 세 번이면 떠난다 (T27, H1-3). */
export function cross(state, events, what) {
  for (let i = state.party.length - 1; i >= 0; i--) {
    const c = state.party[i];
    const d = def(c);
    if (d.hates !== what) continue;
    if (what === 'unpaid') { leave(state, events, i); continue; }
    c.crossed += 1;
    pushLine(state, events, { k: 'room', text: `${d.hateSay} (거스른 횟수 ${c.crossed} / ${CROSS_LIMIT})` });
    if (c.crossed >= CROSS_LIMIT) leave(state, events, i);
    events.push({ type: 'party' });
  }
}

function leave(state, events, i) {
  const [c] = state.party.splice(i, 1);
  const d = def(c);
  pushLine(state, events, { k: 'room', text: d.leave });
  if (c.work != null) { const w = state.works.find((x) => x.no === c.work); if (w) w.where = 'gone'; }
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${iGa(d.name)} 떠났다. 무엇을 바랐는지 알고 있었는데.`, note: null });
  events.push({ type: 'party' });
}

/** 날이 바뀔 때: 용병 삯, 굶주림. */
export function partyDay(state, events) {
  for (const c of [...state.party]) {
    if (def(c).way !== 'merc') continue;
    if (c.paidDay != null && state.day <= c.paidDay + 1) continue; // 첫날 삯은 구할 때 냈다
    if (state.silver >= MERC_FEE) { state.silver -= MERC_FEE; pushLine(state, events, { k: 'sys', text: `${def(c).name}에게 하루 삯 은화 ${MERC_FEE}을 냈다.` }); }
    else cross(state, events, 'unpaid');
  }
  if (state.full === 0) cross(state, events, 'hungry');
}

// ── 싸움 속의 동료 (T21) ──

const active = (state) => state.party.filter((c) => !c.down);

/** 적이 나 대신 칠 동료(없으면 null): '나를 먼저'인 앞줄의 막는 사람이 대신 맞아 준다. */
export function guardFor(state) {
  const g = active(state).find((c) => def(c).role === 'guard' && c.row === 'front' && planOf(state, c) === 'mefirst');
  return g && chance(state, GUARD_RATE) ? g : null;
}

/** '알아서'는 사이가 좋을수록 잘한다: 좋은 수를 둘 확률. 아니면 머뭇거린다. */
function planOf(state, c) {
  if (c.plan !== 'auto') return c.plan;
  const turn = state.battle?.turn;
  if (c.autoTurn === turn && c.autoPlan) return c.autoPlan;
  c.autoTurn = turn;
  c.autoPlan = autoPlan(state, c);
  return c.autoPlan;
}
function autoPlan(state, c) {
  const smart = chance(state, Math.min(0.95, 0.5 + c.bond * 0.01));
  if (!smart) return 'idle';
  const role = def(c).role;
  return role === 'healer' ? 'half' : role === 'guard' ? 'mefirst' : 'together';
}

/** 동료가 대신 맞았다. */
export function hitCompanion(state, events, c, dmg) {
  c.hp = Math.max(0, c.hp - dmg);
  pushLine(state, events, { k: 'room', text: `${iGa(def(c).name)} 앞을 막아섰다. 대신 ${dmg} 피해.` });
  if (c.hp <= 0) { c.down = true; pushLine(state, events, { k: 'sys', text: `${iGa(def(c).name)} 쓰러졌다. 싸움이 끝나면 일어난다.`, tone: 'warn' }); }
}

/**
 * 내 차례 뒤에 동료들이 방침대로 움직인다.
 * @param {(power:number, name:string)=>void} strike 적을 치는 함수(싸움 규칙이 준다)
 * @param {number} myMaxHp
 * @param {{hp:number,maxHp:number}} foe
 */
export function companionsAct(state, events, strike, myMaxHp, foe) {
  for (const c of active(state)) {
    if (!state.battle) return;
    const d = def(c);
    const plan = planOf(state, c);
    if (plan === 'idle') { pushLine(state, events, { k: 'room', text: `${iGa(d.name)} 머뭇거린다.` }); continue; }
    if (plan === 'hold') continue;
    if (d.role === 'healer') {
      const at = plan === 'half' ? 0.5 : plan === 'mefirst' ? 0.85 : 1;
      if (state.hp < myMaxHp * at) {
        const before = state.hp;
        state.hp = Math.min(myMaxHp, state.hp + d.heal + Math.floor(c.bond / 10));
        pushLine(state, events, { k: 'room', text: `${iGa(d.name)} 손을 얹었다. 생명력 +${state.hp - before}.` });
      } else if (plan === 'half') strike(d.attack, d.name);
      continue;
    }
    if (d.role === 'guard' && plan === 'mefirst') continue; // 막는 데 힘을 쓴다
    if (plan === 'finish' && foe.hp > foe.maxHp / 3) continue;
    strike(d.attack, d.name);
  }
}

/** 싸움이 끝났다. 쓰러진 동료는 일어나고 사이가 조금 내린다. 같이 이기면 사이가 오른다 (H1-4). */
export function afterBattle(state, events, won) {
  for (const c of state.party) {
    if (c.down) {
      c.down = false;
      c.hp = Math.ceil(maxHpOf(c) * 0.3);
      c.bond = Math.max(0, c.bond - 2);
      pushLine(state, events, { k: 'room', text: `${iGa(def(c).name)} 몸을 일으켰다.` });
    } else if (won) c.bond += 1;
  }
}

/** 쉬면 동료도 낫는다. */
export function partyRest(state) {
  for (const c of state.party) { c.down = false; c.hp = maxHpOf(c); }
}
