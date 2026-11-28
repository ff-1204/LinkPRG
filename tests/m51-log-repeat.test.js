// 같은 글은 한 줄로 (Z118)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { rollDice } from '../src/data/origins.js';
import { pushLine } from '../src/core/log.js';

const fresh = () => createGame({ name: '줄', origin: 'hunter', rolled: rollDice('log'), seed: 'log' });

test('바로 앞 줄과 같은 글이면 새 줄 없이 횟수만 는다', () => {
  const s = fresh();
  const n = s.log.length;
  const ev = [];
  pushLine(s, ev, { k: 'room', text: '노 젓기를 지켜보았다.' });
  pushLine(s, ev, { k: 'room', text: '노 젓기를 지켜보았다.' });
  pushLine(s, ev, { k: 'room', text: '노 젓기를 지켜보았다.' });
  assert.equal(s.log.length, n + 1);
  assert.equal(s.log[s.log.length - 1].rep, 3);
  assert.deepEqual(ev.map((e) => !!e.again), [false, true, true]);
  // 누가 말했는지가 다르거나 글이 다르면 새 줄이다
  pushLine(s, ev, { k: 'npc', who: '늙은 뱃사공', text: '어디서 왔나.' });
  pushLine(s, ev, { k: 'npc', who: '늙은 뱃사공', text: '어디서 왔나.' });
  pushLine(s, ev, { k: 'npc', who: '교관', text: '어디서 왔나.' });
  assert.equal(s.log.length, n + 3);
  assert.equal(s.log[s.log.length - 2].rep, 2);
  // 띠링과 다음 행동은 늘 새 줄
  pushLine(s, ev, { k: 'ding', level: 1, text: '띠링!' });
  pushLine(s, ev, { k: 'ding', level: 1, text: '띠링!' });
  assert.equal(s.log.length, n + 5);
});
