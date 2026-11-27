// 저주와 안개 (AN-B): 안개늪의 규칙 둘. 맞으면 쌓이는 저주, 그리고 길을 잃게 하는 안개.
// 저주는 죽음의 그림자와 같은 틀이다(겹으로 쌓이고 성수로 걷는다, AN-G1). 안개늪을 떠나도 남고, 칸이 따라간다 (AN-F2).
// 안개는 들판(이끼 밭, 가라앉는 숲)에서만 듣는다. 등불도 표식도 없이 탐색하면 길을 잃어 반나절이 가고 뜬마을 나루로 돌아온다 (AN-G2).

import { placeById } from '../data/places.js?v=f81b3db';
import { MONSTERS } from '../data/monsters.js?v=f81b3db';
import { pushLine } from './log.js?v=f81b3db';
import { chance } from './rng.js?v=f81b3db';
import { countOf, takeById } from './inventory.js?v=f81b3db';
import { eunNeun } from './ko.js?v=f81b3db';

/**
 * AN-B3의 숫자. rate: 맞을 때 한 겹이 앉을 확률. max: 겹의 끝. per: 한 겹마다 받는 피해. deepHeal: 깊은 저주에서 음식·물약이 채우는 몫.
 * pray: 늪 사당에서 한 겹을 걷는 기도 수. lost: 길을 잃을 확률. lampMoves: 등불이 가는 걸음. knots: 영영 길을 잃지 않게 되는 끈의 수. cursedAt: 이 겹을 넘게 안고 이긴 싸움을 센다.
 */
export const MARSH = { band: 6, gate: 'floatgate', shrine: 'marshshrine', rate: 0.20, max: 5, per: 0.05, deepHeal: 0.5, pray: 10, lost: 0.15, lampMoves: 60, lamp: 'lamp', knot: 'marker', knots: 10, cursedAt: 3, lit: 'mossfield', litFlag: 'lampsLit' };
export const DEEP_NAME = '깊은 저주';
export const MARSH_LINES = {
  first: ['재가 끝나자 안개가 시작됐다. 발밑이 물이다. 멀리 불빛 몇이 떠 있는데 가까워지지 않는다. 여기서는 아무 소리도 울리지 않는다. 종소리도, 함성도, 띠링도.', '안개가 발목에 감긴다. 등불도 표식도 없이 들판을 뒤지면 길을 잃는다.'],
  curse: '저주가 한 겹 더 앉았다.',
  deep: '저주가 다섯 겹이다. 먹고 마셔도 절반만 찬다.',
  prayed: '물에 잠긴 제단 앞에서 저주 한 겹이 걷혔다.',
  prayedAll: '마지막 저주가 걷혔다. 어깨가 가볍다.',
  lost: '안개가 짙어졌다. 왔던 길이 보이지 않는다. 길을 잃었다.',
  found: '한참을 헤맨 끝에 등불 다리가 보였다. 반나절이 지났다.',
  keeper: '또 한 사람. 등불을 들든가, 끈을 묶어 두든가 해요. 묶어 둔 데는 안 잃어요.',
  lampOn: '등불을 켰다. 안개 속에 둥근 자리가 생긴다.',
  lampOut: '등불이 꺼졌다.',
  knot: '젖은 가지에 표식 끈을 묶었다.',
};

export const marshFields = () => ({ marsh: { curse: 0, pray: 0, lamp: 0, knots: {}, moss: 0 }, shop: null });
/** 안개늪의 칸. 없던 저장에서도 그 자리에서 생긴다. */
export function marshOf(state) {
  if (!state.marsh || typeof state.marsh !== 'object') state.marsh = marshFields().marsh;
  return state.marsh;
}

/** 안개늪에 있는가 (뜬마을의 방들, 이끼 밭, 가라앉는 숲, 가라앉는 오솔길). */
export const inMarsh = (state) => placeById(state.place).band === MARSH.band;
/** 안개가 듣는 들판인가: 이끼 밭, 가라앉는 숲. 오솔길 안은 길이 하나라 잃지 않는다. */
export const inFog = (state) => !state.dungeon && !!placeById(state.place).fog;
export const curseOf = (state) => state.marsh?.curse || 0;
/** 저주가 받는 피해에 곱하는 몫: 한 겹마다 +5%. */
export const curseMult = (state) => 1 + curseOf(state) * MARSH.per;
/** 깊은 저주(다섯 겹)에서 음식과 물약이 채우는 몫. */
export const healCut = (state) => (curseOf(state) >= MARSH.max ? MARSH.deepHeal : 1);

/** 안개늪의 몬스터에게 맞았다: 20%로 저주가 한 겹 앉는다. 다섯 겹까지. */
export function curseHit(state, events, monId) {
  const m = MONSTERS[monId];
  if (!m || m.band !== MARSH.band) return;
  const a = marshOf(state);
  if (a.curse >= MARSH.max || !chance(state, MARSH.rate)) return;
  a.curse += 1;
  pushLine(state, events, { k: 'sys', text: `${m.curseSay ? `${m.curseSay} ` : ''}${MARSH_LINES.curse}`, tone: 'frost' });
  if (a.curse >= MARSH.max) pushLine(state, events, { k: 'sys', text: MARSH_LINES.deep, tone: 'frost' });
  events.push({ type: 'curse', n: a.curse });
}

/** 성수 한 병에 모두 걷힌다. @returns 걷힌 것이 있었으면 true */
export function liftCurse(state, events) {
  const a = state.marsh;
  if (!a || !(a.curse > 0)) return false;
  a.curse = 0; a.pray = 0;
  events.push({ type: 'curse', n: 0 });
  return true;
}

/** 늪 사당에서 기도를 한 번 했다: 열 번에 한 겹이 걷힌다. 다른 곳의 기도로는 걷히지 않는다. */
export function prayCurse(state, events) {
  const a = state.marsh;
  if (!a || !(a.curse > 0) || state.place !== MARSH.shrine) return;
  a.pray = (a.pray || 0) + 1;
  if (a.pray < MARSH.pray) return;
  a.pray = 0;
  a.curse -= 1;
  pushLine(state, events, { k: 'sys', text: a.curse ? `${MARSH_LINES.prayed} 남은 저주 ${a.curse}겹.` : MARSH_LINES.prayedAll, tone: 'good' });
  events.push({ type: 'curse', n: a.curse });
}

/** 이곳에서 길을 잃지 않는가: 등불이 켜져 있거나, 끈 열 개를 묶었거나, 다리의 등불을 다 붙였다(이끼 밭). */
export function fogSafe(state) {
  const a = state.marsh || {};
  return (a.lamp || 0) > 0 || (a.knots?.[state.place] || 0) >= MARSH.knots || (state.place === MARSH.lit && !!state.flags?.[MARSH.litFlag]);
}
/** 탐색하려는데 안개가 짙어졌는가. 길을 잃으면 true: 그 탐색은 일어나지 않는다. 시간과 돌아오는 길은 game.js가 맡는다. */
export function lostInFog(state, events) {
  if (!inFog(state) || fogSafe(state) || !chance(state, MARSH.lost)) return false;
  pushLine(state, events, { k: 'me', text: `${eunNeun(placeById(state.place).name)} 안개뿐이다. 둘레를 살폈다.` });
  pushLine(state, events, { k: 'sys', text: MARSH_LINES.lost, tone: 'frost' });
  events.push({ type: 'lost' });
  return true;
}

/** 등불을 켠다 (AN-B3): 가방의 등불 하나를 쓴다. 60번 움직이는 동안 길을 잃지 않는다. */
export function lightLamp(state, events) {
  if (!inFog(state)) throw new Error('등불은 안개늪의 들판에서 켭니다');
  const a = marshOf(state);
  if (a.lamp > 0) throw new Error('등불이 이미 켜져 있습니다');
  if (countOf(state, MARSH.lamp) < 1) throw new Error('등불이 없습니다');
  takeById(state, MARSH.lamp, 1);
  a.lamp = MARSH.lampMoves;
  pushLine(state, events, { k: 'me', text: MARSH_LINES.lampOn });
  events.push({ type: 'bag' });
}
/** 한 번 움직였다: 켜 둔 등불이 닳는다. */
export function lampMove(state, events) {
  const a = state.marsh;
  if (!a || !(a.lamp > 0)) return;
  a.lamp -= 1;
  if (a.lamp <= 0) { a.lamp = 0; pushLine(state, events, { k: 'sys', text: MARSH_LINES.lampOut, tone: 'warn' }); }
}

/** 이곳에 묶은 끈의 수. */
export const knotsHere = (state) => state.marsh?.knots?.[state.place] || 0;
/** 표식 끈을 하나 묶는다 (AN-B3): 열 개를 묶으면 그곳에서는 영영 길을 잃지 않는다. 한 번에 하나. */
export function tieKnot(state, events) {
  if (!inFog(state) || !placeById(state.place).knot) throw new Error('여기에는 끈을 묶을 데가 없습니다');
  const a = marshOf(state);
  const n = a.knots[state.place] || 0;
  if (n >= MARSH.knots) throw new Error('이곳의 길은 이미 다 묶었습니다');
  if (countOf(state, MARSH.knot) < 1) throw new Error('표식 끈이 없습니다');
  takeById(state, MARSH.knot, 1);
  a.knots[state.place] = n + 1;
  const name = placeById(state.place).name;
  pushLine(state, events, { k: 'me', text: `${MARSH_LINES.knot} (${n + 1} / ${MARSH.knots})` });
  if (n + 1 >= MARSH.knots) pushLine(state, events, { k: 'sys', text: `${name}의 길을 다 묶었다. 이제 여기서는 길을 잃지 않는다.`, tone: 'mint' });
  events.push({ type: 'bag' });
}

/** 화면이 그릴 것 (AN-B1, AN-F2). 안개늪 밖이고 저주도 없으면 null: 칸이 생기지 않는다. */
export function curseView(state) {
  const n = curseOf(state);
  if (!inMarsh(state) && n < 1) return null;
  const deep = n >= MARSH.max;
  const left = state.marsh?.lamp || 0;
  return {
    n, max: MARSH.max, deep,
    tag: n > 0 ? { id: 'curse', name: `저주 ${n}겹`, text: `받는 피해 +${Math.round(n * MARSH.per * 100)}%` } : null,
    deepTag: deep ? { id: 'deep', name: DEEP_NAME, text: '음식과 물약으로 차는 생명력이 절반' } : null,
    lamp: left > 0 ? { id: 'lamp', name: '등불', text: `길을 잃지 않는다 (${left}번 남음)`, left } : null,
    field: inFog(state),
  };
}
