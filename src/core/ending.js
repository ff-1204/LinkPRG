// 메인 5장 "마지막 울림"과 끝 넷 (S2). 지금까지 무엇으로 살았는지가 고를 수 있는 끝을 정한다.
// 어느 끝도 나쁜 끝이 아니다. 끝난 뒤에도 게임은 이어지고, 고른 끝이 띠링의 규칙을 바꾼다.

import { seedFrom } from './rng.js?v=71fb80c';
import { pushLine, ding } from './log.js?v=71fb80c';
import { PEOPLE, PEOPLE_PART1 as PEOPLE_ORDER } from '../data/people.js?v=71fb80c';
import { FACTION_ORDER, FACTION_REGULAR } from '../data/factions.js?v=71fb80c';
import { HIDDEN_JOBS } from '../data/jobs.js?v=71fb80c';
import { bondOf } from './social.js?v=71fb80c';
import { standingOf } from './factions.js?v=71fb80c';
import { foundCount } from './hidden.js?v=71fb80c';
import { userAt } from './world.js?v=71fb80c';
import { USER_COUNT } from '../data/world.js?v=71fb80c';

export const MASTER_GRADE = 27; // 달인 1
const FAMILY = 4; // '가족 같은 사이'
export const RING_PER_DAY = 3;

export const ENDINGS = {
  mend: {
    name: '잇는다', called: '종을 이은 이',
    text: '울림쇠로 새 종을 짓는다. 약속이 이어진다.',
    say: '천 사람이 열두 번씩 두드렸다던 것을, 혼자 열두 번씩 천 번을 두드렸다. 새 종이 들보에 걸렸다. 허리에 이름 하나가 새겨져 있다. 첫 울림은 또렷했다. 소리재의 빈 종루까지 들렸다고 한다.',
    after: '띠링이 또렷해졌다. 새 종에는 지은 이의 이름이 새겨져 있다. 종은 전에 답하지 못하던 것에도 답하기 시작한다.',
  },
  free: {
    name: '푼다', called: '종을 푼 이',
    text: '종을 녹여 모두에게 나눈다. 약속이 끝나고, 재주는 다시 사람의 것이 된다.',
    say: '종을 내려 녹였다. 울림쇠는 못이 되고 솥이 되고 호미가 되어 집집으로 갔다. 이제 누가 무엇을 끝까지 해내도 종은 울지 않는다. 대신 사람들이 서로의 손을 본다.',
    after: '큰 띠링은 사라졌다. 모든 숙련도가 조금 빨리 오른다. 숨어 있던 것들의 문턱이 모두 보인다.',
  },
  keep: {
    name: '맡는다', called: '종지기',
    text: '내가 종지기가 된다. 누구에게 크게 답할지를 내가 정한다.',
    say: '금 간 자리에 손을 얹었다. 종은 멈추지 않았다. 다만 이제 스스로 울지 않는다. 내가 울린다. 문지기가 문 옆으로 한 걸음 비켜 자리를 내주었다.',
    after: '종은 이제 내 손으로만 운다. 남의 끈기를 지켜보고 띠링을 울려 줄 수 있다. 내 띠링은 더 울리지 않는다.',
  },
  hidden: {
    name: '서로 답한다', called: '모두가 본 이',
    text: '',
    say: '종이 멈추는 날이었다. 마지막 울림은 끝내 오지 않았다. 대신 계단 위에서 발소리가 났다. 하나, 둘, 여럿. 잡화점 할머니가 맨 앞이었다. "봤어. 네가 한 거." 교관이 고개를 끄덕였다. 조합장도, 대리인도, 다리 밑의 눈도 있었다. 종은 조용했다. 아무도 종을 보지 않았다.',
    after: '띠링 대신 사람들의 말이 온다. 나도 남의 끈기를 알아봐 줄 수 있다.',
  },
};

/** 끝마다, 고를 수 있는지와 그 까닭 (S2-1, M11-1). */
export function endingChoices(state) {
  const smith = (state.skills.smithing?.grade || 0) >= MASTER_GRADE || state.work === 'smith';
  const ore = ['miners', 'buy', 'both', 'hidden'].includes(state.flags.lode);
  const seen = !!HIDDEN_JOBS[state.job] || foundCount(state) >= 5;
  const alive = !!state.flags.keeperAlive;
  return [
    { id: 'mend', label: ENDINGS.mend.name, text: ENDINGS.mend.text, can: smith && ore,
      why: !smith ? '대장 달인이거나 일하는 직업이 대장장이여야 한다' : !ore ? '울림쇠 광맥에 닿을 길이 없다(3장에서 상단에 넘겼다)' : '' },
    { id: 'free', label: ENDINGS.free.name, text: ENDINGS.free.text, can: true, why: '' },
    { id: 'keep', label: ENDINGS.keep.name, text: ENDINGS.keep.text, can: seen && alive,
      why: !seen ? '히든 직업이 있거나 히든 스탯을 다섯 지녀야 한다' : !alive ? '문지기가 살아 있어야 한다' : '' },
  ];
}

/** 숨은 끝의 조건: 다섯 사람과 가족 같은 사이, 세력 넷과 모두 단골 이상, 동료 둘이 곁에 있음. 선택지에 없다. */
export function hiddenEnding(state) {
  const family = PEOPLE_ORDER.filter((id) => bondOf(state, id) >= FAMILY).length;
  const factions = FACTION_ORDER.every((f) => standingOf(state, f) >= FACTION_REGULAR);
  return family >= 5 && factions && state.party.length >= 2;
}

/** 종 앞에 선다. 숨은 끝의 조건을 채웠으면 고르지 않고 그 끝이 된다. */
export function standBeforeBell(state, events) {
  if (state.main.chapter !== 5 || state.ending) throw new Error('아직 종 앞에 설 때가 아닙니다');
  if (state.dungeon?.id !== 'ruins' || state.dungeon.room !== 'f3-bell') throw new Error('종은 폐허 맨 아래층에 있습니다');
  pushLine(state, events, { k: 'me', text: '종 앞에 섰다. 금은 이제 허리를 다 돌았다.' });
  if (hiddenEnding(state)) return 'hidden';
  state.choice = { kind: 'ending' };
  events.push({ type: 'choice' });
  return null;
}

export function endingChoiceView(state) {
  return {
    kind: 'ending', title: '마지막 울림', side: '종 앞에서',
    text: '종은 곧 멈춘다. 어떻게 할 것인가. 한 번 고르면 되돌릴 수 없다. 어느 쪽도 틀린 답이 아니다.',
    note: '고른 끝이 띠링의 규칙을 바꾼다. 끝난 뒤에도 세계는 이어진다.',
    options: [
      ...endingChoices(state).map((c) => ({ id: c.id, label: `${c.label}: ${c.text}`, disabled: !c.can, why: c.why })),
      { id: 'back', label: '아직 정하지 않는다' },
    ],
  };
}

/** 끝이 정해졌다. */
export function applyEnding(state, events, id) {
  const e = ENDINGS[id];
  if (!e) throw new Error('모르는 끝입니다');
  if (state.ending) throw new Error('이미 끝을 골랐습니다');
  if (id !== 'hidden') {
    const c = endingChoices(state).find((x) => x.id === id);
    if (!c || !c.can) throw new Error(c ? c.why : '고를 수 없는 끝입니다');
  }
  state.choice = null;
  pushLine(state, events, { k: 'room', text: e.say });
  // 이 띠링은 종의 마지막 울림이다. 그 뒤로는 고른 끝의 규칙을 따른다
  ding(state, events, { level: 4, kind: 'ending', title: `끝: ${e.name}`, big: e.name, body: e.after });
  state.ending = id;
  state.endDay = state.day;
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${e.say.split('. ')[0]}. 그리고 다음 날이 왔다.`, note: `끝: ${e.name}` });
  events.push({ type: 'ending', id });
}

/** 끝난 뒤의 세계를 한 줄로 (퀘스트 창과 일지가 쓴다). */
export function afterText(state) {
  return state.ending ? ENDINGS[state.ending].after : '';
}

// ── 종지기의 일: 남의 끈기를 지켜보고 띠링을 울려 준다 (맡는다, 서로 답한다) ──

const WATCH = [
  ['사흘 내리 같은 바위를 캐고 있다', '사흘 내리 같은 바위를 캐던 사람이다'],
  ['허수아비 앞에서 해가 지도록 서 있다', '허수아비 앞에서 해가 지도록 서 있던 사람이다'],
  ['백 번째 토막을 깎고 있다. 아흔아홉 개는 졸작이었다', '졸작 아흔아홉 개 끝에 백 번째를 깎던 사람이다'],
  ['아무도 받지 않는 의뢰를 혼자 끝냈다', '아무도 받지 않는 의뢰를 혼자 끝낸 사람이다'],
  ['쓰러진 자리에 네 번째로 돌아왔다', '쓰러진 자리에 네 번째로 돌아온 사람이다'],
  ['날마다 같은 시각에 강에 낚싯대를 던진다', '날마다 같은 시각에 낚싯대를 던지던 사람이다'],
  ['식은 쇠를 열두 번째 다시 달구고 있다', '식은 쇠를 열두 번째 다시 달구던 사람이다'],
];

/** 오늘 지켜볼 수 있는 이들. 날마다 다르고, 같은 날에는 같다. */
export function ringView(state) {
  if (state.ending !== 'keep' && state.ending !== 'hidden') return null;
  const day = state.day;
  const out = [];
  for (let k = 0; k < RING_PER_DAY; k++) {
    const h = seedFrom(`${state.seed}|ring|${day}|${k}`);
    // 셋에 하나는 마을 사람이다
    const person = h % 3 === 0 ? PEOPLE[PEOPLE_ORDER[(h >>> 3) % PEOPLE_ORDER.length]] : null;
    const name = person ? person.name : userAt(state, (h >>> 3) % USER_COUNT).name;
    out.push({ k, name, what: WATCH[(h >>> 9) % WATCH.length][0], was: WATCH[(h >>> 9) % WATCH.length][1], done: state.rung.day === day && state.rung.ks.includes(k) });
  }
  return { list: out, total: state.rung.total, verb: state.ending === 'keep' ? '종을 울려 준다' : '봤다고 말해 준다' };
}

export function ringFor(state, events, k) {
  const v = ringView(state);
  if (!v) throw new Error('할 수 없는 일입니다');
  const who = v.list.find((x) => x.k === k);
  if (!who) throw new Error('오늘 지켜본 이가 아닙니다');
  if (who.done) throw new Error('오늘은 이미 답해 주었습니다');
  if (state.rung.day !== state.day) state.rung = { day: state.day, ks: [], total: state.rung.total };
  state.rung.ks.push(k);
  state.rung.total += 1;
  const text = state.ending === 'keep' ? `'${who.name}'에게 종이 울렸다. ${who.was}.` : `'${who.name}'에게 가서 말했다. "봤어. 네가 한 거."`;
  pushLine(state, events, { k: 'me', text });
  state.world.notices.push({ day: state.day, phase: state.phase, who: state.name, mine: true, text: state.ending === 'keep' ? `'${who.name}'님에게 띠링이 울렸습니다` : `'${state.name}'님이 '${who.name}'님의 끈기를 알아보았습니다` });
  events.push({ type: 'world' });
}

export function endingFields() {
  return { ending: null, endDay: 0, rung: { day: 0, ks: [], total: 0 } };
}
