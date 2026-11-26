// 누르기 돕기 (H2-5 ~ H2-8). 손이 불편한 사람도 끝까지 할 수 있게.
// 방법 셋: 끔 / 누르고 있기 / 한 번 눌러 이어 하기.
// 돕기는 손보다 느리다(1초에 한 번). 켰다는 표시는 저장 어디에도 남지 않는다: 이 값은 기기의 설정에만 있고,
// 규칙(dispatch)은 손으로 누른 것과 돕기가 누른 것을 구별하지 못한다.
// 화면 없이 테스트되도록 시계는 밖에서 준다.

export const ASSIST_MODES = ['off', 'hold', 'toggle'];
export const ASSIST_MS = 1000; // 1초에 한 번
export const ASSIST_PAUSE = 0; // 스무 번마다 멈추고 묻던 것은 없앴다 (사용자 요청, Z57). 다시 누르거나 띠링 창이 뜨거나 칸이 바뀌면 멈춘다

/**
 * @param {'off'|'hold'|'toggle'} mode
 * 돌려주는 것의 함수들은 모두 { fire, ask } 를 돌려준다. fire: 지금 그 칸을 한 번 눌러야 하는가. ask: 이어 할지 물어야 하는가.
 */
export function createAssist(mode = 'off') {
  if (!ASSIST_MODES.includes(mode)) throw new Error('모르는 누르기 돕기: ' + mode);
  const a = { mode, slot: -1, what: '', running: false, count: 0, last: 0, asking: false };
  const none = { fire: false, ask: false };
  const stop = () => { a.running = false; a.slot = -1; a.what = ''; a.count = 0; a.asking = false; return none; };

  return {
    get mode() { return a.mode; },
    get running() { return a.running; },
    get slot() { return a.slot; },
    get count() { return a.count; },
    get asking() { return a.asking; },

    /**
     * 칸을 눌렀다(키가 내려갔거나 손가락이 닿았다). what: 그 칸에 놓인 행동의 이름표(바뀌면 멈추려고).
     * 끔이면 그냥 한 번. 누르고 있기면 한 번 하고 이어 갈 채비. 한 번 눌러 이어 하기면 시작하거나, 돌던 것을 멈춘다.
     */
    down(slot, what, now) {
      if (a.mode === 'off') return { fire: true, ask: false };
      if (a.mode === 'toggle' && a.running) { stop(); return none; } // 다시 누르면 멈춘다(어느 칸이든)
      a.slot = slot; a.what = what; a.running = true; a.count = 1; a.last = now; a.asking = false;
      return { fire: true, ask: false };
    },

    /** 뗐다. 누르고 있기는 떼면 멈춘다. */
    up(slot) {
      if (a.mode === 'hold' && a.running && (slot === a.slot || slot == null)) stop();
      return none;
    },

    /**
     * 시계가 갔다. 1초가 지났으면 한 번 더 누른다.
     * what: 지금 그 칸에 놓인 행동(달라졌으면 멈춘다). blocked: 창이 떠 있다. dinged: 방금 창으로 뜨는 띠링이 왔다.
     */
    tick(now, { what, blocked = false, dinged = false } = {}) {
      if (!a.running || a.asking) return none;
      if (dinged || blocked || what !== a.what) return stop(); // 띠링이 뜨면 멈춘다. 상황이 바뀌어도 멈춘다 (H2-8)
      if (now - a.last < ASSIST_MS) return none;
      a.last = now; a.count += 1;
      return { fire: true, ask: false };
    },

    /** 스무 번 뒤의 물음에 답했다. */
    answer(goOn, now) {
      if (!a.asking) return none;
      if (!goOn) return stop();
      a.asking = false; a.last = now; a.count += 1;
      return { fire: true, ask: false };
    },

    stop,
  };
}

/** 그 칸에 놓인 것이 이어 누를 만한 행동인가: 창을 여는 칸, 꺼진 칸, 확인이 필요한 칸은 돕지 않는다. */
export function assistable(slot) {
  return !!slot && !!slot.action && !slot.disabled && !slot.open && !slot.confirm;
}
