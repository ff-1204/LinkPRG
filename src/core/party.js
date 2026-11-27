// 동료와 파티 (T20, T21, T25~T28, H1-1~H1-4). 파티는 나와 동료 둘까지.

import { chance } from './rng.js?v=2134347';
import { pushLine, ding } from './log.js?v=2134347';
import { tentsHere } from '../data/anvil.js?v=2134347';
import { COMPANIONS, CROSS_LIMIT, MERC_FEE, MERC_ORDER, ROLE_BONUS, GUARD_RATE, ROLES, ROWS, PLANS, BAND_MERCS, FULL_PARTY, fullRoles, mercBand, mercsAt, partyMax } from '../data/companions.js?v=2134347';
import { drumBuff } from './buffs.js?v=2134347';
import { PLACES } from '../data/places.js?v=2134347';
import { SUBJECTS, ALIVE_COST } from '../data/works.js?v=2134347';
import { REGULAR, PEOPLE } from '../data/people.js?v=2134347';
import { bondOf } from './social.js?v=2134347';
import { placeById } from '../data/places.js?v=2134347';
import { workName } from './sculpt.js?v=2134347';
import { iGa, eulReul, waGwa } from './ko.js?v=2134347';

const def = (c) => COMPANIONS[c.id];

function join(state, events, id, extra = {}) {
  if (state.party.length >= partyMax(state)) throw new Error(`동료는 ${partyMax(state)}명까지입니다`);
  if (state.party.some((c) => c.id === id)) throw new Error('이미 함께 있습니다');
  const d = COMPANIONS[id];
  // 천막의 미루는 아래에서 올라온 그 미루다 (CM-C): 둘이 함께 설 수는 없고, 들인 적이 있는 사람으로 적힌다
  if (state.party.some((c) => c.id !== id && COMPANIONS[c.id].name === d.name)) throw new Error('이미 함께 있습니다');
  if (d.name === COMPANIONS.miru.name) state.flags.hadMiru = true;
  const c = { id, hp: d.hp, row: d.row, plan: PLANS[d.role][0].id, crossed: 0, bond: 0, down: false, day: state.day, ...extra };
  state.party.push(c);
  if (d.way === 'person') state.flags[`had${d.id[0].toUpperCase()}${d.id.slice(1)}`] = true; // 들인 적이 있는 사람 (GD-G5: hadMiru)
  pushLine(state, events, { k: 'room', text: d.join });
  ding(state, events, { level: 3, kind: 'companion', title: `동료 ${iGa(`'${d.name}'`)} 생겼습니다`, big: d.name, body: `${d.what}. ${ROLES[d.role]}, ${ROWS[d.row]}. 바라는 것: ${d.wants}.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${iGa(d.name)} 따라나섰다. 이제 혼자 걷지 않는다.`, note: `${waGwa(d.name)} 함께한 날` });
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

const feeOf = (d) => d.fee || MERC_FEE;

/** 용병을 고용한다. 삯은 용병마다 다르고 날이 바뀔 때 낸다 (T28). 시작 마을에서는 훈련소에서 구한다 (Z94). */
export function hireMerc(state, events, id) {
  if (!placeById(state.place).merc) throw new Error('용병은 훈련소나 모험가 회관에서 구합니다');
  id = id || mercsAt(placeById(state.place), state)[0];
  const d = COMPANIONS[id];
  if (!d || d.way !== 'merc') throw new Error('모르는 용병입니다');
  // 구간 용병은 제 거점에서만 구한다. 지금 용병 셋은 훈련소와 모험가 회관에서 (JD-C3)
  if (!mercsAt(placeById(state.place), state).includes(id)) throw new Error(d.home ? `${d.name}${d.name.charCodeAt(d.name.length - 1) >= 0xac00 && (d.name.charCodeAt(d.name.length - 1) - 0xac00) % 28 ? '은' : '는'} ${PLACES[d.home].name}에서 구합니다` : '그 용병은 훈련소나 모험가 회관에서 구합니다');
  const fee = feeOf(d);
  if (state.silver < fee) throw new Error(`하루 삯 은화 ${fee}은 가지고 있어야 합니다`);
  if (state.party.length >= partyMax(state)) throw new Error(`동료는 ${partyMax(state)}명까지입니다`);
  if (state.party.some((c) => c.id === id)) throw new Error('이미 함께 있습니다');
  if (state.caravan?.load?.escort?.id === id) throw new Error('짐의 호위로 나가 있습니다'); // 닿을 때까지 곁에 없다 (GD-D5)
  state.silver -= fee; // 첫날 삯은 먼저 낸다. 그날 헤어져도 돌려받지 못한다
  pushLine(state, events, { k: 'me', text: `첫날 삯 은화 ${fee}을 건넸다.` });
  return join(state, events, id, { paidDay: state.day });
}

/** 용병 창이 그릴 것 (Z94). */
export function mercView(state) {
  return mercsAt(placeById(state.place), state).map((id) => {
    const d = COMPANIONS[id];
    const fee = feeOf(d);
    const joined = state.party.some((c) => c.id === id);
    const away = state.caravan?.load?.escort?.id === id; // 상단의 짐을 호위하러 나갔다 (GD-D5)
    const why = joined ? '함께 있다' : away ? '호위로 나가 있다' : state.party.length >= partyMax(state) ? `동료는 ${partyMax(state)}명까지` : state.silver < fee ? '은화가 모자란다' : '';
    return { id, name: d.title ? `${d.title} ${d.name}` : d.name, what: d.what, role: ROLES[d.role], row: ROWS[d.row], hp: d.hp, attack: d.attack, element: d.element, text: d.text || '', fee, joined, can: !why, why };
  });
}

/**
 * 용병 창 아래의 일행 줄 (GD-C0): "일행 (2 / 2)"와, 자리가 찼는데 이곳의 북 치는 이가 곁에 없을 때의 한 줄.
 * 북 치는 이가 없는 거점에서는 null이다(그 전의 용병 창은 그대로다).
 */
export function mercSeats(state) {
  const g = Object.values(BAND_MERCS).find((x) => x.place === state.place);
  if (!g?.bard) return null;
  const max = partyMax(state), full = state.party.length >= max, has = state.party.some((c) => c.id === g.bard);
  return { n: state.party.length, max, note: full && !has ? `${eulReul(COMPANIONS[g.bard].name)} 들이려면 한 사람을 보내야 한다.` : '' };
}

/** 용병 창의 머리말에 쓸, 이곳에서 용병을 소개하는 이. */
export const mercHost = (state) => Object.values(BAND_MERCS).find((g) => g.place === state.place)?.by || (state.place === 'training' ? '교관이' : '접수대가');

/**
 * 용병 창 아래에 보일 다른 거점의 용병들 (JD-C1, JD-F5). 가 본 거점의 것만 나온다.
 * 이곳보다 앞 구간의 용병은 여기까지 따라오지 않고, 뒤 구간의 용병은 그 거점에서 구한다.
 */
export function mercElsewhere(state) {
  const here = placeById(state.place), hereBand = here.band || (here.town === '시작 마을' ? 1 : 2);
  const seen = (id) => !!state.dex?.places?.[id];
  const groups = [];
  if (hereBand > 2 && (seen('training') || seen('guild'))) groups.push({ band: 2, names: MERC_ORDER.map((id) => COMPANIONS[id].name) });
  for (const g of Object.values(BAND_MERCS)) if (g.place !== here.id && seen(g.place)) groups.push({ band: g.band, names: (g.tents ? tentsHere(state) : g.order).map((id) => COMPANIONS[id].name), at: PLACES[g.place].name }); // 천막에는 내가 푼 길의 사람만 (CM-C)
  return groups.map((g) => ({ names: g.names.join(' · '), why: g.band < hereBand ? '여기까지 따라오지 않는다' : `${g.at}에서 구한다` }));
}

/**
 * 용병은 제 구간까지만 따라온다 (JD-C3): 지금 용병 셋은 소리재까지, 구간 용병은 제 거점의 구간까지.
 * 그보다 뒤 구간의 곳에 닿으면 그 자리에서 헤어진다. 벌은 없다.
 */
export function mercsStay(state, events, destBand) {
  for (let i = state.party.length - 1; i >= 0; i--) {
    const d = def(state.party[i]);
    if (d.way !== 'merc' || mercBand(d) >= destBand) continue;
    state.party.splice(i, 1);
    pushLine(state, events, { k: 'room', text: `${iGa(d.name)} 걸음을 멈췄다. "내 일은 여기까지요. 저 너머는 저쪽 사람을 쓰시오." 삯을 셈하고 돌아섰다.` });
    events.push({ type: 'party' });
  }
}

/** 작품에 생명을 불어넣는다. 예술을 조금 잃는다 (N2-3, T28). */
export function giveLife(state, events, no) {
  const w = state.works.find((x) => x.no === no);
  if (!w || w.where !== 'bag') throw new Error('가방에 있는 작품만 됩니다');
  if ((state.hidden.art?.value || 0) < 1) throw new Error('아직 할 수 없는 일입니다');
  const id = SUBJECTS[w.subject].alive;
  if (!id) throw new Error('이 작품은 깨어나지 않습니다');
  if (w.grade < 1) throw new Error('졸작은 깨어나지 않습니다');
  if (state.party.length >= partyMax(state)) throw new Error(`동료는 ${partyMax(state)}명까지입니다`);
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
  if (row === 'back' && def(c).role !== 'healer' && !def(c).back) throw new Error('뒷줄에는 활·마법·치유를 하는 이만 섭니다');
  c.row = row;
  pushLine(state, events, { k: 'me', text: `${eulReul(def(c).name)} ${ROWS[row]}에 세웠다.` });
  events.push({ type: 'party' });
}

/** 동료 창이 그릴 것 (H1-1). */
export function partyView(state) {
  return state.party.map((c) => {
    const d = def(c);
    return {
      id: c.id, name: d.title ? `${d.title} ${d.name}` : d.name, what: d.what, role: ROLES[d.role], row: c.row, rowName: ROWS[c.row], element: d.element,
      hp: c.hp, maxHp: maxHpOf(c), down: c.down || c.out === state.day, attack: d.attack, heal: d.heal || 0,
      plan: c.plan, plans: PLANS[d.role], wants: d.wants, crossed: c.crossed, limit: CROSS_LIMIT,
      bond: c.bond, bondName: c.bond >= 40 ? '믿는 사이' : c.bond >= 15 ? '익숙한 사이' : '서먹한 사이',
      canBack: d.role === 'healer' || !!d.back, fee: d.way === 'merc' ? feeOf(d) : 0, text: d.role === 'bard' ? d.text : '',
    };
  });
}

/** 고루 갖춘 일행 (T26, BM-C2): 막는 사람·때리는 사람에 고치는 사람 또는 북돋는 이가 있으면 모든 판정 +5%. 나는 직업에 따라 센다. */
export function roleBonus(state) {
  return fullRoles(state.job, state.party) ? ROLE_BONUS : 0;
}
/** 일행 창의 "고루 갖춘 일행" 줄 (BM-C0). 고루 갖추지 못했으면 null: 줄이 생기지 않는다. */
export function fullPartyView(state) {
  const roles = fullRoles(state.job, state.party);
  return roles ? { name: FULL_PARTY, roles: roles.map((r) => ROLES[r]).join(' · '), text: `모든 판정 +${Math.round(ROLE_BONUS * 100)}%` } : null;
}
/** 일행 창의 "하루에 나가는 삯" 줄 (BM-C0): 삯을 받는 이의 수와 그 합. 없으면 null. */
export function partyFees(state) {
  const paid = state.party.filter((c) => def(c).way === 'merc');
  return paid.length ? { n: paid.length, silver: paid.reduce((a, c) => a + feeOf(def(c)), 0) } : null;
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
    const fee = feeOf(def(c));
    if (state.silver >= fee) { state.silver -= fee; pushLine(state, events, { k: 'sys', text: `${def(c).name}에게 하루 삯 은화 ${fee}을 냈다.` }); }
    else cross(state, events, 'unpaid');
  }
  if (state.full === 0) cross(state, events, 'hungry');
}

// ── 싸움 속의 동료 (T21) ──

// out: 호위 싸움에서 쓰러진 날 (JD-C5). 그날은 싸움에도 호위에도 못 쓴다. 자고 나면 낫는다
const active = (state) => state.party.filter((c) => !c.down && c.out !== state.day);

/** 적이 나 대신 칠 동료(없으면 null): '나를 먼저'인 앞줄의 막는 사람이 대신 맞아 준다. */
export function guardFor(state) {
  const g = active(state).find((c) => def(c).role === 'guard' && c.row === 'front' && planOf(state, c) === 'mefirst');
  // 구간 용병의 막는 이는 맞을 것의 35%를 대신 맞는다 (LV-H3). 지금 동료는 그대로 70%
  return g && chance(state, def(g).guardRate ?? GUARD_RATE) ? g : null;
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

/** 동료가 대신 맞았다. 북소리가 울리는 동안은 일행도 덜 다친다 (GD-C0: 일행 모두의 방어력). */
export function hitCompanion(state, events, c, dmg) {
  const drum = drumBuff(state);
  if (drum) dmg = Math.max(1, Math.round(dmg / (1 + drum.rate)));
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
    if (d.role === 'bard') continue; // 북 치는 이는 싸우지 않는다 (GD-C0)
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
  for (const c of state.party) { c.down = false; delete c.out; c.hp = maxHpOf(c); }
}
