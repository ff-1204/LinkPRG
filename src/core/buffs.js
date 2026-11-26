// 지금 붙어 있는 힘: 감상 버프 하나와 음식 버프 하나 (N2-2, N3-5). 때가 지나면 사라진다.

const live = (state, b) => !!b && !(state.day > b.until.day || (state.day === b.until.day && state.phase >= b.until.phase));

export function buffOf(state) {
  const b = state.buffs?.admire;
  return live(state, b) ? b : null;
}

export function foodBuff(state) {
  const b = state.buffs?.food;
  return live(state, b) ? b : null;
}

/** 숙련도가 얼마나 더 오르는지(곱). */
export function xpBoost(state) {
  return 1 + (buffOf(state)?.xp || 0) + (foodBuff(state)?.xp || 0);
}

/** 상태창의 "지금 걸린 것"에 보일 줄 (M6-3). */
export function buffRows(state) {
  const out = [];
  for (const [kind, b] of [['감상', buffOf(state)], ['음식', foodBuff(state)]]) {
    if (b) out.push({ kind, name: b.name, text: b.text, until: b.until });
  }
  return out;
}
