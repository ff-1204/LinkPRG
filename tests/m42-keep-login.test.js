// 로그인 유지 (Z91): 한 번 연결한 기기는 누르는 순간 조용히 토큰을 다시 받는다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, RENEW_BEFORE, RENEW_GAP } from '../src/ui/cloud.js';

const mem = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; };

function fakeGoogle() {
  const asks = [];
  let cb = null;
  globalThis.google = { accounts: { oauth2: {
    initTokenClient: (o) => { cb = o.callback; return { requestAccessToken: (p) => asks.push(p) }; },
    revoke() {},
  } } };
  return { asks, answer: (r) => cb(r) };
}

test('연결한 적 있는 기기에서 토큰이 없으면 풀림으로 두고, 누르면 조용히(prompt 없이) 다시 받는다', async () => {
  const g = fakeGoogle();
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ files: [] }), text: async () => '' });
  const storage = mem({ 'ttiring.cloud': '1' });
  const session = mem();
  const cloud = createCloud({ storage, session, onChange() {} });
  assert.equal(cloud.status, 'expired');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(cloud.keepAlive(), true);
  assert.deepEqual(g.asks, [{ prompt: '' }]);
  assert.equal(cloud.keepAlive(), false, '대답을 기다리는 동안은 또 묻지 않는다');
  g.answer({ access_token: 'T', expires_in: 3600 });
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(['on', 'busy'].includes(cloud.status));
  assert.ok(JSON.parse(session.getItem('ttiring.cloud.token')).token === 'T');
  assert.equal(cloud.keepAlive(), false, '넉넉히 남으면 묻지 않는다');
  assert.ok(RENEW_BEFORE > 0 && RENEW_GAP > 0);
});

test('연결한 적 없는 기기는 묻지 않는다', async () => {
  const g = fakeGoogle();
  const cloud = createCloud({ storage: mem(), session: mem(), onChange() {} });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(cloud.status, 'off');
  assert.equal(cloud.keepAlive(), false);
  assert.equal(g.asks.length, 0);
});
