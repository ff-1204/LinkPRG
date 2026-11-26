// 대화방에 한 줄을 남기고 띠링을 울리는 일. 규칙의 모든 곳이 이것을 쓴다.

export const LOG_KEEP = 300;

/** 숨은 끝 뒤에 띠링 대신 말을 건네는 사람들. */
const VOICES = [
  { who: '잡화점 할머니', say: '봤어. 네가 한 거.' }, { who: '교관', say: '봤다.' }, { who: '대장간 주인', say: '다 봤네.' },
  { who: '주점 주인', say: '봤네, 봤어.' }, { who: '견습 사제 미루', say: '저 봤어요!' }, { who: '늙은 뱃사공', say: '강 건너에서도 보이더군.' },
];

/** 대화방에 한 줄. */
export function pushLine(state, events, line) {
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
  const end = state.ending;
  // 푼다: 큰 띠링이 사라졌다. 귀함보다 큰 것은 울리지 않는다
  if (end === 'free') level = Math.min(level, 2);
  // 맡는다: 내 띠링은 더 울리지 않는다. 글로만 남는다
  const silent = end === 'keep';
  if (silent) level = 1;
  // 서로 답한다: 띠링 대신 사람들의 말이 온다
  const voice = end === 'hidden' ? VOICES[state.dings.length % VOICES.length] : null;
  if (voice) level = 1;
  const context = state.log.filter((l) => l.k !== 'ding').slice(-3).map((l) => ({ who: l.who || null, text: l.text }));
  // 메인 4장 동안은 종의 금이 벌어져, 띠링 셋에 하나가 늦게·흐리게 온다. 더 나빠지지는 않는다 (S1-3)
  const faint = state.main?.chapter === 4 && kind !== 'main' && (state.dings.length % 3) === 1;
  const d = {
    silent, voice: voice ? voice.who : null, clear: end === 'mend',
    faint,
    id: state.dings.length + 1, level, title, big: big || title, body: body || '', reason: reason || '',
    kind: kind || null, day: state.day, phase: state.phase, place: state.place, context,
  };
  state.dings.push(d);
  if (voice) pushLine(state, events, { k: 'npc', who: voice.who, text: `${voice.say} ${title.replace(/습니다$/, '다며').replace(/었다며$/, '었다며')}.`, tone: 'mint' });
  else if (silent) pushLine(state, events, { k: 'sys', text: `${title} (종은 울리지 않았다)` });
  else pushLine(state, events, { k: 'ding', level, text: `띠링! ${title}` });
  events.push({ type: 'ding', ding: d });
  return d;
}
