// 구글 드라이브와 이 기기의 저장 칸을 맞추는 규칙 (Z44). 화면도 네트워크도 모른다.
// 되감는 저장은 없다(지키는 것 3): 칸마다 저장 횟수(rev)가 더 큰 쪽만 쓴다. 옛 판을 골라 받는 길은 없다.

/**
 * @param {Array<{slot:number, rev:number}>} local  이 기기의 칸. 비었으면 rev 0, 읽을 수 없으면 -1
 * @param {Record<number, {rev:number}>} remote     드라이브의 칸
 * @returns {Array<{slot:number, act:'upload'|'take'|'offer'|'same'|'none'}>}
 *   upload: 이 기기가 더 나중이다. 올린다
 *   take:   드라이브가 더 나중이다. 받아서 이 기기를 덮는다
 *   offer:  이 기기는 비었고 드라이브에만 있다. "드라이브에서 받기"를 보인다
 *   same:   같다
 *   none:   둘 다 없다(또는 이 기기의 칸을 읽을 수 없어 건드리지 않는다)
 */
export function syncPlan(local, remote) {
  return local.map(({ slot, rev }) => {
    const r = remote[slot]?.rev || 0;
    if (rev < 0) return { slot, act: 'none' }; // 읽을 수 없는 칸은 사용자가 정한다
    if (rev === 0) return { slot, act: r > 0 ? 'offer' : 'none' };
    if (rev > r) return { slot, act: 'upload' };
    if (r > rev) return { slot, act: 'take' };
    return { slot, act: 'same' };
  });
}

/** 드라이브의 파일 이름 ↔ 칸 번호. */
export const fileOf = (slot) => `slot${slot}.json`;
export function slotOfFile(name) {
  const m = /^slot(\d)\.json$/.exec(name || '');
  return m ? Number(m[1]) : null;
}
