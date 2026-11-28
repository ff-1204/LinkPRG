// 주 스탯과 스탯 다시 찍기 (Z116, 사용자 요청).
// - 직업의 주 스탯 10마다 내가 넣는 피해 +2%. 사제는 지혜와 행운 둘 다: 지혜 10마다 +1%(Z117), 행운 1마다 +1%. 피해와 치유에 붙는다.
// - 직업을 고른 그때 한 번, 레벨로 받은 점수를 돌려받아 다시 나눈다. 처음 값(주사위)과 일로 오른 값, 히든 스탯은 그대로다.
// - 사제는 행운(히든 스탯)이 1 이상이어야 고른다. 고르면 행운 +10과 "신의 은총"(희귀한 일을 절반의 확률로 한 번 더 센다).

import { DICE_MIN, DICE_TOTAL, originById } from '../data/origins.js?v=333e2f8';

/** 직업의 인연 (Z120): 출신이 이어진 직업을 골랐으면 그 효과(fx), 아니면 null. 2차 직업도 같은 뿌리 직업으로 본다. */
export function bondFx(state) {
  const o = originById(state.origin);
  return o?.bond && o.job && o.job === state.job ? o.bond.fx : null;
}
import { pushLine } from './log.js?v=333e2f8';

export const STATS = ['str', 'agi', 'con', 'wis'];
export const MAIN = { every: 10, rate: 2, priestRate: 1, luck: 1 }; // 주 스탯 10마다 +2%(사제의 지혜는 +1%, Z117), 사제의 행운 1마다 +1%
export const PRIEST_LUCK = 10; // 사제를 고르면 더해지는 행운
export const GRACE_AGAIN = 0.5; // 신의 은총: 희귀한 일을 한 번 더 셀 확률
export const HEAL_LUCK = { per: 0.03, max: 0.9, mult: 1.5 }; // 사제의 큰 치유와 한 번 더 막는 가호
export const GRACE_BUFF = { kind: '은총', name: '신의 은총', text: '사제인 동안. 희귀한 일을 겪을 때 절반의 확률로 한 번 더 겪은 것으로 센다. 행운이 더 빨리 오른다.' };

const isPriest = (state) => state.job === 'priest';
/** 찾은 행운(히든 스탯)만. 사제를 고르는 조건은 이것으로 본다. */
export const foundLuck = (state) => state.hidden?.luck?.value || 0;
/** 쓰이는 행운: 찾은 것에 사제의 몫을 더한다. 저장에는 찾은 것만 있다(다시 태어나면 사제의 몫은 직업과 함께 내려놓는다). */
export const luckOf = (state) => foundLuck(state) + (isPriest(state) ? PRIEST_LUCK : 0);
export const hasGrace = (state) => isPriest(state);
/** 사제를 고를 수 있는가. */
export const priestOpen = (state) => foundLuck(state) >= 1;

/** 이 직업의 주 스탯. 히든 직업은 그 직업이 쓰는 스탯을 따른다(무명객은 가장 높은 것, 손빛은 싸우지 않아 없다). */
export function mainStatsOf(state) {
  const j = state.job;
  if (j === 'warrior' || j === 'oneway') return ['str'];
  if (j === 'archer' || j === 'rogue') return ['agi'];
  if (j === 'mage') return ['wis'];
  if (j === 'priest') return ['wis', 'luck'];
  if (j === 'nameless') return [['str', 'agi', 'wis'].reduce((a, k) => ((state.stats[k] || 0) > (state.stats[a] || 0) ? k : a), 'str')];
  return [];
}

/** 주 스탯 보너스 한 줄씩: 값, 보너스(%), 다음 단계까지 남은 점수. */
export function mainParts(state, stats = state.stats) {
  return mainStatsOf(state).map((key) => {
    if (key === 'luck') { const v = luckOf(state); return { key, value: v, pct: v * MAIN.luck, next: 0 }; }
    const v = stats[key] || 0;
    const rate = isPriest(state) ? MAIN.priestRate : bondFx(state)?.mainRate || MAIN.rate; // 방패잡이의 후예: 힘 10마다 +3% (Z120)
    return { key, value: v, pct: Math.floor(v / MAIN.every) * rate, next: MAIN.every - (v % MAIN.every) };
  });
}
/** 내가 넣는 피해(사제는 치유도)에 곱하는 수. */
export const mainMult = (state) => mainParts(state).reduce((m, p) => m * (1 + p.pct / 100), 1);
/** 사제의 큰 치유·한 번 더 막는 가호 확률. */
export const healLuck = (state) => (isPriest(state) ? Math.min(HEAL_LUCK.max, luckOf(state) * HEAL_LUCK.per) : 0);

// ── 다시 찍기 ──

/** 레벨로 받아 찍은 점수의 자리. 없던 저장은 지금 스탯에서 짐작한다(합은 정확하고, 스탯마다 나눈 것은 짐작이다). */
export function guessLvPts(state) {
  const o = originById(state.origin)?.stats || {};
  const extra = (k) => (state.toilGained?.[k] || 0) + (state.toughGained?.[k] || 0);
  const cur = Object.fromEntries(STATS.map((k) => [k, Math.max(0, (state.stats?.[k] || 0) - extra(k))]));
  const floor = Object.fromEntries(STATS.map((k) => [k, DICE_MIN + (o[k] || 0)]));
  const base = DICE_TOTAL + STATS.reduce((a, k) => a + (o[k] || 0), 0);
  const total = Math.max(0, STATS.reduce((a, k) => a + cur[k], 0) - base);
  const room = Object.fromEntries(STATS.map((k) => [k, Math.max(0, cur[k] - floor[k])]));
  const roomSum = STATS.reduce((a, k) => a + room[k], 0);
  const out = Object.fromEntries(STATS.map((k) => [k, 0]));
  if (!total || !roomSum) return out;
  let left = Math.min(total, roomSum);
  for (const k of STATS) { out[k] = Math.min(room[k], Math.floor((room[k] * left) / roomSum)); }
  left -= STATS.reduce((a, k) => a + out[k], 0);
  for (const k of [...STATS].sort((a, b) => room[b] - out[b] - (room[a] - out[a]))) { if (left <= 0) break; if (out[k] < room[k]) { out[k] += 1; left -= 1; } }
  return out;
}

/** 다시 찍기 창이 그릴 것. */
export function respecView(state) {
  const lv = state.lvPts || Object.fromEntries(STATS.map((k) => [k, 0]));
  const pool = STATS.reduce((a, k) => a + (lv[k] || 0), 0) + (state.unspent || 0);
  const floor = Object.fromEntries(STATS.map((k) => [k, (state.stats[k] || 0) - (lv[k] || 0)]));
  return { open: state.respec === 'open', pool, floor, lv: { ...lv }, main: mainStatsOf(state) };
}

/** 한 번 다시 찍는다. alloc: 스탯마다 넣을 점수(합이 돌려받은 점수와 같아야 한다). keep: 전에 찍은 대로 둔다. */
export function respec(state, events, action, maxOf) {
  if (state.respec !== 'open') throw new Error('지금은 스탯을 다시 찍을 수 없습니다');
  if (state.battle || state.choice) throw new Error('지금은 할 수 없습니다');
  if (action.keep) {
    state.respec = 'done';
    pushLine(state, events, { k: 'me', text: '찍어 둔 그대로 가기로 했다.' });
    events.push({ type: 'stat' });
    return;
  }
  const v = respecView(state);
  const a = action.alloc || {};
  if (!STATS.every((k) => Number.isInteger(a[k] ?? 0) && (a[k] ?? 0) >= 0)) throw new Error('점수는 0 이상의 정수여야 합니다');
  const sum = STATS.reduce((s, k) => s + (a[k] || 0), 0);
  if (sum !== v.pool) throw new Error(`돌려받은 점수 ${v.pool}을 모두 나눠야 합니다 (나눈 점수 ${sum})`);
  for (const k of STATS) state.stats[k] = v.floor[k] + (a[k] || 0);
  state.lvPts = Object.fromEntries(STATS.map((k) => [k, a[k] || 0]));
  state.unspent = 0;
  state.respec = 'done';
  // 생명력과 마나는 새 한도를 넘지 않게 한다
  if (maxOf) { state.hp = Math.max(1, Math.min(state.hp, maxOf('maxHp'))); state.mp = Math.max(0, Math.min(state.mp, maxOf('maxMp'))); }
  pushLine(state, events, { k: 'sys', tone: 'good', text: `스탯을 다시 찍었다. ${STATS.map((k) => `${{ str: '힘', agi: '민첩', con: '체력', wis: '지혜' }[k]} ${state.stats[k]}`).join(', ')}.` });
  events.push({ type: 'stat' });
}
