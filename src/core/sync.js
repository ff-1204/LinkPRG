// 구글 드라이브와 이 기기의 저장 칸을 맞추는 규칙 (Z44). 화면도 네트워크도 모른다.
// 되감는 저장은 없다(지키는 것 3): 칸마다 저장 횟수(rev)가 더 큰 쪽만 쓴다. 옛 판을 골라 받는 길은 없다.
// 저장 횟수는 같은 캐릭터끼리만 견준다 (Z96): 캐릭터 표(cid)가 다르면 어느 쪽도 덮지 않는다.

/** 드라이브의 것이, 이 기기에서 지웠지만 드라이브에서는 미처 못 지운 그 캐릭터인가. 표가 없는 옛 파일은 저장 횟수로 본다. */
function isGone(r, gone) {
  if (!r || !gone) return false;
  if (r.cid && gone.cid) return r.cid === gone.cid;
  return !r.cid && Number.isInteger(gone.rev) && gone.rev > 0 && (r.rev || 0) <= gone.rev;
}

/**
 * @param {Array<{slot:number, rev:number, cid?:string|null}>} local  이 기기의 칸. 비었으면 rev 0, 읽을 수 없으면 -1
 * @param {Record<number, {rev:number, cid?:string|null}>} remote     드라이브의 칸
 * @param {Record<number, {cid?:string|null, rev?:number}>} gone      이 기기에서 지웠는데 드라이브에서는 아직 못 지운 캐릭터
 * @returns {Array<{slot:number, act:'upload'|'take'|'offer'|'same'|'none'|'clash', drop?:boolean}>}
 *   upload: 이 기기가 더 나중이다. 올린다
 *   take:   드라이브가 더 나중이다. 받아서 이 기기를 덮는다
 *   offer:  이 기기는 비었고 드라이브에만 있다. "드라이브에서 받기"를 보인다
 *   same:   같다
 *   none:   둘 다 없다(또는 이 기기의 칸을 읽을 수 없어 건드리지 않는다)
 *   clash:  서로 다른 캐릭터다. 어느 쪽도 건드리지 않고 사용자가 정한다
 *   drop:   드라이브의 것은 이 기기에서 지운 캐릭터다. 먼저 드라이브에서 지운다
 */
export function syncPlan(local, remote, gone = {}) {
  return local.map(({ slot, rev, cid }) => {
    if (rev < 0) return { slot, act: 'none' }; // 읽을 수 없는 칸은 사용자가 정한다
    const drop = isGone(remote[slot], gone[slot]);
    const there = drop ? null : remote[slot];
    const r = there?.rev || 0;
    const out = (act) => (drop ? { slot, act, drop: true } : { slot, act });
    if (rev === 0) return out(r > 0 ? 'offer' : 'none');
    if (there && cid && there.cid && cid !== there.cid) return out('clash');
    if (rev > r) return out('upload');
    if (r > rev) return out('take');
    return out('same');
  });
}

/** 드라이브의 파일 이름 ↔ 칸 번호. */
export const fileOf = (slot) => `slot${slot}.json`;
export function slotOfFile(name) {
  const m = /^slot(\d)\.json$/.exec(name || '');
  return m ? Number(m[1]) : null;
}
