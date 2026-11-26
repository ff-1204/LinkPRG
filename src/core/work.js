// 남의 일터에서 하는 일은 배워야 한다 (Z29).
// 일터의 주인과 낯익은 사이가 되어 거들게 해 달라고 청하거나, 곁에서 오래 구경하면 주인이 먼저 가르쳐 준다.
// 출신에 따라 처음부터 할 줄 아는 일이 있다.

import { pushLine, ding } from './log.js?v=d783470';
import { PEOPLE } from '../data/people.js?v=d783470';
import { ACTIONS, placeById } from '../data/places.js?v=d783470';
import { originById } from '../data/origins.js?v=d783470';
import { iGa, eulReul } from './ko.js?v=d783470';

/** 곳 → 가르쳐 줄 사람 */
export const TEACHERS = { forge: 'smith', tailor: 'tailor', kitchen: 'chef', craftrow: 'master', shipyard: 'shipwright', fishmarket: 'fishwife', dock: 'ferryman', branch: 'agent', backalley: 'elder', guild: 'clerk' };
export const WATCH_TO_LEARN = 20; // 이만큼 구경하면 주인이 먼저 가르쳐 준다
const KNOWN_BOND = 1; // 청하려면 '낯익은 사이'부터

/** 출신이 처음부터 할 줄 아는 일. 뿌리 전체에 붙는 것과 출신 하나에 붙는 것. */
const NATIVE_ROOT = { smithboy: ['bellows', 'plane'] };
const NATIVE_ORIGIN = { ferrykid: ['rowing'], porter: ['haul'], miller: ['haul'], tanner: ['haul', 'gut'], quack: ['haul', 'gut'], shopkid: ['haul'], squire: ['spar'] };

export function nativeWork(originId) {
  const o = originById(originId);
  if (!o) return [];
  return [...new Set([...(NATIVE_ROOT[o.root] || []), ...(NATIVE_ORIGIN[originId] || [])])];
}

/** 배워야 하는 일인가. */
export const needsTeach = (id) => !!ACTIONS[id]?.teach;
export const knowsWork = (state, id) => !needsTeach(id) || (state.learned || []).includes(id);

/** 주인이 가르쳐 주며 하는 말 */
const TEACH_LINES = {
  smith: '풀무 밟는 건 쉬워 보여도 박자가 있어. 내가 밟는 걸 봐. …그래, 그거다.',
  chef: '칼은 재료 결을 따라 가는 거야. 생선은 꼬리부터, 약초는 뿌리부터. …그래, 그렇게.',
  tailor: '물레는 발로 돌리고 실은 손으로 뽑는 거야. 너무 당기면 끊어져. …그렇지, 그 굵기.',
  master: '이 거리 풀무는 윗마을 것보다 무겁네. 허리로 밟게. 됐네, 해 보게.',
  shipwright: '대패는 미는 게 아니라 나무가 밀려나게 두는 거야. 결 봐. 그렇지.',
  fishwife: '배는 꼬리 쪽부터 가르는 거야. 손 베지 말고. 옳지, 잘하네.',
  ferryman: '노는 등으로 젓는 거라고 했지. 물살을 거스르지 말고 타. 그래, 그렇게.',
  agent: '짐은 장부에 적힌 순서대로 나르십시오. 무거운 것이 아래. 좋습니다.',
  elder: '여기 짐은 보는 눈이 있어. 고개 숙이고 날라. …됐다. 넌 이제 우리 일꾼이야.',
  clerk: '대련은 이기는 게 아니라 막는 거예요. 상대 어깨를 보세요. 좋아요!',
};

function learn(state, events, id, teacherId) {
  if (!state.learned) state.learned = [];
  if (state.learned.includes(id)) return;
  state.learned.push(id);
  const p = PEOPLE[teacherId];
  pushLine(state, events, { k: 'npc', who: p.name, text: TEACH_LINES[teacherId] });
  ding(state, events, { level: 1, title: `${eulReul(ACTIONS[id].label)} 배웠습니다`, body: `${p.name}에게 배웠다. 이제 ${eulReul(ACTIONS[id].label)} 할 수 있다.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${p.name}에게 ${eulReul(ACTIONS[id].label)} 배웠다.`, note: `${ACTIONS[id].label}을 배운 날` });
  events.push({ type: 'learn', id });
}

/** 이곳에서 배울 수 있는 일(아직 모르는 것). */
export function learnableHere(state) {
  return placeById(state.place).actions.filter((a) => needsTeach(a) && !knowsWork(state, a));
}

/**
 * 모르는 일을 구경한다. 한 번 누르면 한 번. 오래 구경하면 주인이 먼저 가르쳐 준다.
 * 숙련도는 오르지 않는다(구경은 구경이다).
 */
export function watchWork(state, events, id) {
  if (!state.flags.watched) state.flags.watched = {};
  const n = (state.flags.watched[id] = (state.flags.watched[id] || 0) + 1);
  const teacherId = TEACHERS[state.place];
  const p = PEOPLE[teacherId];
  const label = ACTIONS[id].label;
  pushLine(state, events, { k: 'me', text: n === 1 ? `${p ? iGa(p.name) : '누가'} ${eulReul(label)} 하는 것을 곁에서 지켜보았다.` : `${eulReul(label)} 지켜보았다. ${n < WATCH_TO_LEARN / 2 ? '손이 어디로 가는지 따라가 본다.' : '박자가 조금 보인다.'}` });
  if (n >= WATCH_TO_LEARN && teacherId) {
    pushLine(state, events, { k: 'room', text: `${iGa(p.name)} 고개를 들더니 손짓한다.` });
    learn(state, events, id, teacherId);
  }
}

/** 일터의 주인에게 거들게 해 달라고 청한다. 낯익은 사이부터. */
export function askToLearn(state, events, npcId, bondOf) {
  const placeId = Object.keys(TEACHERS).find((k) => TEACHERS[k] === npcId && k === state.place);
  if (!placeId) throw new Error('여기서 가르쳐 줄 사람이 아닙니다');
  const id = learnableHere(state)[0];
  if (!id) throw new Error('여기서 더 배울 일이 없습니다');
  if (bondOf(state, npcId) < KNOWN_BOND) throw new Error('아직 낯선 사이입니다. 조금 더 가까워진 뒤에 청해 보세요');
  pushLine(state, events, { k: 'me', text: `${eulReul(ACTIONS[id].label)} 거들게 해 달라고 청했다.` });
  learn(state, events, id, npcId);
}

export { KNOWN_BOND };
