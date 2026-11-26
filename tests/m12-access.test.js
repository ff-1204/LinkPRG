// M12: 누르기 돕기, 글자·대비, 화면읽기용 이름. 화면이 없어도 되는 것만 여기서 본다(화면은 미리보기에서 확인).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { createAssist, assistable, ASSIST_MS, ASSIST_PAUSE } from '../src/core/assist.js';
import { createGame, dispatch, slotsNow } from '../src/core/game.js';
import { DEFAULTS, SETTING_GROUPS } from '../src/ui/settings.js';
import { HELP } from '../src/ui/help.js';
import { pendingEvolves } from '../src/core/evolve.js';

test('누르기 돕기 "끔": 한 번 누르면 한 번. 시계가 가도 더 누르지 않는다', () => {
  const a = createAssist('off');
  assert.deepEqual(a.down(0, 'act:strike', 0), { fire: true, ask: false });
  for (let t = 0; t < 5000; t += 100) assert.equal(a.tick(t, { what: 'act:strike' }).fire, false);
});

test('"누르고 있기": 누르고 있는 동안 1초에 한 번. 떼면 멈춘다 (H2-5, H2-6)', () => {
  const a = createAssist('hold');
  let fires = a.down(0, 'act:fish', 0).fire ? 1 : 0;
  for (let t = 100; t <= 10000; t += 100) if (a.tick(t, { what: 'act:fish' }).fire) fires++;
  assert.equal(fires, 11, '10초에 열한 번(처음 한 번 + 1초마다)');
  a.up(0);
  assert.equal(a.running, false);
  for (let t = 10100; t <= 15000; t += 100) assert.equal(a.tick(t, { what: 'act:fish' }).fire, false);
  // 손으로는 1초에 두세 번 누를 수 있다. 돕기는 그보다 느리다
  assert.ok(ASSIST_MS >= 1000);
});

test('"한 번 눌러 이어 하기": 묻지 않고 계속 누른다(Z57). 다시 누르면 멈춘다 (H2-8)', () => {
  const a = createAssist('toggle');
  let fires = a.down(1, 'act:mine', 0).fire ? 1 : 0;
  let asked = false;
  for (let t = 1000; t <= 60000; t += 1000) { const r = a.tick(t, { what: 'act:mine' }); if (r.fire) fires++; if (r.ask) asked = true; }
  assert.equal(fires, 61, '1초에 한 번, 쉬지 않고');
  assert.equal(asked, false, '스무 번마다 묻지 않는다');
  assert.equal(a.tick(62000, { what: 'act:mine', dinged: true }).fire, false, '띠링 창이 뜨면 멈춘다');
  assert.equal(a.running, false);
  // 돌던 중에 다시 누르면 멈춘다
  const b = createAssist('toggle');
  b.down(0, 'act:strike', 0);
  assert.equal(b.down(0, 'act:strike', 500).fire, false);
  assert.equal(b.running, false);
});

test('띠링 창이 뜨거나, 창이 열리거나, 그 칸의 행동이 바뀌면 돕기는 멈춘다 (H2-8)', () => {
  for (const why of [{ dinged: true }, { blocked: true }, { what: 'battle:attack' }]) {
    const a = createAssist('toggle');
    a.down(0, 'act:explore', 0);
    assert.equal(a.tick(1000, { what: 'act:explore', ...why }).fire, false);
    assert.equal(a.running, false, JSON.stringify(why));
  }
  assert.equal(assistable({ label: '치기', action: { type: 'act', id: 'strike' } }), true);
  assert.equal(assistable({ label: '가방', open: 'bag' }), false);
  assert.equal(assistable({ label: '그만둔다', action: { type: 'craftQuit' }, confirm: '…' }), false);
  assert.equal(assistable({ label: '스킬', action: {}, disabled: true }), false);
  assert.throws(() => createAssist('fast'), /모르는/);
});

test('돕기로 눌러도 규칙은 똑같이 인정한다. 켰다는 표시는 저장 어디에도 남지 않는다 (H2-7)', () => {
  // 덕수 3단계: 낚시터에서 "누르고 있기"로 던지고 또 던진다. 1초에 한 번. 낚시가 중급이 되면 갈래를 고른다
  const s = createGame({ name: '덕수', origin: 'farmer', spent: {}, seed: 'deoksu-3' });
  s.place = 'river';
  const a = createAssist('hold');
  const slot = () => slotsNow(s).findIndex((x) => x.label === '낚시');
  const what = () => { const x = slotsNow(s)[slot()]; return x ? `${x.action.type}:${x.action.id}` : ''; };
  let now = 0, presses = 0, dinged = false;
  const press = () => { const ev = dispatch(s, slotsNow(s)[slot()].action); presses++; s.full = 80; dinged = ev.some((e) => e.type === 'evolve'); if (s.battle) { s.battle = null; s.status = []; } s.choice = null; };
  if (a.down(slot(), what(), now).fire) press();
  let guard = 0;
  while (!pendingEvolves(s).includes('fishing') && guard++ < 20000) {
    now += 1000;
    if (!a.running) a.down(slot(), what(), now).fire && press(); // 띠링에 멈췄으면 다시 누르고 있는다
    else if (a.tick(now, { what: what(), dinged }).fire) press();
  }
  assert.ok(pendingEvolves(s).includes('fishing'), '낚시가 중급이 되어 갈림길이 왔다');
  assert.equal(s.counters.act.fish, presses, '돕기가 누른 것도 한 번은 한 번이다');
  assert.ok(now / 1000 >= presses - 1, '1초에 한 번보다 빠르지 않았다');
  dispatch(s, { type: 'evolve', skill: 'fishing', branch: 'patient' });
  assert.ok(!/assist|돕기/.test(JSON.stringify(s)), '저장되는 상태에 돕기의 흔적이 없다');
  assert.equal(DEFAULTS.assist, 'off');
  assert.ok(SETTING_GROUPS.some((g) => g.rows.some((r) => r.key === 'assist' && r.options.length === 3)));
  assert.ok(HELP.find((h) => h.id === 'press').body.some((p) => p.includes('누르기 돕기')));
});

test('글자색과 바탕색의 대비가 충분하다. 고대비에서는 더 높다 (M12-3)', () => {
  const css = fs.readFileSync(new URL('../src/ui/style.css', import.meta.url), 'utf8');
  const vars = (block) => Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
  const base = vars(css.match(/:root\s*\{([^}]*)\}/)[1]);
  const high = { ...base, ...vars(css.match(/html\.contrast\s*\{([^}]*)\}/)[1]) };
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [['ink', 'cream'], ['ink', 'paper'], ['ink', 'sand'], ['muted', 'cream'], ['muted', 'sand'], ['cinnamon', 'paper'], ['cinnamon', 'cream'], ['mint-ink', 'mint'], ['ink', 'honey']];
  for (const [fg, bg] of pairs) {
    assert.ok(ratio(base[fg], base[bg]) >= 4.5, `${fg} / ${bg}: ${ratio(base[fg], base[bg]).toFixed(2)}`);
    assert.ok(ratio(high[fg], high[bg]) >= 7, `고대비 ${fg} / ${bg}: ${ratio(high[fg], high[bg]).toFixed(2)}`);
  }
  assert.ok(ratio('#FFFFFF', base.cinnamon) >= 4.5, '갈색 단추 위의 흰 글씨');
  // 글자 크기 셋, 움직임 줄이기
  assert.ok(/html\.fs-2\s*\{\s*font-size:\s*18px/.test(css) && /html\.fs-3\s*\{\s*font-size:\s*21px/.test(css));
  assert.ok(/html\.calm \*\s*\{[^}]*animation:\s*none/.test(css));
  assert.ok(/prefers-reduced-motion/.test(css));
});

test('휴대폰 화면의 틀이 있다: 좁은 화면에서 방 목록은 서랍, 책은 아래에서 올라온다 (N8)', () => {
  const css = fs.readFileSync(new URL('../src/ui/style.css', import.meta.url), 'utf8');
  const m = css.match(/@media \(max-width:\s*(\d+)px\)\s*\{/);
  assert.ok(m && Number(m[1]) >= 700, '좁은 화면 규칙');
  for (const cls of ['.mbar', '.game.nav-open .nav', '.game.book-open .book']) assert.ok(css.includes(cls), cls);
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/<html[^>]*lang="ko"/.test(html));
  assert.ok(/name="viewport"/.test(html));
});

test('키보드만으로 한다: 숫자 키가 단축 칸을 누르고, 꾹 눌러도 한 번, 창이 뜨면 칸은 눌리지 않는다 (M12-2)', async () => {
  const { createPressGuard, keyDecision } = await import('../src/core/press.js');
  const s = createGame({ name: '하람', origin: 'smithboy', spent: {}, seed: 'haram-keys' });
  dispatch(s, { type: 'move', to: 'training' });
  const guard = createPressGuard();
  const key = (code, extra = {}) => keyDecision(guard, { code, key: code.slice(-1), repeat: false, onButton: false, onInput: false, windowOpen: false, modifier: false, inGame: true, ...extra });
  const strike = slotsNow(s).findIndex((x) => x.label === '치기');
  assert.ok(strike >= 0);
  let presses = 0;
  for (let n = 0; n < 10; n++) {
    const d = key(`Digit${strike + 1}`);
    if (d.slot >= 0) { dispatch(s, slotsNow(s)[d.slot].action); presses++; }
    for (let r = 0; r < 30; r++) assert.equal(key(`Digit${strike + 1}`, { repeat: true }).slot, -1, '꾹 눌러도 더 눌리지 않는다');
    guard.up(`Digit${strike + 1}`);
  }
  assert.equal(presses, 10);
  assert.equal(s.counters.act.strike, 10);
  assert.equal(key('Digit1', { windowOpen: true }).slot, -1, '창이 떠 있으면 뒤의 칸은 눌리지 않는다');
  guard.up('Digit1');
  assert.equal(key('Digit1', { onInput: true }).slot, -1, '글을 쓰는 중에는 눌리지 않는다');
});

// ── M9~M12 검토에서 나온 것 ──
test('검토: 옛 저장으로 2장을 끝낸 사람도 나루로 가는 길이 난다. 갈대밭·고갯길은 그 길이 나야 열린다', async () => {
  const { parseSave } = await import('../src/core/save.js');
  const { SAVE_VERSION } = await import('../src/core/migrate.js');
  const s = createGame({ name: '옛', origin: 'farmer', spent: {}, seed: 'old-ch2' });
  assert.throws(() => dispatch(s, { type: 'travel', to: 'reeds' }), /길을 모릅니다/);
  assert.throws(() => dispatch(s, { type: 'travel', to: 'pass' }), /길을 모릅니다/);
  const old = JSON.parse(JSON.stringify(s));
  old.main.chapter = 3; old.main.done = [{ chapter: 1, path: 'x', day: 2 }, { chapter: 2, path: 'x', day: 9 }]; old.opened = ['ruins'];
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: old })).state;
  assert.ok(up.opened.includes('dock'));
  dispatch(up, { type: 'travel', to: 'reeds' });
  assert.equal(up.place, 'reeds');
});

test('검토: 다른 게시판에서 끝내려 하면 물건이 그대로 남는다', async () => {
  const { addItem, countOf } = await import('../src/core/inventory.js');
  const { JOBS } = await import('../src/data/quests.js');
  const id = Object.keys(JOBS).find((k) => JOBS[k].kind === 'bring' && JOBS[k].at && JOBS[k].at !== 'plaza');
  assert.ok(id, '다른 게시판의 가져오기 의뢰가 있다');
  const s = createGame({ name: '판', origin: 'farmer', spent: {}, seed: 'board' });
  s.jobs.push({ id, have: 0, due: s.day + 3 });
  addItem(s, JOBS[id].item, JOBS[id].n);
  const before = countOf(s, JOBS[id].item);
  assert.throws(() => dispatch(s, { type: 'job', op: 'finish', id }), /받은 게시판/);
  assert.equal(countOf(s, JOBS[id].item), before);
});
