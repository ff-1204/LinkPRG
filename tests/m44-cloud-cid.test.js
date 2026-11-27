// 캐릭터 표 (Z96): 드라이브와 맞출 때 저장 횟수는 같은 캐릭터끼리만 견준다. 다른 캐릭터는 묻지 않고 덮지 않는다
import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPlan } from '../src/core/sync.js';
import { createGame } from '../src/core/game.js';
import { saveTo, loadFrom, parseSave, metaOf, revOf } from '../src/core/save.js';
import { SAVE_VERSION, cidOfState } from '../src/core/migrate.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { rollDice } from '../src/data/origins.js';
import { createCloud } from '../src/ui/cloud.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const hero = (name, cid) => createGame({ name, origin: 'hunter', rolled: rollDice(name), seed: name, cid });

/** 가짜 드라이브. 기기 여럿이 같은 files를 본다 */
function fakeDrive() {
  const files = {};
  let next = 1;
  const fetchFn = async (url, init = {}) => {
    const u = new URL(url);
    const json = (x) => ({ ok: true, status: 200, json: async () => x, text: async () => JSON.stringify(x) });
    if (u.pathname === '/drive/v3/files' && !init.method) return json({ files: Object.values(files).map((f) => ({ id: f.id, name: f.name, appProperties: f.appProperties })) });
    if (u.pathname.startsWith('/upload/drive/v3/files')) {
      const parts = init.body.split('--linkprg-part');
      const meta = JSON.parse(parts[1].split('\r\n\r\n')[1]);
      const text = parts[2].split('\r\n\r\n')[1].replace(/\r\n$/, '');
      const id = u.pathname.split('/')[5] || `f${next++}`;
      files[id] = { id, name: meta.name || files[id].name, appProperties: meta.appProperties, text };
      return json({ id });
    }
    const id = u.pathname.split('/')[4];
    if (init.method === 'DELETE') { delete files[id]; return json({}); }
    if (u.searchParams.get('alt') === 'media') return { ok: true, status: 200, text: async () => files[id].text };
    return { ok: false, status: 404 };
  };
  return { files, fetchFn };
}

/** 기기 하나: 저장소와, 로그인했으면 토큰 */
function device(signedIn = true) {
  const storage = mem(), session = mem();
  storage.setItem('ttiring.cloud', '1');
  if (signedIn) session.setItem('ttiring.cloud.token', JSON.stringify({ token: 'TOKEN', exp: Date.now() + 3600e3 }));
  return { storage, session, cloud: () => createCloud({ storage, session, onChange() {} }) };
}
const signIn = (d) => d.session.setItem('ttiring.cloud.token', JSON.stringify({ token: 'TOKEN', exp: Date.now() + 3600e3 }));
const nameIn = (storage, slot) => loadFrom(storage, slot)?.name ?? null;
const withDrive = async (run) => {
  const f = fakeDrive();
  const old = globalThis.fetch; globalThis.fetch = f.fetchFn;
  try { await run(f); } finally { globalThis.fetch = old; }
};

test('맞추기 규칙: 표가 다르면 어느 쪽도 덮지 않는다. 지운 캐릭터는 드라이브에서도 지운다', () => {
  const act = (local, remote, gone) => syncPlan([{ slot: 0, ...local }], remote ? { 0: remote } : {}, gone ? { 0: gone } : {})[0];
  assert.deepEqual(act({ rev: 1, cid: 'new' }, { rev: 50, cid: 'old' }), { slot: 0, act: 'clash' }, '저장 횟수가 커도 다른 캐릭터는 받지 않는다');
  assert.deepEqual(act({ rev: 50, cid: 'new' }, { rev: 1, cid: 'old' }), { slot: 0, act: 'clash' }, '다른 캐릭터를 올려 덮지도 않는다');
  assert.equal(act({ rev: 3, cid: 'a' }, { rev: 9, cid: 'a' }).act, 'take', '같은 캐릭터는 전처럼 큰 쪽');
  assert.equal(act({ rev: 3, cid: 'a' }, { rev: 9 }).act, 'take', '표가 없는 옛 파일은 저장 횟수로 본다');
  assert.deepEqual(act({ rev: 1, cid: 'new' }, { rev: 50, cid: 'old' }, { cid: 'old', rev: 50 }), { slot: 0, act: 'upload', drop: true });
  assert.deepEqual(act({ rev: 0 }, { rev: 50, cid: 'old' }, { cid: 'old', rev: 50 }), { slot: 0, act: 'none', drop: true }, '지운 것을 다시 받으라고 내밀지 않는다');
  assert.deepEqual(act({ rev: 1, cid: 'new' }, { rev: 50 }, { cid: 'old', rev: 50 }), { slot: 0, act: 'upload', drop: true }, '표 없는 옛 파일은 지운 때의 저장 횟수 이하면 그 캐릭터다');
  assert.equal(act({ rev: 0 }, { rev: 60, cid: 'other' }, { cid: 'old', rev: 50 }).act, 'offer', '지운 캐릭터가 아니면 지우지 않는다');
  assert.equal(act({ rev: 0 }, { rev: 60, cid: 'other' }, { cid: 'old', rev: 50 }).drop, undefined);
});

test('새 캐릭터는 넘겨받은 표를 쓰고, 다시 태어난 삶은 지난 삶의 표를 잇는다', () => {
  const a = hero('가람', 'cid-a');
  assert.equal(a.cid, 'cid-a');
  const next = createGame({ name: '가람', origin: 'farmer', rolled: rollDice('n'), seed: 'n', carry: rebirthCarry(a), cid: 'cid-new' });
  assert.equal(next.cid, 'cid-a', '같은 캐릭터의 다음 삶');
  assert.equal(hero('나래').cid, hero('나래').cid, '표를 안 넘기면 씨앗으로 낸다(다시 돌려도 같다)');
  assert.match(hero('나래').cid, /^[0-9a-f]{16}$/);
});

test('옛 저장(11판)은 읽을 때 표가 생긴다. 어느 기기에서 읽어도 같은 표다', () => {
  const old = JSON.parse(JSON.stringify(hero('다솜')));
  delete old.cid; old.v = 11;
  const raw = JSON.stringify({ v: 11, rev: 4, savedAt: 1, state: old });
  const up = parseSave(raw);
  assert.equal(up.v, SAVE_VERSION);
  assert.equal(up.state.v, SAVE_VERSION);
  assert.equal(up.state.cid, cidOfState(old));
  assert.equal(parseSave(raw).state.cid, up.state.cid);
  const st = mem(); st.setItem('ttiring.save.0', raw);
  assert.deepEqual(metaOf(st, 0), { rev: 4, cid: up.state.cid }, '저장소의 옛 저장도 같은 표로 읽힌다');
  // 지금 판보다 새 저장은 읽지 않는다: 옛 판 화면이 새 꼴의 저장을 고쳐 쓰지 못하게
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION + 1, rev: 1, savedAt: 1, state: { ...old, v: SAVE_VERSION + 1 } })), /새것/);
  const bad = JSON.parse(JSON.stringify(hero('다솜'))); bad.cid = '';
  assert.throws(() => parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: bad })), /캐릭터 표/);
});

test('로그인이 풀린 채 지우고 새로 만든 캐릭터는, 드라이브에 남은 옛 캐릭터에 덮이지 않는다', () => withDrive(async (f) => {
  const d = device();
  let rev = 0;
  for (let i = 0; i < 5; i++) rev = saveTo(d.storage, 0, hero('옛사람', 'cid-old'), 1, rev || null);
  await d.cloud().refresh();
  assert.equal(Object.values(f.files)[0].appProperties.cid, 'cid-old', '올릴 때 표를 적는다');
  // 새 창: 토큰이 없다(풀림). 그 사이 지우고 새로 만든다
  d.session.removeItem('ttiring.cloud.token');
  const off = d.cloud();
  await off.erase(0);
  assert.equal(revOf(d.storage, 0), 0);
  assert.equal(Object.keys(f.files).length, 1, '풀려 있어 드라이브의 것은 아직 못 지웠다');
  saveTo(d.storage, 0, hero('새사람', 'cid-new'));
  // 다시 이어졌다
  signIn(d);
  const on = d.cloud();
  await on.refresh();
  assert.equal(nameIn(d.storage, 0), '새사람', '새 캐릭터가 그대로다');
  const left = Object.values(f.files);
  assert.equal(left.length, 1);
  assert.equal(left[0].appProperties.cid, 'cid-new', '드라이브에는 새 캐릭터가 올라갔다');
  assert.equal(JSON.parse(left[0].text).state.name, '새사람');
  assert.equal(d.storage.getItem('ttiring.cloud.gone'), null, '적어 둔 것은 지웠다');
  assert.equal(on.has(0), true);
}));

test('두 기기의 같은 칸에 다른 캐릭터가 있으면 둘 다 그대로 두고, 확인한 뒤에만 덮는다', () => withDrive(async (f) => {
  const a = device(), b = device();
  let rev = 0;
  for (let i = 0; i < 9; i++) rev = saveTo(a.storage, 0, hero('하나', 'cid-1'), 1, rev || null);
  await a.cloud().refresh();
  saveTo(b.storage, 0, hero('두리', 'cid-2'));
  const cb = b.cloud();
  await cb.refresh();
  assert.equal(nameIn(b.storage, 0), '두리', '저장 횟수가 작아도 덮이지 않는다');
  assert.equal(JSON.parse(Object.values(f.files)[0].text).state.name, '하나', '드라이브의 것도 그대로다');
  assert.equal(cb.clashOf(0).name, '하나');
  assert.equal(cb.has(0), false, '"드라이브에도 있음"으로 보이지 않는다');
  // 저절로 올리기와 "지금 올리기"는 덮지 않는다
  for (let i = 0; i < 12; i++) saveTo(b.storage, 0, hero('두리', 'cid-2'));
  await cb.upNow(0);
  assert.equal(JSON.parse(Object.values(f.files)[0].text).state.name, '하나');
  // 이 기기의 캐릭터를 지워도 드라이브의 다른 캐릭터는 지우지 않는다
  const c = device();
  saveTo(c.storage, 0, hero('세찬', 'cid-3'));
  const cc = c.cloud();
  await cc.refresh();
  await cc.erase(0);
  assert.equal(Object.keys(f.files).length, 1);
  await cc.refresh();
  assert.equal(cc.offerOf(0).name, '하나', '빈 칸이 되면 받을지 묻는다');
  // 확인하고 올리면 덮는다
  await cb.upNow(0, true);
  assert.equal(JSON.parse(Object.values(f.files)[0].text).state.name, '두리');
  assert.equal(cb.clashOf(0), null);
  assert.equal(cb.has(0), true);
}));

test('표가 적히지 않은 옛 드라이브 파일도 누구의 것인지 보고 맞춘다', () => withDrive(async (f) => {
  // 옛 판이 올린 파일: appProperties에 cid가 없다
  const old = JSON.parse(JSON.stringify(hero('옛사람'))); delete old.cid; old.v = 11;
  f.files.f9 = { id: 'f9', name: 'slot0.json', appProperties: { rev: '40', savedAt: '1' }, text: JSON.stringify({ v: 11, rev: 40, savedAt: 1, state: old }) };
  const d = device();
  saveTo(d.storage, 0, hero('새사람', 'cid-new'));
  const cloud = d.cloud();
  await cloud.refresh();
  assert.equal(nameIn(d.storage, 0), '새사람', '다른 캐릭터의 옛 파일에 덮이지 않는다');
  assert.equal(cloud.clashOf(0).name, '옛사람');
  // 같은 캐릭터의 옛 파일이면 전처럼 더 나중 것을 받는다
  const e = device();
  e.storage.setItem('ttiring.save.0', JSON.stringify({ v: 11, rev: 7, savedAt: 1, state: old }));
  const ce = e.cloud();
  await ce.refresh();
  assert.equal(revOf(e.storage, 0), 40);
  assert.equal(ce.justTook(0), true, '받아서 덮었다고 알린다');
  assert.equal(ce.justTook(0), false);
}));
