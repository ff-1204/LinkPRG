// 누르기 규칙. 한 번 누르면 한 번. 꾹 누르고 있어도 한 번만 (사용자 결정, 2026-11-26).
// 운영체제가 보내는 키 반복(repeat)을 걸러 낸다. 화면 없이 테스트된다.

/**
 * 키 누름을 "눌렀다 뗀 한 번"으로 바꿔 주는 문지기.
 * 열쇠는 글자(key)가 아니라 자리(code)로 쓴다. Shift를 같이 눌러도 같은 키로 본다.
 */
export function createPressGuard() {
  const held = new Set();
  return {
    /** 키가 내려갔다. 처음 내려간 것이면 true. 누르고 있어서 되풀이된 것이면 false. */
    down(code, repeat = false) {
      if (repeat || held.has(code)) return false;
      held.add(code);
      return true;
    },
    /** 키가 올라왔다. */
    up(code) {
      held.delete(code);
    },
    /** 창이 바뀌거나 초점을 잃으면 모두 뗀 것으로 본다. */
    reset() {
      held.clear();
    },
    isHeld(code) {
      return held.has(code);
    },
  };
}

/** 단추 자리(code)가 단축 칸 숫자 키인지. Digit1~5, Numpad1~5 → 0~4, 아니면 -1. */
export function slotIndex(code) {
  const m = /^(?:Digit|Numpad)([1-5])$/.exec(String(code));
  return m ? Number(m[1]) - 1 : -1;
}

/**
 * 키가 내려왔을 때 무엇을 할지 정한다. 화면은 이 결과만 따른다.
 * @param guard createPressGuard()
 * @param {{code:string,key:string,repeat:boolean,onButton:boolean,onInput:boolean,windowOpen:boolean,modifier:boolean,inGame:boolean}} e
 * @returns {{prevent:boolean, slot:number}} prevent: 브라우저의 기본 동작을 막을지. slot: 누를 단축 칸(없으면 -1)
 */
export function keyDecision(guard, e) {
  // 단추 위에서 Enter나 Space를 누르고 있으면 브라우저가 클릭을 되풀이한다. 어느 단추든 막는다.
  if (e.repeat && (e.key === 'Enter' || e.key === ' ') && e.onButton) return { prevent: true, slot: -1 };
  if (!e.inGame || e.windowOpen || e.onInput || e.modifier) return { prevent: false, slot: -1 };
  const i = slotIndex(e.code);
  if (i < 0) return { prevent: false, slot: -1 };
  return { prevent: true, slot: guard.down(e.code, e.repeat) ? i : -1 };
}
