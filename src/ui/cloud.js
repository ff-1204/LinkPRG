// 구글 로그인과 드라이브 맞추기 (Z44). 화면(app.js)이 부른다.
// 로그인은 구글의 Google Identity Services(토큰 방식). 서버도 비밀값도 없다. 클라이언트 ID는 공개해도 되는 값이다.
// 접근 토큰은 이 창의 sessionStorage에만 한 시간쯤 둔다.
// 로그인 유지 (Z91): 한 번 연결한 기기에서는 토큰이 끝나 가거나 풀렸을 때, 다음에 화면을 누르는 순간
// (지도 이동, 단추 무엇이든) 구글에 조용히 다시 받아 온다. 브라우저는 누른 순간에만 로그인 창을 허락하기 때문이다.

import { createDrive } from './drive.js?v=6d96d3a';
import { syncPlan } from '../core/sync.js?v=6d96d3a';
import { revOf, exportText, importText, parseSave, SLOT_COUNT } from '../core/save.js?v=6d96d3a';

export const CLIENT_ID = '782176240387-mi4cvftsmbefiddvd25rul2mvtf09adp.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'ttiring.cloud.token';
const WANT_KEY = 'ttiring.cloud'; // 로그인한 적이 있다(토큰은 아니다)
const LOG_KEY = 'ttiring.cloud.log'; // 이 기기에서 드라이브에 올린 기록. 최근 둘만 둔다 (보기만 한다)
export const LOG_KEEP = 2;
export const RENEW_BEFORE = 10 * 60 * 1000; // 끝나기 10분 전부터 다시 받는다
export const RENEW_GAP = 2 * 60 * 1000; // 조용히 다시 받기는 2분에 한 번까지만 해 본다

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
  let quiet = null; // 조용히 다시 받는 데 쓰는 구글 토큰 클라이언트
  let renewing = false, lastTry = 0;
  let lastUp = 0;
  const timers = {};
  const drive = createDrive((...a) => fetch(...a), () => (token && exp > Date.now() ? token : null));
  const wanted = () => { try { return storage.getItem(WANT_KEY) === '1'; } catch { return false; } };
  // 한 번 연결했던 기기인데 토큰이 없으면(새 창, 한 시간 지남) 풀린 것으로 두고 구글 스크립트를 미리 불러 둔다
  if (!token && wanted()) { status = 'expired'; message = '로그인이 잠시 풀렸다. 화면을 누르면 조용히 다시 잇는다.'; loadGis().then(() => readyQuiet()).catch(() => {}); }
  else if (token) loadGis().then(() => readyQuiet()).catch(() => {});
  function keep(r) {
    token = r.access_token; exp = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
    try { session.setItem(TOKEN_KEY, JSON.stringify({ token, exp })); storage.setItem(WANT_KEY, '1'); } catch { /* 저장 못 해도 이 창에서는 된다 */ }
  }
  function readyQuiet() {
    if (quiet || !globalThis.google?.accounts?.oauth2) return;
    quiet = globalThis.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE,
      callback: (r) => {
        renewing = false;
        if (r.error) return; // 조용히 안 되면 그대로 둔다. "다시 연결"은 늘 있다
        const was = status;
        keep(r);
        if (was === 'expired' || was === 'off') { set('on'); refresh(); } else onChange();
      },
      error_callback: () => { renewing = false; },
    });
  }
  /** 누를 때마다 부른다 (Z91): 끝나 가거나 풀렸으면 조용히 다시 받는다. 누른 그 순간이어야 브라우저가 막지 않는다. */
  function keepAlive() {
    if (!wanted() || renewing) return false;
    if (token && exp - Date.now() > RENEW_BEFORE) return false;
    if (Date.now() - lastTry < RENEW_GAP) return false;
    if (!quiet) { loadGis().then(() => readyQuiet()).catch(() => {}); return false; }
    lastTry = Date.now();
    renewing = true;
    try { quiet.requestAccessToken({ prompt: '' }); } catch { renewing = false; return false; }
    return true;
  }
  const set = (s, m = '') => { status = s; message = m; onChange(); };
  const fail = (e) => { if (e?.status === 401) { token = null; set('expired', '로그인이 풀렸다. 화면을 누르면 조용히 다시 잇는다. 안 되면 "다시 연결".'); } else set('error', e?.message || String(e)); };

  async function signIn() {
    await loadGis();
    await new Promise((resolve, reject) => {
      const client = globalThis.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE,
        callback: (r) => {
          if (r.error) return reject(new Error(r.error === 'access_denied' ? '허락하지 않아 연결하지 않았습니다' : `로그인 실패: ${r.error}`));
          keep(r);
          readyQuiet();
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
    try { session.removeItem(TOKEN_KEY); storage.removeItem(WANT_KEY); storage.removeItem(LOG_KEY); } catch { /* 없다 */ }
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
    // 올린 기록 (최근 둘): 언제, 어느 칸, 누구, 며칠째. 같은 칸을 잇달아 올리면 한 줄로 고친다
    try {
      const st = JSON.parse(raw).state || {};
      const entry = { at: lastUp, slot, name: st.name || '', level: st.level || 1, day: st.day || 1 };
      const log = readLog().filter((x) => x.slot !== slot);
      storage.setItem(LOG_KEY, JSON.stringify([entry, ...log].slice(0, LOG_KEEP)));
    } catch { /* 기록을 못 남겨도 올리기는 됐다 */ }
  }

  function readLog() {
    try { const v = JSON.parse(storage.getItem(LOG_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  }

  return {
    /** 최근에 올린 기록 둘 (보기만 한다. 옛 판을 받는 길은 없다) */
    get log() { return readLog(); },
    get status() { return status; },
    get message() { return message; },
    get lastUp() { return lastUp; },
    wanted, keepAlive,
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
