// 세력과 성향 (T29~T33).

import { pushLine, ding } from './log.js?v=8782554';
import { FACTIONS, FACTION_ORDER, STANDINGS, HATED_BELOW, RIVAL_RATE, LEANS } from '../data/factions.js?v=8782554';
import { iGa, ro } from './ko.js?v=8782554';

/** 세력과의 사이 번호: 0 미움, 1 남, 2 낯익음, 3 단골, 4 벗, 5 한편. */
export function standingOf(state, id) {
  const pts = state.factions[id] || 0;
  if (pts < HATED_BELOW) return 0;
  let i = 1;
  for (let k = 1; k < STANDINGS.length; k++) if (pts >= STANDINGS[k].at) i = k;
  return i;
}
export const standingName = (state, id) => STANDINGS[standingOf(state, id)].name;

/** 한쪽이 오르면 맞수는 그 절반만큼 내린다 (T32). 내릴 때는 맞수가 오르지 않는다. */
export function addStanding(state, events, id, n, noRival = false) {
  const f = FACTIONS[id];
  if (!f) throw new Error('모르는 세력: ' + id);
  const apply = (fid, amount) => {
    const before = standingOf(state, fid);
    state.factions[fid] = (state.factions[fid] || 0) + amount;
    const after = standingOf(state, fid);
    const name = FACTIONS[fid].name;
    if (after > before) ding(state, events, { level: 2, kind: 'faction', title: `${name}${josaWa(name)} ${iGa(`'${STANDINGS[after].name}'`)} 되었습니다`, big: `${name}: ${STANDINGS[after].name}` });
    else if (after < before) pushLine(state, events, { k: 'sys', text: `${name}${josaWa(name)}의 사이가 ${after === 0 ? `'${STANDINGS[after].name}'이 되었다. 그쪽 사람들이 등을 돌린다` : `${ro(`'${STANDINGS[after].name}'`)} 내려갔다`}.`, tone: 'warn' });
  };
  apply(id, n);
  if (n > 0 && !noRival) apply(f.rival, -Math.floor(n * RIVAL_RATE));
}

function josaWa(word) {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '과' : '와';
}

export function leanName(state) {
  let name = LEANS[0].name;
  for (const l of LEANS) if (state.lean >= l.at) name = l.name;
  return name;
}

/** 상태창이 그릴 것. 마주친 적 없는 세력은 이름만. */
export function factionView(state) {
  return FACTION_ORDER.map((id) => ({ id, name: FACTIONS[id].name, say: FACTIONS[id].say, rival: FACTIONS[FACTIONS[id].rival].name, pts: state.factions[id] || 0, standing: standingName(state, id), known: id in state.factions }));
}

/** 고르기 전에 보이는 결과 글 (T30): 세력, 성향, 보상. */
export function previewEffects(fx) {
  if (!fx) return '';
  const out = [];
  for (const [id, n] of fx.faction || []) {
    out.push(`${FACTIONS[id].name} ${n > 0 ? '오름' : '내림'}`);
    if (n > 0 && !fx.flat) out.push(`${FACTIONS[FACTIONS[id].rival].name} 내림`);
  }
  if (fx.lean) out.push(fx.lean > 0 ? '성향이 의로움 쪽으로' : '성향이 실리 쪽으로');
  if (fx.silver > 0) out.push(`은화 +${fx.silver}`);
  if (fx.silver < 0) out.push(`은화 ${fx.silver}`);
  if (fx.fame > 0) out.push('명성 오름');
  if (fx.fame < 0) out.push('명성 내림');
  if (fx.xp) out.push(`경험치 +${fx.xp}`);
  return [...new Set(out)].join(', ');
}
