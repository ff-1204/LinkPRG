// 두 기기에서 갈림 (Z121): 마지막으로 맞춘 판과 견주어, 둘 다 이어 했으면 덮지 않고 고르게 한다
import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPlan } from '../src/core/sync.js';
import { createGame } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { saveTo, parseSave } from '../src/core/save.js';

function fakeDrive() {
  const files = {};
  let next = 1;
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    calls.push({ url, init });
    assert.equal(init.headers.Authorization, 'Bearer TOKEN');
    const u = new URL(url);
    const json = (x) => ({ ok: true, status: 200, json: async () => x, text: async () => JSON.stringify(x) });
    if (u.pathname === '/drive/v3/files' && !init.method) {
      assert.equal(u.searchParams.get('spaces'), 'appDataFolder', '숨은 폴더만 본다');
      return json({ files: Object.values(files).map((f) => ({ id: f.id, name: f.name, appProperties: f.appProperties })) });
    }
    if (u.pathname.startsWith('/upload/drive/v3/files')) {
      const parts = init.body.split('--linkprg-part');
      const meta = JSON.parse(parts[1].split('\r\n\r\n')[1]);
      const text = parts[2].split('\r\n\r\n')[1].replace(/\r\n$/, '');
      const id = u.pathname.split('/')[5] || `f${next++}`;
      if (init.method === 'POST') assert.deepEqual(meta.parents, ['appDataFolder']);
      files[id] = { id, name: meta.name || files[id].name, appProperties: meta.appProperties, text };
      return json({ id });
    }
    const id = u.pathname.split('/')[4];
    if (init.method === 'DELETE') { delete files[id]; return json({}); }
    if (u.searchParams.get('alt') === 'media') return { ok: true, status: 200, text: async () => files[id].text };
    return { ok: false, status: 404 };
  };
  return { files, calls, fetchFn };
}

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const base = createGame({ name: '하나', origin: 'hunter', rolled: rollDice('split'), seed: 'split', cid: 'c1' });
/** 그 기기에서 이 칸을 그날까지 이어 했다(저장 횟수는 하나 는다) */
const save = (storage, _rev, day) => { const raw = storage.getItem('ttiring.save.0'); const st = raw ? parseSave(raw).state : JSON.parse(JSON.stringify(base)); st.day = day; saveTo(storage, 0, st, day * 1000); };
const device = async (createCloud) => { const storage = mem(), session = mem(); session.setItem('ttiring.cloud.token', JSON.stringify({ token: 'TOKEN', exp: Date.now() + 3600e3 })); return { storage, cloud: createCloud({ storage, session, onChange() {} }) }; };

test('맞춘 뒤 한쪽만 바뀌면 받거나 올리고, 둘 다 바뀌면 갈림이다', () => {
  const plan = (rev, r, b) => syncPlan([{ slot: 0, rev, cid: 'c1' }], { 0: { rev: r, cid: 'c1' } }, {}, { 0: b })[0].act;
  assert.equal(plan(12, 8, 8), 'upload');
  assert.equal(plan(8, 10, 8), 'take', '이 기기에서 한 것이 없으면 다른 기기 것을 받는다(이 기기가 더 적어도)');
  assert.equal(plan(12, 10, 8), 'split', '둘 다 이어 했다');
  assert.equal(plan(9, 20, 8), 'split', '저장 횟수가 큰 쪽이 이기지 않는다');
  assert.equal(syncPlan([{ slot: 0, rev: 12, cid: 'c1' }], { 0: { rev: 10, cid: 'c1' } })[0].act, 'upload', '맞춘 적이 없는 기기는 전처럼 저장 횟수로 본다');
});

test('다른 기기가 올린 뒤에는 덮지 않고, 고르면 그쪽으로 맞춘다', async () => {
  const { createCloud } = await import('../src/ui/cloud.js');
  const f = fakeDrive();
  const old = globalThis.fetch; globalThis.fetch = f.fetchFn;
  try {
    const a = await device(createCloud), b = await device(createCloud);
    save(a.storage, 0, 5); await a.cloud.upNow(0);
    await b.cloud.refresh(); b.cloud.take(0); // 기기 B가 받는다: 둘 다 같은 판에서 맞췄다
    save(a.storage, 0, 9); save(a.storage, 0, 9); await a.cloud.upNow(0); // A가 이어 하고 올린다
    save(b.storage, 0, 7); await b.cloud.upNow(0); // B도 따로 이어 했다: 올리지 않고 갈림
    const text = () => JSON.parse(Object.values(f.files)[0].text);
    assert.equal(text().state.day, 9, 'B가 A의 것을 덮지 않았다');
    const sp = b.cloud.splitOf(0);
    assert.deepEqual([sp.mine.day, sp.theirs.day], [7, 9]);
    // 드라이브 것을 받는다
    await b.cloud.resolve(0, 'theirs');
    assert.equal(parseSave(b.storage.getItem('ttiring.save.0')).state.day, 9);
    assert.equal(b.cloud.splitOf(0), null);
    // 이제 B가 이어 하면 올라간다
    save(b.storage, 0, 10); await b.cloud.upNow(0);
    assert.equal(text().state.day, 10);
    // A가 그 사이 또 이어 했으면 A에서 갈림. 이번에는 이 기기 것을 올린다
    save(a.storage, 0, 11); await a.cloud.upNow(0);
    assert.ok(a.cloud.splitOf(0));
    await a.cloud.resolve(0, 'mine');
    assert.equal(text().state.day, 11);
    assert.equal(a.cloud.splitOf(0), null);
  } finally { globalThis.fetch = old; }
});
