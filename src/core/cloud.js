// 바람 (GD-B): 구름다리의 규칙.
// 벼랑길과 신전 뜰에는 때(아침·낮·밤)마다 뒷바람·맞바람·옆바람 가운데 하나가 분다. 씨앗으로 정해져 같은 날 같은 때는 늘 같다.
// 바람마다 맞는 싸움법이 다르다. 다릿목과 하늘 신전 안에서는 불지 않고, 칸도 이름표도 없다 (GD-G2).
// 싸움에 걸리는 것은 battle.js가 여기 숫자를 읽어 넣는다.

import { placeById } from '../data/places.js?v=69345ec';
import { roll01 } from './rng.js?v=69345ec';
import { pushLine } from './log.js?v=69345ec';

/**
 * GD-A1, GD-B3의 숫자. road: 지붕마을에서 오르는 하루 길에 드는 때.
 * again/againDmg: 뒷바람에 한 번 더 들어갈 확률과 그 피해의 몫. flee: 뒷바람의 달아나기 덤.
 * bowCut: 맞바람에 활과 던지는 물건이 깎이는 몫. dodgeCut: 맞바람에 피하기 태세가 깎이는 몫.
 */
export const CLOUD = { band: 8, gate: 'bridgegate', town: '다릿목', road: 50, again: 0.2, againDmg: 0.5, flee: 0.2, bowCut: 0.3, dodgeCut: 0.15 };
/** 바람 셋. text: 이름표에 붙는 말(뒷바람·옆바람은 시안 GD-B1, GD-B2). room: 그곳에 들어설 때의 한 줄. */
export const WINDS = {
  tail: { id: 'tail', name: '뒷바람', text: '공격이 한 번 더 들어갈 수 있다', room: '등 뒤에서 바람이 민다.' },
  head: { id: 'head', name: '맞바람', text: '활과 던지는 물건이 약해진다. 큰 공격이 늦게 온다', room: '바람이 얼굴을 친다. 눈을 뜨기 어렵다.' },
  side: { id: 'side', name: '옆바람', text: '큰 공격을 맞으면 밀려난다', room: '바람이 옆에서 민다. 구름 쪽으로.' },
};
const ORDER = ['tail', 'head', 'side'];
export const CLOUD_LINES = {
  // GD-E2. 둘째 줄은 처음 값이다
  first: ['물이 끝나고 돌이 시작됐다. 구름을 뚫고 오르자 두 산 사이에 다리가 걸려 있었다. 다리 끝에 금빛 지붕이 있다. 여기까지 오는 동안 띠링이 한 번도 울리지 않았다는 것을 그제야 알았다.', '벼랑길과 신전 뜰에는 때마다 다른 바람이 분다. 바람에 따라 싸움법을 바꿔야 한다.'],
  flag: '깃발을 올려다보았다.',
  again: '바람을 탔다. 한 번 더 들어갔다.',
  late: '맞바람에 밀려 큰 공격이 늦는다.',
  pushed: ['받혀', '끝까지 밀렸다. 한 턴을 잃었다.'],
  lost: '몸을 가누느라 아무것도 하지 못했다.',
  held: '새로 깐 널이 발을 받쳤다. 밀려나지 않았다.',
};
/** 밀려나는 데: 벼랑길은 벼랑 끝, 신전 뜰은 담장. */
const EDGE = { cliffroad: '벼랑 끝', templeyard: '담장' };

/** 구름다리에 있는가 (다릿목의 방들, 벼랑길, 신전 뜰, 하늘 신전). */
export const inCloud = (state) => placeById(state.place).band === CLOUD.band;
/** 그날 그때의 바람. 씨앗으로 정해진다. */
export const windAt = (state, day, phase) => ORDER[Math.floor(roll01(`${state.seed}|wind|${day}|${phase}`) * ORDER.length) % ORDER.length];
/** 바람이 부는 데 서 있는가: 벼랑길, 신전 뜰. 하늘 신전 안에서는 불지 않는다. */
export const windy = (state) => !state.dungeon && !!placeById(state.place).windy;
/** 지금 부는 바람(없으면 null). */
export const windNow = (state) => (windy(state) ? WINDS[windAt(state, state.day, state.phase)] : null);
/** 지금 그 바람이 부는가. */
export const windIs = (state, id) => windNow(state)?.id === id;
/** 다음 때의 바람과 그때의 이름. */
export function windNext(state) {
  const last = state.phase >= 2;
  return { wind: WINDS[windAt(state, last ? state.day + 1 : state.day, last ? 0 : state.phase + 1)], when: ['낮', '밤', '내일 아침'][state.phase] };
}
/** 화면이 그릴 것 (GD-B1, GD-G2). 바람이 불지 않는 데서는 null: 칸이 생기지 않는다. */
export function windView(state) {
  const w = windNow(state);
  return w ? { id: w.id, name: w.name, low: w.id === 'side', tag: { name: w.name, text: w.text } } : null;
}
/** 그곳에 들어설 때, 그리고 때가 바뀔 때의 한 줄. 바람이 불지 않는 데서는 아무 말도 없다. */
export function windLine(state, events, changed = false) {
  const w = windNow(state);
  if (w) pushLine(state, events, { k: 'room', text: changed ? `바람이 바뀐다. ${w.name}이다. ${w.room}` : w.room });
}

/** 깃발 보기 (GD-B2): 다음 때의 바람을 안다. 때가 흐르지 않는다. */
export function lookFlag(state, events) {
  if (!windy(state)) throw new Error('바람 깃발은 벼랑길에 있습니다');
  const n = windNext(state);
  pushLine(state, events, { k: 'me', text: `${CLOUD_LINES.flag} ${n.when}은 ${n.wind.name}이다.` });
}
/** 옆바람에 밀려났을 때의 한 줄. */
export const pushedLine = (state, name) => `${name}에게 ${CLOUD_LINES.pushed[0]} ${EDGE[state.place] || '끝'}${EDGE[state.place] ? '까지' : ''} 밀렸다. 한 턴을 잃었다.`;
