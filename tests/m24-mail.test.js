// 우편함 (Z59): 캐릭터마다 한 번, 받기는 한 번, 다시 태어나도 다시 오지 않는다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { rebirthCarry } from '../src/core/rebirth.js';
import { parseSave } from '../src/core/save.js';
import { SAVE_VERSION } from '../src/core/migrate.js';
import { unreadMail, mailView } from '../src/core/mail.js';

const make = (seed = 'ml', carry) => createGame({ name: '편', origin: 'bard', rolled: rollDice('same'), seed, carry });

test('새 캐릭터에게 첫 편지가 한 통 온다', () => {
  const s = make();
  assert.equal(s.mail.got.length, 1);
  assert.equal(unreadMail(s), 1);
  const v = mailView(s)[0];
  assert.equal(v.from, '모험가 조합');
  assert.equal(v.gift, '은화 1000');
  assert.ok(s.log.some((l) => l.text === '우편함에 편지가 왔다.'));
});

test('읽기만으로는 돈이 들어오지 않고, 받기는 한 번뿐이다', () => {
  const s = make();
  const before = s.silver;
  dispatch(s, { type: 'mail', op: 'read', id: 'welcome' });
  assert.equal(s.silver, before);
  assert.equal(unreadMail(s), 1, '붙은 것을 받기 전에는 안 읽은 것으로 센다');
  const ev = dispatch(s, { type: 'mail', op: 'take', id: 'welcome' });
  assert.equal(s.silver, before + 1000);
  assert.ok(ev.some((e) => e.type === 'mail'));
  assert.equal(unreadMail(s), 0);
  assert.throws(() => dispatch(s, { type: 'mail', op: 'take', id: 'welcome' }), /이미 받았습니다/);
  assert.equal(s.silver, before + 1000);
});

test('이미 하던 캐릭터도 불러오면 한 번 받고, 다시 불러와도 또 오지 않는다', () => {
  const s = make('old');
  delete s.mail;
  const up = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 1, savedAt: 1, state: s })).state;
  assert.equal(up.mail.got.length, 1);
  dispatch(up, { type: 'mail', op: 'take', id: 'welcome' });
  const again = parseSave(JSON.stringify({ v: SAVE_VERSION, rev: 2, savedAt: 2, state: up })).state;
  assert.equal(again.mail.got.length, 1);
  assert.equal(again.mail.got[0].taken, true);
});

test('다시 태어난 삶에는 같은 편지가 다시 오지 않는다', () => {
  const s = make('rb');
  dispatch(s, { type: 'mail', op: 'take', id: 'welcome' });
  const n = make('rb2', rebirthCarry(s));
  assert.equal(n.mail.got.length, 1);
  assert.equal(n.mail.got[0].taken, true);
  assert.equal(unreadMail(n), 0);
  // 받지 않고 다시 태어났으면 그 편지는 그대로 남아 받을 수 있다 (한 번은 한 번)
  const u = make('rb3');
  const m = make('rb4', rebirthCarry(u));
  assert.equal(m.mail.got[0].taken, false);
  const before = m.silver;
  dispatch(m, { type: 'mail', op: 'take', id: 'welcome' });
  assert.equal(m.silver, before + 1000);
});
