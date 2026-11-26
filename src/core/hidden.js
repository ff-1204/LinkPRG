// 히든 스탯 열두 개 (Q5, Q6). 문턱은 화면에 보이지 않는다.
// 찾기 전에도 횟수는 처음부터 쌓이고, 절반에서 "무언가 쌓이고 있다"가 뜬다.

/** 생긴 뒤의 값: 문턱을 넘을 때마다 1씩, 갈수록 더 많이 해야 오른다. */
function stepped(count, first, gapStart, gapGrow) {
  let value = 0;
  let need = first;
  let gap = gapStart;
  while (count >= need) {
    value += 1;
    need += gap;
    gap += gapGrow;
  }
  return value;
}

/** 도감에 적힌 칸 수(사람·괴물·물건·곳·짐승·요리). */
const dexCount = (s) => (s.counters.npcs || []).length + Object.values(s.dex || {}).reduce((n, v) => n + (v && typeof v === 'object' ? Object.keys(v).length : 0), 0);
const maxAct = (s) => Math.max(0, ...Object.values(s.counters.act));

export const HIDDEN = [
  { id: 'endure', name: '인내', effect: '같은 일을 거듭할 때 숙련도 +1%, 지치는 속도가 줄어든다', how: '같은 일을 오래 한다', count: maxAct, first: 300, gap: [200, 100] },
  { id: 'grit', name: '근성', effect: '죽음의 그림자와 굶주림의 벌 −5%', how: '굶주린 채 일하며 버틴다', count: (s) => s.counters.hungryDays, first: 3, gap: [3, 1] },
  { id: 'vigil', name: '집념', effect: '피로가 3% 더디게 쌓인다', how: '지친 채 일한다', count: (s) => s.counters.tiredWork || 0, first: 100, gap: [100, 50] },
  { id: 'fight', name: '투지', effect: '생명력 30% 아래에서 공격력 +2%', how: '죽을 고비를 넘긴다', count: (s) => s.counters.nearDeath, first: 5, gap: [5, 2] },
  { id: 'craft', name: '손재주', effect: '제작에서 높은 등급이 뜰 확률 +1%', how: '만든다. 높은 등급일수록 많이', count: (s) => s.counters.crafts, first: 50, gap: [40, 20] },
  { id: 'art', name: '예술', effect: '작품의 높은 등급이 잘 나온다. 작품에 생명을 불어넣을 수 있다', how: '작품을 만든다', count: (s) => s.counters.works, first: 10, gap: [8, 4] },
  { id: 'charm', name: '매력', effect: '설득 판정에 쓰인다. 선물 효과 +2%', how: '여러 사람과 말을 섞는다', count: (s) => s.counters.npcs.length, first: 12, gap: [4, 2] },
  { id: 'insight', name: '통찰', effect: '적의 약점과 사람의 속이 미리 보일 확률 +3%', how: '감정하고 기록한다', count: (s) => Math.max(s.counters.appraise, Math.floor(dexCount(s) * 0.6)), first: 30, gap: [20, 10] },
  { id: 'nerve', name: '담력', effect: '공포에 덜 걸린다. 위협 판정 +1%', how: '나보다 센 적을 이긴다', count: (s) => s.counters.bigWins, first: 10, gap: [8, 4] },
  { id: 'stealth', name: '은신', effect: '기척 겨루기 +2%, 먼저 덮칠 때 피해 +2%', how: '숨어서 지켜본다', count: (s) => s.counters.watch, first: 30, gap: [20, 10] },
  { id: 'luck', name: '행운', effect: '희귀한 일이 일어날 확률 +0.2%p', how: '희귀한 일을 겪는다', count: (s) => s.counters.rare, first: 10, gap: [10, 5] },
  { id: 'faith', name: '신앙', effect: '치유 +2%, 기도로 그림자가 빨리 걷힌다', how: '바치고 보내 준다', count: (s) => Math.min(s.counters.offer, s.counters.sendoff * 2), first: 10, gap: [10, 5] },
  { id: 'kind', name: '친화', effect: '짐승이 덜 덤빈다. 10부터 길들인다', how: '짐승을 해치지 않는다', count: (s) => s.counters.kind, first: 20, gap: [15, 5] },
  // 잇는다 뒤에만 생긴다: 새 종은 전에 답하지 못하던 것에도 답한다 (M11-2)
  { id: 'echo', name: '울림', after: 'mend', effect: '띠링을 들을 때마다 조금씩 쌓인다. 모든 숙련도 오름 +1%', how: '끝까지 해내고, 그 답을 듣는다', count: (s) => Math.max(0, s.dings.length - (s.dingsAtEnd || 0)), first: 20, gap: [20, 10] },
];

export const HIDDEN_TOTAL = HIDDEN.filter((h) => !h.after).length;
const live = (state) => HIDDEN.filter((h) => !h.after || state.ending === h.after);
/** 지금 세계에 있는 히든 스탯의 수(잇는다 뒤에는 하나 늘어난다). */
export const hiddenTotal = (state) => live(state).length;

export function emptyCounters() {
  return { act: {}, tiredWork: 0, hungryDays: 0, nearDeath: 0, crafts: 0, works: 0, npcs: [], appraise: 0, bigWins: 0, watch: 0, rare: 0, offer: 0, sendoff: 0, kind: 0 };
}

export function hiddenById(id) {
  return HIDDEN.find((h) => h.id === id);
}

/** 지금 횟수로 계산한 값(아직 안 생겼으면 0). */
/** 지난 삶에서 쌓은 횟수까지 더한 것 (Z32: 종이 기억한다). */
export function countOf(def, state) {
  return def.count(state) + (state.pastHidden?.[def.id] || 0);
}
export function valueOf(def, state) {
  return stepped(countOf(def, state), def.first, def.gap[0], def.gap[1]);
}

/** 문턱까지 얼마나 왔는지 0~1. 화면에는 숫자로 보이지 않는다. */
export function progressOf(def, state) {
  return Math.min(1, countOf(def, state) / def.first);
}

/**
 * 횟수가 바뀐 뒤에 부른다. state.hidden을 고치고 일어난 일을 돌려준다.
 * @returns {Array<{type:'half'|'found'|'grew', id:string, name:string, value?:number}>}
 */
export function checkHidden(state) {
  const out = [];
  for (const def of live(state)) {
    const slot = state.hidden[def.id] || (state.hidden[def.id] = { value: 0, half: false });
    const value = valueOf(def, state);
    if (value > slot.value) {
      const found = slot.value === 0;
      slot.value = value;
      slot.half = true;
      out.push({ type: found ? 'found' : 'grew', id: def.id, name: def.name, value });
    } else if (!slot.half && progressOf(def, state) >= 0.5) {
      slot.half = true;
      out.push({ type: 'half', id: def.id, name: def.name });
    }
  }
  return out;
}

/** 찾은 히든 스탯 수. */
export function foundCount(state) {
  return live(state).filter((h) => (state.hidden[h.id]?.value || 0) > 0).length;
}

/** 화면에 보일 칸. 문턱 숫자는 넣지 않는다. */
export function hiddenSlots(state) {
  // 푼다 뒤에는 숨어 있던 것들의 이름과 문턱이 모두 보인다 (M11-3). 그 전에는 절대 내보내지 않는다
  const open = state.ending === 'free';
  return live(state).map((def) => {
    const slot = state.hidden[def.id] || { value: 0, half: false };
    const hints = state.hints[def.id] || [];
    if (open && !(slot.value > 0)) return { id: def.id, found: false, half: slot.half, hints, open: true, name: def.name, effect: def.effect, how: def.how, need: def.first, have: Math.min(def.first, def.count(state)) };
    if (slot.value > 0) return { id: def.id, found: true, name: def.name, value: slot.value, effect: def.effect, how: def.how, hints };
    return { id: def.id, found: false, half: slot.half, hints };
  });
}
