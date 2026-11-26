// 오류 기록 (I00-01-03). 마지막 50개를 저장소에 남긴다. 설정 창에서 볼 수 있다.

const KEY = 'ttiring.errors';
const KEEP = 50;

export function readErrors(storage) {
  try {
    const list = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 오류 하나를 기록하고, 기록한 것을 돌려준다. */
export function recordError(storage, error, where = '', now = Date.now()) {
  const entry = {
    at: now,
    where,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error && error.stack ? String(error.stack).split('\n').slice(0, 6).join('\n') : '',
  };
  const list = readErrors(storage);
  list.push(entry);
  try { storage.setItem(KEY, JSON.stringify(list.slice(-KEEP))); } catch { /* 저장소가 꽉 차도 게임은 이어진다 */ }
  return entry;
}

export function clearErrors(storage) {
  storage.removeItem(KEY);
}
