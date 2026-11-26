// 구글 로그인과 드라이브 맞추기 (Z44). 화면(app.js)이 부른다.
// 로그인은 구글의 Google Identity Services(토큰 방식). 서버도 비밀값도 없다. 클라이언트 ID는 공개해도 되는 값이다.
// 접근 토큰은 이 창의 sessionStorage에만 한 시간쯤 둔다. 지나면 "다시 연결"을 눌러야 한다.

import { createDrive } from './drive.js?v=6b46da7';
import { syncPlan } from '../core/sync.js?v=6b46da7';
import { revOf, exportText, importText, parseSave, SLOT_COUNT } from '../core/save.js?v=6b46da7';

export const CLIENT_ID = '782176240387-mi4cvftsmbefiddvd25rul2mvtf09adp.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'ttiring.cloud.token';
const WANT_KEY = 'ttiring.cloud'; // 로그인한 적이 있다(토큰은 아니다)

let gisPromise = null;
function loadGis() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { gisPromise = null; reject(new Error('구글 로그인을 불러오지 못했습니다')); };
      document.head.append(s);
    });
  }
  return gisPromise;
}

/**
 * @param {{storage: Storage, session: Storage, onChange: () => void}} opts
 */
export function createCloud({ storage, session, onChange }) {
  let token = null, exp = 0;
  try { const t = JSON.parse(session.getItem(TOKEN_KEY) || 'null'); if (t && t.exp > Date.now()) { token = t.token; exp = t.exp; } } catch { /* 없다 */ }
  let remote = {}; // 드라이브의 칸
  let offers = {}; // 드라이브에만 있는 칸의 요약: { slot: { raw, name, level, when } }
  let status = token ? 'on' : 'off'; // off, on, busy, expired, error
  let message = '';
  let lastUp = 0;
  const timers = {};
  const drive = createDrive((...a) => fetch(...a), () => (token && exp > Date.now() ? token : null));
  const wanted = () => { try { return storage.getItem(WANT_KEY) === '1'; } catch { return false; } };
  const set = (s, m = '') => { status = s; message = m; onChange(); };
  const fail = (e) => { if (e?.status === 401) { token = null; set('expired', '로그인이 풀렸다. 다시 연결하면 이어서 올린다.'); } else set('error', e?.message || String(e)); };

  async function signIn() {
    await loadGis();
    await new Promise((resolve, reject) => {
      const client = globalThis.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE,
        callback: (r) => {
          if (r.error) return reject(new Error(r.error === 'access_denied' ? '허락하지 않아 연결하지 않았습니다' : `로그인 실패: ${r.error}`));
          token = r.access_token; exp = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
          try { session.setItem(TOKEN_KEY, JSON.stringify({ token, exp })); storage.setItem(WANT_KEY, '1'); } catch { /* 저장 못 해도 이 창에서는 된다 */ }
          resolve();
        },
        error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? '로그인 창을 닫았습니다' : '로그인 창을 열지 못했습니다')),
      });
      client.requestAccessToken({ prompt: wanted() ? '' : 'consent' });
    });
    set('on');
    return refresh();
  }

  function signOut() {
    if (token && globalThis.google?.accounts?.oauth2) globalThis.google.accounts.oauth2.revoke(token, () => {});
    token = null; exp = 0; remote = {}; offers = {};
    try { session.removeItem(TOKEN_KEY); storage.removeItem(WANT_KEY); } catch { /* 없다 */ }
    set('off');
  }

  /** 드라이브를 읽고 칸마다 맞춘다. 이 기기가 나중이면 올리고, 드라이브가 나중이면 받는다. */
  async function refresh() {
    if (!token) return;
    set('busy', '드라이브를 살피는 중');
    try {
      remote = await drive.list();
      offers = {};
      const local = [...Array(SLOT_COUNT).keys()].map((slot) => ({ slot, rev: revOf(storage, slot) }));
      for (const { slot, act } of syncPlan(local, remote)) {
        if (act === 'upload') await uploadNow(slot);
        else if (act === 'take') importText(storage, slot, await drive.download(remote[slot].id));
        else if (act === 'offer') {
          const raw = await drive.download(remote[slot].id);
          try { const { state } = parseSave(raw); offers[slot] = { raw, name: state.name, level: state.level, when: `${state.day}일째` }; } catch { /* 읽을 수 없으면 보이지 않는다 */ }
        }
      }
      set('on');
    } catch (e) { fail(e); }
  }

  async function uploadNow(slot) {
    const rev = revOf(storage, slot);
    if (rev <= 0 || rev <= (remote[slot]?.rev || 0)) return; // 드라이브가 같거나 나중이면 올리지 않는다(되감기 없음)
    const raw = exportText(storage, slot);
    const savedAt = JSON.parse(raw).savedAt || 0;
    const id = await drive.upload(slot, raw, rev, savedAt, remote[slot]?.id || null);
    remote[slot] = { id, rev, savedAt };
    lastUp = Date.now();
  }

  return {
    get status() { return status; },
    get message() { return message; },
    get lastUp() { return lastUp; },
    wanted,
    signIn, signOut, refresh,
    has: (slot) => !!remote[slot],
    offerOf: (slot) => offers[slot] || null,
    /** 드라이브에만 있던 칸을 이 기기로 받는다. */
    take(slot) {
      const o = offers[slot];
      if (!o) throw new Error('드라이브에 없습니다');
      importText(storage, slot, o.raw);
      delete offers[slot];
      onChange();
    },
    /** 저절로 저장한 뒤 부른다. 몇 초 모아서 올린다. */
    queue(slot) {
      if (!token || status === 'expired') return;
      clearTimeout(timers[slot]);
      timers[slot] = setTimeout(async () => {
        try { await uploadNow(slot); if (status !== 'on') set('on'); else onChange(); } catch (e) { fail(e); }
      }, 3000);
    },
    async upNow(slot) {
      try { set('busy', '올리는 중'); await uploadNow(slot); set('on'); } catch (e) { fail(e); }
    },
    /** 이 칸을 지웠다. 드라이브에서도 지운다(로그인했을 때만). */
    async removed(slot) {
      if (!token || !remote[slot]) return;
      try { await drive.remove(remote[slot].id); delete remote[slot]; onChange(); } catch (e) { fail(e); }
    },
  };
}
