// 한국어 조사 붙이기. "인내가", "손재주가", "훈련소로", "광장으로".

function lastJong(word) {
  const s = String(word).replace(/['"’”)\]\s]+$/u, '');
  const code = s.codePointAt(s.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  const last = s[s.length - 1];
  if (/[0-9]/.test(last)) return '013678'.includes(last) ? 1 : 0; // 영, 일, 삼, 육, 칠, 팔
  return 0;
}

/** 받침이 있으면 withJong, 없으면 without을 붙인다. */
export function josa(word, withJong, without) {
  return `${word}${lastJong(word) ? withJong : without}`;
}

export const iGa = (w) => josa(w, '이', '가');
export const eulReul = (w) => josa(w, '을', '를');
export const eunNeun = (w) => josa(w, '은', '는');

/** "로/으로". ㄹ 받침은 "로". */
export function ro(word) {
  const j = lastJong(word);
  return `${word}${j && j !== 8 ? '으로' : '로'}`;
}

/** 와/과 */
export const waGwa = (w) => josa(w, '과', '와');
