// 대화방에 한 줄을 남기고 띠링을 울리는 일. 규칙의 모든 곳이 이것을 쓴다.

import { PEOPLE } from '../data/people.js?v=d86445b';
import { ANVIL_LINES, tentsHere, TENT_BY_ID } from '../data/anvil.js?v=d86445b';
import { iGa } from './ko.js?v=d86445b';

export const LOG_KEEP = 300;
/** 나누어 건 뒤 (CM-D6): 띠링에 이름이 붙을 만큼 사이가 깊은 사람들('단골'부터). */
const CLOSE_AT = 30;
export const SHARE_FULL = 10; // 이만큼이면 띠링마다 이름이 붙는다
export const closePeople = (state) => Object.keys(state.people || {}).filter((id) => PEOPLE[id] && (state.people[id].pts || 0) >= CLOSE_AT);

/** 숨은 끝 뒤에 띠링 대신 말을 건네는 사람들. */
const VOICES = [
  { who: '잡화점 할머니', say: '봤어. 네가 한 거.' }, { who: '교관', say: '봤다.' }, { who: '대장간 주인', say: '다 봤네.' },
  { who: '주점 주인', say: '봤네, 봤어.' }, { who: '견습 사제 미루', say: '저 봤어요!' }, { who: '늙은 뱃사공', say: '강 건너에서도 보이더군.' },
];

/** 바로 앞 줄과 같은 글이면 새 줄을 내지 않고 앞 줄에 횟수만 더한다 (Z118). 띠링과 적의 다음 행동은 늘 새 줄이다. */
const SAME_KEYS = ['k', 'who', 'text', 'tone'];
const NO_MERGE = ['ding', 'intent'];

/** 대화방에 한 줄. */
export function pushLine(state, events, line) {
  const prev = state.log[state.log.length - 1];
  if (prev && !NO_MERGE.includes(line.k) && SAME_KEYS.every((key) => (prev[key] ?? null) === (line[key] ?? null)) && Object.keys(line).every((key) => SAME_KEYS.includes(key))) {
    prev.rep = (prev.rep || 1) + 1;
    prev.day = state.day; prev.phase = state.phase;
    events.push({ type: 'line', line: prev, again: true });
    return prev;
  }
  const entry = { day: state.day, phase: state.phase, ...line };
  state.log.push(entry);
  if (state.log.length > LOG_KEEP) state.log.splice(0, state.log.length - LOG_KEEP);
  events.push({ type: 'line', line: entry });
  return entry;
}

/**
 * 띠링 하나 (D3). 귀한 정도: 1 흔함, 2 귀함, 3 아주 귀함, 4 가장 귀함, 5 세계 최초.
 * 화면은 귀한 것을 창으로 띄운다. kind가 있으면 화면이 그에 맞는 창을 쓴다(예: 'levelup').
 */
export function ding(state, events, { level, title, big, body, reason, kind }) {
  // 13장에서 새긴 끝이 1부의 끝이 바꾼 규칙을 덮는다 (CM-D9). "내려간다"는 아무것도 바꾸지 않는다
  const end2 = state.anvil?.end && state.anvil.end !== 'descend' ? state.anvil.end : null;
  const end = end2 ? null : state.ending;
  // 푼다: 큰 띠링이 사라졌다. 귀함보다 큰 것은 울리지 않는다
  if (end === 'free') level = Math.min(level, 2);
  // 맡는다: 내 띠링은 더 울리지 않는다. 글로만 남는다
  // 모루를 식힌다: 띠링이 사라졌다. 대신 내 말 한 줄이 남는다 (CM-D6)
  const cool = end2 === 'cool';
  const silent = end === 'keep' || cool;
  if (silent) level = 1;
  // 서로 답한다: 띠링 대신 사람들의 말이 온다
  const voice = end === 'hidden' ? VOICES[state.dings.length % VOICES.length] : null;
  if (voice) level = 1;
  const context = state.log.filter((l) => l.k !== 'ding').slice(-3).map((l) => ({ who: l.who || null, text: l.text }));
  // 메인 4장 동안은 종의 금이 벌어져, 띠링 셋에 하나가 늦게·흐리게 온다. 더 나빠지지는 않는다 (S1-3)
  const faint = state.main?.chapter === 4 && kind !== 'main' && (state.dings.length % 3) === 1;
  const d = {
    silent, voice: voice ? voice.who : null, clear: end === 'mend' || end2 === 'again' || end2 === 'eight',
    faint,
    id: state.dings.length + 1, level, title, big: big || title, body: body || '', reason: reason || '',
    kind: kind || null, day: state.day, phase: state.phase, place: state.place, context,
  };
  state.dings.push(d);
  if (voice) pushLine(state, events, { k: 'npc', who: voice.who, text: `${voice.say} ${title.replace(/습니다$/, '다며').replace(/었다며$/, '었다며')}.`, tone: 'mint' });
  else if (cool) { pushLine(state, events, { k: 'sys', text: title }); pushLine(state, events, { k: 'me', text: ANVIL_LINES.did }); }
  else if (silent) pushLine(state, events, { k: 'sys', text: `${title} (종은 울리지 않았다)` });
  else if (end2 === 'share') {
    // 나누어 건다: 띠링에 사람의 이름이 붙는다. 사이가 깊은 사람이 많을수록 자주 (CM-D6)
    const close = closePeople(state), n = state.dings.length;
    const who = close.length && (n * 7 + state.day) % SHARE_FULL < close.length ? PEOPLE[close[(n + state.day) % close.length]].name : null;
    if (who) d.seenBy = who;
    pushLine(state, events, { k: 'ding', level, text: `띠링! ${title}${who ? ` (${ANVIL_LINES.saw(iGa(who))})` : ''}` });
  } else if (end2 === 'eight') {
    // 여덟이 친다: 종과 사람이 함께 답한다 (CM-D6)
    pushLine(state, events, { k: 'ding', level, text: `띠링! ${title}` });
    const tents = tentsHere(state);
    if (tents.length) { const t = TENT_BY_ID[tents[state.dings.length % tents.length]]; d.seenBy = t.name; pushLine(state, events, { k: 'npc', who: t.name, text: ANVIL_LINES.together, tone: 'mint' }); }
  }
  else pushLine(state, events, { k: 'ding', level, text: `띠링! ${title}` });
  events.push({ type: 'ding', ding: d });
  return d;
}
