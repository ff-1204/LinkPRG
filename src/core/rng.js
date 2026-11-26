// 씨앗이 같으면 결과가 같은 난수. 상태(state.rng)에 숫자 하나만 들고 다닌다.

/** 글자 씨앗을 32비트 숫자로 바꾼다. */
export function seedFrom(text) {
  let h = 2166136261 >>> 0;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

/** 0 이상 1 미만의 수를 하나 뽑고 state.rng를 다음 값으로 옮긴다. */
export function next(state) {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** 0 이상 n 미만의 정수. */
export function int(state, n) {
  return Math.floor(next(state) * n);
}

/** 목록에서 하나. */
export function pick(state, list) {
  return list[int(state, list.length)];
}

/** 확률 p로 참. */
export function chance(state, p) {
  return next(state) < p;
}
