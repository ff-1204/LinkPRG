// 구글 로그인과 드라이브 맞추기 (Z44). 화면(app.js)이 부른다.
// 로그인은 구글의 Google Identity Services(토큰 방식). 서버도 비밀값도 없다. 클라이언트 ID는 공개해도 되는 값이다.
// 접근 토큰은 이 창의 sessionStorage에만 한 시간쯤 둔다.
// 로그인 유지 (Z91): 한 번 연결한 기기에서는 토큰이 끝나 가거나 풀렸을 때, 다음에 화면을 누르는 순간
// (지도 이동, 단추 무엇이든) 구글에 조용히 다시 받아 온다. 브라우저는 누른 순간에만 로그인 창을 허락하기 때문이다.

import { createDrive } from './drive.js?v=327d747';
import { syncPlan } from '../core/sync.js?v=327d747';
import { cidOfState } from '../core/migrate.js?v=327d747';
import { metaOf, exportText, importText, parseSave, clearSlot, SLOT_COUNT } from '../core/save.js?v=327d747';

export const CLIENT_ID = '782176240387-mi4cvftsmbefiddvd25rul2mvtf09adp.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'ttiring.cloud.token';
const WANT_KEY = 'ttiring.cloud'; // 로그인한 적이 있다(토큰은 아니다)
const LOG_KEY = 'ttiring.cloud.log'; // 이 기기에서 드라이브에 올린 기록. 최근 둘만 둔다 (보기만 한다)
const GONE_KEY = 'ttiring.cloud.gone'; // 이 기기에서 지웠는데 드라이브에서는 아직 못 지운 캐릭터: { [slot]: { cid, rev } } (Z96)
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
  let clashes = {}; // 드라이브에 다른 캐릭터가 든 칸의 요약: { slot: { name, level, when } } (Z96)
  let listed = false; // 드라이브를 한 번이라도 읽었다
  const took = new Set(); // 드라이브에서 받아 이 기기를 덮은 칸. 그 칸을 하던 화면에 알린다
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
    token = null; exp = 0; remote = {}; offers = {}; clashes = {}; listed = false;
    try { session.removeItem(TOKEN_KEY); storage.removeItem(WANT_KEY); storage.removeItem(LOG_KEY); } catch { /* 없다 */ }
    set('off');
  }

  /** 드라이브를 읽고 칸마다 맞춘다. 이 기기가 나중이면 올리고, 드라이브가 나중이면 받는다. */
  async function refresh() {
    if (!token) return;
    set('busy', '드라이브를 살피는 중');
    try {
      remote = await drive.list();
      listed = true;
      offers = {}; clashes = {};
      const local = [...Array(SLOT_COUNT).keys()].map((slot) => ({ slot, ...metaOf(storage, slot) }));
      // 표가 적히지 않은 옛 파일은 한 번 받아서 누구의 것인지 본다. 다음에 올리면 표가 적힌다
      for (const { slot, rev } of local) {
        const r = remote[slot];
        if (rev <= 0 || !r || r.cid) continue;
        try { r.cid = cidOfState(JSON.parse(await drive.download(r.id)).state || {}); } catch (e) { if (e?.status === 401) throw e; /* 읽을 수 없으면 저장 횟수로만 본다 */ }
      }
      const gone = readGone();
      for (const { slot, act, drop } of syncPlan(local, remote, gone)) {
        // 이 기기에서 지운 캐릭터가 드라이브에 남아 있었다. 이제 지운다
        if (drop) { await drive.remove(remote[slot].id); delete remote[slot]; }
        if (gone[slot]) forgetGone(slot);
        if (act === 'upload') await uploadNow(slot);
        else if (act === 'take') { importText(storage, slot, await drive.download(remote[slot].id)); took.add(slot); }
        else if (act === 'offer' || act === 'clash') {
          const raw = await drive.download(remote[slot].id);
          let sum = null;
          try { const { state } = parseSave(raw); sum = { name: state.name, level: state.level, when: `${state.day}일째` }; } catch { /* 읽을 수 없으면 이름 없이 둔다 */ }
          if (act === 'clash') clashes[slot] = sum || { name: '', level: 0, when: '' };
          else if (sum) offers[slot] = { raw, ...sum };
        }
      }
      set('on');
    } catch (e) { fail(e); }
  }

  /** 드라이브의 그 칸에 다른 캐릭터가 들었는가 (Z96). 표가 없는 옛 파일은 같은 캐릭터로 본다. */
  const otherThere = (slot, cid) => !!(remote[slot] && cid && remote[slot].cid && remote[slot].cid !== cid);

  /** @param force 드라이브의 다른 캐릭터를 덮는다. 사용자가 그러라고 했을 때만 */
  async function uploadNow(slot, force = false) {
    const { rev, cid } = metaOf(storage, slot);
    if (rev <= 0) return;
    if (otherThere(slot, cid)) { if (!force) return; } // 다른 캐릭터는 묻지 않고 덮지 않는다
    else if (rev <= (remote[slot]?.rev || 0)) return; // 드라이브가 같거나 나중이면 올리지 않는다(되감기 없음)
    const raw = exportText(storage, slot);
    const savedAt = JSON.parse(raw).savedAt || 0;
    const id = await drive.upload(slot, raw, rev, savedAt, remote[slot]?.id || null, cid);
    remote[slot] = { id, rev, savedAt, cid };
    delete clashes[slot];
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

  function readGone() {
    try { const v = JSON.parse(storage.getItem(GONE_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
  }
  function writeGone(g) {
    try { if (Object.keys(g).length) storage.setItem(GONE_KEY, JSON.stringify(g)); else storage.removeItem(GONE_KEY); } catch { /* 못 적어도 다른 캐릭터는 덮지 않는다 */ }
  }
  function forgetGone(slot) { const g = readGone(); delete g[slot]; writeGone(g); }

  return {
    /** 최근에 올린 기록 둘 (보기만 한다. 옛 판을 받는 길은 없다) */
    get log() { return readLog(); },
    get status() { return status; },
    get message() { return message; },
    get lastUp() { return lastUp; },
    wanted, keepAlive,
    signIn, signOut, refresh,
    /** 드라이브에 이 칸의 같은 캐릭터가 있다 */
    has: (slot) => !!remote[slot] && !clashes[slot],
    /** 드라이브의 이 칸에 다른 캐릭터가 있으면 그 요약 (Z96) */
    clashOf: (slot) => clashes[slot] || null,
    /** 드라이브에서 받아 이 칸을 덮었는가. 한 번 물으면 잊는다 */
    justTook: (slot) => took.delete(slot),
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
    /** @param force 드라이브에 든 다른 캐릭터를 이 기기의 것으로 덮는다 (사용자가 확인했을 때만) */
    async upNow(slot, force = false) {
      try { set('busy', '올리는 중'); await uploadNow(slot, force); set('on'); } catch (e) { fail(e); }
    },
    /**
     * 이 칸을 지운다. 드라이브의 같은 캐릭터도 지운다. 드라이브에 든 것이 다른 캐릭터면 그대로 둔다.
     * 지금 드라이브에서 지울 수 없으면(로그인이 풀림, 오류) 적어 두었다가 다음에 맞출 때 지운다.
     * 그래야 지운 캐릭터의 옛 저장이 이 칸에 새로 만든 캐릭터를 덮지 않는다 (Z96).
     */
    async erase(slot) {
      const { rev, cid } = metaOf(storage, slot);
      clearSlot(storage, slot);
      took.delete(slot);
      if (otherThere(slot, cid)) return;
      const later = () => { if (wanted() && (cid || rev > 0)) writeGone({ ...readGone(), [slot]: { cid, rev } }); };
      if (!token || !listed) return later();
      if (!remote[slot]) return;
      try { await drive.remove(remote[slot].id); delete remote[slot]; onChange(); } catch (e) { later(); fail(e); }
    },
  };
}
