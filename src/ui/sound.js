// 띠링 소리. 귀한 정도 다섯마다 다르다 (D3, M1-10). 파일 없이 브라우저가 만든다.

let ctx = null;

const TUNES = {
  1: [880],
  2: [880, 1175],
  3: [784, 988, 1319],
  4: [659, 831, 988, 1319],
  5: [659, 831, 988, 1319, 1661],
};
const VOLUME = [0, 0.04, 0.09, 0.16];

/** 귀한 정도(1~5)와 소리 크기(0~3)로 종소리를 낸다. 소리를 못 내도 게임은 이어진다. */
export function playDing(level, volume) {
  if (!volume) return false;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return false;
  try {
    ctx = ctx || new Audio();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = TUNES[Math.max(1, Math.min(5, level))];
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(VOLUME[volume], t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + level * 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6 + level * 0.08);
    });
    return true;
  } catch {
    return false;
  }
}

/** 귀한 정도마다 음의 수가 다르다는 것을 테스트가 볼 수 있게. */
export function tuneOf(level) {
  return TUNES[Math.max(1, Math.min(5, level))].slice();
}
