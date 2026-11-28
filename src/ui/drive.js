// 구글 드라이브의 앱 전용 숨은 폴더(appDataFolder)에 저장 칸을 올리고 받는다 (Z44).
// fetch와 접근 토큰을 받아 쓰므로 테스트에서는 가짜 fetch를 넣는다. 사용자의 다른 파일은 보지 못한다.

import { fileOf, slotOfFile } from '../core/sync.js?v=333e2f8';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const BOUNDARY = 'linkprg-part';

export class DriveError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'DriveError';
    this.status = status;
  }
}

export function createDrive(fetchFn, getToken) {
  async function call(url, init = {}) {
    const token = getToken();
    if (!token) throw new DriveError(401, '로그인이 필요합니다');
    const res = await fetchFn(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new DriveError(res.status, res.status === 401 ? '로그인이 풀렸습니다' : `드라이브 오류 (${res.status})`);
    return res;
  }
  const body = (meta, text) => [
    `--${BOUNDARY}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify(meta),
    `--${BOUNDARY}`, 'Content-Type: application/json; charset=UTF-8', '', text, `--${BOUNDARY}--`, '',
  ].join('\r\n');

  return {
    /** 드라이브에 있는 칸: { [slot]: { id, rev, savedAt, cid } }. cid는 캐릭터 표(Z96), 옛 파일에는 없다(null) */
    async list() {
      const q = new URLSearchParams({ spaces: 'appDataFolder', fields: 'files(id,name,appProperties)', pageSize: '20' });
      const data = await (await call(`${API}?${q}`)).json();
      const out = {};
      for (const f of data.files || []) {
        const slot = slotOfFile(f.name);
        if (slot === null) continue;
        out[slot] = { id: f.id, rev: Number(f.appProperties?.rev) || 0, savedAt: Number(f.appProperties?.savedAt) || 0, cid: f.appProperties?.cid || null };
      }
      return out;
    },
    /** 칸 하나의 저장 글을 올린다. 있으면 덮고, 없으면 만든다. */
    async upload(slot, raw, rev, savedAt, id = null, cid = null) {
      const appProperties = { rev: String(rev), savedAt: String(savedAt || 0), ...(cid ? { cid: String(cid) } : {}) };
      const meta = id ? { appProperties } : { name: fileOf(slot), parents: ['appDataFolder'], appProperties };
      const res = await call(`${UPLOAD}${id ? `/${id}` : ''}?uploadType=multipart&fields=id`, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${BOUNDARY}` },
        body: body(meta, raw),
      });
      return (await res.json()).id;
    },
    async download(id) {
      return (await call(`${API}/${id}?alt=media`)).text();
    },
    async remove(id) {
      await call(`${API}/${id}`, { method: 'DELETE' });
    },
  };
}
