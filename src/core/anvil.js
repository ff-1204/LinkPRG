// 처음 모루 (CM-A ~ CM-G): 벼리며 싸우기, 마지막 싸움 "지어지지 않은 종", 13장의 끝 다섯.
// 싸움에 걸리는 것은 battle.js가 여기 숫자와 함수를 불러 넣는다. 띠링의 규칙이 바뀌는 것은 log.js가 state.anvil.end를 본다.

import { placeById } from '../data/places.js?v=c4f04d2';
import { ANVIL, ANVIL_LINES, ANVIL_ENDS, ANVIL_END_ORDER, ANVIL_END_ALL, END_NEED, REGION_HIDDENS, MAIN13, kindCount } from '../data/anvil.js?v=c4f04d2';
import { itemDef } from '../data/items.js?v=c4f04d2';
import { monsterDef } from '../data/monsters.js?v=c4f04d2';
import { pushLine, ding } from './log.js?v=c4f04d2';
import { eulReul } from './ko.js?v=c4f04d2';

export { ANVIL, ANVIL_LINES, ANVIL_ENDS };

/**
 * 처음 모루의 칸. left: 내려올 때 모루 위에 남긴 종(다시 오르면 그 절반에서 시작한다, CM-D5). built: 종을 다 지었는가.
 * end: 새긴 끝(없으면 null). seen: 지금까지 본 끝들(삶을 넘어 남는다). tent: 야영지에 내 천막이 남았는가. follow: 뒤따라 오르는 가상 유저가 닿는 날.
 */
export const anvilFields = () => ({ anvil: { left: 0, built: false, end: null, endDay: 0, seen: [], tent: false, follow: 0 } });
const mine = (state) => state.anvil || (state.anvil = anvilFields().anvil);

/** 처음 모루에 있는가 (야영지의 방들과 사냥터 둘). */
export const inAnvil = (state) => placeById(state.place).band === ANVIL.band;
/** 벼리며 싸우는 곳에 서 있는가: 쇳물 골, 장인의 길, 모루 앞(모루 위의 싸움). */
export const forged = (state) => !!placeById(state.place).forge;
/** 대장 레벨. */
export const smithLv = (state) => state.craftLv?.smith?.lv || 1;
/** 망치질 한 번에 오르는 몫 (CM-B3, CM-D4): 대장 레벨이 33을 넘으면 둘. */
export const hammerGain = (state) => (smithLv(state) > ANVIL.smithAt ? 2 : 1);
/** 그 싸움의 벼림. */
export const temperOf = (b) => b?.temper || 0;
/** 벼림이 공격력에 곱하는 몫 (CM-B3): 하나마다 +4%. 벼리는 곳 밖에서는 1. */
export const temperMult = (state, b = state.battle) => (b && forged(state) ? 1 + ANVIL.temperRate * temperOf(b) : 1);
/** 지어지지 않은 종과의 싸움인가. */
export const building = (b) => !!b && b.bell != null;
/** 식은 껍질이 남아 있는가 (CM-D3). */
export const shelled = (b) => building(b) && b.hp > 0;

/**
 * 싸우는 틈의 망치질 (CM-B1, CM-D1). 한 턴에 한 번이다. 든 무기를 벼리고, 모루 위에서는 종도 짓는다.
 * 껍질이 남아 있으면 종은 절반만 먹는다(두 번에 +1). 껍질을 다 깬 동안에는 두 배로 먹는다(한 번에 +2, M23-3).
 */
export function hammerInBattle(state, events, b) {
  if (!forged(state)) throw new Error('여기서는 벼릴 수 없습니다');
  const gain = hammerGain(state);
  const was = temperOf(b);
  b.temper = Math.min(ANVIL.temperMax, was + gain);
  delete b.cooled;
  const w = state.equip?.weapon;
  const name = w ? eulReul(itemDef(w.id).name) : '맨주먹을';
  if (building(b)) {
    const before = b.bell;
    b.bellx = Math.min(ANVIL.bell * 2, (b.bellx || 0) + (shelled(b) ? gain : gain * 2 * ANVIL.openMult)); // bellx는 절반 단위다
    b.bell = Math.floor(b.bellx / 2);
    pushLine(state, events, { k: 'me', text: shelled(b) ? ANVIL_LINES.buildHalf(b.bell) : ANVIL_LINES.build(b.bell) });
    if (b.temper > was) pushLine(state, events, { k: 'sys', text: `벼림 ${b.temper}.` });
    events.push({ type: 'bell', n: b.bell, was: before });
  } else if (b.temper > was) pushLine(state, events, { k: 'me', text: ANVIL_LINES.temper(name, b.temper) });
  else pushLine(state, events, { k: 'me', text: ANVIL_LINES.full });
  events.push({ type: 'temper', n: b.temper });
}
/** 큰 공격을 막지 못하고 맞았다 (CM-B3, CM-D5): 벼림이 절반이 되고, 모루 위에서는 종이 다섯 줄어든다. */
export function cooled(state, events, b) {
  if (!forged(state)) return;
  if (temperOf(b) > 0) {
    b.temper = Math.floor(b.temper / 2);
    b.cooled = true;
    pushLine(state, events, { k: 'sys', text: `${ANVIL_LINES.cooled} 벼림 ${b.temper}.`, tone: 'frost' });
  }
  if (building(b) && b.bell > 0) {
    const lost = Math.min(ANVIL.cool, b.bell);
    b.bellx = Math.max(0, (b.bellx || 0) - ANVIL.cool * 2);
    b.bell = Math.floor(b.bellx / 2);
    pushLine(state, events, { k: 'sys', text: ANVIL_LINES.lostBell(lost), tone: 'frost' });
  }
}
/** 벼림 열둘로 이긴 싸움 (CM-B3): 든 무기의 내구도가 닳지 않고, 따로 세어진다(어디에도 내보내지 않는다). */
export function keptEdge(state, events, b) {
  if (!forged(state) || temperOf(b) < ANVIL.temperMax) return;
  const w = state.equip?.weapon;
  if (w && b.wid === w.id && Number.isFinite(b.wdur) && w.dur < b.wdur) w.dur = b.wdur;
  state.counters.fullTemper = (state.counters.fullTemper || 0) + 1;
  pushLine(state, events, { k: 'sys', text: ANVIL_LINES.kept, tone: 'mint' });
}
/** 다섯 턴마다 큰 공격 (CM-D5). 그 사이는 틈이다. */
export const bellIntent = (b) => (b.turn % ANVIL.every === 0 ? 'charge' : 'seethe');
/** 껍질을 다 깼다 (CM-D2, CM-D3): 쓰러지지 않는다. 열 턴 동안 망치질이 두 배로 먹는다 (M23-3). */
export function shellBroke(state, events, b) {
  if (b.open > 0) return;
  b.hp = 0;
  b.open = ANVIL.reharden + 1; // 깬 턴의 끝에 하나가 줄어, 그 뒤로 꼭 열 턴이다
  pushLine(state, events, { k: 'room', text: ANVIL_LINES.broke });
  events.push({ type: 'shell', open: true });
}
/** 턴이 끝날 때: 깨진 껍질은 열 턴 뒤 다시 굳는다 (CM-D3). */
export function bellRound(state, events, b, fullHp) {
  if (!building(b) || !(b.open > 0)) return;
  b.open -= 1;
  if (b.open > 0) return;
  b.hp = fullHp;
  pushLine(state, events, { k: 'room', text: ANVIL_LINES.hard });
  events.push({ type: 'shell', open: false });
}
/** 싸움을 끝내지 못하고 내려왔다(쓰러졌거나 물러났다): 다시 오르면 채운 것의 절반에서 시작한다 (CM-D5). */
export function leftBell(state, b) {
  if (building(b)) mine(state).left = b.bell;
}
/** 다섯째 칸과 이름표 (CM-B1, CM-B2, CM-D1). 벼리는 곳의 싸움 중에만 있다. 그 밖에서는 null: 칸이 생기지 않는다. */
export function temperView(state) {
  const b = state.battle;
  if (!b || !forged(state)) return null;
  const n = temperOf(b), pct = Math.round(n * ANVIL.temperRate * 100);
  const tags = [];
  if (n > 0) tags.push(ANVIL_LINES.tag(n, pct));
  if (b.cooled) tags.push(ANVIL_LINES.coolTag);
  const bell = building(b) ? { n: b.bell, max: ANVIL.bell, shell: shelled(b), open: b.open > 0 ? Math.min(ANVIL.reharden, b.open) : 0 } : null;
  if (bell) tags.unshift(bell.shell ? ANVIL_LINES.shellTag : ANVIL_LINES.openTag(bell.open));
  return { n, max: ANVIL.temperMax, pct, gain: hammerGain(state), tags, bell };
}

// ── 13장 두 번째 약속 (CM-D) ──
const chapterIs13 = (state) => state.main?.chapter === 13;
/** 망치를 들 수 있는가 (CM-G2): 13장이고, 모루 앞이고, 레벨 95부터. 종을 다 지은 뒤에는 들 것이 없다. */
export const canLift = (state) => chapterIs13(state) && state.place === ANVIL.front && !state.dungeon && state.level >= ANVIL.liftLevel && !mine(state).built;
/** 망치를 든다: 마지막 싸움이 시작된다. 시작하는 종의 값을 돌려준다(싸움은 game.js가 건다). */
export function liftHammer(state, events) {
  if (!chapterIs13(state) || state.place !== ANVIL.front || state.dungeon) throw new Error('망치는 모루 앞에 있습니다');
  if (state.level < ANVIL.liftLevel) throw new Error(ANVIL_LINES.notYet);
  if (mine(state).built) throw new Error('종은 이미 다 지었습니다');
  const start = Math.floor((mine(state).left || 0) / 2);
  state.flags.sawBell = true;
  pushLine(state, events, { k: 'me', text: ANVIL_LINES.lift });
  if (start > 0) pushLine(state, events, { k: 'sys', text: ANVIL_LINES.again(start) });
  return start;
}
/** 종을 다 지었다 (CM-D2). 끝을 고르는 것은 그다음이다. */
export function bellBuilt(state, events) {
  const a = mine(state);
  a.built = true; a.left = 0;
  pushLine(state, events, { k: 'room', text: ANVIL_LINES.done });
  events.push({ type: 'bellbuilt' });
}
/** 숨은 끝의 조건 (CM-H4): 일곱 지역의 히든 퀘스트를 모두 풀었다. 선택지에 없고, 어디에도 내보내지 않는다. */
export const hiddenAnvilEnd = (state) => REGION_HIDDENS.every((id) => state.hq?.[id]?.status === 'done');
/** 끝마다 고를 수 있는지 (CM-D6). 까닭은 내보내지 않는다 (CM-G3). */
export function anvilEndChoices(state) {
  const n = kindCount(state);
  return ANVIL_END_ORDER.map((id) => {
    const e = ANVIL_ENDS[id];
    // 1부에서 "서로 답한다"를 본 사람은 "나누어 건다"를 조건 없이 고른다 (CM-D9)
    const can = !e.need || n[e.need] >= END_NEED || (id === 'share' && state.ending === 'hidden');
    return { id, can };
  });
}
/** 정을 쥔다 (CM-D7): 숨은 끝의 조건을 채웠으면 고르지 않고 그 끝이 된다. */
export function openCarve(state, events) {
  const a = mine(state);
  if (!chapterIs13(state) || !a.built || a.end) throw new Error('아직 새길 때가 아닙니다');
  if (state.place !== ANVIL.front || state.dungeon) throw new Error('종은 모루 위에 있습니다');
  pushLine(state, events, { k: 'room', text: ANVIL_LINES.carve[0] });
  if (hiddenAnvilEnd(state)) return 'eight';
  pushLine(state, events, { k: 'sys', text: ANVIL_LINES.carve[1] });
  state.choice = { kind: 'anvilend' };
  events.push({ type: 'choice' });
  return null;
}
/** 끝을 고르는 창 (CM-D7, CM-G3): 고를 수 없는 끝은 "???"다. 숨은 끝은 "???"로도 보이지 않는다. */
export function anvilChoiceView(state) {
  return {
    kind: 'anvilend', title: MAIN13.name, side: '종이 다 지어졌다',
    text: `${ANVIL_LINES.carve[0]} ${ANVIL_LINES.carve[1]}`,
    note: '어느 쪽도 틀린 답이 아니다. 끝난 뒤에도 세계는 이어진다.',
    options: [
      ...anvilEndChoices(state).map((c) => (c.can ? { id: c.id, label: ANVIL_ENDS[c.id].name, sub: ANVIL_ENDS[c.id].sub } : { id: c.id, label: '???', sub: '고를 수 없다', disabled: true, why: '' })),
      { id: 'back', label: '아직 새기지 않는다' },
    ],
  };
}
/** 끝이 정해졌다. 한 번 새기면 고칠 수 없다. */
export function applyAnvilEnd(state, events, id) {
  const e = ANVIL_ENDS[id], a = mine(state);
  if (!e) throw new Error('모르는 끝입니다');
  if (a.end) throw new Error('이미 새겼습니다');
  if (!chapterIs13(state) || !a.built) throw new Error('아직 새길 때가 아닙니다');
  if (e.hidden ? !hiddenAnvilEnd(state) : !anvilEndChoices(state).find((c) => c.id === id)?.can) throw new Error('고를 수 없는 끝입니다');
  state.choice = null;
  pushLine(state, events, { k: 'room', text: e.say });
  // 이 띠링까지는 지금까지의 규칙으로 울린다. 그 뒤로는 새긴 끝의 규칙을 따른다 (CM-D9)
  ding(state, events, { level: 4, kind: 'ending', title: `끝: ${e.name}`, big: e.name, body: e.after });
  a.end = id; a.endDay = state.day;
  if (!a.seen.includes(id)) a.seen.push(id);
  if (id === 'descend') { a.tent = true; a.follow = state.day + ANVIL.follow; }
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${e.say.split('. ')[0]}. 그리고 다음 날이 왔다.`, note: `끝: ${e.name}` });
  events.push({ type: 'ending2', id });
}
/** 선택 창에서 고른 것. */
export function chooseAnvilEnd(state, events, id) {
  if (id === 'back') { state.choice = null; pushLine(state, events, { k: 'me', text: ANVIL_LINES.wait }); return; }
  if (!ANVIL_END_ORDER.includes(id)) throw new Error('고를 수 없는 끝입니다');
  applyAnvilEnd(state, events, id);
}
/** 새긴 끝이 바꾼 세계를 한 줄로 (퀘스트 창이 쓴다). */
export const anvilAfterText = (state) => (state.anvil?.end ? ANVIL_ENDS[state.anvil.end].after : '');
/** 본 끝의 수와 모두 (CM-E): 삶을 넘어 남는다. */
export const endsSeen = (state) => ({ have: (state.anvil?.seen || []).filter((id) => ANVIL_END_ALL.includes(id)).length, all: ANVIL_END_ALL.length });

/** 13장의 할 일 셋 (CM-D): 퀘스트 창에 푸는 길 대신 보인다. 끝들의 이름은 여기 나오지 않는다. */
export function stepsView(state) {
  const a = state.anvil || {};
  const fighting = building(state.battle);
  return MAIN13.steps.map((s) => {
    const done = s.id === 'lift' ? !!a.built || fighting : s.id === 'build' ? !!a.built : !!a.end;
    const have = s.id === 'build' && !a.built ? (fighting ? state.battle.bell : Math.floor((a.left || 0) / 2)) : done ? 1 : 0;
    const need = s.id === 'build' && !a.built ? ANVIL.bell : 1;
    const closed = s.id === 'lift' && !done && state.level < ANVIL.liftLevel ? `레벨 ${ANVIL.liftLevel}부터` : '';
    return { id: s.id, name: s.name, text: s.text, have, need, closed, ratio: closed ? -1 : have / need, step: true };
  });
}
/** 모루 앞의 칸 (CM-A5, CM-G2): 레벨 95부터 "망치를 든다", 종을 다 지은 뒤 새기지 않았으면 "새긴다". 그 전에는 어디에도 없다. */
export function anvilSlots(state) {
  if (state.dungeon || state.place !== ANVIL.front || !chapterIs13(state)) return [];
  const a = state.anvil || {};
  if (a.built && !a.end) return [{ label: '새긴다', sub: '종이 다 지어졌다', action: { type: 'carve' } }];
  if (canLift(state)) { const start = Math.floor((a.left || 0) / 2); return [{ label: '망치를 든다', ...(start > 0 ? { sub: `종 ${start}에서` } : {}), action: { type: 'lifthammer' } }]; }
  return [];
}
/** 지어지지 않은 종의 온 생명력(식은 껍질). */
export const shellHp = (b, mdef) => mdef(b).hp;
export const isBuildMon = (id) => !!monsterDef(id).build;
