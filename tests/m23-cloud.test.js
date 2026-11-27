// 구글 드라이브와 맞추기 (Z44): 되감는 길이 없는지, 드라이브 요청이 바른지
import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPlan, fileOf, slotOfFile } from '../src/core/sync.js';
import { createDrive, DriveError } from '../src/ui/drive.js';

test('칸마다 저장 횟수가 큰 쪽만 쓴다. 작은 쪽으로 되돌리는 길은 없다', () => {
  const plan = syncPlan([{ slot: 0, rev: 10 }, { slot: 1, rev: 3 }, { slot: 2, rev: 0 }], { 0: { rev: 7 }, 1: { rev: 9 }, 2: { rev: 4 } });
  assert.deepEqual(plan.map((p) => p.act), ['upload', 'take', 'offer']);
  assert.deepEqual(syncPlan([{ slot: 0, rev: 5 }], { 0: { rev: 5 } }).map((p) => p.act), ['same']);
  assert.deepEqual(syncPlan([{ slot: 0, rev: 5 }], {}).map((p) => p.act), ['upload']);
  assert.deepEqual(syncPlan([{ slot: 0, rev: 0 }], {}).map((p) => p.act), ['none']);
  assert.deepEqual(syncPlan([{ slot: 0, rev: -1 }], { 0: { rev: 9 } }).map((p) => p.act), ['none'], '읽을 수 없는 칸은 건드리지 않는다');
  assert.equal(slotOfFile(fileOf(2)), 2);
  assert.equal(slotOfFile('other.txt'), null);
});

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

test('드라이브: 숨은 폴더에 올리고, 덮고, 받고, 지운다', async () => {
  const f = fakeDrive();
  const d = createDrive(f.fetchFn, () => 'TOKEN');
  const id = await d.upload(1, '{"rev":3}', 3, 111);
  let list = await d.list();
  assert.deepEqual(list[1], { id, rev: 3, savedAt: 111, cid: null });
  await d.upload(1, '{"rev":4}', 4, 222, id);
  list = await d.list();
  assert.equal(list[1].rev, 4);
  assert.equal(Object.keys(f.files).length, 1, '덮었다. 옛 판은 남지 않는다');
  assert.equal(await d.download(id), '{"rev":4}');
  await d.remove(id);
  assert.deepEqual(await d.list(), {});
});

test('드라이브: 로그인이 없거나 풀리면 알려 준다', async () => {
  const none = createDrive(async () => ({ ok: true }), () => null);
  await assert.rejects(() => none.list(), (e) => e instanceof DriveError && e.status === 401);
  const expired = createDrive(async () => ({ ok: false, status: 401 }), () => 'TOKEN');
  await assert.rejects(() => expired.list(), /로그인이 풀렸습니다/);
});

test('올린 기록은 최근 셋만, 같은 칸을 잇달아 올리면 10분 동안 한 줄로 고친다 (Z58, Z114)', async () => {
  const { createCloud, LOG_GAP } = await import('../src/ui/cloud.js');
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const storage = mem(), session = mem();
  session.setItem('ttiring.cloud.token', JSON.stringify({ token: 'TOKEN', exp: Date.now() + 3600e3 }));
  const save = (slot, name, day, rev) => storage.setItem(`ttiring.save.${slot}`, JSON.stringify({ v: 1, rev, savedAt: 1, state: { name, level: 3, day } }));
  const f = fakeDrive();
  const old = globalThis.fetch; globalThis.fetch = f.fetchFn;
  try {
    const cloud = createCloud({ storage, session, onChange() {} });
    const days = () => cloud.log.map((x) => x.day);
    const later = (ms) => { const log = JSON.parse(storage.getItem('ttiring.cloud.log')).map((x) => ({ ...x, at: x.at - ms, since: x.since - ms })); storage.setItem('ttiring.cloud.log', JSON.stringify(log)); };
    // 잇달아 올리면 한 줄이다
    save(0, '하나', 2, 1); await cloud.upNow(0);
    save(0, '하나', 3, 2); await cloud.upNow(0);
    assert.deepEqual(days(), [3]);
    // 10분이 지난 뒤의 올리기는 새 줄이다. 같은 캐릭터의 지난 올리기가 따로 남는다
    later(LOG_GAP + 1);
    save(0, '하나', 4, 3); await cloud.upNow(0);
    assert.deepEqual(days(), [4, 3]);
    // 줄을 시작한 때부터 잰다: 쉬지 않고 올려도 10분마다 새 줄이 난다
    later(LOG_GAP - 1000);
    save(0, '하나', 5, 4); await cloud.upNow(0);
    assert.deepEqual(days(), [5, 3]);
    later(2000);
    save(0, '하나', 6, 5); await cloud.upNow(0);
    assert.deepEqual(days(), [6, 5, 3]);
    // 최근 셋만. 다른 칸은 늘 새 줄이다
    save(1, '둘', 9, 1); await cloud.upNow(1);
    assert.deepEqual(cloud.log.map((x) => [x.slot, x.day]), [[1, 9], [0, 6], [0, 5]]);
  } finally { globalThis.fetch = old; }
});
